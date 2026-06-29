/**
 * Seed: tujuan_pembelajaran (TP untuk semua mapel reguler).
 *
 * Total: ~135 TP untuk 29 mapel reguler.
 * - BIND, MTK, PWEB: 10 TP each (paling kritis, detail lengkap)
 * - Kejuruan: 5-7 TP each (mata pelajaran inti kompetensi)
 * - Lainnya: 4 TP each (template generik, guru bisa edit)
 *
 * Setiap TP punya deskripsi_tuntas (jika siswa mencapai) dan
 * deskripsi_remediasi (jika siswa perlu perbaikan).
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq } from "drizzle-orm"
import { log } from "../helpers"

type TPSpec = {
  kode_tp: string
  deskripsi_tuntas: string
  deskripsi_remediasi: string
}

// =============================================================================
// BAHASA INDONESIA (10 TP)
// =============================================================================
const TP_BAHASA_INDONESIA: TPSpec[] = [
  { kode_tp: "TP-BIND-01", deskripsi_tuntas: "Mampu mengidentifikasi teks negosiasi dengan tepat", deskripsi_remediasi: "Mempelajari kembali ciri-ciri teks negosiasi" },
  { kode_tp: "TP-BIND-02", deskripsi_tuntas: "Mampu menganalisis struktur teks negosiasi", deskripsi_remediasi: "Latihan tambahan menganalisis struktur teks" },
  { kode_tp: "TP-BIND-03", deskripsi_tuntas: "Mampu menyusun teks negosiasi dengan bahasa yang baik", deskripsi_remediasi: "Praktik menulis teks negosiasi dengan panduan" },
  { kode_tp: "TP-BIND-04", deskripsi_tuntas: "Mampu mempresentasikan teks negosiasi dengan percaya diri", deskripsi_remediasi: "Latihan presentasi di depan kelas" },
  { kode_tp: "TP-BIND-05", deskripsi_tuntas: "Mampu mengidentifikasi teks eksposisi", deskripsi_remediasi: "Mempelajari ciri-ciri teks eksposisi" },
  { kode_tp: "TP-BIND-06", deskripsi_tuntas: "Mampu membedakan fakta dan opini dalam teks", deskripsi_remediasi: "Latihan tambahan identifikasi fakta-opini" },
  { kode_tp: "TP-BIND-07", deskripsi_tuntas: "Mampu menulis paragraf eksposisi yang koheren", deskripsi_remediasi: "Praktik menulis dengan tema yang diberikan" },
  { kode_tp: "TP-BIND-08", deskripsi_tuntas: "Mampu menggunakan EYD dengan benar", deskripsi_remediasi: "Latihan soal EYD secara berkala" },
  { kode_tp: "TP-BIND-09", deskripsi_tuntas: "Mampu membuat ringkasan teks dengan tepat", deskripsi_remediasi: "Praktik membuat ringkasan dari berbagai teks" },
  { kode_tp: "TP-BIND-10", deskripsi_tuntas: "Mampu memahami makna puisi dan prosa", deskripsi_remediasi: "Membaca dan mendiskusikan karya sastra" },
]

// =============================================================================
// BAHASA INGGRIS (5 TP)
// =============================================================================
const TP_BAHASA_INGGRIS: TPSpec[] = [
  { kode_tp: "TP-BING-01", deskripsi_tuntas: "Mampu memahami teks pendek dan instrucciones sederhana", deskripsi_remediasi: "Latihan membaca teks bahasa Inggris secara berkala" },
  { kode_tp: "TP-BING-02", deskripsi_tuntas: "Mampu menyusun kalimat sederhana dengan tenses yang tepat", deskripsi_remediasi: "Review kembali bentuk tenses dan penggunaannya" },
  { kode_tp: "TP-BING-03", deskripsi_tuntas: "Mampu berkomunikasi dalam situasi sehari-hari", deskripsi_remediasi: "Praktik dialog dan role play bahasa Inggris" },
  { kode_tp: "TP-BING-04", deskripsi_tuntas: "Mampu menulis paragraf sederhana dengan kosa kata tepat", deskripsi_remediasi: "Latihan menulis dengan tema yang diberikan" },
  { kode_tp: "TP-BING-05", deskripsi_tuntas: "Mampu mengidentifikasi ide utama dalam teks bahasa Inggris", deskripsi_remediasi: "Latihan skimming dan scanning pada teks berbahasa Inggris" },
]

// =============================================================================
// MATEMATIKA (10 TP)
// =============================================================================
const TP_MATEMATIKA: TPSpec[] = [
  { kode_tp: "TP-MTK-01", deskripsi_tuntas: "Mampu menyelesaikan persamaan linear satu variabel", deskripsi_remediasi: "Latihan tambahan persamaan linear" },
  { kode_tp: "TP-MTK-02", deskripsi_tuntas: "Mampu menyelesaikan sistem persamaan linear dua variabel", deskripsi_remediasi: "Praktik SPLDV dengan metode grafik dan substitusi" },
  { kode_tp: "TP-MTK-03", deskripsi_tuntas: "Mampu memahami konsep fungsi dan grafiknya", deskripsi_remediasi: "Mempelajari jenis-jenis fungsi dan grafiknya" },
  { kode_tp: "TP-MTK-04", deskripsi_tuntas: "Mampu menghitung operasi matriks", deskripsi_remediasi: "Latihan penjumlahan dan perkalian matriks" },
  { kode_tp: "TP-MTK-05", deskripsi_tuntas: "Mampu menghitung determinan dan invers matriks", deskripsi_remediasi: "Praktik determinan dan invers matriks 2x2" },
  { kode_tp: "TP-MTK-06", deskripsi_tuntas: "Mampu menghitung peluang suatu kejadian", deskripsi_remediasi: "Mempelajari konsep peluang dan ruang sampel" },
  { kode_tp: "TP-MTK-07", deskripsi_tuntas: "Mampu memahami konsep statistika dasar", deskripsi_remediasi: "Latihan mean, median, modus" },
  { kode_tp: "TP-MTK-08", deskripsi_tuntas: "Mampu menghitung ukuran pemusatan data", deskripsi_remediasi: "Praktik perhitungan kuartil dan simpangan baku" },
  { kode_tp: "TP-MTK-09", deskripsi_tuntas: "Mampu menerapkan konsep barisan dan deret", deskripsi_remediasi: "Latihan barisan aritmatika dan geometri" },
  { kode_tp: "TP-MTK-10", deskripsi_tuntas: "Mampu memecahkan masalah trigonometri", deskripsi_remediasi: "Mempelajari identitas trigonometri dasar" },
]

// =============================================================================
// ILMU PENGETAHUAN ALAM (4 TP)
// =============================================================================
const TP_IPA: TPSpec[] = [
  { kode_tp: "TP-IPA-01", deskripsi_tuntas: "Mampu menganalisis konsep gerak dan gaya", deskripsi_remediasi: "Review hukum Newton dan penerapannya" },
  { kode_tp: "TP-IPA-02", deskripsi_tuntas: "Mampu menjelaskan konsep energi dan transformasinya", deskripsi_remediasi: "Latihan soal tentang energi kinetik dan potensial" },
  { kode_tp: "TP-IPA-03", deskripsi_tuntas: "Mampu memahami sistem tata surya", deskripsi_remediasi: "Mempelajari planet-planet dan karakteristiknya" },
  { kode_tp: "TP-IPA-04", deskripsi_tuntas: "Mampu menerapkan konsep kimia dasar", deskripsi_remediasi: "Latihan penamaan senyawa dan reaksi kimia sederhana" },
]

// =============================================================================
// ILMU PENGETAHUAN SOSIAL (4 TP)
// =============================================================================
const TP_IPS: TPSpec[] = [
  { kode_tp: "TP-IPS-01", deskripsi_tuntas: "Mampu menganalisis peristiwa sejarah Indonesia", deskripsi_remediasi: "Review kembali kronologi sejarah nasional" },
  { kode_tp: "TP-IPS-02", deskripsi_tuntas: "Mampu memahami konsep ekonomi dan perdagangan", deskripsi_remediasi: "Latihan soal tentang permintaan dan penawaran" },
  { kode_tp: "TP-IPS-03", deskripsi_tuntas: "Mampu menjelaskan keragaman budaya Indonesia", deskripsi_remediasi: "Mempelajari budaya daerah dan persebarannya" },
  { kode_tp: "TP-IPS-04", deskripsi_tuntas: "Mampu menganalisis dinamika sosial masyarakat", deskripsi_remediasi: "Latihan studi kasus perubahan sosial" },
]

// =============================================================================
// PENDIDIKAN PANCASILA (4 TP)
// =============================================================================
const TP_PKN: TPSpec[] = [
  { kode_tp: "TP-PKN-01", deskripsi_tuntas: "Mampu memahami nilai-nilai Pancasila", deskripsi_remediasi: "Mempelajari butir-butir Pancasila dan penerapannya" },
  { kode_tp: "TP-PKN-02", deskripsi_tuntas: "Mampu menganalisis hak dan kewajiban warga negara", deskripsi_remediasi: "Review kembali UUD 1945 dan pasal-pasalnya" },
  { kode_tp: "TP-PKN-03", deskripsi_tuntas: "Mampu menerapkan demokrasi dalam kehidupan sehari-hari", deskripsi_remediasi: "Latihan diskusi kelompok tentang nilai demokrasi" },
  { kode_tp: "TP-PKN-04", deskripsi_tuntas: "Mampu menghargai keberagaman di Indonesia", deskripsi_remediasi: "Studi kasus tentang toleransi antarbudaya" },
]

// =============================================================================
// PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN (4 TP)
// =============================================================================
const TP_PJOK: TPSpec[] = [
  { kode_tp: "TP-PJOK-01", deskripsi_tuntas: "Mampu melakukan aktivitas olahraga dengan teknik yang benar", deskripsi_remediasi: "Praktik gerakan dasar olahraga secara berulang" },
  { kode_tp: "TP-PJOK-02", deskripsi_tuntas: "Mampu menjaga kebugaran jasmani", deskripsi_remediasi: "Latihan pemanasan dan pendinginan secara rutin" },
  { kode_tp: "TP-PJOK-03", deskripsi_tuntas: "Mampu bermain dalam permainan beregu dengan sportif", deskripsi_remediasi: "Latihan kerjasama tim dan sportivitas" },
  { kode_tp: "TP-PJOK-04", deskripsi_tuntas: "Mampu memahami pola hidup sehat", deskripsi_remediasi: "Mempelajari prinsip gizi seimbang dan istirahat cukup" },
]

// =============================================================================
// SENI BUDAYA (4 TP)
// =============================================================================
const TP_SENI_BUDAYA: TPSpec[] = [
  { kode_tp: "TP-SB-01", deskripsi_tuntas: "Mampu mengapresiasi karya seni rupa dan musik", deskripsi_remediasi: "Latihan observasi dan apresiasi berbagai bentuk karya seni" },
  { kode_tp: "TP-SB-02", deskripsi_tuntas: "Mampu menampilkan karya seni secara kreatif", deskripsi_remediasi: "Praktik berkarya seni dengan teknik yang benar" },
  { kode_tp: "TP-SB-03", deskripsi_tuntas: "Mampu memahami unsur-unsur seni tradisional Indonesia", deskripsi_remediasi: "Mempelajari tarian, musik, dan kerajinan tradisional" },
  { kode_tp: "TP-SB-04", deskripsi_tuntas: "Mampu berkreasi dalam seni terapan", deskripsi_remediasi: "Latihan membuat karya seni terapan sederhana" },
]

// =============================================================================
// MUATAN LOKAL: BASIC SCIENCE AVIATION (4 TP)
// =============================================================================
const TP_BSA: TPSpec[] = [
  { kode_tp: "TP-BSA-01", deskripsi_tuntas: "Mampu memahami prinsip dasar aerodinamika", deskripsi_remediasi: "Review kembali hukum Bernoulli dan gaya angkat" },
  { kode_tp: "TP-BSA-02", deskripsi_tuntas: "Mampu mengidentifikasi komponen pesawat udara", deskripsi_remediasi: "Mempelajari bagian-bagian utama pesawat terbang" },
  { kode_tp: "TP-BSA-03", deskripsi_tuntas: "Mampu menjelaskan prinsip penerbangan", deskripsi_remediasi: "Latihan analisis gaya angkat, dorong, dan hambat" },
  { kode_tp: "TP-BSA-04", deskripsi_tuntas: "Mampu memahami prosedur keselamatan penerbangan", deskripsi_remediasi: "Studi kasus prosedur darurat dalam penerbangan" },
]

// =============================================================================
// MUATAN LOKAL: PENALARAN UMUM (4 TP)
// =============================================================================
const TP_PU: TPSpec[] = [
  { kode_tp: "TP-PU-01", deskripsi_tuntas: "Mampu menarik kesimpulan dari informasi yang diberikan", deskripsi_remediasi: "Latihan soal logika dasar dan silogisme" },
  { kode_tp: "TP-PU-02", deskripsi_tuntas: "Mampu menganalisis pola dan hubungan", deskripsi_remediasi: "Praktik soal deret bilangan dan pola gambar" },
  { kode_tp: "TP-PU-03", deskripsi_tuntas: "Mampu memecahkan masalah secara sistematis", deskripsi_remediasi: "Mempelajari langkah-langkah pemecahan masalah" },
  { kode_tp: "TP-PU-04", deskripsi_tuntas: "Mampu mengkritisi pernyataan dan argumen", deskripsi_remediasi: "Latihan identifikasi premis dan kesimpulan" },
]

// =============================================================================
// PENDIDIKAN AGAMA ISLAM (4 TP)
// =============================================================================
const TP_AGAMA_ISLAM: TPSpec[] = [
  { kode_tp: "TP-AGAMA-ISLAM-01", deskripsi_tuntas: "Mampu membaca Al-Quran dengan tajwid yang benar", deskripsi_remediasi: "Latihan membaca Al-Quran dengan bimbingan guru" },
  { kode_tp: "TP-AGAMA-ISLAM-02", deskripsi_tuntas: "Mampu memahami rukun iman dan rukun Islam", deskripsi_remediasi: "Mempelajari kembali pilar-pilar keimanan" },
  { kode_tp: "TP-AGAMA-ISLAM-03", deskripsi_tuntas: "Mampu mengamalkan nilai-nilai Islam dalam kehidupan sehari-hari", deskripsi_remediasi: "Praktik akhlak mulia sesuai ajaran Islam" },
  { kode_tp: "TP-AGAMA-ISLAM-04", deskripsi_tuntas: "Mampu memahami sejarah Islam dan para nabi", deskripsi_remediasi: "Review kembali kisah para nabi dan sahabat" },
]

// =============================================================================
// PENDIDIKAN AGAMA KRISTEN (4 TP)
// =============================================================================
const TP_AGAMA_KRISTEN: TPSpec[] = [
  { kode_tp: "TP-AGAMA-KRISTEN-01", deskripsi_tuntas: "Mampu memahami ajaran Alkitab", deskripsi_remediasi: "Mempelajari kisah dan ajaran dalam Alkitab" },
  { kode_tp: "TP-AGAMA-KRISTEN-02", deskripsi_tuntas: "Mampu mengamalkan kasih dan pelayanan", deskripsi_remediasi: "Praktik nilai kasih dalam kehidupan sehari-hari" },
  { kode_tp: "TP-AGAMA-KRISTEN-03", deskripsi_tuntas: "Mampu memahami sejarah gereja Kristen", deskripsi_remediasi: "Review perjalanan gereja dari masa ke masa" },
  { kode_tp: "TP-AGAMA-KRISTEN-04", deskripsi_tuntas: "Mampu menerapkan nilai-nilai kristiani", deskripsi_remediasi: "Latihan refleksi dan doa harian" },
]

// =============================================================================
// PENDIDIKAN AGAMA KATOLIK (4 TP)
// =============================================================================
const TP_AGAMA_KATOLIK: TPSpec[] = [
  { kode_tp: "TP-AGAMA-KATOLIK-01", deskripsi_tuntas: "Mampu memahami ajaran Kitab Suci", deskripsi_remediasi: "Mempelajari kisah dan ajaran dalam Kitab Suci" },
  { kode_tp: "TP-AGAMA-KATOLIK-02", deskripsi_tuntas: "Mampu mengamalkan nilai-nilai kasih sesuaiajaran Katolik", deskripsi_remediasi: "Praktik hidup sesuai nilai-nilai Injil" },
  { kode_tp: "TP-AGAMA-KATOLIK-03", deskripsi_tuntas: "Mampu memahami tata liturgi dan sakramen", deskripsi_remediasi: "Mempelajari makna liturgi dan sakramen" },
  { kode_tp: "TP-AGAMA-KATOLIK-04", deskripsi_tuntas: "Mampu menerapkan moral Katolik dalam kehidupan", deskripsi_remediasi: "Latihan discernasi dan refleksi pribadi" },
]

// =============================================================================
// PENDIDIKAN AGAMA HINDU (4 TP)
// =============================================================================
const TP_AGAMA_HINDU: TPSpec[] = [
  { kode_tp: "TP-AGAMA-HINDU-01", deskripsi_tuntas: "Mampu memahami konsep Tri Hita Karana", deskripsi_remediasi: "Mempelajari tiga hubungan harmonis dalam Hindu" },
  { kode_tp: "TP-AGAMA-HINDU-02", deskripsi_tuntas: "Mampu memahami ajaran kitab suci Weda", deskripsi_remediasi: "Review kembali ajaran Weda dan Brahmana" },
  { kode_tp: "TP-AGAMA-HINDU-03", deskripsi_tuntas: "Mampu menjalankan ritual keagamaan Hindu", deskripsi_remediasi: "Praktik Yadnya dan persembahan" },
  { kode_tp: "TP-AGAMA-HINDU-04", deskripsi_tuntas: "Mampu memahami filosofi dan etika Hindu", deskripsi_remediasi: "Mempelajari konsep Dharma dan Karma" },
]

// =============================================================================
// PENDIDIKAN AGAMA BUDDHA (4 TP)
// =============================================================================
const TP_AGAMA_BUDDHA: TPSpec[] = [
  { kode_tp: "TP-AGAMA-BUDDHA-01", deskripsi_tuntas: "Mampu memahami ajaran Dharma dan Tripitaka", deskripsi_remediasi: "Mempelajari kembali kitab suci Tripitaka" },
  { kode_tp: "TP-AGAMA-BUDDHA-02", deskripsi_tuntas: "Mampu menerapkan Empat Kebenaran Mulia", deskripsi_remediasi: "Review kembali konsep dukkha dan jalan keluarnya" },
  { kode_tp: "TP-AGAMA-BUDDHA-03", deskripsi_tuntas: "Mampu mempraktikkan meditasi dasar", deskripsi_remediasi: "Latihan meditasi pernafasan secara rutin" },
  { kode_tp: "TP-AGAMA-BUDDHA-04", deskripsi_tuntas: "Mampu memahami sejarah Siddharta Gautama", deskripsi_remediasi: "Mempelajari riwayat hidup Buddha" },
]

// =============================================================================
// PENDIDIKAN AGAMA KONGHUCU (4 TP)
// =============================================================================
const TP_AGAMA_KONGHUCU: TPSpec[] = [
  { kode_tp: "TP-AGAMA-KONGHUCU-01", deskripsi_tuntas: "Mampu memahami nilai-nilai kebajikan Konghucu", deskripsi_remediasi: "Mempelajari kembali konsep Ren, Yi, Li, Zhi" },
  { kode_tp: "TP-AGAMA-KONGHUCU-02", deskripsi_tuntas: "Mampu memahamiajaran klasik Confucian", deskripsi_remediasi: "Review kembali kitab Su Yu dan Da Xue" },
  { kode_tp: "TP-AGAMA-KONGHUCU-03", deskripsi_tuntas: "Mampu menerapkan etika sosial Konghucu", deskripsi_remediasi: "Praktik Xiao (bakti) dan Zhong (loyalitas)" },
  { kode_tp: "TP-AGAMA-KONGHUCU-04", deskripsi_tuntas: "Mampu memahami tradisi dan budaya Konghucu", deskripsi_remediasi: "Mempelajari hari raya dan ritual Konghucu" },
]

// =============================================================================
// KEJURUAN RPL
// =============================================================================

// Pemrograman Web (10 TP)
const TP_PEMROGRAMAN_WEB: TPSpec[] = [
  { kode_tp: "TP-PWEB-01", deskripsi_tuntas: "Mampu membuat struktur HTML5 yang semantik", deskripsi_remediasi: "Praktik membuat layout HTML dasar" },
  { kode_tp: "TP-PWEB-02", deskripsi_tuntas: "Mampu menata halaman web dengan CSS3", deskripsi_remediasi: "Latihan styling dengan selector dan property CSS" },
  { kode_tp: "TP-PWEB-03", deskripsi_tuntas: "Mampu membuat layout responsif dengan Flexbox", deskripsi_remediasi: "Praktik layout flexbox dan media queries" },
  { kode_tp: "TP-PWEB-04", deskripsi_tuntas: "Mampu membuat layout responsif dengan CSS Grid", deskripsi_remediasi: "Latihan grid-template-area" },
  { kode_tp: "TP-PWEB-05", deskripsi_tuntas: "Mampu membuat interaktivitas dengan JavaScript DOM", deskripsi_remediasi: "Praktik manipulasi DOM dan event handler" },
  { kode_tp: "TP-PWEB-06", deskripsi_tuntas: "Mampu menggunakan ES6+ features (arrow function, destructuring)", deskripsi_remediasi: "Latihan syntax modern JavaScript" },
  { kode_tp: "TP-PWEB-07", deskripsi_tuntas: "Mampu melakukan fetch data dari REST API", deskripsi_remediasi: "Praktik fetch API dan async/await" },
  { kode_tp: "TP-PWEB-08", deskripsi_tuntas: "Mampu membuat single-page application dengan React", deskripsi_remediasi: "Latihan component, state, dan props" },
  { kode_tp: "TP-PWEB-09", deskripsi_tuntas: "Mampu mengelola state aplikasi dengan React Hooks", deskripsi_remediasi: "Praktik useState, useEffect, useContext" },
  { kode_tp: "TP-PWEB-10", deskripsi_tuntas: "Mampu menggunakan React Router untuk navigasi", deskripsi_remediasi: "Latihan setup router dan nested routes" },
]

// Pemrograman Berorientasi Objek (6 TP)
const TP_PBO: TPSpec[] = [
  { kode_tp: "TP-PBO-01", deskripsi_tuntas: "Mampu memahami konsep class dan object", deskripsi_remediasi: "Latihan mendeklarasikan class dan instansiasi object" },
  { kode_tp: "TP-PBO-02", deskripsi_tuntas: "Mampu menerapkan encapsulation dan access modifier", deskripsi_remediasi: "Review kembali konsep private, public, protected" },
  { kode_tp: "TP-PBO-03", deskripsi_tuntas: "Mampu menerapkan inheritance antar class", deskripsi_remediasi: "Praktik pewarisan dan super constructor" },
  { kode_tp: "TP-PBO-04", deskripsi_tuntas: "Mampu menerapkan polymorphism", deskripsi_remediasi: "Latihan method overriding dan overloading" },
  { kode_tp: "TP-PBO-05", deskripsi_tuntas: "Mampu menggunakan abstract class dan interface", deskripsi_remediasi: "Mempelajari cara kerja abstract dan interface" },
  { kode_tp: "TP-PBO-06", deskripsi_tuntas: "Mampu mengelola koleksi data dengan ArrayList", deskripsi_remediasi: "Praktik penggunaan List, Set, dan Map" },
]

// Basis Data (6 TP)
const TP_BD: TPSpec[] = [
  { kode_tp: "TP-BD-01", deskripsi_tuntas: "Mampu memahami konsep basis data relasional", deskripsi_remediasi: "Review kembali komponen DBMS" },
  { kode_tp: "TP-BD-02", deskripsi_tuntas: "Mampu membuat ERD untuk studi kasus", deskripsi_remediasi: "Latihan identifikasi entitas, atribut, dan relasi" },
  { kode_tp: "TP-BD-03", deskripsi_tuntas: "Mampu melakukan normalisasi data", deskripsi_remediasi: "Mempelajari bentuk normal 1NF, 2NF, 3NF" },
  { kode_tp: "TP-BD-04", deskripsi_tuntas: "Mampu membuat query SQL SELECT dengan JOIN", deskripsi_remediasi: "Praktik INNER, LEFT, RIGHT JOIN" },
  { kode_tp: "TP-BD-05", deskripsi_tuntas: "Mampu membuat query SQL INSERT, UPDATE, DELETE", deskripsi_remediasi: "Latihan DML dengan kondisi WHERE" },
  { kode_tp: "TP-BD-06", deskripsi_tuntas: "Mampu mengoptimalkan performa query dengan index", deskripsi_remediasi: "Mempelajari cara kerja index pada SQL" },
]

// Projek Kreatif Rekayasa Perangkat Lunak (5 TP)
const TP_PPL: TPSpec[] = [
  { kode_tp: "TP-PPL-01", deskripsi_tuntas: "Mampu menganalisis kebutuhan perangkat lunak", deskripsi_remediasi: "Latihan studi kasus dan requirement elicitation" },
  { kode_tp: "TP-PPL-02", deskripsi_tuntas: "Mampu membuat rancangan sistem (DFD, ERD, use case)", deskripsi_remediasi: "Praktik perancangan dengan diagram UML" },
  { kode_tp: "TP-PPL-03", deskripsi_tuntas: "Mampu mengelola projek dengan timeline yang realistis", deskripsi_remediasi: "Mempelajari manajemen waktu dan milestone" },
  { kode_tp: "TP-PPL-04", deskripsi_tuntas: "Mampu mengimplementasikan projek sesuai rancangan", deskripsi_remediasi: "Praktik coding dan integrasi modul" },
  { kode_tp: "TP-PPL-05", deskripsi_tuntas: "Mampu menguji dan memperbaiki bug projek", deskripsi_remediasi: "Latihan debugging dan unit testing" },
]

// Projek Kreatif dan Kewirausahaan (4 TP)
const TP_PKWU: TPSpec[] = [
  { kode_tp: "TP-PKWU-01", deskripsi_tuntas: "Mampu mengidentifikasi peluang usaha di bidang IT", deskripsi_remediasi: "Latihan observasi pasar dan analisis kebutuhan" },
  { kode_tp: "TP-PKWU-02", deskripsi_tuntas: "Mampu menyusun rencana bisnis sederhana", deskripsi_remediasi: "Mempelajari komponen business plan" },
  { kode_tp: "TP-PKWU-03", deskripsi_tuntas: "Mampu membuat produk/jasa yang marketable", deskripsi_remediasi: "Praktik pengembangan produk dengan value proposition" },
  { kode_tp: "TP-PKWU-04", deskripsi_tuntas: "Mampu memasarkan produk secara digital", deskripsi_remediasi: "Latihan strategi pemasaran media sosial" },
]

// Pemrograman Berbasis Teks, Grafis, dan Multimedia (5 TP)
const TP_DDK: TPSpec[] = [
  { kode_tp: "TP-DDK-01", deskripsi_tuntas: "Mampu membuat desain grafis dengan software vector", deskripsi_remediasi: "Latihan penggunaan tool path, shape, dan layer" },
  { kode_tp: "TP-DDK-02", deskripsi_tuntas: "Mampu mengedit gambar dengan software raster", deskripsi_remediasi: "Praktik penggunaan layer, mask, dan filter" },
  { kode_tp: "TP-DDK-03", deskripsi_tuntas: "Mampu membuat animasi 2D sederhana", deskripsi_remediasi: "Mempelajari prinsip animasi frame-by-frame" },
  { kode_tp: "TP-DDK-04", deskripsi_tuntas: "Mampu mengolah video dengan software editing", deskripsi_remediasi: "Latihan cutting, transition, dan efek video" },
  { kode_tp: "TP-DDK-05", deskripsi_tuntas: "Mampu membuat konten multimedia interaktif", deskripsi_remediasi: "Praktik integrasi teks, gambar, audio, dan video" },
]

// Cyber Security (5 TP)
const TP_CS: TPSpec[] = [
  { kode_tp: "TP-CS-01", deskripsi_tuntas: "Mampu memahami konsep keamanan informasi", deskripsi_remediasi: "Review kembali CIA triad (Confidentiality, Integrity, Availability)" },
  { kode_tp: "TP-CS-02", deskripsi_tuntas: "Mampu mengidentifikasi ancaman dan kerentanan", deskripsi_remediasi: "Latihan analisis malware dan phishing" },
  { kode_tp: "TP-CS-03", deskripsi_tuntas: "Mampu mengimplementasikan kriptografi dasar", deskripsi_remediasi: "Praktik enkripsi simetris dan asimetris" },
  { kode_tp: "TP-CS-04", deskripsi_tuntas: "Mampu melakukan penetration testing sederhana", deskripsi_remediasi: "Mempelajari tools dan metodologi pentest" },
  { kode_tp: "TP-CS-05", deskripsi_tuntas: "Mampu mengelola keamanan jaringan dan firewall", deskripsi_remediasi: "Praktik konfigurasi rule firewall" },
]

// =============================================================================
// KEJURUAN TKJ
// =============================================================================

// Jaringan Komputer (5 TP)
const TP_JAR: TPSpec[] = [
  { kode_tp: "TP-JAR-01", deskripsi_tuntas: "Mampu memahami model OSI dan TCP/IP", deskripsi_remediasi: "Review kembali 7 layer OSI dan fungsinya" },
  { kode_tp: "TP-JAR-02", deskripsi_tuntas: "Mampu mengkonfigurasi IP addressing dan subnetting", deskripsi_remediasi: "Latihan perhitungan subnet mask dan VLSM" },
  { kode_tp: "TP-JAR-03", deskripsi_tuntas: "Mampu membangun LAN sederhana", deskripsi_remediasi: "Praktik crimping kabel dan switch configuration" },
  { kode_tp: "TP-JAR-04", deskripsi_tuntas: "Mampu mengkonfigurasi routing static dan dynamic", deskripsi_remediasi: "Mempelajari OSPF dan EIGRP" },
  { kode_tp: "TP-JAR-05", deskripsi_tuntas: "Mampu melakukan troubleshooting jaringan", deskripsi_remediasi: "Latihan penggunaan ping, traceroute, dan wireshark" },
]

// Administrasi Server (5 TP)
const TP_ADS: TPSpec[] = [
  { kode_tp: "TP-ADS-01", deskripsi_tuntas: "Mampu menginstalasi sistem operasi server", deskripsi_remediasi: "Latihan instalasi Windows Server dan Linux" },
  { kode_tp: "TP-ADS-02", deskripsi_tuntas: "Mampu mengkonfigurasi layanan DNS dan DHCP", deskripsi_remediasi: "Praktik setup DNS zone dan DHCP scope" },
  { kode_tp: "TP-ADS-03", deskripsi_tuntas: "Mampu mengkonfigurasi web server (Apache/Nginx)", deskripsi_remediasi: "Latihan setup virtual host dan SSL" },
  { kode_tp: "TP-ADS-04", deskripsi_tuntas: "Mampu mengelola user dan permission", deskripsi_remediasi: "Mempelajari konsep ACL dan role-based access" },
  { kode_tp: "TP-ADS-05", deskripsi_tuntas: "Mampu melakukan backup dan recovery server", deskripsi_remediasi: "Praktik scheduled backup dan restore" },
]

// Cloud Computing (4 TP)
const TP_CLOUD: TPSpec[] = [
  { kode_tp: "TP-CLOUD-01", deskripsi_tuntas: "Mampu memahami konsep cloud computing (IaaS, PaaS, SaaS)", deskripsi_remediasi: "Review kembali model layanan cloud" },
  { kode_tp: "TP-CLOUD-02", deskripsi_tuntas: "Mampu menggunakan layanan compute (VM, container)", deskripsi_remediasi: "Latihan deployment VM di cloud provider" },
  { kode_tp: "TP-CLOUD-03", deskripsi_tuntas: "Mampu mengelola storage dan database di cloud", deskripsi_remediasi: "Praktik konfigurasi object storage" },
  { kode_tp: "TP-CLOUD-04", deskripsi_tuntas: "Mampu mengimplementasikan keamanan cloud", deskripsi_remediasi: "Mempelajari IAM dan security group" },
]

// Internet of Things (4 TP)
const TP_IOT: TPSpec[] = [
  { kode_tp: "TP-IOT-01", deskripsi_tuntas: "Mampu memahami arsitektur IoT (device, gateway, cloud)", deskripsi_remediasi: "Review kembali komponen IoT" },
  { kode_tp: "TP-IOT-02", deskripsi_tuntas: "Mampu memprogram mikrokontroler (Arduino/ESP32)", deskripsi_remediasi: "Latihan dasar pemrograman Arduino" },
  { kode_tp: "TP-IOT-03", deskripsi_tuntas: "Mampu menghubungkan sensor dan aktuator", deskripsi_remediasi: "Praktik wiring sensor dan aktuator" },
  { kode_tp: "TP-IOT-04", deskripsi_tuntas: "Mampu mengirim data IoT ke cloud platform", deskripsi_remediasi: "Mempelajari protokol MQTT dan HTTP" },
]

// Instalasi Fiber Optik (4 TP)
const TP_FO: TPSpec[] = [
  { kode_tp: "TP-FO-01", deskripsi_tuntas: "Mampu memahami prinsip dasar fiber optik", deskripsi_remediasi: "Review kembali konsep refleksi total internal" },
  { kode_tp: "TP-FO-02", deskripsi_tuntas: "Mampu melakukan instalasi kabel fiber optik", deskripsi_remediasi: "Latihan splicing dan crimping fiber" },
  { kode_tp: "TP-FO-03", deskripsi_tuntas: "Mampu menggunakan OTDR untuk pengujian", deskripsi_remediasi: "Praktik pembacaan trace OTDR" },
  { kode_tp: "TP-FO-04", deskripsi_tuntas: "Mampu melakukan troubleshooting link fiber", deskripsi_remediasi: "Mempelajari identifikasi fault pada fiber" },
]

// Sistem Operasi Linux (4 TP)
const TP_LINUX: TPSpec[] = [
  { kode_tp: "TP-LINUX-01", deskripsi_tuntas: "Mampu menggunakan command line Linux dasar", deskripsi_remediasi: "Latihan navigasi file system dan perintah dasar" },
  { kode_tp: "TP-LINUX-02", deskripsi_tuntas: "Mampu mengelola user, group, dan permission", deskripsi_remediasi: "Praktik chmod, chown, dan chgrp" },
  { kode_tp: "TP-LINUX-03", deskripsi_tuntas: "Mampu mengkonfigurasi jaringan di Linux", deskripsi_remediasi: "Mempelajari konfigurasi IP dan firewall (iptables)" },
  { kode_tp: "TP-LINUX-04", deskripsi_tuntas: "Mampu mengelola service dengan systemd", deskripsi_remediasi: "Latihan systemctl dan service management" },
]

// =============================================================================
// MASTER LIST
// =============================================================================
const TP_BY_KODE_MAPEL: Record<string, TPSpec[]> = {
  BIND: TP_BAHASA_INDONESIA,
  BING: TP_BAHASA_INGGRIS,
  MTK: TP_MATEMATIKA,
  IPA: TP_IPA,
  IPS: TP_IPS,
  PKN: TP_PKN,
  PJOK: TP_PJOK,
  SB: TP_SENI_BUDAYA,
  BSA: TP_BSA,
  PU: TP_PU,
  AGAMA_ISLAM: TP_AGAMA_ISLAM,
  AGAMA_KRISTEN: TP_AGAMA_KRISTEN,
  AGAMA_KATOLIK: TP_AGAMA_KATOLIK,
  AGAMA_HINDU: TP_AGAMA_HINDU,
  AGAMA_BUDDHA: TP_AGAMA_BUDDHA,
  AGAMA_KONGHUCU: TP_AGAMA_KONGHUCU,
  PWEB: TP_PEMROGRAMAN_WEB,
  PBO: TP_PBO,
  BD: TP_BD,
  PPL: TP_PPL,
  PKWU: TP_PKWU,
  DDK: TP_DDK,
  CS: TP_CS,
  JAR: TP_JAR,
  ADS: TP_ADS,
  CLOUD: TP_CLOUD,
  IOT: TP_IOT,
  FO: TP_FO,
  LINUX: TP_LINUX,
}

export function seedTujuanPembelajaran(
  db: Db,
  mapelIdByKode: Map<string, { id: number; spec: { kode_mapel: string } }>,
): void {
  const taAktif = db
    .select()
    .from(schema.tahunAjaran)
    .where(eq(schema.tahunAjaran.is_active, 1))
    .get()
  if (!taAktif) {
    log(`  ⚠ tujuan_pembelajaran skip: tidak ada TA aktif`)
    return
  }

  const existing = db.select().from(schema.tujuanPembelajaran).all()
  const existingSet = new Set(existing.map((t) => `${t.mapel_id}-${t.kode_tp}-${t.tahun_ajaran_id}`))
  let inserted = 0

  for (const [kodeMapel, tps] of Object.entries(TP_BY_KODE_MAPEL)) {
    const mapelInfo = mapelIdByKode.get(kodeMapel)
    if (!mapelInfo) continue
    for (const tp of tps) {
      const key = `${mapelInfo.id}-${tp.kode_tp}-${taAktif.id}`
      if (existingSet.has(key)) continue
      db.insert(schema.tujuanPembelajaran)
        .values({
          mapel_id: mapelInfo.id,
          kode_tp: tp.kode_tp,
          deskripsi_tuntas: tp.deskripsi_tuntas,
          deskripsi_remediasi: tp.deskripsi_remediasi,
          tahun_ajaran_id: taAktif.id,
        })
        .run()
      inserted++
    }
  }
  log(`  ✓ tujuan_pembelajaran (${inserted} new, TA aktif: ${taAktif.nama})`)
}
