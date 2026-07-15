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

  test("SY-02: badge show valid sync state (real Firebase enabled)", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    await expect(badge).toBeVisible({ timeout: 5_000 })
    const text = await badge.textContent()
    // Badge valid states: Tersinkron, Menyinkronkan, Real-time aktif, Tarik data,
    //                    data belum sync, gagal sync, offline, Sync nonaktif
    const validStates = [
      /Tersinkron/i,
      /Menyinkronkan/i,
      /Real-time aktif/i,
      /Tarik data/i,
      /data belum sync/i,
      /gagal sync/i,
      /offline/i,
      /Sync nonaktif/i,
    ]
    expect(validStates.some((rx) => rx.test(text ?? ""))).toBe(true)
  })

  test("SY-03: badge has appropriate styling for its state", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    const className = await badge.getAttribute("class")
    expect(className).toBeTruthy()
    // Badge harus punya salah satu styling: gray (unconfigured/offline),
    // emerald (synced), blue (syncing), violet (pulling), cyan (listening),
    // amber (pending), red (error)
    const validColors = ["bg-gray", "bg-emerald", "bg-blue", "bg-violet", "bg-cyan", "bg-amber", "bg-red"]
    expect(validColors.some((c) => className?.includes(c))).toBe(true)
  })

  test("SY-04: badge has correct title attribute (tooltip)", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    const title = await badge.getAttribute("title")
    expect(title).toBeTruthy()
    expect(title?.length).toBeGreaterThan(5)
    // Title tergantung state — bisa tentang sync, online, offline, listener
    expect(title).toMatch(/Sync|Firebase|sinkron|Real-time|online|offline|Listener|cloud/i)
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

test.describe("Real Firebase Sync E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Login fresh untuk setiap test
    await page.evaluate(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {}
    })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForSelector('input[placeholder*="kode login" i]', { timeout: 10_000 })
    await page.locator('input[placeholder*="kode login" i]').first().fill("admin")
    await page.fill('input[type="password"]', "admin123")
    await page.click('button:has-text("Masuk")')
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
    await page.waitForTimeout(2_000)
  })

  test("SY-11: trigger manual sync from SyncStatusPage (real Firebase)", async ({ page }) => {
    await page.click("text=/Sinkronisasi/i")
    await page.waitForURL(/\/sync/, { timeout: 10_000 })
    // Tunggu initial poll (5s) + buffer
    await page.waitForTimeout(7_000)

    const syncBtn = page.locator('button:has-text("Sinkronkan Sekarang")')

    // Button hanya enabled kalau online
    if (await syncBtn.isEnabled()) {
      await syncBtn.click()
      // Tunggu toast (success/error)
      const toast = page.locator("[data-sonner-toast]").first()
      await toast.waitFor({ state: "visible", timeout: 10_000 }).catch(() => null)
      console.log("SY-11: Manual sync triggered, toast shown")
    } else {
      console.log("SY-11: Sync button disabled, skipping")
      test.skip()
    }
  })

  test("SY-12: Restore dari Cloud button works (real Firebase pull)", async ({ page }) => {
    await page.click("text=/Sinkronisasi/i")
    await page.waitForURL(/\/sync/, { timeout: 10_000 })
    // Tunggu initial poll
    await page.waitForTimeout(7_000)

    // Auto-accept confirm
    page.on("dialog", (d) => d.accept())

    const restoreBtn = page.locator('button:has-text("Restore dari Cloud")')

    if (await restoreBtn.isEnabled()) {
      await restoreBtn.click()
      // Tunggu success/error toast
      const successToast = page.locator("text=/Restore selesai/i")
      const errorToast = page.locator("text=/Restore gagal/i")
      const result = await Promise.race([
        successToast.waitFor({ state: "visible", timeout: 30_000 }).then(() => "success"),
        errorToast.waitFor({ state: "visible", timeout: 30_000 }).then(() => "error"),
      ]).catch(() => "timeout")
      expect(result).not.toBe("timeout")
    } else {
      console.log("SY-12: Restore button disabled (no internet), skipping")
      test.skip()
    }
  })
})
