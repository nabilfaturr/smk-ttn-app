import { test, expect, login } from "./fixtures/electron-fixture"
import path from "path"
import fs from "fs"
import { execSync } from "child_process"

test.describe("Rapor Prakerin DOCX - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin", "admin123")
  })

  test("PRK-DOCX-01: navigate ke /generate-report dan pilih Rapor Prakerin", async ({ page }) => {
    await page.click("text=/Generate Rapor/i")
    await page.waitForURL(/\/generate-report/, { timeout: 10_000 })
    await expect(page.locator("h2")).toContainText(/Generate Rapor/i)
  })

  test("PRK-DOCX-02: pilih kelas XII TKJ A → completeness card muncul", async ({ page }) => {
    await page.click("text=/Generate Rapor/i")
    await page.waitForURL(/\/generate-report/)
    await page.waitForTimeout(1_000)

    await page.locator('button:has-text("Rapor Akademik"), button:has-text("Pilih jenis")').first().click()
    await page.waitForTimeout(500)
    await page.click('[role="option"]:has-text("Rapor Prakerin")')
    await page.waitForTimeout(500)

    await page.locator('button:has-text("Pilih kelas")').first().click()
    await page.waitForTimeout(500)
    await page.click('[role="option"]:has-text("XII TKJ A")')
    await page.waitForTimeout(2_000)

    await expect(page.locator("text=/Status Kelengkapan Data/i")).toBeVisible({ timeout: 10_000 })
    await expect(page.locator("text=/Lengkap/i").first()).toBeVisible({ timeout: 5_000 })
  })

  test("PRK-DOCX-03: generate batch rapor prakerin → file DOCX valid di folder Rapor", async ({ page }) => {
    const raporDir = path.join(
      process.env.HOME || "",
      ".config/smk-ttn-app/Rapor"
    )

    if (fs.existsSync(raporDir)) {
      const existing = fs.readdirSync(raporDir).filter(f => f.startsWith("Rapor_Prakerin_") && f.endsWith(".docx"))
      existing.forEach(f => fs.unlinkSync(path.join(raporDir, f)))
    } else {
      fs.mkdirSync(raporDir, { recursive: true })
    }

    await page.click("text=/Generate Rapor/i")
    await page.waitForURL(/\/generate-report/)
    await page.waitForTimeout(1_000)

    await page.locator('button:has-text("Rapor Akademik"), button:has-text("Pilih jenis")').first().click()
    await page.waitForTimeout(500)
    await page.click('[role="option"]:has-text("Rapor Prakerin")')
    await page.waitForTimeout(500)

    await page.locator('button:has-text("Pilih kelas")').first().click()
    await page.waitForTimeout(500)
    await page.click('[role="option"]:has-text("XII TKJ A")')
    await page.waitForTimeout(2_000)

    const generateBtn = page.locator('button:has-text("Generate Rapor Prakerin")')
    await expect(generateBtn).toBeVisible({ timeout: 5_000 })
    await generateBtn.click()

    await expect(page.locator("text=/berhasil di-generate/i")).toBeVisible({ timeout: 60_000 })

    await page.waitForTimeout(2_000)
    const files = fs.readdirSync(raporDir).filter(f => f.startsWith("Rapor_Prakerin_") && f.endsWith(".docx"))
    expect(files.length).toBeGreaterThan(0)

    // Verify file size > 100KB (template ~ 600KB)
    const sampleFile = path.join(raporDir, files[0])
    const stat = fs.statSync(sampleFile)
    expect(stat.size).toBeGreaterThan(100_000)

    // Verify ZIP/DOCX magic bytes
    const buffer = fs.readFileSync(sampleFile, { encoding: null })
    expect(buffer[0]).toBe(0x50) // 'P'
    expect(buffer[1]).toBe(0x4b) // 'K'

    // Verify content via unzip + grep
    const tmpDir = "/tmp/verify-docx-" + Date.now()
    fs.mkdirSync(tmpDir, { recursive: true })
    try {
      execSync(`unzip -q -o "${sampleFile}" -d "${tmpDir}"`)
      const docXml = fs.readFileSync(path.join(tmpDir, "word/document.xml"), "utf-8")

      // Should NOT have any unrendered {key} placeholders
      const placeholders = docXml.match(/\{[A-Za-z0-9_]+\}/g) || []
      expect(placeholders.length).toBe(0)

      // Should NOT have Word MERGEFIELD instrText
      expect(docXml).not.toContain("MERGEFIELD")

      // Should have actual student data
      expect(docXml.length).toBeGreaterThan(10_000)
    } finally {
      execSync(`rm -rf "${tmpDir}"`)
    }
  })
})
