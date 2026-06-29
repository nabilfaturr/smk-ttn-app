# Panduan Build Windows .exe — SMK TTN

> **Context**: Project SMK TTN sudah siap di Linux (sudah include `.env` dengan Firebase config, `firestore.rules`, icon, dll). Untuk produce Windows .exe installer (NSIS), perlu build di Windows karena butuh `makensis` (Windows-only) + signing Windows binaries.

---

## 📦 Yang Perlu Disiapkan di Windows

### Software

| Software                            | Versi      | Fungsi                                 | Link                 |
| ----------------------------------- | ---------- | -------------------------------------- | -------------------- |
| **Node.js**                         | ≥ 20.x LTS | Runtime JS                             | https://nodejs.org/  |
| **Git for Windows**                 | Latest     | Version control (optional, buat clone) | https://git-scm.com/ |
| **NSIS** (auto by electron-builder) | 3.x        | Bikin installer .exe                   | auto-installed       |

### File yang Perlu Di-copy dari Linux ke Windows

**Cara 1: Pakai Git** (Recommended)

```bash
# Di Windows (PowerShell atau CMD)
cd C:\
git clone <URL_REPO> smk-ttn-app
cd smk-ttn-app
npm install
```

**Cara 2: Copy Folder Manual** (kalau gak ada Git)
Copy folder project ini ke Windows. **File/folder yang HARUS ada**:

- `package.json`
- `package-lock.json`
- `.env` (JANGAN lupa — ada Firebase config!)
- `electron-builder.yml`
- `vite.config.ts`
- `tsconfig.json`
- `build/icon.ico` (icon Windows)
- `src/`, `electron/`, `scripts/` (source code)
- `node_modules/` (1.2 GB — install via `npm install` lebih cepat dari copy)

**Cara 3: USB Drive** (kalau gak ada internet di Windows)

1. Copy folder project (exclude `node_modules` + `dist`) ke USB
2. Di Windows, copy ke `C:\smk-ttn-app`
3. Jalankan `npm install` (perlu internet untuk download deps)
4. Jalankan `npm run build`

---

## 🚀 Build di Windows

### Step 1: Buka PowerShell/CMD

Tekan `Win + X` → "Windows PowerShell" atau "Terminal"

### Step 2: Navigate ke folder project

```powershell
cd C:\smk-ttn-app
```

### Step 3: Install dependencies (5-10 menit, download ~1.2 GB)

```powershell
npm install
```

### Step 4: Rebuild native modules untuk Electron

```powershell
npx electron-rebuild -f -w better-sqlite3
```

> **Penting!** Step ini wajib, soalnya `better-sqlite3` perlu di-compile untuk versi Node.js yang dibundle di Electron (beda dengan Node.js biasa).

### Step 5: Build .exe (5-10 menit)

```powershell
npm run build
```

Atau langsung:

```powershell
npx electron-builder --win
```

**Proses ini akan**:

1. `tsc` → TypeScript type-check
2. `vite build` → Bundle renderer (UI React)
3. `vite build` (main electron) → Bundle main process
4. `copy-pdfkit-fonts` plugin → Copy font files
5. `electron-builder` → Pack ke Windows .exe + NSIS installer

### Step 6: Verifikasi Output

```
dist/
├── Sistem Absensi dan Penilaian SMK TTN-1.0.0.exe   ← NSIS installer
├── win-unpacked/                                     ← Folder app portable
│   ├── Sistem Absensi dan Penilaian SMK TTN.exe     ← App executable
│   ├── resources/
│   ├── locales/
│   └── ...
└── builder-debug.yml
```

**Yang dipakai untuk install di sekolah**: `Sistem Absensi dan Penilaian SMK TTN-1.0.0.exe` (NSIS installer, ~150-200 MB)

---

## 🧪 Test Sebelum Hand-over ke Sekolah

### Test 1: Install di PC Sendiri

1. Double-click `Sistem Absensi dan Penilaian SMK TTN-1.0.0.exe`
2. Ikuti wizard NSIS:
   - Pilih install location (default: `C:\Program Files\Sistem Absensi dan Penilaian SMK TTN`)
   - Klik Install
   - Centang "Launch application" → Finish
3. App harusnya terbuka dengan halaman login

### Test 2: Login & Smoke Test

1. **Login admin** (`admin` / `admin123`)
2. Cek menu sidebar lengkap (Dashboard, Master, Absensi, Nilai, Laporan, Sync, Settings)
3. Buka **Sync Status** → harusnya tertulis "Firebase config loaded from .env"
4. Tunggu 30 detik → sync engine mulai jalan
5. **Login walikelas** (`walikelas` / `wali123`) → cek menu terbatas
6. **Login guru** (`guru` / `guru123`) → cek menu nilai

### Test 3: Verify Firebase Sync

1. Login admin → **Master → Data Siswa** → tambah 1 siswa baru
2. Tunggu 30 detik
3. Buka https://console.firebase.google.com/project/smk-ttn-app/firestore/data
4. Collection `siswa` → harusnya ada 1 doc baru
5. Cek data-nya (nama, nis, kelas_id, dll) sesuai dengan yang di-input

### Test 4: Verify Rapor

1. Login admin → **Laporan → Generate Rapor**
2. Pilih siswa XII RPL, tahun ajaran 2025/2026
3. Generate → PDF harusnya terbuat di folder Rapor
4. Buka PDF → cek 7 section (Identitas, Nilai, Kokurikuler, Ekskul, Ketidakhadiran, Catatan, TTD)

---

## 🔐 Catatan Keamanan

- `.env` **terbaca** setelah `npm run build` (config di-bundle ke .exe). Hati-hati jangan share `.env` ke publik.
- API key di-bundle tapi aman untuk web (Firestore Rules jadi gatekeeper).
- NSIS installer butuh admin privileges untuk install (kayak app Windows pada umumnya).

---

## 🆘 Troubleshooting

| Problem                                      | Solusi                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `Error: Cannot find module 'better-sqlite3'` | Run `npx electron-rebuild -f -w better-sqlite3`                            |
| `npm install` gagal / timeout                | Cek koneksi internet, coba `npm install --no-audit --no-fund`              |
| `electron-builder` error `cannot find icon`  | Pastikan `build/icon.ico` ada                                              |
| `MAKENSIS not found`                         | Update electron-builder: `npm i -D electron-builder@latest`                |
| `Code signing error`                         | Disable signing: tambahkan `win: { sign: null }` di `electron-builder.yml` |
| `.exe` size > 300 MB                         | Normal (Electron runtime ~150 MB + app code)                               |

### Disable Code Signing (recommended untuk internal/sekolah)

Tambah ke `electron-builder.yml`:

```yaml
win:
  target: nsis
  icon: build/icon.ico
  sign: null # ← tambah ini
```

Atau set env var:

```powershell
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
npm run build
```

---

## 📁 File yang Dihasilkan Build

```
dist/
├── Sistem Absensi dan Penilaian SMK TTN-1.0.0.exe   ← ~150-200 MB (installer)
├── win-unpacked/                                     ← folder app (portable, ~250 MB)
│   ├── Sistem Absensi dan Penilaian SMK TTN.exe     ← main executable
│   ├── resources/app.asar                           ← packed app code
│   ├── resources/app.asar.unpacked/                 ← native modules
│   ├── data/                                         ← pdfkit fonts
│   └── ...
└── builder-debug.yml                                 ← debug info (aman dihapus)
```

**Yang di-copy ke sekolah**:

- Installer (`.exe`) — untuk install proper ke `Program Files`
- ATAU folder `win-unpacked/` (rename jadi folder biasa) — untuk portable, gak perlu install

---

## ⏱️ Estimasi Waktu

| Step                       | Waktu            |
| -------------------------- | ---------------- |
| `npm install` (first time) | 5-10 menit       |
| `electron-rebuild`         | 1-2 menit        |
| `npm run build`            | 5-10 menit       |
| Install + test             | 5 menit          |
| **Total first build**      | **~20-30 menit** |

Build berikutnya (kalau ada code change) cuma perlu Step 4-5 = ~10 menit (npm install udah cached).

---

## 📞 Support

Kalau ada error saat build di Windows, screenshot:

1. Error message lengkap
2. Output `node --version` & `npm --version`
3. Output `npx electron --version`

Kirim ke saya, saya bantu debug.

npm rebuild better-sqlite3 (untuk test Node.js), lebih baik bisa jalankan npx electron-rebuild -f -w better-sqlite3 dahulu sebelum npm run dev
