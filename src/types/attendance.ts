import type { Select, StatusAbsensi } from "./database"

/**
 * Absensi harian satu siswa pada satu tanggal dan jam pelajaran.
 */
export type AbsensiSiswa = {
  siswa_id: number
  nama: string
  kelas_id: number
  tanggal: string
  jam_pelajaran: number
  status: StatusAbsensi
}

/**
 * Rekap absensi satu siswa dalam satu rentang waktu.
 * Total dihitung per siswa dari seluruh record absensi.
 */
export type RekapAbsensiSiswa = {
  siswa_id: number
  nama: string
  total_hadir: number
  total_dl: number
  total_s: number
  total_i: number
  total_tk: number
  total_jam: number
}

/**
 * Absensi untuk rapor (konversi jam ke hari).
 * Digunakan saat generate rapor akademik.
 */
export type AbsensiForReport = {
  sakit_hari: number
  izin_hari: number
  tanpa_keterangan_hari: number
  sakit_jam: number
  izin_jam: number
  tanpa_keterangan_jam: number
}

/**
 * Absensi prakerin (sudah dalam satuan hari).
 */
export type AbsensiPrakerin = {
  siswa_id: number
  tahun_ajaran_id: number
  sakit: number
  izin: number
  tanpa_keterangan: number
}

/**
 * Label dan warna untuk setiap status absensi.
 */
export const STATUS_ABSENSI_LABELS: Record<StatusAbsensi, string> = {
  H: "Hadir",
  DL: "Dinas Luar",
  S: "Sakit",
  I: "Izin",
  TK: "Tanpa Keterangan",
}

export const STATUS_ABSENSI_COLORS: Record<StatusAbsensi, string> = {
  H: "bg-green-100 text-green-800 border-green-300",
  DL: "bg-blue-100 text-blue-800 border-blue-300",
  S: "bg-yellow-100 text-yellow-800 border-yellow-300",
  I: "bg-purple-100 text-purple-800 border-purple-300",
  TK: "bg-red-100 text-red-800 border-red-300",
}

/**
 * Daftar jam pelajaran standar.
 */
export const JAM_PELAJARAN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const
export type JamPelajaran = (typeof JAM_PELAJARAN_OPTIONS)[number]

/**
 * Type guard untuk validasi input status absensi.
 */
export function isStatusAbsensi(value: string): value is StatusAbsensi {
  return value === "H" || value === "DL" || value === "S" || value === "I" || value === "TK"
}

/**
 * Tipe mentah dari database untuk absensi.
 */
export type AbsensiRow = Select.Absensi
