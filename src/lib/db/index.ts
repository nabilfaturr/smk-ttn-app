import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"
import path from "path"
import fs from "fs"
import { app } from "electron"
import { seedDatabase } from "./seed"

let dbInstance: ReturnType<typeof drizzle> | null = null

function runMigrationFile(sqlite: Database.Database, filename: string) {
  const filePath = path.join(app.getAppPath(), "src/lib/db/migrations", filename)
  if (!fs.existsSync(filePath)) return
  const sql = fs.readFileSync(filePath, "utf-8")
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean)
  for (const stmt of statements) {
    try {
      sqlite.exec(stmt)
    } catch {
      // already exists, skip
    }
  }
}

function ensureDatabase(sqlite: Database.Database) {
  runMigrationFile(sqlite, "0000_modern_dorian_gray.sql")
  runMigrationFile(sqlite, "0001_add_kode_login.sql")
  runMigrationFile(sqlite, "0002_add_mapel_kelas_guru.sql")
  runMigrationFile(sqlite, "0003_drop_mapel_guru_id.sql")
  runMigrationFile(sqlite, "0004_add_tp_tahun_ajaran.sql")
}

export function initDatabase() {
  const dbPath = path.join(app.getPath("userData"), "smk-ttn.db")
  const sqlite = new Database(dbPath)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")

  ensureDatabase(sqlite)

  dbInstance = drizzle(sqlite, { schema })
  seedDatabase(dbInstance)

  return dbInstance
}

export function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDatabase() first.")
  }
  return dbInstance
}

export { dbInstance as db }
export * from "./schema"
