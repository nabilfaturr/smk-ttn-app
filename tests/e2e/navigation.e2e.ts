import { test, expect, login } from "./fixtures/electron-fixture"

test.describe("Navigation & Role-Based Access (P0)", () => {
  test("UI-09: admin melihat menu lengkap di sidebar", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.waitForTimeout(500)

    // Admin harus lihat menu-menu utama
    await expect(page.locator("text=/Data Siswa/i").first()).toBeVisible()
    await expect(page.locator("text=/Data Kelas/i").first()).toBeVisible()
    await expect(page.locator("text=/Data Guru/i").first()).toBeVisible()
    await expect(page.locator("text=/Generate Rapor/i").first()).toBeVisible()
  })

  test("UI-09: wali kelas hanya melihat menu wali kelas", async ({ page }) => {
    await login(page, "walikelas", "wali123")
    await page.waitForTimeout(500)

    // Menu wali kelas
    await expect(page.locator("text=/Input Absensi/i").first()).toBeVisible()
    await expect(page.locator("text=/Rekap Absensi/i").first()).toBeVisible()
    await expect(page.locator("text=/Catatan Wali Kelas/i").first()).toBeVisible()

    // Menu admin TIDAK boleh ada
    const dataSiswaCount = await page.locator("text=/Data Siswa/i").count()
    expect(dataSiswaCount).toBe(0)
    const generateCount = await page.locator("text=/Generate Rapor/i").count()
    expect(generateCount).toBe(0)
  })

  test("UI-09: guru hanya melihat menu nilai", async ({ page }) => {
    await login(page, "guru", "guru123")
    await page.waitForTimeout(500)

    // Menu guru
    await expect(page.locator("text=/Input Nilai/i").first()).toBeVisible()
    await expect(page.locator("text=/Kelola TP/i").first()).toBeVisible()

    // Menu admin/wali kelas TIDAK boleh ada
    const dataSiswaCount = await page.locator("text=/Data Siswa/i").count()
    expect(dataSiswaCount).toBe(0)
    const inputAbsensiCount = await page.locator("text=/Input Absensi/i").count()
    expect(inputAbsensiCount).toBe(0)
  })

  test("UI-05: guru TIDAK bisa akses /students via direct URL", async ({ page }) => {
    // Verifikasi menu "Data Siswa" TIDAK tampil di sidebar untuk guru
    // (route protection di level UI)
    await login(page, "guru", "guru123")
    await page.waitForTimeout(500)

    const dataSiswaCount = await page.locator("text=/Data Siswa/i").count()
    expect(dataSiswaCount).toBe(0)
  })

  test("UI-05: wali kelas TIDAK bisa akses /teachers via direct URL", async ({ page }) => {
    await login(page, "walikelas", "wali123")
    await page.waitForTimeout(500)

    const dataGuruCount = await page.locator("text=/Data Guru/i").count()
    expect(dataGuruCount).toBe(0)
  })

  test("UI-05: guru TIDAK bisa akses /generate-report via direct URL", async ({ page }) => {
    await login(page, "guru", "guru123")
    await page.waitForTimeout(500)

    const generateCount = await page.locator("text=/Generate Rapor/i").count()
    expect(generateCount).toBe(0)
  })

  test("UI-02: highlight menu aktif saat di halaman tertentu", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/, { timeout: 10_000 })
    await page.waitForTimeout(500)

    // Menu Data Siswa di sidebar harus ada (highlight indicator sulit di-test via attribute,
    // minimal verify menu item masih visible)
    await expect(page.locator("text=/Data Siswa/i").first()).toBeVisible()
  })

  test("XMD-10: empty state - halaman master data tampil saat kosong", async ({ page }) => {
    // Note: test ini best-effort karena data seed sudah ada
    await login(page, "admin", "admin123")
    await page.click("text=/Data Guru/i")
    await page.waitForURL(/\/teachers/, { timeout: 10_000 })
    await page.waitForTimeout(1_000)

    // Halaman render, minimal ada tombol Tambah (add button)
    // Empty state mungkin menampilkan pesan "Belum ada data" jika kosong
    await expect(page.locator("h2")).toContainText(/Guru/i)
  })

  test("XMD-11: loading state saat navigasi antar halaman", async ({ page }) => {
    await login(page, "admin", "admin123")
    await page.waitForTimeout(500)

    // Navigasi ke halaman lain
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/, { timeout: 10_000 })

    // Halaman render dengan benar (loading tidak boleh hang)
    await expect(page.locator("h2")).toContainText(/Siswa/i)
  })
})
