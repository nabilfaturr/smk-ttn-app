import type { Select, Agama } from "@/types/database"
import { KODE_MAPEL_AGAMA } from "@/types/database"

/**
 * Pemetaan mapel Agama untuk siswa.
 *
 * Di kurikulum Indonesia, mata pelajaran Agama **berbeda** untuk setiap
 * siswa tergantung agamanya:
 *   - Siswa Islam → Pendidikan Agama Islam
 *   - Siswa Kristen Protestan → Pendidikan Agama Kristen
 *   - Siswa Katolik → Pendidikan Agama Katolik
 *   - dst.
 *
 * Aturan ini diimplementasikan dengan kolom `agama_target` di tabel
 * `mata_pelajaran` (diisi dengan kode_mapel dari KODE_MAPEL_AGAMA).
 *
 * File ini menyediakan helper untuk:
 * 1. Mencari mapel Agama yang sesuai untuk satu siswa
 * 2. Filter semua mapel untuk satu siswa (exclude mapel Agama yang tidak sesuai)
 * 3. Sort mapel sehingga mapel Agama muncul duluan (UX untuk input nilai)
 */

type MataPelajaran = Select.MataPelajaran

/**
 * Cek apakah sebuah mapel adalah mapel Agama (memiliki agama_target).
 */
export function isMapelAgama(mapel: MataPelajaran): boolean {
  return !!mapel.agama_target && mapel.agama_target.length > 0
}

/**
 * Ambil mapel Agama yang sesuai untuk siswa berdasarkan agamanya.
 *
 * @param siswaAgama - Agama siswa (contoh: "ISLAM", "KRISTEN PROTESTAN")
 * @param allMapel - Semua mapel yang tersedia di database
 * @returns Mapel Agama yang sesuai, atau `null` jika belum ada/tidak ada
 *
 * @example
 * getMapelAgamaForSiswa("ISLAM", allMapel)
 * // → { id: 1, kode_mapel: "AGAMA_ISLAM", nama_mapel: "Pendidikan Agama Islam", ... }
 */
export function getMapelAgamaForSiswa(
  siswaAgama: string | null | undefined,
  allMapel: MataPelajaran[],
): MataPelajaran | null {
  if (!siswaAgama) return null
  const kodeAgama = KODE_MAPEL_AGAMA[siswaAgama as Agama]
  if (!kodeAgama) {
    console.warn(`[mapel-agama] Agama tidak dikenali: "${siswaAgama}". Periksa konstanta KODE_MAPEL_AGAMA.`)
    return null
  }
  return allMapel.find((m) => m.kode_mapel === kodeAgama) ?? null
}

/**
 * Filter mapel yang relevan untuk satu siswa.
 *
 * Aturan:
 * - Mapel non-Agama (agama_target == null) → selalu untuk semua siswa
 * - Mapel Agama (agama_target != null) → hanya untuk siswa dengan agama yang sesuai
 *
 * @example
 * filterMapelForSiswa(siswaIslam, allMapel)
 * // → [mapelUmum, mapelKejuruan, mapelAgamaIslam, ...]
 * // (exclude mapel Agama Kristen, Katolik, dll)
 */
export function filterMapelForSiswa(
  siswa: { agama: string | null | undefined },
  allMapel: MataPelajaran[],
): MataPelajaran[] {
  if (!siswa.agama) {
    // Siswa tanpa agama → hanya mapel non-Agama
    return allMapel.filter((m) => !isMapelAgama(m))
  }

  const kodeAgamaSiswa = KODE_MAPEL_AGAMA[siswa.agama as Agama]
  return allMapel.filter((m) => {
    // Mapel non-Agama → selalu include
    if (!isMapelAgama(m)) return true
    // Mapel Agama → include hanya jika sesuai
    return m.kode_mapel === kodeAgamaSiswa
  })
}

/**
 * Sort mapel untuk tampilan/input nilai.
 * Urutan: Agama dulu (jika ada), lalu kelompok (umum, kejuruan, muatan_lokal, khusus), lalu nama.
 */
export function sortMapelForInput(mapelList: MataPelajaran[]): MataPelajaran[] {
  const KELOMPOK_ORDER: Record<string, number> = {
    umum: 1,
    kejuruan: 2,
    muatan_lokal: 3,
    khusus: 4,
  }
  return [...mapelList].sort((a, b) => {
    // Agama dulu
    if (isMapelAgama(a) && !isMapelAgama(b)) return -1
    if (!isMapelAgama(a) && isMapelAgama(b)) return 1
    // Lalu kelompok
    const ka = KELOMPOK_ORDER[a.kelompok ?? ""] ?? 99
    const kb = KELOMPOK_ORDER[b.kelompok ?? ""] ?? 99
    if (ka !== kb) return ka - kb
    // Lalu nama
    return a.nama_mapel.localeCompare(b.nama_mapel)
  })
}

/**
 * Group mapel berdasarkan kelompok (untuk tampilan rapor).
 * Returns: { umum: [...], kejuruan: [...], muatan_lokal: [...], khusus: [...] }
 */
export function groupMapelByKelompok(
  mapelList: MataPelajaran[],
): Record<string, MataPelajaran[]> {
  const groups: Record<string, MataPelajaran[]> = {
    umum: [],
    kejuruan: [],
    muatan_lokal: [],
    khusus: [],
    lain: [],
  }
  for (const m of mapelList) {
    const key = m.kelompok ?? "lain"
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return groups
}

/**
 * Filter mapel yang diajarkan oleh satu guru.
 *
 * Membutuhkan data junction (mapel_kelas_guru) — bukan dari `mata_pelajaran.guru_id`
 * yang sudah di-deprecated. assignments berisi array dari
 * `mapelAssignment:getByGuru`:
 *   [{ mapel_id, mapel_kode, mapel_nama, kelas_id, kelas_nama, ... }]
 *
 * @example
 * filterMapelByGuru(allMapel, assignments, currentGuruId)
 * // → [mapel1, mapel2, ...] (hanya yang diajar guru ini di TA aktif)
 */
export function filterMapelByGuru(
  mapelList: MataPelajaran[],
  assignments: { mapel_id: number }[],
  guruId: number | null | undefined,
): MataPelajaran[] {
  if (!guruId) return mapelList
  const taughtMapelIds = new Set(assignments.map((a) => a.mapel_id))
  return mapelList.filter((m) => taughtMapelIds.has(m.id))
}

/**
 * Daftar agama yang didukung (untuk dropdown/validasi).
 */
export const DAFTAR_AGAMA = [
  { value: "ISLAM", label: "Islam" },
  { value: "KRISTEN PROTESTAN", label: "Kristen Protestan" },
  { value: "KATOLIK", label: "Katolik" },
  { value: "HINDU", label: "Hindu" },
  { value: "BUDDHA", label: "Buddha" },
  { value: "KONGHUCU", label: "Konghucu" },
] as const
