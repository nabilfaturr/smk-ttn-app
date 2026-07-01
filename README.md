# SMK TTN — Sistem Absensi & Penilaian

Aplikasi desktop **Sistem Absensi & Penilaian SMK Taruna Tekno Nusantara**.

Stack: **Electron 33** + **React 19** + **Vite 6** + **TypeScript** + **Tailwind 4** + **Drizzle ORM (SQLite)** + **Firebase sync** + **docxtemplater/pdfkit** untuk rapor.

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 20.x LTS
- **npm** ≥ 10
- **Git**

### Setup (fresh install)

```bash
# 1. Clone
git clone https://github.com/nabilfaturr/smk-ttn-app.git
cd smk-ttn-app

# 2. Copy env (WAJIB — jangan commit .env)
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Rebuild better-sqlite3 untuk Electron ABI (WAJIB)
npx electron-rebuild -f -w better-sqlite3

# 5. Seed database
npm run db:fresh:default
```

### Run development mode

```bash
npm run dev
# otomatis: vite (port 5173) + electron window
```

Login dengan default admin: **`admin` / `admin123`** (ganti setelah first login via Settings).

---

## Build Production (.exe Windows)

**Harus build di Windows** (butuh `makensis` + Windows signing).

```bash
npm run build
```

Output:
- `dist/` — Vite renderer build
- `dist-electron/` — Main process + preload + rapor template + pdfkit fonts
- `dist/Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe` — NSIS installer

> Lihat [`WINDOWS_SETUP.md`](./WINDOWS_SETUP.md) untuk panduan lengkap build Windows + troubleshooting.

---

## Release / Distribusi

`.exe` **tidak di-commit** ke repo (terlalu besar, ~80 MB). Distribusi via **GitHub Releases**.

### One-shot release (Windows)

Prasyarat di Windows: [GitHub CLI (`gh`)](https://cli.github.com/) + Node.js + Git (auth via `gh auth login`).

```bash
# Pastikan working tree clean & sudah di-push
git status
git push

# Jalankan script release (build + tag + push + upload ke GitHub)
npm run release:win

# Atau draft dulu (tidak langsung publish)
npm run release:win -- --draft
```

Script `scripts/release-win.mjs` akan:
1. Validasi `gh` CLI + git repo
2. Buat tag `v1.0.0` dari `package.json` version (kalau belum ada) + push ke origin
3. Run `npm run build:win` (build Windows installer)
4. Cari `.exe` di `dist/`
5. Buat GitHub Release + attach `.exe`

### Manual release (kalau mau kontrol penuh)

```bash
# 1. Update version di package.json
# 2. Commit + push
git add package.json package-lock.json
git commit -m "chore: bump version to 1.0.0"
git push

# 3. Tag + push
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 4. Build .exe di Windows
npm run build:win

# 5. Buat release via gh CLI
gh release create v1.0.0 \
  "dist/Sistem Absensi dan Penilaian SMK TTN-1.0.0-Setup.exe" \
  --title "SMK TTN v1.0.0" \
  --notes-file release-notes.md
```

> Lihat [`BUILD_WINDOWS.md`](./BUILD_WINDOWS.md) untuk step-by-step build + troubleshooting Windows.

---

## Database

- Dev: `./smk-ttn.db` (root project)
- Prod (installed app): `%APPDATA%\smk-ttn-app\smk-ttn.db`

```bash
npm run db:studio        # GUI browser (Drizzle Studio)
npm run db:seed          # seed default (admin, 1 TA, master)
npm run db:fresh:full    # RESET + seed 270 siswa, 9 kelas, 34 mapel
npm run db:fresh:default # RESET + minimal seed
```

---

## Firebase Sync (Opsional)

App jalan normal tanpa Firebase. Untuk enable multi-device sync, lihat [`.env.example`](./.env.example) atau input manual via **Settings → Firebase Sync** (config disimpan terenkripsi di OS keychain).

```bash
# .env (development)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
# dll
```

---

## Scripts

| Command                   | Fungsi                                              |
| ------------------------- | --------------------------------------------------- |
| `npm run dev`             | Vite + Electron (auto-launch)                       |
| `npm run dev:vite`        | Vite saja (renderer only)                          |
| `npm run dev:electron`    | Electron saja (butuh vite sudah jalan)             |
| `npm run build`           | tsc + vite build + electron-builder                 |
| `npm run build:vite`      | Vite build only (no installer)                     |
| `npm run build:win`       | Build Windows installer (.exe NSIS)                |
| `npm run build:win:portable` | Build Windows portable .exe (no installer)       |
| `npm run release:win`     | One-shot: build + tag + push + create GitHub Release |
| `npm test`                | Vitest (unit + integration)                         |
| `npm run test:e2e`        | Playwright + Electron (E2E)                         |
| `npm run lint`            | ESLint                                              |
| `npm run format`          | Prettier                                            |

---

## Project Structure

```
electron/          Main process (Node) — IPC handlers, DB, file I/O
src/               Renderer (React) — UI only, data via window.electronAPI
  components/      shadcn UI primitives + layout
  pages/           1 folder per domain
  lib/             db (Drizzle), pdf (docxtemplater/pdfkit), sync (Firebase)
  stores/          Zustand (auth, sync, ui)
scripts/seed/      CLI seeder
build/             icon, rapor-template.docx
tests/             unit/, integration/, e2e/
```

**Data flow:** Renderer → `window.electronAPI.*` → IPC → `electron/ipc/*.handlers.ts` → Drizzle ORM + better-sqlite3.

---

## Dokumentasi Lengkap

- [`WINDOWS_SETUP.md`](./WINDOWS_SETUP.md) — Panduan lengkap fresh install → distribusi di Windows
- [`BUILD_WINDOWS.md`](./BUILD_WINDOWS.md) — Versi ringkas build Windows
- [`firestore.rules`](./firestore.rules) — Firestore security rules
- [`.env.example`](./.env.example) — Template env + Firebase setup
- [`components.json`](./components.json) — shadcn config

---

## Default Credentials

| Role        | Username | Password    |
| ----------- | -------- | ----------- |
| Admin       | `admin`  | `admin123`  |

⚠️ **Ganti setelah first login** via Settings.
