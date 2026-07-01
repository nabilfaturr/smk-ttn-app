import { test, expect, login } from "./fixtures/electron-fixture"
import path from "path"

const SCREENSHOT_DIR = path.join(__dirname, "screenshots-bab4")

test.describe.configure({ mode: "serial", timeout: 180_000 })

async function ss(page: any, name: string) {
  const p = path.join(SCREENSHOT_DIR, name)
  await page.screenshot({ path: p, fullPage: false })
  console.log(`  ✓ ${name}`)
}

async function navAndSs(page: any, hash: string, name: string) {
  const baseUrl = page.url().split("#")[0]
  await page.goto(`${baseUrl}#${hash}`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1200)
  await ss(page, name)
}

test.describe("BAB IV Screenshots", () => {

  // ===== ADMIN =====
  test.describe("Admin pages", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, "admin", "admin123")
    })

    test("4.1 - Login", async ({ page }) => {
      await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch {} })
      await page.reload({ waitUntil: "domcontentloaded" })
      await page.waitForSelector('input[placeholder*="username" i]', { timeout: 10000 })
      await page.waitForTimeout(500)
      await ss(page, "gambar-4-1-halaman-login.png")
    })

    test("4.2 - Dashboard", async ({ page }) => {
      await navAndSs(page, "/dashboard", "gambar-4-2-dashboard-admin.png")
    })

    test("4.3 - Data Siswa", async ({ page }) => {
      await navAndSs(page, "/students", "gambar-4-3-data-siswa.png")
    })

    test("4.4 - Data Kelas", async ({ page }) => {
      await navAndSs(page, "/classes", "gambar-4-4-data-kelas.png")
    })

    test("4.5 - Data Guru", async ({ page }) => {
      await navAndSs(page, "/teachers", "gambar-4-5-data-guru.png")
    })

    test("4.6 - Data Mata Pelajaran", async ({ page }) => {
      await navAndSs(page, "/subjects", "gambar-4-6-data-mapel.png")
    })

    test("4.7 - Tahun Ajaran", async ({ page }) => {
      await navAndSs(page, "/academic-years", "gambar-4-7-tahun-ajaran.png")
    })

    test("4.8 - Guru Pengampu", async ({ page }) => {
      await navAndSs(page, "/mapel-assignments", "gambar-4-8-guru-pengampu.png")
    })

    test("4.9 - Tujuan Pembelajaran", async ({ page }) => {
      await navAndSs(page, "/master/learning-objectives", "gambar-4-9-tujuan-pembelajaran.png")
    })

    test("4.13 - Ekstrakurikuler", async ({ page }) => {
      await navAndSs(page, "/ekskul", "gambar-4-13-ekstrakurikuler.png")
    })

    test("4.14 - Kokurikuler Tingkat", async ({ page }) => {
      await navAndSs(page, "/kokurikuler/tingkat", "gambar-4-14-kokurikuler-tingkat.png")
    })

    test("4.15 - Input Nilai Kokurikuler", async ({ page }) => {
      await navAndSs(page, "/kokurikuler", "gambar-4-15-nilai-kokurikuler.png")
    })

    test("4.16 - Prakerin", async ({ page }) => {
      await navAndSs(page, "/prakerin", "gambar-4-16-prakerin.png")
    })

    test("4.17 - Cek Kelengkapan Rapor", async ({ page }) => {
      await navAndSs(page, "/generate-report", "gambar-4-17-cek-kelengkapan.png")
    })

    test("4.18 - Generate Rapor", async ({ page }) => {
      const baseUrl = page.url().split("#")[0]
      await page.goto(`${baseUrl}#/generate-report`, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(1000)
      await ss(page, "gambar-4-18-generate-rapor.png")
    })

    test("4.19 - Konfigurasi Firebase", async ({ page }) => {
      await navAndSs(page, "/settings", "gambar-4-19-konfigurasi-firebase.png")
    })

    test("4.20 - Status Sinkronisasi", async ({ page }) => {
      await navAndSs(page, "/sync", "gambar-4-20-status-sinkronisasi.png")
    })
  })

  // ===== WALI KELAS =====
  test.describe("Wali Kelas pages", () => {
    test("4.10 - Input Absensi", async ({ page }) => {
      await login(page, "walikelas", "wali123")
      await navAndSs(page, "/attendance/input", "gambar-4-10-input-absensi.png")
    })

    test("4.11 - Rekap Absensi", async ({ page }) => {
      await login(page, "walikelas", "wali123")
      await navAndSs(page, "/attendance/recap", "gambar-4-11-rekap-absensi.png")
    })
  })

  // ===== GURU =====
  test.describe("Guru pages", () => {
    test("4.12 - Input Nilai Akademik", async ({ page }) => {
      await login(page, "guru", "guru123")
      await navAndSs(page, "/grades/input", "gambar-4-12-input-nilai.png")
    })
  })
})
