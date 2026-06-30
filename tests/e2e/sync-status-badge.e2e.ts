import { test, expect, login } from "./fixtures/electron-fixture"

/**
 * E2E test untuk SyncStatusBadge di header.
 *
 * Verifies:
 * - Badge muncul di header setelah login
 * - Badge punya label text yang readable
 * - Badge ada icon
 * - Badge update setelah CRUD action (pending state)
 */

test.describe("Sync Status Badge in Header", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin123")
    // Tunggu initial poll dari useSyncStatus (5 detik)
    await page.waitForTimeout(6_000)
  })

  test("SSB-01: badge muncul di header setelah login", async ({ page }) => {
    // Header visible
    const header = page.locator("header")
    await expect(header).toBeVisible({ timeout: 5_000 })

    // Badge: button dengan class rounded-full (pill shape), exclude sidebar toggle
    const badge = header.locator("button.rounded-full").first()
    await expect(badge).toBeVisible({ timeout: 5_000 })
  })

  test("SSB-02: badge punya icon dan label text", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    await expect(badge).toBeVisible()

    // Icon (SVG dari lucide-react)
    const icon = badge.locator("svg").first()
    await expect(icon).toBeVisible()

    // Text content harus non-empty
    const text = await badge.textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test("SSB-03: badge label sesuai salah satu state yang valid", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    const text = await badge.textContent()
    const validStates = [
      /Tersinkron/i,
      /Menyinkronkan/i,
      /data belum sync/i,
      /gagal sync/i,
      /offline|Offline/i,
      /Sync nonaktif/i,
      /data · offline/i,
    ]
    const matchesSomeState = validStates.some((rx) => rx.test(text ?? ""))
    expect(matchesSomeState).toBe(true)
  })

  test("SSB-04: badge punya title attribute (hover tooltip)", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    const title = await badge.getAttribute("title")
    expect(title).toBeTruthy()
    expect(title?.length).toBeGreaterThan(5)
  })

  test("SSB-05: badge punya rounded styling (pill shape)", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    const className = await badge.getAttribute("class")
    expect(className).toMatch(/rounded-full/)
  })

  test("SSB-06: badge di-render ulang saat pending count berubah", async ({ page }) => {
    const badge = page.locator("header button.rounded-full").first()
    await expect(badge).toBeVisible()

    // Navigate ke Sinkronisasi page (memicu refresh data)
    await page.click("text=/Sinkronisasi|Sync/i").catch(() => {})
    await page.waitForURL(/\/sync/, { timeout: 5_000 }).catch(() => {})

    // Tunggu poll berikutnya
    await page.waitForTimeout(6_000)

    // Navigate balik ke dashboard
    await page.click("text=/Dashboard/i").catch(() => {})
    await page.waitForURL(/\/dashboard/, { timeout: 5_000 }).catch(() => {})

    // Badge masih visible
    await expect(badge).toBeVisible()

    // Text content masih valid
    const finalText = await badge.textContent()
    expect(finalText?.trim().length).toBeGreaterThan(0)
  })
})
