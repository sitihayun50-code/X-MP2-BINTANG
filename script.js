"use strict";

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  [...document.querySelectorAll(selector)];


function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function toast(message) {
  const el = $("#toast");

  if (!el) return;

  el.textContent = message;

  el.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer =
    setTimeout(() => {
      el.classList.remove("show");
    }, 2500);
}


async function request(
  url,
  options = {}
) {
  const response =
    await fetch(url, {
      credentials: "same-origin",
      ...options
    });

  const type =
    response.headers
      .get("content-type") || "";

  let data;

  if (type.includes("application/json")) {
    data = await response.json();
  } else {
    data = {
      success: response.ok,
      message: await response.text()
    };
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Terjadi kesalahan."
    );
  }

  return data;
}


/* =========================
   MOBILE MENU
========================= */

const menuButton =
  $("#menuButton");

const mainNav =
  $("#mainNav");

if (menuButton) {
  menuButton.addEventListener(
    "click",
    () => {
      mainNav.classList.toggle("open");
    }
  );
}

$$("nav a").forEach((link) => {
  link.addEventListener(
    "click",
    () => {
      mainNav.classList.remove("open");
    }
  );
});


/* =========================
   ADMIN TABS
========================= */

$$(".admin-tab").forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      const tab =
        button.dataset.tab;

      $$(".admin-tab")
        .forEach((item) =>
          item.classList.remove(
            "active"
          )
        );

      $$(".admin-panel")
        .forEach((item) =>
          item.classList.remove(
            "active"
          )
        );

      button.classList.add(
        "active"
      );

      const panel =
        document.querySelector(
          `[data-panel="${tab}"]`
        );

      if (panel) {
        panel.classList.add(
          "active"
        );
      }

      if (tab === "students") {
        loadAdminStudents();
      }

      if (tab === "gallery") {
        loadAdminGallery();
      }

      if (tab === "announcements") {
        loadAdminAnnouncements();
      }

      if (tab === "agenda") {
        loadAdminAgenda();
      }

      if (tab === "settings") {
        loadSettings();
      }

      if (tab === "admins") {
        loadAdminAccount();
      }
    }
  );
});


/* =========================
   STUDENTS PUBLIC
========================= */

async function loadStudents() {

  try {

    const result =
      await request(
        "/api/students"
      );

    const students =
      result.data || [];

    const grid =
      $("#studentGrid");

    if (!grid) return;

    if (!students.length) {
      return;
    }

    grid.innerHTML =
      students
        .map((student) => {

          const first =
            escapeHTML(
              student.name
                .charAt(0)
                .toUpperCase()
            );

          const photo =
            student.photo
              ? `
                <img
                  class="avatar"
                  src="${escapeHTML(student.photo)}"
                  alt="${escapeHTML(student.name)}"
                >
              `
              : `
                <div class="avatar">
                  ${first}
                </div>
              `;

          return `
            <article class="person-card">
              ${photo}

              <div>
                <h3>
                  ${escapeHTML(student.name)}
                </h3>

                <p>
                  ${escapeHTML(student.role || "Siswa")}
                </p>
              </div>
            </article>
          `;
        })
        .join("");

    $("#studentCount").textContent =
      `${students.length} Siswa`;

  } catch (error) {
    console.log(
      "Students:",
      error.message
    );
  }
}


/* =========================
   GALLERY PUBLIC
========================= */

async function loadGallery() {

  try {

    const result =
      await request(
        "/api/gallery"
      );

    const items =
      result.data || [];

    const grid =
      $("#galleryGrid");

    if (!grid) return;

    if (!items.length) {
      return;
    }

    grid.innerHTML =
      items
        .map((item) => `
          <article class="gallery-card">

            <img
              class="gallery-image"
              src="${escapeHTML(item.image)}"
              alt="${escapeHTML(item.title)}"
              loading="lazy"
            >

            <div class="gallery-info">

              <h3>
                ${escapeHTML(item.title)}
              </h3>

              <p>
                Dokumentasi X MP 2
              </p>

            </div>

          </article>
        `)
        .join("");

  } catch (error) {
    console.log(
      "Gallery:",
      error.message
    );
  }
}


/* =========================
   ANNOUNCEMENT PUBLIC
========================= */

async function loadAnnouncements() {

  try {

    const result =
      await request(
        "/api/announcements"
      );

    const items =
      result.data || [];

    const list =
      $("#announcementList");

    if (!list) return;

    if (!items.length) {
      return;
    }

    list.innerHTML =
      items
        .map((item) => `
          <article class="announcement-card">

            <span class="announcement-date">
              INFO
            </span>

            <h3>
              ${escapeHTML(item.title)}
            </h3>

            <p>
              ${escapeHTML(item.content)}
            </p>

          </article>
        `)
        .join("");

  } catch (error) {
    console.log(
      "Announcements:",
      error.message
    );
  }
}


/* =========================
   AGENDA PUBLIC
========================= */

async function loadAgenda() {

  try {

    const result =
      await request(
        "/api/agenda"
      );

    const items =
      result.data || [];

    const list =
      $("#agendaList");

    if (!list) return;

    if (!items.length) {
      return;
    }

    list.innerHTML =
      items
        .map((item) => `
          <article class="agenda-card">

            <span class="agenda-date">
              ${escapeHTML(item.date)}
            </span>

            <h3>
              ${escapeHTML(item.title)}
            </h3>

            <p>
              ${escapeHTML(item.description || "")}
            </p>

          </article>
        `)
        .join("");

  } catch (error) {
    console.log(
      "Agenda:",
      error.message
    );
  }
}


/* =========================
   LOGIN
========================= */

const loginForm =
  $("#loginForm");

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const username =
        $("#loginUsername")
          .value
          .trim();

      const password =
        $("#loginPassword")
          .value;

      const status =
        $("#loginStatus");

      status.textContent =
        "Memproses login...";

      try {

        const result =
          await request(
            "/api/auth/login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                username,
                password
              })
            }
          );

        status.textContent = "";

        toast(
          "Login berhasil."
        );

        showDashboard(
          result.user
        );

      } catch (error) {

        status.textContent =
          error.message;

        toast(
          "Login gagal."
        );
      }
    }
  );
}


function showDashboard(user) {

  $("#loginBox").hidden =
    true;

  $("#dashboard").hidden =
    false;

  if (user) {
    $("#adminWelcome").textContent =
      `Login sebagai ${user.name || user.username}`;
  }

  loadAdminStudents();
  loadAdminGallery();
  loadAdminAnnouncements();
  loadAdminAgenda();
  loadSettings();
  loadAdminAccount();
}


async function checkLogin() {

  try {

    const result =
      await request(
        "/api/auth/me"
      );

    if (
      result.loggedIn &&
      result.user
    ) {
      showDashboard(
        result.user
      );
    }

  } catch (error) {
    console.log(
      "Auth:",
      error.message
    );
  }
}


/* =========================
   LOGOUT
========================= */

const logoutBtn =
  $("#logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await request(
          "/api/auth/logout",
          {
            method: "POST"
          }
        );

        $("#dashboard").hidden =
          true;

        $("#loginBox").hidden =
          false;

        $("#loginPassword").value =
          "";

        toast(
          "Berhasil logout."
        );

      } catch (error) {

        toast(
          error.message
        );
      }
    }
  );
}


/* =========================
   ADMIN STUDENTS
========================= */

async function loadAdminStudents() {

  const list =
    $("#adminStudentList");

  if (!list) return;

  try {

    const result =
      await request(
        "/api/students"
      );

    const students =
      result.data || [];

    list.innerHTML =
      students
        .map((student) => `
          <div class="admin-list-item">

            <div>
              <strong>
                ${escapeHTML(student.name)}
              </strong>

              <span>
                ${escapeHTML(student.role || "Siswa")}
              </span>
            </div>

            <button
              class="small-danger"
              data-delete-student="${student.id}"
              type="button"
            >
              Hapus
            </button>

          </div>
        `)
        .join("");

    $$("[data-delete-student]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          async () => {

            if (
              !confirm(
                "Hapus siswa ini?"
              )
            ) {
              return;
            }

            try {

              await request(
                `/api/students/${button.dataset.deleteStudent}`,
                {
                  method: "DELETE"
                }
              );

              toast(
                "Siswa dihapus."
              );

              loadAdminStudents();
              loadStudents();

            } catch (error) {
              toast(
                error.message
              );
            }
          }
        );
      });

  } catch (error) {

    list.innerHTML = `
      <div class="empty-card">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}


const studentForm =
  $("#studentForm");

if (studentForm) {

  studentForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      try {

        await request(
          "/api/students",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              name:
                $("#studentName").value,

              role:
                $("#studentRole").value
            })
          }
        );

        studentForm.reset();

        $("#studentRole").value =
          "Siswa";

        toast(
          "Siswa berhasil ditambahkan."
        );

        loadAdminStudents();
        loadStudents();

      } catch (error) {

        toast(
          error.message
        );
      }
    }
  );
}


/* =========================
   UPLOAD
========================= */

const uploadForm =
  $("#uploadForm");

if (uploadForm) {

  uploadForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const file =
        $("#photoFile").files[0];

      const status =
        $("#uploadStatus");

      if (!file) {
        status.textContent =
          "Pilih foto terlebih dahulu.";

        return;
      }

      const formData =
        new FormData();

      formData.append(
        "image",
        file
      );

      status.textContent =
        "Mengupload...";

      try {

        const result =
          await request(
            "/api/uploads",
            {
              method: "POST",
              body: formData
            }
          );

        status.textContent =
          "Upload berhasil.";

        $("#uploadedResult")
          .innerHTML = `
            <img
              src="${escapeHTML(result.url)}"
              alt="Uploaded photo"
            >
            <p class="muted">
              ${escapeHTML(result.url)}
            </p>
          `;

        $("#galleryImage").value =
          result.url;

        toast(
          "Foto berhasil diupload."
        );

      } catch (error) {

        status.textContent =
          error.message;

        toast(
          error.message
        );
      }
    }
  );
}


/* =========================
   GALLERY ADMIN
========================= */

async function loadAdminGallery() {

  const list =
    $("#adminGalleryList");

  if (!list) return;

  try {

    const result =
      await request(
        "/api/gallery"
      );

    const items =
      result.data || [];

    list.innerHTML =
      items.length
        ? items
          .map((item) => `
            <div class="admin-list-item">

              <div>
                <strong>
                  ${escapeHTML(item.title)}
                </strong>

                <span>
                  ${escapeHTML(item.image)}
                </span>
              </div>

              <button
                class="small-danger"
                data-delete-gallery="${item.id}"
                type="button"
              >
                Hapus
              </button>

            </div>
          `)
          .join("")
        : `
          <div class="empty-card">
            Belum ada foto.
          </div>
        `;

    $$("[data-delete-gallery]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          async () => {

            if (
              !confirm(
                "Hapus foto ini?"
              )
            ) {
              return;
            }

            try {

              await request(
                `/api/gallery/${button.dataset.deleteGallery}`,
                {
                  method: "DELETE"
                }
              );

              toast(
                "Foto berhasil dihapus."
              );

              loadAdminGallery();
              loadGallery();

            } catch (error) {
              toast(
                error.message
              );
            }
          }
        );
      });

  } catch (error) {

    list.innerHTML = `
      <div class="empty-card">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}


const galleryForm =
  $("#galleryForm");

if (galleryForm) {

  galleryForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      try {

        await request(
          "/api/gallery",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              title:
                $("#galleryTitle").value,

              image:
                $("#galleryImage").value
            })
          }
        );

        galleryForm.reset();

        toast(
          "Galeri berhasil ditambahkan."
        );

        loadAdminGallery();
        loadGallery();

      } catch (error) {

        toast(
          error.message
        );
      }
    }
  );
}


/* =========================
   ANNOUNCEMENTS ADMIN
========================= */

async function loadAdminAnnouncements() {

  const list =
    $("#adminAnnouncementList");

  if (!list) return;

  try {

    const result =
      await request(
        "/api/announcements"
      );

    const items =
      result.data || [];

    list.innerHTML =
      items.length
        ? items
          .map((item) => `
            <div class="admin-list-item">

              <div>
                <strong>
                  ${escapeHTML(item.title)}
                </strong>

                <span>
                  ${escapeHTML(item.content)}
                </span>
              </div>

              <button
                class="small-danger"
                data-delete-announcement="${item.id}"
                type="button"
              >
                Hapus
              </button>

            </div>
          `)
          .join("")
        : `
          <div class="empty-card">
            Belum ada pengumuman.
          </div>
        `;

    $$("[data-delete-announcement]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          async () => {

            if (
              !confirm(
                "Hapus pengumuman ini?"
              )
            ) {
              return;
            }

            try {

              await request(
                `/api/announcements/${button.dataset.deleteAnnouncement}`,
                {
                  method: "DELETE"
                }
              );

              toast(
                "Pengumuman dihapus."
              );

              loadAdminAnnouncements();
              loadAnnouncements();

            } catch (error) {
              toast(
                error.message
              );
            }
          }
        );
      });

  } catch (error) {

    list.innerHTML = `
      <div class="empty-card">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}


const announcementForm =
  $("#announcementForm");

if (announcementForm) {

  announcementForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      try {

        await request(
          "/api/announcements",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              title:
                $("#announcementTitle").value,

              content:
                $("#announcementContent").value
            })
          }
        );

        announcementForm.reset();

        toast(
          "Pengumuman dipublikasikan."
        );

        loadAdminAnnouncements();
        loadAnnouncements();

      } catch (error) {

        toast(
          error.message
        );
      }
    }
  );
}


/* =========================
   AGENDA ADMIN
========================= */

async function loadAdminAgenda() {

  const list =
    $("#adminAgendaList");

  if (!list) return;

  try {

    const result =
      await request(
        "/api/agenda"
      );

    const items =
      result.data || [];

    list.innerHTML =
      items.length
        ? items
          .map((item) => `
            <div class="admin-list-item">

              <div>
                <strong>
                  ${escapeHTML(item.title)}
                </strong>

                <span>
                  ${escapeHTML(item.date)}
                </span>
              </div>

              <button
                class="small-danger"
                data-delete-agenda="${item.id}"
                type="button"
              >
                Hapus
              </button>

            </div>
          `)
          .join("")
        : `
          <div class="empty-card">
            Belum ada agenda.
          </div>
        `;

    $$("[data-delete-agenda]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          async () => {

            if (
              !confirm(
                "Hapus agenda ini?"
              )
            ) {
              return;
            }

            try {

              await request(
                `/api/agenda/${button.dataset.deleteAgenda}`,
                {
                  method: "DELETE"
                }
              );

              toast(
                "Agenda dihapus."
              );

              loadAdminAgenda();
              loadAgenda();

            } catch (error) {
              toast(
                error.message
              );
            }
          }
        );
      });

  } catch (error) {

    list.innerHTML = `
      <div class="empty-card">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}


const agendaForm =
  $("#agendaForm");

if (agendaForm) {

  agendaForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      try {

        await request(
          "/api/agenda",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              title:
                $("#agendaTitle").value,

              date:
                $("#agendaDate").value,

              description:
                $("#agendaDescription").value
            })
          }
        );

        agendaForm.reset();

        toast(
          "Agenda berhasil ditambahkan."
        );

        loadAdminAgenda();
        loadAgenda();

      } catch (error) {

        toast(
          error.message
        );
      }
    }
  );
}


/* =========================
   SETTINGS
========================= */

async function loadSettings() {

  try {

    const result =
      await request(
        "/api/settings"
      );

    const data =
      result.data;

    if (!data) return;

    $("#settingClass").value =
      data.className || "X MP 2";

    $("#settingFounder").value =
      data.founder || "NAZUAN AHMAD";

    $("#settingInstagram").value =
      data.instagram || "";

  } catch (error) {

    console.log(
      "Settings:",
      error.message
    );
  }
}


const settingsForm =
  $("#settingsForm");

if (settingsForm) {

  settingsForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      try {

        await request(
          "/api/settings",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              className:
                $("#settingClass").value,

              founder:
                $("#settingFounder").value,

              instagram:
                $("#settingInstagram").value
            })
          }
        );

        toast(
          "Pengaturan berhasil disimpan."
        );

      } catch (error) {

        toast(
          error.message
        );
      }
    }
  );
}


/* =========================
   ADMIN ACCOUNT
========================= */

async function loadAdminAccount() {

  const box =
    $("#adminAccountInfo");

  if (!box) return;

  try {

    const result =
      await request(
        "/api/admins"
      );

    const admin =
      result.data?.[0];

    if (!admin) {
      box.textContent =
        "Tidak ada data admin.";

      return;
    }

    box.innerHTML = `
      <strong>
        ${escapeHTML(admin.name)}
      </strong>

      <span>
        Username:
        ${escapeHTML(admin.username)}
      </span>

      <span>
        Email:
        ${escapeHTML(admin.email)}
      </span>

      <span>
        Role:
        ${escapeHTML(admin.role)}
      </span>
    `;

  } catch (error) {

    box.textContent =
      error.message;
  }
}


/* =========================
   INITIALIZE
========================= */

async function init() {

  // Semua loader dibuat terpisah.
  // Kalau salah satu API gagal,
  // bagian lainnya tetap tampil.

  loadStudents();
  loadGallery();
  loadAnnouncements();
  loadAgenda();

  checkLogin();
}

init();
