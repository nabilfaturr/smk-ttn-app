import { defineConfig, devices } from "@playwright/test"
import path from "path"

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
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on",
    videoOptions: {
      dir: path.join(__dirname, "test-results/videos-skripsi"),
    },
  },
  projects: [
    {
      name: "electron",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
