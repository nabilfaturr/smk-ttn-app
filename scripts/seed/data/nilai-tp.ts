/**
 * Seed: nilai_tp.
 *
 * Untuk setiap record `nilai`, pilih 1-2 TP dari `tujuan_pembelajaran`
 * yang mapelnya cocok, lalu insert ke `nilai_tp` dengan capaian:
 *   - rapor >= 75 → "T" (tuntas → pakai deskripsi_tuntas)
 *   - rapor <  75 → "R" (remediasi → pakai deskripsi_remediasi)
 *
 * Idempotent + capped: total nilai_tp per nilai MAX 2 kalimat
 * (capped by `MAX_TP_PER_NILAI`). Re-runs hanya top-up sampai cap.
 *
 * Wajib: jalan SETELAH seedNilai dan seedTujuanPembelajaran.
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { createRng, randInt, log, logProgress } from "../helpers"

const MAX_TP_PER_NILAI = 1

export function seedNilaiTp(db: Db, tahunAjaranId: number): void {
  const rng = createRng(54321)
  let totalInserted = 0
  let totalSkipped = 0

  // Load semua nilai + mapel ref + TP per mapel
  const allNilai = db
    .select()
    .from(schema.nilai)
    .where(eq(schema.nilai.tahun_ajaran_id, tahunAjaranId))
    .all()
  if (allNilai.length === 0) {
    log(`  ⚠ nilai_tp skip: tidak ada nilai untuk TA aktif`)
    return
  }

  const mapelRows = db.select().from(schema.mataPelajaran).all()
  const mapelById = new Map(mapelRows.map((m) => [m.id, m]))

  const tpRows = db
    .select()
    .from(schema.tujuanPembelajaran)
    .where(eq(schema.tujuanPembelajaran.tahun_ajaran_id, tahunAjaranId))
    .all()
  const tpByMapelId = new Map<number, number[]>()
  for (const tp of tpRows) {
    if (!tpByMapelId.has(tp.mapel_id)) tpByMapelId.set(tp.mapel_id, [])
    tpByMapelId.get(tp.mapel_id)!.push(tp.id)
  }

  // Existing nilai_tp untuk idempotency + count per nilai
  const existing = db.select().from(schema.nilaiTp).all()
  const existingKey = new Set(existing.map((nt) => `${nt.nilai_id}-${nt.tp_id}`))
  const existingCountByNilai = new Map<number, number>()
  for (const nt of existing) {
    existingCountByNilai.set(nt.nilai_id, (existingCountByNilai.get(nt.nilai_id) ?? 0) + 1)
  }

  // Group nilai by mapel_id untuk progress log
  const nilaiByMapel = new Map<number, typeof allNilai>()
  for (const n of allNilai) {
    if (!nilaiByMapel.has(n.mapel_id)) nilaiByMapel.set(n.mapel_id, [])
    nilaiByMapel.get(n.mapel_id)!.push(n)
  }
  const mapelIds = Array.from(nilaiByMapel.keys())
  let stepIdx = 0

  for (const mapelId of mapelIds) {
    const mapel = mapelById.get(mapelId)
    const tpIds = tpByMapelId.get(mapelId) ?? []
    const nilaiList = nilaiByMapel.get(mapelId) ?? []
    stepIdx++
    logProgress(stepIdx, mapelIds.length, `nilai_tp ${mapel?.kode_mapel ?? mapelId}`)

    if (tpIds.length === 0) {
      // Mapel ini belum punya TP, lewati (jangan insert nilai_tp kosong)
      continue
    }

    for (const n of nilaiList) {
      // Cap: skip kalau sudah MAX_TP_PER_NILAI
      const existingCount = existingCountByNilai.get(n.id) ?? 0
      if (existingCount >= MAX_TP_PER_NILAI) {
        totalSkipped += existingCount
        continue
      }
      const remaining = MAX_TP_PER_NILAI - existingCount

      // Pick 1-2 TP random, tapi max 'remaining' slot kosong
      const tpCount = Math.min(tpIds.length, randInt(1, Math.max(1, remaining), rng))
      const shuffled = [...tpIds].sort(() => rng() - 0.5)

      // Skip yg sudah ada di existingKey
      const candidates = shuffled.filter((id) => !existingKey.has(`${n.id}-${id}`))
      const pickedTpIds = candidates.slice(0, tpCount)

      const capaian: "T" | "R" = (n.nilai_rapor ?? 0) >= 75 ? "T" : "R"
      for (const tpId of pickedTpIds) {
        db.insert(schema.nilaiTp)
          .values({
            nilai_id: n.id,
            tp_id: tpId,
            capaian,
          })
          .run()
        existingKey.add(`${n.id}-${tpId}`)
        existingCountByNilai.set(n.id, existingCount + 1)
        totalInserted++
      }
    }
  }

  log(`  ✓ nilai_tp (${totalInserted} new, cap ${MAX_TP_PER_NILAI}/nilai)`)
}
