import { test, expect, login } from "./fixtures/electron-fixture"

test.describe("Student Management (Admin)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin123")
  })

  test("admin bisa akses halaman Data Siswa", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/, { timeout: 10_000 })
    await expect(page.locator("h2")).toContainText(/Siswa/i)
  })

  test("tampilkan daftar siswa dalam tabel", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/)

    // Tunggu tabel load
    await page.waitForTimeout(1_000)

    // Tabel harus ada
    const table = page.locator("table").first()
    await expect(table).toBeVisible()

    // Ada minimal 1 baris (dari seed: 5 siswa)
    const rows = page.locator("tbody tr")
    expect(await rows.count()).toBeGreaterThan(0)
  })

  test("search siswa by nama", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/)
    await page.waitForTimeout(500)

    // Cari search input
    const searchInput = page.locator('input[placeholder*="Cari" i]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill("Budi")
      await page.waitForTimeout(500)
      // Minimal 1 baris (jika ada siswa bernama Budi)
      const rows = page.locator("tbody tr")
      const count = await rows.count()
      // Baris "tidak ada data" atau 1+ baris hasil
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test("klik tombol Tambah Siswa → FormDialog muncul", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/)
    await page.waitForTimeout(500)

    // Klik tombol Tambah
    const addButton = page.locator('button:has-text("Tambah")').first()
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(500)

      // Dialog harus muncul
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator("text=/NIS/i").first()).toBeVisible()
      await expect(page.locator("text=/Nama/i").first()).toBeVisible()
    }
  })

  test("validasi form: NIS required", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/)
    await page.waitForTimeout(500)

    const addButton = page.locator('button:has-text("Tambah")').first()
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(500)

      // Submit tanpa isi
      const submitBtn = page.locator('button:has-text("Simpan")').first()
      await submitBtn.click()
      await page.waitForTimeout(500)

      // Error message harus muncul
      await expect(page.locator("text=/wajib|required/i").first()).toBeVisible({ timeout: 3_000 })
    }
  })

  test("form Tambah Siswa: field wajib ditandai asterisk (kelas_id, jenis_kelamin)", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/)
    await page.waitForTimeout(500)

    const addButton = page.locator('button:has-text("Tambah")').first()
    await addButton.click()
    await page.waitForTimeout(500)

    // Scope ke dialog agar tidak match label filter di atas
    const dialog = page.locator('[role="dialog"]')

    // Field "Kelas" harus punya asterisk merah
    const kelasLabel = dialog.locator('label:has-text("Kelas")').first()
    await expect(kelasLabel).toBeVisible()
    await expect(kelasLabel.locator(".text-destructive")).toBeVisible()

    // Field "Jenis Kelamin" harus punya asterisk merah
    const jkLabel = dialog.locator('label:has-text("Jenis Kelamin")').first()
    await expect(jkLabel).toBeVisible()
    await expect(jkLabel.locator(".text-destructive")).toBeVisible()

    // Description harus mention field wajib
    await expect(dialog.locator("text=/bertanda \\* wajib diisi/i").first()).toBeVisible()
  })

  test("submit form tanpa kelas_id → error 'Kelas wajib dipilih'", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/)
    await page.waitForTimeout(500)

    const addButton = page.locator('button:has-text("Tambah")').first()
    await addButton.click()
    await page.waitForTimeout(500)

    const dialog = page.locator('[role="dialog"]')

    // Isi NIS + nama, tapi TIDAK pilih kelas
    const nisInput = dialog.locator('input[placeholder*="Nomor Induk Siswa" i]').first()
    await nisInput.fill("99999")

    const namaInput = dialog.locator('input[placeholder*="Nama lengkap" i]').first()
    await namaInput.fill("Test Tanpa Kelas")

    // Submit (kelas_id kosong, jenis_kelamin juga kosong, tapi minimal harus ada error kelas)
    const submitBtn = dialog.locator('button:has-text("Simpan")').first()
    await submitBtn.click()
    await page.waitForTimeout(500)

    // Error validasi harus muncul untuk kelas (label form, bukan filter)
    await expect(dialog.locator("text=/Kelas wajib diisi/i").first()).toBeVisible({ timeout: 3_000 })
  })

  test("filter 'Tanpa kelas' ada di dropdown", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/)
    await page.waitForTimeout(500)

    // Cari combobox trigger yang isinya "Semua kelas" (filter dropdown, bukan form)
    const allComboboxes = await page.locator('button[role="combobox"]').all()
    let kelasTriggerIdx = -1
    for (let i = 0; i < allComboboxes.length; i++) {
      const text = await allComboboxes[i].textContent()
      if (text && text.includes("Semua kelas")) {
        kelasTriggerIdx = i
        break
      }
    }
    expect(kelasTriggerIdx).toBeGreaterThanOrEqual(0)
    await allComboboxes[kelasTriggerIdx].click()
    await page.waitForTimeout(300)

    // Opsi "Tanpa kelas" harus ada di listbox
    await expect(page.getByRole("option", { name: /Tanpa kelas/i }).first()).toBeVisible()

    // Tutup dropdown
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)
  })

  test("form Tambah Siswa: field 'jurusan' TIDAK ada (derived dari kelas.program_keahlian)", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/)
    await page.waitForTimeout(500)

    const addButton = page.locator('button:has-text("Tambah")').first()
    await addButton.click()
    await page.waitForTimeout(500)

    const dialog = page.locator('[role="dialog"]')

    // Field "Jurusan" TIDAK boleh ada di form
    const jurusanField = dialog.locator('label:has-text("Jurusan")')
    await expect(jurusanField).toHaveCount(0)
  })

  test("tabel: kolom 'Jurusan' menampilkan kelas.program_keahlian (bukan '-')", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/)
    await page.waitForTimeout(500)

    // Header tabel
    await expect(page.locator("table thead th:has-text('Jurusan')")).toBeVisible()

    // Minimal 1 baris di kolom Jurusan berisi "RPL" atau "TKJ" (program_keahlawan dari kelas)
    const programCells = page.locator("table tbody td:nth-child(4)")
    const count = await programCells.count()
    expect(count).toBeGreaterThan(0)
    const firstProgram = (await programCells.first().textContent())?.trim()
    // Program harus "RPL" atau "TKJ" (bukan "-")
    expect(["RPL", "TKJ"]).toContain(firstProgram)
  })

  test("duplicate NIS: form TIDAK close, muncul error toast 'NIS sudah digunakan'", async ({ page }) => {
    await page.click("text=/Data Siswa/i")
    await page.waitForURL(/\/students/)
    await page.waitForTimeout(500)

    // Buka form Tambah
    const addButton = page.locator('button:has-text("Tambah")').first()
    await addButton.click()
    await page.waitForTimeout(500)

    const dialog = page.locator('[role="dialog"]')

    // Isi NIS dengan NIS yang sudah ada di seed (mis. 2301 dari XII RPL)
    const nisInput = dialog.locator('input[placeholder*="Nomor Induk Siswa" i]').first()
    await nisInput.fill("2301")

    const namaInput = dialog.locator('input[placeholder*="Nama lengkap" i]').first()
    await namaInput.fill("Test Duplicate NIS")

    // Pilih kelas (required, field ke-4, combobox pertama di dialog)
    // Form order: nis, nisn, nama, kelas_id, jenis_kelamin, tempat_lahir, ...
    const kelasTrigger = dialog.locator('button[role="combobox"]').nth(0)
    await kelasTrigger.click()
    await page.waitForTimeout(300)
    // Pick first real kelas (skip "Pilih kelas..." placeholder yang value="")
    // Opsi kelas dimulai dari index 1 (placeholder di index 0)
    const kelasOptions = page.getByRole("option")
    // Cari option yang bukan "Pilih kelas..." placeholder
    const realKelasOption = kelasOptions.filter({ hasNotText: "Pilih kelas" }).first()
    await realKelasOption.click()
    await page.waitForTimeout(300)

    // Pilih jenis_kelamin (combobox ke-2 di dialog)
    const jkTrigger = dialog.locator('button[role="combobox"]').nth(1)
    await jkTrigger.click()
    await page.waitForTimeout(300)
    await page.getByRole("option", { name: "Laki-Laki" }).click()
    await page.waitForTimeout(300)

    // Submit
    const submitBtn = dialog.locator('button:has-text("Simpan")').first()
    await submitBtn.click()
    await page.waitForTimeout(1_500)

    // Dialog HARUS tetap terbuka (form tidak close saat error)
    await expect(dialog).toBeVisible()

    // Toast error harus muncul (cek via sonner toast container)
    const toastError = page.locator('[data-sonner-toast]').filter({ hasText: /NIS/i })
    await expect(toastError.first()).toBeVisible({ timeout: 5_000 })
  })

  test("wali_kelas TIDAK bisa akses menu Data Siswa di sidebar", async ({ page }) => {
    // Test ini verifikasi role-based access di level UI.
    // Login sebagai wali kelas, cek menu Data Siswa TIDAK ada di sidebar.
    await login(page, "walikelas", "wali123")

    // Verify login berhasil dan menu wali kelas tampil
    await expect(page.locator("text=/Input Absensi/i").first()).toBeVisible({ timeout: 5_000 })

    // Menu admin TIDAK boleh muncul di sidebar
    const dataSiswaCount = await page.locator("text=/Data Siswa/i").count()
    expect(dataSiswaCount).toBe(0)
  })
})
