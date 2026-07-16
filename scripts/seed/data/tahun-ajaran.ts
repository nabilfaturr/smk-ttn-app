/**
 * Seed: tahun_ajaran (6 rows: 2024/2025, 2025/2026, 2026/2027).
 *
 * Update 2026-07:
 * - Tambah kolom tanggal_mulai & tanggal_selesai (override hardcode di rapor).
 * - Tambah TA 2026/2027 semester 1+2 dan set sebagai active.
 *
 * Aturan range:
 *   - Semester 1 (ganjil): 1 Juli - 31 Desember
 *   - Semester 2 (genap):  1 Januari - 30 Juni
 *
 * Idempotent: skip kalau (nama, semester) sudah ada.
 * Backfill: kalau existing row punya tanggal default '1900-01-01' (dari
 * migration ADD COLUMN), update dengan tanggal yang benar.
 */
import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { log } from "../helpers"

const DEFAULT_TAHUN_AJARAN: Array<{
  nama: string
  semester: 1 | 2
  is_active: 1 | 0
  tanggal_mulai: string
  tanggal_selesai: string
}> = [
  { nama: "2024/2025", semester: 1, is_active: 0, tanggal_mulai: "2024-07-01", tanggal_selesai: "2024-12-31" },
  { nama: "2024/2025", semester: 2, is_active: 0, tanggal_mulai: "2025-01-01", tanggal_selesai: "2025-06-30" },
  { nama: "2025/2026", semester: 1, is_active: 0, tanggal_mulai: "2025-07-01", tanggal_selesai: "2025-12-31" },
  { nama: "2025/2026", semester: 2, is_active: 0, tanggal_mulai: "2026-01-01", tanggal_selesai: "2026-06-30" },
  { nama: "2026/2027", semester: 1, is_active: 1, tanggal_mulai: "2026-07-01", tanggal_selesai: "2026-12-31" },
  { nama: "2026/2027", semester: 2, is_active: 0, tanggal_mulai: "2027-01-01", tanggal_selesai: "2027-06-30" },
]

const PLACEHOLDER_DATE = "1900-01-01"

export function seedTahunAjaran(db: Db): void {
  // Backfill existing rows: kalau tanggal masih placeholder (1900-01-01),
  // update dengan tanggal yang benar dari DEFAULT_TAHUN_AJARAN.
  let backfilled = 0
  for (const t of DEFAULT_TAHUN_AJARAN) {
    const result = db
      .update(schema.tahunAjaran)
      .set({ tanggal_mulai: t.tanggal_mulai, tanggal_selesai: t.tanggal_selesai })
      .where(
        and(
          eq(schema.tahunAjaran.nama, t.nama),
          eq(schema.tahunAjaran.semester, t.semester),
          eq(schema.tahunAjaran.tanggal_mulai, PLACEHOLDER_DATE),
        ),
      )
      .run()
    if (result.changes > 0) backfilled++
  }
  if (backfilled > 0) {
    log(`  ✓ tahun_ajaran backfill (${backfilled} rows updated)`)
  }

  // Insert new rows
  const existing = db.select().from(schema.tahunAjaran).all()
  const existingSet = new Set(existing.map((t) => `${t.nama}-${t.semester}`))
  const toInsert = DEFAULT_TAHUN_AJARAN.filter(
    (t) => !existingSet.has(`${t.nama}-${t.semester}`),
  )
  if (toInsert.length === 0) {
    log("  → tahun_ajaran already complete, skip insert")
    return
  }
  // Saat insert yang baru, pastikan is_active di-nonaktifkan dulu di existing
  // supaya hanya 1 yang aktif.
  for (const t of toInsert) {
    if (t.is_active === 1) {
      db.update(schema.tahunAjaran).set({ is_active: 0 }).run()
    }
    db.insert(schema.tahunAjaran).values(t).run()
  }
  log(`  ✓ tahun_ajaran inserted (${toInsert.length} new rows)`)
}

export function getActiveTahunAjaranId(db: Db): number {
  const row = db
    .select()
    .from(schema.tahunAjaran)
    .where(eq(schema.tahunAjaran.is_active, 1))
    .get()
  if (!row) throw new Error("No active tahun_ajaran. Run seedTahunAjaran first.")
  return row.id
}

export function getTahunAjaranId(
  db: Db,
  nama: string,
  semester: 1 | 2,
): number {
  const row = db
    .select()
    .from(schema.tahunAjaran)
    .where(
      and(
        eq(schema.tahunAjaran.nama, nama),
        eq(schema.tahunAjaran.semester, semester),
      ),
    )
    .get()
  if (!row) {
    throw new Error(`tahun_ajaran ${nama} semester ${semester} not found`)
  }
  return row.id
}
