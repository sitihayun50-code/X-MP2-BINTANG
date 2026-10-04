/* =========================================
   X MP 2 — CLASS PORTAL
   ========================================= */

const CLASS_NAME = "X MP 2";

const INSTAGRAM_USERNAME = "@kelas_xmp2";

const INSTAGRAM_URL = "https://instagram.com/";

const STORAGE_KEY = "xmp2_students";

const THEME_KEY = "xmp2_theme";


/* =========================================
   DATA SISWA
   ========================================= */

const defaultStudents = [

    {
        nama: "Nama Ketua",
        jabatan: "Ketua Kelas",
        kelas: CLASS_NAME,
        foto: "foto/siswa1.jpg"
    },

    {
        nama: "Nama Wakil",
        jabatan: "Wakil Ketua",
        kelas: CLASS_NAME,
        foto: "foto/siswa2.jpg"
    },

    {
        nama: "Nama Sekretaris",
        jabatan: "Sekretaris",
        kelas: CLASS_NAME,
        foto: "foto/siswa3.jpg"
    },

    {
        nama: "Nama Bendahara",
        jabatan: "Bendahara",
        kelas: CLASS_NAME,
        foto: "foto/siswa4.jpg"
    },

    {
        nama: "Nama Siswa 05",
        jabatan: "Siswa",
        kelas: CLASS_NAME,
        foto: "foto/siswa5.jpg"
    },

    {
        nama: "Nama Siswa 06",
        jabatan: "Siswa",
        kelas: CLASS_NAME,
        foto: "foto/siswa6.jpg"
    },

    {
        nama: "Nama Siswa 07",
        jabatan: "Siswa",
        kelas: CLASS_NAME,
        foto: "foto/siswa7.jpg"
    },

    {
        nama: "Nama Siswa 08",
        jabatan: "Siswa",
        kelas: CLASS_NAME,
        foto: "foto/siswa8.jpg"
    }

];


/* =========================================
   LOAD DATA
   ========================================= */

let students;

try {

    const saved = localStorage.getItem(STORAGE_KEY);

    students = saved
        ? JSON.parse(saved)
        : [...defaultStudents];

} catch (error) {

    students = [...defaultStudents];

}


/* =========================================
   ELEMENT
   ========================================= */

const studentsGrid =
    document.getElementById("studentsGrid");

const officers =
    document.getElementById("officers");

const totalStudents =
    document.getElementById("totalStudents");

const totalOfficers =
    document.getElementById("totalOfficers");

const searchStudent =
    document.getElementById("searchStudent");

const studentModal =
    document.getElementById("studentModal");

const addStudentBtn =
    document.getElementById("addStudentBtn");

const closeModal =
    document.getElementById("closeModal");

const studentForm =
    document.getElementById("studentForm");

const studentName =
    document.getElementById("studentName");

const studentPosition =
    document.getElementById("studentPosition");

const studentPhoto =
    document.getElementById("studentPhoto");

const themeBtn =
    document.getElementById("themeBtn");

const themeIcon =
    document.getElementById("themeIcon");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const overlay =
    document.getElementById("overlay");


/* =========================================
   IMAGE FALLBACK
   ========================================= */

function imageFallback(image, text = "X MP 2") {

    if (!image || image.dataset.fallback === "true") {
        return;
    }

    image.dataset.fallback = "true";

    const container = image.parentElement;

    image.style.display = "none";

    container.classList.add("image-placeholder");

    if (!container.querySelector(".fallback-text")) {

        const fallback = document.createElement("div");

        fallback.className = "fallback-text";

        fallback.textContent = text;

        container.appendChild(fallback);

    }

}


/* =========================================
   INITIALS
   ========================================= */

function getInitials(name) {

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join("");

}


/* =========================================
   SAVE
   ========================================= */

function saveStudents() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(students)
    );

}


/* =========================================
   RENDER STUDENTS
   ========================================= */

function renderStudents(keyword = "") {

    studentsGrid.innerHTML = "";

    const search =
        keyword.toLowerCase().trim();


    const filtered =
        students.filter(student =>
            student.nama
                .toLowerCase()
                .includes(search)
        );


    if (filtered.length === 0) {

        studentsGrid.innerHTML = `
            <div class="empty-state">
                Tidak ada siswa yang ditemukan.
            </div>
        `;

        return;

    }


    filtered.forEach((student) => {

        const index =
            students.indexOf(student);


        const card =
            document.createElement("article");

        card.className = "student-card";


        card.innerHTML = `

            <div class="student-photo">

                <img
                    src="${student.foto || "foto/logo.png"}"
                    alt="${escapeHTML(student.nama)}"
                    onerror="imageFallback(this, '${escapeHTML(getInitials(student.nama))}')"
                >

                <button
                    class="delete-student"
                    title="Hapus siswa"
                    onclick="deleteStudent(${index})"
                >
                    ×
                </button>

            </div>


            <div class="student-info">

                <h3>
                    ${escapeHTML(student.nama)}
                </h3>

                <p>
                    ${escapeHTML(student.jabatan)}
                    ·
                    ${escapeHTML(student.kelas)}
                </p>

            </div>

        `;


        studentsGrid.appendChild(card);

    });


    updateStats();

}


/* =========================================
   RENDER OFFICERS
   ========================================= */

function renderOfficers() {

    officers.innerHTML = "";


    const officerList =
        students.filter(student =>
            student.jabatan !== "Siswa"
        );


    officerList.forEach(student => {

        const card =
            document.createElement("article");

        card.className = "officer-card";


        card.innerHTML = `

            <div class="officer-photo">

                <img
                    src="${student.foto || "foto/logo.png"}"
                    alt="${escapeHTML(student.nama)}"
                    onerror="imageFallback(this, '${escapeHTML(getInitials(student.nama))}')"
                >

            </div>


            <div class="officer-info">

                <span>
                    ${escapeHTML(student.jabatan)}
                </span>

                <h3>
                    ${escapeHTML(student.nama)}
                </h3>

            </div>

        `;


        officers.appendChild(card);

    });


    updateStats();

}


/* =========================================
   UPDATE STATISTICS
   ========================================= */

function updateStats() {

    totalStudents.textContent =
        students.length;


    const officerCount =
        students.filter(student =>
            student.jabatan !== "Siswa"
        ).length;


    totalOfficers.textContent =
        officerCount;

}


/* =========================================
   DELETE
   ========================================= */

function deleteStudent(index) {

    const student =
        students[index];


    const confirmDelete =
        confirm(
            `Hapus ${student.nama} dari daftar siswa?`
        );


    if (!confirmDelete) {
        return;
    }


    students.splice(index, 1);

    saveStudents();

    renderStudents(searchStudent.value);

    renderOfficers();

}


/* =========================================
   ESCAPE HTML
   ========================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* =========================================
   ADD STUDENT
   ========================================= */

studentForm.addEventListener("submit", function(event) {

    event.preventDefault();


    const name =
        studentName.value.trim();

    const position =
        studentPosition.value;

    let photo =
        studentPhoto.value.trim();


    if (!name) {
        return;
    }


    if (!photo) {

        photo = "logo.png";

    }


    if (
        !photo.startsWith("foto/")
    ) {

        photo =
            "foto/" + photo;

    }


    students.push({

        nama: name,

        jabatan: position,

        kelas: CLASS_NAME,

        foto: photo

    });


    saveStudents();

    renderStudents();

    renderOfficers();


    studentForm.reset();

    studentModal.classList.remove("show");

});


/* =========================================
   MODAL
   ========================================= */

addStudentBtn.addEventListener(
    "click",
    () => {

        studentModal.classList.add("show");

    }
);


closeModal.addEventListener(
    "click",
    () => {

        studentModal.classList.remove("show");

    }
);


studentModal.addEventListener(
    "click",
    event => {

        if (
            event.target === studentModal
        ) {

            studentModal.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================
   SEARCH
   ========================================= */

searchStudent.addEventListener(
    "input",
    event => {

        renderStudents(
            event.target.value
        );

    }
);


/* =========================================
   DARK MODE
   ========================================= */

function updateThemeButton() {

    const isDark =
        document.body.classList.contains("dark");


    themeIcon.textContent =
        isDark ? "☀" : "☾";

}


function loadTheme() {

    const theme =
        localStorage.getItem(THEME_KEY);


    if (theme === "dark") {

        document.body.classList.add("dark");

    }


    updateThemeButton();

}


themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle("dark");


        const isDark =
            document.body.classList.contains("dark");


        localStorage.setItem(
            THEME_KEY,
            isDark ? "dark" : "light"
        );


        updateThemeButton();

    }
);


/* =========================================
   MOBILE SIDEBAR
   ========================================= */

function closeSidebar() {

    sidebar.classList.remove("open");

    overlay.classList.remove("show");

}


menuBtn.addEventListener(
    "click",
    () => {

        sidebar.classList.add("open");

        overlay.classList.add("show");

    }
);


overlay.addEventListener(
    "click",
    closeSidebar
);


document
    .querySelectorAll(".nav-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            closeSidebar
        );

    });


/* =========================================
   ACTIVE NAVIGATION
   ========================================= */

const sections =
    document.querySelectorAll("section[id]");

const navLinks =
    document.querySelectorAll(".nav-link");


window.addEventListener(
    "scroll",
    () => {

        let current = "";


        sections.forEach(section => {

            const sectionTop =
                section.offsetTop - 150;

            if (
                window.scrollY >= sectionTop
            ) {

                current =
                    section.getAttribute("id");

            }

        });


        navLinks.forEach(link => {

            link.classList.remove("active");


            if (
                link.getAttribute("href") ===
                `#${current}`
            ) {

                link.classList.add("active");

            }

        });

    }
);


/* =========================================
   INSTAGRAM
   ========================================= */

document.getElementById(
    "instagramName"
).textContent =
    INSTAGRAM_USERNAME;


document.getElementById(
    "infoInstagram"
).textContent =
    INSTAGRAM_USERNAME;


document.getElementById(
    "instagramLink"
).href =
    INSTAGRAM_URL;


/* =========================================
   IMAGE PLACEHOLDER STYLE
   ========================================= */

const placeholderStyle =
    document.createElement("style");

placeholderStyle.textContent = `

    .image-placeholder {
        display: flex !important;
        align-items: center;
        justify-content: center;
        background:
            linear-gradient(
                135deg,
                #181b20,
                #30343b
            );
    }

    .fallback-text {
        color: white;
        font-size: 22px;
        font-weight: 800;
        letter-spacing: 1px;
        text-align: center;
    }

    .empty-state {
        grid-column: 1 / -1;
        padding: 40px;
        text-align: center;
        border: 1px dashed var(--border);
        border-radius: 18px;
        color: var(--muted);
        background: var(--card);
        font-size: 12px;
    }

`;

document.head.appendChild(
    placeholderStyle
);


/* =========================================
   START
   ========================================= */

loadTheme();

renderStudents();

renderOfficers();

updateStats();
