import { test, expect } from "./fixtures/electron-fixture"

test.describe("TP Delete (Guru Bahasa Indonesia)", () => {
  test("guru bisa login dan akses halaman TP", async ({ page }) => {
    await page.fill('input[placeholder*="kode login" i], input[placeholder*="username" i]', "budi")
    await page.fill('input[type="password"]', "smkttn2026")
    await page.click('button:has-text("Masuk")')
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
    await expect(page.locator("text=/Dashboard/i")).toBeVisible()

    await page.goto("/master/learning-objectives")
    await page.waitForURL(/\/master\/learning-objectives/)
    await expect(page.locator("text=/Kelola Tujuan Pembelajaran/i")).toBeVisible()
  })

  test("guru bisa hapus TP yang belum ada nilainya", async ({ page }) => {
    await page.goto("/login?_t=" + Date.now())
    await page.waitForSelector('input[placeholder*="kode login" i], input[placeholder*="username" i]', { timeout: 15_000 })
    await page.fill('input[placeholder*="kode login" i], input[placeholder*="username" i]', "budi")
    await page.fill('input[type="password"]', "smkttn2026")
    await page.click('button:has-text("Masuk")')
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 })

    await page.goto("/master/learning-objectives")
    await page.waitForURL(/\/master\/learning-objectives/)
    await page.waitForTimeout(1_000)

    // Select mapel Bahasa Indonesia
    const mapelTrigger = page.locator('button:has-text("Pilih mapel")').first()
    await expect(mapelTrigger).toBeVisible({ timeout: 10_000 })
    await mapelTrigger.click({ force: true })
    await page.waitForTimeout(500)
    await page.locator('[role="option"]').first().click({ force: true })
    await page.waitForTimeout(1_000)

    const rows = page.locator("table tbody tr")
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)

    // Click delete on first row
    const deleteBtn = rows.first().locator('button:has-text("Hapus")')
    await expect(deleteBtn).toBeVisible()
    await deleteBtn.click()

    // Confirm in alert dialog
    const confirmBtn = page.locator('[role="alertdialog"] button:has-text("Hapus")')
    await expect(confirmBtn).toBeVisible({ timeout: 3_000 })
    await confirmBtn.click()
    await page.waitForTimeout(1_500)

    // Reload and verify TP is deleted
    await page.reload()
    await page.waitForURL(/\/master\/learning-objectives/)
    await page.waitForTimeout(1_000)

    await mapelTrigger.click({ force: true })
    await page.waitForTimeout(500)
    await page.locator('[role="option"]').first().click({ force: true })
    await page.waitForTimeout(1_000)

    const rowsAfter = page.locator("table tbody tr")
    const rowCountAfter = await rowsAfter.count()
    expect(rowCountAfter).toBe(rowCount - 1)
  })
})
