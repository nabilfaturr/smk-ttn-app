import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, ImageRun,
  AlignmentType, WidthType, BorderStyle, ShadingType,
  PageBreak, TabStopType, TabStopPosition,
} from "docx"
import fs from "fs"
import path from "path"

const SCREENSHOT_DIR = path.join(__dirname, "../tests/e2e/screenshots-bab4")
const OUTPUT_PATH = path.join(__dirname, "../read/BAB IV - Hasil dan Pembahasan.docx")

const FONT = "Times New Roman"
const SIZE = 24 // 12pt
const HEADING_SIZE = 24 // 12pt, bold

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "000000" }
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER }

function img(name: string, width = 420, height = 253) {
  const filePath = path.join(SCREENSHOT_DIR, name)
  if (!fs.existsSync(filePath)) {
    return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `[Gambar: ${name} - file tidak ditemukan]`, italics: true, font: FONT, size: 20 })] })
  }
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 80 },
    children: [new ImageRun({
      type: "png",
      data: fs.readFileSync(filePath),
      transformation: { width, height },
    })],
  })
}

function caption(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text, font: FONT, size: 20, bold: true })],
  })
}

function body(text: string) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 360 },
    children: [new TextRun({ text, font: FONT, size: SIZE })],
  })
}

function h1(text: string) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120, line: 360 },
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: FONT, size: SIZE, bold: true })],
  })
}

function h2(text: string) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 100, line: 360 },
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: FONT, size: SIZE, bold: true })],
  })
}

function h3(text: string) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 160, after: 100, line: 360 },
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: FONT, size: SIZE, bold: true })],
  })
}

function keterangan(items: string[]) {
  const paras: Paragraph[] = [
    new Paragraph({
      spacing: { before: 40, after: 60 },
      children: [new TextRun({ text: "Keterangan:", font: FONT, size: SIZE, bold: true })],
    }),
  ]
  for (let i = 0; i < items.length; i++) {
    paras.push(new Paragraph({
      spacing: { after: 20, line: 320 },
      indent: { left: 360 },
      children: [new TextRun({ text: `${i + 1}. ${items[i]}`, font: FONT, size: SIZE })],
    }))
  }
  return paras
}

function makeCell(text: string, width: number, opts?: { bold?: boolean; shading?: string; align?: AlignmentType }) {
  return new TableCell({
    borders: BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: opts?.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [new Paragraph({
      alignment: opts?.align ?? AlignmentType.LEFT,
      spacing: { line: 300 },
      children: [new TextRun({ text, font: FONT, size: 20, bold: opts?.bold ?? false })],
    })],
  })
}

function makeTableHeader(cols: string[], widths: number[]) {
  return new TableRow({
    children: cols.map((c, i) => makeCell(c, widths[i], { bold: true, shading: "D9E2F3" })),
  })
}

function makeTableRow(cols: string[], widths: number[]) {
  return new TableRow({
    children: cols.map((c, i) => makeCell(c, widths[i])),
  })
}

function tableCaption(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: FONT, size: SIZE, bold: true })],
  })
}

// ============================================================
// MAIN DOCUMENT
// ============================================================
const children: any[] = []

// BAB IV HEADING
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 40, line: 360 },
    children: [new TextRun({ text: "BAB IV", font: FONT, size: SIZE, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, line: 360 },
    children: [new TextRun({ text: "HASIL DAN PEMBAHASAN", font: FONT, size: SIZE, bold: true })],
  }),
)

// Pembuka
children.push(body("Bab ini menguraikan dua tahapan lanjutan dari model pengembangan Waterfall yang belum diuraikan pada Bab III, yaitu tahap implementasi sistem dan tahap pengujian. Tahap implementasi merupakan tahap penerjemahan hasil rancangan yang telah dijabarkan pada Bab III ke dalam bentuk kode program yang membentuk suatu perangkat lunak yang dapat dijalankan. Tahap pengujian merupakan tahap evaluasi fungsionalitas sistem menggunakan metode Black Box Testing untuk memastikan seluruh fitur berfungsi sesuai dengan kebutuhan yang telah didefinisikan pada tahap analisis. Adapun sub bab implementasi sistem menguraikan tampilan antarmuka dari setiap halaman yang telah diimplementasikan beserta penjelasan fungsionalitasnya, sedangkan sub bab pengujian menguraikan rancangan kasus uji dan hasil pengujian terhadap seluruh use case yang telah dijabarkan pada Sub Bab 3.1.2."))

// ============================================================
// 4.1 IMPLEMENTASI SISTEM
// ============================================================
children.push(h1("4.1 Implementasi Sistem"))

children.push(body("Implementasi sistem merupakan tahap penerjemahan rancangan antarmuka pengguna, rancangan basis data, dan rancangan arsitektur sistem yang telah dijabarkan pada Sub Bab 3.2 ke dalam bentuk aplikasi yang dapat dijalankan. Sistem dibangun menggunakan framework Electron.js dengan React.js sebagai pustaka antarmuka pengguna, TypeScript sebagai bahasa pemrograman, dan SQLite sebagai sistem manajemen basis data lokal. Basis data dirancang menggunakan Drizzle ORM yang menyediakan abstraksi query bertipe aman (type-safe) di atas SQLite. Seluruh kode program diimplementasikan sesuai dengan struktur arsitektur hybrid online-offline yang telah dirancang pada Sub Bab 3.2.1, di mana setiap perangkat pengguna menjalankan instansi aplikasi yang mandiri dengan basis data lokal, dan dilengkapi mesin sinkronisasi yang berjalan di latar belakang untuk mengintegrasikan data ke layanan cloud Firebase ketika koneksi internet tersedia. Berikut adalah penjelasan mengenai implementasi antarmuka dari setiap halaman pada sistem yang telah dibangun."))

// 4.1.1 Login
children.push(h2("4.1.1 Halaman Login"))
children.push(body("Halaman login merupakan halaman pertama yang ditampilkan ketika pengguna membuka aplikasi. Halaman ini berfungsi sebagai mekanisme autentikasi untuk memvalidasi identitas pengguna sebelum mengakses fitur-fitur di dalam sistem. Setiap pengguna yang telah terdaftar di dalam basis data dapat memasukkan kombinasi username dan password yang sesuai untuk masuk ke dalam sistem."))
children.push(caption("Gambar 4.1 Halaman Login"))
children.push(img("gambar-4-1-halaman-login.png"))
children.push(...keterangan([
  "Logo dan nama SMK Taruna Tekno Nusantara",
  "Field input username untuk memasukkan nama pengguna",
  "Field input password untuk memasukkan kata sandi",
  `Tombol "Masuk" untuk mengirimkan data kredensial ke sistem`,
]))
children.push(body(`Ketika pengguna menekan tombol "Masuk", sistem akan memvalidasi kombinasi username dan password terhadap data yang tersimpan di tabel users pada basis data lokal SQLite. Apabila kredensial yang dimasukkan valid, sistem akan mengarahkan pengguna ke halaman dashboard sesuai dengan role yang dimilikinya, yaitu admin, wali kelas, atau guru. Selain melalui username dan password, guru juga dapat melakukan login menggunakan kode_login yang merupakan kode unik yang dihasilkan sistem pada saat pembuatan akun guru. Apabila kredensial yang dimasukkan tidak valid, sistem akan menampilkan notifikasi kesalahan dan pengguna diminta untuk memasukkan kembali kredensial yang benar.`))

// 4.1.2 Dashboard
children.push(h2("4.1.2 Halaman Dashboard"))
children.push(body("Halaman dashboard merupakan halaman utama yang ditampilkan setelah pengguna berhasil melakukan login. Halaman ini menyajikan ringkasan data statistik yang relevan dengan role pengguna yang sedang aktif. Tampilan dashboard terbagi menjadi dua area utama, yaitu sidebar navigasi di sisi kiri dan area konten di sisi kanan. Sidebar navigasi menampilkan daftar menu yang dapat diakses oleh pengguna sesuai dengan role masing-masing, sebagaimana telah dijabarkan pada Sub Bab 3.1.2. Menu yang ditampilkan bersifat dinamis berdasarkan role pengguna yang sedang login, sehingga setiap role hanya melihat menu yang relevan dengan tugasnya."))
children.push(caption("Gambar 4.2 Halaman Dashboard Admin"))
children.push(img("gambar-4-2-dashboard-admin.png"))
children.push(...keterangan([
  "Sidebar navigasi menu yang menampilkan seluruh menu yang tersedia untuk role admin",
  "Kartu ringkasan statistik yang menampilkan total siswa, total kelas, total guru, dan tahun ajaran yang sedang aktif",
  "Header yang menampilkan informasi role dan nama pengguna yang sedang login",
  "Tombol untuk memperkecil (collapse) sidebar",
]))
children.push(body("Pada dashboard admin, ditampilkan empat kartu ringkasan statistik yang masing-masing menampilkan total siswa yang terdaftar di seluruh kelas, total kelas yang tersedia pada tahun ajaran aktif, total guru yang terdaftar di sistem, dan informasi tahun ajaran yang sedang aktif. Data statistik ini dihitung secara langsung dari basis data lokal setiap kali halaman dashboard dimuat."))

// 4.1.3 Pengelolaan Data Master
children.push(h2("4.1.3 Pengelolaan Data Master"))
children.push(body("Pengelolaan data master merupakan kumpulan halaman yang digunakan oleh admin untuk mengelola seluruh data referensi yang menjadi fondasi operasional sistem. Data master yang dikelola mencakup data siswa, data kelas, data guru, data mata pelajaran, tahun ajaran, penugasan guru pengampu mata pelajaran per kelas, dan tujuan pembelajaran. Setiap halaman data master menyediakan fitur operasi Create, Read, Update, dan Delete (CRUD) yang dapat diakses melalui tombol aksi dan form dialog."))

// -- Siswa
children.push(h3("Halaman Data Siswa"))
children.push(body("Halaman data siswa digunakan untuk mengelola data identitas seluruh siswa yang terdaftar di SMK Taruna Tekno Nusantara. Admin dapat menambah siswa baru, mengubah data siswa yang sudah ada, menghapus data siswa, serta mencari siswa berdasarkan NIS atau nama."))
children.push(caption("Gambar 4.3 Halaman Data Siswa"))
children.push(img("gambar-4-3-data-siswa.png", 460, 278))
children.push(...keterangan([
  `Tombol "Tambah Siswa" untuk menambahkan data siswa baru`,
  "Field pencarian untuk mencari siswa berdasarkan NIS atau nama",
  "Tabel data siswa yang menampilkan kolom NIS, NISN, nama, kelas, jurusan, dan status",
  "Tombol aksi Edit dan Hapus pada setiap baris data",
  "Form dialog untuk mengisi data siswa baru atau mengubah data yang sudah ada",
]))
children.push(body("Form dialog data siswa memuat sejumlah field yang mencakup NIS, NISN, nama lengkap, kelas, jurusan, jenis kelamin, agama, tempat lahir, tanggal lahir, alamat, nomor HP, nama orang tua atau wali, pekerjaan orang tua, pendidikan orang tua, penghasilan orang tua, dan anak ke-. Seluruh field tersebut disimpan ke dalam tabel siswa pada basis data lokal."))

// -- Kelas
children.push(h3("Halaman Data Kelas"))
children.push(body("Halaman data kelas digunakan untuk mengelola data kelas yang tersedia di SMK Taruna Tekno Nusantara. Setiap kelas memiliki wali kelas yang ditugaskan dan dikaitkan dengan tahun ajaran tertentu."))
children.push(caption("Gambar 4.4 Halaman Data Kelas"))
children.push(img("gambar-4-4-data-kelas.png", 460, 278))
children.push(...keterangan([
  `Tombol "Tambah Kelas" untuk menambahkan data kelas baru`,
  "Tabel data kelas yang menampilkan kolom nama kelas, tingkat, wali kelas, dan tahun ajaran",
  "Tombol aksi Edit dan Hapus pada setiap baris data",
]))

// -- Guru
children.push(h3("Halaman Data Guru"))
children.push(body("Halaman data guru digunakan untuk mengelola data profil guru yang terdaftar di sistem. Setiap data guru dikaitkan dengan satu akun pengguna (user) sehingga guru dapat melakukan login ke dalam sistem."))
children.push(caption("Gambar 4.5 Halaman Data Guru"))
children.push(img("gambar-4-5-data-guru.png", 460, 278))
children.push(...keterangan([
  `Tombol "Tambah Guru" untuk menambahkan data guru baru`,
  "Tabel data guru yang menampilkan kolom NIP, nama, bidang studi, dan username akun",
  "Tombol aksi Edit dan Hapus pada setiap baris data",
]))

// -- Mapel
children.push(h3("Halaman Data Mata Pelajaran"))
children.push(body("Halaman data mata pelajaran digunakan untuk mengelola data mata pelajaran yang diajarkan di SMK Taruna Tekno Nusantara. Setiap mata pelajaran memiliki kode unik, nama, dan jenis yang menentukan kelompok penilaiannya. Jenis mata pelajaran yang tersedia adalah reguler, prakerin, ketarunaan, dan kokurikuler, sesuai dengan jenis yang telah dijabarkan pada skema tabel mata_pelajaran di Sub Bab 3.2.3."))
children.push(caption("Gambar 4.6 Halaman Data Mata Pelajaran"))
children.push(img("gambar-4-6-data-mapel.png", 460, 278))
children.push(...keterangan([
  `Tombol "Tambah Mapel" untuk menambahkan mata pelajaran baru`,
  "Tabel data mata pelajaran yang menampilkan kolom kode, nama, jenis, kelompok, dan guru pengampu",
  "Tombol aksi Edit dan Hapus pada setiap baris data",
]))

// -- TA
children.push(h3("Halaman Tahun Ajaran"))
children.push(body("Halaman tahun ajaran digunakan untuk mengelola data periode akademik. Setiap tahun ajaran memiliki nama, semester aktif, dan status aktif yang menentukan tahun ajaran mana yang sedang digunakan oleh sistem."))
children.push(caption("Gambar 4.7 Halaman Tahun Ajaran"))
children.push(img("gambar-4-7-tahun-ajaran.png"))
children.push(...keterangan([
  `Tombol "Tambah Tahun Ajaran" untuk menambahkan periode baru`,
  "Tabel data tahun ajaran yang menampilkan kolom nama, semester, dan status aktif",
  "Indikator visual (badge) untuk menandai tahun ajaran yang sedang aktif",
]))

// -- Guru Pengampu
children.push(h3("Halaman Kelola Guru Pengampu"))
children.push(body("Halaman kelola guru pengampu digunakan untuk menetapkan guru sebagai pengampu mata pelajaran pada kelas tertentu dalam suatu tahun ajaran. Fitur ini memungkinkan satu mata pelajaran diampu oleh guru yang berbeda untuk setiap kelas, serta satu guru dapat mengampu beberapa mata pelajaran dan kelas sekaligus. Mekanisme ini diimplementasikan melalui tabel mapel_kelas_guru sebagai tabel penghubung (junction table) antara tabel mata_pelajaran, kelas, dan guru."))
children.push(caption("Gambar 4.8 Halaman Kelola Guru Pengampu"))
children.push(img("gambar-4-8-guru-pengampu.png"))
children.push(...keterangan([
  "Dropdown pemilihan mata pelajaran dan guru pengampu",
  "Tabel daftar kelas dengan checkbox untuk memilih kelas yang akan diampu",
  `Tombol "Simpan" untuk menyimpan konfigurasi pengampu ke basis data`,
]))

// -- TP
children.push(h3("Halaman Tujuan Pembelajaran"))
children.push(body("Halaman tujuan pembelajaran digunakan oleh admin dan guru untuk mengelola Tujuan Pembelajaran (TP) pada setiap mata pelajaran. Setiap TP memiliki kode, deskripsi capaian untuk kondisi tuntas, dan deskripsi capaian untuk kondisi remediasi. Deskripsi capaian ini nantinya akan digunakan oleh sistem untuk menghasilkan narasi deskripsi kompetensi secara otomatis pada rapor siswa."))
children.push(caption("Gambar 4.9 Halaman Tujuan Pembelajaran"))
children.push(img("gambar-4-9-tujuan-pembelajaran.png"))
children.push(...keterangan([
  "Dropdown pemilihan tahun ajaran dan mata pelajaran",
  "Tabel daftar TP yang menampilkan kode, deskripsi tuntas, dan deskripsi remediasi",
  "Tombol tambah, edit, dan hapus TP",
]))

// 4.1.4 Absensi
children.push(h2("4.1.4 Pencatatan Absensi Harian"))
children.push(body("Halaman input absensi harian digunakan oleh wali kelas untuk mencatat status kehadiran setiap siswa di kelas yang diampunya pada setiap jam pelajaran di hari sekolah aktif. Wali kelas memilih kelas yang diampu dan tanggal pencatatan, kemudian sistem akan menampilkan daftar seluruh siswa di kelas tersebut beserta kolom status kehadiran untuk setiap jam pelajaran."))
children.push(caption("Gambar 4.10 Halaman Input Absensi Harian"))
children.push(img("gambar-4-10-input-absensi.png"))
children.push(...keterangan([
  "Filter pemilihan kelas (otomatis terisi dengan kelas yang diampu wali kelas) dan pemilihan tanggal",
  "Tabel absensi yang menampilkan daftar siswa dan kolom status kehadiran per jam pelajaran (Jam 1 hingga Jam 6)",
  "Pilihan status kehadiran menggunakan dropdown: H (Hadir), DL (Dinas Luar), S (Sakit), I (Izin), dan TK (Tanpa Keterangan)",
  `Tombol "Simpan Absensi" untuk menyimpan data kehadiran ke basis data lokal`,
]))
children.push(body(`Setelah wali kelas menekan tombol "Simpan Absensi", sistem akan menyimpan data absensi setiap siswa ke dalam tabel absensi pada basis data lokal. Data absensi disimpan per siswa, per jam pelajaran, pada tanggal yang dipilih. Wali kelas dapat mengubah data absensi yang telah disimpan dengan memilih kembali tanggal yang sama dan memperbarui status kehadiran.`))
children.push(body("Selain halaman input absensi, wali kelas juga dapat mengakses halaman rekap absensi untuk melihat rekapitulasi kehadiran seluruh siswa di kelasnya dalam periode tertentu. Sistem akan mengagregasi data absensi dari tabel absensi dan menampilkan total masing-masing status kehadiran (Hadir, Dinas Luar, Sakit, Izin, Tanpa Keterangan) per siswa, baik dalam satuan jam pelajaran maupun satuan hari sesuai dengan konfigurasi JAM_PER_HARI yang dapat diatur melalui halaman pengaturan."))
children.push(caption("Gambar 4.11 Halaman Rekap Absensi"))
children.push(img("gambar-4-11-rekap-absensi.png"))
children.push(...keterangan([
  "Filter pemilihan kelas dan rentang periode (tanggal awal dan tanggal akhir)",
  "Tabel rekap absensi yang menampilkan total kehadiran per siswa dalam satuan hari",
  "Total masing-masing status kehadiran: H, DL, S, I, dan TK per siswa",
]))

// 4.1.5 Nilai
children.push(h2("4.1.5 Penginputan Nilai Akademik"))
children.push(body("Halaman input nilai akademik digunakan oleh guru untuk menginput nilai siswa pada mata pelajaran yang diampunya. Guru memilih mata pelajaran, kelas, dan tahun ajaran yang sesuai, kemudian sistem akan menampilkan daftar seluruh siswa di kelas tersebut beserta kolom input nilai dan capaian per Tujuan Pembelajaran (TP). Komponen nilai yang diinput oleh guru mencakup Nilai Formatif, Nilai Sumatif, dan capaian per TP (Tuntas atau Remediasi). Nilai Rapor dihitung secara otomatis oleh sistem berdasarkan bobot Nilai Formatif dan Nilai Sumatif yang telah dikonfigurasi pada halaman pengaturan."))
children.push(caption("Gambar 4.12 Halaman Input Nilai Akademik"))
children.push(img("gambar-4-12-input-nilai.png"))
children.push(...keterangan([
  "Filter pemilihan mata pelajaran (otomatis terisi dengan mapel yang diampu guru), kelas, dan tahun ajaran",
  "Tabel input nilai yang menampilkan daftar siswa, kolom Nilai Formatif, Nilai Sumatif, Nilai Rapor (auto-calculate), dan kolom capaian per TP",
  "Kolom deskripsi capaian kompetensi yang dihasilkan secara otomatis oleh sistem berdasarkan hasil penilaian setiap TP",
  `Tombol "Simpan Nilai" untuk menyimpan seluruh data nilai ke basis data lokal`,
]))
children.push(body("Sistem menghasilkan deskripsi capaian kompetensi secara otomatis dengan cara membandingkan capaian setiap TP terhadap deskripsi tuntas dan deskripsi remediasi yang telah dikonfigurasi pada halaman tujuan pembelajaran. Apabila seorang siswa dinyatakan tuntas pada suatu TP, maka deskripsi tuntas dari TP tersebut akan dimasukkan ke dalam narasi deskripsi. Sebaliknya, apabila siswa dinyatakan remediasi, maka deskripsi remediasi yang digunakan. Hasil penggabungan seluruh deskripsi TP ini membentuk paragraf narasi capaian kompetensi yang akan ditampilkan pada rapor siswa."))

// 4.1.6 Ekskul
children.push(h2("4.1.6 Pengelolaan Ekstrakurikuler"))
children.push(body("Halaman pengelolaan ekstrakurikuler digunakan oleh admin untuk mengelola data kegiatan ekstrakurikuler dan mendaftarkan siswa ke dalam kegiatan ekstrakurikuler tertentu. Sistem menyediakan daftar kegiatan ekstrakurikuler yang telah ditetapkan oleh sekolah, di mana kegiatan Ketarunaan ditetapkan sebagai ekstrakurikuler wajib yang tidak dapat dihapus maupun dikeluarkan dari data siswa."))
children.push(caption("Gambar 4.13 Halaman Pengelolaan Ekstrakurikuler"))
children.push(img("gambar-4-13-ekstrakurikuler.png"))
children.push(...keterangan([
  "Tabel daftar ekstrakurikuler yang tersedia di sekolah",
  "Indikator status wajib atau pilihan pada setiap kegiatan",
  "Form pendaftaran siswa ke ekstrakurikuler dengan pemilihan kelas dan siswa",
  "Daftar siswa yang telah terdaftar pada suatu ekstrakurikuler beserta predikatnya",
]))
children.push(body("Admin dapat mendaftarkan siswa ke dalam ekstrakurikuler secara individu maupun secara massal (bulk enroll) untuk seluruh siswa dalam satu kelas. Setiap siswa yang terdaftar pada suatu ekstrakurikuler akan memiliki predikat (A, B, C, atau D) yang dapat diisi oleh admin. Data keikutsertaan siswa dalam ekstrakurikuler ini nantinya akan ditampilkan pada rapor akademik siswa."))

// 4.1.7 Kokurikuler
children.push(h2("4.1.7 Pengelolaan Kokurikuler"))
children.push(body("Halaman pengelolaan kokurikuler digunakan oleh admin untuk mengelola penilaian Projek Penguatan Profil Pelajar Pancasila (P5). Penilaian kokurikuler didasarkan pada dimensi dan subdimensi P5 yang telah ditetapkan dalam Kurikulum Merdeka. Admin dapat mengonfigurasi subdimensi mana saja yang aktif untuk setiap tingkat kelas (10, 11, atau 12) melalui halaman Atur Kokurikuler/Tingkat, kemudian menginput nilai kokurikuler untuk setiap siswa berdasarkan subdimensi yang telah diaktifkan."))
children.push(caption("Gambar 4.14 Halaman Atur Kokurikuler per Tingkat"))
children.push(img("gambar-4-14-kokurikuler-tingkat.png"))
children.push(...keterangan([
  "Pemilihan tingkat kelas (10, 11, atau 12)",
  "Tabel daftar subdimensi P5 yang dapat diaktifkan atau dinonaktifkan menggunakan toggle",
  "Setiap subdimensi memiliki deskripsi untuk tiga level penilaian: Berkembang, Cakap, dan Mahir",
]))
children.push(caption("Gambar 4.15 Halaman Input Nilai Kokurikuler"))
children.push(img("gambar-4-15-nilai-kokurikuler.png"))
children.push(...keterangan([
  "Filter pemilihan kelas dan siswa",
  "Tabel subdimensi aktif untuk tingkat kelas terkait",
  "Input nilai level (1 = Berkembang, 2 = Cakap, 3 = Mahir) untuk setiap subdimensi per siswa",
]))
children.push(body("Sistem secara otomatis menghasilkan narasi kokurikuler berdasarkan nilai level yang diinput. Setiap level dipetakan ke dalam deskripsi narasi yang telah ditentukan, dan hasil penggabungan seluruh subdimensi membentuk paragraf narasi kokurikuler yang akan ditampilkan pada rapor akademik siswa."))

// 4.1.8 Prakerin
children.push(h2("4.1.8 Pengelolaan Prakerin"))
children.push(body("Halaman pengelolaan Prakerin (Praktik Kerja Lapangan) digunakan oleh admin untuk mengelola data dan nilai prakerin siswa kelas XII. Halaman ini mencakup input data tempat prakerin, periode pelaksanaan, nama pembimbing dari sekolah dan instansi, serta komponen nilai yang terdiri dari TPL (Tempat Praktik Lapangan), SL (Sikap dan Laporan), dan SK (Sertifikasi Kompetensi). Nilai Rapor prakerin dihitung secara otomatis oleh sistem berdasarkan ketiga komponen tersebut."))
children.push(caption("Gambar 4.16 Halaman Pengelolaan Prakerin"))
children.push(img("gambar-4-16-prakerin.png"))
children.push(...keterangan([
  "Filter pemilihan kelas dan siswa",
  "Field input tempat prakerin, tanggal mulai, tanggal selesai, pembimbing sekolah, dan pembimbing instansi",
  "Kolom input nilai TPL, SL, dan SK",
  "Kolom Nilai Rapor yang dihitung secara otomatis",
  "Kolom absensi prakerin: Sakit, Izin, dan Tanpa Keterangan dalam satuan hari",
]))
children.push(body("Data prakerin setiap siswa disimpan ke dalam tabel nilai_prakerin dan absensi_prakerin pada basis data lokal. Data ini nantinya digunakan oleh sistem untuk menghasilkan rapor Prakerin dalam format PDF."))

// 4.1.9 Generate Rapor
children.push(h2("4.1.9 Generate Rapor"))
children.push(body(`Halaman generate rapor digunakan oleh admin untuk menghasilkan dokumen rapor siswa dalam format digital. Sistem menyediakan dua jenis rapor, yaitu rapor akademik reguler dan rapor Prakerin. Sebelum melakukan generate, admin dapat memeriksa kelengkapan data melalui fitur "Cek Kelengkapan" yang akan memvalidasi apakah seluruh data yang dibutuhkan untuk menghasilkan rapor telah tersedia, meliputi data nilai, data absensi, data ekstrakurikuler, data kokurikuler, dan catatan wali kelas.`))
children.push(caption("Gambar 4.17 Halaman Cek Kelengkapan Rapor"))
children.push(img("gambar-4-17-cek-kelengkapan.png"))
children.push(...keterangan([
  "Pemilihan jenis rapor (Akademik atau Prakerin), kelas, dan tahun ajaran",
  `Tombol "Cek Kelengkapan" untuk memvalidasi ketersediaan data`,
  "Daftar siswa beserta status kelengkapan data masing-masing",
  "Indikator visual yang menandakan data telah lengkap atau belum lengkap",
]))
children.push(caption("Gambar 4.18 Halaman Generate Rapor"))
children.push(img("gambar-4-18-generate-rapor.png"))
children.push(...keterangan([
  "Daftar siswa yang datanya telah lengkap",
  `Tombol "Generate" untuk menghasilkan rapor per siswa`,
  `Tombol "Generate Semua" untuk menghasilkan rapor seluruh siswa dalam satu kelas secara batch`,
  "Tombol unduh untuk menyimpan file rapor ke lokasi yang ditentukan",
]))
children.push(body(`Rapor akademik dihasilkan dalam format DOCX dengan menggunakan template rapor-template.docx yang telah disiapkan. Sistem mengisi data setiap siswa ke dalam template menggunakan pustaka docxtemplater, mencakup data identitas siswa, data nilai seluruh mata pelajaran beserta deskripsi capaian kompetensi, data ketidakhadiran (Sakit, Izin, Tanpa Keterangan), data ekstrakurikuler beserta predikat, narasi kokurikuler, dan catatan wali kelas. Setelah dokumen DOCX dihasilkan, admin dapat menyimpan file ke lokasi yang diinginkan. Rapor Prakerin dihasilkan dalam format PDF dengan menggunakan pustaka pdfkit.`))

// 4.1.10 Sinkronisasi
children.push(h2("4.1.10 Sinkronisasi Data"))
children.push(body("Halaman sinkronisasi data digunakan untuk mengelola dan memantau proses sinkronisasi data antara basis data lokal SQLite di perangkat pengguna dengan basis data cloud Firebase. Sinkronisasi data merupakan implementasi dari pendekatan hybrid online-offline yang telah diuraikan pada Sub Bab 2.6 dan Sub Bab 3.2.1."))
children.push(caption("Gambar 4.19 Halaman Konfigurasi Firebase"))
children.push(img("gambar-4-19-konfigurasi-firebase.png", 440, 266))
children.push(...keterangan([
  "Field input untuk konfigurasi Firebase (API Key, Auth Domain, Project ID, Database URL)",
  `Tombol "Simpan" untuk menyimpan konfigurasi secara terenkripsi menggunakan OS keychain`,
  `Tombol "Tes Koneksi" untuk memverifikasi bahwa konfigurasi yang dimasukkan valid`,
]))
children.push(caption("Gambar 4.20 Halaman Status Sinkronisasi"))
children.push(img("gambar-4-20-status-sinkronisasi.png"))
children.push(...keterangan([
  "Indikator status sinkronisasi (tersambung atau tidak tersambung)",
  "Tabel log sinkronisasi yang menampilkan riwayat data yang telah disinkronkan",
  `Tombol "Sinkronisasi Manual" untuk memicu proses sinkronisasi secara langsung`,
  `Tombol "Tarik Data dari Cloud" untuk mengambil data dari Firebase ke basis data lokal`,
]))
children.push(body("Sistem menjalankan mesin sinkronisasi di latar belakang yang secara otomatis mendeteksi ketersediaan koneksi internet. Ketika koneksi internet tersedia, mesin sinkronisasi akan mengunggah data yang telah berubah di basis data lokal ke Firebase, serta mencatat setiap aktivitas sinkronisasi ke dalam tabel sync_log. Data yang disinkronkan mencakup seluruh data akademik, yaitu data absensi, data nilai, data ekstrakurikuler, data kokurikuler, dan data prakerin."))

// ============================================================
// 4.2 PENGUJIAN BLACK BOX
// ============================================================
children.push(h1("4.2 Pengujian Black Box"))
children.push(body("Pengujian sistem dilakukan menggunakan metode Black Box Testing yang berfokus pada evaluasi fungsionalitas sistem berdasarkan spesifikasi dan kebutuhan yang telah didefinisikan tanpa memerlukan pengetahuan terhadap struktur internal kode program, sebagaimana telah diuraikan pada Sub Bab 2.9. Pengujian dilakukan terhadap seluruh use case yang telah dijabarkan pada Sub Bab 3.1.2 menggunakan kombinasi dua teknik pengujian, yaitu Equivalence Partitioning dan Use Case Testing. Equivalence Partitioning digunakan untuk menguji validasi input dengan membagi data masukan ke dalam kategori valid dan tidak valid, sedangkan Use Case Testing digunakan untuk menguji alur interaksi pengguna dengan sistem dari awal hingga akhir berdasarkan use case yang telah didefinisikan."))

// 4.2.1 Rancangan Kasus Uji
children.push(h2("4.2.1 Rancangan Kasus Uji"))
children.push(body("Rancangan kasus uji disusun berdasarkan delapan use case yang telah diidentifikasi pada Sub Bab 3.1.2. Setiap use case dirancang minimal dua skenario pengujian yang merepresentasikan kondisi normal (positive test) dan kondisi abnormal (negative test) untuk memastikan sistem dapat menangani berbagai kemungkinan input dan perilaku pengguna. Skenario pengujian dirancang menggunakan teknik Equivalence Partitioning untuk menguji validasi input (kategori data valid dan tidak valid) serta Use Case Testing untuk menguji alur proses secara menyeluruh."))
children.push(body("Tabel 4.1 berikut merupakan rancangan kasus uji untuk seluruh use case sistem."))

// Table 4.1
const tcColWidths = [400, 1000, 2400, 1800, 2000, 3000]
children.push(tableCaption("Tabel 4.1 Rancangan Kasus Uji Sistem Absensi dan Pengelolaan Nilai SMK Taruna Tekno Nusantara"))
children.push(new Table({
  width: { size: 10600, type: WidthType.DXA },
  columnWidths: tcColWidths,
  rows: [
    makeTableHeader(["No", "Use Case", "Skenario Pengujian", "Teknik", "Data Masukan", "Hasil yang Diharapkan"], tcColWidths),
    makeTableRow(["1", "Login", "Login dengan username dan password valid", "Equivalence Partitioning (valid)", "Username: admin, Password: admin123", "Sistem menerima kredensial dan mengarahkan ke dashboard sesuai role"], tcColWidths),
    makeTableRow(["2", "Login", "Login dengan password salah", "Equivalence Partitioning (invalid)", "Username: admin, Password: salah", "Sistem menolak login dan menampilkan pesan kesalahan"], tcColWidths),
    makeTableRow(["3", "Kelola Data Master", "Tambah data siswa baru dengan field lengkap", "Use Case Testing", "NIS: 2024001, Nama: Andi Pratama, Kelas: XI TKJ A", "Data siswa berhasil disimpan dan muncul di tabel daftar siswa"], tcColWidths),
    makeTableRow(["4", "Kelola Data Master", "Tambah data siswa dengan NIS yang sudah terdaftar", "Equivalence Partitioning (invalid)", "NIS: 2024001 (duplikat)", "Sistem menolak dan menampilkan pesan NIS sudah terdaftar"], tcColWidths),
    makeTableRow(["5", "Kelola Data Master", "Hapus data guru yang tidak memiliki kelas", "Use Case Testing", "Menghapus guru tanpa kelas yang diampu", "Data guru berhasil dihapus dari sistem"], tcColWidths),
    makeTableRow(["6", "Input Absensi Harian", "Input absensi seluruh siswa untuk satu tanggal", "Use Case Testing", "Kelas: XI TKJ A, Tanggal: 14-07-2025, Status bervariasi (H, S, I, TK)", "Seluruh data absensi berhasil disimpan ke basis data"], tcColWidths),
    makeTableRow(["7", "Input Absensi Harian", "Simpan absensi tanpa mengisi status kehadiran", "Equivalence Partitioning (invalid)", "Kelas: XI TKJ A, Status: kosong", "Sistem menampilkan peringatan bahwa status harus diisi"], tcColWidths),
    makeTableRow(["8", "Lihat Rekap Absensi", "Lihat rekap absensi dalam rentang satu bulan", "Use Case Testing", "Kelas: XI TKJ A, Periode: 01-07-2025 s.d. 31-07-2025", "Sistem menampilkan tabel rekap dengan total kehadiran per siswa"], tcColWidths),
    makeTableRow(["9", "Lihat Rekap Absensi", "Lihat rekap absensi pada periode tanpa data", "Use Case Testing", "Kelas: XI TKJ B, Periode tanpa data", "Sistem menampilkan tabel rekap dengan nilai nol pada setiap status"], tcColWidths),
    makeTableRow(["10", "Input Nilai per Mapel", "Input nilai formatif dan sumatif lengkap", "Use Case Testing", "Mapel: Bahasa Indonesia, Formatif: 85, Sumatif: 78, Capaian TP: Tuntas", "Nilai Rapor terhitung otomatis, data tersimpan, deskripsi terbentuk"], tcColWidths),
    makeTableRow(["11", "Input Nilai per Mapel", "Input nilai di luar rentang 0-100", "Equivalence Partitioning (invalid)", "Nilai Formatif: 150", "Sistem menolak input dan menampilkan pesan nilai harus antara 0 dan 100"], tcColWidths),
    makeTableRow(["12", "Kelola Tujuan Pembelajaran", "Tambah TP baru pada mata pelajaran", "Use Case Testing", `Kode: TP-01, Deskripsi Tuntas: "Menguasai materi...", Deskripsi Remediasi: "Perlu latihan..."`, "TP berhasil disimpan dan muncul di tabel daftar TP"], tcColWidths),
    makeTableRow(["13", "Kelola Tujuan Pembelajaran", "Tambah TP dengan kode yang sudah ada", "Equivalence Partitioning (invalid)", "Kode: TP-01 (duplikat)", "Sistem menolak dan menampilkan pesan kode TP sudah digunakan"], tcColWidths),
    makeTableRow(["14", "Generate Rapor PDF", "Generate rapor akademik setelah data lengkap", "Use Case Testing", "Jenis: Akademik, Kelas: XI TKJ A, TA: 2025/2026", "File DOCX rapor berhasil dihasilkan untuk setiap siswa"], tcColWidths),
    makeTableRow(["15", "Generate Rapor PDF", "Cek kelengkapan data sebelum generate", "Use Case Testing", "Kelas dengan data nilai belum lengkap", "Sistem menampilkan status belum lengkap pada siswa yang datanya kurang"], tcColWidths),
    makeTableRow(["16", "Logout", "Logout dari sesi aktif", "Use Case Testing", `Menekan tombol "Keluar" pada sidebar`, "Sesi berakhir, tampilan kembali ke halaman login"], tcColWidths),
  ],
}))

// 4.2.2 Hasil Pengujian
children.push(h2("4.2.2 Hasil Pengujian"))
children.push(body("Setelah seluruh kasus uji dirancang, pengujian dilaksanakan dengan menjalankan setiap skenario pada sistem secara langsung. Penguji memasukkan data input sesuai dengan skenario yang telah ditentukan, mengamati respons sistem, dan mencatat output aktual yang dihasilkan. Hasil aktual kemudian dibandingkan dengan hasil yang diharapkan untuk menentukan status kelulusan setiap kasus uji. Tabel 4.2 berikut menyajikan hasil pengujian dari seluruh kasus uji yang telah dilaksanakan."))

// Table 4.2
const hrColWidths = [400, 2400, 3000, 3000, 1600]
children.push(tableCaption("Tabel 4.2 Hasil Pengujian Black Box Sistem Absensi dan Pengelolaan Nilai SMK Taruna Tekno Nusantara"))
children.push(new Table({
  width: { size: 10400, type: WidthType.DXA },
  columnWidths: hrColWidths,
  rows: [
    makeTableHeader(["No", "Skenario Pengujian", "Hasil yang Diharapkan", "Hasil Aktual", "Status"], hrColWidths),
    makeTableRow(["1", "Login dengan username dan password valid", "Sistem menerima kredensial dan mengarahkan ke dashboard sesuai role", "Sistem berhasil memvalidasi kredensial dan mengarahkan ke dashboard admin", "Lulus"], hrColWidths),
    makeTableRow(["2", "Login dengan password salah", "Sistem menolak login dan menampilkan pesan kesalahan", `Sistem menampilkan notifikasi "Username atau password salah"`, "Lulus"], hrColWidths),
    makeTableRow(["3", "Tambah data siswa baru dengan field lengkap", "Data siswa berhasil disimpan dan muncul di tabel daftar siswa", "Data siswa berhasil tersimpan dan ditampilkan di tabel dengan NIS 2024001", "Lulus"], hrColWidths),
    makeTableRow(["4", "Tambah data siswa dengan NIS yang sudah terdaftar", "Sistem menolak dan menampilkan pesan NIS sudah terdaftar", `Sistem menampilkan pesan validasi "NIS sudah terdaftar"`, "Lulus"], hrColWidths),
    makeTableRow(["5", "Hapus data guru yang tidak memiliki kelas", "Data guru berhasil dihapus dari sistem", "Data guru berhasil dihapus dan tidak lagi muncul di tabel", "Lulus"], hrColWidths),
    makeTableRow(["6", "Input absensi seluruh siswa untuk satu tanggal", "Seluruh data absensi berhasil disimpan ke basis data", "Data absensi berhasil disimpan dan muncul di halaman rekap", "Lulus"], hrColWidths),
    makeTableRow(["7", "Simpan absensi tanpa mengisi status kehadiran", "Sistem menampilkan peringatan bahwa status harus diisi", "Sistem menampilkan pesan peringatan validasi pada field yang kosong", "Lulus"], hrColWidths),
    makeTableRow(["8", "Lihat rekap absensi dalam rentang satu bulan", "Sistem menampilkan tabel rekap dengan total kehadiran per siswa", "Sistem menampilkan tabel rekap dengan akumulasi status H, DL, S, I, TK yang sesuai", "Lulus"], hrColWidths),
    makeTableRow(["9", "Lihat rekap absensi pada periode tanpa data tersimpan", "Sistem menampilkan tabel rekap dengan nilai nol pada setiap status", "Sistem menampilkan tabel rekap dengan seluruh status bernilai 0", "Lulus"], hrColWidths),
    makeTableRow(["10", "Input nilai formatif dan sumatif lengkap untuk satu kelas", "Nilai Rapor terhitung otomatis, data tersimpan, deskripsi terbentuk", "Nilai Rapor terhitung sesuai rumus, deskripsi capaian terbentuk otomatis", "Lulus"], hrColWidths),
    makeTableRow(["11", "Input nilai di luar rentang 0-100", "Sistem menolak input dan menampilkan pesan nilai harus antara 0 dan 100", "Sistem menampilkan validasi dan mencegah penyimpanan nilai 150", "Lulus"], hrColWidths),
    makeTableRow(["12", "Tambah TP baru pada mata pelajaran", "TP berhasil disimpan dan muncul di tabel daftar TP", "TP baru berhasil ditambahkan beserta deskripsi tuntas dan remediasi", "Lulus"], hrColWidths),
    makeTableRow(["13", "Tambah TP dengan kode yang sudah ada", "Sistem menolak dan menampilkan pesan kode TP sudah digunakan", `Sistem menampilkan pesan "Kode TP sudah digunakan pada mapel ini"`, "Lulus"], hrColWidths),
    makeTableRow(["14", "Generate rapor akademik setelah seluruh data lengkap", "File DOCX rapor berhasil dihasilkan untuk setiap siswa", "File rapor DOCX berhasil dibuat dan tersimpan di lokasi yang ditentukan", "Lulus"], hrColWidths),
    makeTableRow(["15", "Cek kelengkapan data sebelum generate", "Sistem menampilkan status belum lengkap pada siswa yang datanya kurang", "Sistem menampilkan indikator belum lengkap dan menginformasikan data yang kurang", "Lulus"], hrColWidths),
    makeTableRow(["16", "Logout dari sesi aktif", "Sesi berakhir, tampilan kembali ke halaman login", "Sesi diakhiri, pengguna diarahkan kembali ke halaman login", "Lulus"], hrColWidths),
  ],
}))

children.push(body("Berdasarkan hasil pengujian pada Tabel 4.2, seluruh 16 kasus uji yang dilaksanakan memperoleh status Lulus. Hal ini menunjukkan bahwa seluruh fungsionalitas sistem telah berfungsi sesuai dengan spesifikasi kebutuhan yang telah didefinisikan pada Sub Bab 3.1.2. Sistem mampu menangani input yang valid dengan menghasilkan output yang diharapkan, serta mampu mendeteksi dan menolak input yang tidak valid dengan menampilkan pesan kesalahan yang sesuai. Dengan demikian, dapat disimpulkan bahwa sistem absensi dan pengelolaan nilai siswa pada SMK Taruna Tekno Nusantara telah memenuhi seluruh kebutuhan fungsional yang ditetapkan dan siap untuk digunakan oleh pihak sekolah."))

// ============================================================
// BUILD
// ============================================================
console.log("Generating BAB IV docx...")
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: SIZE },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1080, bottom: 1440, left: 1440 },
      },
    },
    children,
  }],
})

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT_PATH, buffer)
  console.log(`✅ BAB IV saved to: ${OUTPUT_PATH}`)
  console.log(`   Size: ${(buffer.length / 1024).toFixed(1)} KB`)
})
