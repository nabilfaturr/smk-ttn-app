import { getDb } from "../db"
import { siswa, nilai, mataPelajaran } from "../db/schema"
import { eq, and } from "drizzle-orm"

export type RankingEntry = {
  siswa_id: string
  nama: string
  jumlah: number
  rank: number
}

export type RawScore = {
  siswa_id: string
  nama: string
  jumlah: number
}

/**
 * Pure function: assign rank ke siswa berdasarkan jumlah nilai (descending).
 *
 * Aturan ranking (standard competition ranking):
 * - Sort by `jumlah` descending
 * - Rank 1 = siswa dengan jumlah tertinggi
 * - Siswa dengan jumlah SAMA dapat rank SAMA
 * - Rank berikutnya setelah seri: skip (misal 1, 1, 3, 4)
 *
 * @example
 * assignRanks([{siswa_id:1, nama:'A', jumlah:300}, {siswa_id:2, nama:'B', jumlah:280}])
 * // → [{...rank:1}, {...rank:2}]
 */
export function assignRanks(scores: RawScore[]): RankingEntry[] {
  const sorted = [...scores].sort((a, b) => b.jumlah - a.jumlah)

  let currentRank = 1
  return sorted.map((s, i) => {
    if (i > 0 && s.jumlah < sorted[i - 1].jumlah) {
      currentRank = i + 1
    }
    return { ...s, rank: currentRank }
  })
}

/**
 * Hitung ranking siswa dalam satu kelas.
 * Memakai DB untuk query data nilai, lalu delegate ke assignRanks() untuk
 * logika ranking murni.
 */
export function calculateRanking(kelasId: string, tahunAjaranId: string): RankingEntry[] {
  const db = getDb()
  const siswaList = db
    .select()
    .from(siswa)
    .where(and(eq(siswa.kelas_id, kelasId), eq(siswa.status, "aktif")))
    .all()

  const mapelList = db
    .select()
    .from(mataPelajaran)
    .where(eq(mataPelajaran.jenis, "reguler"))
    .all()

  const scores: RawScore[] = []

  for (const s of siswaList) {
    let total = 0
    for (const m of mapelList) {
      const n = db
        .select()
        .from(nilai)
        .where(
          and(
            eq(nilai.siswa_id, s.id),
            eq(nilai.mapel_id, m.id),
            eq(nilai.tahun_ajaran_id, tahunAjaranId),
          ),
        )
        .get()
      if (n?.nilai_rapor != null) {
        total += n.nilai_rapor
      }
    }
    scores.push({ siswa_id: s.id, nama: s.nama, jumlah: total })
  }

  return assignRanks(scores)
}
