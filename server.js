require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const OWNER_EMAIL =
  (process.env.OWNER_EMAIL || "nazuanahmad070@gmail.com")
    .toLowerCase()
    .trim();

const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, {
    recursive: true
  });
}

const db = new sqlite3.Database(
  path.join(__dirname, "database.db")
);

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "x-mp-2-local-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname));

app.use(
  "/uploads",
  express.static(UPLOAD_DIR)
);

/* DATABASE */

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'Member Kelas',
      photo TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image TEXT,
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
      date TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      className TEXT,
      founder TEXT,
      instagram TEXT
    )
  `);

  db.run(
    `
    INSERT OR IGNORE INTO settings
    (id, className, founder, instagram)
    VALUES
    (1, 'X MP 2', 'NAZUAN AHMAD', '@kelas_xmp2')
    `
  );

  db.run(
    `
    INSERT OR IGNORE INTO admins
    (email, role)
    VALUES (?, 'owner')
    `,
    [OWNER_EMAIL]
  );

});

/* GOOGLE LOGIN */

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_ID !== "ISI_GOOGLE_CLIENT_ID"
) {

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,

        clientSecret:
          process.env.GOOGLE_CLIENT_SECRET,

        callbackURL:
          `${BASE_URL}/auth/google/callback`
      },

      async (
        accessToken,
        refreshToken,
        profile,
        done
      ) => {

        const email =
          profile.emails?.[0]?.value
            ?.toLowerCase()
            ?.trim();

        if (!email) {
          return done(null, false);
        }

        db.get(
          `
          SELECT *
          FROM admins
          WHERE LOWER(email) = LOWER(?)
          `,
          [email],
          (error, admin) => {

            if (error) {
              return done(error);
            }

            if (!admin) {
              return done(null, false);
            }

            done(null, {
              id: admin.id,
              email,
              name:
                profile.displayName ||
                email,
              role: admin.role
            });

          }
        );

      }
    )
  );

}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

/* AUTH */

app.get("/auth/google", (req, res, next) => {

  if (
    !process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID === "ISI_GOOGLE_CLIENT_ID"
  ) {

    return res.status(503).send(`
      <h2>Google Login belum dikonfigurasi</h2>
      <p>Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env.</p>
      <a href="/">Kembali</a>
    `);

  }

  passport.authenticate("google", {
    scope: ["profile", "email"]
  })(req, res, next);

});

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/?login=failed"
  }),
  (req, res) => {
    res.redirect("/#admin");
  }
);

app.post("/api/auth/logout", (req, res) => {

  req.logout(() => {

    req.session.destroy(() => {

      res.json({
        success: true
      });

    });

  });

});

app.get("/api/auth/me", (req, res) => {

  if (!req.user) {
    return res.json({
      loggedIn: false
    });
  }

  res.json({
    loggedIn: true,
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role
  });

});

/* MIDDLEWARE */

function requireLogin(req, res, next) {

  if (!req.isAuthenticated()) {

    return res.status(401).json({
      message: "Anda belum login."
    });

  }

  next();

}

function requireOwner(req, res, next) {

  if (!req.isAuthenticated()) {

    return res.status(401).json({
      message: "Anda belum login."
    });

  }

  if (req.user.role !== "owner") {

    return res.status(403).json({
      message: "Khusus owner."
    });

  }

  next();

}

/* HEALTH */

app.get("/api/health", (req, res) => {

  res.json({
    status: "ok",
    class: "X MP 2",
    server: "running"
  });

});

/* SETTINGS */

app.get("/api/settings", (req, res) => {

  db.get(
    "SELECT * FROM settings WHERE id = 1",
    [],
    (error, row) => {

      if (error) {
        return res.status(500).json({
          message: error.message
        });
      }

      res.json(row || {
        className: "X MP 2",
        founder: "NAZUAN AHMAD",
        instagram: "@kelas_xmp2"
      });

    }
  );

});

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
      SET className = ?,
          founder = ?,
          instagram = ?
      WHERE id = 1
      `,
      [
        className || "X MP 2",
        founder || "NAZUAN AHMAD",
        instagram || ""
      ],
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
          });
        }

        res.json({
          success: true
        });

      }
    );

  }
);

/* STUDENTS */

app.get("/api/students", (req, res) => {

  db.all(
    `
    SELECT *
    FROM students
    ORDER BY id DESC
    `,
    [],
    (error, rows) => {

      if (error) {
        return res.status(500).json({
          message: error.message
        });
      }

      res.json(rows || []);

    }
  );

});

app.post(
  "/api/students",
  requireLogin,
  (req, res) => {

    const {
      name,
      role,
      photo
    } = req.body;

    if (!name) {

      return res.status(400).json({
        message: "Nama siswa wajib diisi."
      });

    }

    db.run(
      `
      INSERT INTO students
      (name, role, photo)
      VALUES (?, ?, ?)
      `,
      [
        name,
        role || "Member Kelas",
        photo || null
      ],
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
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
      role,
      photo
    } = req.body;

    db.run(
      `
      UPDATE students
      SET name = ?,
          role = ?,
          photo = ?
      WHERE id = ?
      `,
      [
        name,
        role,
        photo,
        req.params.id
      ],
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
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
      "DELETE FROM students WHERE id = ?",
      [req.params.id],
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
          });
        }

        res.json({
          success: true
        });

      }
    );

  }
);

/* UPLOAD */

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {

    const ext =
      path.extname(file.originalname)
        .toLowerCase() || ".jpg";

    const name =
      `image-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}${ext}`;

    cb(null, name);

  }

});

const upload = multer({

  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    if (!file.mimetype.startsWith("image/")) {
      return cb(
        new Error("File harus berupa gambar.")
      );
    }

    cb(null, true);

  }

});

app.post(
  "/api/uploads",
  requireLogin,
  upload.single("image"),
  (req, res) => {

    if (!req.file) {

      return res.status(400).json({
        message: "Tidak ada gambar."
      });

    }

    res.json({
      success: true,
      url: `/uploads/${req.file.filename}`
    });

  }
);

/* GALLERY */

app.get("/api/gallery", (req, res) => {

  db.all(
    `
    SELECT *
    FROM gallery
    ORDER BY id DESC
    `,
    [],
    (error, rows) => {

      if (error) {
        return res.status(500).json({
          message: error.message
        });
      }

      res.json(rows || []);

    }
  );

});

app.post(
  "/api/gallery",
  requireLogin,
  (req, res) => {

    const {
      title,
      image
    } = req.body;

    if (!title) {

      return res.status(400).json({
        message: "Judul wajib diisi."
      });

    }

    db.run(
      `
      INSERT INTO gallery
      (title, image)
      VALUES (?, ?)
      `,
      [
        title,
        image || null
      ],
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
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

    db.run(
      "DELETE FROM gallery WHERE id = ?",
      [req.params.id],
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
          });
        }

        res.json({
          success: true
        });

      }
    );

  }
);

/* ANNOUNCEMENTS */

app.get(
  "/api/announcements",
  (req, res) => {

    db.all(
      `
      SELECT *
      FROM announcements
      ORDER BY id DESC
      `,
      [],
      (error, rows) => {

        if (error) {
          return res.status(500).json({
            message: error.message
          });
        }

        res.json(rows || []);

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

    if (!title || !content) {

      return res.status(400).json({
        message: "Judul dan isi wajib diisi."
      });

    }

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
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
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
      "DELETE FROM announcements WHERE id = ?",
      [req.params.id],
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
          });
        }

        res.json({
          success: true
        });

      }
    );

  }
);

/* AGENDA */

app.get("/api/agenda", (req, res) => {

  db.all(
    `
    SELECT *
    FROM agenda
    ORDER BY date ASC, id DESC
    `,
    [],
    (error, rows) => {

      if (error) {
        return res.status(500).json({
          message: error.message
        });
      }

      res.json(rows || []);

    }
  );

});

app.post(
  "/api/agenda",
  requireLogin,
  (req, res) => {

    const {
      title,
      date,
      description
    } = req.body;

    if (!title) {

      return res.status(400).json({
        message: "Judul agenda wajib diisi."
      });

    }

    db.run(
      `
      INSERT INTO agenda
      (title, date, description)
      VALUES (?, ?, ?)
      `,
      [
        title,
        date || null,
        description || ""
      ],
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
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
      "DELETE FROM agenda WHERE id = ?",
      [req.params.id],
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
          });
        }

        res.json({
          success: true
        });

      }
    );

  }
);

/* ADMINS */

app.get(
  "/api/admins",
  requireOwner,
  (req, res) => {

    db.all(
      `
      SELECT id, email, role
      FROM admins
      ORDER BY id ASC
      `,
      [],
      (error, rows) => {

        if (error) {
          return res.status(500).json({
            message: error.message
          });
        }

        res.json(rows || []);

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
        .toLowerCase()
        .trim();

    const role =
      req.body.role || "admin";

    if (!email) {

      return res.status(400).json({
        message: "Gmail wajib diisi."
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
      function (error) {

        if (error) {

          if (error.message.includes("UNIQUE")) {

            return res.status(409).json({
              message: "Email tersebut sudah terdaftar."
            });

          }

          return res.status(500).json({
            message: error.message
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

    db.run(
      `
      DELETE FROM admins
      WHERE id = ?
      AND LOWER(email) != LOWER(?)
      `,
      [
        req.params.id,
        OWNER_EMAIL
      ],
      function (error) {

        if (error) {
          return res.status(500).json({
            message: error.message
          });
        }

        res.json({
          success: true
        });

      }
    );

  }
);

/* FALLBACK */

app.get("*", (req, res) => {

  res.sendFile(
    path.join(__dirname, "index.html")
  );

});

/* START */

app.listen(PORT, () => {

  console.log("");
  console.log("=================================");
  console.log("       X MP 2 WEBSITE");
  console.log("=================================");
  console.log(`Website : ${BASE_URL}`);
  console.log(`Health  : ${BASE_URL}/api/health`);
  console.log(`Owner   : ${OWNER_EMAIL}`);
  console.log("=================================");
  console.log("");

});
