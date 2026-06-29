import { test, expect, login } from "./fixtures/electron-fixture"

/**
 * Kokurikuler (P5) E2E - sesuai redesign SMK TTN:
 * - 8 dimensi master (KEIMANAN, KEWARGANEGARAAN, PENALARAN KRITIS, KREATIVITAS,
 *   KOLABORASI, KEMANDIRIAN, KESEHATAN, KOMUNIKASI)
 * - Default aktif: 3 dimensi (KEIMANAN, KEWARGANEGARAAN, PENALARAN KRITIS)
 *   di semua tingkat (X, XI, XII)
 * - Total 9 subdimensi aktif
 * - Narasi: 1 kalimat per sub (pendek), spesifik per sub, bukan generic
 * - Sel kosong: siswa bisa skip sub (tidak diinput) → tidak muncul di rapor
 */
test.describe("Kokurikuler (P5) - P0 Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin123")
  })

  test("KOK-01: admin bisa akses halaman Kokurikuler (P5)", async ({ page }) => {
    await page.locator('button:has-text("Kokurikuler")').first().click()
    await page.waitForURL(/\/kokurikuler$/, { timeout: 10_000 })
    await expect(page.locator("h2")).toContainText(/Kokurikuler|P5/i)
  })

  test("KOK-02: pilih kelas menampilkan 3 dimensi aktif (default)", async ({ page }) => {
    await page.locator('button:has-text("Kokurikuler")').first().click()
    await page.waitForURL(/\/kokurikuler$/, { timeout: 10_000 })

    await page.locator('button:has-text("Pilih kelas")').first().click()
    await page.locator('[role="option"]').first().click()
    // Tunggu sampai card dimensi muncul (max 10 detik)
    await expect(page.locator("h3").first()).toBeVisible({ timeout: 10_000 })

    // Harus ada tepat 3 card dimensi (KEIMANAN, KEWARGANEGARAAN, PENALARAN KRITIS)
    const cards = page.locator("h3")
    await expect(cards.filter({ hasText: "Keimanan dan Ketaqwaan" })).toHaveCount(1)
    await expect(cards.filter({ hasText: "Kewargaan" })).toHaveCount(1)
    await expect(cards.filter({ hasText: "Penalaran Kritis" })).toHaveCount(1)

    // 5 dimensi non-aktif TIDAK boleh tampil
    await expect(cards.filter({ hasText: "Kreativitas" })).toHaveCount(0)
    await expect(cards.filter({ hasText: "Kolaborasi" })).toHaveCount(0)
    await expect(cards.filter({ hasText: "Kemandirian" })).toHaveCount(0)
    await expect(cards.filter({ hasText: "Kesehatan" })).toHaveCount(0)
    await expect(cards.filter({ hasText: "Komunikasi" })).toHaveCount(0)
  })

  test("KOK-03: total 9 subdimensi (3 dimensi × 3 sub) muncul", async ({ page }) => {
    await page.locator('button:has-text("Kokurikuler")').first().click()
    await page.waitForURL(/\/kokurikuler$/, { timeout: 10_000 })

    await page.locator('button:has-text("Pilih kelas")').first().click()
    await page.locator('[role="option"]').first().click()
    await expect(page.locator("h3").first()).toBeVisible({ timeout: 10_000 })

    // Subheader: "{N} siswa × {M} subdimensi"
    await expect(page.locator("text=/\\d+ siswa × \\d+ subdimensi/")).toBeVisible()

    const subHeaders = await page.locator("thead th").filter({ hasText: /Hubungan|Kewarga|Argumentasi|Keputusan|Masalah/ }).count()
    expect(subHeaders).toBeGreaterThanOrEqual(9)
  })

  test("KOK-04: halaman Atur Kokurikuler/Tingkat menampilkan 8 dimensi", async ({ page }) => {
    await page.locator('button:has-text("Atur Kokurikuler")').first().click()
    await page.waitForURL(/\/kokurikuler\/tingkat/, { timeout: 10_000 })

    // 8 card dimensi
    const expectedDimensi = [
      "Keimanan dan Ketaqwaan",
      "Kewargaan",
      "Penalaran Kritis",
      "Kreativitas",
      "Kolaborasi",
      "Kemandirian",
      "Kesehatan",
      "Komunikasi",
    ]
    for (const d of expectedDimensi) {
      await expect(page.locator(`text=/${d}/`).first()).toBeVisible()
    }
  })

  test("KOK-05: dropdown nilai Cakap/Berkembang/Mahir tampil per cell", async ({ page }) => {
    await page.locator('button:has-text("Kokurikuler")').first().click()
    await page.waitForURL(/\/kokurikuler$/, { timeout: 10_000 })

    await page.locator('button:has-text("Pilih kelas")').first().click()
    await page.locator('[role="option"]').first().click()
    await expect(page.locator("h3").first()).toBeVisible({ timeout: 10_000 })

    // Setiap cell punya Select trigger (Radix Select renders as button)
    const selectTriggers = page.locator("button[role='combobox']")
    const count = await selectTriggers.count()
    expect(count).toBeGreaterThan(0)

    // Klik cell ke-2 (skip dropdown kelas di index 0)
    await selectTriggers.nth(1).click()
    await expect(page.locator('[role="option"]:has-text("1 - Berkembang")').first()).toBeVisible()
    await expect(page.locator('[role="option"]:has-text("2 - Cakap")').first()).toBeVisible()
    await expect(page.locator('[role="option"]:has-text("3 - Mahir")').first()).toBeVisible()
  })
})
