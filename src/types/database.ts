import type { InferSelectModel, InferInsertModel } from "drizzle-orm"
import {
  users,
  tahunAjaran,
  guru,
  kelas,
  mataPelajaran,
  siswa,
  absensi,
  tujuanPembelajaran,
  nilai,
  nilaiTp,
  nilaiPrakerin,
  absensiPrakerin,
  nilaiKetarunaan,
  ekskul,
  nilaiEkskul,
  dimensiP5,
  subdimensiP5,
  nilaiKokurikuler,
  catatanWaliKelas,
  infoSekolah,
  konfigurasi,
  syncLog,
} from "@/lib/db/schema"

/**
 * Type untuk row yang sudah ada di database (SELECT * FROM ...).
 * Gunakan untuk data yang diterima dari IPC handler (GET).
 */
export type Select = {
  User: InferSelectModel<typeof users>
  TahunAjaran: InferSelectModel<typeof tahunAjaran>
  Guru: InferSelectModel<typeof guru>
  Kelas: InferSelectModel<typeof kelas>
  MataPelajaran: InferSelectModel<typeof mataPelajaran>
  Siswa: InferSelectModel<typeof siswa>
  Absensi: InferSelectModel<typeof absensi>
  TujuanPembelajaran: InferSelectModel<typeof tujuanPembelajaran>
  Nilai: InferSelectModel<typeof nilai>
  NilaiTp: InferSelectModel<typeof nilaiTp>
  NilaiPrakerin: InferSelectModel<typeof nilaiPrakerin>
  AbsensiPrakerin: InferSelectModel<typeof absensiPrakerin>
  NilaiKetarunaan: InferSelectModel<typeof nilaiKetarunaan>
  Ekskul: InferSelectModel<typeof ekskul>
  NilaiEkskul: InferSelectModel<typeof nilaiEkskul>
  DimensiP5: InferSelectModel<typeof dimensiP5>
  SubdimensiP5: InferSelectModel<typeof subdimensiP5>
  NilaiKokurikuler: InferSelectModel<typeof nilaiKokurikuler>
  CatatanWaliKelas: InferSelectModel<typeof catatanWaliKelas>
  InfoSekolah: InferSelectModel<typeof infoSekolah>
  Konfigurasi: InferSelectModel<typeof konfigurasi>
  SyncLog: InferSelectModel<typeof syncLog>
}

/**
 * Type untuk data yang akan di-INSERT ke database.
 * Gunakan untuk payload create operations.
 */
export type Insert = {
  User: InferInsertModel<typeof users>
  TahunAjaran: InferInsertModel<typeof tahunAjaran>
  Guru: InferInsertModel<typeof guru>
  Kelas: InferInsertModel<typeof kelas>
  MataPelajaran: InferInsertModel<typeof mataPelajaran>
  Siswa: InferInsertModel<typeof siswa>
  Absensi: InferInsertModel<typeof absensi>
  TujuanPembelajaran: InferInsertModel<typeof tujuanPembelajaran>
  Nilai: InferInsertModel<typeof nilai>
  NilaiTp: InferInsertModel<typeof nilaiTp>
  NilaiPrakerin: InferInsertModel<typeof nilaiPrakerin>
  AbsensiPrakerin: InferInsertModel<typeof absensiPrakerin>
  NilaiKetarunaan: InferInsertModel<typeof nilaiKetarunaan>
  Ekskul: InferInsertModel<typeof ekskul>
  NilaiEkskul: InferInsertModel<typeof nilaiEkskul>
  DimensiP5: InferInsertModel<typeof dimensiP5>
  SubdimensiP5: InferInsertModel<typeof subdimensiP5>
  NilaiKokurikuler: InferInsertModel<typeof nilaiKokurikuler>
  CatatanWaliKelas: InferInsertModel<typeof catatanWaliKelas>
  InfoSekolah: InferInsertModel<typeof infoSekolah>
  Konfigurasi: InferInsertModel<typeof konfigurasi>
  SyncLog: InferInsertModel<typeof syncLog>
}

/**
 * Enum-like types untuk field dengan constraint CHECK.
 */
export type UserRole = "admin" | "wali_kelas" | "guru"
export type Semester = 1 | 2
export type Tingkat = 10 | 11 | 12
export type JenisMapel = "reguler" | "prakerin" | "ketarunaan" | "kokurikuler"
export type KelompokMapel = "umum" | "kejuruan" | "muatan_lokal" | "khusus"
export type JenisKelamin = "Laki-Laki" | "Perempuan"
export type StatusSiswa = "aktif" | "tidak_aktif"
export type StatusAbsensi = "H" | "DL" | "S" | "I" | "TK"
export type CapaianTp = "T" | "R"
export type SyncAction = "insert" | "update" | "delete"
export type SyncStatus = "success" | "failed" | "pending"
export type GradeKokurikuler = 1 | 2 | 3
export type ProgramKeahlian = "RPL" | "TKJ" | "Penerbangan" | "Ketarunaan"

/**
 * Konstanta enum untuk validasi dan dropdown options.
 */
export const AGAMA_OPTIONS = [
  "ISLAM",
  "KRISTEN PROTESTAN",
  "KATOLIK",
  "HINDU",
  "BUDDHA",
  "KONGHUCU",
] as const
export type Agama = (typeof AGAMA_OPTIONS)[number]

export const KODE_MAPEL_AGAMA: Record<Agama, string | null> = {
  ISLAM: "AGAMA_ISLAM",
  "KRISTEN PROTESTAN": "AGAMA_KRISTEN",
  KATOLIK: "AGAMA_KATOLIK",
  HINDU: "AGAMA_HINDU",
  BUDDHA: "AGAMA_BUDDHA",
  KONGHUCU: "AGAMA_KONGHUCU",
}
