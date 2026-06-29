import { z } from "zod"
import { AGAMA_OPTIONS } from "@/types/database"

/**
 * Schema validasi untuk seluruh entitas di aplikasi.
 * Dipakai di:
 * - FormDialog (validasi form di UI)
 * - IPC handlers (validasi payload dari renderer sebelum query DB)
 * - Export rapor / import data (validasi eksternal)
 *
 * Catatan konvensi:
 * - Field `id` / `created_at` tidak termasuk karena auto-generated
 * - Field nullable di schema DB → `nullable()` atau `.optional()` di Zod
 * - Validasi `unique` (misal NIS, kode_mapel) dicek di IPC handler, bukan di Zod
 */

// ===== AUTH =====
export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
})

export const changePasswordSchema = z.object({
  userId: z.number().int().positive(),
  oldPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
})

// ===== USERS =====
export const userRoleSchema = z.enum(["admin", "wali_kelas", "guru"])

// ===== TAHUN AJARAN =====
export const tahunAjaranSchema = z.object({
  nama: z.string().min(1, "Nama tahun ajaran wajib diisi").regex(/^\d{4}\/\d{4}$/, "Format harus YYYY/YYYY, contoh: 2025/2026"),
  semester: z.union([z.literal(1), z.literal(2)], { errorMap: () => ({ message: "Semester harus 1 atau 2" }) }),
  is_active: z.union([z.literal(0), z.literal(1)]).default(1),
})

// ===== GURU =====
export const guruSchema = z.object({
  nip: z.string().max(30).optional().nullable(),
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  bidang_studi: z.string().max(100).optional().nullable(),
})

// ===== KELAS =====
export const kelasSchema = z.object({
  nama_kelas: z.string().min(1, "Nama kelas wajib diisi").max(50),
  tingkat: z.union([z.literal(10), z.literal(11), z.literal(12)]),
  program_keahlian: z.string().max(50).optional().nullable(),
  wali_kelas_id: z.number().int().positive().optional().nullable(),
  tahun_ajaran_id: z.number().int().positive().optional().nullable(),
})

// ===== MATA PELAJARAN =====
// Note: `guru_id` di-drop (Step 7). Guru pengampu per (mapel, kelas, TA)
// ada di tabel junction `mapel_kelas_guru` (lihat mapel-assignment.handlers).
export const mataPelajaranSchema = z.object({
  kode_mapel: z.string().min(1, "Kode mapel wajib diisi").max(20).regex(/^[A-Z0-9_]+$/, "Kode mapel harus huruf besar, angka, atau underscore"),
  nama_mapel: z.string().min(1, "Nama mapel wajib diisi").max(100),
  jenis: z.enum(["reguler", "prakerin", "ketarunaan", "kokurikuler"]),
  kelompok: z.enum(["umum", "kejuruan", "muatan_lokal", "khusus"]).optional().nullable(),
  agama_target: z.enum(AGAMA_OPTIONS).optional().nullable(),
}).refine(
  (data) => data.jenis !== "reguler" || (data.kelompok != null && data.kelompok !== ""),
  { message: "Mapel reguler wajib memiliki kelompok", path: ["kelompok"] },
).refine(
  (data) => data.agama_target == null || data.agama_target === "" || data.jenis === "reguler",
  { message: "agama_target hanya untuk mapel jenis reguler", path: ["agama_target"] },
)

// ===== SISWA =====
const phoneRegex = /^[0-9+\-\s()]*$/
const nisRegex = /^[0-9]{4,20}$/

export const siswaSchema = z.object({
  nis: z.string().regex(nisRegex, "NIS harus 4-20 digit angka"),
  nisn: z.string().max(20).optional().nullable(),
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  kelas_id: z.number({ required_error: "Kelas wajib dipilih", invalid_type_error: "Kelas wajib dipilih" }).int().positive("Kelas wajib dipilih"),
  jurusan: z.string().max(50).optional().nullable(),
  tempat_lahir: z.string().max(50).optional().nullable(),
  tanggal_lahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD").optional().nullable().or(z.literal("")),
  jenis_kelamin: z.enum(["Laki-Laki", "Perempuan"], { required_error: "Jenis kelamin wajib dipilih" }),
  agama: z.enum(AGAMA_OPTIONS).optional().nullable(),
  alamat: z.string().max(500).optional().nullable(),
  no_hp: z.string().regex(phoneRegex, "No HP tidak valid").max(20).optional().nullable().or(z.literal("")),
  no_hp_ortu: z.string().regex(phoneRegex, "No HP ortu tidak valid").max(20).optional().nullable().or(z.literal("")),
  nama_ayah: z.string().max(100).optional().nullable(),
  pekerjaan_ayah: z.string().max(50).optional().nullable(),
  nama_ibu: z.string().max(100).optional().nullable(),
  pekerjaan_ibu: z.string().max(50).optional().nullable(),
  nama_wali: z.string().max(100).optional().nullable(),
  pendidikan_wali: z.string().max(50).optional().nullable(),
  pekerjaan_wali: z.string().max(50).optional().nullable(),
  alamat_wali: z.string().max(500).optional().nullable(),
  anak_ke: z.number().int().min(1).max(20).optional().nullable(),
  jlh_sdr_kandung: z.number().int().min(0).max(20).optional().nullable(),
  status: z.enum(["aktif", "tidak_aktif"]).default("aktif"),
})

// ===== ABSENSI =====
export const statusAbsensiSchema = z.enum(["H", "DL", "S", "I", "TK"])

export const absensiItemSchema = z.object({
  siswaId: z.number().int().positive(),
  kelasId: z.number().int().positive(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  jamPelajaran: z.number().int().min(1).max(10),
  status: statusAbsensiSchema,
})

export const absensiSaveSchema = z.array(absensiItemSchema).min(1, "Minimal 1 data absensi")

// ===== TUJUAN PEMBELAJARAN =====
export const tujuanPembelajaranSchema = z.object({
  mapel_id: z.number().int().positive(),
  kode_tp: z.string().min(1, "Kode TP wajib diisi").max(20),
  deskripsi_tuntas: z.string().min(1, "Deskripsi tuntas wajib diisi").max(1000),
  deskripsi_remediasi: z.string().min(1, "Deskripsi remediasi wajib diisi").max(1000),
  tahun_ajaran_id: z.number().int().positive(),
})

// ===== NILAI MAPEL REGULER =====
export const capaianTpSchema = z.enum(["T", "R"])

const nilaiRange = z.number().min(0, "Nilai minimal 0").max(100, "Nilai maksimal 100")

export const nilaiSaveItemSchema = z.object({
  siswaId: z.number().int().positive(),
  mapelId: z.number().int().positive(),
  tahunAjaranId: z.number().int().positive(),
  nilaiFormatif: nilaiRange.nullable().optional(),
  nilaiSumatif: nilaiRange.nullable().optional(),
  tpCapaian: z.array(z.object({
    tp_id: z.number().int().positive(),
    capaian: capaianTpSchema,
  })).optional(),
})

export const nilaiSaveSchema = z.array(nilaiSaveItemSchema).min(1, "Minimal 1 data nilai")

// ===== NILAI PRAKERIN =====
export const nilaiPrakerinSchema = z.object({
  siswaId: z.number().int().positive(),
  tahunAjaranId: z.number().int().positive(),
  tpl: nilaiRange.nullable().optional(),
  sl: nilaiRange.nullable().optional(),
  sk: nilaiRange.nullable().optional(),
  tp1_skor: nilaiRange.nullable().optional(),
  tp1_deskripsi: z.string().max(1000).optional().nullable(),
  tp2_skor: nilaiRange.nullable().optional(),
  tp2_deskripsi: z.string().max(1000).optional().nullable(),
  pembimbing_sekolah: z.string().max(100).optional().nullable(),
  pembimbing_instansi: z.string().max(100).optional().nullable(),
  tempat_prakerin: z.string().max(200).optional().nullable(),
  tgl_mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD").optional().nullable().or(z.literal("")),
  tgl_selesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD").optional().nullable().or(z.literal("")),
  catatan: z.string().max(1000).optional().nullable(),
  absensi: z.object({
    sakit: z.number().int().min(0).default(0),
    izin: z.number().int().min(0).default(0),
    tanpa_keterangan: z.number().int().min(0).default(0),
  }).optional(),
})

// ===== NILAI KETARUNAAN =====
export const nilaiKetarunaanSchema = z.object({
  siswaId: z.number().int().positive(),
  tahunAjaranId: z.number().int().positive(),
  predikat: z.enum(["A", "B", "C", "D"], { errorMap: () => ({ message: "Predikat harus A/B/C/D" }) }),
  keterangan: z.string().max(500).optional().nullable(),
})

// ===== NILAI EKSKUL =====
export const nilaiEkskulSchema = z.object({
  siswaId: z.number().int().positive(),
  ekskulId: z.number().int().positive(),
  tahunAjaranId: z.number().int().positive(),
  predikat: z.enum(["A", "B", "C", "D"], { errorMap: () => ({ message: "Predikat harus A/B/C/D" }) }),
  keterangan: z.string().max(500).optional().nullable(),
})

// ===== NILAI KOKURIKULER (P5) =====
export const gradeKokurikulerSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

export const nilaiKokurikulerItemSchema = z.object({
  subdimensiId: z.number().int().positive(),
  grade: gradeKokurikulerSchema,
})

export const nilaiKokurikulerSaveSchema = z.object({
  siswaId: z.number().int().positive(),
  tahunAjaranId: z.number().int().positive(),
  grades: z.array(nilaiKokurikulerItemSchema).min(1),
})

// ===== CATATAN WALI KELAS =====
export const catatanWaliKelasSchema = z.object({
  siswaId: z.number().int().positive(),
  tahunAjaranId: z.number().int().positive(),
  catatan: z.string().min(1, "Catatan tidak boleh kosong").max(2000),
})

// ===== KONFIGURASI =====
export const konfigurasiSchema = z.object({
  JAM_PER_HARI: z.coerce.number().int().min(1).max(12),
  BOBOT_FORMATIF: z.coerce.number().min(0).max(1),
  BOBOT_SUMATIF: z.coerce.number().min(0).max(1),
  KONVENSI_JAM_HARI: z.enum(["pembulatan", "floor", "ceil"]),
})

// ===== INFO SEKOLAH =====
export const infoSekolahSchema = z.object({
  nama: z.string().min(1, "Nama sekolah wajib diisi").max(200),
  alamat: z.string().max(500).optional().nullable(),
  tempat: z.string().max(100).optional().nullable(),
  kepala_sekolah: z.string().max(100).optional().nullable(),
  npsn: z.string().regex(/^[0-9]{8}$/, "NPSN harus 8 digit angka").optional().nullable().or(z.literal("")),
})

// ===== EXPORT TYPES =====
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type TahunAjaranInput = z.infer<typeof tahunAjaranSchema>
export type GuruInput = z.infer<typeof guruSchema>
export type KelasInput = z.infer<typeof kelasSchema>
export type MataPelajaranInput = z.infer<typeof mataPelajaranSchema>
export type SiswaInput = z.infer<typeof siswaSchema>
export type AbsensiItemInput = z.infer<typeof absensiItemSchema>
export type TujuanPembelajaranInput = z.infer<typeof tujuanPembelajaranSchema>
export type NilaiSaveItemInput = z.infer<typeof nilaiSaveItemSchema>
export type NilaiPrakerinInput = z.infer<typeof nilaiPrakerinSchema>
export type NilaiKetarunaanInput = z.infer<typeof nilaiKetarunaanSchema>
export type NilaiEkskulInput = z.infer<typeof nilaiEkskulSchema>
export type NilaiKokurikulerSaveInput = z.infer<typeof nilaiKokurikulerSaveSchema>
export type CatatanWaliKelasInput = z.infer<typeof catatanWaliKelasSchema>
export type KonfigurasiInput = z.infer<typeof konfigurasiSchema>
export type InfoSekolahInput = z.infer<typeof infoSekolahSchema>

/**
 * Helper: format Zod errors ke format yang mudah ditampilkan.
 * Returns: { fieldName: "error message" }
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join(".")
    if (!errors[path]) {
      errors[path] = issue.message
    }
  }
  return errors
}

/**
 * Helper: validasi data dengan schema, return { success, data, errors }.
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
):
  | { success: true; data: z.infer<T> }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: formatZodErrors(result.error) }
}
