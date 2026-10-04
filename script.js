"use strict";

/* =========================
   BASIC HELPERS
========================= */

const $ = (selector) => document.querySelector(selector);

const escapeHTML = (value) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || `Request gagal (${response.status})`);
  }

  return data;
}

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
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

$("#menuBtn").addEventListener("click", () => {
  $("#mainNav").classList.toggle("open");
});

document.querySelectorAll("#mainNav a").forEach((link) => {
  link.addEventListener("click", () => {
    $("#mainNav").classList.remove("open");
  });
});

/* =========================
   SETTINGS
========================= */

async function loadSettings() {
  const data = await api("/api/settings");

  document.title = `${data.class_name || "X MP 2"} — ${data.founder || "NAZUAN AHMAD"}`;

  const heroTitle = document.querySelector(".hero h1");
  const founder = document.querySelector(".founder strong");
  const brand = document.querySelector(".brand strong");

  if (heroTitle) {
    heroTitle.textContent = data.class_name || "X MP 2";
  }

  if (brand) {
    brand.textContent = data.class_name || "X MP 2";
  }

  if (founder) {
    founder.textContent = data.founder || "NAZUAN AHMAD";
  }
}

async function loadSettingsForm() {
  const data = await api("/api/settings");

  $("#settingClassName").value = data.class_name || "";
  $("#settingFounder").value = data.founder || "";
  $("#settingInstagram").value = data.instagram || "";
}

/* =========================
   STUDENTS
========================= */

async function loadStudents() {
  const loading = $("#studentLoading");
  const list = $("#studentList");
  const empty = $("#studentEmpty");

  loading.classList.remove("hidden");

  try {
    const students = await api("/api/students");

    list.innerHTML = "";

    if (!students.length) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    students.forEach((student) => {
      const card = document.createElement("article");

      card.className = "student-card";

      card.innerHTML = `
        <img
          src="${escapeHTML(student.photo || "/default-student.svg")}"
          alt="${escapeHTML(student.name)}"
          onerror="this.src='/default-student.svg'"
        >

        <div class="student-body">
          <h3>${escapeHTML(student.name)}</h3>
          <p>${escapeHTML(student.info || "Siswa X MP 2")}</p>
        </div>
      `;

      list.appendChild(card);
    });

  } catch (error) {
    list.innerHTML = `<div class="empty">Gagal memuat siswa: ${escapeHTML(error.message)}</div>`;
  } finally {
    loading.classList.add("hidden");
  }
}

/* =========================
   GALLERY
========================= */

async function loadGallery() {
  const loading = $("#galleryLoading");
  const list = $("#galleryList");
  const empty = $("#galleryEmpty");

  loading.classList.remove("hidden");

  try {
    const gallery = await api("/api/gallery");

    list.innerHTML = "";

    if (!gallery.length) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    gallery.forEach((item) => {
      const card = document.createElement("article");

      card.className = "gallery-card";

      card.innerHTML = `
        <img
          src="${escapeHTML(item.image)}"
          alt="${escapeHTML(item.title)}"
          onerror="this.style.display='none'"
        >

        <div class="gallery-title">
          ${escapeHTML(item.title)}
        </div>
      `;

      list.appendChild(card);
    });

  } catch (error) {
    list.innerHTML = `<div class="empty">Gagal memuat galeri: ${escapeHTML(error.message)}</div>`;
  } finally {
    loading.classList.add("hidden");
  }
}

/* =========================
   ANNOUNCEMENTS
========================= */

async function loadAnnouncements() {
  const loading = $("#announcementLoading");
  const list = $("#announcementList");
  const empty = $("#announcementEmpty");

  loading.classList.remove("hidden");

  try {
    const announcements = await api("/api/announcements");

    list.innerHTML = "";

    if (!announcements.length) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    announcements.forEach((item) => {
      const card = document.createElement("article");

      card.className = "announcement-card";

      card.innerHTML = `
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.content)}</p>
        <span class="date">
          ${formatDate(item.created_at)}
        </span>
      `;

      list.appendChild(card);
    });

  } catch (error) {
    list.innerHTML = `<div class="empty">Gagal memuat pengumuman: ${escapeHTML(error.message)}</div>`;
  } finally {
    loading.classList.add("hidden");
  }
}

/* =========================
   AGENDA
========================= */

async function loadAgenda() {
  const loading = $("#agendaLoading");
  const list = $("#agendaList");
  const empty = $("#agendaEmpty");

  loading.classList.remove("hidden");

  try {
    const agenda = await api("/api/agenda");

    list.innerHTML = "";

    if (!agenda.length) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    agenda.forEach((item) => {
      const date = new Date(item.event_date);

      const day = Number.isNaN(date.getTime())
        ? "-"
        : date.getDate();

      const month = Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleDateString("id-ID", {
            month: "short"
          });

      const card = document.createElement("article");

      card.className = "agenda-card";

      card.innerHTML = `
        <div class="agenda-date">
          <div>${day}</div>
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
    list.innerHTML = `<div class="empty">Gagal memuat agenda: ${escapeHTML(error.message)}</div>`;
  } finally {
    loading.classList.add("hidden");
  }
}

/* =========================
   AUTH
========================= */

async function checkLogin() {
  try {
    const result = await api("/api/auth/me");

    if (!result.loggedIn) {
      $("#loginBox").classList.remove("hidden");
      $("#dashboard").classList.add("hidden");
      return;
    }

    $("#loginBox").classList.add("hidden");
    $("#dashboard").classList.remove("hidden");

    $("#adminName").textContent = result.user.name || "Admin";
    $("#adminEmail").textContent = result.user.email || "";
    $("#adminRole").textContent = String(result.user.role || "admin").toUpperCase();

    const isOwner = result.user.role === "owner";

    document.querySelectorAll(".owner-only").forEach((element) => {
      element.classList.toggle("hidden", !isOwner);
    });

    await loadAdminData();

  } catch (error) {
    console.error("Auth error:", error);

    $("#loginBox").classList.remove("hidden");
    $("#dashboard").classList.add("hidden");
  }
}

$("#googleLoginBtn").addEventListener("click", () => {
  window.location.href = "/auth/google";
});

$("#logoutBtn").addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", {
      method: "POST"
    });

    showToast("Berhasil logout.");

    setTimeout(() => {
      window.location.reload();
    }, 500);

  } catch (error) {
    showToast(error.message);
  }
});

/* =========================
   ADMIN TABS
========================= */

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", async () => {

    if (tab.classList.contains("hidden")) {
      return;
    }

    const target = tab.dataset.tab;

    document.querySelectorAll(".tab").forEach((item) => {
      item.classList.remove("active");
    });

    document.querySelectorAll(".tab-content").forEach((item) => {
      item.classList.remove("active");
    });

    tab.classList.add("active");

    const content = document.querySelector(`#tab-${target}`);

    if (content) {
      content.classList.add("active");
    }

    if (target === "settings") {
      await loadSettingsForm();
    }

    if (target === "admins") {
      await loadAdmins();
    }
  });
});

/* =========================
   UPLOAD IMAGE
========================= */

async function uploadImage(file) {
  if (!file) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Ukuran gambar maksimal 10 MB.");
  }

  const formData = new FormData();

  formData.append("image", file);

  return await api("/api/uploads", {
    method: "POST",
    body: formData
  });
}

/* =========================
   ADD STUDENT
========================= */

$("#studentForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = event.submitter;

  button.disabled = true;

  try {
    const name = $("#studentName").value.trim();
    const info = $("#studentInfo").value.trim();
    const file = $("#studentPhoto").files[0];

    let photo = null;

    if (file) {
      const uploaded = await uploadImage(file);
      photo = uploaded.url;
    }

    await api("/api/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        info,
        photo
      })
    });

    event.target.reset();

    showToast("Siswa berhasil ditambahkan.");

    await loadStudents();
    await loadAdminStudents();

  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

/* =========================
   ADMIN STUDENTS
========================= */

async function loadAdminStudents() {
  const list = $("#adminStudentList");

  try {
    const students = await api("/api/students");

    list.innerHTML = "";

    if (!students.length) {
      list.innerHTML = `<div class="empty">Belum ada siswa.</div>`;
      return;
    }

    students.forEach((student) => {

      const item = document.createElement("div");

      item.className = "admin-data-item";

      item.innerHTML = `
        <div class="admin-data-main">
          <strong>${escapeHTML(student.name)}</strong>
          <span>${escapeHTML(student.info || "Siswa")}</span>
        </div>

        <button
          class="btn danger small"
          data-delete-student="${student.id}"
          type="button"
        >
          Hapus
        </button>
      `;

      list.appendChild(item);
    });

  } catch (error) {
    list.innerHTML = `<div class="empty">${escapeHTML(error.message)}</div>`;
  }
}

$("#adminStudentList").addEventListener("click", async (event) => {

  const button = event.target.closest("[data-delete-student]");

  if (!button) return;

  const id = button.dataset.deleteStudent;

  if (!confirm("Hapus siswa ini?")) return;

  try {

    await api(`/api/students/${id}`, {
      method: "DELETE"
    });

    showToast("Siswa berhasil dihapus.");

    await loadStudents();
    await loadAdminStudents();

  } catch (error) {
    showToast(error.message);
  }
});

/* =========================
   UPLOAD GALLERY
========================= */

$("#uploadForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = event.submitter;

  button.disabled = true;

  try {

    const title = $("#photoTitle").value.trim();
    const file = $("#photoFile").files[0];

    if (!file) {
      throw new Error("Pilih foto terlebih dahulu.");
    }

    const uploaded = await uploadImage(file);

    await api("/api/gallery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        image: uploaded.url
      })
    });

    event.target.reset();

    showToast("Foto berhasil diupload.");

    await loadGallery();
    await loadAdminGallery();

  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

/* =========================
   ADMIN GALLERY
========================= */

async function loadAdminGallery() {
  const list = $("#adminGalleryList");

  try {

    const gallery = await api("/api/gallery");

    list.innerHTML = "";

    if (!gallery.length) {
      list.innerHTML = `<div class="empty">Belum ada foto.</div>`;
      return;
    }

    gallery.forEach((item) => {

      const element = document.createElement("div");

      element.className = "admin-data-item";

      element.innerHTML = `
        <div class="admin-data-main">
          <strong>${escapeHTML(item.title)}</strong>
          <span>${escapeHTML(item.image)}</span>
        </div>

        <button
          class="btn danger small"
          data-delete-gallery="${item.id}"
          type="button"
        >
          Hapus
        </button>
      `;

      list.appendChild(element);
    });

  } catch (error) {
    list.innerHTML = `<div class="empty">${escapeHTML(error.message)}</div>`;
  }
}

$("#adminGalleryList").addEventListener("click", async (event) => {

  const button = event.target.closest("[data-delete-gallery]");

  if (!button) return;

  const id = button.dataset.deleteGallery;

  if (!confirm("Hapus foto ini?")) return;

  try {

    await api(`/api/gallery/${id}`, {
      method: "DELETE"
    });

    showToast("Foto berhasil dihapus.");

    await loadGallery();
    await loadAdminGallery();

  } catch (error) {
    showToast(error.message);
  }
});

/* =========================
   ANNOUNCEMENT FORM
========================= */

$("#announcementForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const button = event.submitter;

  button.disabled = true;

  try {

    await api("/api/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: $("#announcementTitle").value.trim(),
        content: $("#announcementContent").value.trim()
      })
    });

    event.target.reset();

    showToast("Pengumuman berhasil dibuat.");

    await loadAnnouncements();
    await loadAdminAnnouncements();

  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

/* =========================
   ADMIN ANNOUNCEMENTS
========================= */

async function loadAdminAnnouncements() {

  const list = $("#adminAnnouncementList");

  try {

    const data = await api("/api/announcements");

    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML = `<div class="empty">Belum ada pengumuman.</div>`;
      return;
    }

    data.forEach((item) => {

      const element = document.createElement("div");

      element.className = "admin-data-item";

      element.innerHTML = `
        <div class="admin-data-main">
          <strong>${escapeHTML(item.title)}</strong>
          <span>${escapeHTML(formatDate(item.created_at))}</span>
        </div>

        <button
          class="btn danger small"
          data-delete-announcement="${item.id}"
          type="button"
        >
          Hapus
        </button>
      `;

      list.appendChild(element);
    });

  } catch (error) {
    list.innerHTML = `<div class="empty">${escapeHTML(error.message)}</div>`;
  }
}

$("#adminAnnouncementList").addEventListener("click", async (event) => {

  const button = event.target.closest("[data-delete-announcement]");

  if (!button) return;

  if (!confirm("Hapus pengumuman ini?")) return;

  try {

    await api(`/api/announcements/${button.dataset.deleteAnnouncement}`, {
      method: "DELETE"
    });

    showToast("Pengumuman berhasil dihapus.");

    await loadAnnouncements();
    await loadAdminAnnouncements();

  } catch (error) {
    showToast(error.message);
  }
});

/* =========================
   AGENDA FORM
========================= */

$("#agendaForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const button = event.submitter;

  button.disabled = true;

  try {

    await api("/api/agenda", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: $("#agendaTitle").value.trim(),
        event_date: $("#agendaDate").value,
        description: $("#agendaDescription").value.trim()
      })
    });

    event.target.reset();

    showToast("Agenda berhasil ditambahkan.");

    await loadAgenda();
    await loadAdminAgenda();

  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

/* =========================
   ADMIN AGENDA
========================= */

async function loadAdminAgenda() {

  const list = $("#adminAgendaList");

  try {

    const data = await api("/api/agenda");

    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML = `<div class="empty">Belum ada agenda.</div>`;
      return;
    }

    data.forEach((item) => {

      const element = document.createElement("div");

      element.className = "admin-data-item";

      element.innerHTML = `
        <div class="admin-data-main">
          <strong>${escapeHTML(item.title)}</strong>
          <span>${escapeHTML(item.event_date)}</span>
        </div>

        <button
          class="btn danger small"
          data-delete-agenda="${item.id}"
          type="button"
        >
          Hapus
        </button>
      `;

      list.appendChild(element);
    });

  } catch (error) {
    list.innerHTML = `<div class="empty">${escapeHTML(error.message)}</div>`;
  }
}

$("#adminAgendaList").addEventListener("click", async (event) => {

  const button = event.target.closest("[data-delete-agenda]");

  if (!button) return;

  if (!confirm("Hapus agenda ini?")) return;

  try {

    await api(`/api/agenda/${button.dataset.deleteAgenda}`, {
      method: "DELETE"
    });

    showToast("Agenda berhasil dihapus.");

    await loadAgenda();
    await loadAdminAgenda();

  } catch (error) {
    showToast(error.message);
  }
});

/* =========================
   SETTINGS FORM
========================= */

$("#settingsForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const button = event.submitter;

  button.disabled = true;

  try {

    await api("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        class_name: $("#settingClassName").value.trim(),
        founder: $("#settingFounder").value.trim(),
        instagram: $("#settingInstagram").value.trim()
      })
    });

    showToast("Pengaturan berhasil disimpan.");

    await loadSettings();

  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

/* =========================
   ADMIN MANAGEMENT
========================= */

async function loadAdmins() {

  const list = $("#adminList");

  try {

    const data = await api("/api/admins");

    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML = `<div class="empty">Belum ada admin.</div>`;
      return;
    }

    data.forEach((admin) => {

      const item = document.createElement("div");

      item.className = "admin-data-item";

      const canDelete = admin.role !== "owner";

      item.innerHTML = `
        <div class="admin-data-main">
          <strong>${escapeHTML(admin.email)}</strong>
          <span>${escapeHTML(admin.role.toUpperCase())}</span>
        </div>

        ${
          canDelete
            ? `
              <button
                class="btn danger small"
                data-delete-admin="${admin.id}"
                type="button"
              >
                Hapus
              </button>
            `
            : `<span class="role-badge">OWNER</span>`
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

$("#adminForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const button = event.submitter;

  button.disabled = true;

  try {

    await api("/api/admins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: $("#adminEmailInput").value.trim().toLowerCase(),
        role: $("#adminRoleInput").value
      })
    });

    event.target.reset();

    showToast("Admin berhasil ditambahkan.");

    await loadAdmins();

  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

$("#adminList").addEventListener("click", async (event) => {

  const button = event.target.closest("[data-delete-admin]");

  if (!button) return;

  if (!confirm("Hapus admin ini?")) return;

  try {

    await api(`/api/admins/${button.dataset.deleteAdmin}`, {
      method: "DELETE"
    });

    showToast("Admin berhasil dihapus.");

    await loadAdmins();

  } catch (error) {
    showToast(error.message);
  }
});

/* =========================
   LOAD ADMIN DATA
========================= */

async function loadAdminData() {

  await Promise.all([
    loadAdminStudents(),
    loadAdminGallery(),
    loadAdminAnnouncements(),
    loadAdminAgenda()
  ]);

}

/* =========================
   INITIAL LOAD
========================= */

async function loadWebsite() {

  await Promise.all([
    loadSettings(),
    loadStudents(),
    loadGallery(),
    loadAnnouncements(),
    loadAgenda()
  ]);

  await checkLogin();
}

document.addEventListener("DOMContentLoaded", loadWebsite);
