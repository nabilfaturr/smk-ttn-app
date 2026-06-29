/**
 * Seed: ekskul (7 ekskul: Ketarunaan (wajib) + 6 pilihan).
 *
 * Wajib (1): Ketarunaan
 * Pilihan (6): Paskibra, Karate, Marching Band, Pramuka, Silat, Taekwondo
 *
 * Migrasi dari seed lama: jika ada ekskul yang namanya tidak ada di list baru,
 * data nilai_ekskul lama jadi orphan. Gunakan --reset untuk fresh seed.
 */
import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { log } from "../helpers"
import { eq } from "drizzle-orm"

type EkskulRow = { nama: string; wajib: 0 | 1 }

const DEFAULT_EKSKUL: EkskulRow[] = [
  { nama: "Ketarunaan", wajib: 1 },
  { nama: "Paskibra", wajib: 0 },
  { nama: "Karate", wajib: 0 },
  { nama: "Marching Band", wajib: 0 },
  { nama: "Pramuka", wajib: 0 },
  { nama: "Silat", wajib: 0 },
  { nama: "Taekwondo", wajib: 0 },
]

export function seedEkskul(db: Db): Map<string, number> {
  const expectedNames = new Set(DEFAULT_EKSKUL.map((e) => e.nama))

  const existing = db.select().from(schema.ekskul).all()

  const toDelete = existing.filter((e) => !expectedNames.has(e.nama))
  for (const e of toDelete) {
    db.delete(schema.nilaiEkskul).where(eq(schema.nilaiEkskul.ekskul_id, e.id)).run()
    db.delete(schema.ekskul).where(eq(schema.ekskul.id, e.id)).run()
  }
  if (toDelete.length > 0) {
    log(`  ✓ ekskul cleanup (${toDelete.length} lama dihapus)`)
  }

  const current = db.select().from(schema.ekskul).all()
  const idMap = new Map<string, number>(current.map((e) => [e.nama, e.id]))

  for (const e of DEFAULT_EKSKUL) {
    const found = current.find((c) => c.nama === e.nama)
    if (!found) {
      const inserted = db.insert(schema.ekskul).values(e).returning().get()!
      idMap.set(e.nama, inserted.id)
    } else if (found.wajib !== e.wajib) {
      db.update(schema.ekskul).set({ wajib: e.wajib }).where(eq(schema.ekskul.id, found.id)).run()
      idMap.set(e.nama, found.id)
    }
  }

  log(`  ✓ ekskul (${idMap.size})`)
  return idMap
}

/**
 * Auto-enroll siswa aktif ke ekskul wajib untuk TA aktif (idempotent).
 * Dipanggil setelah seedSiswa agar Ketarunaan ter-set untuk semua siswa aktif.
 */
export function autoEnrollWajibEkskul(db: Db, tahunAjaranId: number): void {
  const wajibEkskul = db.select().from(schema.ekskul).where(eq(schema.ekskul.wajib, 1)).all()
  if (wajibEkskul.length === 0) return

  const siswaAktif = db
    .select()
    .from(schema.siswa)
    .where(eq(schema.siswa.status, "aktif"))
    .all()

  let inserted = 0
  let skipped = 0
  for (const s of siswaAktif) {
    for (const e of wajibEkskul) {
      const existing = db
        .select()
        .from(schema.nilaiEkskul)
        .where(eq(schema.nilaiEkskul.siswa_id, s.id))
        .all()
        .find(
          (r) => r.ekskul_id === e.id && r.tahun_ajaran_id === tahunAjaranId,
        )
      if (existing) {
        skipped++
        continue
      }
      db.insert(schema.nilaiEkskul)
        .values({
          siswa_id: s.id,
          ekskul_id: e.id,
          tahun_ajaran_id: tahunAjaranId,
          predikat: "A",
          keterangan: null,
        })
        .run()
      inserted++
    }
  }
  if (inserted > 0 || skipped > 0) {
    log(`  ✓ auto-enroll wajib ekskul (${inserted} new, ${skipped} sudah ada)`)
  }
}
