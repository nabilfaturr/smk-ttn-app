import { test, expect, login } from "./fixtures/electron-fixture"

/**
 * Kelola Guru Pengampu (MapelAssignmentPage) E2E.
 *
 * Flow: pilih mapel → lihat 9 kelas × guru → edit satu kelas → save → verify
 *
 * Catatan: admin login digunakan karena halaman ini admin-only.
 * Test ini mutasi DB state, tapi TIDAK menambah user baru (aman untuk
 * diulang tanpa reset).
 */
test.describe("Kelola Guru Pengampu - P0 Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin123")
  })

  test("MPA-01: admin bisa akses halaman Kelola Guru Pengampu", async ({ page }) => {
    await page.locator('button:has-text("Kelola Guru Pengampu")').first().click()
    await page.waitForURL(/\/mapel-assignments/, { timeout: 10_000 })
    await expect(page.locator("h2")).toContainText("Kelola Guru Pengampu")
  })

  test("MPA-02: pilih mapel menampilkan 9 kelas dengan guru existing", async ({ page }) => {
    await page.locator('button:has-text("Kelola Guru Pengampu")').first().click()
    await page.waitForURL(/\/mapel-assignments/, { timeout: 10_000 })

    // Pilih MTK (Matematika) — semua 9 kelas sudah di-assign ke Kurniawan
    await page.locator('button:has-text("Pilih mata pelajaran")').first().click()
    await page.locator('[role="option"]:has-text("MTK")').click()
    await expect(page.locator("text=9 kelas · 9 sudah di-assign").first()).toBeVisible({ timeout: 10_000 })

    // Verify 9 row dengan nama kelas
    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(9)
    // First few kelas names
    await expect(page.locator("tbody tr").first()).toContainText("X RPL 1")
  })

  test("MPA-03: counter 'perubahan belum disimpan' update saat edit", async ({ page }) => {
    await page.locator('button:has-text("Kelola Guru Pengampu")').first().click()
    await page.waitForURL(/\/mapel-assignments/, { timeout: 10_000 })
    await page.locator('button:has-text("Pilih mata pelajaran")').first().click()
    await page.locator('[role="option"]:has-text("BIND")').click()
    await expect(page.locator("text=/9 kelas/").first()).toBeVisible({ timeout: 10_000 })

    // Awal: 0 perubahan
    await expect(page.locator("text=/0 perubahan belum disimpan/")).toBeVisible()

    // Buka dropdown kelas pertama
    const firstRowSelect = page.locator("tbody tr").first().locator('button[role="combobox"]').first()
    await firstRowSelect.click()
    const listbox = page.getByRole("listbox").last()
    await expect(listbox).toBeVisible()
    await listbox.getByRole("option").nth(2).click()
    await page.waitForTimeout(200) // tunggu re-render

    // Sekarang: 1 perubahan
    await expect(page.locator("text=/1 perubahan belum disimpan/")).toBeVisible({ timeout: 5_000 })
    // Tombol Save enabled
    await expect(page.locator('button:has-text("Simpan Perubahan")')).toBeEnabled({ timeout: 5_000 })

    // Reset
    await page.locator('button:has-text("Reset")').click()
    await expect(page.locator("text=/0 perubahan belum disimpan/")).toBeVisible()
  })

  test("MPA-04: save perubahan update assignment + toast success", async ({ page }) => {
    await page.locator('button:has-text("Kelola Guru Pengampu")').first().click()
    await page.waitForURL(/\/mapel-assignments/, { timeout: 10_000 })
    await page.locator('button:has-text("Pilih mata pelajaran")').first().click()
    await page.locator('[role="option"]:has-text("BING")').click()
    await expect(page.locator("text=/9 kelas/").first()).toBeVisible({ timeout: 10_000 })

    // Buka dropdown kelas pertama
    const firstRowSelect = page.locator("tbody tr").first().locator('button[role="combobox"]').first()
    await firstRowSelect.click()
    const listbox = page.getByRole("listbox").last()
    await expect(listbox).toBeVisible()
    await listbox.getByRole("option").nth(2).click()
    await page.waitForTimeout(200) // tunggu re-render

    // Save
    await page.locator('button:has-text("Simpan Perubahan")').click()
    // Toast success
    await expect(page.locator("text=/Disimpan/").first()).toBeVisible({ timeout: 5_000 })
  })

  test("MPA-05: pilih 'Belum di-assign' menghapus assignment", async ({ page }) => {
    await page.locator('button:has-text("Kelola Guru Pengampu")').first().click()
    await page.waitForURL(/\/mapel-assignments/, { timeout: 10_000 })
    await page.locator('button:has-text("Pilih mata pelajaran")').first().click()
    await page.locator('[role="option"]:has-text("MTK")').click()
    await expect(page.locator("text=/9 kelas/").first()).toBeVisible({ timeout: 10_000 })

    // Pilih opsi "Belum di-assign" di kelas X RPL 1
    const firstRowSelect = page.locator("tbody tr").first().locator('button[role="combobox"]').first()
    await firstRowSelect.click()
    const listbox = page.getByRole("listbox").last()
    await expect(listbox).toBeVisible()
    await listbox.getByRole("option", { name: /Belum di-assign/ }).click()

    // Save
    await page.locator('button:has-text("Simpan Perubahan")').click()
    await expect(page.locator("text=/dihapus/").first()).toBeVisible({ timeout: 5_000 })
  })
})
