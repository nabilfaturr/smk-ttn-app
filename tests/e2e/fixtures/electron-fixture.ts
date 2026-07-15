import { test as base, expect, _electron as electron, type ElectronApplication, type Page } from "@playwright/test"
import path from "path"

export const test = base.extend<{
  electronApp: ElectronApplication
  page: Page
}>({
  electronApp: async ({}, use) => {
    const app = await electron.launch({
      args: [path.join(__dirname, "../../..")],
      env: {
        ...process.env,
        NODE_ENV: "test",
        ELECTRON_DISABLE_GPU: "1",
        // Disable sync in E2E tests supaya gak benar-benar hit Firestore
        // (Firestore data lama = pre-UUID migration = cause FK errors)
        SMK_TTN_DISABLE_SYNC: "1",
      },
      timeout: 30_000,
    })
    await use(app)
    await app.close()
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow()
    // Wait for window to load a valid URL (not about:blank)
    await page.waitForFunction(() => window.location.href !== "about:blank", null, { timeout: 15_000 })
    await page.waitForLoadState("domcontentloaded")
    await use(page)
  },
})

export { expect }

export async function login(page: Page, username: string, password: string) {
  // Clear localStorage/sessionStorage for a fresh state
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear() } catch {}
  })

  // Reload to trigger auth redirect (HashRouter works with file://)
  await page.reload({ waitUntil: "domcontentloaded" })

  // Wait for login form
  await page.waitForSelector('input[placeholder*="kode login" i], input[placeholder*="username" i]', { timeout: 15_000 })

  // Fill credentials
  const loginInput = page.locator('input[placeholder*="kode login" i], input[placeholder*="username" i]').first()
  await loginInput.fill(username)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Masuk")')

  // Wait for dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
}

export async function waitForToast(page: Page, text: string | RegExp) {
  await expect(page.locator(`text=${text}`)).toBeVisible({ timeout: 5_000 })
}

export async function selectOption(page: Page, triggerSelector: string, optionIndex: number) {
  const trigger = page.locator(triggerSelector).first()
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click({ force: true })
  await page.waitForTimeout(500)

  const options = page.locator('[role="option"]')
  const count = await options.count()
  if (count === 0) {
    for (let i = 0; i <= optionIndex; i++) {
      await page.keyboard.press("ArrowDown")
      await page.waitForTimeout(80)
    }
    await page.keyboard.press("Enter")
    await page.waitForTimeout(300)
    return
  }

  if (optionIndex < count) {
    await options.nth(optionIndex).click({ force: true })
  } else {
    await options.first().click({ force: true })
  }
  await page.waitForTimeout(300)
}
