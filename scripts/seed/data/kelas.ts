/**
 * Seed: kelas (9 kelas) untuk tahun ajaran aktif.
 *
 * Struktur untuk TA 2025/2026:
 *   - X  RPL 1, X  RPL 2, X  TKJ 1
 *   - XI RPL,    XI TKJ A, XI TKJ B
 *   - XII RPL,   XII TKJ A, XII TKJ B
 *
 * Wali kelas: 6 guru (3 RPL + 3 TKJ), yang lain multi-kelas.
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { log, createRng, pickOne } from "../helpers"

type KelasSpec = {
  nama_kelas: string
  tingkat: 10 | 11 | 12
  program_keahlian: "RPL" | "TKJ"
  waliKelasUsername: string
}

const KELAS_SPECS: KelasSpec[] = [
  { nama_kelas: "X RPL 1", tingkat: 10, program_keahlian: "RPL", waliKelasUsername: "budi" },
  { nama_kelas: "X RPL 2", tingkat: 10, program_keahlian: "RPL", waliKelasUsername: "sari" },
  { nama_kelas: "X TKJ 1", tingkat: 10, program_keahlian: "TKJ", waliKelasUsername: "agus" },
  { nama_kelas: "XI RPL", tingkat: 11, program_keahlian: "RPL", waliKelasUsername: "dewi" },
  { nama_kelas: "XI TKJ A", tingkat: 11, program_keahlian: "TKJ", waliKelasUsername: "eko" },
  { nama_kelas: "XI TKJ B", tingkat: 11, program_keahlian: "TKJ", waliKelasUsername: "fitri" },
  { nama_kelas: "XII RPL", tingkat: 12, program_keahlian: "RPL", waliKelasUsername: "hendro" },
  { nama_kelas: "XII TKJ A", tingkat: 12, program_keahlian: "TKJ", waliKelasUsername: "indri" },
  { nama_kelas: "XII TKJ B", tingkat: 12, program_keahlian: "TKJ", waliKelasUsername: "jaka" },
]

export function seedKelas(
  db: Db,
  tahunAjaranId: number,
): Map<string, number> {
  const existing = db
    .select()
    .from(schema.kelas)
    .where(eq(schema.kelas.tahun_ajaran_id, tahunAjaranId))
    .all()
  const existingByNama = new Map(existing.map((k) => [k.nama_kelas, k]))

  const allGuru = db.select().from(schema.guru).all()
  const guruByUsername = new Map<string, number>()
  for (const g of allGuru) {
    const user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, g.user_id))
      .get()
    if (user) guruByUsername.set(user.username, g.id)
  }

  const rng = createRng(33333)
  const result = new Map<string, number>()

  for (const spec of KELAS_SPECS) {
    if (existingByNama.has(spec.nama_kelas)) {
      result.set(spec.nama_kelas, existingByNama.get(spec.nama_kelas)!.id)
      continue
    }
    const waliKelasId = guruByUsername.get(spec.waliKelasUsername) ?? null
    const inserted = db
      .insert(schema.kelas)
      .values({
        nama_kelas: spec.nama_kelas,
        wali_kelas_id: waliKelasId,
        tahun_ajaran_id: tahunAjaranId,
        tingkat: spec.tingkat,
        program_keahlian: spec.program_keahlian,
      })
      .returning()
      .get()!
    result.set(spec.nama_kelas, inserted.id)
  }
  log(`  ✓ kelas (${result.size} total for TA ${tahunAjaranId})`)
  return result
}

export function getKelasIdByNama(
  db: Db,
  namaKelas: string,
  tahunAjaranId: number,
): number {
  const row = db
    .select()
    .from(schema.kelas)
    .where(
      and(
        eq(schema.kelas.nama_kelas, namaKelas),
        eq(schema.kelas.tahun_ajaran_id, tahunAjaranId),
      ),
    )
    .get()
  if (!row) throw new Error(`Kelas ${namaKelas} not found`)
  return row.id
}
