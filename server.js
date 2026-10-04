const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

const OWNER_EMAIL =
  (process.env.OWNER_EMAIL || "").trim().toLowerCase();

const BASE_URL =
  process.env.BASE_URL || `http://localhost:${PORT}`;

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID;

const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET;

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "CHANGE_THIS_SECRET";

/* =========================
   DIRECTORIES
========================= */

const ROOT = __dirname;

const UPLOAD_DIR =
  path.join(ROOT, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, {
    recursive: true
  });
}

/* =========================
   DATABASE
========================= */

const db = new sqlite3.Database(
  path.join(ROOT, "database.db")
);

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      filename TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agenda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      className TEXT,
      founder TEXT,
      instagram TEXT
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO settings
    (id, className, founder, instagram)
    VALUES
    (1, 'X MP 2', 'NAZUAN AHMAD', '@kelas_xmp2')
  `);

  if (OWNER_EMAIL) {

    db.run(
      `
      INSERT OR IGNORE INTO admins
      (email, name, role)
      VALUES (?, ?, ?)
      `,
      [
        OWNER_EMAIL,
        "NAZUAN AHMAD",
        "owner"
      ]
    );

  }

});

/* =========================
   MIDDLEWARE
========================= */

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  "/uploads",
  express.static(UPLOAD_DIR)
);

app.use(
  express.static(ROOT)
);

/* =========================
   PASSPORT
========================= */

passport.serializeUser(
  (user, done) => {
    done(null, user);
  }
);

passport.deserializeUser(
  (user, done) => {
    done(null, user);
  }
);

if (
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_SECRET
) {

  passport.use(
    new GoogleStrategy(
      {
        clientID:
          GOOGLE_CLIENT_ID,

        clientSecret:
          GOOGLE_CLIENT_SECRET,

        callbackURL:
          `${BASE_URL}/auth/google/callback`
      },

      async (
        accessToken,
        refreshToken,
        profile,
        done
      ) => {

        try {

          const email =
            (
              profile.emails?.[0]?.value ||
              ""
            )
            .trim()
            .toLowerCase();

          if (!email) {
            return done(null, false);
          }

          db.get(
            `
            SELECT *
            FROM admins
            WHERE LOWER(email) = ?
            `,
            [email],

            (error, admin) => {

              if (error) {
                return done(error);
              }

              if (!admin) {

                return done(
                  null,
                  false
                );

              }

              done(
                null,
                {
                  id: profile.id,
                  email,
                  name:
                    profile.displayName ||
                    admin.name ||
                    email,

                  role: admin.role
                }
              );

            }
          );

        } catch (error) {

          done(error);

        }

      }
    )
  );

}

/* =========================
   AUTH MIDDLEWARE
========================= */

function requireLogin(
  req,
  res,
  next
) {

  if (!req.user) {

    return res.status(401).json({
      error:
        "Login admin diperlukan."
    });

  }

  next();

}

function requireOwner(
  req,
  res,
  next
) {

  if (!req.user) {

    return res.status(401).json({
      error:
        "Login admin diperlukan."
    });

  }

  if (
    req.user.role !== "owner" &&
    req.user.email !== OWNER_EMAIL
  ) {

    return res.status(403).json({
      error:
        "Fitur ini hanya untuk owner."
    });

  }

  next();

}

/* =========================
   GOOGLE LOGIN
========================= */

app.get(
  "/auth/google",
  (req, res, next) => {

    if (
      !GOOGLE_CLIENT_ID ||
      !GOOGLE_CLIENT_SECRET
    ) {

      return res.status(500).send(
        "Google OAuth belum dikonfigurasi di file .env."
      );

    }

    passport.authenticate(
      "google",
      {
        scope: [
          "profile",
          "email"
        ]
      }
    )(req, res, next);

  }
);

app.get(
  "/auth/google/callback",

  passport.authenticate(
    "google",
    {
      failureRedirect:
        "/?login=failed"
    }
  ),

  (req, res) => {

    res.redirect(
      "/?login=success"
    );

  }
);

/* =========================
   LOGOUT
========================= */

app.post(
  "/api/auth/logout",
  (req, res) => {

    req.logout(() => {

      req.session.destroy(() => {

        res.json({
          success: true
        });

      });

    });

  }
);

/* =========================
   CURRENT USER
========================= */

app.get(
  "/api/auth/me",
  requireLogin,
  (req, res) => {

    res.json(req.user);

  }
);

/* =========================
   UPLOAD CONFIG
========================= */

const storage =
  multer.diskStorage({

    destination:
      (req, file, callback) => {

        callback(
          null,
          UPLOAD_DIR
        );

      },

    filename:
      (req, file, callback) => {

        const ext =
          path.extname(
            file.originalname
          )
          .toLowerCase();

        const name =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}${ext}`;

        callback(
          null,
          name
        );

      }

  });

const upload =
  multer({

    storage,

    limits: {
      fileSize:
        10 * 1024 * 1024
    },

    fileFilter:
      (req, file, callback) => {

        if (
          file.mimetype.startsWith(
            "image/"
          )
        ) {

          callback(
            null,
            true
          );

        } else {

          callback(
            new Error(
              "File harus berupa gambar."
            )
          );

        }

      }

  });

app.post(
  "/api/uploads",
  requireLogin,
  upload.single("photo"),

  (req, res) => {

    if (!req.file) {

      return res.status(400).json({
        error:
          "Foto belum dipilih."
      });

    }

    res.json({

      success: true,

      url:
        `/uploads/${req.file.filename}`,

      filename:
        req.file.filename

    });

  }
);

/* =========================
   SETTINGS
========================= */

app.get(
  "/api/settings",
  (req, res) => {

    db.get(
      `
      SELECT
        className,
        founder,
        instagram
      FROM settings
      WHERE id = 1
      `,

      (error, row) => {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal mengambil pengaturan."
          });

        }

        res.json(row);

      }
    );

  }
);

app.put(
  "/api/settings",
  requireLogin,

  (req, res) => {

    const {
      className,
      founder,
      instagram
    } = req.body;

    db.run(
      `
      UPDATE settings
      SET
        className = ?,
        founder = ?,
        instagram = ?
      WHERE id = 1
      `,

      [
        className,
        founder,
        instagram
      ],

      error => {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal menyimpan pengaturan."
          });

        }

        res.json({
          success: true
        });

      }
    );

  }
);

/* =========================
   STUDENTS
========================= */

app.get(
  "/api/students",
  (req, res) => {

    db.all(
      `
      SELECT *
      FROM students
      ORDER BY id DESC
      `,

      (error, rows) => {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal mengambil siswa."
          });

        }

        res.json(
          rows.map(row => ({
            ...row,

            photo:
              row.photo
                ? row.photo
                : ""
          }))
        );

      }
    );

  }
);

app.post(
  "/api/students",
  requireLogin,

  (req, res) => {

    const {
      name,
      position,
      photo
    } = req.body;

    if (!name) {

      return res.status(400).json({
        error:
          "Nama siswa wajib diisi."
      });

    }

    db.run(
      `
      INSERT INTO students
      (name, position, photo)
      VALUES (?, ?, ?)
      `,

      [
        name,
        position || "",
        photo || ""
      ],

      function(error) {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal menambahkan siswa."
          });

        }

        res.json({
          success: true,
          id: this.lastID
        });

      }
    );

  }
);

app.put(
  "/api/students/:id",
  requireLogin,

  (req, res) => {

    const {
      name,
      position,
      photo
    } = req.body;

    db.run(
      `
      UPDATE students
      SET
        name = ?,
        position = ?,
        photo = ?
      WHERE id = ?
      `,

      [
        name,
        position || "",
        photo || "",
        req.params.id
      ],

      error => {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal mengubah siswa."
          });

        }

        res.json({
          success: true
        });

      }
    );

  }
);

app.delete(
  "/api/students/:id",
  requireLogin,

  (req, res) => {

    db.run(
      `
      DELETE FROM students
      WHERE id = ?
      `,

      [req.params.id],

      error => {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal menghapus siswa."
          });

        }

        res.json({
          success: true
        });

      }
    );

  }
);

/* =========================
   GALLERY
========================= */

app.get(
  "/api/gallery",
  (req, res) => {

    db.all(
      `
      SELECT *
      FROM gallery
      ORDER BY id DESC
      `,

      (error, rows) => {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal mengambil galeri."
          });

        }

        res.json(rows);

      }
    );

  }
);

app.post(
  "/api/gallery",
  requireLogin,

  (req, res) => {

    const {
      name,
      url,
      filename
    } = req.body;

    if (!name || !url) {

      return res.status(400).json({
        error:
          "Nama dan foto wajib diisi."
      });

    }

    db.run(
      `
      INSERT INTO gallery
      (name, url, filename)
      VALUES (?, ?, ?)
      `,

      [
        name,
        url,
        filename || ""
      ],

      function(error) {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal menambahkan galeri."
          });

        }

        res.json({
          success: true,
          id: this.lastID
        });

      }
    );

  }
);

app.delete(
  "/api/gallery/:id",
  requireLogin,

  (req, res) => {

    db.get(
      `
      SELECT filename
      FROM gallery
      WHERE id = ?
      `,

      [req.params.id],

      (error, row) => {

        if (
          row &&
          row.filename
        ) {

          const file =
            path.join(
              UPLOAD_DIR,
              row.filename
            );

          if (
            fs.existsSync(file)
          ) {

            fs.unlinkSync(file);

          }

        }

        db.run(
          `
          DELETE FROM gallery
          WHERE id = ?
          `,

          [req.params.id],

          () => {

            res.json({
              success: true
            });

          }
        );

      }
    );

  }
);

/* =========================
   ANNOUNCEMENTS
========================= */

app.get(
  "/api/announcements",
  (req, res) => {

    db.all(
      `
      SELECT *
      FROM announcements
      ORDER BY id DESC
      `,

      (error, rows) => {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal mengambil pengumuman."
          });

        }

        res.json(rows);

      }
    );

  }
);

app.post(
  "/api/announcements",
  requireLogin,

  (req, res) => {

    const {
      title,
      content
    } = req.body;

    db.run(
      `
      INSERT INTO announcements
      (title, content)
      VALUES (?, ?)
      `,

      [
        title,
        content
      ],

      function(error) {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal membuat pengumuman."
          });

        }

        res.json({
          success: true,
          id: this.lastID
        });

      }
    );

  }
);

app.delete(
  "/api/announcements/:id",
  requireLogin,

  (req, res) => {

    db.run(
      `
      DELETE FROM announcements
      WHERE id = ?
      `,

      [req.params.id],

      () => {

        res.json({
          success: true
        });

      }
    );

  }
);

/* =========================
   AGENDA
========================= */

app.get(
  "/api/agenda",
  (req, res) => {

    db.all(
      `
      SELECT *
      FROM agenda
      ORDER BY date ASC
      `,

      (error, rows) => {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal mengambil agenda."
          });

        }

        res.json(rows);

      }
    );

  }
);

app.post(
  "/api/agenda",
  requireLogin,

  (req, res) => {

    const {
      title,
      date,
      description
    } = req.body;

    db.run(
      `
      INSERT INTO agenda
      (title, date, description)
      VALUES (?, ?, ?)
      `,

      [
        title,
        date,
        description || ""
      ],

      function(error) {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal membuat agenda."
          });

        }

        res.json({
          success: true,
          id: this.lastID
        });

      }
    );

  }
);

app.delete(
  "/api/agenda/:id",
  requireLogin,

  (req, res) => {

    db.run(
      `
      DELETE FROM agenda
      WHERE id = ?
      `,

      [req.params.id],

      () => {

        res.json({
          success: true
        });

      }
    );

  }
);

/* =========================
   ADMIN
========================= */

app.get(
  "/api/admins",
  requireOwner,

  (req, res) => {

    db.all(
      `
      SELECT
        id,
        email,
        name,
        role,
        created_at
      FROM admins
      ORDER BY id DESC
      `,

      (error, rows) => {

        if (error) {

          return res.status(500).json({
            error:
              "Gagal mengambil admin."
          });

        }

        res.json(rows);

      }
    );

  }
);

app.post(
  "/api/admins",
  requireOwner,

  (req, res) => {

    const email =
      String(req.body.email || "")
        .trim()
        .toLowerCase();

    const role =
      ["admin", "editor"]
        .includes(req.body.role)
        ? req.body.role
        : "admin";

    if (!email) {

      return res.status(400).json({
        error:
          "Gmail wajib diisi."
      });

    }

    db.run(
      `
      INSERT INTO admins
      (email, role)
      VALUES (?, ?)
      `,

      [
        email,
        role
      ],

      function(error) {

        if (error) {

          return res.status(409).json({
            error:
              "Gmail tersebut sudah terdaftar."
          });

        }

        res.json({
          success: true,
          id: this.lastID
        });

      }
    );

  }
);

app.delete(
  "/api/admins/:id",
  requireOwner,

  (req, res) => {

    db.get(
      `
      SELECT role
      FROM admins
      WHERE id = ?
      `,

      [req.params.id],

      (error, admin) => {

        if (
          admin &&
          admin.role === "owner"
        ) {

          return res.status(400).json({
            error:
              "Owner tidak dapat dihapus."
          });

        }

        db.run(
          `
          DELETE FROM admins
          WHERE id = ?
          `,

          [req.params.id],

          () => {

            res.json({
              success: true
            });

          }
        );

      }
    );

  }
);

/* =========================
   HEALTH CHECK
========================= */

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      success: true,
      project: "X MP 2",
      status: "online"
    });

  }
);

/* =========================
   ERROR HANDLER
========================= */

app.use(
  (error, req, res, next) => {

    console.error(error);

    res.status(500).json({
      error:
        error.message ||
        "Server error."
    });

  }
);

/* =========================
   START
========================= */

app.listen(
  PORT,
  () => {

    console.log("");
    console.log("==============================");
    console.log("       X MP 2 WEBSITE");
    console.log("==============================");
    console.log(
      `Website : ${BASE_URL}`
    );
    console.log(
      `Database: ${path.join(ROOT, "database.db")}`
    );
    console.log(
      `Uploads : ${UPLOAD_DIR}`
    );
    console.log("==============================");
    console.log("");

  }
);
