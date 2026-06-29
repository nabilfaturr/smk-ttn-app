/**
 * DB connection helper untuk CLI seed (Node, no Electron).
 *
 * Path default: ~/.config/smk-ttn-app/smk-ttn.db
 * Bisa di-override dengan env SMK_TTN_DB_PATH.
 */

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"
import * as schema from "../../src/lib/db/schema"

export type Db = ReturnType<typeof drizzle<typeof schema>>
export type Sqlite = Database.Database

function defaultDbPath(): string {
  const configDir = path.join(os.homedir(), ".config", "smk-ttn-app")
  return path.join(configDir, "smk-ttn.db")
}

export function getDbPath(): string {
  return process.env.SMK_TTN_DB_PATH ?? defaultDbPath()
}

export function dbExists(): boolean {
  return fs.existsSync(getDbPath())
}

export function openDatabase(): { db: Db; sqlite: Sqlite } {
  const dbPath = getDbPath()
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const sqlite = new Database(dbPath)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")

  ensureSchema(sqlite)
  const db = drizzle(sqlite, { schema })
  return { db, sqlite }
}

function ensureSchema(sqlite: Sqlite) {
  const migrationsDir = path.join(process.cwd(), "src/lib/db/migrations")
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
  for (const file of files) {
    const filePath = path.join(migrationsDir, file)
    const sqlText = fs.readFileSync(filePath, "utf-8")
    const statements = sqlText
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean)
    for (const stmt of statements) {
      try {
        sqlite.exec(stmt)
      } catch {
        // table already exists / column already added, skip
      }
    }
  }
}

export function closeSqlite(sqlite: Sqlite) {
  sqlite.close()
}
