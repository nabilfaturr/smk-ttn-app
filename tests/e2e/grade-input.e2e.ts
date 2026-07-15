import { test, expect, login, selectOption } from "./fixtures/electron-fixture"

/**
 * GradeInputPage E2E tests.
 *
 * Pre-conditions: `npm run db:fresh:test` (1 guru BIND, 1 mapel BIND,
 * 1 kelas X TEST, 3 siswa, 1 TP, 1 junction).
 *
 * Login as guru/guru123 → /grades/input → pilih BIND + X TEST → input nilai.
 */

async function openGradeInput(page: any): Promise<void> {
  await page.click("text=/Input Nilai/i")
  await page.waitForURL(/\/grades\/input/, { timeout: 10_000 })
  await page.waitForTimeout(1_000)
}

async function navigateAwayAndBack(page: any): Promise<void> {
  // Login state tidak persist setelah page.reload, jadi pakai in-app nav
  // untuk trigger component re-mount + fresh DB load.
  await page.click("text=/Dashboard/i")
  await page.waitForURL(/\/dashboard/, { timeout: 5_000 })
  await page.waitForTimeout(500)
  await openGradeInput(page)
}

async function selectMapelAndKelas(page: any): Promise<void> {
  const mapelTrigger = page.locator('button:has-text("Pilih mapel")').first()
  await mapelTrigger.click({ force: true })
  await page.waitForTimeout(500)
  await page.keyboard.press("Enter")
  await page.waitForTimeout(500)

  const kelasTrigger = page.locator('button:has-text("Pilih kelas")').first()
  await kelasTrigger.click({ force: true })
  await page.waitForTimeout(500)
  await page.keyboard.press("Enter")
  await page.waitForTimeout(1_000)
}

test.describe("Grade Input (Guru) - Functional", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "guru", "guru123")
  })

  test("guru bisa akses halaman Input Nilai", async ({ page }) => {
    await openGradeInput(page)
    await expect(page.locator("h2")).toContainText(/Nilai/i)
  })

  test("dropdown mapel dan kelas tampil", async ({ page }) => {
    await openGradeInput(page)
    await expect(page.locator('button:has-text("Pilih mapel")')).toBeVisible()
    await expect(page.locator('button:has-text("Pilih kelas")')).toBeVisible()
  })

  test("GRD-101: save nilai → navigate away+back → data masih ada", async ({ page }) => {
    await openGradeInput(page)
    await selectMapelAndKelas(page)

    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(3, { timeout: 5_000 })

    // Input nilai untuk siswa pertama (Andi)
    const formatifInput = rows.nth(0).locator('input[type="number"]').nth(0)
    const sumatifInput = rows.nth(0).locator('input[type="number"]').nth(1)
    await formatifInput.fill("85")
    await sumatifInput.fill("90")
    await page.waitForTimeout(500)

    // Klik Simpan
    await page.click('button:has-text("Simpan")')
    await page.waitForTimeout(2_000)

    // Navigate away lalu balik (trigger fresh DB load)
    await navigateAwayAndBack(page)
    await selectMapelAndKelas(page)

    // Verify nilai masih ada
    const rowsAfter = page.locator("tbody tr")
    await expect(rowsAfter).toHaveCount(3, { timeout: 5_000 })
    const formatifAfter = rowsAfter.nth(0).locator('input[type="number"]').nth(0)
    const sumatifAfter = rowsAfter.nth(0).locator('input[type="number"]').nth(1)
    await expect(formatifAfter).toHaveValue("85")
    await expect(sumatifAfter).toHaveValue("90")
  })

  test("GRD-102: bobot formatif:sumatif = 40:60 (input 80/90 → rapor=86)", async ({ page }) => {
    await openGradeInput(page)
    await selectMapelAndKelas(page)

    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(3, { timeout: 5_000 })

    // Input 80/90 untuk siswa kedua (Budi)
    const formatifInput = rows.nth(1).locator('input[type="number"]').nth(0)
    const sumatifInput = rows.nth(1).locator('input[type="number"]').nth(1)
    await formatifInput.fill("80")
    await sumatifInput.fill("90")
    await page.waitForTimeout(500)

    // Rapor cell = column ke-5 (0=No, 1=Nama, 2=Formatif, 3=Sumatif, 4=Rapor)
    const raporCell = rows.nth(1).locator("td").nth(4)
    await expect(raporCell).toHaveText("86")
  })

  test("GRD-103: capaian TP T/R toggle (klik T → T, klik T lagi → cleared)", async ({ page }) => {
    await openGradeInput(page)
    await selectMapelAndKelas(page)

    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(3, { timeout: 5_000 })

    // Ambil data-testid tombol T untuk siswa pertama
    const tpTButton = page.locator('[data-testid^="tp-t-"]').first()
    const tpRButton = page.locator('[data-testid^="tp-r-"]').first()

    // Awalnya tidak ada yang aktif (kelas background)
    await expect(tpTButton).not.toHaveClass(/bg-green-600/)
    await expect(tpRButton).not.toHaveClass(/bg-red-600/)

    // Klik T → T aktif (bg-green-600)
    await tpTButton.click()
    await page.waitForTimeout(200)
    await expect(tpTButton).toHaveClass(/bg-green-600/)

    // Klik R → R aktif, T non-aktif
    await tpRButton.click()
    await page.waitForTimeout(200)
    await expect(tpRButton).toHaveClass(/bg-red-600/)
    await expect(tpTButton).not.toHaveClass(/bg-green-600/)

    // Klik R lagi → cleared
    await tpRButton.click()
    await page.waitForTimeout(200)
    await expect(tpRButton).not.toHaveClass(/bg-red-600/)
  })

  test("GRD-104: overwrite (save 2x dengan nilai beda → updated, no duplicate)", async ({ page }) => {
    await openGradeInput(page)
    await selectMapelAndKelas(page)

    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(3, { timeout: 5_000 })

    // Save pertama: siswa ketiga (Citra) formatif=70, sumatif=75
    const formatifInput = rows.nth(2).locator('input[type="number"]').nth(0)
    const sumatifInput = rows.nth(2).locator('input[type="number"]').nth(1)
    await formatifInput.fill("70")
    await sumatifInput.fill("75")
    await page.waitForTimeout(300)
    await page.click('button:has-text("Simpan")')
    await page.waitForTimeout(2_000)

    // Save kedua: nilai beda
    await formatifInput.fill("80")
    await sumatifInput.fill("85")
    await page.waitForTimeout(300)
    await page.click('button:has-text("Simpan")')
    await page.waitForTimeout(2_000)

    // Verify nilai update (rapor = 80*0.4 + 85*0.6 = 32 + 51 = 83)
    const raporCell = rows.nth(2).locator("td").nth(4)
    await expect(raporCell).toHaveText("83")

    // Navigate away+back, verify tidak ada duplicate (jumlah baris tetap 3)
    await navigateAwayAndBack(page)
    await selectMapelAndKelas(page)
    await expect(page.locator("tbody tr")).toHaveCount(3, { timeout: 5_000 })
  })

  test("GRD-105: input nilai < 0 atau > 100 → HTML5 validation (min/max=0/100)", async ({ page }) => {
    await openGradeInput(page)
    await selectMapelAndKelas(page)

    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(3, { timeout: 5_000 })

    // Verify min/max attribute ada di input
    const formatifInput = rows.nth(0).locator('input[type="number"]').nth(0)
    await expect(formatifInput).toHaveAttribute("min", "0")
    await expect(formatifInput).toHaveAttribute("max", "100")
  })

  test("GRD-106: bulk save 3 siswa sekaligus → semua persist", async ({ page }) => {
    await openGradeInput(page)
    await selectMapelAndKelas(page)

    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(3, { timeout: 5_000 })

    // Input nilai untuk semua 3 siswa
    const values = [
      { formatif: "75", sumatif: "80" },
      { formatif: "82", sumatif: "88" },
      { formatif: "90", sumatif: "95" },
    ]
    for (let i = 0; i < 3; i++) {
      const formatifInput = rows.nth(i).locator('input[type="number"]').nth(0)
      const sumatifInput = rows.nth(i).locator('input[type="number"]').nth(1)
      await formatifInput.fill(values[i].formatif)
      await sumatifInput.fill(values[i].sumatif)
    }
    await page.waitForTimeout(500)

    // Save sekali (handleSave loop per row internally)
    await page.click('button:has-text("Simpan")')
    await page.waitForTimeout(3_000)

    // Navigate away+back, verify semua 3 siswa punya nilai
    await navigateAwayAndBack(page)
    await selectMapelAndKelas(page)
    await expect(page.locator("tbody tr")).toHaveCount(3, { timeout: 5_000 })

    for (let i = 0; i < 3; i++) {
      const formatifInput = page.locator("tbody tr").nth(i).locator('input[type="number"]').nth(0)
      const sumatifInput = page.locator("tbody tr").nth(i).locator('input[type="number"]').nth(1)
      await expect(formatifInput).toHaveValue(values[i].formatif)
      await expect(sumatifInput).toHaveValue(values[i].sumatif)
    }
  })
})
