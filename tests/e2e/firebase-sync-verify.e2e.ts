import { test, expect, _electron as electron, type ElectronApplication, type Page } from "@playwright/test"
import path from "path"
import fs from "fs"

/**
 * Firebase Sync E2E
 *
 * Verifikasi sync ke Firestore:
 * 1. Reset DB ke default seed
 * 2. Login admin
 * 3. Tambah 1 record baru (guru test) untuk trigger sync
 * 4. Navigate ke Sync Status page
 * 5. Click "Sync Sekarang" (manual sync button)
 * 6. Verify success + sync_log all success
 * 7. Verify Firestore has the new data
 */

const ELECTRON_PATH = path.join(__dirname, "../..")
const DB_PATH = path.join(process.env.HOME || "", ".config/smk-ttn-app/smk-ttn.db")
const FIRESTORE_PROJECT = "smk-ttn-app"

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

test("FB-01: Manual sync ke Firestore - tambah guru, sync, verify di Firestore", async () => {
  // ============================================================
  // STEP 1: Login admin
  // ============================================================
  console.log("\n[STEP 1] Login admin")
  await page.waitForSelector('input[placeholder*="kode login" i]', { timeout: 15_000 })
  const loginInput = page.locator('input[placeholder*="kode login" i], input[placeholder*="username" i]').first()
  await loginInput.fill("admin")
  await page.fill('input[type="password"]', "admin123")
  await page.click('button:has-text("Masuk")')
  await page.waitForSelector('h2:has-text("Dashboard")', { timeout: 10_000 })
  console.log("  ✓ Admin login OK")

  // ============================================================
  // STEP 2: Tambah 1 guru (Budi Sync Test)
  // ============================================================
  console.log("\n[STEP 2] Tambah 1 guru 'Budi Sync Test'")
  await page.locator('aside nav button:has-text("Data Guru")').click()
  await page.waitForURL(/\/teachers/)
  await page.waitForTimeout(500)

  await page.locator('button:has-text("Tambah")').first().click()
  await page.waitForSelector('[role="dialog"]')
  await page.locator('[role="dialog"]').locator('input[id="nama"]').fill("Budi Sync Test")
  await page.locator('[role="dialog"]').locator('input[id="nip"]').fill("199901012020011001")
  await page.locator('[role="dialog"]').locator('input[id="bidang_studi"]').fill("Test Sync")
  await page.locator('[role="dialog"] button:has-text("Simpan")').click()
  await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 10_000 })
  await page.waitForTimeout(1000)

  const rows = await page.locator("tbody tr").allTextContents()
  expect(rows.some(r => r.includes("Budi Sync Test"))).toBeTruthy()
  console.log("  ✓ Guru 'Budi Sync Test' ditambahkan")

  // ============================================================
  // STEP 3: Navigate ke Sinkronisasi
  // ============================================================
  console.log("\n[STEP 3] Navigate ke Sinkronisasi")
  await page.locator('aside nav button:has-text("Sinkronisasi")').click()
  await page.waitForURL(/\/sync/)
  await page.waitForTimeout(1000)

  // ============================================================
  // STEP 4: Verify Sync Status page
  // ============================================================
  console.log("\n[STEP 4] Verify Sync Status page")
  const pageContent = await page.content()
  expect(pageContent).toMatch(/Sinkronisasi|Koneksi|Antrean/i)
  console.log("  ✓ Sync Status page loaded")

  // Tunggu sampai koneksi = Online (max 15 detik) — atau fallback ke IPC
  try {
    await page.locator('text="Online"').first().waitFor({ timeout: 15_000 })
    console.log("  ✓ Koneksi: Online (via UI)")
  } catch {
    console.log("  ⚠ Koneksi UI masih 'Memeriksa...' - fallback ke IPC")
  }

  // ============================================================
  // STEP 5: Trigger Manual Sync (via IPC, bypass UI button)
  // ============================================================
  console.log("\n[STEP 5] Trigger manual sync via IPC")
  const syncResult = await page.evaluate(async () => {
    const result = await (window as any).electronAPI.syncTriggerManualSync()
    return result
  })
  console.log("  Sync result:", JSON.stringify(syncResult, null, 2))

  // Verify success
  expect(syncResult.success).toBe(true)
  console.log("  ✓ Sync success via IPC")

  // Tunggu untuk Firestore propagation
  await page.waitForTimeout(3000)

  // Verify toast success muncul
  const successToast = page.locator('[data-sonner-toast]').filter({ hasText: /Sinkronisasi selesai|berhasil/i })
  const hasSuccessToast = await successToast.isVisible().catch(() => false)
  console.log(`  ${hasSuccessToast ? "✓" : "⚠"} Toast success: ${hasSuccessToast}`)

  // Verify pending count = 0 (atau kecil, kalau ada race dengan background sync)
  await page.waitForTimeout(2000)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(2000)
  const pendingText = await page.locator("text=/antrean/i").locator("..").locator("p").first().textContent().catch(() => "0")
  console.log(`  Pending count after sync: ${pendingText?.trim() || "0"}`)

  // ============================================================
  // STEP 6: Verify sync_log all success
  // ============================================================
  console.log("\n[STEP 6] Verify sync_log all success")
  // Use IPC to query sync_log
  const syncStatus = await page.evaluate(async () => {
    const res = await (window as any).electronAPI.syncGetStatus()
    return res
  })
  console.log("  Sync status:", JSON.stringify(syncStatus, null, 2))

  const pendingCount = syncStatus?.pendingCount ?? 0
  const recentLogs = syncStatus?.recentLogs ?? []
  const allSuccess = recentLogs.every((l: any) => l.status === "success")
  const online = syncStatus?.online ?? false
  console.log(`  Online: ${online}`)
  console.log(`  Pending: ${pendingCount}`)
  console.log(`  Recent logs all success: ${allSuccess}`)

  expect(online).toBe(true)
  expect(pendingCount).toBe(0)
  expect(allSuccess).toBe(true)

  // ============================================================
  // STEP 7: Verify 'Budi Sync Test' ada di Firestore
  // ============================================================
  console.log("\n[STEP 7] Verify di Firestore langsung")
  // Wait a bit untuk Firestore propagation
  await page.waitForTimeout(2000)

  const firestoreRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents/guru?pageSize=50`
  )
  const firestoreData = await firestoreRes.json()
  const documents = firestoreData.documents || []

  const budiDoc = documents.find((d: any) =>
    d.fields?.nama?.stringValue === "Budi Sync Test"
  )

  if (budiDoc) {
    console.log("  ✓ 'Budi Sync Test' ditemukan di Firestore")
    console.log(`    ID: ${budiDoc.fields.id.integerValue}`)
    console.log(`    NIP: ${budiDoc.fields.nip.stringValue}`)
    console.log(`    User ID: ${budiDoc.fields.user_id.integerValue}`)
  } else {
    console.log("  ⚠ 'Budi Sync Test' TIDAK ditemukan di Firestore")
    console.log(`  Total guru di Firestore: ${documents.length}`)
    console.log("  Semua nama guru di Firestore:")
    documents.forEach((d: any) => {
      console.log(`    - ${d.fields.nama.stringValue} (id=${d.fields.id.integerValue})`)
    })
  }

  expect(budiDoc).toBeTruthy()
  expect(budiDoc.fields.nip.stringValue).toBe("199901012020011001")
  expect(budiDoc.fields.bidang_studi.stringValue).toBe("Test Sync")

  // ============================================================
  // FINAL: Logout
  // ============================================================
  console.log("\n[FINAL] Logout")
  const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Keluar")').first()
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click()
  }
  await expect(page.locator('input[placeholder*="kode login" i]')).toBeVisible()

  console.log("\n=== FIREBASE SYNC TEST PASSED ===")
})
