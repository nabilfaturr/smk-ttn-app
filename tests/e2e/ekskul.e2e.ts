import { test, expect, login } from "./fixtures/electron-fixture"

/**
 * Ekskul E2E - sesuai redesign (Ketarunaan merged ke ekskul, predikat default A, edit di DOCX).
 *
 * Struktur UI baru:
 * - Sidebar menu: "Ekstrakurikuler" (path /ekskul)
 * - Pilih kelas → table siswa × 7 ekskul
 * - Ketarunaan: badge "Wajib" + check icon (disabled, tidak bisa diinteraksi)
 * - 6 pilihan: Checkbox (toggleable)
 * - Counter badge di atas: "Ketarunaan (Wajib): 30/30, Pramuka: 5/30, ..."
 */
test.describe("Ekstrakurikuler - P0 Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin123")
  })

  test("EXT-01: admin bisa akses halaman Ekstrakurikuler via sidebar", async ({ page }) => {
    await page.locator('button:has-text("Ekstrakurikuler")').first().click()
    await page.waitForURL(/\/ekskul/, { timeout: 10_000 })
    await expect(page.locator("h2")).toContainText(/Ekstrakurikuler/i)
  })

  test("EXT-02: pilih kelas menampilkan table siswa + 7 kolom ekskul", async ({ page }) => {
    await page.locator('button:has-text("Ekstrakurikuler")').first().click()
    await page.waitForURL(/\/ekskul/, { timeout: 10_000 })

    // Pilih kelas pertama (X RPL 1)
    await page.locator('button:has-text("Pilih kelas")').first().click()
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(500)

    // Verify 7 kolom ekskul (Ketarunaan + 6 pilihan)
    const headers = page.locator("thead th")
    await expect(headers.nth(1)).toContainText("Ketarunaan")
    const pilihanNames = ["Paskibra", "Karate", "Marching Band", "Pramuka", "Silat", "Taekwondo"]
    for (const name of pilihanNames) {
      await expect(page.locator(`thead th:has-text("${name}")`)).toBeVisible()
    }
  })

  test("EXT-03: badge counter di atas table menampilkan jumlah enrollment per ekskul", async ({ page }) => {
    await page.locator('button:has-text("Ekstrakurikuler")').first().click()
    await page.waitForURL(/\/ekskul/, { timeout: 10_000 })

    await page.locator('button:has-text("Pilih kelas")').first().click()
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(500)

    // Badge Ketarunaan: "Ketarunaan (Wajib): N/N" — untuk X RPL 1 harus 30/30 (auto-enroll)
    const wajibBadge = page.locator('text=/Ketarunaan.*Wajib.*30\\/30/').first()
    await expect(wajibBadge).toBeVisible()
  })

  test("EXT-04: Ketarunaan wajib ditampilkan sebagai check icon (disabled), bukan checkbox", async ({ page }) => {
    await page.locator('button:has-text("Ekstrakurikuler")').first().click()
    await page.waitForURL(/\/ekskul/, { timeout: 10_000 })

    await page.locator('button:has-text("Pilih kelas")').first().click()
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(500)

    // Badge Wajib di header
    await expect(page.locator('thead th:has-text("Ketarunaan") >> text=/Wajib/').first()).toBeVisible()

    // Body cell: check icon (lucide-react Check renders as svg with check class)
    // Ketarunaan cells should NOT have role="checkbox"
    const ketarunaanCells = page.locator('tbody tr').first().locator('td').nth(1)
    const checkboxInCell = ketarunaanCells.locator('[role="checkbox"]')
    await expect(checkboxInCell).toHaveCount(0)
  })

  test("EXT-05: checkbox pilihan bisa di-toggle enroll", async ({ page }) => {
    await page.locator('button:has-text("Ekstrakurikuler")').first().click()
    await page.waitForURL(/\/ekskul/, { timeout: 10_000 })

    // Pilih XII RPL (sudah ada Pramuka di-seed, jadi kita pilih ekskul yang belum)
    await page.locator('button:has-text("Pilih kelas")').first().click()
    await page.locator('[role="option"]:has-text("XII RPL")').click()
    await page.waitForTimeout(500)

    // Cari siswa yang belum punya semua pilihan (badge Pramuka < 30)
    // Klik checkbox Pramuka di baris pertama
    const firstRow = page.locator('tbody tr').first()
    const pramukaCol = firstRow.locator('td').nth(5) // asumsi Pramuka di kolom ke-5
    const checkbox = pramukaCol.locator('[role="checkbox"]')

    // Skip jika tidak ada checkbox visible (XII RPL sudah penuh)
    const count = await checkbox.count()
    if (count === 0) {
      test.skip(true, "Tidak ada checkbox Pramuka tersedia di XII RPL")
      return
    }

    const beforeChecked = await checkbox.isChecked()
    await checkbox.click()
    await page.waitForTimeout(500)

    const afterChecked = await checkbox.isChecked()
    expect(afterChecked).toBe(!beforeChecked)

    // Toggle back (cleanup)
    await checkbox.click()
    await page.waitForTimeout(500)
    expect(await checkbox.isChecked()).toBe(beforeChecked)
  })

  test("EXT-06: info banner tentang default predikat A terlihat", async ({ page }) => {
    await page.locator('button:has-text("Ekstrakurikuler")').first().click()
    await page.waitForURL(/\/ekskul/, { timeout: 10_000 })

    // Pilih kelas dulu agar info banner muncul
    await page.locator('button:has-text("Pilih kelas")').first().click()
    await page.locator('[role="option"]').first().click()
    await page.waitForTimeout(500)

    // Info banner dengan teks "Predikat di rapor"
    await expect(page.locator('text=/Predikat di rapor/').first()).toBeVisible()
  })
})
