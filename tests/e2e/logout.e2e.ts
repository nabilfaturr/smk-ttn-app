import { test, expect, login } from "./fixtures/electron-fixture"

test.describe("AUTH-08: Logout Flow", () => {
  test("logout dari admin → redirect ke /login", async ({ page }) => {
    // Login sebagai admin
    await login(page, "admin", "admin123")
    await page.waitForTimeout(500)

    // Klik tombol Logout ("Keluar" di sidebar)
    const logoutButton = page.locator('button:has-text("Keluar")')
    await expect(logoutButton).toBeVisible({ timeout: 5_000 })
    await logoutButton.click()

    // Tunggu redirect ke /login
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    await expect(page).toHaveURL(/login/)

    // Form login tampil lagi
    await expect(page.locator('input[placeholder*="username" i]')).toBeVisible()
  })

  test("logout dari wali kelas → redirect ke /login", async ({ page }) => {
    await login(page, "walikelas", "wali123")
    await page.waitForTimeout(500)

    await page.locator('button:has-text("Keluar")').click()
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    await expect(page).toHaveURL(/login/)
  })

  test("logout dari guru → redirect ke /login", async ({ page }) => {
    await login(page, "guru", "guru123")
    await page.waitForTimeout(500)

    await page.locator('button:has-text("Keluar")').click()
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    await expect(page).toHaveURL(/login/)
  })

  test("setelah logout, tidak bisa akses halaman protected via direct nav", async ({ page }) => {
    // Login
    await login(page, "admin", "admin123")
    await page.waitForTimeout(500)

    // Logout
    await page.locator('button:has-text("Keluar")').click()
    await page.waitForURL(/\/login/, { timeout: 10_000 })

    // Coba akses dashboard via URL langsung
    const baseUrl = new URL(page.url()).origin
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1_500)

    // Harus di-redirect ke /login
    await expect(page).toHaveURL(/login/)
  })
})
