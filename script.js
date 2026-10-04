const CLASS_NAME = "X MP 2";

const STORAGE_KEY = "xmp2_students_v2";
const GALLERY_KEY = "xmp2_gallery_v2";
const VISITOR_KEY = "xmp2_visitor_name";
const THEME_KEY = "xmp2_theme";


// =====================================
// DATA DEFAULT
// =====================================

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


const defaultGallery = [
    {
        nama: "Foto Kelas",
        foto: "foto/foto-kelas.jpg"
    },
    {
        nama: "Galeri 1",
        foto: "foto/galeri1.jpg"
    },
    {
        nama: "Galeri 2",
        foto: "foto/galeri2.jpg"
    },
    {
        nama: "Galeri 3",
        foto: "foto/galeri3.jpg"
    }
];


// =====================================
// ELEMENT
// =====================================

const nameModal =
    document.getElementById("nameModal");

const visitorNameInput =
    document.getElementById("visitorNameInput");

const enterWebsiteBtn =
    document.getElementById("enterWebsiteBtn");

const visitorName =
    document.getElementById("visitorName");

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

const structureGrid =
    document.getElementById("structureGrid");

const studentSearch =
    document.getElementById("studentSearch");

const totalStudents =
    document.getElementById("totalStudents");

const totalGallery =
    document.getElementById("totalGallery");

const galleryGrid =
    document.getElementById("galleryGrid");

const adminStudentList =
    document.getElementById("adminStudentList");

const adminGalleryList =
    document.getElementById("adminGalleryList");

const adminAddStudentBtn =
    document.getElementById("adminAddStudentBtn");

const galleryUpload =
    document.getElementById("galleryUpload");

const studentModal =
    document.getElementById("studentModal");

const closeStudentModal =
    document.getElementById("closeStudentModal");

const studentForm =
    document.getElementById("studentForm");

const studentModalTitle =
    document.getElementById("studentModalTitle");

const studentName =
    document.getElementById("studentName");

const studentPosition =
    document.getElementById("studentPosition");

const studentClass =
    document.getElementById("studentClass");

const studentPhotoFile =
    document.getElementById("studentPhotoFile");

const studentPreview =
    document.getElementById("studentPreview");


// =====================================
// NAMA PENGUNJUNG
// =====================================

function loadVisitorName() {

    const saved =
        localStorage.getItem(VISITOR_KEY);

    if (saved) {

        showVisitorName(saved);

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

    dashboardVisitorName.textContent =
        name;

}


enterWebsiteBtn.addEventListener(
    "click",
    saveVisitorName
);


visitorNameInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            saveVisitorName();
        }

    }
);


changeNameBtn.addEventListener(
    "click",
    () => {

        visitorNameInput.value =
            localStorage.getItem(VISITOR_KEY) || "";

        nameModal.classList.remove("hidden");

        setTimeout(() => {
            visitorNameInput.focus();
            visitorNameInput.select();
        }, 100);

    }
);


// =====================================
// THEME
// =====================================

function loadTheme() {

    if (
        localStorage.getItem(THEME_KEY)
        === "dark"
    ) {

        document.body.classList.add("dark");

    }

}


themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle("dark");

        localStorage.setItem(
            THEME_KEY,
            document.body.classList.contains("dark")
                ? "dark"
                : "light"
        );

    }
);


// =====================================
// MOBILE MENU
// =====================================

menuBtn.addEventListener(
    "click",
    () => {
        sidebar.classList.toggle("open");
    }
);


document.querySelectorAll(".nav-link")
.forEach(link => {

    link.addEventListener(
        "click",
        () => {

            if (window.innerWidth <= 800) {
                sidebar.classList.remove("open");
            }

        }
    );

});


// =====================================
// STUDENT STORAGE
// =====================================

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


// =====================================
// GALLERY STORAGE
// =====================================

function getGallery() {

    const saved =
        localStorage.getItem(GALLERY_KEY);

    if (!saved) {
        return defaultGallery;
    }

    try {
        return JSON.parse(saved);
    } catch {
        return defaultGallery;
    }

}


function saveGallery(gallery) {

    localStorage.setItem(
        GALLERY_KEY,
        JSON.stringify(gallery)
    );

}


// =====================================
// RENDER SISWA
// =====================================

function renderStudents(
    students = getStudents()
) {

    studentGrid.innerHTML = "";

    totalStudents.textContent =
        students.length;


    if (!students.length) {

        studentGrid.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:40px;
                color:var(--muted);
            ">
                Belum ada data siswa.
            </div>
        `;

        return;
    }


    students.forEach(student => {

        const card =
            document.createElement("div");

        card.className =
            "student-card";

        card.innerHTML = `

            <div class="student-photo">

                <img
                    src="${safe(student.foto)}"
                    alt="${safe(student.nama)}"
                    onerror="imageFallback(this, 'Siswa')"
                >

            </div>

            <div class="student-info">

                <h3>
                    ${safe(student.nama)}
                </h3>

                <p>
                    ${safe(student.jabatan)}
                </p>

                <small>
                    ${safe(student.kelas)}
                </small>

            </div>
        `;

        studentGrid.appendChild(card);

    });

}


// =====================================
// STRUKTUR
// =====================================

function renderStructure() {

    const students =
        getStudents();

    const structure =
        students.filter(student =>
            [
                "Ketua Kelas",
                "Wakil Ketua",
                "Sekretaris",
                "Bendahara"
            ].includes(student.jabatan)
        );


    structureGrid.innerHTML = "";


    if (!structure.length) {

        structureGrid.innerHTML = `
            <div style="
                grid-column:1/-1;
                color:var(--muted);
            ">
                Struktur belum tersedia.
            </div>
        `;

        return;
    }


    structure.forEach(
        (student, index) => {

            const card =
                document.createElement("div");

            card.className =
                "structure-card";


            card.innerHTML = `

                <div class="structure-photo">

                    <img
                        src="${safe(student.foto)}"
                        alt="${safe(student.nama)}"
                        onerror="imageFallback(this, 'X')"
                    >

                </div>

                <div>

                    <span>
                        ${String(index + 1).padStart(2,"0")}
                    </span>

                    <h3>
                        ${safe(student.jabatan)}
                    </h3>

                    <p>
                        ${safe(student.nama)}
                    </p>

                    <small>
                        ${safe(student.kelas)}
                    </small>

                </div>
            `;


            structureGrid.appendChild(card);

        }
    );

}


// =====================================
// ADMIN SISWA
// =====================================

function renderAdminStudents() {

    const students =
        getStudents();

    adminStudentList.innerHTML = "";


    students.forEach(
        (student, index) => {

            const row =
                document.createElement("div");

            row.className =
                "admin-student";


            row.innerHTML = `

                <div class="admin-student-photo">

                    <img
                        src="${safe(student.foto)}"
                        alt="${safe(student.nama)}"
                        onerror="imageFallback(this, 'Siswa')"
                    >

                </div>

                <div class="admin-student-info">

                    <strong>
                        ${safe(student.nama)}
                    </strong>

                    <span>
                        ${safe(student.jabatan)}
                        • ${safe(student.kelas)}
                    </span>

                </div>

                <div class="admin-actions">

                    <button
                        class="edit-btn"
                        data-edit="${index}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        data-delete="${index}"
                    >
                        Hapus
                    </button>

                </div>
            `;


            adminStudentList.appendChild(row);

        }
    );


    document.querySelectorAll(
        "[data-edit]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openEditStudent(
                    Number(button.dataset.edit)
                );

            }
        );

    });


    document.querySelectorAll(
        "[data-delete]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteStudent(
                    Number(button.dataset.delete)
                );

            }
        );

    });

}


// =====================================
// TAMBAH / EDIT SISWA
// =====================================

let editingStudentIndex = -1;
let editingPhoto = "";


adminAddStudentBtn.addEventListener(
    "click",
    () => {

        editingStudentIndex = -1;
        editingPhoto = "";

        studentModalTitle.textContent =
            "Tambah Siswa";

        studentForm.reset();

        studentPosition.value =
            "Siswa";

        studentPreview.style.display =
            "none";

        studentModal.classList.remove(
            "hidden"
        );

    }
);


function openEditStudent(index) {

    const students =
        getStudents();

    const student =
        students[index];

    if (!student) return;


    editingStudentIndex =
        index;

    editingPhoto =
        student.foto;


    studentModalTitle.textContent =
        "Edit Siswa";


    studentName.value =
        student.nama;

    studentPosition.value =
        student.jabatan;

    studentClass.value =
        student.kelas;


    studentPreview.innerHTML = `
        <img src="${safe(student.foto)}"
             alt="Preview">
    `;

    studentPreview.style.display =
        "block";


    studentModal.classList.remove(
        "hidden"
    );

}


closeStudentModal.addEventListener(
    "click",
    () => {

        studentModal.classList.add(
            "hidden"
        );

    }
);


studentModal.addEventListener(
    "click",
    event => {

        if (
            event.target === studentModal
        ) {

            studentModal.classList.add(
                "hidden"
            );

        }

    }
);


// =====================================
// PREVIEW FOTO SISWA
// =====================================

studentPhotoFile.addEventListener(
    "change",
    function() {

        const file =
            this.files[0];

        if (!file) return;


        if (!file.type.startsWith("image/")) {

            alert(
                "File harus berupa gambar."
            );

            this.value = "";

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                editingPhoto =
                    event.target.result;

                studentPreview.innerHTML = `
                    <img
                        src="${event.target.result}"
                        alt="Preview"
                    >
                `;

                studentPreview.style.display =
                    "block";

            };


        reader.readAsDataURL(file);

    }
);


// =====================================
// SIMPAN SISWA
// =====================================

studentForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const nama =
            studentName.value.trim();

        const jabatan =
            studentPosition.value.trim();

        const kelas =
            studentClass.value;


        if (!nama) {

            alert(
                "Nama siswa wajib diisi."
            );

            return;

        }


        if (!editingPhoto) {

            editingPhoto =
                "foto/default.jpg";

        }


        const students =
            getStudents();


        const data = {

            nama,
            jabatan: jabatan || "Siswa",
            kelas,
            foto: editingPhoto

        };


        if (editingStudentIndex === -1) {

            students.push(data);

        } else {

            students[editingStudentIndex] =
                data;

        }


        saveStudents(students);


        renderStudents();
        renderStructure();
        renderAdminStudents();


        studentModal.classList.add(
            "hidden"
        );


        editingStudentIndex = -1;
        editingPhoto = "";

    }
);


// =====================================
// HAPUS SISWA
// =====================================

function deleteStudent(index) {

    const students =
        getStudents();


    if (!confirm(
        `Hapus siswa "${students[index].nama}"?`
    )) {

        return;

    }


    students.splice(index, 1);

    saveStudents(students);


    renderStudents();
    renderStructure();
    renderAdminStudents();

}


// =====================================
// SEARCH
// =====================================

studentSearch.addEventListener(
    "input",
    function() {

        const keyword =
            this.value
                .toLowerCase()
                .trim();


        const filtered =
            getStudents().filter(
                student =>

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


// =====================================
// GALERI
// =====================================

function renderGallery() {

    const gallery =
        getGallery();

    galleryGrid.innerHTML = "";

    totalGallery.textContent =
        gallery.length;


    gallery.forEach(photo => {

        const item =
            document.createElement("div");

        item.className =
            "gallery-item";


        item.innerHTML = `
            <img
                src="${safe(photo.foto)}"
                alt="${safe(photo.nama)}"
                onerror="imageFallback(this, 'Gallery')"
            >
        `;


        galleryGrid.appendChild(item);

    });

}


// =====================================
// ADMIN GALERI
// =====================================

function renderAdminGallery() {

    const gallery =
        getGallery();

    adminGalleryList.innerHTML = "";


    gallery.forEach(
        (photo, index) => {

            const item =
                document.createElement("div");

            item.className =
                "admin-gallery-item";


            item.innerHTML = `

                <div class="admin-gallery-image">

                    <img
                        src="${safe(photo.foto)}"
                        alt="${safe(photo.nama)}"
                    >

                </div>

                <div class="admin-gallery-name">
                    ${safe(photo.nama)}
                </div>

                <button
                    class="delete-btn"
                    data-gallery-delete="${index}"
                >
                    Hapus Foto
                </button>
            `;


            adminGalleryList.appendChild(item);

        }
    );


    document.querySelectorAll(
        "[data-gallery-delete]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteGallery(
                    Number(
                        button.dataset.galleryDelete
                    )
                );

            }
        );

    });

}


// =====================================
// UPLOAD GALERI
// =====================================

galleryUpload.addEventListener(
    "change",
    function() {

        const files =
            Array.from(this.files);


        if (!files.length) return;


        const gallery =
            getGallery();


        let completed = 0;


        files.forEach(file => {

            if (
                !file.type.startsWith("image/")
            ) {

                completed++;

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    gallery.push({

                        nama:
                            file.name,

                        foto:
                            event.target.result

                    });


                    completed++;


                    if (
                        completed === files.length
                    ) {

                        saveGallery(gallery);

                        renderGallery();
                        renderAdminGallery();

                        galleryUpload.value = "";

                    }

                };


            reader.readAsDataURL(file);

        });

    }
);


// =====================================
// HAPUS GALERI
// =====================================

function deleteGallery(index) {

    const gallery =
        getGallery();


    if (!confirm(
        "Hapus foto galeri ini?"
    )) {

        return;

    }


    gallery.splice(index, 1);

    saveGallery(gallery);


    renderGallery();
    renderAdminGallery();

}


// =====================================
// ESCAPE HTML
// =====================================

function safe(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================
// IMAGE FALLBACK
// =====================================

function imageFallback(
    image,
    text = "X MP 2"
) {

    image.style.display =
        "none";


    const parent =
        image.parentElement;


    if (!parent) return;


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

    parent.innerHTML =
        `<span>${safe(text)}</span>`;

}


// =====================================
// ACTIVE NAV
// =====================================

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
    () => {

        let current = "";


        sections.forEach(section => {

            const top =
                section.offsetTop - 130;


            if (
                window.scrollY >= top
            ) {

                current =
                    section.id;

            }

        });


        navLinks.forEach(link => {

            link.classList.remove(
                "active"
            );


            if (
                link.getAttribute("href")
                === "#" + current
            ) {

                link.classList.add(
                    "active"
                );

            }

        });

    }
);


// =====================================
// INIT
// =====================================

loadTheme();

loadVisitorName();

renderStudents();

renderStructure();

renderGallery();

renderAdminStudents();

renderAdminGallery();
