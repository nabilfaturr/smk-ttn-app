/**
 * Seed: nilai_ekskul + nilai_kokurikuler.
 *
 * XII (90 siswa): 1 ekskul pilihan + 1 kokurikuler (P5) per siswa.
 * - nilai_ekskul: 90 records
 * - nilai_kokurikuler: 90 × 19 subdimensi = 1.710 records
 *
 * Distribusi ekskul pilihan (Ketarunaan sudah auto-enroll terpisah):
 * - Pramuka: 40%
 * - Paskibra: 15%
 * - Karate: 15%
 * - Marching Band: 10%
 * - Silat: 10%
 * - Taekwondo: 10%
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createRng, log, logProgress, pickOne } from "../helpers"

function pickGrade(rng: () => number): 1 | 2 | 3 | null {
  const r = rng()
  // Distribusi sesuai observasi sekolah: mostly Cakap, beberapa Mahir,
  // sedikit Berkembang, dan ~20% kosong (tidak diisi)
  if (r < 0.2) return null // 20% kosong (tidak insert)
  if (r < 0.3) return 1 // Berkembang (10%)
  if (r < 0.5) return 3 // Mahir (20%)
  return 2 // Cakap (50%)
}

function pickPredikat(rng: () => number): string {
  const r = rng()
  if (r < 0.55) return "A" // Sangat Baik
  if (r < 0.85) return "B" // Baik
  if (r < 0.97) return "C" // Cukup
  return "D" // Perlu Bimbingan
}

const KELAS_XII = ["XII RPL", "XII TKJ A", "XII TKJ B"]

export function seedNilaiEkskul(
  db: Db,
  kelasIdByNama: Map<string, number>,
  ekskulIdByNama: Map<string, number>,
  tahunAjaranId: number,
): void {
  const rng = createRng(77777)
  const pramukaId = ekskulIdByNama.get("Pramuka")!
  const paskibraId = ekskulIdByNama.get("Paskibra")!
  const karateId = ekskulIdByNama.get("Karate")!
  const marchingBandId = ekskulIdByNama.get("Marching Band")!
  const silatId = ekskulIdByNama.get("Silat")!
  const taekwondoId = ekskulIdByNama.get("Taekwondo")!

  let stepIdx = 0
  let totalInserted = 0

  for (const kelasNama of KELAS_XII) {
    const kelasId = kelasIdByNama.get(kelasNama)
    if (!kelasId) continue
    const siswaList = db
      .select()
      .from(schema.siswa)
      .where(eq(schema.siswa.kelas_id, kelasId))
      .all()
    if (siswaList.length === 0) continue

    for (const siswa of siswaList) {
      const existingAny = db
        .select()
        .from(schema.nilaiEkskul)
        .where(
          and(
            eq(schema.nilaiEkskul.siswa_id, siswa.id),
            eq(schema.nilaiEkskul.tahun_ajaran_id, tahunAjaranId),
          ),
        )
        .get()
      if (existingAny) continue

      const seed = (siswa.id * 7919) % 100 / 100
      let ekskulId: number
      if (seed < 0.4) ekskulId = pramukaId
      else if (seed < 0.55) ekskulId = paskibraId
      else if (seed < 0.7) ekskulId = karateId
      else if (seed < 0.8) ekskulId = marchingBandId
      else if (seed < 0.9) ekskulId = silatId
      else ekskulId = taekwondoId

      const predikat = pickPredikat(rng)
      db.insert(schema.nilaiEkskul)
        .values({
          siswa_id: siswa.id,
          ekskul_id: ekskulId,
          tahun_ajaran_id: tahunAjaranId,
          predikat,
          keterangan: `Siswa aktif dalam kegiatan ekskul dengan predikat ${predikat}`,
        })
        .run()
      totalInserted++
    }
    stepIdx++
    logProgress(stepIdx, KELAS_XII.length, `ekskul ${kelasNama}`)
  }
  log(`  ✓ nilai_ekskul (${totalInserted} new)`)
}

export function seedNilaiKokurikuler(
  db: Db,
  kelasIdByNama: Map<string, number>,
  subdimensiIds: number[],
  tahunAjaranId: number,
): void {
  const rng = createRng(88888)
  const KELAS_ALL = [
    "X RPL 1", "X RPL 2", "X TKJ 1",
    "XI RPL", "XI TKJ A", "XI TKJ B",
    "XII RPL", "XII TKJ A", "XII TKJ B",
  ]
  let stepIdx = 0
  let totalInserted = 0

  for (const kelasNama of KELAS_ALL) {
    const kelasId = kelasIdByNama.get(kelasNama)
    if (!kelasId) continue
    const siswaList = db
      .select()
      .from(schema.siswa)
      .where(eq(schema.siswa.kelas_id, kelasId))
      .all()
    if (siswaList.length === 0) continue

    for (const siswa of siswaList) {
      for (const subId of subdimensiIds) {
        const existing = db
          .select()
          .from(schema.nilaiKokurikuler)
          .where(
            and(
              eq(schema.nilaiKokurikuler.siswa_id, siswa.id),
              eq(schema.nilaiKokurikuler.subdimensi_id, subId),
              eq(schema.nilaiKokurikuler.tahun_ajaran_id, tahunAjaranId),
            ),
          )
          .get()
        if (existing) continue
        const grade = pickGrade(rng)
        if (grade == null) continue // simulasi sel kosong (tidak diinput)
        db.insert(schema.nilaiKokurikuler)
          .values({
            siswa_id: siswa.id,
            subdimensi_id: subId,
            tahun_ajaran_id: tahunAjaranId,
            grade,
          })
          .run()
        totalInserted++
      }
    }
    stepIdx++
    logProgress(stepIdx, KELAS_ALL.length, `kokurikuler ${kelasNama}`)
  }
  log(`  ✓ nilai_kokurikuler (${totalInserted} new)`)
}
