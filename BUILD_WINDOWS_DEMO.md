# Demo SMK TTN di Windows — Setup Ringkas

> Panduan step-by-step untuk build & run di Windows. Untuk panduan lengkap, lihat `WINDOWS_SETUP.md`.
>
> **Target user**: Demo ke dosen pembimbing besok
> **Last update**: 2026-07-17
> **Project**: Sistem Absensi dan Penilaian SMK TTN v1.0.0

---

## Checklist (Centang Saat Selesai)

### A. Persiapan (5 menit)
- [ ] Windows 10 22H2+ atau Windows 11
- [ ] Install **Node.js 20.x LTS** atau **22.x LTS** dari https://nodejs.org/ (centang "Add to PATH")
- [ ] Install **Git for Windows** dari https://git-scm.com/download/win
- [ ] Restart terminal/PowerShell
- [ ] Verifikasi: `node --version` & `git --version`

### B. Setup Project (10 menit)
- [ ] Buka PowerShell, navigate ke folder kerja (mis. `C:\Demo\`)
- [ ] **Copy folder project** dari Linux: `scp` / USB / cloud storage
  - **JANGAN** copy `node_modules/`, `dist/`, `dist-electron/` (akan di-rebuild)
  - **JANGAN** copy `.env` (lihat C)
- [ ] `cd smk-ttn-app`
- [ ] `npm install` (5-10 menit, download ~800MB deps)
- [ ] `npx electron-rebuild -f -w better-sqlite3` (WAJIB untuk Electron ABI)

### C. Firebase Config (3 menit)
- [ ] `cp .env.example .env`
- [ ] Edit `.env`, isi dengan config Firebase project **`smk-ttn-demo`**:
  ```
  VITE_FIREBASE_API_KEY=AIzaSyAsmJw9UTTFuJEkpRzuKY21C9Y6WKs-E5s
  VITE_FIREBASE_AUTH_DOMAIN=smk-ttn-demo.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=smk-ttn-demo
  VITE_FIREBASE_STORAGE_BUCKET=smk-ttn-demo.firebasestorage.app
  VITE_FIREBASE_MESSAGING_SENDER_ID=914343895556
  VITE_FIREBASE_APP_ID=1:914343895556:web:dc29b80709e960e5a10b51
  ```
- [ ] **JANGAN** simpan `.env` di Git / share di cloud public

### D. Seed Database (2 menit)
- [ ] `npm run db:fresh:full` (alias: `npm run demo:data`) → 270 siswa, 9 kelas, 34 mapel, 60 prakerin
- [ ] Verifikasi: `npm run demo:check` → 22/22 PASS

### E. Build Production (5 menit)
- [ ] `npm run build:vite` (render + main process build)
- [ ] `npm run build:win` (NSIS installer + better-sqlite3 rebuild)
- [ ] Output: `dist/Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe` (~190 MB)

### F. Install & Test (3 menit)
- [ ] Double-click installer `dist/Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe`
- [ ] Pilih folder install (default: `C:\Program Files\...`)
- [ ] Launch dari Start Menu / Desktop shortcut
- [ ] Login `admin` / `admin123`
- [ ] Buka `/sync-status` → badge **ONLINE** (hijau) + last sync time

### G. Smoke Test (5 menit)
- [ ] **Sync Online**: tambah 1 siswa → tunggu 30s → Firestore Console ada
- [ ] **Sync Offline**: Settings → toggle off → tambah 1 siswa → toggle on → auto-push
- [ ] **Rapor**: Generate Rapor Akademik untuk XII RPL → file .docx editable
- [ ] **Prakerin**: Generate Rapor Prakerin XII TKJ A → 30 file .docx editable
- [ ] Lihat Firestore Console: https://console.firebase.google.com/project/smk-ttn-demo/firestore

---

## Opsi A: Pakai Installer (.exe)

**Best untuk**: Demo profesional, bisa di-install di banyak PC, branded icon & start menu.

```powershell
npm run build:win
# → dist/Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe
```

Plus: `npm run build:win:portable` (1 file .exe, no install, double-click langsung jalan)

## Opsi B: Tanpa Build, Langsung dari Source

**Best untuk**: Kalau ada masalah build, atau mau edit & test langsung.

```powershell
npm run build:vite
npm run start
# App jalan tanpa install, langsung dari source
```

`npm run start` setara `NODE_ENV=production npx electron .` — 1 process, no race condition.

## Opsi C: Development Mode (HMR)

**Best untuk**: Edit code dan lihat perubahan instant.

```powershell
npm run dev
# vite HMR untuk renderer + electron auto-restart untuk main
# ⚠ Catatan: 2 sync engine race condition — JANGAN untuk demo
```

---

## Troubleshooting

### better-sqlite3 ABI error saat npm run start

```
Error: NODE_MODULE_VERSION 130 vs 137
```

Fix:
```powershell
npx electron-rebuild -f -w better-sqlite3
```

### Build gagal: "Cannot find icon.ico"

Pastikan `build/icon.ico` ada di folder project.

### Firebase "permission denied"

Pastikan:
1. `.env` ada dan terisi
2. Firestore rules deployed ke project `smk-ttn-demo`:
   ```powershell
   firebase deploy --only firestore:rules
   ```

### Renderer blank (load 127.0.0.1:5173 failed)

Pastikan pakai `npm run start` (production), BUKAN `npm run dev` (mixed).

### Windows defender hapus .exe

NSIS installer kadang di-flag false positive. Klik "More info" → "Run anyway".

---

## File Structure yang Penting

```
smk-ttn-app/
├── .env                          ← API key Firebase (JANGAN di-share)
├── package.json                  ← scripts: dev, build:vite, build:win, start
├── vite.config.ts                ← main + renderer build
├── electron-builder.yml          ← Windows installer config
├── electron/main.ts              ← entry main process
├── electron/preload.ts           ← IPC bridge
├── src/                          ← React 19 + Vite 6 renderer
├── build/
│   ├── icon.ico                  ← Windows icon
│   ├── rapor-template.docx       ← template rapor (asarUnpack)
│   └── rapor-prakerin-template.docx ← template prakerin (asarUnpack)
└── dist/                         ← output: .exe installer
```

---

## Pre-Demo Final Check (15 menit sebelum)

- [ ] `npm run build:vite && npm run start` → app jalan tanpa error
- [ ] Sync Status page → badge ONLINE
- [ ] Firestore Console (browser) → data muncul real-time
- [ ] 1-2 file rapor generated (siap di-buka di Word)
- [ ] Login credentials di-hand: `admin/admin123`, `guru/guru123`, `walikelas/wali123`

## Kalau Ada Masalah Saat Demo

1. **Lihat log**: app console (Ctrl+Shift+I) atau file log
2. **Backup plan**: Firestore down → app tetap jalan offline
3. **Laptop hang**: close app, restart, `npm run start` ulang

---

**Total waktu setup**: ~30 menit (1x)
**Per demo**: 0 menit (langsung jalan)

Good luck! 🚀
