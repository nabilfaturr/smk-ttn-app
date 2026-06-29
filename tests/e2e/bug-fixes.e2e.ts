import { test, expect, login, selectOption } from "./fixtures/electron-fixture"

/**
 * E2E test untuk 4 bug fixes:
 * - Bug 1: Agama Target column removed from Data Mapel table
 * - Bug 2: Absensi recap shows all data (no 15-row pagination limit)
 * - Bug 3: TP dropdown (T/R) in Grade Input is clickable
 * - Bug 4: Kokurikuler page shows table siswa × subdimensi (no siswa dropdown)
 */
test.describe("Bug Fixes - Admin Pages", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin123")
  })

  // ============== BUG 1: Agama Target column ==============
  test("FIX-01: kolom Agama Target TIDAK ada di tabel Data Mapel", async ({ page }) => {
    await page.click("text=/Data Mapel/i")
    await page.waitForURL(/\/subjects/, { timeout: 10_000 })
    await page.waitForTimeout(1_000)

    // Kolom "Agama Target" TIDAK boleh ada di table header
    const tableHeaders = await page.locator("thead th").allTextContents()
    expect(tableHeaders).not.toContain("Agama Target")

    // Tapi field "Agama Target" MASIH ada di form edit
    await page.click('button:has-text("Tambah")')
    await page.waitForSelector('text=/Kode Mapel/i', { timeout: 5_000 })
    await expect(page.locator("text=/Agama Target/i").first()).toBeVisible()
  })

  // ============== BUG 2: Absensi pagination ==============
  test("FIX-02: Absensi rekap menampilkan semua siswa (no 15-row limit)", async ({ page }) => {
    await page.click("text=/Rekap Absensi|Absensi/i")
    await page.waitForURL(/\/attendance/, { timeout: 10_000 })
    await page.waitForTimeout(1_000)

    // Pilih kelas XII RPL (30 siswa)
    await page.click('button:has-text("Pilih kelas")')
    await page.waitForTimeout(500)
    await page.click('[role="option"]:has-text("XII RPL")')
    await page.waitForTimeout(300)

    // Set tanggal
    const today = new Date().toISOString().slice(0, 10)
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    await page.locator('input[type="date"]').first().fill(lastMonth)
    await page.locator('input[type="date"]').last().fill(today)

    // Klik Cari
    await page.click('button:has-text("Cari")')
    await page.waitForTimeout(2_000)

    // Hitung jumlah baris di tabel
    const rowCount = await page.locator("tbody tr").count()
    expect(rowCount).toBeGreaterThan(15) // Bukan dibatasi 15

    // Pagination navigation (Sebelumnya/Selanjutnya) TIDAK boleh ada
    const pageNavCount = await page.locator('button:has-text("Selanjutnya")').count()
    expect(pageNavCount).toBe(0) // No pagination since we set pageSize=1000
  })

  // ============== BUG 3: TP button group in Grade Input ==============
  test("FIX-03: button group TP (T/R) bisa diklik dan update state", async ({ page }) => {
    await page.click("text=/Input Nilai|Nilai/i")
    await page.waitForURL(/\/grades/, { timeout: 10_000 })
    await page.waitForTimeout(1_500)

    // Pilih mapel yang punya TP (Bahasa Indonesia)
    await page.click('button:has-text("Pilih mapel")')
    await page.waitForTimeout(800)
    await page.click('[role="option"]:has-text("Bahasa Indonesia")')
    await page.waitForTimeout(800)

    // Pilih kelas XII RPL
    await page.click('button:has-text("Pilih kelas")')
    await page.waitForTimeout(800)
    await page.click('[role="option"]:has-text("XII RPL")')
    await page.waitForTimeout(3_000)

    // Verify ada T/R button groups (10 TP × 30 siswa = 300)
    const tButtons = page.locator("button[data-testid^='tp-t-']")
    await tButtons.first().waitFor({ state: "visible", timeout: 5_000 })
    expect(await tButtons.count()).toBeGreaterThan(0)

    // Klik T button → harus jadi hijau (bg-green-600)
    const firstT = tButtons.first()
    const classBefore = await firstT.getAttribute("class")
    expect(classBefore).toContain("bg-transparent")
    await firstT.click()
    await page.waitForTimeout(500)
    await expect(firstT).toHaveClass(/bg-green-600/)

    // Klik lagi → harus clear (bg-transparent)
    await firstT.click()
    await page.waitForTimeout(500)
    await expect(firstT).toHaveClass(/bg-transparent/)

    // Test R button → harus jadi merah (bg-red-600)
    const rButtons = page.locator("button[data-testid^='tp-r-']")
    await rButtons.first().click()
    await page.waitForTimeout(500)
    await expect(rButtons.first()).toHaveClass(/bg-red-600/)
  })

  // ============== BUG 4: Kokurikuler table view ==============
  test("FIX-04: Kokurikuler menampilkan table siswa × subdimensi (no siswa dropdown)", async ({ page }) => {
    await page.click("text=/Kokurikuler/i")
    await page.waitForURL(/\/kokurikuler/, { timeout: 10_000 })
    await page.waitForTimeout(1_000)

    // Pilih kelas
    await page.click('button:has-text("Pilih kelas")')
    await page.waitForTimeout(500)
    await page.click('[role="option"]:has-text("XII RPL")')
    await page.waitForTimeout(2_000) // Wait for siswa + grades to load

    // TIDAK ada lagi dropdown "Pilih siswa" (refactor removed it)
    const siswaDropdownCount = await page.locator('button:has-text("Pilih siswa")').count()
    expect(siswaDropdownCount).toBe(0)

    // Ada table dengan rows = siswa (30 siswa XII RPL)
    const tableCount = await page.locator("table").count()
    expect(tableCount).toBeGreaterThan(0)

    // Header tabel: ada "Nama Siswa" + subdimensi columns
    const firstTableHeader = await page.locator("table").first().locator("thead th").first().textContent()
    expect(firstTableHeader).toContain("Nama Siswa")

    // Body tabel: minimal 1 row (ada siswa di XII RPL)
    const bodyRowCount = await page.locator("table").first().locator("tbody tr").count()
    expect(bodyRowCount).toBeGreaterThan(0)
  })

  test("FIX-04b: 1 cell grade di-set TIDAK mengubah cell lain (bug fix)", async ({ page }) => {
    await page.click("text=/Kokurikuler/i")
    await page.waitForURL(/\/kokurikuler/)
    await page.waitForTimeout(1_000)

    await page.click('button:has-text("Pilih kelas")')
    await page.waitForTimeout(500)
    await page.click('[role="option"]:has-text("XII RPL")')
    await page.waitForTimeout(3_000) // Wait for bulk load

    const triggers = page.locator("table button[role='combobox']")
    const triggerCount = await triggers.count()
    expect(triggerCount).toBeGreaterThan(0)

    if (triggerCount >= 2) {
      // Catat nilai kolom KEDUA sebelum set kolom PERTAMA
      const secondBefore = (await triggers.nth(1).textContent())?.trim() ?? ""

      // Set kolom PERTAMA ke grade 2
      const firstTrigger = triggers.first()
      await firstTrigger.click({ force: true })
      await page.waitForTimeout(500)
      const cakapOption = page.locator('[role="option"]:has-text("2 - Cakap")').first()
      await cakapOption.click({ force: true })
      await page.waitForTimeout(500)

      // Verify kolom PERTAMA = "2"
      const firstAfter = (await firstTrigger.textContent())?.trim() ?? ""
      expect(firstAfter).toContain("2")

      // BUG FIX: kolom KEDUA TIDAK boleh ikut berubah ke "2"
      // (sebelumnya bug: semua subdimensi ikut berubah karena key=${siswaId}-undefined)
      const secondAfter = (await triggers.nth(1).textContent())?.trim() ?? ""
      expect(secondAfter).toBe(secondBefore)
      expect(secondAfter).not.toBe("2▼")
    }
  })
})
