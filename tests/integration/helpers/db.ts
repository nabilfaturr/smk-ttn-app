import Database from "better-sqlite3"
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import * as schema from "@/lib/db/schema"
import path from "path"
import fs from "fs"

export type TestDB = BetterSQLite3Database<typeof schema>

function ensureSchema(sqlite: Database.Database) {
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
      try { sqlite.exec(stmt) } catch {}
    }
  }
}

/**
 * Buat in-memory SQLite database dengan schema dan migrations terpasang.
 * Cocok untuk integration tests — auto cleanup, tidak ada side effect ke file.
 */
export function createTestDb(): TestDB {
  const sqlite = new Database(":memory:")
  sqlite.pragma("foreign_keys = ON")
  ensureSchema(sqlite)

  const db = drizzle(sqlite, { schema })
  return db
}

/**
 * Seed data minimal untuk testing.
 * Return id dari tahun ajaran yang aktif untuk dipakai di test lain.
 */
export function seedMinimal(db: TestDB): {
  tahunAjaranId: number
  kelasId: number
  mapelId: number
  siswaId: number
  userId: number
  guruId: number
} {
  // Users
  const userResult = db
    .insert(schema.users)
    .values({
      username: "test_admin",
      password: "hashed_pw",
      role: "admin",
    })
    .returning()
    .all()

  // Tahun Ajaran
  const taResult = db
    .insert(schema.tahunAjaran)
    .values({ nama: "2025/2026", semester: 1, is_active: 1 })
    .returning()
    .all()

  // Guru
  const guruResult = db
    .insert(schema.guru)
    .values({ user_id: userResult[0].id, nip: "12345", nama: "Pak Test" })
    .returning()
    .all()

  // Kelas
  const kelasResult = db
    .insert(schema.kelas)
    .values({
      nama_kelas: "XII RPL",
      wali_kelas_id: guruResult[0].id,
      tahun_ajaran_id: taResult[0].id,
      tingkat: 12,
      program_keahlian: "RPL",
    })
    .returning()
    .all()

  // Mata Pelajaran
  const mapelResult = db
    .insert(schema.mataPelajaran)
    .values({
      kode_mapel: "MTK",
      nama_mapel: "Matematika",
      guru_id: guruResult[0].id,
      jenis: "reguler",
      kelompok: "umum",
    })
    .returning()
    .all()

  // Siswa
  const siswaResult = db
    .insert(schema.siswa)
    .values({
      nis: "1001",
      nama: "Budi Test",
      kelas_id: kelasResult[0].id,
      jenis_kelamin: "Laki-Laki",
      agama: "ISLAM",
      status: "aktif",
    })
    .returning()
    .all()

  return {
    userId: userResult[0].id,
    tahunAjaranId: taResult[0].id,
    kelasId: kelasResult[0].id,
    mapelId: mapelResult[0].id,
    siswaId: siswaResult[0].id,
    guruId: guruResult[0].id,
  }
}
