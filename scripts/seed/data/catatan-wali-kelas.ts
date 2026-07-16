/**
 * Seed: catatan_wali_kelas.
 *
 * Generate 1 catatan narasi per siswa di SEMUA kelas (X, XI, XII).
 * Template narasi: kekuatan, pengembangan, saran.
 * Coverage: 270 siswa (9 kelas × 30 siswa) = 270 records.
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createRng, log, logProgress, pickOne } from "../helpers"

const KEKUATAN = [
  "aktif bertanya di kelas",
  "rajin mengumpulkan tugas tepat waktu",
  "mampu bekerja sama dengan baik dalam kelompok",
  "memiliki kemampuan analisis yang baik",
  "unjuk kerja yang sangat baik dalam praktikum",
  "mampu memimpin diskusi kelompok dengan baik",
  "memiliki inisiatif tinggi dalam belajar",
  "konsisten dalam menjaga kehadiran",
  "dapat mengoperasikan komputer dengan sangat baik",
  "mampu menyelesaikan soal-soal yang sulit",
]

const PENGEMBANGAN = [
  "perlu meningkatkan kedisiplinan dalam mengumpulkan tugas",
  "harus lebih aktif dalam bertanya dan berpendapat",
  "perlu meningkatkan kemampuan komunikasi di depan kelas",
  "kurang fokus dalam pembelajaran online",
  "perlu meningkatkan pemahaman konsep dasar",
  "sering terlambat masuk kelas",
  "perlu lebih giat dalam latihan soal",
  "kurang percaya diri dalam presentasi",
  "perlu meningkatkan kemampuan menulis",
  "sering tidak membawa alat tulis lengkap",
]

const SARAN = [
  "Tingkatkan terus belajar dan jangan cepat puas dengan pencapaian.",
  "Manfaatkan waktu luang untuk membaca buku-buku yang bermanfaat.",
  "Jaga kesehatan dan tetap semangat dalam belajar.",
  "Terus berlatih soal-soal ujian untuk mempersiapkan diri.",
  "Aktiflah bertanya kepada guru jika ada materi yang belum dipahami.",
  "Ikutilah kegiatan ekstrakurikuler untuk mengasah soft skill.",
  "Jaga komunikasi yang baik dengan orang tua dan guru.",
  "Manfaatkan teknologi untuk belajar hal-hal baru yang positif.",
]

const ALL_KELAS = [
  "X RPL 1", "X RPL 2", "X TKJ 1",
  "XI RPL", "XI TKJ A", "XI TKJ B",
  "XII RPL", "XII TKJ A", "XII TKJ B",
]

export function seedCatatanWaliKelas(
  db: Db,
  kelasIdByNama: Map<string, number>,
  tahunAjaranId: number,
): void {
  const rng = createRng(55555)
  let stepIdx = 0
  let totalInserted = 0

  for (const kelasNama of ALL_KELAS) {
    const kelasId = kelasIdByNama.get(kelasNama)
    if (!kelasId) continue
    const siswaList = db
      .select()
      .from(schema.siswa)
      .where(eq(schema.siswa.kelas_id, kelasId))
      .all()
    if (siswaList.length === 0) continue

    for (const siswa of siswaList) {
      const existing = db
        .select()
        .from(schema.catatanWaliKelas)
        .where(
          and(
            eq(schema.catatanWaliKelas.siswa_id, siswa.id),
            eq(schema.catatanWaliKelas.tahun_ajaran_id, tahunAjaranId),
          ),
        )
        .get()
      if (existing) continue

      const kekuatan = pickOne(KEKUATAN, rng)
      const pengembangan = pickOne(PENGEMBANGAN, rng)
      const saran = pickOne(SARAN, rng)
      const catatan = `Ananda ${siswa.nama.split(" ")[0]} menunjukkan sikap yang ${kekuatan}, namun masih ${pengembangan}. ${saran}`

      db.insert(schema.catatanWaliKelas)
        .values({
          siswa_id: siswa.id,
          tahun_ajaran_id: tahunAjaranId,
          catatan,
        })
        .run()
      totalInserted++
    }
    stepIdx++
    logProgress(stepIdx, ALL_KELAS.length, `catatan ${kelasNama}`)
  }
  log(`  ✓ catatan_wali_kelas (${totalInserted} new)`)
}
