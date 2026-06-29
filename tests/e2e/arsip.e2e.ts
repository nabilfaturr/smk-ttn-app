import { test, expect, login } from "./fixtures/electron-fixture"

/**
 * Arsip Page — akses data historis TA non-aktif (admin only).
 */
test.describe("Arsip (Admin) - P0 Scenarios", () => {
  test("ARS-01: admin bisa akses halaman Arsip", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.locator('button:has-text("Arsip")').first().click()
    await page.waitForURL(/\/arsip/, { timeout: 10_000 })
    await expect(page.locator("text=/Arsip Tahun Ajaran/i")).toBeVisible({ timeout: 5_000 })
  })

  test("ARS-02: halaman menampilkan TA non-aktif di dropdown", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.locator('button:has-text("Arsip")').first().click()
    await page.waitForURL(/\/arsip/)

    // TA selector visible
    await expect(page.locator("text=/Pilih Tahun Ajaran/i")).toBeVisible({ timeout: 5_000 })

    // Summary cards visible
    await expect(page.locator("text=/Total Kelas/i")).toBeVisible()
    await expect(page.locator("text=/Total Siswa/i")).toBeVisible()
    await expect(page.locator("text=/Total Mapel/i")).toBeVisible()
    await expect(page.locator("text=/Total Guru Pengampu/i")).toBeVisible()
  })

  test("ARS-03: pilih TA non-aktif menampilkan summary + siswa", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.locator('button:has-text("Arsip")').first().click()
    await page.waitForURL(/\/arsip/)
    await page.waitForTimeout(500)

    // TA dropdown trigger (defaultnya sudah ke TA non-aktif pertama, e.g. "2024/2025")
    const taDropdown = page.locator('div:has(> label:has-text("Pilih Tahun Ajaran")) button[role="combobox"]').first()
    await taDropdown.click()
    await page.waitForTimeout(300)

    // Pilih TA 2023/2024 (non-aktif, ada di seed)
    await page.locator('[role="option"]:has-text("2023/2024")').click()
    await page.waitForTimeout(1000)

    // Summary cards visible
    await expect(page.locator("text=/Total Kelas/i").first()).toBeVisible()
    // Tabel siswa header
    await expect(page.locator("text=/Daftar Siswa/i")).toBeVisible({ timeout: 5_000 })
  })
})
