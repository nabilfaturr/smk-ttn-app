# Panduan Lengkap: SMK TTN Desktop App (Windows)

> **Versi:** 1.0.0  
> **Update:** 29 Juni 2026  
> **Repo:** https://github.com/nabilfaturr/smk-ttn-app  
> **Target user:** Developer / admin sekolah yang akan build, install, atau develop project ini di Windows

---

## Daftar Isi

1. [Overview Project](#1-overview-project)
2. [Prerequisites](#2-prerequisites)
3. [Setup Awal (Fresh Windows)](#3-setup-awal-fresh-windows)
4. [Clone Repository](#4-clone-repository)
5. [Install Dependencies](#5-install-dependencies)
6. [Build Production (.exe)](#6-build-production-exe)
7. [Install & Test](#7-install--test)
8. [Verification Checklist](#8-verification-checklist)
9. [Troubleshooting](#9-troubleshooting)
10. [Development Workflow](#10-development-workflow)
11. [Database Management](#11-database-management)
12. [Rapor Template](#12-rapor-template)
13. [Build Ulang](#13-build-ulang)
14. [Push ke GitHub](#14-push-ke-github)
15. [Distribusi ke Sekolah](#15-distribusi-ke-sekolah)
16. [FAQ](#16-faq)

---

## 1. Overview Project

**Sistem Absensi dan Penilaian SMK TTN** adalah aplikasi desktop untuk mengelola:

- **Data master**: siswa, kelas, mata pelajaran, guru, tahun ajaran
- **Absensi**: input & rekap kehadiran harian per siswa
- **Penilaian**: input nilai (UH, UTS, UAS, tugas, portofolio)
- **Rapor**: cetak rapor akademik (DOCX), rapor P5/kokurikuler, rapor prakerin
- **Arsip**: backup nilai per tahun ajaran
- **Laporan**: export CSV/Excel
- **Sync cloud** (opsional): sinkronisasi ke Firebase Firestore

### Tech Stack

| Layer | Teknologi |
|---|---|
| Shell | Electron 33 (NSIS installer) |
| Renderer | React 19 + React Router 7 |
| Bundler | Vite 6 + vite-plugin-electron |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix UI) |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Auth | bcryptjs (local) + Firebase (optional cloud) |
| Laporan | docxtemplater (DOCX), pdfkit (PDF) |
| Testing | Vitest (unit), Playwright (E2E) |
| Sync | Firebase 11 (Firestore) |

### Default Admin

- **Username**: `admin`
- **Password**: `admin123`
- **Ganti setelah first login** via Settings → Ubah Password

---

## 2. Prerequisites

### Hardware Minimum
- **CPU**: 64-bit, dual-core (Intel/AMD)
- **RAM**: 4 GB (recommended 8 GB untuk development)
- **Disk**: 5 GB free (3 GB untuk `node_modules`, 1 GB untuk build, 1 GB untuk app)
- **OS**: Windows 10 22H2 (build 19045) atau Windows 11

### Software yang Diperlukan

| Software | Versi | Download | Kebutuhan |
|---|---|---|---|
| **Node.js** | ≥ 20.x LTS | https://nodejs.org/ | Runtime + npm |
| **Git for Windows** | Latest | https://git-scm.com/download/win | Clone repo |
| **Visual Studio Code** (opsional) | Latest | https://code.visualstudio.com/ | Editor |
| **NSIS** | 3.x | Auto-installed by electron-builder | Build installer |

> **Catatan**: NSIS tidak perlu di-install manual. `electron-builder` download otomatis saat pertama kali build.

---

## 3. Setup Awal (Fresh Windows)

### Step 1: Install Node.js
1. Buka https://nodejs.org/
2. Download **Windows Installer (.msi)** — pilih versi **20.x LTS** atau **22.x LTS**
3. Jalankan installer
4. Centang **"Add to PATH"** (default-nya udah ke-check)
5. Klik **Next → Next → Install**
6. Restart terminal setelah install

Verifikasi:
```powershell
node --version
# Expected: v20.x.x atau v22.x.x

npm --version
# Expected: 10.x.x atau 11.x.x
```

### Step 2: Install Git for Windows
1. Buka https://git-scm.com/download/win
2. Download **64-bit Git for Windows Setup**
3. Jalankan installer dengan **default options** (semuanya OK)
4. Pilih **"Use Visual Studio Code as Git's default editor"** (kalau lo pake VSCode)
5. **"Git from the command line and also from 3rd-party software"** (default, OK)
6. **"Use bundled OpenSSH"** (default, OK)
7. **"Use the OpenSSL library"** (default, OK)
8. **"Checkout Windows-style, commit Unix-style"** (default, OK)
9. **"Use MinTTY"** (default, OK)
10. **"Default (fast-forward or merge)"** (default, OK)
11. **"Git Credential Manager"** (default, OK)
12. **"Enable file system caching"** (default, OK)
13. **"Enable experimental support for pseudo consoles"** (default, OK)
14. Klik **Install**

Verifikasi:
```powershell
git --version
# Expected: git version 2.x.x
```

### Step 3: Install VSCode (opsional, recommended)
1. Buka https://code.visualstudio.com/
2. Download **User Installer x64**
3. Jalankan, next-next-finish
4. Install extension yang direkomendasikan:
   - **ESLint** (dbaeumer.vscode-eslint)
   - **Prettier** (esbenp.prettier-vscode)
   - **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
   - **TypeScript Vue Plugin (Volar)** (Vue.volar) - opsional

### Step 4: Restart terminal
Tutup semua terminal/PowerShell, buka yang baru supaya PATH ke-refresh.

---

## 4. Clone Repository

Buka **Git Bash** (atau PowerShell), jalankan:

```bash
cd C:\
git clone https://github.com/nabilfaturr/smk-ttn-app.git
cd smk-ttn-app
```

Atau kalau mau di folder lain (misal `D:\projects\`):
```bash
cd /d/projects
git clone https://github.com/nabilfaturr/smk-ttn-app.git
cd smk-ttn-app
```

Verifikasi:
```bash
ls
# Expected: src/, electron/, build/, package.json, dll.

git status
# Expected: On branch main, nothing to commit, working tree clean
```

---

## 5. Install Dependencies

### Step 1: Copy `.env.example` ke `.env`
```bash
cp .env.example .env
```

File `.env` di-ignore dari git. **Wajib dibuat manual** untuk development. Isi dengan Firebase config asli kalo mau pake sync cloud (lihat `.env.example` untuk instruksi).

Untuk **development lokal tanpa Firebase sync**, `.env` boleh kosong / default values.

### Step 2: Install npm packages
```bash
npm install
```

Proses ini download ~500 MB packages (termasuk native modules, Electron binaries, font files). Tunggu **3-5 menit**.

Kalau ada error:
- **Permission denied**: jalankan Git Bash sebagai Administrator
- **Network timeout**: cek koneksi internet, retry
- **`better-sqlite3` build error**: install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (lihat [Troubleshooting §9](#9-troubleshooting))

Verifikasi:
```bash
ls node_modules/ | head
# Expected: list folder

ls node_modules/better-sqlite3/build/Release/
# Expected: better_sqlite3.node
```

---

## 6. Build Production (.exe)

Ada 3 step yang **harus berurutan**:

### Step 1: Rebuild `better-sqlite3` untuk Electron ABI
```bash
npx electron-rebuild -f -w better-sqlite3
```

Output yang diharapkan:
```
✔ Rebuild Complete
```

> **Penting!** Tanpa step ini, `better-sqlite3` pakai Node.js ABI. App bakal crash pas load database karena Electron pakai ABI berbeda.

### Step 2: Build renderer (Vite)
```bash
npx vite build
```

Output: `dist/` folder (HTML + JS + CSS bundle)

### Step 3: Build installer (electron-builder)
```bash
npx electron-builder --win --x64
```

Proses ini:
- Download Windows Electron binary (~100 MB, sekali)
- Compile native modules untuk Windows
- Pack ke `app.asar` (~530 MB unpacked)
- Generate NSIS installer (~200 MB)

Output: `dist\Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe`

> **Catatan**: NSIS download hanya sekali. Build berikutnya akan lebih cepat (~1-2 menit).

### Full one-liner (opsional)
Kalau Males ngetik 3x, gabung jadi satu:
```bash
npx electron-rebuild -f -w better-sqlite3 && npx vite build && npx electron-builder --win --x64
```

### Output structure
```
dist/
├── builder-debug.yml                          (debug log)
├── builder-effective-config.yaml              (effective config)
├── Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe       (⭐ INSTALLER)
├── Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe.blockmap
└── win-unpacked/                              (extracted app, untuk debug)
    ├── Sistem Absensi dan Penilaian SMK TTN.exe
    ├── resources/
    │   ├── app.asar
    │   └── app.asar.unpacked/
    │       └── node_modules/better-sqlite3/build/Release/better_sqlite3.node
    └── ...
```

---

## 7. Install & Test

### Step 1: Install
1. Buka File Explorer, navigate ke `dist\`
2. Double-click `Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe`
3. Klik **Yes** di UAC prompt
4. Pilih installation directory (default: `C:\Program Files\Sistem Absensi dan Penilaian SMK TTN\`)
5. Klik **Install**
6. Centang **"Run Sistem Absensi dan Penilaian SMK TTN"** → klik **Finish**

### Step 2: First Login
- Window aplikasi muncul
- **Username**: `admin`
- **Password**: `admin123`
- Klik **Login**

### Step 3: Quick smoke test
1. **Dashboard** muncul dengan stats
2. Buka menu **Master → Siswa** → ada daftar siswa
3. Buka menu **Master → Kelas** → ada daftar kelas
4. Buka menu **Tahun Ajaran** → ada TA aktif
5. **Ganti password** via Settings → Ubah Password (best practice)

---

## 8. Verification Checklist

Setelah install, verify bahwa semua fitur penting berfungsi:

### Login & Auth
- [ ] Bisa login dengan `admin` / `admin123`
- [ ] Settings → Ubah Password berfungsi
- [ ] Logout & login ulang dengan password baru works

### Master Data
- [ ] Menu **Siswa** menampilkan daftar siswa
- [ ] Menu **Kelas** menampilkan daftar kelas
- [ ] Menu **Mata Pelajaran** menampilkan daftar mapel
- [ ] Menu **Guru** menampilkan daftar guru
- [ ] **Tahun Ajaran** bisa diganti (dropdown di header)

### Absensi
- [ ] Menu **Absensi → Input Absensi** bisa input data
- [ ] **Rekap Absensi** menampilkan data yang di-input
- [ ] Filter per kelas & tanggal works

### Penilaian
- [ ] Menu **Nilai → Input Nilai** bisa input nilai
- [ ] Filter per kelas + mapel + siswa works
- [ ] Nilai muncul di rekap dengan benar
- [ ] **Ranking** otomatis terhitung

### Rapor Akademik (⭐ CRITICAL)
Generate rapor untuk test siswa, lalu verify:

- [ ] **Tabel 1 (Identitas Siswa)**: nama, NIS, kelas, alamat, ortu/wali lengkap
- [ ] **Tabel 2 (Nilai Akademik)**: list mata pelajaran + nilai + predikat
- [ ] **Tabel 3 (Kokurikuler)**: ada
- [ ] **Tabel 4 (Ekstrakurikuler)**: ada
- [ ] **Tabel 5 (Ketidakhadiran + Catatan)**: ada
- [ ] **Tabel 6 (Tanggapan)**: 
  - Header biru (warna `#deeaf6`)
  - Ada 3 baris kosong untuk tulisan tangan
  - Border lengkap (4 sisi)
- [ ] **TTD section** (di bawah Tabel 6):
  - Ada tanggal di kanan
  - "Ortu/Wali" di kiri, "Kepala Sekolah" di tengah
  - Ada dot signature lines (`.....`) untuk ortu/wali
  - Ada dot signature line untuk kepala sekolah
  - "Nama: ............................" di bawah masing-masing

### Bug Fixes (4 fixes dari 2026-06-29)
- [ ] **Fix #1**: Field "Bidang Keahlian" tidak typo (cek `bidang_keahlianoan`, bukan `bid_keahlianoan`)
- [ ] **Fix #2**: Field "Tahun Ajaran" muncul (bukan kosong atau typo `tahun_pelajaran`)
- [ ] **Fix #3**: **Pendidikan Agama** muncul untuk SEMUA agama (ISLAM, KRISTEN, KATOLIK, HINDU, BUDDHA, KHONGHUCU)
- [ ] **Fix #4**: Tidak ada field `«RANK»` (MERGEFIELD Word yang belum di-render) di rapor

### Sync Cloud (opsional, kalo pake Firebase)
- [ ] Settings → Firebase Sync bisa dikonfigurasi
- [ ] Tombol "Sync Now" berfungsi tanpa error

---

## 9. Troubleshooting

### Problem: App gak jalan sama sekali (silent crash)

**Gejala**: Double-click .exe atau run dari CMD, langsung balik ke prompt tanpa error.

**Diagnosis**:
```powershell
cd "C:\Program Files\Sistem Absensi dan Penilaian SMK TTN"
$env:ELECTRON_ENABLE_LOGGING="1"
.\Sistem*.exe 2>&1
echo "Exit code: $LASTEXITCODE"
```

**Common causes & fixes**:

#### A. Windows SmartScreen block
1. Klik kanan `.exe` → **Properties**
2. Tab **General** → paling bawah section **"Security"**
3. Centang **"Unblock"** (kalau ada)
4. Klik **Apply** → OK

#### B. `VCRUNTIME140.dll not found`
Download & install [Visual C++ Redistributable 2015-2022 (x64)](https://aka.ms/vs/17/release/vc_redist.x64.exe), restart PC.

#### C. `better_sqlite3.node` ABI mismatch
Wajib rebuild:
```bash
npx electron-rebuild -f -w better-sqlite3
npx vite build
npx electron-builder --win --x64
```

#### D. AppData permission error
Pastikan user bisa write ke `%APPDATA%`:
```powershell
Test-Path $env:APPDATA
# Expected: True
```

### Problem: White blank screen (window muncul tapi kosong)

**Fix**: 
1. Buka DevTools: tekan `Ctrl + Shift + I`
2. Lihat tab **Console** untuk error JS
3. Biasanya karena `dist/index.html` corrupt atau Vite build gagal

Rebuild:
```bash
rm -rf dist dist-electron
npx vite build
npx electron-builder --win --x64
```

### Problem: "Cannot find module 'X'"

Asar corrupt. Reinstall:
```bash
cd C:\smk-ttn-app
rm -rf node_modules dist dist-electron
npm install
npx electron-rebuild -f -w better-sqlite3
npx vite build
npx electron-builder --win --x64
```

### Problem: `npm install` gagal di better-sqlite3

**Cause**: Visual Studio Build Tools missing.

**Fix**:
1. Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Pilih **"Desktop development with C++"**
3. Install (~6 GB)
4. Restart
5. `npm install` lagi

Atau: `better-sqlite3` punya prebuilt binary, jadi seharusnya gak perlu compile. Cek apakah `node_modules/better-sqlite3/build/Release/better_sqlite3.node` ada. Kalo gak ada, install prebuilt manual:
```bash
npm rebuild better-sqlite3 --build-from-source
```

### Problem: Port 5173 already in use (dev mode)

```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Problem: Rapor tidak bisa dibuka / corrupt

Cek file `build/rapor-template.docx`:
```bash
ls -la build/rapor-template.docx
# Expected: 615813 bytes

# Verify integrity
unzip -t build/rapor-template.docx
# Expected: No errors detected
```

Kalo corrupt, re-clone repo:
```bash
git checkout build/rapor-template.docx
```

### Problem: PDF / DOCX generator error di runtime

Lihat log di Settings → Logs (kalau ada), atau:
- Buka DevTools (Ctrl+Shift+I) di app
- Lihat Console error
- Cek `src/lib/pdf/` untuk source code

---

## 10. Development Workflow

### Daily dev mode (hot reload)

```bash
npm run dev
```

Output:
- Terminal 1: Vite dev server di `http://localhost:5173`
- Terminal 2: Electron auto-launch + DevTools open
- Edit `src/`, save → hot reload
- Edit `electron/`, restart manual (`Ctrl+C` lalu `npm run dev` lagi)

### Code style

Lint & format:
```bash
npm run lint        # ESLint
npm run format      # Prettier
```

### Testing

```bash
npm run test           # Unit tests (Vitest, once)
npm run test:watch     # Watch mode
npm run test:e2e       # E2E (Playwright)
npm run test:unit      # Unit tests only (Node ABI)
npm run test:rebuild-electron  # Rebuild better-sqlite3 → Electron ABI
```

### Build ulang (kalau ada code change)

```bash
# 1. Cuma edit src/ atau electron/ (no native module change)
npx vite build
npx electron-builder --win --x64

# 2. Edit native module / tambah npm package
npm install
npx electron-rebuild -f -w better-sqlite3
npx vite build
npx electron-builder --win --x64
```

### Git workflow

```bash
# Daily: pull latest
git pull origin main

# Daily: kerja, lalu commit
git add -A
git commit -m "feat: tambah filter kelas di input absensi"
git push origin main
```

> **Best practice**: Selalu pull sebelum mulai kerja. Selalu commit kecil-kecil dengan message jelas.

---

## 11. Database Management

### Default seed (1 siswa, 1 kelas, 1 mapel)

Untuk testing cepat:
```bash
npm run db:seed
```

Atau reset dulu lalu seed:
```bash
npm run db:fresh:default
```

### Full seed (270 siswa, 9 kelas, 34 mapel, 2700 nilai)

Untuk testing lengkap:
```bash
npm run db:fresh:full
```

Tunggu ~30 detik. Database akan berisi:
- 1 admin (`admin` / `admin123`)
- 9 guru (default accounts: `guru1` sampai `guru9` / `guru123`)
- 9 kelas (X RPL, XI RPL, XII RPL, X TKJ, dll)
- 34 mata pelajaran
- 270 siswa dengan nilai random
- 1 tahun ajaran aktif: 2025/2026

### Custom seed (modify seed data)

Edit file di `scripts/seed/data/`:
- `default-seed.ts` — konfigurasi minimal
- `full-seed.ts` — konfigurasi lengkap
- `info-sekolah.ts` — identitas sekolah
- `mapel.ts` — daftar mata pelajaran
- `kelas.ts` — daftar kelas
- `ekskul.ts` — daftar ekstrakurikuler
- `dimensi-p5.ts` — dimensi P5

Setelah edit, regenerate:
```bash
npm run db:fresh:full
```

### Database location

- **Dev**: `<project>/smk-ttn.db` (di working directory)
- **Production**: `%APPDATA%\smk-ttn-app\smk-ttn.db`

Untuk lihat / edit manual:
```bash
# Dev
sqlite3 smk-ttn.db

# Production (di Windows)
sqlite3 "%APPDATA%\smk-ttn-app\smk-ttn.db"
```

### Backup database

**Sebelum upgrade atau perubahan besar**, backup dulu:
```bash
# Dev
cp smk-ttn.db smk-ttn.db.backup-$(date +%Y%m%d)

# Production (Windows)
copy %APPDATA%\smk-ttn-app\smk-ttn.db %APPDATA%\smk-ttn-app\smk-ttn.db.backup-2026-06-29
```

---

## 12. Rapor Template

### Lokasi template

`build/rapor-template.docx` (615 KB) — **WAJIB** ada di repo. File ini di-embed ke `app.asar` saat build.

### Struktur template

Template punya **6 tabel** + section TTD:

| Tabel | Isi | Custom field |
|---|---|---|
| 1 | Identitas siswa | nama, nis, kelas, ttl, ortu/wali |
| 2 | Nilai akademik | mapel, nilai, predikat |
| 3 | Kokurikuler / P5 | dimensi, kegiatan |
| 4 | Ekstrakurikuler | ekskul, predikat |
| 5 | Ketidakhadiran + Catatan | sakit, izin, alpha, catatan |
| 6 | Tanggapan ortu/wali (border + blue header) | (kosong, untuk tulisan tangan) |
| - | TTD section (paragraphs, no border) | tanggal, ortu/wali, kepsek, nama |

### Cara modify template

**Tools**: Microsoft Word, LibreOffice Writer, atau `python-docx`.

**Proses**:
1. Buka `build/rapor-template.docx` di Word
2. Edit (jangan rename field name `{...}`)
3. Save as `.docx`
4. Test generate rapor via app
5. Kalo ada error, validate dengan `pack.py` (lihat `docx` skill)

**Custom field yang dipakai** (jangan dihapus):
```
{nama_siswa} {nis} {kelas} {ttl} {agama} {alamat} {ortu_wali} {pekerjaan_ortu}
{nama_kelas} {wali_kelas} {tahun_ajaran} {bidang_keahlianoan} {program_keahlianoan}
{mapel_1}, {nilai_1}, {predikat_1}  # sampai 34 mapel
{tanggal_rapor}
```

### Bug fixes reference (jangan di-revert!)

Pada commit `b698184` (29 Juni 2026), ada **4 bug fixes** yang WAJIB di-maintain:

1. **Fix #1**: `bid_keahlianoan` → `bidang_keahlianoan`
   - File: `src/lib/pdf/rapor-docx.ts:337`
   
2. **Fix #2**: `tahun_pelajaran` → `tahun_ajaran`
   - File: `src/lib/pdf/rapor-docx.ts:344`
   
3. **Fix #3**: Filter agama di Pendidikan Agama
   - File: `src/lib/pdf/rapor-docx.ts:171,190` & `src/lib/pdf/rapor-akademik.ts:170,180`
   - Logic: `m.agama_target !== \`AGAMA_${s.agama?.split(" ")[0]?.toUpperCase() ?? ""}\``
   - Handle multi-word agama: "KRISTEN PROTESTAN" → "KRISTEN"

4. **Fix #4**: Hapus MERGEFIELD `RANK` di template
   - File: `build/rapor-template.docx` (sudah dihapus)
   - Jangan balikin!

Kalo edit template, **pastiin gak nambah MERGEFIELD baru** atau `«RANK»` manual.

---

## 13. Build Ulang

### Kapan harus rebuild?

- Ada perubahan di `src/` atau `electron/` → **wajib rebuild**
- Ada perubahan di `build/rapor-template.docx` → **wajib rebuild**
- Ada perubahan di `package.json` (tambah/hapus dependency) → `npm install` dulu, lalu rebuild
- Cuma edit `*.md` atau docs → **tidak perlu rebuild**

### Quick rebuild (no native module change)

```bash
npx vite build
npx electron-builder --win --x64
```

Waktu: ~2-3 menit.

### Full rebuild (dengan native module)

```bash
npm install                  # kalo ada package baru
npx electron-rebuild -f -w better-sqlite3
npx vite build
npx electron-builder --win --x64
```

Waktu: ~5-7 menit.

### Clean rebuild (dari nol)

Kalo build error atau output corrupt:
```bash
rm -rf dist dist-electron node_modules
npm install
npx electron-rebuild -f -w better-sqlite3
npx vite build
npx electron-builder --win --x64
```

Waktu: ~10 menit (download ulang semua).

---

## 14. Push ke GitHub

### Setup (one-time)

```bash
git config --global user.name "Nama Kamu"
git config --global user.email "email@contoh.com"
```

### Auth (pakai Personal Access Token)

1. Buka https://github.com/settings/tokens
2. Generate new token (classic) → pilih scope `repo`
3. Copy token
4. Saat pertama `git push`, masukin username + token (bukan password)

Atau pake **GitHub CLI** (lebih gampang):
```bash
winget install GitHub.cli
gh auth login
```

### Daily push

```bash
git status                    # cek apa yg berubah
git add -A                    # stage semua
git commit -m "feat: deskripsi perubahan"
git push origin main
```

### Conventional commit messages (recommended)

- `feat:` — fitur baru
- `fix:` — bug fix
- `refactor:` — refactor code (no behavior change)
- `docs:` — update documentation
- `test:` — tambah/update test
- `chore:` — maintenance, dependencies, etc

Contoh:
```bash
git commit -m "fix: rapor filter agama untuk multi-word (KRISTEN PROTESTAN)"
git commit -m "feat: tambah export PDF untuk rekap absensi"
git commit -m "docs: update WINDOWS_SETUP.md dengan troubleshooting"
```

---

## 15. Distribusi ke Sekolah

### Apa yang dikirim?

Untuk instalasi di laptop sekolah, kirim **installer saja** (1 file):

```
Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe  (~200 MB)
```

User tinggal double-click → install → jalan.

### Yang harus disertakan dalam pengiriman

1. **Installer**: `Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe`
2. **README sederhana** (opsional, 1 halaman):
   ```
   CARA INSTALL:
   1. Double-click file installer
   2. Klik Yes di popup Windows
   3. Tunggu sampai selesai (~1 menit)
   4. Buka dari Start Menu
   5. Login: admin / admin123
   6. SEGERA ganti password via Settings → Ubah Password
   
   KALAU GAK BISA BUKA:
   - Klik kanan .exe → Properties → Unblock
   - Atau install: https://aka.ms/vs/17/release/vc_redist.x64.exe
   ```

### Tidak perlu dikirim

- ❌ Source code (`.ts`, `.tsx`)
- ❌ `node_modules/`
- ❌ `package.json`
- ❌ `dist/` (selain installer)
- ❌ `.env` (config Firebase, kalo ada)
- ❌ Database lokal (`smk-ttn.db`)

### Multiple sekolah

Tiap sekolah install independent. DB lokal di `%APPDATA%\smk-ttn-app\`. Untuk sync antar sekolah, setup Firebase Sync (lihat `.env.example`).

---

## 16. FAQ

### Q: Bisa build di Linux buat Windows?
**A:** Bisa (sudah pernah), tapi **tidak reliable**. Lebih baik build langsung di Windows. Compile native modules (better-sqlite3) cross-platform sering error.

### Q: Default admin gimana caranya ganti?
**A:** 3 cara:
1. **Setelah install**: Login → Settings → Ubah Password (recommended)
2. **Sebelum distribute**: Edit `src/lib/db/seed.ts:31` → rebuild
3. **Direct SQL**: `UPDATE users SET password = '<bcrypt-hash>' WHERE username = 'admin'`

### Q: Database corrupt / gak bisa dibuka?
**A:** 
1. Stop app
2. Backup DB: `cp smk-ttn.db smk-ttn.db.broken`
3. Restore dari backup atau fresh seed: `npm run db:fresh:full`
4. Kalo masih rusak, hapus DB dan re-seed

### Q: Bisa pakai database PostgreSQL / MySQL?
**A:** Tidak by default. Project ini designed untuk SQLite (offline-first). Untuk multi-user, pakai Firebase Sync layer.

### Q: Gak bisa connect ke Firebase?
**A:** 
1. Cek `.env` ada & benar
2. Settings → Firebase Sync → masukin config manual via UI
3. Cek Firestore rules di `firestore.rules` udah di-deploy
4. Cek internet connection

### Q: Logo / icon sekolah gimana caranya ganti?
**A:**
1. Replace `build/icon.ico` & `build/icon.png` (untuk installer)
2. Replace `build/logo-40.png` & `build/logo-60.png` (untuk tray icon)
3. Replace `cropped-cropped-logo-ttn-1.png` (logo di rapor)
4. Rebuild: `npx electron-builder --win --x64`

### Q: Rapor font-nya beda tiap komputer?
**A:** Pakai font default Word (Arial, Times New Roman). Untuk konsistensi, embed font atau gunakan template style. Lihat Microsoft Word docs.

### Q: Bisa jalan di Windows 7 / 8?
**A:** **Tidak**. Minimum Windows 10 22H2 (build 19045). Electron 33 drop support untuk OS lama.

### Q: Cara update app di sekolah (udah ke-install)?
**A:**
1. Build .exe baru di Windows dev machine
2. Kirim ke sekolah via USB / cloud
3. Di sekolah: uninstall versi lama (Start → "Uninstall SMK TTN")
4. Install versi baru (double-click Setup.exe)
5. Database tetap ada (di `%APPDATA%`), gak ke-reset

### Q: Ada cara auto-update dari dalam app?
**A:** Belum. Update manual untuk sekarang. Roadmap: implement `electron-updater` di versi berikutnya.

---

## Appendix A: File Structure Penting

```
smk-ttn-app/
├── electron/              # Main process (Node.js context)
│   ├── main.ts            # Entry point
│   ├── preload.ts         # IPC bridge
│   └── ipc/               # IPC handlers (auth, students, grades, dll)
├── src/                   # Renderer (React context)
│   ├── App.tsx
│   ├── components/        # UI components
│   │   ├── ui/            # shadcn primitives
│   │   ├── layout/        # Header, Sidebar
│   │   └── ...
│   ├── pages/             # Route pages
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── master/        # CRUD master data
│   │   ├── attendance/
│   │   ├── grades/
│   │   ├── reports/       # Rapor generation
│   │   └── settings/
│   └── lib/
│       ├── db/            # Drizzle schema & migrations
│       ├── pdf/           # DOCX/PDF generators
│       ├── sync/          # Firebase sync
│       └── ...
├── build/                 # Build assets
│   ├── icon.ico           # Windows installer icon
│   ├── icon.png           # Linux installer icon
│   ├── logo-40.png        # Tray icon
│   ├── logo-60.png        # Tray icon
│   └── rapor-template.docx # ⭐ Rapor template
├── scripts/               # Build & utility scripts
│   └── seed/              # Database seeder
├── tests/                 # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example           # Environment template
├── .gitignore
├── electron-builder.yml   # Build config
├── vite.config.ts         # Vite config
├── tsconfig.json
├── package.json
└── WINDOWS_SETUP.md       # ⭐ File ini
```

## Appendix B: Default Ports & Paths

| Item | Value |
|---|---|
| Vite dev server | `http://localhost:5173` |
| App data | `%APPDATA%\smk-ttn-app\` |
| Database | `%APPDATA%\smk-ttn-app\smk-ttn.db` |
| Rapor output | `%APPDATA%\smk-ttn-app\Rapor\` |
| Log files | `%APPDATA%\smk-ttn-app\logs\` (future) |

## Appendix C: Keyboard Shortcuts (di app)

| Shortcut | Fungsi |
|---|---|
| `Ctrl + S` | Save form |
| `Ctrl + N` | New record |
| `Esc` | Close dialog |
| `Ctrl + Shift + I` | Toggle DevTools (dev only) |
| `F5` | Refresh halaman |

---

**Last updated:** 29 Juni 2026  
**Maintained by:** Tim SMK TTN  
**License:** Internal use only (UNLESS specified otherwise)
