/**
 * Seed CLI.
 *
 * Usage:
 *   tsx scripts/seed/index.ts --mode=default    # Minimal data
 *   tsx scripts/seed/index.ts --mode=full       # Realistic data
 *   tsx scripts/seed/index.ts --reset           # Clear all tables
 *   tsx scripts/seed/index.ts --reset --mode=full --force   # Reset + full
 */

import { openDatabase, closeSqlite, getDbPath } from "./connection"
import { runDefaultSeed } from "./data/default-seed"
import { runFullSeed } from "./data/full-seed"
import { resetDatabase, backupDb } from "./reset"
import { log } from "./helpers"
import readline from "node:readline"

type Mode = "default" | "full" | undefined

function parseArgs(argv: string[]): { mode: Mode; reset: boolean; force: boolean } {
  let mode: Mode
  let reset = false
  let force = false
  for (const arg of argv) {
    if (arg === "--mode=default" || arg === "--default") mode = "default"
    else if (arg === "--mode=full" || arg === "--full") mode = "full"
    else if (arg === "--reset") reset = true
    else if (arg === "--force" || arg === "-f") force = true
    else if (arg === "--help" || arg === "-h") {
      printHelp()
      process.exit(0)
    } else {
      console.error(`[seed] Unknown argument: ${arg}`)
      printHelp()
      process.exit(1)
    }
  }
  if (reset && !mode) mode = "default" // default fallback kalau reset tanpa mode
  return { mode, reset, force }
}

function printHelp() {
  console.log(`
Seed CLI SMK TTN

Usage:
  tsx scripts/seed/index.ts [options]

Options:
  --mode=default    Seed minimal data (admin, 1 TA, master)
  --mode=full       Seed realistic data (270 siswa, transaksi lengkap)
  --reset           Clear all 22 tables (rollback)
  --force, -f       Skip confirmation prompt
  --help, -h        Show this help

Examples:
  tsx scripts/seed/index.ts --mode=default
  tsx scripts/seed/index.ts --mode=full
  tsx scripts/seed/index.ts --reset
  tsx scripts/seed/index.ts --reset --mode=full --force

Default DB: ${getDbPath()}
Override with: SMK_TTN_DB_PATH=path/to/db
`)
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(/^y(es)?$/i.test(answer.trim()))
    })
  })
}

async function main() {
  const { mode, reset, force } = parseArgs(process.argv.slice(2))

  if (!mode && !reset) {
    printHelp()
    process.exit(0)
  }

  log(`DB path: ${getDbPath()}`)
  log(`Mode: ${mode ?? "(none)"}, reset: ${reset}, force: ${force}`)

  // Step 1: Reset (kalau diminta)
  if (reset) {
    if (!force) {
      const ok = await confirm(
        `\n⚠ Akan MENGHAPUS semua 22 tabel di ${getDbPath()}.\nLanjutkan? (y/N): `,
      )
      if (!ok) {
        log("Cancelled.")
        process.exit(0)
      }
    }
    const backupPath = backupDb()
    if (backupPath) log(`✓ Backup created: ${backupPath}`)

    const { sqlite } = openDatabase()
    resetDatabase(sqlite)
    closeSqlite(sqlite)
    log("✅ Reset selesai. DB kosong.\n")
    if (!mode) process.exit(0) // reset tanpa mode = selesai di sini
  }

  // Step 2: Seed (kalau ada mode)
  if (mode) {
    const { db, sqlite } = openDatabase()
    if (mode === "default") {
      log("Running default seed...")
      runDefaultSeed(db)
    } else if (mode === "full") {
      log("Running full seed...")
      runFullSeed(db)
    }
    closeSqlite(sqlite)
    log(`\nSelesai! Tutup DB dan keluar.\n`)
  }
}

main().catch((err) => {
  console.error("[seed] ❌ Error:", err)
  process.exit(1)
})
