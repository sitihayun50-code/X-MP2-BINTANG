"use strict";

/* =========================
   HELPER
========================= */

const $ = (selector) => document.querySelector(selector);

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options
  });

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Server mengembalikan data tidak valid (${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error || `Request gagal (${response.status})`
    );
  }

  return data;
}

function toast(message) {
  const el = $("#toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 3000);
}

function hideLoading(id) {
  const el = $(id);
  if (el) el.classList.add("hidden");
}

function showEmpty(id, message = "Belum ada data.") {
  const el = $(id);

  if (!el) return;

  el.textContent = message;
  el.classList.remove("hidden");
}

function hideEmpty(id) {
  const el = $(id);
  if (el) el.classList.add("hidden");
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

/* =========================
   MOBILE MENU
========================= */

const menuBtn = $("#menuBtn");
const mainNav = $("#mainNav");

if (menuBtn && mainNav) {
  menuBtn.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
    });
  });
}

/* =========================
   SETTINGS
========================= */

async function loadSettings() {
  try {
    const data = await api("/api/settings");

    const className = data.class_name || "X MP 2";
    const founder = data.founder || "NAZUAN AHMAD";

    const title = document.querySelector("title");
    const heroTitle = document.querySelector(".hero h1");
    const brand = document.querySelector(".brand strong");
    const founderElement = document.querySelector(".founder strong");

    if (title) {
      title.textContent = `${className} — ${founder}`;
    }

    if (heroTitle) {
      heroTitle.textContent = className;
    }

    if (brand) {
      brand.textContent = className;
    }

    if (founderElement) {
      founderElement.textContent = founder;
    }

    return true;
  } catch (error) {
    console.error("Settings:", error);
    return false;
  }
}

async function loadSettingsForm() {
  try {
    const data = await api("/api/settings");

    if ($("#settingClassName")) {
      $("#settingClassName").value = data.class_name || "";
    }

    if ($("#settingFounder")) {
      $("#settingFounder").value = data.founder || "";
    }

    if ($("#settingInstagram")) {
      $("#settingInstagram").value = data.instagram || "";
    }
  } catch (error) {
    toast(error.message);
  }
}

/* =========================
   STUDENTS
========================= */

async function loadStudents() {
  const list = $("#studentList");

  hideLoading("#studentLoading");
  hideEmpty("#studentEmpty");

  if (!list) return;

  try {
    const students = await api("/api/students");

    list.innerHTML = "";

    if (!Array.isArray(students) || students.length === 0) {
      showEmpty("#studentEmpty", "Belum ada data siswa.");
      return;
    }

    students.forEach((student) => {
      const card = document.createElement("article");

      card.className = "student-card";

      const image =
        student.photo ||
        "/default-student.svg";

      card.innerHTML = `
        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(student.name)}"
          onerror="this.onerror=null;this.src='/default-student.svg'"
        >

        <div class="student-body">
          <h3>${escapeHTML(student.name)}</h3>
          <p>
            ${escapeHTML(student.info || "Siswa X MP 2")}
          </p>
        </div>
      `;

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Students:", error);

    list.innerHTML = `
      <div class="empty">
        Gagal memuat data siswa.<br>
        <small>${escapeHTML(error.message)}</small>
      </div>
    `;
  }
}

/* =========================
   GALLERY
========================= */

async function loadGallery() {
  const list = $("#galleryList");

  hideLoading("#galleryLoading");
  hideEmpty("#galleryEmpty");

  if (!list) return;

  try {
    const gallery = await api("/api/gallery");

    list.innerHTML = "";

    if (!Array.isArray(gallery) || gallery.length === 0) {
      showEmpty("#galleryEmpty", "Belum ada foto galeri.");
      return;
    }

    gallery.forEach((item) => {
      const card = document.createElement("article");

      card.className = "gallery-card";

      card.innerHTML = `
        <img
          src="${escapeHTML(item.image)}"
          alt="${escapeHTML(item.title)}"
          loading="lazy"
        >

        <div class="gallery-title">
          ${escapeHTML(item.title)}
        </div>
      `;

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Gallery:", error);

    list.innerHTML = `
      <div class="empty">
        Gagal memuat galeri.<br>
        <small>${escapeHTML(error.message)}</small>
      </div>
    `;
  }
}

/* =========================
   ANNOUNCEMENTS
========================= */

async function loadAnnouncements() {
  const list = $("#announcementList");

  hideLoading("#announcementLoading");
  hideEmpty("#announcementEmpty");

  if (!list) return;

  try {
    const data = await api("/api/announcements");

    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      showEmpty(
        "#announcementEmpty",
        "Belum ada pengumuman."
      );
      return;
    }

    data.forEach((item) => {
      const card = document.createElement("article");

      card.className = "announcement-card";

      card.innerHTML = `
        <h3>${escapeHTML(item.title)}</h3>

        <p>${escapeHTML(item.content)}</p>

        <span class="date">
          ${escapeHTML(formatDate(item.created_at))}
        </span>
      `;

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Announcements:", error);

    list.innerHTML = `
      <div class="empty">
        Gagal memuat pengumuman.<br>
        <small>${escapeHTML(error.message)}</small>
      </div>
    `;
  }
}

/* =========================
   AGENDA
========================= */

async function loadAgenda() {
  const list = $("#agendaList");

  hideLoading("#agendaLoading");
  hideEmpty("#agendaEmpty");

  if (!list) return;

  try {
    const data = await api("/api/agenda");

    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      showEmpty("#agendaEmpty", "Belum ada agenda.");
      return;
    }

    data.forEach((item) => {
      const date = new Date(item.event_date);

      let day = "-";
      let month = "";

      if (!Number.isNaN(date.getTime())) {
        day = date.getDate();

        month = date.toLocaleDateString(
          "id-ID",
          {
            month: "short"
          }
        );
      }

      const card = document.createElement("article");

      card.className = "agenda-card";

      card.innerHTML = `
        <div class="agenda-date">
          <div>${escapeHTML(day)}</div>
          <small>${escapeHTML(month)}</small>
        </div>

        <div class="agenda-info">
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.description || "")}</p>
        </div>
      `;

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Agenda:", error);

    list.innerHTML = `
      <div class="empty">
        Gagal memuat agenda.<br>
        <small>${escapeHTML(error.message)}</small>
      </div>
    `;
  }
}

/* =========================
   AUTH
========================= */

async function checkLogin() {
  try {
    const data = await api("/api/auth/me");

    const loginBox = $("#loginBox");
    const dashboard = $("#dashboard");

    if (!data.loggedIn) {
      loginBox?.classList.remove("hidden");
      dashboard?.classList.add("hidden");
      return;
    }

    loginBox?.classList.add("hidden");
    dashboard?.classList.remove("hidden");

    if ($("#adminName")) {
      $("#adminName").textContent =
        data.user?.name || "Admin";
    }

    if ($("#adminEmail")) {
      $("#adminEmail").textContent =
        data.user?.email || "";
    }

    if ($("#adminRole")) {
      $("#adminRole").textContent =
        String(data.user?.role || "admin").toUpperCase();
    }

    const isOwner =
      data.user?.role === "owner";

    document
      .querySelectorAll(".owner-only")
      .forEach((element) => {
        element.classList.toggle(
          "hidden",
          !isOwner
        );
      });

    await loadAdminData();

  } catch (error) {
    console.error("Auth:", error);

    $("#loginBox")?.classList.remove("hidden");
    $("#dashboard")?.classList.add("hidden");
  }
}

$("#googleLoginBtn")?.addEventListener(
  "click",
  () => {
    window.location.href = "/auth/google";
  }
);

$("#logoutBtn")?.addEventListener(
  "click",
  async () => {

    try {
      await api(
        "/api/auth/logout",
        {
          method: "POST"
        }
      );

      toast("Berhasil logout.");

      setTimeout(() => {
        location.reload();
      }, 500);

    } catch (error) {
      toast(error.message);
    }
  }
);

/* =========================
   TABS
========================= */

document.querySelectorAll(".tab").forEach(
  (tab) => {

    tab.addEventListener(
      "click",
      async () => {

        if (tab.classList.contains("hidden")) {
          return;
        }

        const target =
          tab.dataset.tab;

        document
          .querySelectorAll(".tab")
          .forEach((item) => {
            item.classList.remove("active");
          });

        document
          .querySelectorAll(".tab-content")
          .forEach((item) => {
            item.classList.remove("active");
          });

        tab.classList.add("active");

        const content =
          document.querySelector(
            `#tab-${target}`
          );

        if (content) {
          content.classList.add("active");
        }

        try {

          if (target === "settings") {
            await loadSettingsForm();
          }

          if (target === "admins") {
            await loadAdmins();
          }

          if (target === "students") {
            await loadAdminStudents();
          }

          if (target === "gallery") {
            await loadAdminGallery();
          }

          if (target === "announcements") {
            await loadAdminAnnouncements();
          }

          if (target === "agenda") {
            await loadAdminAgenda();
          }

        } catch (error) {
          console.error(error);
        }
      }
    );

  }
);

/* =========================
   UPLOAD
========================= */

async function uploadImage(file) {

  if (!file) {
    throw new Error(
      "File gambar belum dipilih."
    );
  }

  if (!file.type.startsWith("image/")) {
    throw new Error(
      "File harus berupa gambar."
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error(
      "Ukuran gambar maksimal 10 MB."
    );
  }

  const formData = new FormData();

  formData.append(
    "image",
    file
  );

  return await api(
    "/api/uploads",
    {
      method: "POST",
      body: formData
    }
  );
}

/* =========================
   STUDENT FORM
========================= */

$("#studentForm")?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const button =
      event.submitter;

    if (button) {
      button.disabled = true;
    }

    try {

      const name =
        $("#studentName").value.trim();

      const info =
        $("#studentInfo").value.trim();

      const file =
        $("#studentPhoto").files[0];

      let photo = "";

      if (file) {
        const upload =
          await uploadImage(file);

        photo =
          upload.url || "";
      }

      await api(
        "/api/students",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            name,
            info,
            photo
          })
        }
      );

      event.target.reset();

      toast(
        "Siswa berhasil ditambahkan."
      );

      await loadStudents();
      await loadAdminStudents();

    } catch (error) {

      console.error(error);
      toast(error.message);

    } finally {

      if (button) {
        button.disabled = false;
      }
    }
  }
);

/* =========================
   ADMIN STUDENTS
========================= */

async function loadAdminStudents() {

  const list =
    $("#adminStudentList");

  if (!list) return;

  try {

    const data =
      await api("/api/students");

    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML =
        `<div class="empty">Belum ada siswa.</div>`;
      return;
    }

    data.forEach((student) => {

      const item =
        document.createElement("div");

      item.className =
        "admin-data-item";

      item.innerHTML = `
        <div class="admin-data-main">
          <strong>
            ${escapeHTML(student.name)}
          </strong>

          <span>
            ${escapeHTML(
              student.info || "Siswa"
            )}
          </span>
        </div>

        <button
          type="button"
          class="btn danger small"
          data-delete-student="${student.id}"
        >
          Hapus
        </button>
      `;

      list.appendChild(item);
    });

  } catch (error) {

    list.innerHTML = `
      <div class="empty">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}

$("#adminStudentList")?.addEventListener(
  "click",
  async (event) => {

    const button =
      event.target.closest(
        "[data-delete-student]"
      );

    if (!button) return;

    if (!confirm(
      "Yakin ingin menghapus siswa ini?"
    )) {
      return;
    }

    try {

      await api(
        `/api/students/${button.dataset.deleteStudent}`,
        {
          method: "DELETE"
        }
      );

      toast(
        "Siswa berhasil dihapus."
      );

      await loadStudents();
      await loadAdminStudents();

    } catch (error) {
      toast(error.message);
    }
  }
);

/* =========================
   GALLERY FORM
========================= */

$("#uploadForm")?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const button =
      event.submitter;

    if (button) {
      button.disabled = true;
    }

    try {

      const title =
        $("#photoTitle").value.trim();

      const file =
        $("#photoFile").files[0];

      const upload =
        await uploadImage(file);

      await api(
        "/api/gallery",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            title,
            image: upload.url
          })
        }
      );

      event.target.reset();

      toast(
        "Foto berhasil ditambahkan."
      );

      await loadGallery();
      await loadAdminGallery();

    } catch (error) {

      console.error(error);
      toast(error.message);

    } finally {

      if (button) {
        button.disabled = false;
      }
    }
  }
);

/* =========================
   ADMIN GALLERY
========================= */

async function loadAdminGallery() {

  const list =
    $("#adminGalleryList");

  if (!list) return;

  try {

    const data =
      await api("/api/gallery");

    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML =
        `<div class="empty">Belum ada foto.</div>`;
      return;
    }

    data.forEach((item) => {

      const element =
        document.createElement("div");

      element.className =
        "admin-data-item";

      element.innerHTML = `
        <div class="admin-data-main">
          <strong>
            ${escapeHTML(item.title)}
          </strong>

          <span>
            Foto galeri
          </span>
        </div>

        <button
          type="button"
          class="btn danger small"
          data-delete-gallery="${item.id}"
        >
          Hapus
        </button>
      `;

      list.appendChild(element);
    });

  } catch (error) {

    list.innerHTML = `
      <div class="empty">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}

$("#adminGalleryList")?.addEventListener(
  "click",
  async (event) => {

    const button =
      event.target.closest(
        "[data-delete-gallery]"
      );

    if (!button) return;

    if (!confirm(
      "Yakin ingin menghapus foto ini?"
    )) {
      return;
    }

    try {

      await api(
        `/api/gallery/${button.dataset.deleteGallery}`,
        {
          method: "DELETE"
        }
      );

      toast(
        "Foto berhasil dihapus."
      );

      await loadGallery();
      await loadAdminGallery();

    } catch (error) {
      toast(error.message);
    }
  }
);

/* =========================
   ANNOUNCEMENT FORM
========================= */

$("#announcementForm")?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const button =
      event.submitter;

    if (button) {
      button.disabled = true;
    }

    try {

      await api(
        "/api/announcements",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            title:
              $("#announcementTitle")
                .value
                .trim(),

            content:
              $("#announcementContent")
                .value
                .trim()
          })
        }
      );

      event.target.reset();

      toast(
        "Pengumuman berhasil dibuat."
      );

      await loadAnnouncements();
      await loadAdminAnnouncements();

    } catch (error) {

      toast(error.message);

    } finally {

      if (button) {
        button.disabled = false;
      }
    }
  }
);

/* =========================
   ADMIN ANNOUNCEMENTS
========================= */

async function loadAdminAnnouncements() {

  const list =
    $("#adminAnnouncementList");

  if (!list) return;

  try {

    const data =
      await api("/api/announcements");

    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML =
        `<div class="empty">Belum ada pengumuman.</div>`;
      return;
    }

    data.forEach((item) => {

      const element =
        document.createElement("div");

      element.className =
        "admin-data-item";

      element.innerHTML = `
        <div class="admin-data-main">
          <strong>
            ${escapeHTML(item.title)}
          </strong>

          <span>
            ${escapeHTML(
              formatDate(item.created_at)
            )}
          </span>
        </div>

        <button
          type="button"
          class="btn danger small"
          data-delete-announcement="${item.id}"
        >
          Hapus
        </button>
      `;

      list.appendChild(element);
    });

  } catch (error) {

    list.innerHTML = `
      <div class="empty">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}

$("#adminAnnouncementList")?.addEventListener(
  "click",
  async (event) => {

    const button =
      event.target.closest(
        "[data-delete-announcement]"
      );

    if (!button) return;

    if (!confirm(
      "Yakin ingin menghapus pengumuman ini?"
    )) {
      return;
    }

    try {

      await api(
        `/api/announcements/${button.dataset.deleteAnnouncement}`,
        {
          method: "DELETE"
        }
      );

      toast(
        "Pengumuman berhasil dihapus."
      );

      await loadAnnouncements();
      await loadAdminAnnouncements();

    } catch (error) {
      toast(error.message);
    }
  }
);

/* =========================
   AGENDA FORM
========================= */

$("#agendaForm")?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const button =
      event.submitter;

    if (button) {
      button.disabled = true;
    }

    try {

      await api(
        "/api/agenda",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            title:
              $("#agendaTitle")
                .value
                .trim(),

            event_date:
              $("#agendaDate")
                .value,

            description:
              $("#agendaDescription")
                .value
                .trim()
          })
        }
      );

      event.target.reset();

      toast(
        "Agenda berhasil ditambahkan."
      );

      await loadAgenda();
      await loadAdminAgenda();

    } catch (error) {

      toast(error.message);

    } finally {

      if (button) {
        button.disabled = false;
      }
    }
  }
);

/* =========================
   ADMIN AGENDA
========================= */

async function loadAdminAgenda() {

  const list =
    $("#adminAgendaList");

  if (!list) return;

  try {

    const data =
      await api("/api/agenda");

    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML =
        `<div class="empty">Belum ada agenda.</div>`;
      return;
    }

    data.forEach((item) => {

      const element =
        document.createElement("div");

      element.className =
        "admin-data-item";

      element.innerHTML = `
        <div class="admin-data-main">
          <strong>
            ${escapeHTML(item.title)}
          </strong>

          <span>
            ${escapeHTML(item.event_date)}
          </span>
        </div>

        <button
          type="button"
          class="btn danger small"
          data-delete-agenda="${item.id}"
        >
          Hapus
        </button>
      `;

      list.appendChild(element);
    });

  } catch (error) {

    list.innerHTML = `
      <div class="empty">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}

$("#adminAgendaList")?.addEventListener(
  "click",
  async (event) => {

    const button =
      event.target.closest(
        "[data-delete-agenda]"
      );

    if (!button) return;

    if (!confirm(
      "Yakin ingin menghapus agenda ini?"
    )) {
      return;
    }

    try {

      await api(
        `/api/agenda/${button.dataset.deleteAgenda}`,
        {
          method: "DELETE"
        }
      );

      toast(
        "Agenda berhasil dihapus."
      );

      await loadAgenda();
      await loadAdminAgenda();

    } catch (error) {
      toast(error.message);
    }
  }
);

/* =========================
   SETTINGS FORM
========================= */

$("#settingsForm")?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const button =
      event.submitter;

    if (button) {
      button.disabled = true;
    }

    try {

      await api(
        "/api/settings",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            class_name:
              $("#settingClassName")
                .value
                .trim(),

            founder:
              $("#settingFounder")
                .value
                .trim(),

            instagram:
              $("#settingInstagram")
                .value
                .trim()
          })
        }
      );

      toast(
        "Pengaturan berhasil disimpan."
      );

      await loadSettings();

    } catch (error) {

      toast(error.message);

    } finally {

      if (button) {
        button.disabled = false;
      }
    }
  }
);

/* =========================
   ADMIN MANAGEMENT
========================= */

async function loadAdmins() {

  const list =
    $("#adminList");

  if (!list) return;

  try {

    const data =
      await api("/api/admins");

    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML =
        `<div class="empty">Belum ada admin.</div>`;
      return;
    }

    data.forEach((admin) => {

      const item =
        document.createElement("div");

      item.className =
        "admin-data-item";

      item.innerHTML = `
        <div class="admin-data-main">
          <strong>
            ${escapeHTML(admin.email)}
          </strong>

          <span>
            ${escapeHTML(
              String(admin.role).toUpperCase()
            )}
          </span>
        </div>

        ${
          admin.role === "owner"
            ? `<span class="role-badge">OWNER</span>`
            : `
              <button
                type="button"
                class="btn danger small"
                data-delete-admin="${admin.id}"
              >
                Hapus
              </button>
            `
        }
      `;

      list.appendChild(item);
    });

  } catch (error) {

    list.innerHTML = `
      <div class="empty">
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}

$("#adminForm")?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const button =
      event.submitter;

    if (button) {
      button.disabled = true;
    }

    try {

      await api(
        "/api/admins",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            email:
              $("#adminEmailInput")
                .value
                .trim()
                .toLowerCase(),

            role:
              $("#adminRoleInput")
                .value
          })
        }
      );

      event.target.reset();

      toast(
        "Admin berhasil ditambahkan."
      );

      await loadAdmins();

    } catch (error) {

      toast(error.message);

    } finally {

      if (button) {
        button.disabled = false;
      }
    }
  }
);

$("#adminList")?.addEventListener(
  "click",
  async (event) => {

    const button =
      event.target.closest(
        "[data-delete-admin]"
      );

    if (!button) return;

    if (!confirm(
      "Yakin ingin menghapus admin ini?"
    )) {
      return;
    }

    try {

      await api(
        `/api/admins/${button.dataset.deleteAdmin}`,
        {
          method: "DELETE"
        }
      );

      toast(
        "Admin berhasil dihapus."
      );

      await loadAdmins();

    } catch (error) {
      toast(error.message);
    }
  }
);

/* =========================
   ADMIN DATA
========================= */

async function loadAdminData() {

  await Promise.allSettled([
    loadAdminStudents(),
    loadAdminGallery(),
    loadAdminAnnouncements(),
    loadAdminAgenda()
  ]);

}

/* =========================
   INITIALIZATION
========================= */

async function init() {

  console.log(
    "X MP 2 website starting..."
  );

  /*
    Masing-masing loader berdiri sendiri.
    Kalau satu error, yang lain tetap jalan.
  */

  await Promise.allSettled([
    loadSettings(),
    loadStudents(),
    loadGallery(),
    loadAnnouncements(),
    loadAgenda()
  ]);

  await checkLogin();

  console.log(
    "X MP 2 website loaded."
  );
}

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

} else {

  init();

       }
