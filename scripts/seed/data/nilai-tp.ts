/**
 * Seed: nilai_tp (capaian TP per siswa-mapel).
 *
 * Untuk XII (90 siswa): TP records untuk 3 mapel utama (BIND, MTK, BING).
 * - Tiap mapel: ~5-10 TP tergantung master
 * - Distribusi capaian: 80% Tercapai, 20% Perlu Bimbingan
 * Total: ~90 × 3 mapel × 5-10 TP = ~1.500-2.700 records
 *
 * Idempotent: cek existing by (nilai_id, tp_id) sebelum insert.
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { createRng, log, logProgress, pickOne } from "../helpers"

const KELAS_XII = ["XII RPL", "XII TKJ A", "XII TKJ B"]
const MAPEL_UTAMA = ["BIND", "MTK", "BING"] as const

export function seedNilaiTp(
  db: Db,
  kelasIdByNama: Map<string, number>,
  mapelIdByKode: Map<string, { id: number }>,
  tahunAjaranId: number,
): void {
  const rng = createRng(77777)
  let totalInserted = 0
  let stepIdx = 0
  const totalSteps = KELAS_XII.length

  const mapelIds: number[] = []
  for (const kode of MAPEL_UTAMA) {
    const m = mapelIdByKode.get(kode)
    if (m) mapelIds.push(m.id)
  }
  if (mapelIds.length === 0) {
    log(`  ⚠ nilai_tp skip: tidak ada mapel utama`)
    return
  }

  // Pre-fetch semua TP untuk 3 mapel ini
  const tpList = db
    .select()
    .from(schema.tujuanPembelajaran)
    .where(inArray(schema.tujuanPembelajaran.mapel_id, mapelIds))
    .all()
  if (tpList.length === 0) {
    log(`  ⚠ nilai_tp skip: tidak ada TP untuk 3 mapel utama`)
    return
  }
  const tpByMapel = new Map<number, typeof tpList>()
  for (const tp of tpList) {
    if (!tpByMapel.has(tp.mapel_id)) tpByMapel.set(tp.mapel_id, [])
    tpByMapel.get(tp.mapel_id)!.push(tp)
  }

  // Pre-fetch existing nilai_tp untuk idempotency
  const existingNilaiTp = db
    .select()
    .from(schema.nilaiTp)
    .all()
  const existingKey = new Set(
    existingNilaiTp.map((r) => `${r.nilai_id}-${r.tp_id}`),
  )

  for (const kelasNama of KELAS_XII) {
    const kelasId = kelasIdByNama.get(kelasNama)
    if (!kelasId) continue

    const siswaRows = db
      .select()
      .from(schema.siswa)
      .where(eq(schema.siswa.kelas_id, kelasId))
      .all()

    for (const s of siswaRows) {
      // Pre-fetch nilai siswa untuk 3 mapel di TA aktif
      const nilaiSiswa = db
        .select()
        .from(schema.nilai)
        .where(
          and(
            eq(schema.nilai.siswa_id, s.id),
            eq(schema.nilai.tahun_ajaran_id, tahunAjaranId),
            inArray(schema.nilai.mapel_id, mapelIds),
          ),
        )
        .all()

      for (const n of nilaiSiswa) {
        const tps = tpByMapel.get(n.mapel_id) ?? []
        for (const tp of tps) {
          const key = `${n.id}-${tp.id}`
          if (existingKey.has(key)) continue

          // 80% Tercapai, 20% Perlu Bimbingan
          const capaian: "T" | "R" = rng() < 0.8 ? "T" : "R"

          db.insert(schema.nilaiTp)
            .values({
              nilai_id: n.id,
              tp_id: tp.id,
              capaian,
            })
            .run()
          existingKey.add(key)
          totalInserted++
        }
      }
    }
    stepIdx++
    logProgress(stepIdx, totalSteps, `nilai_tp ${kelasNama}`)
  }

  log(`  ✓ nilai_tp (${totalInserted} new)`)
}
