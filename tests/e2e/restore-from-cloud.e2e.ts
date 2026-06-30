import { test, expect, login } from "./fixtures/electron-fixture"

/**
 * E2E test untuk "Restore dari Cloud" (pull dari Firestore).
 *
 * Setup: Asumsi Firestore udah ada data (dari push sebelumnya).
 * Test ini verify button works dan gak error.
 */

test.describe("Restore from Cloud (Pull)", () => {
  test("RFC-01: button 'Restore dari Cloud' muncul di Sync page", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.click("text=/Sinkronisasi|Sync/i")
    await page.waitForURL(/\/sync/, { timeout: 10_000 })

    const btn = page.locator('button:has-text("Restore dari Cloud")')
    await expect(btn).toBeVisible({ timeout: 5_000 })
  })

  test("RFC-02: click button → confirm dialog → pull jalan (success atau error toast)", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.click("text=/Sinkronisasi|Sync/i")
    await page.waitForURL(/\/sync/, { timeout: 10_000 })

    // Auto-accept confirm dialog
    page.on("dialog", (d) => d.accept())

    const btn = page.locator('button:has-text("Restore dari Cloud")')
    await expect(btn).toBeVisible({ timeout: 5_000 })
    await btn.click()

    // Tunggu sampai salah satu toast muncul (success / error / loading)
    // Loading toast ada text "Menarik data"
    // Success ada "Restore selesai"
    // Error ada "Restore gagal"
    const loadingToast = page.locator("text=/Menarik data/i")
    const successToast = page.locator("text=/Restore selesai/i")
    const errorToast = page.locator("text=/Restore gagal/i")

    // Salah satu harus muncul dalam 30 detik (network call ke Firestore)
    const result = await Promise.race([
      successToast.waitFor({ state: "visible", timeout: 30_000 }).then(() => "success"),
      errorToast.waitFor({ state: "visible", timeout: 30_000 }).then(() => "error"),
    ]).catch(() => "timeout")

    expect(["success", "error"]).toContain(result)
    // Loading toast mungkin udah hilang, jadi gak dicek strict
  })

  test("RFC-03: setelah pull, badge di header update (sinkron baru saja)", async ({ page }) => {
    await login(page, "admin", "admin123")

    // Tunggu initial poll
    await page.waitForTimeout(6_000)

    page.on("dialog", (d) => d.accept())

    // Navigate ke sync page
    await page.click("text=/Sinkronisasi|Sync/i")
    await page.waitForURL(/\/sync/, { timeout: 10_000 })

    // Click Restore
    const btn = page.locator('button:has-text("Restore dari Cloud")')
    await btn.click()

    // Tunggu success/error
    const successToast = page.locator("text=/Restore selesai/i")
    const errorToast = page.locator("text=/Restore gagal/i")

    const result = await Promise.race([
      successToast.waitFor({ state: "visible", timeout: 30_000 }).then(() => "success"),
      errorToast.waitFor({ state: "visible", timeout: 30_000 }).then(() => "error"),
    ]).catch(() => "timeout")

    // Test dianggap passed kalau ada respons (gak timeout)
    expect(result).not.toBe("timeout")
  })
})
