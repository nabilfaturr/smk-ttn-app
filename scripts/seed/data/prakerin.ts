/**
 * Seed: nilai_prakerin (khusus XII TKJ).
 *
 * XII TKJ A + XII TKJ B = 60 siswa.
 * Setiap siswa: TPL, SL, SK (3 aspek), pembimbing, tempat, tanggal, dll.
 * Total: 60 records.
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createRng, log, logProgress, randFloat, pickOne, randDate } from "../helpers"

const TEMPAT_PRAKERIN = [
  "PT. Telkom Indonesia",
  "PT. Indosat Ooredoo Hutchison",
  "PT. XL Axiata",
  "PT. Biznet Networks",
  "PT. CBN (Cyberindo Aditama)",
  "PT. Lintasarta",
  "PT. IBM Indonesia",
  "PT. Microsoft Indonesia",
  "PT. Google Indonesia",
  "PT. Gojek",
  "PT. Tokopedia",
  "PT. Bukalapak",
  "PT. Traveloka",
  "PT. Shopee Indonesia",
  "PT. Bank Mandiri",
  "PT. Bank BCA",
  "PT. Bank BRI",
  "Dinas Kominfo Kab. Deli Serdang",
  "Dinas Kominfo Prov. Sumatera Utara",
  "Diskominfo Medan",
  "BSSN (Badan Siber dan Sandi Negara)",
  "PT. Datacomm Diangraha",
  "PT. ABB",
  "PT. Schneider Electric Indonesia",
] as const

const PEMBIMBING_INSTANSI = [
  "Andi Wijaya, S.T.",
  "Budi Santoso, M.Kom.",
  "Citra Dewi, S.Kom.",
  "Dani Pratama, S.T.",
  "Eko Saputro, M.M.",
  "Fitri Handayani, S.Kom.",
  "Galih Pranata, S.T.",
  "Hendro Wibowo, S.Kom.",
  "Indah Permata, M.Kom.",
  "Jaka Tirtayasa, S.T.",
  "Kartika Sari, S.Kom.",
  "Lutfi Hakim, M.T.",
] as const

const PEMBIMBING_SEKOLAH = [
  "Budi Hartono, S.Pd., M.Kom.",
  "Sari Wijaya, S.Pd.",
  "Agus Setiawan, S.T., M.T.",
  "Dewi Anggraini, S.Pd., M.Pd.",
  "Eko Susanto, S.Pd.",
] as const

function pickNilai(rng: () => number): number {
  const r = rng()
  if (r < 0.3) return randFloat(85, 95, rng, 1)
  if (r < 0.85) return randFloat(75, 85, rng, 1)
  return randFloat(65, 75, rng, 1)
}

export function seedNilaiPrakerin(
  db: Db,
  kelasIdByNama: Map<string, number>,
  tahunAjaranId: number,
): void {
  const KELAS_TKJ = ["XII TKJ A", "XII TKJ B"]
  const rng = createRng(66666)
  let stepIdx = 0
  let totalInserted = 0

  for (const kelasNama of KELAS_TKJ) {
    const kelasId = kelasIdByNama.get(kelasNama)
    if (!kelasId) continue
    const siswaList = db
      .select()
      .from(schema.siswa)
      .where(eq(schema.siswa.kelas_id, kelasId))
      .all()
    if (siswaList.length === 0) continue

    for (const siswa of siswaList) {
      // Idempotent
      const existing = db
        .select()
        .from(schema.nilaiPrakerin)
        .where(
          and(
            eq(schema.nilaiPrakerin.siswa_id, siswa.id),
            eq(schema.nilaiPrakerin.tahun_ajaran_id, tahunAjaranId),
          ),
        )
        .get()
      if (existing) continue

      const tpl = pickNilai(rng)
      const sl = pickNilai(rng)
      const sk = pickNilai(rng)
      const nilaiRapor = Number(((tpl + sl + sk) / 3).toFixed(2))
      const tp1Skor = pickNilai(rng)
      const tp2Skor = pickNilai(rng)
      const tempat = pickOne(TEMPAT_PRAKERIN, rng)
      const tglMulai = "2025-07-01"
      const tglSelesai = "2025-09-30"
      const pembimbingInstansi = pickOne(PEMBIMBING_INSTANSI, rng)
      const pembimbingSekolah = pickOne(PEMBIMBING_SEKOLAH, rng)
      const catatan = `Siswa melaksanakan prakerin di ${tempat} dengan hasil yang ${nilaiRapor >= 85 ? "sangat memuaskan" : nilaiRapor >= 75 ? "memuaskan" : "cukup"}.`

      db.insert(schema.nilaiPrakerin)
        .values({
          siswa_id: siswa.id,
          tahun_ajaran_id: tahunAjaranId,
          tpl,
          sl,
          sk,
          nilai_rapor: nilaiRapor,
          tp1_skor: tp1Skor,
          tp1_deskripsi: "Mampu mengkonfigurasi jaringan komputer dengan baik",
          tp2_skor: tp2Skor,
          tp2_deskripsi: "Mampu melakukan troubleshooting pada sistem jaringan",
          pembimbing_sekolah: pembimbingSekolah,
          pembimbing_instansi: pembimbingInstansi,
          tempat_prakerin: tempat,
          tgl_mulai: tglMulai,
          tgl_selesai: tglSelesai,
          catatan,
        })
        .run()
      totalInserted++

      // Also insert absensi_prakerin
      const existingAbsen = db
        .select()
        .from(schema.absensiPrakerin)
        .where(
          and(
            eq(schema.absensiPrakerin.siswa_id, siswa.id),
            eq(schema.absensiPrakerin.tahun_ajaran_id, tahunAjaranId),
          ),
        )
        .get()
      if (!existingAbsen) {
        const sakit = Math.floor(rng() * 4)
        const izin = Math.floor(rng() * 3)
        const tanpaKeterangan = rng() < 0.1 ? 1 : 0
        db.insert(schema.absensiPrakerin)
          .values({
            siswa_id: siswa.id,
            tahun_ajaran_id: tahunAjaranId,
            sakit,
            izin,
            tanpa_keterangan: tanpaKeterangan,
          })
          .run()
      }
    }
    stepIdx++
    logProgress(stepIdx, KELAS_TKJ.length, `prakerin ${kelasNama}`)
  }
  log(`  ✓ nilai_prakerin + absensi_prakerin (${totalInserted} new)`)
}
