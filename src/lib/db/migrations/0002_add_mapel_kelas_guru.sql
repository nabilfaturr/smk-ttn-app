-- Migration: Tambah tabel `mapel_kelas_guru` (junction).
-- Tujuan: support 1 mapel diajarkan guru berbeda per kelas, plus rotasi
-- guru honorer/pengganti antar tahun ajaran. Menggantikan kolom `guru_id`
-- di tabel `mata_pelajaran` (akan di-drop di step 7).

-- 1. Create junction table
CREATE TABLE `mapel_kelas_guru` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `mapel_id` integer NOT NULL,
  `kelas_id` integer NOT NULL,
  `guru_id` integer NOT NULL,
  `tahun_ajaran_id` integer NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`guru_id`) REFERENCES `guru`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- 2. Unique constraint: 1 guru per (mapel, kelas, TA)
CREATE UNIQUE INDEX `mapel_kelas_guru_mapel_id_kelas_id_tahun_ajaran_id_unique`
  ON `mapel_kelas_guru` (`mapel_id`,`kelas_id`,`tahun_ajaran_id`);
--> statement-breakpoint

-- 3. Indexes untuk query cepat
CREATE INDEX `idx_mkg_guru` ON `mapel_kelas_guru` (`guru_id`);
--> statement-breakpoint
CREATE INDEX `idx_mkg_kelas` ON `mapel_kelas_guru` (`kelas_id`);
--> statement-breakpoint
CREATE INDEX `idx_mkg_ta` ON `mapel_kelas_guru` (`tahun_ajaran_id`);
--> statement-breakpoint

-- 4. Backfill dari data lama: untuk setiap mapel reguler dengan guru_id,
-- assign ke semua kelas di TA aktif.
-- Catatan: ini akan skip (error caught) di fresh DB karena tahun_ajaran
-- masih kosong saat migration jalan. Backfill untuk fresh DB ada di
-- `scripts/seed/data/mapel.ts` yang jalan setelah data di-seed.
INSERT OR IGNORE INTO `mapel_kelas_guru` (`mapel_id`, `kelas_id`, `guru_id`, `tahun_ajaran_id`)
SELECT
  mp.id,
  k.id,
  mp.guru_id,
  (SELECT id FROM `tahun_ajaran` WHERE is_active = 1 ORDER BY id DESC LIMIT 1)
FROM `mata_pelajaran` mp
CROSS JOIN `kelas` k
WHERE mp.guru_id IS NOT NULL
  AND mp.jenis = 'reguler';
