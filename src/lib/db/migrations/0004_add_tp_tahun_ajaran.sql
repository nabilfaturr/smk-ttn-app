-- Migration: Tambah `tahun_ajaran_id` ke `tujuan_pembelajaran`.
-- Tujuan: TP bersifat per tahun ajaran. Edit TP di TA 2024/2025 tidak mengubah
-- rapor TA 2023/2024. Setiap nilai sudah terikat TA di `nilai.tahun_ajaran_id`,
-- sehingga rapor bisa lookup TP berdasarkan TA yang sama.
--
-- Constraint:
-- - UNIQUE lama `(mapel_id, kode_tp)` → baru `(mapel_id, kode_tp, tahun_ajaran_id)`
-- - NOT NULL tahun_ajaran_id
-- Pakai recreate-table pattern (sama seperti 0003) karena SQLite tidak support
-- ALTER TABLE untuk ubah nullability + change unique index + add FK sekaligus.
--
-- Backfill: assign semua TP existing ke TA aktif (tahun_ajaran.is_active = 1).
-- Aman karena seed re-runs setelah migration (tidak ada TP existing di fresh DB).

PRAGMA foreign_keys = OFF;
--> statement-breakpoint

-- 1. Drop unique index lama
DROP INDEX IF EXISTS `tujuan_pembelajaran_mapel_id_kode_tp_unique`;
--> statement-breakpoint

-- 2. Recreate table dengan kolom tahun_ajaran_id (NOT NULL + FK ke tahun_ajaran)
CREATE TABLE `tujuan_pembelajaran_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `mapel_id` integer NOT NULL,
  `kode_tp` text NOT NULL,
  `deskripsi_tuntas` text NOT NULL,
  `deskripsi_remediasi` text NOT NULL,
  `tahun_ajaran_id` integer NOT NULL,
  FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- 3. Copy data + backfill tahun_ajaran_id dengan TA aktif
INSERT INTO `tujuan_pembelajaran_new`
  (`id`, `mapel_id`, `kode_tp`, `deskripsi_tuntas`, `deskripsi_remediasi`, `tahun_ajaran_id`)
SELECT
  `id`, `mapel_id`, `kode_tp`, `deskripsi_tuntas`, `deskripsi_remediasi`,
  COALESCE(
    (SELECT id FROM `tahun_ajaran` WHERE is_active = 1 ORDER BY id DESC LIMIT 1),
    1
  )
FROM `tujuan_pembelajaran`;
--> statement-breakpoint

-- 4. Drop old, rename new
DROP TABLE `tujuan_pembelajaran`;
--> statement-breakpoint
ALTER TABLE `tujuan_pembelajaran_new` RENAME TO `tujuan_pembelajaran`;
--> statement-breakpoint

-- 5. Unique index baru (per TA)
CREATE UNIQUE INDEX `tujuan_pembelajaran_mapel_id_kode_tp_tahun_ajaran_id_unique`
  ON `tujuan_pembelajaran` (`mapel_id`,`kode_tp`,`tahun_ajaran_id`);
--> statement-breakpoint

-- 6. Index untuk query filter per TA
CREATE INDEX `idx_tp_ta` ON `tujuan_pembelajaran` (`tahun_ajaran_id`);
--> statement-breakpoint

PRAGMA foreign_keys = ON;
