import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"
import path from "path"
import { app } from "electron"
import { seedDatabase } from "./seed"
import { migrations } from "./migrations-embedded"

let dbInstance: ReturnType<typeof drizzle> | null = null

function runMigration(sqlite: Database.Database, sql: string) {
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean)
  for (const stmt of statements) {
    try {
      sqlite.exec(stmt)
    } catch (e) {
      console.warn(`[db] migration statement skipped:`, e instanceof Error ? e.message : e)
    }
  }
}

function ensureDatabase(sqlite: Database.Database) {
  for (const m of migrations) {
    runMigration(sqlite, m.sql)
  }
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
