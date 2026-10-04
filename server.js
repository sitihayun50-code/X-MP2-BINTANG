require("dotenv").config();

const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = Number(process.env.PORT || 3000);

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || "admin123";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "admin";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "x-mp-2-secret";

const OWNER_EMAIL =
  process.env.OWNER_EMAIL ||
  "nazuanahmad070@gmail.com";

const ROOT = __dirname;
const UPLOAD_DIR = path.join(ROOT, "uploads");
const DB_FILE = path.join(ROOT, "database.db");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(
  "/uploads",
  express.static(UPLOAD_DIR)
);

app.use(express.static(ROOT));

const db = new sqlite3.Database(DB_FILE);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        id: this.lastID,
        changes: this.changes
      });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT DEFAULT '',
      photo TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS agenda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      className TEXT NOT NULL,
      founder TEXT NOT NULL,
      instagram TEXT DEFAULT ''
    )
  `);

  const settings = await get(
    "SELECT * FROM settings WHERE id = 1"
  );

  if (!settings) {
    await run(
      `
      INSERT INTO settings
      (id, className, founder, instagram)
      VALUES
      (1, ?, ?, ?)
      `,
      [
        "X MP 2",
        "NAZUAN AHMAD",
        ""
      ]
    );
  }

  const students = await get(
    "SELECT COUNT(*) AS total FROM students"
  );

  if (students.total === 0) {
    await run(
      `
      INSERT INTO students
      (name, role)
      VALUES (?, ?)
      `,
      ["Nama Siswa 1", "Siswa"]
    );

    await run(
      `
      INSERT INTO students
      (name, role)
      VALUES (?, ?)
      `,
      ["Nama Siswa 2", "Siswa"]
    );

    await run(
      `
      INSERT INTO students
      (name, role)
      VALUES (?, ?)
      `,
      ["Nama Siswa 3", "Siswa"]
    );
  }

  const announcements = await get(
    "SELECT COUNT(*) AS total FROM announcements"
  );

  if (announcements.total === 0) {
    await run(
      `
      INSERT INTO announcements
      (title, content)
      VALUES (?, ?)
      `,
      [
        "Selamat Datang di Website X MP 2",
        "Website resmi kelas X MP 2 telah aktif."
      ]
    );
  }
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Anda belum login."
    });
  }

  next();
}

function requireOwner(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Anda belum login."
    });
  }

  if (req.session.user.role !== "owner") {
    return res.status(403).json({
      success: false,
      message: "Akses khusus owner."
    });
  }

  next();
}

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    className: "X MP 2",
    server: "NAZUAN AHMAD"
  });
});

/* =========================
   AUTH
========================= */

app.post("/api/auth/login", (req, res) => {
  const username = String(
    req.body.username || ""
  ).trim();

  const password = String(
    req.body.password || ""
  );

  if (
    username !== ADMIN_USERNAME ||
    password !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: "Username atau password salah."
    });
  }

  req.session.user = {
    username: ADMIN_USERNAME,
    name: "NAZUAN AHMAD",
    email: OWNER_EMAIL,
    role: "owner"
  };

  res.json({
    success: true,
    message: "Login berhasil.",
    user: req.session.user
  });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
      success: true
    });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session.user) {
    return res.json({
      loggedIn: false
    });
  }

  res.json({
    loggedIn: true,
    user: req.session.user
  });
});

/* =========================
   SETTINGS
========================= */

app.get("/api/settings", async (req, res) => {
  try {
    const data = await get(
      "SELECT * FROM settings WHERE id = 1"
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put(
  "/api/settings",
  requireOwner,
  async (req, res) => {
    try {
      const className =
        String(req.body.className || "").trim();

      const founder =
        String(req.body.founder || "").trim();

      const instagram =
        String(req.body.instagram || "").trim();

      await run(
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
          instagram
        ]
      );

      res.json({
        success: true,
        message: "Pengaturan berhasil disimpan."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/* =========================
   STUDENTS
========================= */

app.get("/api/students", async (req, res) => {
  try {
    const data = await all(
      "SELECT * FROM students ORDER BY id DESC"
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post(
  "/api/students",
  requireOwner,
  async (req, res) => {
    try {
      const name =
        String(req.body.name || "").trim();

      const role =
        String(req.body.role || "Siswa").trim();

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Nama siswa wajib diisi."
        });
      }

      const result = await run(
        `
        INSERT INTO students
        (name, role)
        VALUES (?, ?)
        `,
        [name, role]
      );

      res.json({
        success: true,
        id: result.id,
        message: "Siswa berhasil ditambahkan."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

app.delete(
  "/api/students/:id",
  requireOwner,
  async (req, res) => {
    try {
      await run(
        "DELETE FROM students WHERE id = ?",
        [req.params.id]
      );

      res.json({
        success: true,
        message: "Siswa berhasil dihapus."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/* =========================
   UPLOAD
========================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },

  filename: function (req, file, cb) {
    const ext =
      path.extname(file.originalname)
        .toLowerCase();

    const name =
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 9);

    cb(null, name + ext);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error(
          "File harus berupa JPG, PNG, WEBP, atau GIF."
        )
      );
    }

    cb(null, true);
  }
});

app.post(
  "/api/uploads",
  requireOwner,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Foto belum dipilih."
        });
      }

      const url =
        "/uploads/" +
        req.file.filename;

      res.json({
        success: true,
        url,
        filename: req.file.filename
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/* =========================
   GALLERY
========================= */

app.get("/api/gallery", async (req, res) => {
  try {
    const data = await all(
      `
      SELECT * FROM gallery
      ORDER BY id DESC
      `
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post(
  "/api/gallery",
  requireOwner,
  async (req, res) => {
    try {
      const title =
        String(req.body.title || "").trim();

      const image =
        String(req.body.image || "").trim();

      if (!title || !image) {
        return res.status(400).json({
          success: false,
          message: "Judul dan foto wajib diisi."
        });
      }

      const result = await run(
        `
        INSERT INTO gallery
        (title, image)
        VALUES (?, ?)
        `,
        [title, image]
      );

      res.json({
        success: true,
        id: result.id,
        message: "Foto berhasil ditambahkan."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

app.delete(
  "/api/gallery/:id",
  requireOwner,
  async (req, res) => {
    try {
      const item = await get(
        "SELECT * FROM gallery WHERE id = ?",
        [req.params.id]
      );

      if (item && item.image) {
        const filename =
          path.basename(item.image);

        const filePath =
          path.join(
            UPLOAD_DIR,
            filename
          );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await run(
        "DELETE FROM gallery WHERE id = ?",
        [req.params.id]
      );

      res.json({
        success: true,
        message: "Foto berhasil dihapus."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
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
      const data = await all(
        `
        SELECT * FROM announcements
        ORDER BY id DESC
        `
      );

      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

app.post(
  "/api/announcements",
  requireOwner,
  async (req, res) => {
    try {
      const title =
        String(req.body.title || "").trim();

      const content =
        String(req.body.content || "").trim();

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: "Judul dan isi wajib diisi."
        });
      }

      await run(
        `
        INSERT INTO announcements
        (title, content)
        VALUES (?, ?)
        `,
        [title, content]
      );

      res.json({
        success: true,
        message: "Pengumuman berhasil dibuat."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

app.delete(
  "/api/announcements/:id",
  requireOwner,
  async (req, res) => {
    try {
      await run(
        "DELETE FROM announcements WHERE id = ?",
        [req.params.id]
      );

      res.json({
        success: true,
        message: "Pengumuman berhasil dihapus."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/* =========================
   AGENDA
========================= */

app.get("/api/agenda", async (req, res) => {
  try {
    const data = await all(
      `
      SELECT * FROM agenda
      ORDER BY date ASC, id DESC
      `
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post(
  "/api/agenda",
  requireOwner,
  async (req, res) => {
    try {
      const title =
        String(req.body.title || "").trim();

      const date =
        String(req.body.date || "").trim();

      const description =
        String(
          req.body.description || ""
        ).trim();

      if (!title || !date) {
        return res.status(400).json({
          success: false,
          message: "Judul dan tanggal wajib diisi."
        });
      }

      await run(
        `
        INSERT INTO agenda
        (title, date, description)
        VALUES (?, ?, ?)
        `,
        [
          title,
          date,
          description
        ]
      );

      res.json({
        success: true,
        message: "Agenda berhasil ditambahkan."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

app.delete(
  "/api/agenda/:id",
  requireOwner,
  async (req, res) => {
    try {
      await run(
        "DELETE FROM agenda WHERE id = ?",
        [req.params.id]
      );

      res.json({
        success: true,
        message: "Agenda berhasil dihapus."
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/* =========================
   ADMIN INFO
========================= */

app.get(
  "/api/admins",
  requireOwner,
  async (req, res) => {
    res.json({
      success: true,
      data: [
        {
          username: ADMIN_USERNAME,
          name: "NAZUAN AHMAD",
          email: OWNER_EMAIL,
          role: "owner"
        }
      ]
    });
  }
);

/* =========================
   ERROR UPLOAD
========================= */

app.use(
  (err, req, res, next) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    next();
  }
);

/* =========================
   FRONTEND FALLBACK
========================= */

app.use((req, res) => {
  res.sendFile(
    path.join(ROOT, "index.html")
  );
});

/* =========================
   START
========================= */

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log("");
      console.log(
        "======================================"
      );
      console.log(
        "        X MP 2 WEBSITE ONLINE"
      );
      console.log(
        "======================================"
      );
      console.log(
        `Website : http://localhost:${PORT}`
      );
      console.log(
        `Admin   : ${ADMIN_USERNAME}`
      );
      console.log(
        "Status  : ONLINE"
      );
      console.log(
        "======================================"
      );
      console.log("");
    });
  })
  .catch((error) => {
    console.error(
      "Gagal menjalankan database:",
      error
    );

    process.exit(1);
  });
