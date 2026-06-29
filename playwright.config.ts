import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright config untuk E2E testing aplikasi Electron SMK TTN.
 *
 * Catatan: Electron adalah target, jadi pakai `_electron.launch()`.
 * Test E2E akan launch app beneran, login, dan verifikasi alur.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: false, // Serial karena Electron app cuma bisa jalan 1 instance
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "electron",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
