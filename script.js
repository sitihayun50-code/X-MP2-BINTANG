const CLASS_NAME = "X MP 2";

const INSTAGRAM_USERNAME = "@kelas_xmp2";
const INSTAGRAM_URL = "https://instagram.com/";

const STORAGE_KEY = "xmp2_students";
const THEME_KEY = "xmp2_theme";
const VISITOR_KEY = "xmp2_visitor_name";


// ================================
// DATA SISWA
// ================================

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
        nama: "Nama Siswa 5",
        jabatan: "Siswa",
        kelas: CLASS_NAME,
        foto: "foto/siswa5.jpg"
    },
    {
        nama: "Nama Siswa 6",
        jabatan: "Siswa",
        kelas: CLASS_NAME,
        foto: "foto/siswa6.jpg"
    },
    {
        nama: "Nama Siswa 7",
        jabatan: "Siswa",
        kelas: CLASS_NAME,
        foto: "foto/siswa7.jpg"
    },
    {
        nama: "Nama Siswa 8",
        jabatan: "Siswa",
        kelas: CLASS_NAME,
        foto: "foto/siswa8.jpg"
    }
];


// ================================
// ELEMENT
// ================================

const nameModal = document.getElementById("nameModal");
const visitorNameInput = document.getElementById("visitorNameInput");
const enterWebsiteBtn = document.getElementById("enterWebsiteBtn");

const visitorName = document.getElementById("visitorName");
const dashboardVisitorName =
    document.getElementById("dashboardVisitorName");

const changeNameBtn =
    document.getElementById("changeNameBtn");

const themeBtn =
    document.getElementById("themeBtn");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const studentGrid =
    document.getElementById("studentGrid");

const totalStudents =
    document.getElementById("totalStudents");

const studentSearch =
    document.getElementById("studentSearch");

const addStudentBtn =
    document.getElementById("addStudentBtn");

const studentModal =
    document.getElementById("studentModal");

const closeStudentModal =
    document.getElementById("closeStudentModal");

const studentForm =
    document.getElementById("studentForm");


// ================================
// NAMA PENGUNJUNG
// ================================

function loadVisitorName() {

    const savedName =
        localStorage.getItem(VISITOR_KEY);

    if (savedName) {

        showVisitorName(savedName);

        nameModal.classList.add("hidden");

    } else {

        nameModal.classList.remove("hidden");

        setTimeout(() => {
            visitorNameInput.focus();
        }, 300);
    }
}


function saveVisitorName() {

    const name =
        visitorNameInput.value.trim();

    if (!name) {

        visitorNameInput.focus();

        visitorNameInput.placeholder =
            "Nama wajib diisi!";

        return;
    }

    localStorage.setItem(
        VISITOR_KEY,
        name
    );

    showVisitorName(name);

    nameModal.classList.add("hidden");

    visitorNameInput.value = "";
}


function showVisitorName(name) {

    visitorName.textContent = name;

    dashboardVisitorName.textContent = name;
}


enterWebsiteBtn.addEventListener(
    "click",
    saveVisitorName
);


visitorNameInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {
            saveVisitorName();
        }

    }
);


// ================================
// GANTI NAMA
// ================================

changeNameBtn.addEventListener(
    "click",
    function() {

        const currentName =
            localStorage.getItem(VISITOR_KEY);

        visitorNameInput.value =
            currentName || "";

        nameModal.classList.remove("hidden");

        setTimeout(() => {
            visitorNameInput.focus();
            visitorNameInput.select();
        }, 100);

    }
);


// ================================
// DARK MODE
// ================================

function loadTheme() {

    const savedTheme =
        localStorage.getItem(THEME_KEY);

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }

}


themeBtn.addEventListener(
    "click",
    function() {

        document.body.classList.toggle("dark");

        const isDark =
            document.body.classList.contains("dark");

        localStorage.setItem(
            THEME_KEY,
            isDark ? "dark" : "light"
        );

    }
);


// ================================
// MOBILE SIDEBAR
// ================================

menuBtn.addEventListener(
    "click",
    function() {

        sidebar.classList.toggle("open");

    }
);


document.querySelectorAll(".nav-link")
.forEach(link => {

    link.addEventListener(
        "click",
        function() {

            if (
                window.innerWidth <= 800
            ) {
                sidebar.classList.remove("open");
            }

        }
    );

});


// ================================
// DATA SISWA
// ================================

function getStudents() {

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return defaultStudents;
    }

    try {

        return JSON.parse(saved);

    } catch {

        return defaultStudents;

    }

}


function saveStudents(students) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(students)
    );

}


// ================================
// RENDER SISWA
// ================================

function renderStudents(
    students = getStudents()
) {

    studentGrid.innerHTML = "";

    totalStudents.textContent =
        students.length;


    if (students.length === 0) {

        studentGrid.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:40px;
                color:var(--muted);
            ">
                Tidak ada data siswa.
            </div>
        `;

        return;
    }


    students.forEach(
        (student, index) => {

            const card =
                document.createElement("div");

            card.className =
                "student-card";


            card.innerHTML = `

                <button
                    class="delete-student"
                    title="Hapus siswa"
                    data-index="${index}"
                >
                    ×
                </button>

                <div class="student-photo">

                    <img
                        src="${escapeHTML(student.foto)}"
                        alt="${escapeHTML(student.nama)}"
                        onerror="imageFallback(this, '${escapeHTML(student.nama.charAt(0).toUpperCase())}')"
                    >

                </div>

                <div class="student-info">

                    <h3>
                        ${escapeHTML(student.nama)}
                    </h3>

                    <p>
                        ${escapeHTML(student.jabatan)}
                    </p>

                    <small>
                        ${CLASS_NAME}
                    </small>

                </div>
            `;


            studentGrid.appendChild(card);

        }
    );


    document.querySelectorAll(
        ".delete-student"
    ).forEach(button => {

        button.addEventListener(
            "click",
            function() {

                const index =
                    Number(
                        this.dataset.index
                    );

                deleteStudent(index);

            }
        );

    });

}


// ================================
// HAPUS SISWA
// ================================

function deleteStudent(index) {

    const students =
        getStudents();

    if (!confirm(
        "Hapus data siswa ini?"
    )) {
        return;
    }

    students.splice(index, 1);

    saveStudents(students);

    renderStudents();

}


// ================================
// SEARCH
// ================================

studentSearch.addEventListener(
    "input",
    function() {

        const keyword =
            this.value.toLowerCase().trim();

        const students =
            getStudents();

        const filtered =
            students.filter(student =>

                student.nama
                    .toLowerCase()
                    .includes(keyword)

                ||

                student.jabatan
                    .toLowerCase()
                    .includes(keyword)

            );

        renderStudents(filtered);

    }
);


// ================================
// MODAL TAMBAH SISWA
// ================================

addStudentBtn.addEventListener(
    "click",
    function() {

        studentModal.classList.remove(
            "hidden"
        );

    }
);


closeStudentModal.addEventListener(
    "click",
    function() {

        studentModal.classList.add(
            "hidden"
        );

    }
);


studentModal.addEventListener(
    "click",
    function(event) {

        if (event.target === studentModal) {

            studentModal.classList.add(
                "hidden"
            );

        }

    }
);


// ================================
// TAMBAH SISWA
// ================================

studentForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const nama =
            document.getElementById(
                "studentName"
            ).value.trim();

        const jabatan =
            document.getElementById(
                "studentPosition"
            ).value.trim() || "Siswa";

        let foto =
            document.getElementById(
                "studentPhoto"
            ).value.trim();


        if (!nama) {
            return;
        }


        if (!foto) {

            foto =
                "foto/default.jpg";

        } else if (
            !foto.startsWith("foto/")
        ) {

            foto =
                "foto/" + foto;

        }


        const students =
            getStudents();


        students.push({

            nama: nama,

            jabatan: jabatan,

            kelas: CLASS_NAME,

            foto: foto

        });


        saveStudents(students);

        renderStudents();


        studentForm.reset();

        document.getElementById(
            "studentPosition"
        ).value = "Siswa";


        studentModal.classList.add(
            "hidden"
        );

    }
);


// ================================
// ESCAPE HTML
// ================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ================================
// FOTO FALLBACK
// ================================

function imageFallback(
    image,
    text = "X MP 2"
) {

    image.style.display = "none";

    const parent =
        image.parentElement;

    if (!parent) {
        return;
    }

    parent.style.display =
        "flex";

    parent.style.alignItems =
        "center";

    parent.style.justifyContent =
        "center";

    parent.style.color =
        "var(--muted)";

    parent.style.fontWeight =
        "bold";

    parent.style.fontSize =
        "13px";

    parent.innerHTML =
        `<span>${escapeHTML(text)}</span>`;

}


// ================================
// INIT
// ================================

loadTheme();

loadVisitorName();

renderStudents();


// ================================
// ACTIVE NAV
// ================================

const sections =
    document.querySelectorAll(
        "section[id]"
    );

const navLinks =
    document.querySelectorAll(
        ".nav-link"
    );


window.addEventListener(
    "scroll",
    function() {

        let current = "";

        sections.forEach(section => {

            const sectionTop =
                section.offsetTop - 130;

            if (
                window.scrollY >=
                sectionTop
            ) {

                current =
                    section.getAttribute(
                        "id"
                    );

            }

        });


        navLinks.forEach(link => {

            link.classList.remove(
                "active"
            );

            if (
                link.getAttribute("href") ===
                "#" + current
            ) {

                link.classList.add(
                    "active"
                );

            }

        });

    }
);
