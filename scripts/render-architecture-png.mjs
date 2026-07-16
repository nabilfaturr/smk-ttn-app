#!/usr/bin/env node
/**
 * Render architecture.html ke PNG.
 *
 * Usage:
 *   node scripts/render-architecture-png.mjs
 *
 * Output:
 *   docs/sync-architecture/architecture.png
 */

import { chromium } from "playwright"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const htmlPath = join(__dirname, "..", "docs", "sync-architecture", "architecture.html")
const pngPath = join(__dirname, "..", "docs", "sync-architecture", "architecture.png")

console.log(`Loading ${htmlPath}...`)
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2, // High-DPI
})
const page = await context.newPage()

await page.goto(`file://${htmlPath}`)
await page.waitForLoadState("networkidle")
// Wait for Mermaid to finish rendering
await page.waitForTimeout(2000)

await page.screenshot({ path: pngPath, fullPage: true })
console.log(`✓ Saved ${pngPath}`)

await browser.close()
