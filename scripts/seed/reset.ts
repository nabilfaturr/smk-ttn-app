/**
 * Reset module: TRUNCATE semua tabel + auto-backup.
 */

import type { Sqlite } from "./connection"
import path from "node:path"
import fs from "node:fs"
import { getDbPath } from "./connection"
import { log } from "./helpers"

/**
 * Daftar semua 23 tabel urut dari leaf ke root (FK-safe).
 * Kita disable foreign keys lalu DELETE semua.
 */
const ALL_TABLES = [
  "sync_log",
  "nilai_kokurikuler",
  "nilai_ekskul",
  "nilai_ketarunaan",
  "nilai_prakerin",
  "nilai_tp",
  "nilai",
  "tujuan_pembelajaran",
  "absensi_prakerin",
  "absensi",
  "catatan_wali_kelas",
  "subdimensi_p5",
  "dimensi_p5",
  "ekskul",
  "mapel_kelas_guru",
  "siswa",
  "mata_pelajaran",
  "kelas",
  "guru",
  "tahun_ajaran",
  "konfigurasi",
  "info_sekolah",
  "users",
] as const

export function backupDb(): string | null {
  const dbPath = getDbPath()
  if (!fs.existsSync(dbPath)) return null
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const backupPath = path.join(path.dirname(dbPath), `smk-ttn.db.backup-${ts}`)
  fs.copyFileSync(dbPath, backupPath)
  return backupPath
}

export function resetDatabase(sqlite: Sqlite): void {
  log("Resetting database (DELETE FROM all tables)…")
  sqlite.pragma("foreign_keys = OFF")
  const tx = sqlite.transaction(() => {
    for (const table of ALL_TABLES) {
      sqlite.exec(`DELETE FROM "${table}"`)
      // Reset autoincrement juga supaya ID mulai dari 1 lagi
      sqlite.exec(`DELETE FROM sqlite_sequence WHERE name = '${table}'`)
    }
  })
  tx()
  sqlite.pragma("foreign_keys = ON")
  log("✓ All 23 tables cleared")
}
