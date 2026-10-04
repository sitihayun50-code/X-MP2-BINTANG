const API = "/api";

let currentUser = null;

const $ = (selector) => document.querySelector(selector);

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function request(url, options = {}) {
  const response = await fetch(API + url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Terjadi kesalahan.");
  }

  return data;
}

/* =========================
   LOAD WEBSITE
========================= */

async function loadWebsite() {
  try {
    const [
      settings,
      students,
      gallery,
      announcements,
      agenda
    ] = await Promise.all([
      request("/settings"),
      request("/students"),
      request("/gallery"),
      request("/announcements"),
      request("/agenda")
    ]);

    $("#heroClassName").textContent =
      settings.className || "X MP 2";

    $("#heroFounder").textContent =
      settings.founder || "NAZUAN AHMAD";

    document.title =
      `${settings.className || "X MP 2"} — ${settings.founder || "NAZUAN AHMAD"}`;

    renderStudents(students);
    renderGallery(gallery);
    renderAnnouncements(announcements);
    renderAgenda(agenda);

    loadSettingsForm(settings);

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   STUDENTS
========================= */

function renderStudents(students) {

  $("#studentCount").textContent =
    `${students.length} Siswa`;

  if (!students.length) {
    $("#studentList").innerHTML =
      `<p class="empty">Belum ada siswa.</p>`;
    return;
  }

  $("#studentList").innerHTML = students.map(student => {

    const photo =
      student.photo ||
      "/uploads/default.jpg";

    return `
      <article class="student-card">

        <img
          src="${photo}"
          alt="${escapeHTML(student.name)}"
          onerror="this.src='https://placehold.co/500x500?text=No+Photo'"
        >

        <div class="student-info">

          <h3>
            ${escapeHTML(student.name)}
          </h3>

          <p>
            ${escapeHTML(student.position || "Siswa")}
          </p>

        </div>

      </article>
    `;

  }).join("");
}

/* =========================
   GALLERY
========================= */

function renderGallery(gallery) {

  if (!gallery.length) {
    $("#galleryList").innerHTML =
      `<p class="empty">Belum ada foto galeri.</p>`;
    return;
  }

  $("#galleryList").innerHTML = gallery.map(item => `
    <figure class="gallery-card">

      <img
        src="${item.url}"
        alt="${escapeHTML(item.name)}"
      >

      <figcaption>
        ${escapeHTML(item.name)}
      </figcaption>

    </figure>
  `).join("");
}

/* =========================
   ANNOUNCEMENT
========================= */

function renderAnnouncements(items) {

  if (!items.length) {
    $("#announcementList").innerHTML =
      `<p class="empty">Belum ada pengumuman.</p>`;
    return;
  }

  $("#announcementList").innerHTML = items.map(item => `
    <article class="notice">

      <h3>
        ${escapeHTML(item.title)}
      </h3>

      <p>
        ${escapeHTML(item.content)}
      </p>

    </article>
  `).join("");
}

/* =========================
   AGENDA
========================= */

function renderAgenda(items) {

  if (!items.length) {
    $("#agendaList").innerHTML =
      `<p class="empty">Belum ada agenda.</p>`;
    return;
  }

  $("#agendaList").innerHTML = items.map(item => {

    const date = new Date(item.date);

    return `
      <article class="agenda-card">

        <h3>
          ${escapeHTML(item.title)}
        </h3>

        <p>
          ${date.toLocaleString("id-ID")}
        </p>

        <p>
          ${escapeHTML(item.description || "")}
        </p>

      </article>
    `;

  }).join("");
}

/* =========================
   AUTH
========================= */

async function checkLogin() {

  try {

    currentUser = await request("/auth/me");

    $("#adminDashboard")
      .classList
      .remove("hidden");

    $("#loginButton").textContent =
      currentUser.email;

    $("#adminInfo").textContent =
      `${currentUser.name || currentUser.email} · ${currentUser.role}`;

    if (currentUser.role !== "owner") {
      document
        .querySelector('[data-tab="admins"]')
        .classList.add("hidden");
    }

    await loadAdminData();

  } catch {

    currentUser = null;

  }

}

$("#loginButton").onclick = () => {

  window.location.href =
    "/auth/google";

};

$("#logoutButton").onclick = async () => {

  try {
    await request("/auth/logout", {
      method: "POST"
    });
  } catch {}

  location.reload();

};

/* =========================
   ADMIN TABS
========================= */

document.querySelectorAll("[data-tab]").forEach(button => {

  button.addEventListener("click", () => {

    const tab = button.dataset.tab;

    document
      .querySelectorAll(".admin-tabs button")
      .forEach(item =>
        item.classList.remove("active")
      );

    button.classList.add("active");

    document
      .querySelectorAll(".admin-tab")
      .forEach(panel =>
        panel.classList.add("hidden")
      );

    $(`#tab-${tab}`)
      .classList
      .remove("hidden");

  });

});

/* =========================
   ADMIN DATA
========================= */

async function loadAdminData() {

  const [
    students,
    gallery,
    announcements,
    agenda
  ] = await Promise.all([
    request("/students"),
    request("/gallery"),
    request("/announcements"),
    request("/agenda")
  ]);

  renderAdminStudents(students);
  renderAdminGallery(gallery);
  renderAdminAnnouncements(announcements);
  renderAdminAgenda(agenda);

  if (currentUser?.role === "owner") {
    loadAdmins();
  }

}

/* =========================
   ADD STUDENT
========================= */

$("#studentForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const form = event.target;
  const file = form.photo.files[0];

  try {

    let photo = "";

    if (file) {
      const uploaded = await uploadFile(file);
      photo = uploaded.url;
    }

    await request("/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: form.name.value,
        position: form.position.value,
        photo
      })
    });

    form.reset();

    await loadWebsite();
    await loadAdminData();

    alert("Siswa berhasil ditambahkan.");

  } catch (error) {

    alert(error.message);

  }

});

/* =========================
   ADMIN STUDENTS
========================= */

function renderAdminStudents(students) {

  if (!students.length) {

    $("#adminStudents").innerHTML =
      `<p class="empty">Belum ada siswa.</p>`;

    return;

  }

  $("#adminStudents").innerHTML = students.map(student => `
    <div class="admin-row">

      <div class="row-info">

        <strong>
          ${escapeHTML(student.name)}
        </strong>

        <span>
          ${escapeHTML(student.position || "Siswa")}
        </span>

      </div>

      <button
        class="small-danger"
        onclick="deleteStudent(${student.id})"
      >
        Hapus
      </button>

    </div>
  `).join("");

}

async function deleteStudent(id) {

  if (!confirm("Hapus siswa ini?")) {
    return;
  }

  try {

    await request(`/students/${id}`, {
      method: "DELETE"
    });

    await loadWebsite();
    await loadAdminData();

  } catch (error) {

    alert(error.message);

  }

}

/* =========================
   UPLOAD
========================= */

async function uploadFile(file) {

  const formData = new FormData();

  formData.append("photo", file);

  return request("/uploads", {
    method: "POST",
    body: formData
  });

}

$("#photoForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const form = event.target;
  const file = form.photo.files[0];

  if (!file) {
    alert("Pilih foto terlebih dahulu.");
    return;
  }

  try {

    const uploaded = await uploadFile(file);

    await request("/gallery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: form.name.value,
        url: uploaded.url,
        filename: uploaded.filename
      })
    });

    form.reset();

    await loadWebsite();
    await loadAdminData();

    alert("Foto berhasil diupload.");

  } catch (error) {

    alert(error.message);

  }

});

/* =========================
   GALLERY ADMIN
========================= */

function renderAdminGallery(items) {

  if (!items.length) {

    $("#adminGallery").innerHTML =
      `<p class="empty">Belum ada galeri.</p>`;

    return;

  }

  $("#adminGallery").innerHTML = items.map(item => `
    <div class="admin-row">

      <div class="row-info">

        <strong>
          ${escapeHTML(item.name)}
        </strong>

      </div>

      <button
        class="small-danger"
        onclick="deleteGallery(${item.id})"
      >
        Hapus
      </button>

    </div>
  `).join("");

}

async function deleteGallery(id) {

  if (!confirm("Hapus foto ini?")) {
    return;
  }

  try {

    await request(`/gallery/${id}`, {
      method: "DELETE"
    });

    await loadWebsite();
    await loadAdminData();

  } catch (error) {

    alert(error.message);

  }

}

/* =========================
   ANNOUNCEMENT
========================= */

$("#announcementForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const form = event.target;

  try {

    await request("/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: form.title.value,
        content: form.content.value
      })
    });

    form.reset();

    await loadWebsite();
    await loadAdminData();

    alert("Pengumuman berhasil dibuat.");

  } catch (error) {

    alert(error.message);

  }

});

function renderAdminAnnouncements(items) {

  $("#adminAnnouncements").innerHTML =
    items.map(item => `
      <div class="admin-row">

        <div class="row-info">
          <strong>${escapeHTML(item.title)}</strong>
        </div>

        <button
          class="small-danger"
          onclick="deleteAnnouncement(${item.id})"
        >
          Hapus
        </button>

      </div>
    `).join("");

}

async function deleteAnnouncement(id) {

  if (!confirm("Hapus pengumuman?")) return;

  try {

    await request(`/announcements/${id}`, {
      method: "DELETE"
    });

    await loadWebsite();
    await loadAdminData();

  } catch (error) {

    alert(error.message);

  }

}

/* =========================
   AGENDA
========================= */

$("#agendaForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const form = event.target;

  try {

    await request("/agenda", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: form.title.value,
        date: form.date.value,
        description: form.description.value
      })
    });

    form.reset();

    await loadWebsite();
    await loadAdminData();

    alert("Agenda berhasil ditambahkan.");

  } catch (error) {

    alert(error.message);

  }

});

function renderAdminAgenda(items) {

  $("#adminAgenda").innerHTML =
    items.map(item => `
      <div class="admin-row">

        <div class="row-info">

          <strong>
            ${escapeHTML(item.title)}
          </strong>

          <span>
            ${escapeHTML(item.date)}
          </span>

        </div>

        <button
          class="small-danger"
          onclick="deleteAgenda(${item.id})"
        >
          Hapus
        </button>

      </div>
    `).join("");

}

async function deleteAgenda(id) {

  if (!confirm("Hapus agenda?")) return;

  try {

    await request(`/agenda/${id}`, {
      method: "DELETE"
    });

    await loadWebsite();
    await loadAdminData();

  } catch (error) {

    alert(error.message);

  }

}

/* =========================
   SETTINGS
========================= */

function loadSettingsForm(settings) {

  const form = $("#settingsForm");

  form.className = "";

  form.className = "settings-form";

  form.className = "";

  form.elements.className.value =
    settings.className || "";

  form.elements.founder.value =
    settings.founder || "";

  form.elements.instagram.value =
    settings.instagram || "";

}

$("#settingsForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const form = event.target;

  try {

    await request("/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        className: form.className.value,
        founder: form.founder.value,
        instagram: form.instagram.value
      })
    });

    await loadWebsite();

    alert("Pengaturan berhasil disimpan.");

  } catch (error) {

    alert(error.message);

  }

});

/* =========================
   ADMIN MANAGEMENT
========================= */

async function loadAdmins() {

  if (currentUser?.role !== "owner") {
    return;
  }

  try {

    const admins = await request("/admins");

    $("#adminList").innerHTML =
      admins.map(admin => `
        <div class="admin-row">

          <div class="row-info">

            <strong>
              ${escapeHTML(admin.email)}
            </strong>

            <span>
              Role: ${escapeHTML(admin.role)}
            </span>

          </div>

          ${
            admin.role !== "owner"
              ? `
                <button
                  class="small-danger"
                  onclick="deleteAdmin(${admin.id})"
                >
                  Hapus
                </button>
              `
              : ""
          }

        </div>
      `).join("");

  } catch (error) {

    console.error(error);

  }

}

$("#adminForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const form = event.target;

  try {

    await request("/admins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: form.email.value,
        role: form.role.value
      })
    });

    form.reset();

    await loadAdmins();

    alert(
      "Gmail berhasil ditambahkan sebagai admin."
    );

  } catch (error) {

    alert(error.message);

  }

});

async function deleteAdmin(id) {

  if (!confirm("Hapus admin ini?")) {
    return;
  }

  try {

    await request(`/admins/${id}`, {
      method: "DELETE"
    });

    await loadAdmins();

  } catch (error) {

    alert(error.message);

  }

}

/* =========================
   START
========================= */

loadWebsite();
checkLogin();
