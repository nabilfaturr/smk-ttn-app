import { test, expect } from "./fixtures/electron-fixture"

test.describe("Login Flow", () => {
  test("halaman login tampil", async ({ page }) => {
    await expect(page.locator("h1").first()).toContainText(/SMK|TTN|Absensi|Penilaian/i, { timeout: 10_000 })
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("login berhasil sebagai admin", async ({ page }) => {
    await page.fill('input[placeholder*="username" i]', "admin")
    await page.fill('input[type="password"]', "admin123")
    await page.click('button:has-text("Masuk")')

    // Tunggu redirect
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page).toHaveURL(/dashboard/)
  })

  test("login gagal dengan password salah", async ({ page }) => {
    await page.fill('input[placeholder*="username" i]', "admin")
    await page.fill('input[type="password"]', "wrongpassword")
    await page.click('button:has-text("Masuk")')

    // Error inline (bukan toast) muncul di form
    await expect(page.locator("text=/salah|gagal|invalid/i").first()).toBeVisible({ timeout: 5_000 })

    // URL tetap di /login
    await expect(page).toHaveURL(/login/)
  })

  test("login sebagai wali_kelas → menu terbatas", async ({ page }) => {
    await page.fill('input[placeholder*="username" i]', "walikelas")
    await page.fill('input[type="password"]', "wali123")
    await page.click('button:has-text("Masuk")')

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })

    // Menu admin tidak boleh muncul
    await expect(page.locator("text=/Data Siswa/i").first()).not.toBeVisible()
    // Menu wali kelas harus muncul
    await expect(page.locator("text=/Input Absensi/i").first()).toBeVisible()
  })

  test("login sebagai guru → menu nilai", async ({ page }) => {
    await page.fill('input[placeholder*="username" i]', "guru")
    await page.fill('input[type="password"]', "guru123")
    await page.click('button:has-text("Masuk")')

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })

    // Menu guru harus muncul
    await expect(page.locator("text=/Input Nilai/i").first()).toBeVisible()
  })
})
