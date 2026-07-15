import { sqliteTable, text, integer, real, unique, index } from "drizzle-orm/sqlite-core"
import { generateId, getDeviceId } from "./ids"

/**
 * Schema SMK TTN (v2 — UUID-based).
 *
 * Perubahan dari v1:
 * - Semua `id`: integer auto-increment → text UUID (anti BUG-07 ID collision)
 * - Semua FK references: integer → text
 * - Tambah `updated_at` di semua tabel (untuk last-write-wins conflict resolution)
 * - Tambah `device_id` di tabel transaksional (tracking asal data per device)
 *
 * Migration strategy: fresh start (sesuai keputusan user). Drop existing DB,
 * re-seed via `npm run db:fresh:full`.
 */

// 1. users
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  kode_login: text("kode_login"),
  created_at: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 2. tahun_ajaran
export const tahunAjaran = sqliteTable("tahun_ajaran", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  nama: text("nama").notNull(),
  semester: integer("semester", { enum: [1, 2] }).notNull(),
  is_active: integer("is_active").notNull().default(1),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 3. guru
export const guru = sqliteTable("guru", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  nip: text("nip"),
  nama: text("nama").notNull(),
  bidang_studi: text("bidang_studi"),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 4. kelas
export const kelas = sqliteTable("kelas", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  nama_kelas: text("nama_kelas").notNull(),
  wali_kelas_id: text("wali_kelas_id").references(() => guru.id),
  tahun_ajaran_id: text("tahun_ajaran_id").references(() => tahunAjaran.id),
  tingkat: integer("tingkat", { enum: [10, 11, 12] }).notNull(),
  program_keahlian: text("program_keahlian"),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 5. mata_pelajaran
// Kolom `guru_id` di-drop di Step 7 (migration 0003). Sekarang guru pengampu
// per (mapel, kelas, TA) disimpan di tabel junction `mapelKelasGuru`.
export const mataPelajaran = sqliteTable("mata_pelajaran", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  kode_mapel: text("kode_mapel").notNull().unique(),
  nama_mapel: text("nama_mapel").notNull(),
  jenis: text("jenis", { enum: ["reguler", "prakerin", "ketarunaan", "kokurikuler"] }).notNull(),
  kelompok: text("kelompok", { enum: ["umum", "kejuruan", "muatan_lokal", "khusus"] }),
  agama_target: text("agama_target"),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 6. siswa
export const siswa = sqliteTable("siswa", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  nis: text("nis").notNull().unique(),
  nisn: text("nisn"),
  nama: text("nama").notNull(),
  kelas_id: text("kelas_id").references(() => kelas.id),
  jurusan: text("jurusan"),
  tempat_lahir: text("tempat_lahir"),
  tanggal_lahir: text("tanggal_lahir"),
  jenis_kelamin: text("jenis_kelamin", { enum: ["Laki-Laki", "Perempuan"] }),
  agama: text("agama"),
  alamat: text("alamat"),
  no_hp: text("no_hp"),
  no_hp_ortu: text("no_hp_ortu"),
  nama_ayah: text("nama_ayah"),
  pekerjaan_ayah: text("pekerjaan_ayah"),
  nama_ibu: text("nama_ibu"),
  pekerjaan_ibu: text("pekerjaan_ibu"),
  nama_wali: text("nama_wali"),
  pendidikan_wali: text("pendidikan_wali"),
  pekerjaan_wali: text("pekerjaan_wali"),
  alamat_wali: text("alamat_wali"),
  anak_ke: integer("anak_ke"),
  jlh_sdr_kandung: integer("jlh_sdr_kandung"),
  status: text("status", { enum: ["aktif", "tidak_aktif"] })
    .notNull()
    .default("aktif"),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 7. absensi (transaksional)
export const absensi = sqliteTable(
  "absensi",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    siswa_id: text("siswa_id")
      .notNull()
      .references(() => siswa.id),
    kelas_id: text("kelas_id")
      .notNull()
      .references(() => kelas.id),
    tanggal: text("tanggal").notNull(),
    status: text("status", { enum: ["H", "DL", "S", "I", "TK"] }).notNull(),
    jam_pelajaran: integer("jam_pelajaran").notNull().default(1),
    device_id: text("device_id")
      .notNull()
      .$defaultFn(() => getDeviceId()),
    created_at: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.siswa_id, table.kelas_id, table.tanggal, table.jam_pelajaran),
  }),
)

// 8. tujuan_pembelajaran
export const tujuanPembelajaran = sqliteTable(
  "tujuan_pembelajaran",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    mapel_id: text("mapel_id")
      .notNull()
      .references(() => mataPelajaran.id),
    kode_tp: text("kode_tp").notNull(),
    deskripsi_tuntas: text("deskripsi_tuntas").notNull(),
    deskripsi_remediasi: text("deskripsi_remediasi").notNull(),
    tahun_ajaran_id: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.mapel_id, table.kode_tp, table.tahun_ajaran_id),
  }),
)

// 9. nilai (transaksional)
export const nilai = sqliteTable(
  "nilai",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    siswa_id: text("siswa_id")
      .notNull()
      .references(() => siswa.id),
    mapel_id: text("mapel_id")
      .notNull()
      .references(() => mataPelajaran.id),
    tahun_ajaran_id: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id),
    nilai_formatif: real("nilai_formatif"),
    nilai_sumatif: real("nilai_sumatif"),
    nilai_rapor: real("nilai_rapor"),
    deskripsi: text("deskripsi"),
    device_id: text("device_id")
      .notNull()
      .$defaultFn(() => getDeviceId()),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.siswa_id, table.mapel_id, table.tahun_ajaran_id),
  }),
)

// 10. nilai_tp (transaksional)
export const nilaiTp = sqliteTable(
  "nilai_tp",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    nilai_id: text("nilai_id")
      .notNull()
      .references(() => nilai.id),
    tp_id: text("tp_id")
      .notNull()
      .references(() => tujuanPembelajaran.id),
    capaian: text("capaian", { enum: ["T", "R"] }).notNull(),
    device_id: text("device_id")
      .notNull()
      .$defaultFn(() => getDeviceId()),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.nilai_id, table.tp_id),
  }),
)

// 11. nilai_prakerin (transaksional)
export const nilaiPrakerin = sqliteTable(
  "nilai_prakerin",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    siswa_id: text("siswa_id")
      .notNull()
      .references(() => siswa.id),
    tahun_ajaran_id: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id),
    tpl: real("tpl"),
    sl: real("sl"),
    sk: real("sk"),
    nilai_rapor: real("nilai_rapor"),
    tp1_skor: real("tp1_skor"),
    tp1_deskripsi: text("tp1_deskripsi"),
    tp2_skor: real("tp2_skor"),
    tp2_deskripsi: text("tp2_deskripsi"),
    pembimbing_sekolah: text("pembimbing_sekolah"),
    pembimbing_instansi: text("pembimbing_instansi"),
    tempat_prakerin: text("tempat_prakerin"),
    tgl_mulai: text("tgl_mulai"),
    tgl_selesai: text("tgl_selesai"),
    catatan: text("catatan"),
    device_id: text("device_id")
      .notNull()
      .$defaultFn(() => getDeviceId()),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.siswa_id, table.tahun_ajaran_id),
  }),
)

// 12. absensi_prakerin (transaksional)
export const absensiPrakerin = sqliteTable(
  "absensi_prakerin",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    siswa_id: text("siswa_id")
      .notNull()
      .references(() => siswa.id),
    tahun_ajaran_id: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id),
    sakit: integer("sakit").notNull().default(0),
    izin: integer("izin").notNull().default(0),
    tanpa_keterangan: integer("tanpa_keterangan").notNull().default(0),
    device_id: text("device_id")
      .notNull()
      .$defaultFn(() => getDeviceId()),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.siswa_id, table.tahun_ajaran_id),
  }),
)

// 13. nilai_ketarunaan (transaksional, NOT synced per current EXCLUDED_TABLES)
export const nilaiKetarunaan = sqliteTable(
  "nilai_ketarunaan",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    siswa_id: text("siswa_id")
      .notNull()
      .references(() => siswa.id),
    tahun_ajaran_id: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id),
    predikat: text("predikat").notNull(),
    keterangan: text("keterangan"),
    device_id: text("device_id")
      .notNull()
      .$defaultFn(() => getDeviceId()),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.siswa_id, table.tahun_ajaran_id),
  }),
)

// 14. ekskul
export const ekskul = sqliteTable("ekskul", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  nama: text("nama").notNull(),
  wajib: integer("wajib").notNull().default(0),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 15. nilai_ekskul (transaksional)
export const nilaiEkskul = sqliteTable(
  "nilai_ekskul",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    siswa_id: text("siswa_id")
      .notNull()
      .references(() => siswa.id),
    ekskul_id: text("ekskul_id")
      .notNull()
      .references(() => ekskul.id),
    tahun_ajaran_id: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id),
    predikat: text("predikat").notNull(),
    keterangan: text("keterangan"),
    device_id: text("device_id")
      .notNull()
      .$defaultFn(() => getDeviceId()),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.siswa_id, table.ekskul_id, table.tahun_ajaran_id),
  }),
)

// 16. dimensi_p5
export const dimensiP5 = sqliteTable("dimensi_p5", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  nama: text("nama").notNull(),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 17. subdimensi_p5
export const subdimensiP5 = sqliteTable("subdimensi_p5", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  dimensi_id: text("dimensi_id")
    .notNull()
    .references(() => dimensiP5.id),
  nama: text("nama").notNull(),
  deskripsi_berkembang: text("deskripsi_berkembang"),
  deskripsi_cakap: text("deskripsi_cakap"),
  deskripsi_mahir: text("deskripsi_mahir"),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 17a. subdimensi_p5_tingkat (junction: subdimensi aktif untuk tingkat tertentu)
export const subdimensiP5Tingkat = sqliteTable(
  "subdimensi_p5_tingkat",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    subdimensi_id: text("subdimensi_id")
      .notNull()
      .references(() => subdimensiP5.id),
    tingkat: integer("tingkat", { enum: [10, 11, 12] }).notNull(),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.subdimensi_id, table.tingkat),
  }),
)

// 18. nilai_kokurikuler (transaksional)
export const nilaiKokurikuler = sqliteTable(
  "nilai_kokurikuler",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    siswa_id: text("siswa_id")
      .notNull()
      .references(() => siswa.id),
    subdimensi_id: text("subdimensi_id")
      .notNull()
      .references(() => subdimensiP5.id),
    tahun_ajaran_id: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id),
    grade: integer("grade", { enum: [1, 2, 3] }),
    device_id: text("device_id")
      .notNull()
      .$defaultFn(() => getDeviceId()),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.siswa_id, table.subdimensi_id, table.tahun_ajaran_id),
  }),
)

// 19. catatan_wali_kelas (transaksional)
export const catatanWaliKelas = sqliteTable(
  "catatan_wali_kelas",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    siswa_id: text("siswa_id")
      .notNull()
      .references(() => siswa.id),
    tahun_ajaran_id: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id),
    catatan: text("catatan").notNull(),
    device_id: text("device_id")
      .notNull()
      .$defaultFn(() => getDeviceId()),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.siswa_id, table.tahun_ajaran_id),
  }),
)

// 20. info_sekolah
export const infoSekolah = sqliteTable("info_sekolah", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  nama: text("nama").notNull(),
  alamat: text("alamat"),
  tempat: text("tempat"),
  kepala_sekolah: text("kepala_sekolah"),
  npsn: text("npsn"),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 21. konfigurasi
export const konfigurasi = sqliteTable("konfigurasi", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  kunci: text("kunci").notNull().unique(),
  nilai: text("nilai").notNull(),
  keterangan: text("keterangan"),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdateFn(() => new Date().toISOString()),
})

// 22. sync_log (meta, NOT synced)
//
// Index untuk query yang sering:
// - idx_sync_log_status_synced_at: cleanup query (status=success AND synced_at < ?)
// - idx_sync_log_status_next_retry: retry query (status=failed AND next_retry_at <= ?)
export const syncLog = sqliteTable(
  "sync_log",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    tabel: text("tabel").notNull(),
    record_id: text("record_id").notNull(),
    action: text("action", { enum: ["insert", "update", "delete"] }).notNull(),
    synced_at: text("synced_at").notNull(),
    status: text("status", { enum: ["success", "failed", "pending", "dead_letter"] }).notNull(),
    retry_count: integer("retry_count").notNull().default(0),
    next_retry_at: text("next_retry_at"),
    last_error: text("last_error"),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    statusSyncedAtIdx: index("idx_sync_log_status_synced_at").on(table.status, table.synced_at),
    statusNextRetryIdx: index("idx_sync_log_status_next_retry").on(table.status, table.next_retry_at),
  }),
)

// 23. mapel_kelas_guru (junction: guru pengampu per mapel per kelas per TA)
export const mapelKelasGuru = sqliteTable(
  "mapel_kelas_guru",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId()),
    mapel_id: text("mapel_id")
      .notNull()
      .references(() => mataPelajaran.id, { onDelete: "cascade" }),
    kelas_id: text("kelas_id")
      .notNull()
      .references(() => kelas.id, { onDelete: "cascade" }),
    guru_id: text("guru_id")
      .notNull()
      .references(() => guru.id, { onDelete: "cascade" }),
    tahun_ajaran_id: text("tahun_ajaran_id")
      .notNull()
      .references(() => tahunAjaran.id, { onDelete: "cascade" }),
    created_at: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_at: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdateFn(() => new Date().toISOString()),
  },
  (table) => ({
    uniqueIdx: unique().on(table.mapel_id, table.kelas_id, table.tahun_ajaran_id),
  }),
)
