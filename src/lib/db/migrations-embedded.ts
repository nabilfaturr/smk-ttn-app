export interface Migration {
  name: string
  sql: string
}

export const migrations: Migration[] = [
  {
    name: "0000_modern_dorian_gray",
    sql: `CREATE TABLE \`absensi\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`siswa_id\` integer NOT NULL,
	\`kelas_id\` integer NOT NULL,
	\`tanggal\` text NOT NULL,
	\`status\` text NOT NULL,
	\`jam_pelajaran\` integer DEFAULT 1 NOT NULL,
	\`created_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (\`siswa_id\`) REFERENCES \`siswa\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`kelas_id\`) REFERENCES \`kelas\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`absensi_siswa_id_kelas_id_tanggal_jam_pelajaran_unique\` ON \`absensi\` (\`siswa_id\`,\`kelas_id\`,\`tanggal\`,\`jam_pelajaran\`);--> statement-breakpoint
CREATE TABLE \`absensi_prakerin\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`siswa_id\` integer NOT NULL,
	\`tahun_ajaran_id\` integer NOT NULL,
	\`sakit\` integer DEFAULT 0 NOT NULL,
	\`izin\` integer DEFAULT 0 NOT NULL,
	\`tanpa_keterangan\` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (\`siswa_id\`) REFERENCES \`siswa\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`tahun_ajaran_id\`) REFERENCES \`tahun_ajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`absensi_prakerin_siswa_id_tahun_ajaran_id_unique\` ON \`absensi_prakerin\` (\`siswa_id\`,\`tahun_ajaran_id\`);--> statement-breakpoint
CREATE TABLE \`catatan_wali_kelas\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`siswa_id\` integer NOT NULL,
	\`tahun_ajaran_id\` integer NOT NULL,
	\`catatan\` text NOT NULL,
	FOREIGN KEY (\`siswa_id\`) REFERENCES \`siswa\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`tahun_ajaran_id\`) REFERENCES \`tahun_ajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`catatan_wali_kelas_siswa_id_tahun_ajaran_id_unique\` ON \`catatan_wali_kelas\` (\`siswa_id\`,\`tahun_ajaran_id\`);--> statement-breakpoint
CREATE TABLE \`dimensi_p5\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`nama\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`ekskul\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`nama\` text NOT NULL,
	\`wajib\` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`guru\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`user_id\` integer NOT NULL,
	\`nip\` text,
	\`nama\` text NOT NULL,
	\`bidang_studi\` text,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`info_sekolah\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`nama\` text NOT NULL,
	\`alamat\` text,
	\`tempat\` text,
	\`kepala_sekolah\` text,
	\`npsn\` text
);
--> statement-breakpoint
CREATE TABLE \`kelas\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`nama_kelas\` text NOT NULL,
	\`wali_kelas_id\` integer,
	\`tahun_ajaran_id\` integer,
	\`tingkat\` integer NOT NULL,
	\`program_keahlian\` text,
	FOREIGN KEY (\`wali_kelas_id\`) REFERENCES \`guru\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`tahun_ajaran_id\`) REFERENCES \`tahun_ajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`konfigurasi\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`kunci\` text NOT NULL,
	\`nilai\` text NOT NULL,
	\`keterangan\` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`konfigurasi_kunci_unique\` ON \`konfigurasi\` (\`kunci\`);--> statement-breakpoint
CREATE TABLE \`mata_pelajaran\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`kode_mapel\` text NOT NULL,
	\`nama_mapel\` text NOT NULL,
	\`guru_id\` integer,
	\`jenis\` text NOT NULL,
	\`kelompok\` text,
	\`agama_target\` text,
	FOREIGN KEY (\`guru_id\`) REFERENCES \`guru\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`mata_pelajaran_kode_mapel_unique\` ON \`mata_pelajaran\` (\`kode_mapel\`);--> statement-breakpoint
CREATE TABLE \`nilai\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`siswa_id\` integer NOT NULL,
	\`mapel_id\` integer NOT NULL,
	\`tahun_ajaran_id\` integer NOT NULL,
	\`nilai_formatif\` real,
	\`nilai_sumatif\` real,
	\`nilai_rapor\` real,
	\`deskripsi\` text,
	FOREIGN KEY (\`siswa_id\`) REFERENCES \`siswa\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`mapel_id\`) REFERENCES \`mata_pelajaran\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`tahun_ajaran_id\`) REFERENCES \`tahun_ajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`nilai_siswa_id_mapel_id_tahun_ajaran_id_unique\` ON \`nilai\` (\`siswa_id\`,\`mapel_id\`,\`tahun_ajaran_id\`);--> statement-breakpoint
CREATE TABLE \`nilai_ekskul\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`siswa_id\` integer NOT NULL,
	\`ekskul_id\` integer NOT NULL,
	\`tahun_ajaran_id\` integer NOT NULL,
	\`predikat\` text NOT NULL,
	\`keterangan\` text,
	FOREIGN KEY (\`siswa_id\`) REFERENCES \`siswa\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`ekskul_id\`) REFERENCES \`ekskul\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`tahun_ajaran_id\`) REFERENCES \`tahun_ajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`nilai_ekskul_siswa_id_ekskul_id_tahun_ajaran_id_unique\` ON \`nilai_ekskul\` (\`siswa_id\`,\`ekskul_id\`,\`tahun_ajaran_id\`);--> statement-breakpoint
CREATE TABLE \`nilai_ketarunaan\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`siswa_id\` integer NOT NULL,
	\`tahun_ajaran_id\` integer NOT NULL,
	\`predikat\` text NOT NULL,
	\`keterangan\` text,
	FOREIGN KEY (\`siswa_id\`) REFERENCES \`siswa\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`tahun_ajaran_id\`) REFERENCES \`tahun_ajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`nilai_ketarunaan_siswa_id_tahun_ajaran_id_unique\` ON \`nilai_ketarunaan\` (\`siswa_id\`,\`tahun_ajaran_id\`);--> statement-breakpoint
CREATE TABLE \`nilai_kokurikuler\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`siswa_id\` integer NOT NULL,
	\`subdimensi_id\` integer NOT NULL,
	\`tahun_ajaran_id\` integer NOT NULL,
	\`grade\` integer,
	FOREIGN KEY (\`siswa_id\`) REFERENCES \`siswa\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`subdimensi_id\`) REFERENCES \`subdimensi_p5\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`tahun_ajaran_id\`) REFERENCES \`tahun_ajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`nilai_kokurikuler_siswa_id_subdimensi_id_tahun_ajaran_id_unique\` ON \`nilai_kokurikuler\` (\`siswa_id\`,\`subdimensi_id\`,\`tahun_ajaran_id\`);--> statement-breakpoint
CREATE TABLE \`subdimensi_p5_tingkat\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`subdimensi_id\` integer NOT NULL,
	\`tingkat\` integer NOT NULL,
	FOREIGN KEY (\`subdimensi_id\`) REFERENCES \`subdimensi_p5\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`subdimensi_p5_tingkat_subdimensi_id_tingkat_unique\` ON \`subdimensi_p5_tingkat\` (\`subdimensi_id\`,\`tingkat\`);--> statement-breakpoint
CREATE TABLE \`nilai_prakerin\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`siswa_id\` integer NOT NULL,
	\`tahun_ajaran_id\` integer NOT NULL,
	\`tpl\` real,
	\`sl\` real,
	\`sk\` real,
	\`nilai_rapor\` real,
	\`tp1_skor\` real,
	\`tp1_deskripsi\` text,
	\`tp2_skor\` real,
	\`tp2_deskripsi\` text,
	\`pembimbing_sekolah\` text,
	\`pembimbing_instansi\` text,
	\`tempat_prakerin\` text,
	\`tgl_mulai\` text,
	\`tgl_selesai\` text,
	\`catatan\` text,
	FOREIGN KEY (\`siswa_id\`) REFERENCES \`siswa\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`tahun_ajaran_id\`) REFERENCES \`tahun_ajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`nilai_prakerin_siswa_id_tahun_ajaran_id_unique\` ON \`nilai_prakerin\` (\`siswa_id\`,\`tahun_ajaran_id\`);--> statement-breakpoint
CREATE TABLE \`nilai_tp\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`nilai_id\` integer NOT NULL,
	\`tp_id\` integer NOT NULL,
	\`capaian\` text NOT NULL,
	FOREIGN KEY (\`nilai_id\`) REFERENCES \`nilai\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`tp_id\`) REFERENCES \`tujuan_pembelajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`nilai_tp_nilai_id_tp_id_unique\` ON \`nilai_tp\` (\`nilai_id\`,\`tp_id\`);--> statement-breakpoint
CREATE TABLE \`siswa\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`nis\` text NOT NULL,
	\`nisn\` text,
	\`nama\` text NOT NULL,
	\`kelas_id\` integer,
	\`jurusan\` text,
	\`tempat_lahir\` text,
	\`tanggal_lahir\` text,
	\`jenis_kelamin\` text,
	\`agama\` text,
	\`alamat\` text,
	\`no_hp\` text,
	\`no_hp_ortu\` text,
	\`nama_ayah\` text,
	\`pekerjaan_ayah\` text,
	\`nama_ibu\` text,
	\`pekerjaan_ibu\` text,
	\`nama_wali\` text,
	\`pendidikan_wali\` text,
	\`pekerjaan_wali\` text,
	\`alamat_wali\` text,
	\`anak_ke\` integer,
	\`jlh_sdr_kandung\` integer,
	\`status\` text DEFAULT 'aktif' NOT NULL,
	FOREIGN KEY (\`kelas_id\`) REFERENCES \`kelas\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`siswa_nis_unique\` ON \`siswa\` (\`nis\`);--> statement-breakpoint
CREATE TABLE \`subdimensi_p5\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`dimensi_id\` integer NOT NULL,
	\`nama\` text NOT NULL,
	\`deskripsi_berkembang\` text,
	\`deskripsi_cakap\` text,
	\`deskripsi_mahir\` text,
	FOREIGN KEY (\`dimensi_id\`) REFERENCES \`dimensi_p5\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE \`sync_log\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`tabel\` text NOT NULL,
	\`record_id\` integer NOT NULL,
	\`action\` text NOT NULL,
	\`synced_at\` text NOT NULL,
	\`status\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`tahun_ajaran\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`nama\` text NOT NULL,
	\`semester\` integer NOT NULL,
	\`is_active\` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`tujuan_pembelajaran\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`mapel_id\` integer NOT NULL,
	\`kode_tp\` text NOT NULL,
	\`deskripsi_tuntas\` text NOT NULL,
	\`deskripsi_remediasi\` text NOT NULL,
	FOREIGN KEY (\`mapel_id\`) REFERENCES \`mata_pelajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`tujuan_pembelajaran_mapel_id_kode_tp_unique\` ON \`tujuan_pembelajaran\` (\`mapel_id\`,\`kode_tp\`);--> statement-breakpoint
CREATE TABLE \`users\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`username\` text NOT NULL,
	\`password\` text NOT NULL,
	\`role\` text NOT NULL,
	\`created_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`users_username_unique\` ON \`users\` (\`username\`);`,
  },
  {
    name: "0001_add_kode_login",
    sql: `ALTER TABLE users ADD COLUMN \`kode_login\` text;
--> statement-breakpoint
CREATE UNIQUE INDEX \`users_kode_login_unique\` ON \`users\` (\`kode_login\`);`,
  },
  {
    name: "0002_add_mapel_kelas_guru",
    sql: `-- Migration: Tambah tabel \`mapel_kelas_guru\` (junction).
-- Tujuan: support 1 mapel diajarkan guru berbeda per kelas, plus rotasi
-- guru honorer/pengganti antar tahun ajaran. Menggantikan kolom \`guru_id\`
-- di tabel \`mata_pelajaran\` (akan di-drop di step 7).

-- 1. Create junction table
CREATE TABLE \`mapel_kelas_guru\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`mapel_id\` integer NOT NULL,
  \`kelas_id\` integer NOT NULL,
  \`guru_id\` integer NOT NULL,
  \`tahun_ajaran_id\` integer NOT NULL,
  \`created_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (\`mapel_id\`) REFERENCES \`mata_pelajaran\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (\`kelas_id\`) REFERENCES \`kelas\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (\`guru_id\`) REFERENCES \`guru\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (\`tahun_ajaran_id\`) REFERENCES \`tahun_ajaran\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- 2. Unique constraint: 1 guru per (mapel, kelas, TA)
CREATE UNIQUE INDEX \`mapel_kelas_guru_mapel_id_kelas_id_tahun_ajaran_id_unique\`
  ON \`mapel_kelas_guru\` (\`mapel_id\`,\`kelas_id\`,\`tahun_ajaran_id\`);
--> statement-breakpoint

-- 3. Indexes untuk query cepat
CREATE INDEX \`idx_mkg_guru\` ON \`mapel_kelas_guru\` (\`guru_id\`);
--> statement-breakpoint
CREATE INDEX \`idx_mkg_kelas\` ON \`mapel_kelas_guru\` (\`kelas_id\`);
--> statement-breakpoint
CREATE INDEX \`idx_mkg_ta\` ON \`mapel_kelas_guru\` (\`tahun_ajaran_id\`);
--> statement-breakpoint

-- 4. Backfill dari data lama: untuk setiap mapel reguler dengan guru_id,
-- assign ke semua kelas di TA aktif.
-- Catatan: ini akan skip (error caught) di fresh DB karena tahun_ajaran
-- masih kosong saat migration jalan. Backfill untuk fresh DB ada di
-- \`scripts/seed/data/mapel.ts\` yang jalan setelah data di-seed.
INSERT OR IGNORE INTO \`mapel_kelas_guru\` (\`mapel_id\`, \`kelas_id\`, \`guru_id\`, \`tahun_ajaran_id\`)
SELECT
  mp.id,
  k.id,
  mp.guru_id,
  (SELECT id FROM \`tahun_ajaran\` WHERE is_active = 1 ORDER BY id DESC LIMIT 1)
FROM \`mata_pelajaran\` mp
CROSS JOIN \`kelas\` k
WHERE mp.guru_id IS NOT NULL
  AND mp.jenis = 'reguler';`,
  },
  {
    name: "0003_drop_mapel_guru_id",
    sql: `-- Migration: Drop kolom \`mata_pelajaran.guru_id\`.
-- Sudah digantikan oleh tabel junction \`mapel_kelas_guru\` (Step 1).
-- Konsumer (GradeInputPage, LearningObjectivesPage, mapel-agama util) sudah
-- di-update Step 5 untuk pakai junction.
--
-- Note: Pakai recreate-table pattern, bukan ALTER TABLE DROP COLUMN, karena
-- SQLite menolak DROP COLUMN jika kolom adalah bagian dari foreign key.
-- Lihat: https://www.sqlite.org/lang_altertable.html#otheralter

PRAGMA foreign_keys = OFF;
--> statement-breakpoint

CREATE TABLE \`mata_pelajaran_new\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`kode_mapel\` text NOT NULL,
  \`nama_mapel\` text NOT NULL,
  \`jenis\` text NOT NULL,
  \`kelompok\` text,
  \`agama_target\` text
);
--> statement-breakpoint

INSERT INTO \`mata_pelajaran_new\` (\`id\`, \`kode_mapel\`, \`nama_mapel\`, \`jenis\`, \`kelompok\`, \`agama_target\`)
SELECT \`id\`, \`kode_mapel\`, \`nama_mapel\`, \`jenis\`, \`kelompok\`, \`agama_target\` FROM \`mata_pelajaran\`;
--> statement-breakpoint

DROP TABLE \`mata_pelajaran\`;
--> statement-breakpoint

ALTER TABLE \`mata_pelajaran_new\` RENAME TO \`mata_pelajaran\`;
--> statement-breakpoint

PRAGMA foreign_keys = ON;`,
  },
  {
    name: "0004_add_tp_tahun_ajaran",
    sql: `-- Migration: Tambah \`tahun_ajaran_id\` ke \`tujuan_pembelajaran\`.
-- Tujuan: TP bersifat per tahun ajaran. Edit TP di TA 2024/2025 tidak mengubah
-- rapor TA 2023/2024. Setiap nilai sudah terikat TA di \`nilai.tahun_ajaran_id\`,
-- sehingga rapor bisa lookup TP berdasarkan TA yang sama.
--
-- Constraint:
-- - UNIQUE lama \`(mapel_id, kode_tp)\` → baru \`(mapel_id, kode_tp, tahun_ajaran_id)\`
-- - NOT NULL tahun_ajaran_id
-- Pakai recreate-table pattern (sama seperti 0003) karena SQLite tidak support
-- ALTER TABLE untuk ubah nullability + change unique index + add FK sekaligus.
--
-- Backfill: assign semua TP existing ke TA aktif (tahun_ajaran.is_active = 1).
-- Aman karena seed re-runs setelah migration (tidak ada TP existing di fresh DB).

PRAGMA foreign_keys = OFF;
--> statement-breakpoint

-- 1. Drop unique index lama
DROP INDEX IF EXISTS \`tujuan_pembelajaran_mapel_id_kode_tp_unique\`;
--> statement-breakpoint

-- 2. Recreate table dengan kolom tahun_ajaran_id (NOT NULL + FK ke tahun_ajaran)
CREATE TABLE \`tujuan_pembelajaran_new\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`mapel_id\` integer NOT NULL,
  \`kode_tp\` text NOT NULL,
  \`deskripsi_tuntas\` text NOT NULL,
  \`deskripsi_remediasi\` text NOT NULL,
  \`tahun_ajaran_id\` integer NOT NULL,
  FOREIGN KEY (\`mapel_id\`) REFERENCES \`mata_pelajaran\`(\`id\`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (\`tahun_ajaran_id\`) REFERENCES \`tahun_ajaran\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- 3. Copy data + backfill tahun_ajaran_id dengan TA aktif
INSERT INTO \`tujuan_pembelajaran_new\`
  (\`id\`, \`mapel_id\`, \`kode_tp\`, \`deskripsi_tuntas\`, \`deskripsi_remediasi\`, \`tahun_ajaran_id\`)
SELECT
  \`id\`, \`mapel_id\`, \`kode_tp\`, \`deskripsi_tuntas\`, \`deskripsi_remediasi\`,
  COALESCE(
    (SELECT id FROM \`tahun_ajaran\` WHERE is_active = 1 ORDER BY id DESC LIMIT 1),
    1
  )
FROM \`tujuan_pembelajaran\`;
--> statement-breakpoint

-- 4. Drop old, rename new
DROP TABLE \`tujuan_pembelajaran\`;
--> statement-breakpoint
ALTER TABLE \`tujuan_pembelajaran_new\` RENAME TO \`tujuan_pembelajaran\`;
--> statement-breakpoint

-- 5. Unique index baru (per TA)
CREATE UNIQUE INDEX \`tujuan_pembelajaran_mapel_id_kode_tp_tahun_ajaran_id_unique\`
  ON \`tujuan_pembelajaran\` (\`mapel_id\`,\`kode_tp\`,\`tahun_ajaran_id\`);
--> statement-breakpoint

-- 6. Index untuk query filter per TA
CREATE INDEX \`idx_tp_ta\` ON \`tujuan_pembelajaran\` (\`tahun_ajaran_id\`);
--> statement-breakpoint

PRAGMA foreign_keys = ON;`,
  },
]
