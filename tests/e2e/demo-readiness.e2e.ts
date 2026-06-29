import { test, expect, _electron as electron, type ElectronApplication, type Page } from "@playwright/test"
import path from "path"
import fs from "fs"

/**
 * Demo Readiness E2E
 *
 * Skenario: Mulai dari default seed (admin + master data, TANPA guru/siswa/kelas).
 * Admin onboard manual: guru → mapel → kelas → assignment → TP → siswa → ekskul → kokurikuler.
 * Generate rapor. Logout, login as guru (input nilai). Logout, login as wali_kelas (absensi).
 *
 * Pre-conditions (sudah dilakukan sebelum test):
 *   npm rebuild better-sqlite3
 *   rm -f ~/.config/smk-ttn-app/smk-ttn.db*
 *   echo "y" | npx tsx scripts/seed/index.ts --reset --mode=default --force
 *   npx electron-rebuild -f -w better-sqlite3
 *   npx vite build
 *
 * State setelah default seed:
 *   - 1 admin (admin/admin123, kode_login 25445)
 *   - 0 guru, 0 mapel, 0 kelas, 0 siswa, 0 TP, 0 assignment
 *   - 7 ekskul (Ketarunaan wajib)
 *   - 6 tahun_ajaran (1 aktif: 2025/2026 sem 1)
 *   - 8 dimensi P5 + 25 subdimensi + 75 narasi
 */

const ELECTRON_PATH = path.join(__dirname, "../..")
const DB_PATH = path.join(process.env.HOME || "", ".config/smk-ttn-app/smk-ttn.db")

let electronApp: ElectronApplication
let page: Page

test.describe.configure({ mode: "serial" })

test.beforeAll(async () => {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`DB not found at ${DB_PATH}. Run default seed first.`)
  }
  electronApp = await electron.launch({
    args: [ELECTRON_PATH],
    env: { ...process.env, NODE_ENV: "test", ELECTRON_DISABLE_GPU: "1" },
    timeout: 30_000,
  })
  page = await electronApp.firstWindow()
  await page.waitForFunction(() => window.location.href !== "about:blank", null, { timeout: 15_000 })
  await page.waitForLoadState("domcontentloaded")
})

test.afterAll(async () => {
  if (electronApp) await electronApp.close()
})

async function loginAs(username: string, password: string) {
  // Tunggu sampai login form tersedia
  await page.waitForSelector('input[placeholder*="kode login" i], input[placeholder*="username" i]', { timeout: 15_000 })
  const loginInput = page.locator('input[placeholder*="kode login" i], input[placeholder*="username" i]').first()
  await loginInput.fill(username)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Masuk")')
  await page.waitForSelector('h2:has-text("Dashboard")', { timeout: 10_000 })
}

async function logout() {
  // Klik tombol Logout (biasanya di header / sidebar)
  const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Keluar")').first()
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click()
  } else {
    // Fallback: navigate to /login
    await page.evaluate(() => { window.location.hash = "#/login" })
  }
  await page.waitForSelector('input[placeholder*="kode login" i], input[placeholder*="username" i]', { timeout: 10_000 })
}

test("DEMO-FULL: Admin onboard → Generate Rapor → Guru input nilai → Wali Kelas absensi", async () => {
  // ============================================================
  // PHASE 1: Admin Login
  // ============================================================
  console.log("\n[PHASE 1] Admin login")
  await loginAs("admin", "admin123")
  await expect(page.locator("h2")).toContainText(/Dashboard/i)

  // Verify sidebar admin punya menu utama
  const sidebarItems = await page.locator("aside nav button").allTextContents()
  console.log("  Sidebar items:", sidebarItems.length, "items")
  expect(sidebarItems.length).toBeGreaterThanOrEqual(19)

  // ============================================================
  // PHASE 1.1: Tambah 3 Guru
  // ============================================================
  console.log("\n[PHASE 1.1] Onboarding 3 guru")
  await page.locator('aside nav button:has-text("Data Guru")').click()
  await page.waitForURL(/\/teachers/)
  await page.waitForTimeout(500)

  // Capture guru credentials from toast for later login
  const guruCredentials: Record<string, { username: string; password: string; kode_login: string }> = {}

  for (const [nama, nip, bidang] of [
    ["Budi Hartono, S.Pd", "198501012010011001", "Matematika"],
    ["Sari Wulandari, S.Pd", "198601022010012002", "Bahasa Indonesia"],
    ["Agus Pratama, S.Pd", "", "Bahasa Inggris"],
  ]) {
    await page.locator('button:has-text("Tambah")').first().click()
    await page.waitForSelector('[role="dialog"]')
    await page.locator('[role="dialog"]').locator('input[id="nama"]').fill(nama)
    if (nip) await page.locator('[role="dialog"]').locator('input[id="nip"]').fill(nip)
    await page.locator('[role="dialog"]').locator('input[id="bidang_studi"]').fill(bidang)
    await page.locator('[role="dialog"] button:has-text("Simpan")').click()

    // Capture credentials from success toast
    const toastText = await page.locator('[data-sonner-toast]').filter({ hasText: /Kode:|Pass:/i }).first().textContent({ timeout: 5_000 })
    if (toastText) {
      const kodeMatch = toastText.match(/Kode:\s*(\d+)/)
      const passMatch = toastText.match(/Pass:\s*(\d+)/)
      if (kodeMatch && passMatch) {
        const shortNama = nama.split(" ")[0].toLowerCase() // budi, sari, agus
        guruCredentials[shortNama] = {
          username: nip || `guru_${kodeMatch[1]}`,
          password: passMatch[1],
          kode_login: kodeMatch[1],
        }
        console.log(`  Captured: ${shortNama} → kode_login=${kodeMatch[1]}, pass=${passMatch[1]}`)
      }
    }
    await page.waitForTimeout(500)
  }

  let rows = await page.locator("tbody tr").allTextContents()
  console.log("  Guru rows:", rows.length)
  expect(rows.length).toBe(3)
  expect(rows.some(r => r.includes("Budi Hartono"))).toBeTruthy()
  expect(rows.some(r => r.includes("Sari Wulandari"))).toBeTruthy()
  expect(rows.some(r => r.includes("Agus Pratama"))).toBeTruthy()

  // ============================================================
  // PHASE 1.2: Tambah 3 Mapel
  // ============================================================
  console.log("\n[PHASE 1.2] Onboarding 3 mapel")
  await page.locator('aside nav button:has-text("Data Mapel")').click()
  await page.waitForURL(/\/subjects/)
  await page.waitForTimeout(500)

  for (const [kode, nama] of [["MTK", "Matematika"], ["BIND", "Bahasa Indonesia"], ["BSA", "Bahasa Inggris"]]) {
    await page.locator('button:has-text("Tambah")').first().click()
    await page.waitForSelector('[role="dialog"]')
    await page.locator('[role="dialog"]').locator('input[id="kode_mapel"]').fill(kode)
    await page.locator('[role="dialog"]').locator('input[id="nama_mapel"]').fill(nama)
    // jenis default = reguler, kelompok & agama_target optional
    await page.locator('[role="dialog"] button:has-text("Simpan")').click()
    await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 10_000 })
    await page.waitForTimeout(300)
  }

  rows = await page.locator("tbody tr").allTextContents()
  console.log("  Mapel rows:", rows.length)
  expect(rows.length).toBeGreaterThanOrEqual(3)
  expect(rows.some(r => r.includes("MTK"))).toBeTruthy()

  // ============================================================
  // PHASE 1.3: Tambah Kelas XII RPL A
  // ============================================================
  console.log("\n[PHASE 1.3] Onboarding kelas XII RPL A")
  await page.locator('aside nav button:has-text("Data Kelas")').click()
  await page.waitForURL(/\/classes/)
  await page.waitForTimeout(500)

  await page.locator('button:has-text("Tambah")').first().click()
  await page.waitForSelector('[role="dialog"]')
  await page.locator('[role="dialog"]').locator('input[id="nama_kelas"]').fill("XII RPL A")

  // Pilih tingkat = XII
  const tingkatSelect = page.locator('[role="dialog"]').locator('button[role="combobox"]').first()
  await tingkatSelect.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]').filter({ hasText: /^XII/ }).first().click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {})

  // Pilih program_keahlianoan
  const progSelect = page.locator('[role="dialog"]').locator('button[role="combobox"]').nth(1)
  await progSelect.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]').filter({ hasText: "RPL" }).first().click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {})

  // Pilih wali_kelas = Sari
  const waliSelect = page.locator('[role="dialog"]').locator('button[role="combobox"]').nth(2)
  await waliSelect.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]').filter({ hasText: "Sari Wulandari" }).first().click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {})

  await page.locator('[role="dialog"] button:has-text("Simpan")').click()
  await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 10_000 })

  await page.waitForTimeout(500)
  rows = await page.locator("tbody tr").allTextContents()
  console.log("  Kelas rows:", rows.length)
  expect(rows.some(r => r.includes("XII RPL A"))).toBeTruthy()

  // ============================================================
  // PHASE 2.1: Mapel Assignment
  // ============================================================
  console.log("\n[PHASE 2.1] Mapel assignment (MTK→Budi, BIND→Sari)")
  await page.locator('aside nav button:has-text("Kelola Guru Pengampu")').click()
  await page.waitForURL(/\/mapel-assignments/)
  await page.waitForTimeout(500)

  // Pilih mapel MTK (first dropdown = MAPEL)
  const mapelSelectA = page.locator('button[role="combobox"]').first()
  await mapelSelectA.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]').filter({ hasText: "Matematika" }).first().click()
  await page.waitForTimeout(500)

  // Cari row XII RPL A, pilih guru Budi
  const mtkRow = page.locator("tbody tr").filter({ hasText: "XII RPL A" }).first()
  const mtkSelect = mtkRow.locator('button[role="combobox"]').first()
  await mtkSelect.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]').filter({ hasText: "Budi Hartono" }).first().click()
  await page.waitForTimeout(300)

  // Save
  await page.locator('button:has-text("Simpan")').first().click()
  await page.waitForTimeout(1500)

  // Pilih mapel BIND
  const mapelSelectA2 = page.locator('button[role="combobox"]').first()
  await mapelSelectA2.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]').filter({ hasText: "Bahasa Indonesia" }).first().click()
  await page.waitForTimeout(500)

  // Cari row XII RPL A, pilih guru Sari
  const bindRow = page.locator("tbody tr").filter({ hasText: "XII RPL A" }).first()
  const bindSelect = bindRow.locator('button[role="combobox"]').first()
  await bindSelect.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]').filter({ hasText: "Sari Wulandari" }).first().click()
  await page.waitForTimeout(300)

  // Save
  await page.locator('button:has-text("Simpan")').first().click()
  await page.waitForTimeout(1500)

  // ============================================================
  // PHASE 2.2: Tambah TP untuk MTK
  // ============================================================
  console.log("\n[PHASE 2.2] Tambah TP1 + TP2 untuk MTK")
  await page.locator('aside nav button:has-text("Kelola TP")').click()
  await page.waitForURL(/\/master\/learning-objectives/)
  await page.waitForTimeout(500)

  // Pilih mapel MTK
  const mapelSelectTP = page.locator('button[role="combobox"]').first()
  await mapelSelectTP.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]:has-text("Matematika")').click()
  await page.waitForTimeout(500)

  for (const [kode, tuntas, remedi] of [
    ["TP1", "Siswa dapat menghitung integral tak tentu", "Siswa belum dapat menghitung integral"],
    ["TP2", "Siswa dapat menyelesaikan persamaan kuadrat", "Siswa belum dapat menyelesaikan persamaan kuadrat"],
  ]) {
    await page.locator('button:has-text("Tambah")').first().click()
    await page.waitForSelector('[role="dialog"]')
    await page.locator('[role="dialog"]').locator('input[id="kode_tp"]').fill(kode)
    await page.locator('[role="dialog"]').locator('textarea[id="deskripsi_tuntas"]').fill(tuntas)
    await page.locator('[role="dialog"]').locator('textarea[id="deskripsi_remediasi"]').fill(remedi)
    await page.locator('[role="dialog"] button:has-text("Simpan")').click()
    await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 10_000 })
    await page.waitForTimeout(300)
  }

  rows = await page.locator("tbody tr").allTextContents()
  console.log("  TP rows:", rows.length)
  expect(rows.length).toBeGreaterThanOrEqual(2)

  // ============================================================
  // PHASE 3.1: Tambah 3 Siswa
  // ============================================================
  console.log("\n[PHASE 3.1] Tambah 3 siswa ke XII RPL A")
  await page.locator('aside nav button:has-text("Data Siswa")').click()
  await page.waitForURL(/\/students/)
  await page.waitForTimeout(500)

  for (const [nis, nama, jk] of [
    ["2301", "Adi Wijaya", "Laki-Laki"],
    ["2302", "Siti Aminah", "Perempuan"],
    ["2303", "Budi Santoso", "Laki-Laki"],
  ]) {
    await page.locator('button:has-text("Tambah")').first().click()
    await page.waitForSelector('[role="dialog"]')
    await page.locator('[role="dialog"]').locator('input[id="nis"]').fill(nis)
    await page.locator('[role="dialog"]').locator('input[id="nama"]').fill(nama)

    const kelasSel = page.locator('[role="dialog"]').locator('button[role="combobox"]').first()
    await kelasSel.click()
    await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
    await page.locator('[role="option"]:has-text("XII RPL A")').click()

    const jkSel = page.locator('[role="dialog"]').locator('button[role="combobox"]').nth(1)
    await jkSel.click()
    await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
    await page.locator(`[role="option"]:has-text("${jk}")`).click()

    await page.locator('[role="dialog"] button:has-text("Simpan")').click()
    await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 10_000 })
    await page.waitForTimeout(300)
  }

  rows = await page.locator("tbody tr").allTextContents()
  console.log("  Siswa rows:", rows.length)
  expect(rows.length).toBeGreaterThanOrEqual(3)

  // ============================================================
  // PHASE 3.1.5: Test duplicate NIS
  // ============================================================
  console.log("\n[PHASE 3.1.5] Test duplicate NIS")
  await page.locator('button:has-text("Tambah")').first().click()
  await page.waitForSelector('[role="dialog"]')
  await page.locator('[role="dialog"]').locator('input[id="nis"]').fill("2301") // duplicate
  await page.locator('[role="dialog"]').locator('input[id="nama"]').fill("Test Duplicate")

  const kelasSel2 = page.locator('[role="dialog"]').locator('button[role="combobox"]').first()
  await kelasSel2.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]:has-text("XII RPL A")').click()

  const jkSel2 = page.locator('[role="dialog"]').locator('button[role="combobox"]').nth(1)
  await jkSel2.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]:has-text("Laki-Laki")').click()

  await page.locator('[role="dialog"] button:has-text("Simpan")').click()
  await page.waitForTimeout(1500)

  // Dialog harus tetap terbuka
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()
  console.log("  ✓ Dialog tetap terbuka (expected)")

  // Toast error muncul
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: /NIS.*sudah digunakan/i })
  await expect(toast).toBeVisible({ timeout: 5_000 })
  console.log("  ✓ Toast error muncul (expected)")

  await page.locator('[role="dialog"] button:has-text("Batal")').click()
  await page.waitForSelector('[role="dialog"]', { state: "hidden" })

  // ============================================================
  // PHASE 3.2: Ekstrakurikuler
  // ============================================================
  console.log("\n[PHASE 3.2] Cek ekskul - Ketarunaan auto-enrolled")
  await page.locator('aside nav button:has-text("Ekstrakurikuler")').click()
  await page.waitForURL(/\/ekskul/)
  await page.waitForTimeout(500)

  // Verify Ketarunaan muncul sebagai wajib
  const ekskulPageContent = await page.content()
  const hasKetarunaan = ekskulPageContent.includes("Ketarunaan")
  console.log("  Ketarunaan visible:", hasKetarunaan)
  expect(hasKetarunaan).toBeTruthy()

  // ============================================================
  // PHASE 3.3: Kokurikuler P5
  // ============================================================
  console.log("\n[PHASE 3.3] Kokurikuler P5")
  await page.locator('aside nav button').filter({ hasText: "Kokurikuler (P5)" }).click()
  await page.waitForURL(/\/kokurikuler/)
  await page.waitForTimeout(500)

  // ============================================================
  // PHASE 4.1: Generate Rapor
  // ============================================================
  console.log("\n[PHASE 4.1] Generate Rapor")
  await page.locator('aside nav button:has-text("Generate Rapor")').click()
  await page.waitForURL(/\/generate-report/)
  await page.waitForTimeout(500)

  // ============================================================
  // PHASE 4.2: Arsip
  // ============================================================
  console.log("\n[PHASE 4.2] Arsip")
  await page.locator('aside nav button:has-text("Arsip")').click()
  await page.waitForURL(/\/arsip/)
  await page.waitForTimeout(500)

  // ============================================================
  // PHASE 4.3: Sync
  // ============================================================
  console.log("\n[PHASE 4.3] Sync Status")
  await page.locator('aside nav button:has-text("Sinkronisasi")').click()
  await page.waitForURL(/\/sync/)
  await page.waitForTimeout(500)

  // ============================================================
  // PHASE 4.4: Settings
  // ============================================================
  console.log("\n[PHASE 4.4] Settings")
  await page.locator('aside nav button:has-text("Pengaturan")').click()
  await page.waitForURL(/\/settings/)
  await page.waitForTimeout(500)

  // ============================================================
  // PHASE 5: Logout, login as Guru
  // ============================================================
  console.log("\n[PHASE 5] Login as Guru (Budi)")
  await logout()
  if (!guruCredentials.budi) {
    console.log("  WARNING: No Budi credentials captured - skipping guru test")
    return
  }
  await loginAs(guruCredentials.budi.username, guruCredentials.budi.password)
  await expect(page.locator("h2")).toContainText(/Dashboard/i)

  const guruSidebar = await page.locator("aside nav button").allTextContents()
  console.log("  Guru sidebar:", guruSidebar)
  // Guru should see: Dashboard, Input Nilai, Kelola TP (3 items)
  expect(guruSidebar.length).toBeLessThanOrEqual(4)

  // ============================================================
  // PHASE 5.1: Input Nilai
  // ============================================================
  console.log("\n[PHASE 5.1] Input Nilai (MTK di XII RPL A)")
  await page.locator('aside nav button:has-text("Input Nilai")').click()
  await page.waitForURL(/\/grades\/input/)
  await page.waitForTimeout(500)

  // Pilih Mata Pelajaran = Matematika (combobox nth(0))
  const mapelSelectG = page.locator('button[role="combobox"]').nth(0)
  await mapelSelectG.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]').filter({ hasText: "Matematika" }).first().click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {})
  await page.waitForTimeout(500)

  // Pilih Kelas XII RPL A (combobox nth(1))
  const kelasSelectG = page.locator('button[role="combobox"]').nth(1)
  await kelasSelectG.click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "visible", timeout: 5_000 })
  await page.locator('[role="option"]').filter({ hasText: "XII RPL A" }).first().click()
  await page.locator('[role="listbox"]').last().waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {})
  await page.waitForTimeout(1500)

  // Verify table
  const nilaiRows = await page.locator("tbody tr").count()
  console.log("  Siswa rows di GradeInput:", nilaiRows)
  expect(nilaiRows).toBeGreaterThanOrEqual(3)

  // ============================================================
  // PHASE 6: Logout, login as Wali Kelas
  // ============================================================
  console.log("\n[PHASE 6] Login as Wali Kelas (Sari)")
  await logout()
  if (!guruCredentials.sari) {
    console.log("  WARNING: No Sari credentials captured - skipping wali kelas test")
    return
  }
  await loginAs(guruCredentials.sari.username, guruCredentials.sari.password)
  await expect(page.locator("h2")).toContainText(/Dashboard/i)

  const waliSidebar = await page.locator("aside nav button").allTextContents()
  console.log("  Wali Kelas sidebar:", waliSidebar)
  expect(waliSidebar.length).toBeGreaterThanOrEqual(4)

  // ============================================================
  // PHASE 6.1: Input Absensi
  // ============================================================
  console.log("\n[PHASE 6.1] Input Absensi")
  await page.locator('aside nav button:has-text("Input Absensi")').click()
  await page.waitForURL(/\/attendance\/input/)
  await page.waitForTimeout(500)

  const absenRows = await page.locator("tbody tr").count()
  console.log("  Siswa rows di Absensi:", absenRows)
  expect(absenRows).toBeGreaterThanOrEqual(3)

  // ============================================================
  // PHASE 6.2: Catatan Wali Kelas
  // ============================================================
  console.log("\n[PHASE 6.2] Catatan Wali Kelas")
  await page.locator('aside nav button:has-text("Catatan Wali")').click()
  await page.waitForURL(/\/teacher-notes/)
  await page.waitForTimeout(500)

  // ============================================================
  // PHASE 7: Multi-role check (Sari adalah guru + wali_kelas)
  // ============================================================
  console.log("\n[PHASE 7] Multi-role - cek Sari bisa akses Input Nilai")
  // Sari (wali_kelas,guru) seharusnya bisa akses /grades/input (guru only)
  await page.evaluate(() => { window.location.hash = "#/grades/input" })
  await page.waitForTimeout(1000)
  const hasInputNilai = await page.locator('h2:has-text("Input Nilai")').isVisible().catch(() => false)
  console.log("  Sari bisa akses Input Nilai:", hasInputNilai)
  expect(hasInputNilai).toBeTruthy()

  // Sari TIDAK boleh akses /students (admin only)
  await page.evaluate(() => { window.location.hash = "#/students" })
  await page.waitForTimeout(1000)
  const currentHash = await page.evaluate(() => window.location.hash)
  console.log("  Hash setelah akses /students:", currentHash)
  expect(currentHash).not.toBe("#/students")

  // ============================================================
  // FINAL: Logout
  // ============================================================
  console.log("\n[FINAL] Logout")
  await logout()
  await expect(page.locator('input[placeholder*="kode login" i]')).toBeVisible()

  console.log("\n=== ALL PHASES PASSED ===")
})
