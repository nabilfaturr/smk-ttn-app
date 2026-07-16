# Script Demo Video — 7-8 Menit

> **Target**: Dosen pembimbing
> **Highlight utama**: Rapor digital (DOCX + PDF)
> **Narrative**: "Input data harian guru → output rapor resmi digital, otomatis, ranking & nilai TP included"
> **Update**: 2026-07-16

## Prasyarat

- [ ] DB sudah fresh: `npm run db:fresh:full` (sudah 270 siswa, 34 mapel, 261 junction, dst.)
- [ ] better-sqlite3 di-rebuild ke Electron ABI: `npx electron-rebuild -f -w better-sqlite3`
- [ ] App jalan: `npm run dev`
- [ ] Login default: `admin/admin123`, `guru/guru123`, `walikelas/wali123`
- [ ] Window size: 1280×800 atau 1440×900
- [ ] Mic + screen recorder ready (OBS / Loom / ScreenFlow)

## Sample Flow

> ⚠ **Pilih 1 siswa XII RPL ranking 1-3** untuk subjek demo rapor. Cara:
> 1. Login admin → `/generate-report`
> 2. Pilih kelas XII RPL, sort by nilai rapor descending
> 3. Catat nama siswa untuk dipakai di step Rapor (06:50)

---

## Timeline Detail

### 🎬 00:00 — INTRO (20 detik)

**Visual**:
- Logo SMK TTN + judul aplikasi fade in
- Background: putih bersih, font modern

**Narasi**:
> "Sistem Absensi & Penilaian SMK Taruna Tekno Nusantara — aplikasi desktop berbasis Electron untuk mendigitalisasi absensi, penilaian, dan rapor siswa. **Highlight utama**: generate rapor resmi DOCX/PDF dengan ranking otomatis."

**Screen text (lower-third)**: "Stack: Electron + React + TypeScript + SQLite + Firebase sync (opsional)"

---

### 🔐 00:20 — LOGIN MULTI-ROLE (30 detik)

**Visual**:
- Login admin (`admin/admin123`) → Dashboard
  - Tunjuk: 270 siswa, 18 guru, 9 kelas, 3.780 absensi
- Logout → Login guru (`guru/guru123`) → Dashboard guru
- Logout → Login wali kelas (`walikelas/wali123`) → Dashboard wali kelas

**Narasi**:
> "Tiga role berbeda: admin, guru, wali kelas. Masing-masing punya dashboard sendiri, sesuai job desc."

**Highlight**: Beda sidebar per role (admin = 19 menu, guru = 3 menu, wali kelas = 4 menu).

---

### 📋 00:50 — MASTER DATA (45 detik, cepat)

**Visual**:
- Sidebar admin → **Data Siswa** → show 270 siswa
  - Filter "XII RPL" → 30 siswa
  - Search by nama → instan
- **Data Mapel** → 34 rows, scroll cepat
- **Kelola Guru Pengampu** → 261 junction, filter "BIND" → 9 kelas

**Narasi**:
> "Master data real: 270 siswa di 9 kelas, 34 mapel, 261 kombinasi mapel-kelas-guru. Semua auto-backfilled saat seed."

---

### 📊 01:35 — INPUT NILAI (1 menit)

**Visual**:
- **Nilai** (`/grades`) → Pilih kelas XII RPL, mapel BIND
- Tunjuk grid 30 siswa × nilai formatif/sumatif
- Highlight 1-2 siswa → edit nilai → save → reload
- Tunjuk distribusi nilai (realistic 30/50/20)

**Narasi**:
> "Guru input nilai formatif dan sumatif. Rapor auto-calculate: 0.4 × formatif + 0.6 × sumatif. Distribusi realistic: 30% high achiever, 50% average, 20% struggling."

**Highlight**: 2.700 records nilai + 2.250 nilai TP sudah ter-seed.

---

### 📅 02:35 — ABSENSI (45 detik)

**Visual**:
- **Absensi** (`/attendance`) → rekap XII RPL
- Tunjuk 1 baris siswa → total H/I/S/A + persentase
- Filter by bulan "Januari 2026" → data shrink

**Narasi**:
> "Rekap absensi real-time. Wali kelas bisa input harian, rekap bisa dilihat admin. 3.780 records dengan distribusi H/I/S/A realistic."

---

### 📝 03:20 — CATATAN WALI (30 detik, cepat)

**Visual**:
- **Catatan Wali Kelas** (`/teacher-notes`) → pilih siswa XII RPL
- Show 1 catatan narasi yang sudah ada
- Edit → save → reload → persisted

**Narasi**:
> "Setiap siswa punya catatan narasi unik dari wali kelas. Template: kekuatan + pengembangan + saran. 270 catatan sudah ter-seed untuk semua kelas."

---

### 🎯 03:50 — RAPOR DIGITAL (3 menit, **HIGHLIGHT**)

**Visual — STEP A: Setup (45 detik)**:
- **Generate Rapor** (`/generate-report`)
- Pilih siswa (ranking 1-3 XII RPL, dari sample flow di atas)
- Pilih format: **DOCX** + **PDF** (centang dua-duanya)
- Tunjuk data yang akan masuk rapor:
  - Info sekolah (dari Settings)
  - Biodata siswa
  - 14 nilai mapel (formatif, sumatif, rapor, TP)
  - 3 nilai ekskul
  - 9 nilai kokurikuler (P5)
  - Nilai prakerin (kalau XII TKJ)
  - Catatan wali
  - Ranking kelas

**Narasi**:
> "Sekarang highlight utama: generate rapor resmi. Pilih siswa, pilih format, klik tombol. Data diambil real-time dari database — bukan hardcode."

**Visual — STEP B: Generate (30 detik)**:
- Klik "Generate DOCX" → progress bar → file saved dialog
- Klik "Generate PDF" → progress bar → file saved dialog

**Narasi**:
> "Dua format output: DOCX untuk editable (template sekolah, bisa diedit), PDF untuk arsip final."

**Visual — STEP C: Show DOCX (45 detik)**:
- Buka file DOCX di Microsoft Word / LibreOffice
- Scroll halaman 1: kop sekolah, biodata siswa, semester
- Halaman 2: tabel nilai akademik (14 mapel) — formatif, sumatif, rapor
- Halaman 3: nilai TP per mapel (Tercapai / Perlu Bimbingan)
- Halaman 4: ekskul, kokurikuler, prakerin
- Halaman 5: catatan wali, ranking, tanda tangan

**Narasi**:
> "DOCX pakai template sekolah — `build/rapor-template.docx` di repo. Pihak sekolah bisa customize template tanpa modify code. Field Word MERGEFIELD di-render otomatis via docxtemplater."

**Visual — STEP D: Show PDF (30 detik)**:
- Buka file PDF di viewer
- Tunjuk: layout sama dengan DOCX, tapi PDF fixed

**Narasi**:
> "PDF generated via pdfkit, layout fixed untuk arsip. Ranking dihitung via standard competition ranking, bukan hardcode — bisa dilihat di `src/lib/calculations/ranking.ts`."

**Visual — STEP E: Tech deep-dive (30 detik)** *(opsional, tergantung pace)*:
- Buka VSCode → `build/rapor-template.docx` di file explorer
- Tunjuk field `«NAMA_SISWA»`, «NILAI_BIND», «RANK»
- Buka `src/lib/pdf/rapor-docx.ts` (snippet)
- Buka `src/lib/pdf/rapor-akademik.ts` (snippet)

**Narasi**:
> "Template rapor customizable di repo, generator ada di `src/lib/pdf/`. Maintenance-friendly: edit template → regenerate, gak perlu rebuild app."

---

### ⚙️ 06:50 — SETTINGS (30 detik)

**Visual**:
- **Pengaturan** (`/settings`) → tab Info Sekolah
  - Tunjuk: SMK Taruna Tekno Nusantara, kepala sekolah, NPSN
- Tab Konfigurasi → bobot formatif 0.4, sumatif 0.6
- Tab Sinkronisasi → Firebase (opsional, kalau sudah setup)

**Narasi**:
> "Konfigurasi disimpan lokal di SQLite, gak butuh server. Firebase sync opsional untuk multi-device — aktifkan kalau perlu, matikan kalau single-device."

---

### 👋 07:20 — OUTRO (10 detik)

**Visual**:
- Logo SMK TTN fade in
- Text: "Terima kasih"
- QR code → repo GitHub
- Lower-third: kontak

**Narasi**:
> "Terima kasih. Aplikasi ini paperless 100%, data lokal, sinkronisasi opsional. Open source untuk SMK Taruna Tekno Nusantara."

---

## Total: ~7:30 (dengan buffer 30 detik untuk transisi)

---

## Persiapan Sebelum Syuting

- [ ] **DB fresh**: `npm run db:fresh:full` ✅
- [ ] **Rebuild ABI**: `npx electron-rebuild -f -w better-sqlite3` ✅
- [ ] **Pilih siswa XII RPL** untuk demo rapor (ranking 1-3)
- [ ] **Test generate rapor manual** — confirm DOCX + PDF generated tanpa error
- [ ] **Window size**: 1280×800 atau 1440×900
- [ ] **Disable sync** (kalau belum setup Firebase): set `SMK_TTN_DISABLE_SYNC=1` di env
- [ ] **Test mic + audio level**
- [ ] **Prepare**: file `rapor-template.docx` open in Word untuk ditunjuk di deep-dive
- [ ] **VSCode theme**: dark mode, font size cukup besar (16-18pt) untuk terbaca di video

## FAQ untuk Dosen (siapkan jawaban)

| Pertanyaan | Jawaban singkat |
|------------|-----------------|
| Kenapa Electron, bukan web? | Offline-first, data lokal SQLite, install .exe, cocok untuk sekolah dengan internet terbatas |
| Kenapa gak pakai Next.js / React biasa? | Web app butuh hosting & internet. Electron = desktop app, single binary, no infra |
| Sync Firebase gimana? | Opsional, interval 30 detik, push perubahan lokal → Firestore, conflict resolution by `updated_at` |
| Ranking algoritma? | Standard competition ranking (1, 2, 2, 4) — bukan dense ranking. Lihat `src/lib/calculations/ranking.ts` |
| Template rapor siapa yang punya? | Pihak sekolah, format resmi. App cuma render field. Template editable tanpa coding. |
| E2E test ada? | Ada, 170 tests di 30 file Playwright. Functional test 8/8 pass untuk grade input. |
| Security? | Role-based access (admin/guru/wali_kelas), bcrypt password, foreign keys ON. |
| Open source? | Ya, MIT license. Repo public. |

---

## Catatan Pasca-Syuting

Setelah recording, jangan lupa:
1. Edit video: cut bagian idle, tambah lower-third, subtitle (opsional)
2. Compress untuk upload (HandBrake / FFmpeg)
3. Upload ke YouTube / platform dosen
4. Kirim link ke dosen pembimbing

Semoga lancar! 🎬
