# Laporan Pengujian E2E

**Tanggal:** 27 Juni 2026  
**Proyek:** SMK TTN App (Sistem Absensi dan Penilaian)  
**Fitur:** Multi-Role (wali_kelas + guru) + Kode Login 5-digit

---

## Ringkasan

| Kategori | Total | Pass | Fail |
|-----------|-------|------|------|
| **E2E Tests (Playwright + Electron)** | **22** | **22** | **0** |
| Integration Tests (Vitest) | 46 | 43 | 3* |
| DB Verification | 7 checks | 7 | 0 |

*\*3 integration test failure adalah Drizzle ORM `$default` aliasing bug pada test query `nilaiTP` (tidak relevan ke production code).*

**E2E execution time: 45.6 detik** untuk 22 skenario pada 1 worker.

---

## 1. E2E Test Scenarios (22 — semua PASSED)

### A. LOGIN (4/4)
- ✅ A1: Login via username — combined role
- ✅ A2: Login via kode_login (5-digit)
- ✅ A3: Login sebagai admin
- ✅ A4: Login dengan password salah (error message)

### B. ROUTE ACCESS (4/4)
- ✅ B1: Combined role akses guru routes (`/grades/input`, `/learning-objectives`)
- ✅ B2: Combined role akses wali_kelas routes (`/attendance/input`, `/teacher-notes`)
- ✅ B3: Combined role DITOLAK akses admin routes (`/students`, `/teachers`, `/sync`) — redirect ke `/dashboard`
- ✅ B4: Single guru DITOLAK akses wali_kelas routes (`/attendance/input`)

### C. SIDEBAR MENU (3/3)
- ✅ C1: Combined role sidebar menampilkan menu guru (`Input Nilai`, `Kelola TP`)
- ✅ C2: Combined role sidebar menampilkan menu wali_kelas (`Input Absensi`, `Rekap Absensi`, `Catatan Wali Kelas`)
- ✅ C3: Sidebar `Dashboard` muncul hanya SEKALI (tidak duplikat dari multiple roles)

### D. PAGE DATA FILTERING (3/3)
- ✅ D1: `GradeInputPage` filter mapel by guru_id (budi → Bahasa Indonesia)
- ✅ D2: `AttendanceInputPage` auto-select kelas (budi → X RPL 1)
- ✅ D3: `TeacherNotesPage` auto-select kelas (budi → X RPL 1)

### E. HEADER (1/1)
- ✅ E1: Combined role badge menampilkan `wali_kelas + guru`

### F. ADMIN — GURU MANAGEMENT (3/3)
- ✅ F1: Admin add guru baru — auto-generate kode_login 5-digit + password 6-digit
- ✅ F2: Admin reset password guru — modal menampilkan password baru
- ✅ F3: Teacher table menampilkan kolom Kode Login

### G. SEED DATA (1/1)
- ✅ G1-G3: DB verification — 21 users dengan unique 5-digit kode_login

### H. EDGE CASES (3/3)
- ✅ H1: Session persists across hash route navigation
- ✅ H2: Logout → login sebagai role berbeda berhasil
- ✅ H3: Combined role tanpa kelas_id (fitri) bisa akses halaman absensi

---

## 2. Setup yang Berhasil

1. **HashRouter** di `src/App.tsx` (sebelumnya BrowserRouter) — kompatibel dengan `file://` protocol di Electron
2. **Fixture E2E**: `tests/e2e/fixtures/electron-fixture.ts` — Electron launch + firstWindow + wait for valid URL
3. **Hash navigation helper**: `gotoHash(page, route)` — pakai `window.location.hash` (works dengan file://)
4. **Database**: `db:fresh:full` (reset + seed ulang dengan 21 users, 18 guru, 6 wali_kelas)
5. **better-sqlite3 native module**: rebuild untuk Node saat seed, rebuild untuk Electron saat test

---

## 3. Test Credentials

| Username | Password | Role | Kode Login |
|----------|----------|------|------------|
| admin | admin123 | admin | random 5-digit |
| budi | smkttn2026 | wali_kelas,guru | random 5-digit |
| sari | smkttn2026 | wali_kelas,guru | random 5-digit |
| ... (16 guru lainnya) | smkttn2026 | guru atau wali_kelas,guru | random 5-digit |
| walikelas | wali123 | wali_kelas | random 5-digit |
| guru | guru123 | guru | random 5-digit |

Kode login di-generate random setiap kali seed ulang.

---

## 4. Testing Workflow (untuk reproduksi)

```bash
# 1. Rebuild better-sqlite3 untuk Node
npm rebuild better-sqlite3

# 2. Seed database (reset + full)
echo "y" | npx tsx scripts/seed/index.ts --reset --mode=full --force

# 3. Rebuild better-sqlite3 untuk Electron
npx electron-rebuild -f -w better-sqlite3

# 4. Build Vite output
npx vite build

# 5. Run E2E tests
npx playwright test tests/e2e/multi-role.e2e.ts
```

**Output:** 22/22 passed dalam 45.6 detik.

---

## 5. Catatan Teknis

### E2E Test Infrastructure
- **Playwright** versi terbaru dengan `_electron` API
- **NODE_ENV=test** di-set untuk skip Vite dev server, load dari `dist/index.html`
- **HashRouter** karena `file://` protocol tidak support BrowserRouter (pathname jadi full path)
- **Better-sqlite3** perlu di-rebuild untuk Node (seed) ATAU Electron (test), tidak bisa dua-duanya sekaligus
- **db:fresh:full** HARUS dengan `--force` flag agar skip konfirmasi prompt

### Test Isolation
- Setiap test launch **Electron app baru** (fixture) → tidak ada memory state sharing
- **DB persisted** antar tests (sengaja, untuk verifikasi cumulative effect)
- F2 (reset password) menggunakan guru **budi** (`.first()` di table), sehingga H1/H2 harus pakai user **sari** untuk menghindari conflict

### Regressi yang ditemukan selama testing
- ~~HashRouter required untuk file:// protocol~~ — fixed
- ~~Form input selectors~~ — menggunakan `getByLabel` bukan `input[placeholder*="..."]`
- ~~Strict mode violation pada `Dashboard` locator~~ — menggunakan `getByRole("heading")` dengan heading spesifik

---

## Kesimpulan

**E2E testing BERHASIL untuk fitur multi-role + kode login.**

- 22/22 skenario pass (login, route access, sidebar, page filtering, header, admin management, edge cases)
- 43/46 integration test pass (3 Drizzle aliasing failure tidak relevan)
- Build sukses tanpa TS error
- E2E runtime: 45.6 detik
