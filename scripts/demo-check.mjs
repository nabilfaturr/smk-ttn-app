#!/usr/bin/env node
/**
 * Pre-Demo Check: verifikasi semua komponen siap untuk demo SMK TTN.
 *
 * Usage:
 *   node scripts/demo-check.mjs
 *
 * Output: pass/fail per check + summary
 */

import { existsSync, statSync, readFileSync } from "node:fs"
import { execSync, spawnSync } from "node:child_process"
import { platform, homedir } from "node:os"
import { join } from "node:path"

const checks = []
let failed = 0

function check(name, fn) {
  try {
    const result = fn()
    if (result === true || result === undefined) {
      checks.push({ name, status: "PASS", detail: result === true ? "" : "" })
      console.log(`  \x1b[32m✓\x1b[0m ${name}`)
    } else {
      checks.push({ name, status: "FAIL", detail: result })
      console.log(`  \x1b[31m✗\x1b[0m ${name}: ${result}`)
      failed++
    }
  } catch (e) {
    checks.push({ name, status: "FAIL", detail: e.message })
    console.log(`  \x1b[31m✗\x1b[0m ${name}: ${e.message}`)
    failed++
  }
}

function header(s) {
  console.log(`\n\x1b[1m${s}\x1b[0m`)
}

// ============================================================================

header("1. Environment")

check("Node.js version >= 20", () => {
  const v = process.versions.node
  const major = parseInt(v.split(".")[0], 10)
  return major >= 20 ? true : `Node ${v}, butuh >= 20`
})

check("Platform", () => {
  if (platform === "win32") return true
  // Linux/Mac OK untuk cross-build & testing. Hanya warning.
  console.log(`    \x1b[33m⚠ Sekarang di ${platform} (cross-build OK, demo final lebih baik di Windows)\x1b[0m`)
  return true
})

header("2. Project Files")

const required = [
  "package.json",
  "vite.config.ts",
  "electron/main.ts",
  "electron/preload.ts",
  "electron-builder.yml",
  "src/App.tsx",
  "build/icon.ico",
  "build/rapor-template.docx",
  "build/rapor-prakerin-template.docx",
  ".firebaserc",
  "firestore.rules",
]

for (const f of required) {
  check(`File: ${f}`, () => (existsSync(f) ? true : "tidak ada"))
}

header("3. Firebase Config")

check(".env ada", () => {
  if (!existsSync(".env")) return "tidak ada — copy .env.example dan isi VITE_FIREBASE_*"
  const env = readFileSync(".env", "utf-8")
  const required = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ]
  const missing = required.filter((k) => !new RegExp(`^${k}=.+$`, "m").test(env))
  if (missing.length > 0) return `missing: ${missing.join(", ")}`
  const projectMatch = env.match(/^VITE_FIREBASE_PROJECT_ID=(.+)$/m)
  const project = projectMatch ? projectMatch[1].trim() : ""
  if (project !== "smk-ttn-demo") {
    return `project=${project}, expected smk-ttn-demo (demo project)`
  }
  return true
})

header("4. Build Artifacts")

check("dist-electron/main.js ada", () => {
  if (!existsSync("dist-electron/main.js")) return "belum build — run 'npm run build:vite'"
  return true
})

check("dist-electron/data/ ada (pdfkit fonts)", () => {
  const d = "dist-electron/data"
  if (!existsSync(d)) return "tidak ada — re-run 'npm run build:vite'"
  return true
})

check("dist-electron/rapor-template.docx unpacked", () => {
  const f = "dist-electron/rapor-template.docx"
  if (!existsSync(f)) return "tidak ada — re-run 'npm run build:vite'"
  return true
})

check("dist-electron/rapor-prakerin-template.docx unpacked", () => {
  const f = "dist-electron/rapor-prakerin-template.docx"
  if (!existsSync(f)) return "tidak ada — re-run 'npm run build:vite'"
  return true
})

header("5. Database")

const dbPath =
  platform === "win32"
    ? join(homedir(), "AppData", "Roaming", "smk-ttn-app", "smk-ttn.db")
    : join(homedir(), ".config", "smk-ttn-app", "smk-ttn.db")

check(`DB exists: ${dbPath}`, () => {
  if (!existsSync(dbPath)) return "tidak ada — run 'npm run db:fresh:full'"
  return true
})

if (existsSync(dbPath)) {
  check("DB has 270+ siswa (full seed)", () => {
    try {
      const r = spawnSync("sqlite3", [dbPath, "SELECT COUNT(*) FROM siswa;"], { encoding: "utf-8" })
      if (r.status !== 0) return "sqlite3 CLI tidak tersedia"
      const n = parseInt(r.stdout.trim(), 10)
      return n >= 270 ? true : `cuma ${n} siswa, run 'npm run db:fresh:full'`
    } catch (e) {
      return e.message
    }
  })

  check("DB has 60+ prakerin (XII TKJ)", () => {
    try {
      const r = spawnSync("sqlite3", [dbPath, "SELECT COUNT(*) FROM nilai_prakerin;"], {
        encoding: "utf-8",
      })
      if (r.status !== 0) return "sqlite3 CLI tidak tersedia"
      const n = parseInt(r.stdout.trim(), 10)
      return n >= 60 ? true : `cuma ${n}, run 'npm run db:fresh:full'`
    } catch (e) {
      return e.message
    }
  })
}

header("6. Sync Engine")

check("Smk-ttn-demo project accessible", () => {
  try {
    const r = spawnSync(
      "curl",
      [
        "-s",
        "-o",
        "/dev/null",
        "-w",
        "%{http_code}",
        "https://firestore.googleapis.com/v1/projects/smk-ttn-demo/databases/(default)/documents/siswa?pageSize=1",
      ],
      { encoding: "utf-8" },
    )
    const code = r.stdout.trim()
    if (code === "200") return true
    if (code === "403") return "permission denied — deploy firestore.rules dulu"
    return `HTTP ${code}`
  } catch (e) {
    return e.message
  }
})

// ============================================================================

console.log(`\n${"=".repeat(60)}`)
if (failed === 0) {
  console.log(`\x1b[1m\x1b[32m✓ SEMUA CHECK PASS (${checks.length}/${checks.length})\x1b[0m`)
  console.log("\nApp siap untuk demo. Langkah:")
  console.log("  - Linux: npm run start")
  console.log("  - Windows: copy folder + .env, run 'npm install' + 'electron-rebuild' + 'npm run build:vite' + 'npm run start'")
  console.log("  - Atau: npm run build:win (untuk installer .exe)")
} else {
  console.log(`\x1b[1m\x1b[31m✗ ${failed}/${checks.length} CHECK GAGAL\x1b[0m`)
  console.log("\nFix issue di atas, lalu run 'npm run demo:check' lagi.")
  process.exit(1)
}
