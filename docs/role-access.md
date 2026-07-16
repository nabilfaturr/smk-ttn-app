# Peta Akses Per-Role

> Referensi halaman yang bisa diakses masing-masing role + action yang tersedia.
> Update: 2026-07-16 (sinkron dengan `src/App.tsx` + `src/components/layout/Sidebar.tsx`)

## Daftar Role

| Role | Username default | Password | Akun demo |
|------|------------------|----------|-----------|
| **admin** | `admin` | `admin123` | - |
| **wali_kelas** | `walikelas` | `wali123` | wali kelas XII RPL |
| **guru** | `guru` | `guru123` | guru mapel BIND, mengajar X TEST |
| **wali_kelas,guru** | (gabungan, 6 guru) | `smkttn2026` | 6 guru dengan role gabungan |

> Role disimpan sebagai comma-separated string di `users.role` (lihat `scripts/seed/data/users.ts:121`).
> Contoh user dengan role gabungan: `wali_kelas,guru` → menu = unique union dari kedua role (de-dup by path).

---

## 🔴 ADMIN — 19 menu (full access)

| # | Halaman | Path | Aksi yang bisa dilakukan |
|---|---------|------|--------------------------|
| 1 | **Dashboard** | `/dashboard` | Statistik global: total siswa, guru, kelas, mapel, rekap absensi, distribusi nilai. Statistik per kelas & per mapel. |
| 2 | **Data Siswa** | `/students` | CRUD siswa: tambah, edit, hapus (soft-delete), import CSV. Filter by kelas/agama, search by nama/NISN. |
| 3 | **Data Kelas** | `/classes` | CRUD kelas: tambah/edit, assign wali kelas, set tingkat (X/XI/XII) + program keahlian (RPL/TKJ). |
| 4 | **Data Guru** | `/teachers` | CRUD guru: biodata (NIP, nama, jenisKelamin, bidang studi), create user account, set role. |
| 5 | **Data Mapel** | `/subjects` | CRUD mapel: kode_mapel, nama_mapel, kelompok, jenis, agama_target. |
| 6 | **Tahun Ajaran** | `/academic-years` | CRUD tahun ajaran. Set semester, set TA aktif (hanya 1 yang aktif). |
| 7 | **Absensi** (rekap) | `/attendance` | Lihat rekap absensi **semua kelas**. Filter by kelas/mapel/periode. |
| 8 | **Nilai** | `/grades` | Input nilai akademik (formatif + sumatif + TP) **semua siswa semua mapel**. Filter by kelas/mapel. |
| 9 | **Ekstrakurikuler** | `/ekskul` | CRUD ekskul + nilai ekskul siswa. Set status "wajib" atau pilihan. |
| 10 | **Kelola Guru Pengampu** | `/mapel-assignments` | Manage junction mapel-kelas-guru. Assign guru pengampu untuk setiap (mapel, kelas, TA). |
| 11 | **Kelola TP** | `/master/learning-objectives` | CRUD Tujuan Pembelajaran. Filter by mapel. |
| 12 | **Arsip** | `/arsip` | Lihat soft-deleted records. Restore atau hapus permanen. |
| 13 | **Kokurikuler (P5)** | `/kokurikuler` | Input nilai P5 per siswa per subdimensi. Pilih Berkembang/Cakap/Mahir dengan narasi auto. |
| 14 | **Atur Kokurikuler/Tingkat** | `/kokurikuler/tingkat` | Toggle dimensi P5 aktif/non-aktif per tingkat (X/XI/XII). |
| 15 | **Prakerin** | `/prakerin` | CRUD nilai prakerin. Set nama perusahaan, pembimbing, nilai, absensi prakerin. |
| 16 | **Catatan Wali Kelas** | `/teacher-notes` | Edit catatan wali kelas **semua siswa**. Pilih siswa + TA, tulis narasi. |
| 17 | **Generate Rapor** | `/generate-report` | Pilih siswa + format (DOCX/PDF), generate rapor resmi. |
| 18 | **Sinkronisasi** | `/sync` | Monitor Firebase sync: status per collection, last sync, pending records, conflict resolution. |
| 19 | **Pengaturan** | `/settings` | Info sekolah, konfigurasi bobot nilai, ganti password, Firebase config. |

---

## 🟢 WALI KELAS — 4 menu (fokus absensi & catatan)

| # | Halaman | Path | Aksi yang bisa dilakukan |
|---|---------|------|--------------------------|
| 1 | **Dashboard** | `/dashboard` | Dashboard wali kelas: hanya data kelas yang di-wali-kan. Rekap absensi kelas sendiri. |
| 2 | **Input Absensi** | `/attendance/input` | Input absensi harian siswa **kelas sendiri**. Pilih tanggal → centang H/I/S/A per siswa. |
| 3 | **Rekap Absensi** | `/attendance/recap` | Rekap absensi per siswa **kelas sendiri**. Filter by bulan/mapel. Total H/I/S/A + persentase. |
| 4 | **Catatan Wali Kelas** | `/teacher-notes` | Edit catatan wali kelas siswa **kelas sendiri**. Template narasi kekuatan/pengembangan/saran. |

> Wali kelas = GURU yang担任 homeroom. Job desc utama: absensi + catatan wali.

---

## 🔵 GURU — 3 menu (fokus mengajar)

| # | Halaman | Path | Aksi yang bisa dilakukan |
|---|---------|------|--------------------------|
| 1 | **Dashboard** | `/dashboard` | Dashboard guru: mapel yang di-ampuh + kelas yang diajar. Quick stats nilai. |
| 2 | **Input Nilai** | `/grades/input` | Input nilai akademik (formatif + sumatif) **hanya untuk mapel yang di-ampuh**. Pilih kelas dari junction. |
| 3 | **Kelola TP** | `/master/learning-objectives` | CRUD TP **hanya untuk mapel yang di-ampuh**. Tidak bisa edit TP mapel orang lain. |

> Guru **tidak bisa** input absensi atau tulis catatan wali (kecuali juga wali_kelas).

---

## 🔀 GABUNGAN: WALI KELAS + GURU — 6 menu

Menu = unique union dari 2 role (de-dup by path):
1. Dashboard
2. Input Absensi
3. Rekap Absensi
4. Catatan Wali Kelas
5. Input Nilai
6. Kelola TP

---

## Sumber Kode

- Route config: `src/App.tsx:39-89`
- Sidebar menu config: `src/components/layout/Sidebar.tsx:30-63`
- Role guard logic: `src/lib/utils/auth.ts` (ProtectedRoute, RoleRoute)
- Seed users: `scripts/seed/data/users.ts:114-176`
- Auth store: `src/stores/authStore.ts`
