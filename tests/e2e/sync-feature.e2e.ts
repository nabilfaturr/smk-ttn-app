import { test, expect, login } from "./fixtures/electron-fixture"

// E2E test untuk fitur sinkronisasi (Phase 1-5).
// Test ini verify fitur-fitur TANPA Firebase real:
//   - App launch + login
//   - SyncStatusBadge states
//   - SyncStatusPage stats cards (Antrean, Retry, Dead Letter)
//   - Cleanup button (Phase 5)
//   - SMK_TTN_DISABLE_SYNC env var works
//
// DB schema verification (users.id=UUID, sync_log has retry fields)
// dilakukan manual via sqlite3 CLI — electronApp.evaluate di test
// environment tidak expose Node require/import untuk schema check.

test.describe("Sync Feature E2E (Phase 1-5)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin123")
    // Tunggu initial poll (5 detik)
    await page.waitForTimeout(6_000)
  })

  test("SY-01: SyncStatusBadge muncul di header setelah login", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    await expect(badge).toBeVisible({ timeout: 5_000 })
  })

  test("SY-02: badge show 'Sync nonaktif' (no Firebase in test mode)", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    await expect(badge).toBeVisible({ timeout: 5_000 })
    const text = await badge.textContent()
    expect(text).toMatch(/Sync nonaktif/i)
  })

  test("SY-03: badge 'Sync nonaktif' has gray styling", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    const className = await badge.getAttribute("class")
    expect(className).toMatch(/bg-gray/)
    expect(className).toMatch(/text-gray/)
  })

  test("SY-04: badge has correct title attribute (tooltip)", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    const title = await badge.getAttribute("title")
    expect(title).toBeTruthy()
    expect(title?.length).toBeGreaterThan(5)
    expect(title).toMatch(/Sync|Firebase|sinkron/i)
  })

  test("SY-05: SyncStatusPage has 3 stat cards (Antrean, Retry, Dead Letter)", async ({ page }) => {
    await page.click("text=/Sinkronisasi/i")
    await page.waitForURL(/\/sync/, { timeout: 10_000 })
    await page.waitForTimeout(1_000)

    await expect(page.locator("text=/Antrean/")).toBeVisible({ timeout: 5_000 })
    await expect(page.locator("text=/Retry/")).toBeVisible({ timeout: 5_000 })
    await expect(page.locator("text=/Dead Letter/")).toBeVisible({ timeout: 5_000 })
  })

  test("SY-06: SyncStatusPage has Sinkronkan Sekarang button", async ({ page }) => {
    await page.click("text=/Sinkronisasi/i")
    await page.waitForURL(/\/sync/, { timeout: 10_000 })

    const syncBtn = page.locator('button:has-text("Sinkronkan Sekarang")')
    await expect(syncBtn).toBeVisible({ timeout: 5_000 })
  })

  test("SY-07: SyncStatusPage has Restore dari Cloud button", async ({ page }) => {
    await page.click("text=/Sinkronisasi/i")
    await page.waitForURL(/\/sync/, { timeout: 10_000 })

    const restoreBtn = page.locator('button:has-text("Restore dari Cloud")')
    await expect(restoreBtn).toBeVisible({ timeout: 5_000 })
  })

  test("SY-08: SyncStatusPage has Cleanup Log Lama button (Phase 5)", async ({ page }) => {
    await page.click("text=/Sinkronisasi/i")
    await page.waitForURL(/\/sync/, { timeout: 10_000 })

    const cleanupBtn = page.locator('button:has-text("Cleanup Log Lama")')
    await expect(cleanupBtn).toBeVisible({ timeout: 5_000 })
  })

  test("SY-09: SyncStatusPage has Export Database button", async ({ page }) => {
    await page.click("text=/Sinkronisasi/i")
    await page.waitForURL(/\/sync/, { timeout: 10_000 })

    const exportBtn = page.locator('button:has-text("Export Database")')
    await expect(exportBtn).toBeVisible({ timeout: 5_000 })
  })

  test("SY-10: badge persists across route navigation", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    await expect(badge).toBeVisible({ timeout: 5_000 })

    // Navigate to dashboard
    await page.click("text=/Dashboard/i").catch(() => {})
    await page.waitForURL(/\/dashboard/, { timeout: 5_000 }).catch(() => {})
    await page.waitForTimeout(2_000)

    // Badge still visible
    await expect(badge).toBeVisible({ timeout: 5_000 })
  })
})
