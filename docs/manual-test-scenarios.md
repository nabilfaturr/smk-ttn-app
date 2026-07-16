# Manual Test Scenarios — SMK TTN

> Checklist pass/fail untuk test manual sinkronisasi Firebase, offline mode, dan rapor prakerin.
> Format: `[ ]` = belum, `[x]` = pass, `[!]` = fail (catat di kolom Notes)
>
> **Test Date**: ____-__-__
> **Tester**: ___________
> **Build**: main @ commit _______
>
> **Total checks**: 24
> **Passed**: ___/24
> **Failed**: ___/24 (catat di bawah)

---

## 0. Pre-Test Setup

- [ ] **0.1** `npm run db:fresh:full` selesai tanpa error → "Selesai!" muncul, 270 siswa tercatat
- [ ] **0.2** Buka app, login `admin` / `admin123` → Dashboard muncul, data stat benar
- [ ] **0.3** Buka `/sync-status`, cek badge status → Badge **ONLINE** (hijau) + last sync time
- [ ] **0.4** Buka https://console.firebase.google.com/project/smk-ttn-app/firestore di browser → Console Firestore bisa diakses, lihat collection `siswa`

---

## 1. Sync Online (Push ke Firestore)

> **Goal**: Bukti data lokal ter-push ke cloud otomatis dalam interval sync (30 detik).

- [ ] **1.1** Catat jumlah siswa di Firestore Console (refresh, hitung) → Misal: 270
- [ ] **1.2** Di app, buka **Data Siswa** → **Tambah Siswa** → Form tambah siswa muncul
- [ ] **1.3** Isi data: NIS `9999`, Nama `[TEST SYNC] Budi Test`, kelas `XII RPL`, agama, dst → Simpan → Toast "Siswa berhasil ditambahkan"
- [ ] **1.4** Kembali ke **Sync Status** page → Lihat angka "Pending: 1" (data belum sync)
- [ ] **1.5** **Tunggu 30-60 detik** (jangan close app) → "Pending: 0", "Last sync: <waktu baru>"
- [ ] **1.6** Refresh Firestore Console → collection `siswa` → Siswa "9999 [TEST SYNC] Budi Test" **MUNCUL**
- [ ] **1.7** (Bonus) Buka **Data Siswa** di app → search "9999" → Siswa ada di list lokal

**Notes**:
_______________________________________________________________________________

---

## 2. Sync Offline (Mode Putus)

> **Goal**: Bukti app jalan normal tanpa internet, data masuk SQLite lokal, tidak push ke cloud.

- [ ] **2.1** Buka **Settings** → **Firebase Sync** → toggle "Sync nonaktif" → Badge jadi **OFFLINE** (merah/kuning)
- [ ] **2.2** Buka **Data Siswa** → tambah siswa baru: NIS `9998`, Nama `[OFFLINE] Ani Offline` → Tersimpan di SQLite lokal
- [ ] **2.3** Cek **Sync Status** → "Pending" counter → Pending **bertambah** (tidak auto-push)
- [ ] **2.4** Buka **Input Nilai** → tambah 1 nilai untuk siswa manapun → Tersimpan, "Pending" counter naik lagi
- [ ] **2.5** Refresh Firestore Console → cari `[OFFLINE] Ani Offline` → **TIDAK ADA** (data belum sampai cloud)
- [ ] **2.6** Bukti: app tetap bisa CRUD normal walau offline → Tidak ada error UI, semua operasi lancar

**Notes**:
_______________________________________________________________________________

---

## 3. Resume Sync (Offline → Online)

> **Goal**: Bukti data offline auto-push begitu koneksi pulih.

- [ ] **3.1** Di Settings, toggle "Sync aktif" lagi → Badge **ONLINE** (hijau)
- [ ] **3.2** Kembali ke **Sync Status** → Pending counter langsung proses, turun ke 0 dalam 30 detik
- [ ] **3.3** Last sync timestamp update → "Last sync: <beberapa detik lalu>"
- [ ] **3.4** Refresh Firestore Console → `[OFFLINE] Ani Offline` + nilai baru **MUNCUL**

**Notes**:
_______________________________________________________________________________

---

## 4. Real-Time Listener (Pull dari Firestore)

> **Goal**: Bukti perubahan di cloud otomatis ter-pull ke lokal tanpa manual refresh.

- [ ] **4.1** Di app, buka **Data Siswa** → List 271 siswa (270 + 2 hasil test sync sebelumnya)
- [ ] **4.2** Di **Firestore Console** (browser), edit 1 siswa (misal ubah nama "Budi Test" → "Budi Edited") → Otomatis tanpa save button
- [ ] **4.3** **Di app, refresh halaman Data Siswa** (tanpa manual reload) → Nama "Budi Edited" muncul dalam beberapa detik (real-time listener)
- [ ] **4.4** Tambah 1 siswa langsung di Firestore Console (klik "Add document") → Siswa baru muncul di app (auto-pull)

**Notes**:
_______________________________________________________________________________

---

## 5. Prakerin — Generate Batch DOCX

> **Goal**: Bukti batch generate 30 file DOCX rapor prakerin untuk XII TKJ A.

- [ ] **5.1** Login sebagai `walikelas` / `wali123` (wali kelas XII TKJ A) → Dashboard wali kelas
- [ ] **5.2** Buka menu **Generate Report** → Halaman report muncul
- [ ] **5.3** Pilih tipe: **"Rapor Prakerin"** + kelas **XII TKJ A** → Form konfigurasi muncul
- [ ] **5.4** Klik tombol **"Generate Batch"** → Progress bar / spinner muncul, proses ~5-10 detik
- [ ] **5.5** Muncul toast "Berhasil generate 30 file DOCX" → 30 file .docx terbentuk
- [ ] **5.6** Buka File Explorer ke `%APPDATA%\smk-ttn-app\Rapor\XII TKJ A\Prakerin\` (Windows) atau `~/.config/smk-ttn-app/Rapor/XII TKJ A/Prakerin/` (Linux) → 30 file .docx ada di folder

**Notes**:
_______________________________________________________________________________

---

## 6. Prakerin — Verifikasi Isi DOCX

> **Goal**: Bukti field-field rapor terisi benar sesuai data DB.

- [ ] **6.1** Buka file DOCX siswa pertama (misal NIS 2331 / Pratama Sutanto) di Microsoft Word → File terbuka, tidak corrupt
- [ ] **6.2** Cek field-field ini terisi benar:
  - [ ] Nama: "Pratama Sutanto" → Terisi
  - [ ] NIS, NISN → Terisi sesuai DB
  - [ ] Kelas: "XII TKJ A" (bukan hardcode XII RPL) → Terisi benar
  - [ ] Pembimbing Sekolah, Pembimbing Instansi → Ada nama pembimbing
  - [ ] Tempat Prakerin (mis. "Dinas Kominfo...") → Ada nama perusahaan/instansi
  - [ ] Tanggal Prakerin (1 Juli - 30 September 2025) → Terisi
  - [ ] TP1 + deskripsi + skor → Ada
  - [ ] TP2 + deskripsi + skor → Ada
- [ ] **6.3** Buka file siswa berbeda (misal NIS 2400+) → Data **BERBEDA** (tidak copy-paste sama)

**Notes**:
_______________________________________________________________________________

---

## 7. Prakerin — Editable Test (Selling Point)

> **Goal**: Bukti DOCX rapor benar-benar editable di Microsoft Word (bukan PDF/read-only).

- [ ] **7.1** Di file DOCX yang terbuka (Test 6), **klik di area nama siswa** → Cursor muncul, text bisa di-edit
- [ ] **7.2** **Tambah kata "[EDITED]"** di belakang nama, save file → File tersimpan, format tidak rusak
- [ ] **7.3** Tutup & buka lagi file .docx → Editan "[EDITED]" **MASIH ADA**
- [ ] **7.4** Edit field angka (mis. tambah nilai TP1 dari 83 → 90) → Bisa diedit, layout tidak rusak
- [ ] **7.5** Tambah baris baru di tabel nilai → Baris baru masuk, format table rapi

**Notes**:
_______________________________________________________________________________

---

## 8. Cek Kelengkapan Data

> **Goal**: Bukti fitur cek kelengkapan handle kelas XII (prakerin) dan non-XII (skip prakerin).

- [ ] **8.1** Login `admin`, buka **Cek Kelengkapan** → Tabel status per kelas muncul
- [ ] **8.2** Pilih kelas **XII TKJ A** → Status kelengkapan: lengkap (nilai + prakerin + absensi)
- [ ] **8.3** Pilih kelas **X RPL 1** (kelas X, tidak ada prakerin) → Status: hanya cek nilai + absensi (prakerin di-skip)
- [ ] **8.4** Coba generate rapor untuk kelas dengan status tidak lengkap → Tombol disabled / warning message

**Notes**:
_______________________________________________________________________________

---

## FAIL Details

```
Step #: ___ | Expected "___", got "___". Screenshot: ___
Step #: ___ | Expected "___", got "___". Screenshot: ___
Step #: ___ | Expected "___", got "___". Screenshot: ___
```

---

## Minimum Viable Demo (kalau waktu mepet)

3 test ini cukup untuk menunjukkan fitur utama:

1. **Test 1** (Sync Online) — push real-time ke Firestore
2. **Test 3** (Resume Sync) — offline-first, auto-resume
3. **Test 7** (Editable DOCX) — rapor editable di Word

---

## Cleanup setelah test

```bash
# Hapus data test dari SQLite (manual via UI atau SQL)
# Hapus 2 siswa test sync (NIS 9998, 9999) dari Data Siswa

# Hapus data test dari Firestore (manual via Console)
# Cari & delete doc dengan NIS 9998, 9999

# Hapus file rapor test
rm -rf "%APPDATA%\smk-ttn-app\Rapor\XII TKJ A\Prakerin\"
# atau di Linux:
rm -rf ~/.config/smk-ttn-app/Rapor/XII\ TKJ\ A/Prakerin/

# Re-seed kalau mau bersih total
npm run db:fresh:full
```
