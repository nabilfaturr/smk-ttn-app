import { test, expect, login } from "./fixtures/electron-fixture"

test.describe("Tahun Ajaran Info Badge (Admin)", () => {
  test("TAP-01: admin melihat badge tahun ajaran aktif di halaman absensi", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.click("text=/Rekap Absensi|Absensi/i")
    await page.waitForURL(/\/attendance/, { timeout: 10_000 })

    // Tunggu sampai badge muncul dengan teks TA (format "YYYY/YYYY")
    const badge = page.locator("text=/\\d{4}\\/\\d{4}/").first()
    await expect(badge).toBeVisible({ timeout: 10_000 })

    // Pastikan seluruh badge container visible (ada icon + label)
    await expect(page.locator("text=/Tahun Ajaran Aktif:/i").first()).toBeVisible()
    await expect(page.locator("text=/Semester \\d \\(Ganjil|Genap\\)/").first()).toBeVisible()
  })

  test("TAP-02: admin melihat badge tahun ajaran aktif di halaman input nilai", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.click("text=/Input Nilai|Nilai/i")
    await page.waitForURL(/\/grades/, { timeout: 10_000 })

    // Tunggu sampai badge muncul dengan teks TA
    const badge = page.locator("text=/\\d{4}\\/\\d{4}/").first()
    await expect(badge).toBeVisible({ timeout: 10_000 })
  })

  test("TAP-03: wali_kelas TIDAK melihat badge tahun ajaran (role-specific)", async ({ page }) => {
    await login(page, "walikelas", "wali123")
    await page.click("text=/Rekap Absensi|Absensi/i")
    await page.waitForURL(/\/attendance/, { timeout: 10_000 })

    // Badge khusus admin, tidak boleh muncul untuk wali_kelas
    const badgeCount = await page.locator("text=/Tahun Ajaran Aktif:/i").count()
    expect(badgeCount).toBe(0)
  })

  test("TAP-04: guru TIDAK melihat badge tahun ajaran (role-specific)", async ({ page }) => {
    await login(page, "guru", "guru123")
    await page.click("text=/Input Nilai|Nilai/i")
    await page.waitForURL(/\/grades/, { timeout: 10_000 })

    const badgeCount = await page.locator("text=/Tahun Ajaran Aktif:/i").count()
    expect(badgeCount).toBe(0)
  })
})
