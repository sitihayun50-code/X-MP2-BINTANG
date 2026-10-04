"use strict";

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

/* =========================
   CONFIG
========================= */

const app = express();

const PORT = Number(process.env.PORT || 3000);

const BASE_URL = (
  process.env.BASE_URL ||
  `http://localhost:${PORT}`
).replace(/\/$/, "");

const OWNER_EMAIL = String(
  process.env.OWNER_EMAIL || ""
).trim().toLowerCase();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "CHANGE_THIS_SESSION_SECRET";

/* =========================
   PATH
========================= */

const ROOT_DIR = __dirname;

const UPLOAD_DIR = path.join(
  ROOT_DIR,
  "uploads"
);

const DATABASE_FILE = path.join(
  ROOT_DIR,
  "database.db"
);

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, {
    recursive: true
  });
}

/* =========================
   EXPRESS
========================= */

app.use(express.json({
  limit: "2mb"
}));

app.use(express.urlencoded({
  extended: true
}));

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
  express.static(ROOT_DIR)
);

app.use(
  "/uploads",
  express.static(UPLOAD_DIR)
);

/* =========================
   DATABASE
========================= */

const db = new sqlite3.Database(
  DATABASE_FILE,
  (error) => {
    if (error) {
      console.error("Database error:", error);
      process.exit(1);
    }

    console.log("SQLite database connected.");
  }
);

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        id: this.lastID,
        changes: this.changes
      });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function initializeDatabase() {

  await dbRun(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      info TEXT DEFAULT '',
      photo TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS agenda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      event_date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      class_name TEXT NOT NULL,
      founder TEXT NOT NULL,
      instagram TEXT DEFAULT ''
    )
  `);

  const settings = await dbGet(
    `SELECT id FROM settings WHERE id = 1`
  );

  if (!settings) {

    await dbRun(`
      INSERT INTO settings
      (id, class_name, founder, instagram)
      VALUES
      (1, ?, ?, ?)
    `, [
      "X MP 2",
      "NAZUAN AHMAD",
      "@kelas_xmp2"
    ]);
  }

  if (OWNER_EMAIL) {

    await dbRun(`
      INSERT OR IGNORE INTO admins
      (email, role)
      VALUES (?, 'owner')
    `, [
      OWNER_EMAIL
    ]);

    await dbRun(`
      UPDATE admins
      SET role = 'owner'
      WHERE lower(email) = lower(?)
    `, [
      OWNER_EMAIL
    ]);
  }

  console.log("Database initialized.");
}

/* =========================
   PASSPORT
========================= */

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

if (
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_SECRET
) {

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/auth/google/callback`
      },

      async (
        accessToken,
        refreshToken,
        profile,
        done
      ) => {

        try {

          const email =
            profile.emails?.[0]?.value
              ?.trim()
              .toLowerCase();

          if (!email) {
            return done(
              null,
              false,
              {
                message: "Google tidak memberikan email."
              }
            );
          }

          const admin = await dbGet(
            `
            SELECT id, email, role
            FROM admins
            WHERE lower(email) = lower(?)
            `,
            [email]
          );

          if (!admin) {
            return done(
              null,
              false,
              {
                message:
                  "Akun Google belum terdaftar sebagai admin."
              }
            );
          }

          return done(
            null,
            {
              id: admin.id,
              email: admin.email,
              role: admin.role,
              name:
                profile.displayName ||
                email
            }
          );

        } catch (error) {
          return done(error);
        }
      }
    )
  );

} else {

  console.warn(
    "Google OAuth belum dikonfigurasi."
  );
}

/* =========================
   AUTH MIDDLEWARE
========================= */

function requireLogin(req, res, next) {

  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "Anda harus login terlebih dahulu."
    });
  }

  next();
}

function requireOwner(req, res, next) {

  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "Anda harus login."
    });
  }

  if (req.user.role !== "owner") {
    return res.status(403).json({
      error: "Akses hanya untuk owner."
    });
  }

  next();
}

/* =========================
   AUTH ROUTES
========================= */

app.get(
  "/auth/google",

  (req, res, next) => {

    if (
      !GOOGLE_CLIENT_ID ||
      !GOOGLE_CLIENT_SECRET
    ) {

      return res.status(500).send(`
        <h1>Google Login Belum Siap</h1>
        <p>Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env.</p>
      `);
    }

    next();
  },

  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

app.get(
  "/auth/google/callback",

  passport.authenticate(
    "google",
    {
      failureRedirect: "/?login=failed"
    }
  ),

  (req, res) => {
    res.redirect("/#admin");
  }
);

app.get(
  "/api/auth/me",
  (req, res) => {

    if (!req.isAuthenticated()) {
      return res.json({
        loggedIn: false
      });
    }

    res.json({
      loggedIn: true,
      user: req.user
    });
  }
);

app.post(
  "/api/auth/logout",
  (req, res, next) => {

    req.logout((error) => {

      if (error) {
        return next(error);
      }

      req.session.destroy(() => {

        res.clearCookie("connect.sid");

        res.json({
          success: true
        });
      });
    });
  }
);

/* =========================
   SETTINGS
========================= */

app.get(
  "/api/settings",
  async (req, res) => {

    try {

      const settings = await dbGet(
        `SELECT * FROM settings WHERE id = 1`
      );

      res.json(
        settings || {
          class_name: "X MP 2",
          founder: "NAZUAN AHMAD",
          instagram: ""
        }
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal mengambil pengaturan."
      });
    }
  }
);

app.put(
  "/api/settings",
  requireLogin,
  async (req, res) => {

    try {

      const className =
        String(req.body.class_name || "").trim();

      const founder =
        String(req.body.founder || "").trim();

      const instagram =
        String(req.body.instagram || "").trim();

      if (!className || !founder) {
        return res.status(400).json({
          error: "Nama kelas dan founder wajib diisi."
        });
      }

      await dbRun(
        `
        UPDATE settings
        SET class_name = ?,
            founder = ?,
            instagram = ?
        WHERE id = 1
        `,
        [
          className,
          founder,
          instagram
        ]
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal menyimpan pengaturan."
      });
    }
  }
);

/* =========================
   STUDENTS
========================= */

app.get(
  "/api/students",
  async (req, res) => {

    try {

      const students = await dbAll(
        `
        SELECT *
        FROM students
        ORDER BY name COLLATE NOCASE ASC
        `
      );

      res.json(students);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal mengambil siswa."
      });
    }
  }
);

app.post(
  "/api/students",
  requireLogin,
  async (req, res) => {

    try {

      const name =
        String(req.body.name || "").trim();

      const info =
        String(req.body.info || "").trim();

      const photo =
        String(req.body.photo || "").trim();

      if (!name) {
        return res.status(400).json({
          error: "Nama siswa wajib diisi."
        });
      }

      const result = await dbRun(
        `
        INSERT INTO students
        (name, info, photo)
        VALUES (?, ?, ?)
        `,
        [
          name,
          info,
          photo
        ]
      );

      res.status(201).json({
        success: true,
        id: result.id
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal menambahkan siswa."
      });
    }
  }
);

app.delete(
  "/api/students/:id",
  requireLogin,
  async (req, res) => {

    try {

      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          error: "ID tidak valid."
        });
      }

      await dbRun(
        `DELETE FROM students WHERE id = ?`,
        [id]
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal menghapus siswa."
      });
    }
  }
);

/* =========================
   MULTER
========================= */

const storage = multer.diskStorage({

  destination: (
    req,
    file,
    callback
  ) => {
    callback(null, UPLOAD_DIR);
  },

  filename: (
    req,
    file,
    callback
  ) => {

    const extension =
      path.extname(file.originalname)
        .toLowerCase();

    const randomName =
      crypto.randomBytes(12).toString("hex");

    callback(
      null,
      `${Date.now()}-${randomName}${extension}`
    );
  }
});

const upload = multer({

  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (
    req,
    file,
    callback
  ) => {

    if (
      file.mimetype &&
      file.mimetype.startsWith("image/")
    ) {
      callback(null, true);
    } else {
      callback(
        new Error("File harus berupa gambar.")
      );
    }
  }
});

/* =========================
   UPLOAD
========================= */

app.post(
  "/api/uploads",
  requireLogin,

  (req, res) => {

    upload.single("image")(
      req,
      res,
      (error) => {

        if (error) {

          console.error(error);

          return res.status(400).json({
            error:
              error.message ||
              "Upload gagal."
          });
        }

        if (!req.file) {
          return res.status(400).json({
            error: "Tidak ada file yang diupload."
          });
        }

        res.json({
          success: true,
          url: `/uploads/${req.file.filename}`,
          filename: req.file.filename
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
  async (req, res) => {

    try {

      const gallery = await dbAll(
        `
        SELECT *
        FROM gallery
        ORDER BY id DESC
        `
      );

      res.json(gallery);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal mengambil galeri."
      });
    }
  }
);

app.post(
  "/api/gallery",
  requireLogin,
  async (req, res) => {

    try {

      const title =
        String(req.body.title || "").trim();

      const image =
        String(req.body.image || "").trim();

      if (!title || !image) {
        return res.status(400).json({
          error: "Judul dan gambar wajib diisi."
        });
      }

      const result = await dbRun(
        `
        INSERT INTO gallery
        (title, image)
        VALUES (?, ?)
        `,
        [
          title,
          image
        ]
      );

      res.status(201).json({
        success: true,
        id: result.id
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal menambahkan foto."
      });
    }
  }
);

app.delete(
  "/api/gallery/:id",
  requireLogin,
  async (req, res) => {

    try {

      const id = Number(req.params.id);

      const item = await dbGet(
        `SELECT image FROM gallery WHERE id = ?`,
        [id]
      );

      await dbRun(
        `DELETE FROM gallery WHERE id = ?`,
        [id]
      );

      if (
        item &&
        item.image &&
        item.image.startsWith("/uploads/")
      ) {

        const filename =
          path.basename(item.image);

        const filePath =
          path.join(UPLOAD_DIR, filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal menghapus foto."
      });
    }
  }
);

/* =========================
   ANNOUNCEMENTS
========================= */

app.get(
  "/api/announcements",
  async (req, res) => {

    try {

      const data = await dbAll(
        `
        SELECT *
        FROM announcements
        ORDER BY id DESC
        `
      );

      res.json(data);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal mengambil pengumuman."
      });
    }
  }
);

app.post(
  "/api/announcements",
  requireLogin,
  async (req, res) => {

    try {

      const title =
        String(req.body.title || "").trim();

      const content =
        String(req.body.content || "").trim();

      if (!title || !content) {
        return res.status(400).json({
          error: "Judul dan isi wajib diisi."
        });
      }

      const result = await dbRun(
        `
        INSERT INTO announcements
        (title, content)
        VALUES (?, ?)
        `,
        [
          title,
          content
        ]
      );

      res.status(201).json({
        success: true,
        id: result.id
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal membuat pengumuman."
      });
    }
  }
);

app.delete(
  "/api/announcements/:id",
  requireLogin,
  async (req, res) => {

    try {

      await dbRun(
        `DELETE FROM announcements WHERE id = ?`,
        [Number(req.params.id)]
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal menghapus pengumuman."
      });
    }
  }
);

/* =========================
   AGENDA
========================= */

app.get(
  "/api/agenda",
  async (req, res) => {

    try {

      const data = await dbAll(
        `
        SELECT *
        FROM agenda
        ORDER BY event_date ASC, id ASC
        `
      );

      res.json(data);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal mengambil agenda."
      });
    }
  }
);

app.post(
  "/api/agenda",
  requireLogin,
  async (req, res) => {

    try {

      const title =
        String(req.body.title || "").trim();

      const eventDate =
        String(req.body.event_date || "").trim();

      const description =
        String(req.body.description || "").trim();

      if (!title || !eventDate) {
        return res.status(400).json({
          error: "Judul dan tanggal wajib diisi."
        });
      }

      const result = await dbRun(
        `
        INSERT INTO agenda
        (title, event_date, description)
        VALUES (?, ?, ?)
        `,
        [
          title,
          eventDate,
          description
        ]
      );

      res.status(201).json({
        success: true,
        id: result.id
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal membuat agenda."
      });
    }
  }
);

app.delete(
  "/api/agenda/:id",
  requireLogin,
  async (req, res) => {

    try {

      await dbRun(
        `DELETE FROM agenda WHERE id = ?`,
        [Number(req.params.id)]
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal menghapus agenda."
      });
    }
  }
);

/* =========================
   ADMIN MANAGEMENT
========================= */

app.get(
  "/api/admins",
  requireOwner,
  async (req, res) => {

    try {

      const admins = await dbAll(
        `
        SELECT id, email, role, created_at
        FROM admins
        ORDER BY
          CASE role
            WHEN 'owner' THEN 0
            ELSE 1
          END,
          id ASC
        `
      );

      res.json(admins);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal mengambil daftar admin."
      });
    }
  }
);

app.post(
  "/api/admins",
  requireOwner,
  async (req, res) => {

    try {

      const email =
        String(req.body.email || "")
          .trim()
          .toLowerCase();

      const role =
        String(req.body.role || "admin")
          .trim()
          .toLowerCase();

      if (!email) {
        return res.status(400).json({
          error: "Email wajib diisi."
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          error: "Format email tidak valid."
        });
      }

      if (!["admin", "editor"].includes(role)) {
        return res.status(400).json({
          error: "Role tidak valid."
        });
      }

      if (email === OWNER_EMAIL) {
        return res.status(400).json({
          error: "Email owner sudah terdaftar."
        });
      }

      await dbRun(
        `
        INSERT INTO admins
        (email, role)
        VALUES (?, ?)
        `,
        [
          email,
          role
        ]
      );

      res.status(201).json({
        success: true
      });

    } catch (error) {

      console.error(error);

      if (error.code === "SQLITE_CONSTRAINT") {
        return res.status(409).json({
          error: "Email tersebut sudah terdaftar."
        });
      }

      res.status(500).json({
        error: "Gagal menambahkan admin."
      });
    }
  }
);

app.delete(
  "/api/admins/:id",
  requireOwner,
  async (req, res) => {

    try {

      const id = Number(req.params.id);

      const admin = await dbGet(
        `SELECT email, role FROM admins WHERE id = ?`,
        [id]
      );

      if (!admin) {
        return res.status(404).json({
          error: "Admin tidak ditemukan."
        });
      }

      if (admin.role === "owner") {
        return res.status(400).json({
          error: "Owner tidak dapat dihapus."
        });
      }

      await dbRun(
        `DELETE FROM admins WHERE id = ?`,
        [id]
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Gagal menghapus admin."
      });
    }
  }
);

/* =========================
   HEALTH
========================= */

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      status: "ok",
      class: "X MP 2",
      server: "running"
    });
  }
);

/* =========================
   ERROR HANDLER
========================= */

app.use(
  (error, req, res, next) => {

    console.error(error);

    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      error:
        error.message ||
        "Terjadi kesalahan server."
    });
  }
);

/* =========================
   START
========================= */

async function startServer() {

  try {

    await initializeDatabase();

    app.listen(
      PORT,
      () => {

        console.log("");
        console.log("================================");
        console.log(" X MP 2 WEBSITE");
        console.log("================================");
        console.log(`Website : ${BASE_URL}`);
        console.log(`Owner   : ${OWNER_EMAIL || "belum diatur"}`);
        console.log("Database: SQLite");
        console.log("================================");
        console.log("");
      }
    );

  } catch (error) {

    console.error(
      "Gagal menjalankan server:",
      error
    );

    process.exit(1);
  }
}

startServer();
