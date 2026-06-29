import { test, expect, login } from "./fixtures/electron-fixture"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

/**
 * E2E test khusus untuk generate sample rapor Kurikulum Merdeka
 * dan simpan ke /tmp untuk di-compare dengan sample docx.
 *
 * Usage: npx playwright test tests/e2e/generate-rapor-kurmer.e2e.ts
 */
test("Generate sample rapor Kurmer untuk visual comparison", async ({ page }) => {
  await login(page, "admin", "admin123")

  // Navigate to Generate Rapor
  await page.click("text=/Generate Rapor/i")
  await page.waitForURL(/\/generate-report/, { timeout: 10_000 })

  // Wait for kelas dropdown to populate
  await page.waitForTimeout(1_500)

  // Select kelas XII RPL
  await page.click('button:has-text("Pilih kelas")')
  await page.waitForTimeout(500)
  await page.click('[role="option"]:has-text("XII RPL")')
  await page.waitForTimeout(500)

  // Wait for completeness check, then click Generate
  await page.waitForSelector('button:has-text("Generate Rapor Akademik")', { timeout: 10_000 })
  await page.click('button:has-text("Generate Rapor Akademik")')

  // Wait for generation to complete (file list muncul)
  await page.waitForSelector("text=/Rapor_Akademik_/", { timeout: 30_000 })

  // Extract file paths from the page
  const fileLinks = await page.locator("text=/Rapor_Akademik_/").allTextContents()
  console.log("Files generated:", fileLinks.slice(0, 5))

  // Get the first file path (it's displayed in the <p> element)
  // Actually the displayed text is just the filename, not full path
  // We need to read the file from the default rapor directory
  const raporDir = path.join(os.homedir(), ".config", "smk-ttn-app", "Rapor")

  // Wait a bit for files to be written
  await page.waitForTimeout(2_000)

  if (!fs.existsSync(raporDir)) {
    throw new Error(`Rapor directory not found: ${raporDir}`)
  }

  const files = fs.readdirSync(raporDir).filter((f) => f.startsWith("Rapor_Akademik_"))
  console.log(`Found ${files.length} files in ${raporDir}`)

  if (files.length === 0) {
    throw new Error("No rapor files found")
  }

  // Copy first file to /tmp/rapor-kurmer-sample.pdf
  const firstFile = files[0]!
  const src = path.join(raporDir, firstFile)
  const dest = "/tmp/rapor-kurmer-sample.pdf"
  fs.copyFileSync(src, dest)
  console.log(`✅ Copied ${firstFile} → ${dest}`)

  // Also list all files for reference
  console.log("\nAll files in rapor dir:")
  for (const f of files.slice(0, 10)) {
    console.log(`  - ${f}`)
  }
})
