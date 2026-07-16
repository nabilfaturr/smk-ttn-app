/**
 * Seed: tahun_ajaran (4 rows: 2024/2025, 2025/2026, 2026/2027).
 *
 * Update 2026-07: tambah TA 2026/2027 semester 1+2 dan set sebagai active,
 * karena hari ini sudah masuk semester 1 TA baru (Juli 2026). Sebelumnya
 * TA aktif 2025/2026 semester 1 (range 2025-07-01 s/d 2025-12-31) — tanggal
 * hari ini (2026-07-16) di luar range, sehingga rapor tidak reflect absensi
 * yang diinput di semester baru.
 */
import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { log } from "../helpers"

const DEFAULT_TAHUN_AJARAN: Array<{
  nama: string
  semester: 1 | 2
  is_active: 1 | 0
}> = [
  { nama: "2024/2025", semester: 1, is_active: 0 },
  { nama: "2024/2025", semester: 2, is_active: 0 },
  { nama: "2025/2026", semester: 1, is_active: 0 },
  { nama: "2025/2026", semester: 2, is_active: 0 },
  { nama: "2026/2027", semester: 1, is_active: 1 },
  { nama: "2026/2027", semester: 2, is_active: 0 },
]

export function seedTahunAjaran(db: Db): void {
  const existing = db.select().from(schema.tahunAjaran).all()
  const existingSet = new Set(existing.map((t) => `${t.nama}-${t.semester}`))
  const toInsert = DEFAULT_TAHUN_AJARAN.filter(
    (t) => !existingSet.has(`${t.nama}-${t.semester}`),
  )
  if (toInsert.length === 0) {
    log("  → tahun_ajaran already complete, skip")
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
