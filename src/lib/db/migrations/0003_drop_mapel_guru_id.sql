-- Migration: Drop kolom `mata_pelajaran.guru_id`.
-- Sudah digantikan oleh tabel junction `mapel_kelas_guru` (Step 1).
-- Konsumer (GradeInputPage, LearningObjectivesPage, mapel-agama util) sudah
-- di-update Step 5 untuk pakai junction.
--
-- Note: Pakai recreate-table pattern, bukan ALTER TABLE DROP COLUMN, karena
-- SQLite menolak DROP COLUMN jika kolom adalah bagian dari foreign key.
-- Lihat: https://www.sqlite.org/lang_altertable.html#otheralter

PRAGMA foreign_keys = OFF;
--> statement-breakpoint

CREATE TABLE `mata_pelajaran_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `kode_mapel` text NOT NULL,
  `nama_mapel` text NOT NULL,
  `jenis` text NOT NULL,
  `kelompok` text,
  `agama_target` text
);
--> statement-breakpoint

INSERT INTO `mata_pelajaran_new` (`id`, `kode_mapel`, `nama_mapel`, `jenis`, `kelompok`, `agama_target`)
SELECT `id`, `kode_mapel`, `nama_mapel`, `jenis`, `kelompok`, `agama_target` FROM `mata_pelajaran`;
--> statement-breakpoint

DROP TABLE `mata_pelajaran`;
--> statement-breakpoint

ALTER TABLE `mata_pelajaran_new` RENAME TO `mata_pelajaran`;
--> statement-breakpoint

PRAGMA foreign_keys = ON;
