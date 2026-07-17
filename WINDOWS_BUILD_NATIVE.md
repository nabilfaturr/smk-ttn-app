# Panduan Build Native Windows — SMK TTN

> Build `.exe` langsung di Windows untuk hasil paling reliable.
> File ini berdiri sendiri (tidak dependensi ke file lain di repo).

---

## 1. WSL vs Windows Context

> AI agents di WSL tidak bisa pakai PowerShell/CMD langsung.
> `better-sqlite3` native binding **harus** di-compile di Windows context, bukan di WSL Linux context (beda ABI!).

| Step | WSL | Windows (PowerShell/CMD) |
|------|-----|--------------------------|
| `git clone` | OK | OK |
| `cp .env` | OK | OK |
| `npm install` | OK (download deps untuk Linux) | OK (download deps untuk Windows) |
| `tsc` / `vite build` | OK | OK (hasil sama) |
| `npx electron-rebuild -w better-sqlite3` | SALAH (hasil Linux ABI) | WAJIB di sini |
| `npx electron-builder --win` | Perlu Wine | OK |

**Rekomendasi**:
- Kalau pakai AI agent di WSL: clone + npm install + tsc di WSL, copy `node_modules` ke Windows, lanjut build di PowerShell.
- Lebih clean: clone & build **semua** langsung di Windows PowerShell/CMD.

---

## 2. Prasyarat Windows

- **Windows 10/11** (64-bit, build 19041+)
- **Node.js 20+ LTS** — https://nodejs.org/
- **Git for Windows** — https://git-scm.com/
- **Python 3.10+** (untuk node-gyp) — https://python.org/
- **Visual Studio 2022 Build Tools** dengan workload:
  - "Desktop development with C++"
  - Windows 10/11 SDK
  - MSVC v143 compiler
- *(Optional)* Windows Terminal atau PowerShell 7

**Verifikasi cepat** (PowerShell):

```powershell
node --version    # v20.x atau lebih
npm --version
python --version  # 3.10+
git --version
where.exe cl.exe  # harus ada di path VS Build Tools
```

---

## 3. Step-by-step

### 3.1 Clone repo

```powershell
cd C:\
git clone https://github.com/nabilfaturr/smk-ttn-app.git
cd smk-ttn-app
```

### 3.2 Setup env

```powershell
Copy-Item .env.example .env
notepad .env  # isi VITE_FIREBASE_* kalau perlu
```

### 3.3 Install dependencies (~5-10 menit, 1.2 GB)

```powershell
npm install
```

### 3.4 Rebuild native modules untuk Windows ABI (WAJIB)

```powershell
npx electron-rebuild -f -w better-sqlite3
```

Tunggu sampai `✔ Rebuild Complete`.

#### 3.4.1 Quick-Check: Verify ABI cocok

```powershell
node -e "const db = require('better-sqlite3')(':memory:'); db.exec('CREATE TABLE t(x)'); console.log('OK better-sqlite3 ABI cocok untuk Windows/Electron')"
```

**Expected output**: `OK better-sqlite3 ABI cocok untuk Windows/Electron`
**Kalau error** `was compiled against a different Node.js version` → ulangi step 3.4.

### 3.5 Sanity check: dev mode (~30 detik)

```powershell
npm run dev
```

- Window Electron kebuka
- Load UI React (form login `admin` / `admin123`)
- Console log harusnya **tidak ada error merah**
- Tekan `Ctrl+C` untuk keluar

### 3.6 Build production (~5-10 menit)

```powershell
npm run build:win
```

Pipeline: `tsc` → `vite build` → `electron-builder --win --x64`.

Atau full pipeline:

```powershell
npm run build
```

---

## 4. Caveat: Binary Compatibility

> Project ini dikembangkan di Linux. Beberapa hal yang perlu diketahui
> saat build di Windows:

### 4.1 better-sqlite3 Native Binding

- `better-sqlite3` di-compile **per platform** (binding `.node` file).
- Binary Linux di repo **TIDAK bisa jalan di Windows**.
- Windows build pakai **MSVC compiler** (beda dari `gcc` di Linux).
- **Wajib** jalankan step 3.4 di Windows — akan download & compile source C++ untuk Windows ABI.
- Hasil: `node_modules/better-sqlite3/build/Release/better_sqlite3.node` (versi Windows).
- Kalau skip step 3.4 → app crash dengan error:
  `The module ... was compiled against a different Node.js version`

### 4.2 Path Separator

- Hardcoded path Linux-style (`/`) mungkin ada di beberapa plugin/build script.
- Source code project sudah handle cross-platform (`path.join`),
  tapi kalau nemu bug path saat test di Windows, laporkan.

### 4.3 Line Ending (CRLF vs LF)

- File `.ts`, `.tsx`, `.sh` di repo: **LF** (Unix).
- Windows tooling kadang auto-convert ke **CRLF**.
- Git di Windows by default `core.autocrlf=true` → bisa convert source.
- **Disarankan** untuk source code:
  ```powershell
  git config --global core.autocrlf false
  ```
  Lalu re-clone repo supaya line ending konsisten.

### 4.4 Font (pdfkit)

- pdfkit bundle font **AFM** (bukan TTF) → cross-platform OK.
- Tapi fallback font (saat render PNG/PDF preview) mungkin beda:
  - Linux: DejaVu
  - Windows: Arial

### 4.5 Icon Resolution

- `build/icon.ico` di-commit (Windows native, 370 KB)
- `build/icon.png` di-commit (Linux/macOS, 39 KB)
- `electron-builder` pilih otomatis sesuai target.
- Kalau icon Windows corrupt/missing → installer pakai default Electron icon.

### 4.6 Kalau Build Gagal / Aneh

1. Bersih total: hapus `node_modules`, `dist`, `dist-electron`.
2. Re-clone repo (kalau perlu).
3. `npm install` ulang.
4. `npx electron-rebuild -f -w better-sqlite3`.
5. `npm run build:win`.
6. Kalau masih gagal → cek log di `dist/builder-debug.yml`.

---

## 5. Cleaning Sebelum Rebuild

Kalau ada build artifact lama dan mau fresh:

```powershell
# Hapus dist + dist-electron
Remove-Item -Recurse -Force dist, dist-electron

# Clear Vite cache
Remove-Item -Recurse -Force node_modules\.vite
```

*(Optional)* reinstall `node_modules` kalau ada corrupt:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
npx electron-rebuild -f -w better-sqlite3
```

---

## 6. Verifikasi Output

```
dist/
├── Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe   (~208 MB)
├── win-unpacked/                                          (folder portable)
│   ├── Sistem Absensi dan Penilaian SMK TTN.exe           (app binary)
│   ├── resources/app.asar.unpacked/                       (data, sqlite, rapor)
│   ├── locales/                                           (i18n Chromium)
│   └── ... (Chromium, V8 snapshots)
└── builder-debug.yml                                      (diagnostic info)
```

Cek cepat:

```powershell
Get-Item "dist\*.exe" | Select-Object Name, Length  # size 200-220 MB
Test-Path "dist\win-unpacked\rapor-template.docx"     # True
Test-Path "dist\win-unpacked\rapor-prakerin-template.docx"  # True
```

---

## 7. First-Run Checklist di Windows

1. Double-click `Sistem*.exe` → NSIS wizard → Install (default `C:\Program Files\...`).
2. Launch dari Start Menu "Sistem Absensi dan Penilaian SMK TTN".
3. Login `admin` / `admin123`.
4. Cek menu sidebar (Dashboard, Master, Absensi, Nilai, Laporan, Sync, Settings).
5. Sync Status → harusnya "Firebase config loaded from .env".
6. Tunggu 30 detik → sync engine jalan.
7. Test login lain (`walikelas` / `wali123`, `guru` / `guru123`).
8. Tutup & restart → DB persist di `%APPDATA%\smk-ttn-app\smk-ttn.db`.

---

## 8. Troubleshooting (7 issue Windows-specific)

1. **"Could not load native binding"** → ulangi step 3.4 (`npx electron-rebuild -f -w better-sqlite3`).
2. **"tsc: command not found"** → `npm install` ulang, jangan skip step 3.3.
3. **NSIS missing** → `electron-builder` download otomatis, cek koneksi internet/firewall.
4. **icon.ico not found** → pastikan `build/icon.ico` ada (sudah di-commit).
5. **Windows Defender block** → klik "More info" → "Run anyway" (unsigned).
6. **sqlite FK error first run** → normal, pull on startup menarik data dari Firestore.
7. **AI agent di WSL stuck** → pindah eksekusi ke PowerShell langsung (lihat Section 1).

---

## 9. Next Steps

- Upload ke GitHub Release:
  ```powershell
  gh release upload v1.0.0 "dist\Sistem*.exe" --clobber
  ```
- Untuk distribusi ke sekolah, lihat file `WINDOWS_SETUP.md` dan `BUILD_WINDOWS.md` di repo (tidak di-link di sini, lihat manual di root folder).
