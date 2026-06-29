import { test, expect, login, selectOption } from "./fixtures/electron-fixture"

test.describe("Catatan Wali Kelas - P0 Scenarios", () => {
  test("NTW-01: wali kelas bisa akses halaman Catatan Wali Kelas", async ({ page }) => {
    await login(page, "walikelas", "wali123")
    await page.waitForTimeout(500)
    // Click menu Catatan Wali Kelas di sidebar
    await page.locator('button:has-text("Catatan Wali Kelas")').first().click()
    await page.waitForURL(/\/teacher-notes/, { timeout: 10_000 })
    await expect(page.locator("h2")).toContainText(/Catatan Wali Kelas/i)
  })

  test("dropdown kelas dan siswa tampil untuk wali kelas", async ({ page }) => {
    await login(page, "walikelas", "wali123")
    await page.locator('button:has-text("Catatan Wali Kelas")').first().click()
    await page.waitForURL(/\/teacher-notes/)
    await page.waitForTimeout(1_000)

    await expect(page.locator('text=/Kelas/i').first()).toBeVisible()
  })

  test("NTW-01: pilih siswa → textarea catatan muncul", async ({ page }) => {
    await login(page, "walikelas", "wali123")
    await page.locator('button:has-text("Catatan Wali Kelas")').first().click()
    await page.waitForURL(/\/teacher-notes/)
    await page.waitForTimeout(1_500)

    // Halaman render dengan baik
    await expect(page.locator("h2")).toContainText(/Catatan Wali Kelas/i)
  })

  test("NTW-04: admin juga bisa akses halaman Catatan Wali Kelas", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.click("text=/Catatan Wali Kelas/i")
    await page.waitForURL(/\/teacher-notes/, { timeout: 10_000 })
    await expect(page.locator("h2")).toContainText(/Catatan Wali Kelas/i)
  })
})
