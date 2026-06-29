/**
 * Seed: nilai.
 *
 * XII (90 siswa): complete data untuk SEMUA mapel yang relevan
 *   - nilai_formatif (proses)
 *   - nilai_sumatif (sumatif akhir)
 *   - nilai_rapor = formatif * 0.4 + sumatif * 0.6
 *   - 14 mapel per siswa (filtered by agama)
 *   Total: 90 × 14 = 1.260 records
 *
 * X & XI (180 siswa): 3 mapel saja (BIND, MTK, BING) × 2 nilai (formatif + sumatif)
 *   Total: 180 × 3 = 540 records
 *
 * Distribusi nilai:
 * - 30% siswa: range 85-95 (high achiever)
 * - 50% siswa: range 70-85 (average)
 * - 20% siswa: range 60-75 (struggling)
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createRng, pickOne, randFloat, log, logProgress, pickAgama } from "../helpers"
import { KODE_MAPEL_AGAMA, type Agama } from "../../../src/types/database"

type KodeMapel = string

function pickNilaiByDistribution(rng: () => number): { formatif: number; sumatif: number; rapor: number } {
  const r = rng()
  let base: number
  if (r < 0.3) base = randFloat(85, 95, rng, 1)
  else if (r < 0.8) base = randFloat(70, 85, rng, 1)
  else base = randFloat(60, 75, rng, 1)

  const formatif = Math.min(100, base + randFloat(-3, 3, rng, 1))
  const sumatif = Math.min(100, base + randFloat(-2, 2, rng, 1))
  const rapor = Number((formatif * 0.4 + sumatif * 0.6).toFixed(2))
  return { formatif, sumatif, rapor }
}

function getMapelForSiswa(
  siswaAgama: string | null,
  mapelIdByKode: Map<string, { id: number; spec: { kode_mapel: string; jenis: string; agama_target?: string } }>,
): Array<{ id: number; kode: string }> {
  const out: Array<{ id: number; kode: string }> = []
  for (const [kode, info] of mapelIdByKode.entries()) {
    // Skip prakerin/ketarunaan/kokurikuler untuk nilai reguler
    if (info.spec.jenis !== "reguler") continue
    // Mapel agama: filter by siswa agama
    if (info.spec.agama_target) {
      if (!siswaAgama) continue
      const expectedKode = KODE_MAPEL_AGAMA[siswaAgama as Agama]
      if (expectedKode !== kode) continue
    }
    out.push({ id: info.id, kode })
  }
  return out
}

function insertNilai(
  db: Db,
  siswaId: number,
  mapelId: number,
  tahunAjaranId: number,
  formatif: number | null,
  sumatif: number | null,
  rapor: number | null,
): boolean {
  // Idempotent: cek dulu
  const existing = db
    .select()
    .from(schema.nilai)
    .where(
      and(
        eq(schema.nilai.siswa_id, siswaId),
        eq(schema.nilai.mapel_id, mapelId),
        eq(schema.nilai.tahun_ajaran_id, tahunAjaranId),
      ),
    )
    .get()
  if (existing) return false
  db.insert(schema.nilai)
    .values({
      siswa_id: siswaId,
      mapel_id: mapelId,
      tahun_ajaran_id: tahunAjaranId,
      nilai_formatif: formatif,
      nilai_sumatif: sumatif,
      nilai_rapor: rapor,
    })
    .run()
  return true
}

const KELAS_XII = ["XII RPL", "XII TKJ A", "XII TKJ B"]
const KELAS_LAIN = ["X RPL 1", "X RPL 2", "X TKJ 1", "XI RPL", "XI TKJ A", "XI TKJ B"]

const MAPEL_MINIMAL = ["BIND", "MTK", "BING"] as const

export function seedNilai(
  db: Db,
  kelasIdByNama: Map<string, number>,
  mapelIdByKode: Map<string, { id: number; spec: { kode_mapel: string; jenis: string; agama_target?: string } }>,
  tahunAjaranId: number,
): void {
  const rng = createRng(12345)
  let totalInserted = 0
  let stepIdx = 0
  const totalSteps = KELAS_XII.length + KELAS_LAIN.length

  // XII: complete data (semua mapel reguler yang relevan)
  for (const kelasNama of KELAS_XII) {
    const kelasId = kelasIdByNama.get(kelasNama)
    if (!kelasId) continue
    const siswaRows = db
      .select()
      .from(schema.siswa)
      .where(eq(schema.siswa.kelas_id, kelasId))
      .all()
    for (const s of siswaRows) {
      const mapelList = getMapelForSiswa(s.agama, mapelIdByKode)
      for (const m of mapelList) {
        const { formatif, sumatif, rapor } = pickNilaiByDistribution(rng)
        if (insertNilai(db, s.id, m.id, tahunAjaranId, formatif, sumatif, rapor)) {
          totalInserted++
        }
      }
    }
    stepIdx++
    logProgress(stepIdx, totalSteps, `nilai XII ${kelasNama}`)
  }

  // X & XI: 3 mapel minimal
  for (const kelasNama of KELAS_LAIN) {
    const kelasId = kelasIdByNama.get(kelasNama)
    if (!kelasId) continue
    const siswaRows = db
      .select()
      .from(schema.siswa)
      .where(eq(schema.siswa.kelas_id, kelasId))
      .all()
    for (const s of siswaRows) {
      for (const kode of MAPEL_MINIMAL) {
        const m = mapelIdByKode.get(kode)
        if (!m) continue
        const { formatif, sumatif, rapor } = pickNilaiByDistribution(rng)
        if (insertNilai(db, s.id, m.id, tahunAjaranId, formatif, sumatif, rapor)) {
          totalInserted++
        }
      }
    }
    stepIdx++
    logProgress(stepIdx, totalSteps, `nilai ${kelasNama}`)
  }

  log(`  ✓ nilai (${totalInserted} new)`)
}
