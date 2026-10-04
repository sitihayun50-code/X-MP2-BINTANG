"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function toast(message) {
  const el = $("#toast");

  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 3000);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options
  });

  const contentType = response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data.message
        ? data.message
        : `Request gagal (${response.status})`
    );
  }

  return data;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* MOBILE MENU */

const menuBtn = $("#menuBtn");
const navMenu = $("#navMenu");

if (menuBtn && navMenu) {
  menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
    });
  });
}

/* TABS */

$$(".tab").forEach((button) => {
  button.addEventListener("click", () => {

    $$(".tab").forEach((item) => {
      item.classList.remove("active");
    });

    $$(".tab-content").forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    const target = $(`#tab-${button.dataset.tab}`);

    if (target) {
      target.classList.add("active");
    }

    if (button.dataset.tab === "students") {
      loadAdminStudents();
    }

    if (button.dataset.tab === "gallery") {
      loadAdminGallery();
    }

    if (button.dataset.tab === "announcements") {
      loadAdminAnnouncements();
    }

    if (button.dataset.tab === "agenda") {
      loadAdminAgenda();
    }

    if (button.dataset.tab === "admins") {
      loadAdmins();
    }

  });
});

/* PUBLIC STUDENTS */

async function loadStudents() {

  try {

    const data = await request("/api/students");

    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    const list = $("#studentList");

    if (!list) return;

    list.innerHTML = data.map((student) => {

      const initials = String(student.name || "S")
        .split(" ")
        .slice(0, 2)
        .map(x => x[0])
        .join("")
        .toUpperCase();

      return `
        <article class="student-card">

          <div class="avatar">
            ${
              student.photo
                ? `<img src="${escapeHTML(student.photo)}"
                    style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`
                : escapeHTML(initials)
            }
          </div>

          <div>
            <h3>${escapeHTML(student.name)}</h3>
            <p>${escapeHTML(student.role || "Member Kelas")}</p>
          </div>

        </article>
      `;

    }).join("");

  } catch (error) {
    console.log("Students:", error.message);
  }
}

/* PUBLIC GALLERY */

async function loadGallery() {

  try {

    const data = await request("/api/gallery");

    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    const list = $("#galleryList");

    if (!list) return;

    list.innerHTML = data.map((item) => {

      return `
        <div class="gallery-card">

          <div class="gallery-placeholder">

            ${
              item.image
                ? `<img src="${escapeHTML(item.image)}" alt="">`
                : escapeHTML(item.title || "X MP 2")
            }

          </div>

          <div class="gallery-info">

            <h3>${escapeHTML(item.title || "Dokumentasi")}</h3>

            <p>Dokumentasi kelas X MP 2</p>

          </div>

        </div>
      `;

    }).join("");

  } catch (error) {
    console.log("Gallery:", error.message);
  }
}

/* PUBLIC ANNOUNCEMENTS */

async function loadAnnouncements() {

  try {

    const data = await request("/api/announcements");

    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    const list = $("#announcementList");

    if (!list) return;

    list.innerHTML = data.map((item) => {

      return `
        <article class="announcement">

          <div class="announcement-icon">!</div>

          <div>

            <h3>${escapeHTML(item.title)}</h3>

            <p>${escapeHTML(item.content)}</p>

            <small>
              ${escapeHTML(item.created_at || "Pengumuman Kelas")}
            </small>

          </div>

        </article>
      `;

    }).join("");

  } catch (error) {
    console.log("Announcements:", error.message);
  }
}

/* PUBLIC AGENDA */

async function loadAgenda() {

  try {

    const data = await request("/api/agenda");

    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    const list = $("#agendaList");

    if (!list) return;

    list.innerHTML = data.map((item) => {

      let dateText = "--";

      if (item.date) {
        dateText = item.date.slice(8, 10);
      }

      return `
        <article class="agenda">

          <div class="date-box">

            <strong>${escapeHTML(dateText)}</strong>

            <span>DATE</span>

          </div>

          <div>

            <h3>${escapeHTML(item.title)}</h3>

            <p>${escapeHTML(item.description || "")}</p>

          </div>

        </article>
      `;

    }).join("");

  } catch (error) {
    console.log("Agenda:", error.message);
  }
}

/* LOGIN */

async function checkLogin() {

  try {

    const user = await request("/api/auth/me");

    if (!user || !user.loggedIn) {
      return;
    }

    $("#loginBox").hidden = true;
    $("#dashboard").hidden = false;

    const ownerElements = $$(".owner-only");

    ownerElements.forEach((element) => {
      element.style.display =
        user.role === "owner" ? "" : "none";
    });

    loadAdminStudents();

  } catch (error) {

    console.log("Login:", error.message);

  }
}

/* LOGOUT */

const logoutBtn = $("#logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    try {

      await request("/api/auth/logout", {
        method: "POST"
      });

      location.reload();

    } catch (error) {

      toast(error.message);

    }

  });

}

/* UPLOAD */

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

  return await request("/api/uploads", {
    method: "POST",
    body: formData
  });

}

/* ADD STUDENT */

const studentForm = $("#studentForm");

if (studentForm) {

  studentForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

      const form = new FormData(studentForm);

      let photo = null;

      const file = form.get("photo");

      if (file && file.size > 0) {
        const result = await uploadImage(file);
        photo = result.url;
      }

      await request("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.get("name"),
          role: form.get("role"),
          photo
        })
      });

      studentForm.reset();

      toast("Siswa berhasil ditambahkan.");

      await loadStudents();
      await loadAdminStudents();

    } catch (error) {

      toast(error.message);

    }

  });

}

/* ADMIN STUDENTS */

async function loadAdminStudents() {

  const list = $("#adminStudentList");

  if (!list) return;

  try {

    const data = await request("/api/students");

    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = "<p>Tidak ada siswa.</p>";
      return;
    }

    data.forEach((student) => {

      const item = document.createElement("div");

      item.className = "admin-item";

      item.innerHTML = `
        <div>
          <strong>${escapeHTML(student.name)}</strong>
          <small>${escapeHTML(student.role || "")}</small>
        </div>

        <button class="delete-btn">
          Hapus
        </button>
      `;

      item.querySelector("button").onclick = async () => {

        if (!confirm(`Hapus ${student.name}?`)) {
          return;
        }

        try {

          await request(`/api/students/${student.id}`, {
            method: "DELETE"
          });

          toast("Siswa dihapus.");

          loadAdminStudents();
          loadStudents();

        } catch (error) {

          toast(error.message);

        }

      };

      list.appendChild(item);

    });

  } catch (error) {

    list.innerHTML = `<p>${escapeHTML(error.message)}</p>`;

  }
}

/* PHOTO FORM */

const photoForm = $("#photoForm");

if (photoForm) {

  photoForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

      const form = new FormData(photoForm);

      const file = form.get("photo");

      const result = await uploadImage(file);

      await request("/api/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: form.get("title"),
          image: result.url
        })
      });

      photoForm.reset();

      toast("Foto berhasil diupload.");

      loadGallery();
      loadAdminGallery();

    } catch (error) {

      toast(error.message);

    }

  });

}

/* ADMIN GALLERY */

async function loadAdminGallery() {

  const list = $("#adminGalleryList");

  if (!list) return;

  try {

    const data = await request("/api/gallery");

    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = "<p>Galeri kosong.</p>";
      return;
    }

    data.forEach((item) => {

      const div = document.createElement("div");

      div.className = "admin-item";

      div.innerHTML = `
        <div>
          <strong>${escapeHTML(item.title)}</strong>
        </div>

        <button class="delete-btn">
          Hapus
        </button>
      `;

      div.querySelector("button").onclick = async () => {

        try {

          await request(`/api/gallery/${item.id}`, {
            method: "DELETE"
          });

          toast("Foto dihapus.");

          loadGallery();
          loadAdminGallery();

        } catch (error) {

          toast(error.message);

        }

      };

      list.appendChild(div);

    });

  } catch (error) {

    list.innerHTML = `<p>${escapeHTML(error.message)}</p>`;

  }
}

/* ANNOUNCEMENT */

const announcementForm = $("#announcementForm");

if (announcementForm) {

  announcementForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

      const form = new FormData(announcementForm);

      await request("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: form.get("title"),
          content: form.get("content")
        })
      });

      announcementForm.reset();

      toast("Pengumuman diterbitkan.");

      loadAnnouncements();
      loadAdminAnnouncements();

    } catch (error) {

      toast(error.message);

    }

  });

}

async function loadAdminAnnouncements() {

  const list = $("#adminAnnouncementList");

  if (!list) return;

  try {

    const data = await request("/api/announcements");

    list.innerHTML = "";

    data.forEach((item) => {

      const div = document.createElement("div");

      div.className = "admin-item";

      div.innerHTML = `
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <small>${escapeHTML(item.content)}</small>
        </div>

        <button class="delete-btn">Hapus</button>
      `;

      div.querySelector("button").onclick = async () => {

        try {

          await request(`/api/announcements/${item.id}`, {
            method: "DELETE"
          });

          toast("Pengumuman dihapus.");

          loadAnnouncements();
          loadAdminAnnouncements();

        } catch (error) {

          toast(error.message);

        }

      };

      list.appendChild(div);

    });

  } catch (error) {

    list.innerHTML = `<p>${escapeHTML(error.message)}</p>`;

  }
}

/* AGENDA */

const agendaForm = $("#agendaForm");

if (agendaForm) {

  agendaForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

      const form = new FormData(agendaForm);

      await request("/api/agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: form.get("title"),
          date: form.get("date"),
          description: form.get("description")
        })
      });

      agendaForm.reset();

      toast("Agenda ditambahkan.");

      loadAgenda();
      loadAdminAgenda();

    } catch (error) {

      toast(error.message);

    }

  });

}

async function loadAdminAgenda() {

  const list = $("#adminAgendaList");

  if (!list) return;

  try {

    const data = await request("/api/agenda");

    list.innerHTML = "";

    data.forEach((item) => {

      const div = document.createElement("div");

      div.className = "admin-item";

      div.innerHTML = `
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <small>${escapeHTML(item.date || "")}</small>
        </div>

        <button class="delete-btn">Hapus</button>
      `;

      div.querySelector("button").onclick = async () => {

        try {

          await request(`/api/agenda/${item.id}`, {
            method: "DELETE"
          });

          toast("Agenda dihapus.");

          loadAgenda();
          loadAdminAgenda();

        } catch (error) {

          toast(error.message);

        }

      };

      list.appendChild(div);

    });

  } catch (error) {

    list.innerHTML = `<p>${escapeHTML(error.message)}</p>`;

  }
}

/* SETTINGS */

const settingsForm = $("#settingsForm");

if (settingsForm) {

  settingsForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

      const form = new FormData(settingsForm);

      await request("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          className: form.get("className"),
          founder: form.get("founder"),
          instagram: form.get("instagram")
        })
      });

      toast("Pengaturan disimpan.");

    } catch (error) {

      toast(error.message);

    }

  });

}

/* ADMIN MANAGEMENT */

const adminForm = $("#adminForm");

if (adminForm) {

  adminForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    try {

      const form = new FormData(adminForm);

      await request("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: form.get("email"),
          role: form.get("role")
        })
      });

      adminForm.reset();

      toast("Admin berhasil ditambahkan.");

      loadAdmins();

    } catch (error) {

      toast(error.message);

    }

  });

}

async function loadAdmins() {

  const list = $("#adminList");

  if (!list) return;

  try {

    const data = await request("/api/admins");

    list.innerHTML = "";

    data.forEach((admin) => {

      const div = document.createElement("div");

      div.className = "admin-item";

      div.innerHTML = `
        <div>
          <strong>${escapeHTML(admin.email)}</strong>
          <small>${escapeHTML(admin.role)}</small>
        </div>

        <button class="delete-btn">Hapus</button>
      `;

      div.querySelector("button").onclick = async () => {

        if (!confirm(`Hapus admin ${admin.email}?`)) {
          return;
        }

        try {

          await request(`/api/admins/${admin.id}`, {
            method: "DELETE"
          });

          toast("Admin dihapus.");

          loadAdmins();

        } catch (error) {

          toast(error.message);

        }

      };

      list.appendChild(div);

    });

  } catch (error) {

    list.innerHTML = `<p>${escapeHTML(error.message)}</p>`;

  }
}

/* INITIAL LOAD */

async function init() {

  /*
   * BAGIAN WEBSITE TIDAK MENUNGGU LOGIN.
   * Data default sudah ada di HTML.
   */

  loadStudents();
  loadGallery();
  loadAnnouncements();
  loadAgenda();

  checkLogin();

}

document.addEventListener("DOMContentLoaded", init);
