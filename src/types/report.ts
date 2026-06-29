import type { Select, StatusAbsensi } from "./database"
import type { AbsensiForReport, AbsensiPrakerin } from "./attendance"
import type { NilaiMapelReguler, NilaiPrakerinSiswa, NilaiKetarunaanSiswa, NilaiEkskulSiswa, NilaiKokurikulerSiswa, CatatanWaliKelas } from "./grades"

/**
 * Status kelengkapan data untuk generate rapor.
 */
export type StatusKelengkapan = "lengkap" | "kurang" | "tidak_lengkap"

export type CompletenessCheck = {
  siswa_id: number
  nama: string
  status: StatusKelengkapan
  missing_data: string[]
}

/**
 * Data lengkap yang dibutuhkan untuk generate rapor akademik.
 * Dikumpulkan di main process lalu dikirim ke PDF generator.
 */
export type RaporAkademikData = {
  info_sekolah: Select.InfoSekolah
  siswa: Select.Siswa & {
    nama_kelas: string
    tingkat: number
    program_keahlian: string | null
    nama_wali_kelas: string
  }
  tahun_ajaran: {
    id: number
    nama: string
    semester: 1 | 2
  }
  nilai_per_mapel: NilaiMapelReguler[]
  ranking: {
    rank: number
    jumlah_nilai: number
    total_siswa: number
  } | null
  absensi: AbsensiForReport
  kokurikuler: {
    narasi: string
  }
  ketarunaan: NilaiKetarunaanSiswa | null
  ekskul: NilaiEkskulSiswa | null
  catatan_wali_kelas: CatatanWaliKelas | null
  tanggal_cetak: string
  tempat_cetak: string
}

/**
 * Data lengkap yang dibutuhkan untuk generate rapor prakerin.
 */
export type RaporPrakerinData = {
  info_sekolah: Select.InfoSekolah
  siswa: Select.Siswa & {
    nama_kelas: string
  }
  tahun_ajaran: {
    id: number
    nama: string
    semester: 1 | 2
  }
  nilai_prakerin: Select.NilaiPrakerin
  absensi_prakerin: AbsensiPrakerin
  tanggal_cetak: string
  tempat_cetak: string
}

/**
 * Hasil generate rapor (file path).
 */
export type RaporGenerateResult = {
  siswa_id: number
  nama: string
  file_path: string
  success: boolean
  error?: string
}

/**
 * Konfigurasi rapor.
 */
export type RaporConfig = {
  jenis: "akademik" | "prakerin"
  kelas_id: number
  tahun_ajaran_id: number
  siswa_id?: number
  tempat_cetak?: string
}
