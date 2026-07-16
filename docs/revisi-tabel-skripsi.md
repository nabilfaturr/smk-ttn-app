# Tabel Revisi Skripsi — Validasi 16 Skenario

> **File ini adalah REFERENSI revisi** untuk tabel pengujian di skripsi.docx. Tabel skripsi bukan di repo ini — apply perubahan di file skripsi kamu secara manual.
>
> Tanggal revisi: 2026-07-16
> Berdasarkan hasil E2E validation (Playwright + Electron) terhadap source code aplikasi.

---

## Tabel Rancangan Kasus Uji — REVISI

| No | Use Case | Skenario Pengujian | Teknik | Data Masukan | Hasil yang Diharapkan |
|---|---|---|---|---|---|
| 1 | Login | Login dengan username dan password valid | Equivalence Partitioning (valid) | Username: `admin`, Password: `admin123` | Sistem menerima kredensial dan mengarahkan ke dashboard sesuai role |
| 2 | Login | Login dengan password salah | Equivalence Partitioning (invalid) | Username: `admin`, Password: `salah` | Sistem menolak login dan menampilkan pesan kesalahan |
| 3 | Kelola Data Master | Tambah data siswa baru dengan field lengkap | Use Case Testing | NIS: `2024001`, Nama: `Andi Pratama`, Kelas: `XI TKJ A` | Data siswa berhasil disimpan dan muncul di tabel daftar siswa |
| 4 | Kelola Data Master | Tambah data siswa dengan NIS yang sudah terdaftar | Equivalence Partitioning (invalid) | NIS: `2024001` (duplikat) | Sistem menolak dan menampilkan pesan NIS sudah terdaftar |
| 5 | Kelola Data Master | Hapus data guru yang tidak memiliki kelas | Use Case Testing | Menghapus guru tanpa kelas yang diampu | Data guru berhasil dihapus dari sistem |
| 6 | Input Absensi Harian | Input absensi seluruh siswa untuk satu tanggal | Use Case Testing | Kelas: `XI TKJ A`, Tanggal: `14-07-2026`, Status bervariasi (H, S, I, TK) | Seluruh data absensi berhasil disimpan ke basis data |
| 7 | Input Absensi Harian | **Verifikasi default status Hadir terisi otomatis** | Use Case Testing | Kelas: `XI TKJ A`, buka form input absensi | **Sistem otomatis mengisi status "Hadir" untuk semua siswa** (tidak bisa kosong) |
| 8 | Lihat Rekap Absensi | Lihat rekap absensi dalam rentang satu bulan | Use Case Testing | Kelas: `XI TKJ A`, Periode: 01-07-2026 s.d. 31-07-2026 | Sistem menampilkan tabel rekap dengan total kehadiran per siswa |
| 9 | Lihat Rekap Absensi | Lihat rekap absensi pada periode tanpa data | Use Case Testing | Kelas: `XI TKJ B`, Periode tanpa data | Sistem menampilkan tabel rekap dengan nilai nol pada setiap status |
| 10 | Input Nilai per Mapel | Input nilai formatif dan sumatif lengkap | Use Case Testing | Mapel: Bahasa Indonesia, Formatif: 85, Sumatif: 78, Capaian TP: Tuntas | Nilai Rapor terhitung otomatis, data tersimpan, deskripsi terbentuk |
| 11 | Input Nilai per Mapel | Input nilai di luar rentang 0-100 | Equivalence Partitioning (invalid) | Nilai Formatif: 150 | **Sistem menolak input dan menampilkan pesan "Nilai harus antara 0 dan 100"** |
| 12 | Kelola Tujuan Pembelajaran | **Tambah TP baru dengan input deskripsi tuntas & remediasi secara manual** | Use Case Testing | Kode: `TP-01`, Deskripsi Tuntas: `"Menguasai materi..."`, Deskripsi Remediasi: `"Perlu latihan..."` | TP berhasil disimpan dan muncul di tabel daftar TP |
| 13 | Kelola Tujuan Pembelajaran | Tambah TP dengan kode yang sudah ada | Equivalence Partitioning (invalid) | Kode: `TP-01` (duplikat) | Sistem menolak dan menampilkan pesan kode TP sudah digunakan |
| 14 | Generate Rapor | **Generate rapor DOCX** setelah data lengkap | Use Case Testing | Jenis: Akademik, Kelas: `XI TKJ A`, TA: `2025/2026` | **File DOCX rapor berhasil dihasilkan untuk setiap siswa** |
| 15 | Generate Rapor | **Verifikasi status kelengkapan data setelah pilih kelas** | Use Case Testing | Kelas dengan data nilai belum lengkap | **Sistem menampilkan section "Status Kelengkapan" secara inline di halaman Generate Rapor dengan data yang kurang per siswa** |
| 16 | Logout | Logout dari sesi aktif | Use Case Testing | Menekan tombol "Keluar" pada sidebar | Sesi berakhir, tampilan kembali ke halaman login |

---

## Tabel Hasil Pengujian — REVISI

| No | Skenario Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|
| 1 | Login dengan username dan password valid | Sistem menerima kredensial dan mengarahkan ke dashboard sesuai role | Sistem berhasil memvalidasi kredensial dan mengarahkan ke dashboard admin | **Lulus** |
| 2 | Login dengan password salah | Sistem menolak login dan menampilkan pesan kesalahan | Sistem menampilkan notifikasi "Username atau password salah" | **Lulus** |
| 3 | Tambah data siswa baru dengan field lengkap | Data siswa berhasil disimpan dan muncul di tabel daftar siswa | Data siswa berhasil tersimpan dan ditampilkan di tabel dengan NIS 2024001 | **Lulus** |
| 4 | Tambah data siswa dengan NIS yang sudah terdaftar | Sistem menolak dan menampilkan pesan NIS sudah terdaftar | Sistem menampilkan pesan validasi "NIS sudah terdaftar" | **Lulus** |
| 5 | Hapus data guru yang tidak memiliki kelas | Data guru berhasil dihapus dari sistem | Data guru berhasil dihapus dan tidak lagi muncul di tabel | **Lulus** |
| 6 | Input absensi seluruh siswa untuk satu tanggal | Seluruh data absensi berhasil disimpan ke basis data | Data absensi berhasil disimpan dan muncul di halaman rekap | **Lulus** |
| 7 | Verifikasi default status Hadir terisi otomatis | Sistem otomatis mengisi status "Hadir" untuk semua siswa | Semua radio button "H" ter-centang secara default saat form dibuka | **Lulus** |
| 8 | Lihat rekap absensi dalam rentang satu bulan | Sistem menampilkan tabel rekap dengan total kehadiran per siswa | Sistem menampilkan tabel rekap dengan akumulasi status H, DL, S, I, TK yang sesuai | **Lulus** |
| 9 | Lihat rekap absensi pada periode tanpa data tersimpan | Sistem menampilkan tabel rekap dengan nilai nol pada setiap status | Sistem menampilkan tabel rekap dengan seluruh status bernilai 0 | **Lulus** |
| 10 | Input nilai formatif dan sumatif lengkap untuk satu kelas | Nilai Rapor terhitung otomatis, data tersimpan, deskripsi terbentuk | Nilai Rapor terhitung sesuai rumus (40% formatif + 60% sumatif), deskripsi capaian terbentuk otomatis | **Lulus** |
| 11 | Input nilai di luar rentang 0-100 | Sistem menolak input dan menampilkan pesan "Nilai harus antara 0 dan 100" | Sistem menampilkan toast error "Nilai formatif/sumatif {nama siswa} harus antara 0 dan 100" dan membatalkan penyimpanan | **Lulus** |
| 12 | Tambah TP baru dengan input deskripsi manual | TP berhasil disimpan dan muncul di tabel daftar TP | TP baru berhasil ditambahkan dengan deskripsi tuntas dan remediasi yang diinput manual oleh guru | **Lulus** |
| 13 | Tambah TP dengan kode yang sudah ada | Sistem menolak dan menampilkan pesan kode TP sudah digunakan | Sistem menampilkan pesan "Kode TP sudah digunakan pada mapel ini" | **Lulus** |
| 14 | Generate rapor DOCX setelah seluruh data lengkap | File DOCX rapor berhasil dihasilkan untuk setiap siswa | File rapor DOCX berhasil dibuat dan tersimpan di folder yang ditentukan | **Lulus** |
| 15 | Verifikasi status kelengkapan data setelah pilih kelas | Sistem menampilkan section "Status Kelengkapan" inline di halaman Generate Rapor | Sistem otomatis menjalankan cek kelengkapan saat kelas dipilih dan menampilkan status per siswa di section yang sama | **Lulus** |
| 16 | Logout dari sesi aktif | Sesi berakhir, tampilan kembali ke halaman login | Sesi diakhiri, pengguna diarahkan kembali ke halaman login | **Lulus** |

---

## Perubahan dari Versi Awal

| # | Skenario | Versi Awal | Versi Revisi | Alasan |
|---|---|---|---|---|
| 7 | Simpan absensi tanpa status | "Sistem menampilkan peringatan bahwa status harus diisi" | "Sistem otomatis mengisi status Hadir untuk semua siswa" | Default value "H" di `AttendanceInputPage.tsx:74-77` — tidak mungkin submit tanpa status |
| 11 | Input nilai di luar rentang | "Pesan kesalahan validasi" (umum) | "Pesan 'Nilai harus antara 0 dan 100'" (spesifik) | Ditambah validasi custom di `GradeInputPage.tsx` `handleSave()` agar pesan lebih informatif |
| 12 | Tambah TP + deskripsi otomatis | "Deskripsi tuntas/remediasi terbentuk otomatis" | "Input deskripsi tuntas & remediasi secara manual" | Deskripsi TP adalah field textarea input manual (`LearningObjectivesPage.tsx:90-94`), bukan auto-generate |
| 14 | Generate Rapor PDF | "File PDF rapor" | "File DOCX rapor" | Output generator adalah DOCX (`docxtemplater` di `src/lib/pdf/rapor-akademik.ts`), bukan PDF |
| 15 | Cek kelengkapan terpisah | "Halaman khusus cek kelengkapan" | "Section inline di halaman Generate Rapor" | Cek kelengkapan dipanggil otomatis saat kelas dipilih (`GenerateReportPage.tsx:40`), bukan halaman terpisah |
| 16 | Typo "Lulu" | "Lulu" | "Lulus" | Koreksi typo |

---

## Lokasi Bukti di Repo

- Screenshot per skenario: `tests/e2e/screenshots-skripsi/skripsi-{01-16}-{slug}.png`
- Video recording per skenario: `test-results/videos-skripsi/`
- HTML report (interaktif): `playwright-report/index.html`
- File test source: `tests/e2e/skripsi-16-skenario.e2e.ts`
- Laporan lengkap: `docs/skripsi-e2e-validation.md`
