import type { Select } from "./database"

/**
 * Data nilai mapel reguler (gabungan dari tabel nilai + nilai_tp + tujuan_pembelajaran).
 * Digunakan di: Input Nilai, Rekap Nilai, Generate Rapor, Ranking.
 */
export type NilaiMapelReguler = {
  siswa_id: number
  nama: string
  nilai_formatif: number | null
  nilai_sumatif: number | null
  nilai_rapor: number | null
  deskripsi: string
  tp_capaian: TpCapaian[]
}

export type TpCapaian = {
  tp_id: number
  kode_tp: string
  capaian: "" | "T" | "R"
}

/**
 * Detail satu Tujuan Pembelajaran.
 */
export type TujuanPembelajaranDetail = Select.TujuanPembelajaran

/**
 * Data nilai prakerin per siswa.
 * Digunakan di: Halaman Prakerin, Generate Rapor Prakerin.
 */
export type NilaiPrakerinSiswa = {
  siswa_id: number
  nama: string
  tpl: number | null
  sl: number | null
  sk: number | null
  nilai_rapor: number | null
  tp1_skor: number | null
  tp1_deskripsi: string
  tp2_skor: number | null
  tp2_deskripsi: string
  pembimbing_sekolah: string
  pembimbing_instansi: string
  tempat_prakerin: string
  tgl_mulai: string
  tgl_selesai: string
  catatan: string
  absensi: {
    sakit: number
    izin: number
    tanpa_keterangan: number
  }
}

/**
 * Data nilai ketarunaan per siswa.
 * Digunakan di: Halaman Ketarunaan, Generate Rapor.
 */
export type NilaiKetarunaanSiswa = {
  siswa_id: number
  nama: string
  predikat: string
  keterangan: string
}

/**
 * Data nilai ekskul per siswa.
 * Digunakan di: Halaman Ekskul, Generate Rapor.
 */
export type NilaiEkskulSiswa = {
  siswa_id: number
  nama: string
  ekskul: {
    ekskul_id: number
    nama_ekskul: string
    predikat: string
    keterangan: string
  }[]
}

/**
 * Data nilai kokurikuler (P5) per siswa.
 * Digunakan di: Halaman Kokurikuler, Generate Rapor.
 */
export type NilaiKokurikulerSiswa = {
  siswa_id: number
  dimensi: {
    dimensi_id: number
    nama: string
    subdimensi: {
      subdimensi_id: number
      nama: string
      grade: number | null
      deskripsi_berkembang: string | null
      deskripsi_cakap: string | null
      deskripsi_mahir: string | null
    }[]
  }[]
}

/**
 * Catatan wali kelas.
 */
export type CatatanWaliKelas = {
  siswa_id: number
  tahun_ajaran_id: number
  catatan: string
}

/**
 * Predikat dengan deskripsi singkat (untuk rapor).
 */
export type PredikatDeskripsi = {
  kode: string
  label: string
  deskripsi: string
}

export const PREDIKAT_OPTIONS: Record<string, PredikatDeskripsi> = {
  A: { kode: "A", label: "A", deskripsi: "Sangat Baik" },
  B: { kode: "B", label: "B", deskripsi: "Baik" },
  C: { kode: "C", label: "C", deskripsi: "Cukup" },
  D: { kode: "D", label: "D", deskripsi: "Perlu Bimbingan" },
}

/**
 * Grade P5 dengan label dan deskripsi.
 */
export const GRADE_P5_OPTIONS: Record<1 | 2 | 3, { label: string; deskripsi: string }> = {
  1: { label: "Berkembang", deskripsi: "Mulai memahami konsep, perlu bimbingan lanjut" },
  2: { label: "Cakap", deskripsi: "Memahami konsep dengan baik" },
  3: { label: "Mahir", deskripsi: "Menguasai konsep dengan sangat baik" },
}
