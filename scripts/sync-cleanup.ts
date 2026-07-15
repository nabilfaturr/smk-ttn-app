/**
 * Sync cleanup — hapus sync_log row yang sudah success > N hari.
 *
 * Tujuan: keep DB kecil, query tetap cepat.
 *
 * Default retention: 30 hari untuk status=success.
 * - pending/failed/dead_letter TIDAK di-cleanup (perlu action)
 *
 * Usage:
 *   npm run sync:cleanup             # retention default 30 hari
 *   npm run sync:cleanup -- 7        # retention 7 hari
 *   npm run sync:cleanup -- 90       # retention 90 hari
 *
 * Dry-run (preview only, no delete):
 *   npm run sync:cleanup -- 30 --dry
 */

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { eq, and, lt, sql } from "drizzle-orm"
import { app } from "electron"
import path from "node:path"
import * as schema from "../src/lib/db/schema"
import { migrations } from "../src/lib/db/migrations-embedded"

function runMigration(sqlite: Database.Database, sqlText: string) {
  const statements = sqlText
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean)
  for (const stmt of statements) {
    try {
      sqlite.exec(stmt)
    } catch (e) {
      console.warn(`[sync-cleanup] migration skipped:`, e instanceof Error ? e.message : e)
    }
  }
}

function ensureSchema(sqlite: Database.Database) {
  for (const m of migrations) {
    runMigration(sqlite, m.sql)
  }
}

const DEFAULT_RETENTION_DAYS = 30

function parseArgs() {
  const args = process.argv.slice(2)
  let retentionDays = DEFAULT_RETENTION_DAYS
  let dryRun = false

  for (const arg of args) {
    if (arg === "--dry" || arg === "--dry-run") {
      dryRun = true
    } else {
      const n = Number.parseInt(arg, 10)
      if (!Number.isNaN(n) && n > 0) {
        retentionDays = n
      }
    }
  }

  return { retentionDays, dryRun }
}

function openDatabase() {
  let dbPath: string
  try {
    dbPath = path.join(app.getPath("userData"), "smk-ttn.db")
  } catch {
    dbPath = path.join(process.cwd(), "smk-ttn.db")
  }
  const sqlite = new Database(dbPath)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  // Ensure schema ada (kalau DB fresh / di CLI context tanpa app start)
  ensureSchema(sqlite)
  return { sqlite, db: drizzle(sqlite, { schema }), dbPath }
}

function log(message: string) {
  console.log(`[sync-cleanup] ${message}`)
}

export async function runCleanup(retentionDays = DEFAULT_RETENTION_DAYS, dryRun = false) {
  const { sqlite, db, dbPath } = openDatabase()
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()

  log(`DB: ${dbPath}`)
  log(`Retention: ${retentionDays} hari (cutoff: ${cutoff})`)
  log(`Mode: ${dryRun ? "DRY-RUN (no delete)" : "EXECUTE"}`)

  // Hitung stats sebelum
  const beforeSuccess = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.syncLog)
    .where(and(eq(schema.syncLog.status, "success"), lt(schema.syncLog.synced_at, cutoff)))
    .all()[0]?.count ?? 0

  const beforeTotal = db.select({ count: sql<number>`count(*)` }).from(schema.syncLog).all()[0]?.count ?? 0

  log(`Row success > ${retentionDays} hari: ${beforeSuccess}`)
  log(`Total row sync_log: ${beforeTotal}`)

  if (dryRun) {
    log("Dry-run selesai, tidak ada yang dihapus")
    sqlite.close()
    return { deleted: 0, beforeTotal, afterTotal: beforeTotal }
  }

  // Hapus
  const result = db
    .delete(schema.syncLog)
    .where(and(eq(schema.syncLog.status, "success"), lt(schema.syncLog.synced_at, cutoff)))
    .run()

  const deleted = result.changes ?? 0
  const afterTotal = db.select({ count: sql<number>`count(*)` }).from(schema.syncLog).all()[0]?.count ?? 0

  log(`✓ Dihapus: ${deleted} row`)
  log(`Total row sync_log sekarang: ${afterTotal}`)

  sqlite.close()
  return { deleted, beforeTotal, afterTotal }
}

function main() {
  const { retentionDays, dryRun } = parseArgs()
  runCleanup(retentionDays, dryRun)
    .then((res) => {
      log(`Selesai. Deleted: ${res.deleted}`)
      process.exit(0)
    })
    .catch((err) => {
      console.error("[sync-cleanup] Error:", err)
      process.exit(1)
    })
}

// Hanya run kalau dipanggil langsung (bukan di-import)
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
