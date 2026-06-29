/**
 * Seed: absensi.
 *
 * Generate absensi harian untuk:
 * - XII (90 siswa): 16 hari kerja terakhir (1 bulan), 2 mapel utama
 * - X & XI (180 siswa): 5 hari terakhir, 1 mapel
 *
 * Status distribusi: 85% Hadir, 5% Sakit, 5% Izin, 5% Tanpa Keterangan.
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createRng, listHariKerja, pickOne, log, logProgress } from "../helpers"

type StatusAbsensi = "H" | "S" | "I" | "TK" | "DL"

const STATUS_WEIGHTS: Array<[StatusAbsensi, number]> = [
  ["H", 0.85],
  ["S", 0.05],
  ["I", 0.05],
  ["TK", 0.05],
]

function pickStatus(rng: () => number): StatusAbsensi {
  const r = rng()
  let acc = 0
  for (const [status, weight] of STATUS_WEIGHTS) {
    acc += weight
    if (r <= acc) return status
  }
  return "H"
}

function pickHariKerja(_rng: () => number, hariKerja: string[], count: number): string[] {
  // Ambil N hari kerja terakhir (deterministik untuk idempotency).
  if (count >= hariKerja.length) return [...hariKerja]
  return hariKerja.slice(-count)
}

/**
 * Generate absensi untuk satu set siswa di satu mapel, dalam rentang hari kerja.
 */
function generateAbsensiForGroup(
  db: Db,
  siswaIds: number[],
  kelasId: number,
  mapelId: number,
  hariKerja: string[],
  rng: () => number,
  jamPelajaran: number,
): number {
  let inserted = 0
  for (const siswaId of siswaIds) {
    for (const tanggal of hariKerja) {
      // Skip weekend sudah di-handle di listHariKerja
      // Cek dulu apakah sudah ada (idempotent)
      const existing = db
        .select()
        .from(schema.absensi)
        .where(
          and(
            eq(schema.absensi.siswa_id, siswaId),
            eq(schema.absensi.kelas_id, kelasId),
            eq(schema.absensi.tanggal, tanggal),
            eq(schema.absensi.jam_pelajaran, jamPelajaran),
          ),
        )
        .get()
      if (existing) continue
      const status = pickStatus(rng)
      db.insert(schema.absensi)
        .values({
          siswa_id: siswaId,
          kelas_id: kelasId,
          tanggal,
          status,
          jam_pelajaran: jamPelajaran,
        })
        .run()
      inserted++
    }
  }
  return inserted
}

export function seedAbsensi(
  db: Db,
  kelasIdByNama: Map<string, number>,
  mapelIdByKode: Map<string, { id: number; spec: { kode_mapel: string } }>,
): void {
  // Tanggal referensi: hari ini
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 1) // kemarin
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 31) // 1 bulan ke belakang
  const allHariKerja = listHariKerja(
    startDate.toISOString().slice(0, 10),
    endDate.toISOString().slice(0, 10),
  )

  const mapelBIND = mapelIdByKode.get("BIND")!.id
  const mapelMTK = mapelIdByKode.get("MTK")!.id
  const mapelBING = mapelIdByKode.get("BING")!.id

  const KELAS_XII = ["XII RPL", "XII TKJ A", "XII TKJ B"]
  const KELAS_LAIN = ["X RPL 1", "X RPL 2", "X TKJ 1", "XI RPL", "XI TKJ A", "XI TKJ B"]

  const rng = createRng(99999)
  let totalInserted = 0
  let stepIdx = 0
  const totalSteps = KELAS_XII.length + KELAS_LAIN.length

  // XII: 16 hari kerja, 2 mapel utama (BIND, MTK)
  for (const kelasNama of KELAS_XII) {
    const kelasId = kelasIdByNama.get(kelasNama)
    if (!kelasId) continue
    const siswaRows = db
      .select()
      .from(schema.siswa)
      .where(eq(schema.siswa.kelas_id, kelasId))
      .all()
    if (siswaRows.length === 0) continue
    const siswaIds = siswaRows.map((s) => s.id)
    const hari16 = pickHariKerja(rng, allHariKerja, 16)
    const ins1 = generateAbsensiForGroup(db, siswaIds, kelasId, mapelBIND, hari16, rng, 1)
    const ins2 = generateAbsensiForGroup(db, siswaIds, kelasId, mapelMTK, hari16, rng, 2)
    totalInserted += ins1 + ins2
    stepIdx++
    logProgress(stepIdx, totalSteps, `absensi XII ${kelasNama}`)
  }

  // X & XI: 5 hari kerja, 1 mapel (BING)
  for (const kelasNama of KELAS_LAIN) {
    const kelasId = kelasIdByNama.get(kelasNama)
    if (!kelasId) continue
    const siswaRows = db
      .select()
      .from(schema.siswa)
      .where(eq(schema.siswa.kelas_id, kelasId))
      .all()
    if (siswaRows.length === 0) continue
    const siswaIds = siswaRows.map((s) => s.id)
    const hari5 = pickHariKerja(rng, allHariKerja, 5)
    const ins = generateAbsensiForGroup(db, siswaIds, kelasId, mapelBING, hari5, rng, 1)
    totalInserted += ins
    stepIdx++
    logProgress(stepIdx, totalSteps, `absensi ${kelasNama}`)
  }

  log(`  ✓ absensi (${totalInserted} new)`)
}
