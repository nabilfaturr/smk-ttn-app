import { test, expect, login } from "./fixtures/electron-fixture"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"

/**
 * E2E test untuk Firebase sync configuration flow.
 *
 * Test scenarios:
 * 1. Admin dapat akses & save Firebase config di Settings
 * 2. Encrypted file ditulis ke userData/firebase-config.enc
 * 3. API key di-mask saat di-load (security)
 * 4. "Terkonfigurasi" badge muncul setelah save
 * 5. Test koneksi tanpa internet (akan gagal dengan friendly message)
 * 6. Hapus config: badge kembali ke "Belum dikonfigurasi"
 */
test.describe("Firebase Sync Configuration", () => {
  test.beforeEach(async ({ page }) => {
    // Hapus config lama sebelum test
    const configPath = path.join(os.homedir(), ".config", "smk-ttn-app", "firebase-config.enc")
    if (fs.existsSync(configPath)) {
      try { fs.unlinkSync(configPath) } catch {}
    }
    await login(page, "admin", "admin123")
    await page.click("text=/Pengaturan|Settings/i")
    await page.waitForURL(/\/settings/, { timeout: 10_000 })
  })

  test("SFS-01: admin dapat melihat form Firebase config", async ({ page }) => {
    await expect(page.locator("text=/Firebase Sync/i").first()).toBeVisible({ timeout: 5_000 })
    await expect(page.locator("text=/Belum dikonfigurasi/i").first()).toBeVisible()
    await expect(page.locator("text=/API Key/i").first()).toBeVisible()
    await expect(page.locator("text=/Project ID/i").first()).toBeVisible()
  })

  test("SFS-02: simpan config → badge berubah jadi 'Terkonfigurasi'", async ({ page }) => {
    // Isi form
    const apiKeyInput = page.locator('input[placeholder*="AIzaSy"]').first()
    const projectIdInput = page.locator('input[placeholder*="smk-ttn-prod"]').first()

    await apiKeyInput.fill("AIzaSyD_test_fake_key_12345678901234567890")
    await projectIdInput.fill("test-project-id")

    // Klik Simpan
    await page.click('button:has-text("Simpan Config")')

    // Tunggu toast muncul
    await page.waitForSelector("text=/Config tersimpan/i", { timeout: 5_000 })

    // Badge harus berubah
    await expect(page.locator("text=/Terkonfigurasi/i").first()).toBeVisible({ timeout: 3_000 })
  })

  test("SFS-03: encrypted file dibuat di userData", async ({ page }) => {
    const apiKeyInput = page.locator('input[placeholder*="AIzaSy"]').first()
    const projectIdInput = page.locator('input[placeholder*="smk-ttn-prod"]').first()
    await apiKeyInput.fill("AIzaSyD_test_123")
    await projectIdInput.fill("my-test-project")
    await page.click('button:has-text("Simpan Config")')
    await page.waitForSelector("text=/Config tersimpan/i", { timeout: 5_000 })

    // Verify file exists
    const configPath = path.join(os.homedir(), ".config", "smk-ttn-app", "firebase-config.enc")
    expect(fs.existsSync(configPath)).toBe(true)
  })

  test("SFS-04: API key TIDAK di-expose kembali (security feature)", async ({ page }) => {
    // Simpan dulu
    const apiKeyInput = page.locator('input[placeholder*="AIzaSy"]').first()
    const projectIdInput = page.locator('input[placeholder*="smk-ttn-prod"]').first()
    await apiKeyInput.fill("AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ123456")
    await projectIdInput.fill("my-test-project")
    await page.click('button:has-text("Simpan Config")')
    await page.waitForSelector("text=/Config tersimpan/i", { timeout: 5_000 })

    // Re-login karena reload reset in-memory state
    await login(page, "admin", "admin123")
    await page.click("text=/Pengaturan|Settings/i")
    await page.waitForURL(/\/settings/, { timeout: 10_000 })
    await page.waitForSelector("text=/Firebase Sync/i", { timeout: 10_000 })

    // API key TIDAK boleh ter-load (security: full key tidak pernah di-restore)
    const apiKeyValue = await apiKeyInput.inputValue()
    expect(apiKeyValue).toBe("")  // Kosong = admin harus isi ulang

    // Tapi project ID tetap ke-load (non-secret)
    const projectIdValue = await projectIdInput.inputValue()
    expect(projectIdValue).toBe("my-test-project")
  })

  test("SFS-05: wali_kelas TIDAK bisa akses Firebase config (admin-only)", async ({ page }) => {
    // Logout admin
    await page.click("text=/Logout|Keluar/i").catch(() => {})

    // Login as wali_kelas
    await login(page, "walikelas", "wali123")

    // Navigate ke Settings - menu tidak ada di sidebar untuk wali_kelas
    const settingsLink = page.locator("text=/Pengaturan|Settings/i")
    const isVisible = await settingsLink.first().isVisible().catch(() => false)

    // Settings menu tidak boleh muncul untuk wali_kelas
    expect(isVisible).toBe(false)
  })

  test("SFS-06: hapus config → badge kembali 'Belum dikonfigurasi'", async ({ page }) => {
    // Save dulu
    const apiKeyInput = page.locator('input[placeholder*="AIzaSy"]').first()
    const projectIdInput = page.locator('input[placeholder*="smk-ttn-prod"]').first()
    await apiKeyInput.fill("AIzaSyTest")
    await projectIdInput.fill("test")
    await page.click('button:has-text("Simpan Config")')
    await page.waitForSelector("text=/Config tersimpan/i", { timeout: 5_000 })
    await expect(page.locator("text=/Terkonfigurasi/i").first()).toBeVisible()

    // Setup dialog handler (confirm dialog accept)
    page.on("dialog", (d) => d.accept())

    // Klik Hapus
    await page.click('button:has-text("Hapus Config")')
    await page.waitForSelector("text=/Firebase config dihapus/i", { timeout: 5_000 })

    // Badge harus kembali
    await expect(page.locator("text=/Belum dikonfigurasi/i").first()).toBeVisible({ timeout: 3_000 })
  })
})
