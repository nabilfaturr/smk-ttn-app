CREATE TABLE `absensi` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`siswa_id` integer NOT NULL,
	`kelas_id` integer NOT NULL,
	`tanggal` text NOT NULL,
	`status` text NOT NULL,
	`jam_pelajaran` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `absensi_siswa_id_kelas_id_tanggal_jam_pelajaran_unique` ON `absensi` (`siswa_id`,`kelas_id`,`tanggal`,`jam_pelajaran`);--> statement-breakpoint
CREATE TABLE `absensi_prakerin` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`siswa_id` integer NOT NULL,
	`tahun_ajaran_id` integer NOT NULL,
	`sakit` integer DEFAULT 0 NOT NULL,
	`izin` integer DEFAULT 0 NOT NULL,
	`tanpa_keterangan` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `absensi_prakerin_siswa_id_tahun_ajaran_id_unique` ON `absensi_prakerin` (`siswa_id`,`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `catatan_wali_kelas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`siswa_id` integer NOT NULL,
	`tahun_ajaran_id` integer NOT NULL,
	`catatan` text NOT NULL,
	FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catatan_wali_kelas_siswa_id_tahun_ajaran_id_unique` ON `catatan_wali_kelas` (`siswa_id`,`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `dimensi_p5` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ekskul` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`wajib` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guru` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`nip` text,
	`nama` text NOT NULL,
	`bidang_studi` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `info_sekolah` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`alamat` text,
	`tempat` text,
	`kepala_sekolah` text,
	`npsn` text
);
--> statement-breakpoint
CREATE TABLE `kelas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama_kelas` text NOT NULL,
	`wali_kelas_id` integer,
	`tahun_ajaran_id` integer,
	`tingkat` integer NOT NULL,
	`program_keahlian` text,
	FOREIGN KEY (`wali_kelas_id`) REFERENCES `guru`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `konfigurasi` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kunci` text NOT NULL,
	`nilai` text NOT NULL,
	`keterangan` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `konfigurasi_kunci_unique` ON `konfigurasi` (`kunci`);--> statement-breakpoint
CREATE TABLE `mata_pelajaran` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kode_mapel` text NOT NULL,
	`nama_mapel` text NOT NULL,
	`guru_id` integer,
	`jenis` text NOT NULL,
	`kelompok` text,
	`agama_target` text,
	FOREIGN KEY (`guru_id`) REFERENCES `guru`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mata_pelajaran_kode_mapel_unique` ON `mata_pelajaran` (`kode_mapel`);--> statement-breakpoint
CREATE TABLE `nilai` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`siswa_id` integer NOT NULL,
	`mapel_id` integer NOT NULL,
	`tahun_ajaran_id` integer NOT NULL,
	`nilai_formatif` real,
	`nilai_sumatif` real,
	`nilai_rapor` real,
	`deskripsi` text,
	FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nilai_siswa_id_mapel_id_tahun_ajaran_id_unique` ON `nilai` (`siswa_id`,`mapel_id`,`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `nilai_ekskul` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`siswa_id` integer NOT NULL,
	`ekskul_id` integer NOT NULL,
	`tahun_ajaran_id` integer NOT NULL,
	`predikat` text NOT NULL,
	`keterangan` text,
	FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ekskul_id`) REFERENCES `ekskul`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nilai_ekskul_siswa_id_ekskul_id_tahun_ajaran_id_unique` ON `nilai_ekskul` (`siswa_id`,`ekskul_id`,`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `nilai_ketarunaan` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`siswa_id` integer NOT NULL,
	`tahun_ajaran_id` integer NOT NULL,
	`predikat` text NOT NULL,
	`keterangan` text,
	FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nilai_ketarunaan_siswa_id_tahun_ajaran_id_unique` ON `nilai_ketarunaan` (`siswa_id`,`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `nilai_kokurikuler` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`siswa_id` integer NOT NULL,
	`subdimensi_id` integer NOT NULL,
	`tahun_ajaran_id` integer NOT NULL,
	`grade` integer,
	FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subdimensi_id`) REFERENCES `subdimensi_p5`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nilai_kokurikuler_siswa_id_subdimensi_id_tahun_ajaran_id_unique` ON `nilai_kokurikuler` (`siswa_id`,`subdimensi_id`,`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `subdimensi_p5_tingkat` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subdimensi_id` integer NOT NULL,
	`tingkat` integer NOT NULL,
	FOREIGN KEY (`subdimensi_id`) REFERENCES `subdimensi_p5`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subdimensi_p5_tingkat_subdimensi_id_tingkat_unique` ON `subdimensi_p5_tingkat` (`subdimensi_id`,`tingkat`);--> statement-breakpoint
CREATE TABLE `nilai_prakerin` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`siswa_id` integer NOT NULL,
	`tahun_ajaran_id` integer NOT NULL,
	`tpl` real,
	`sl` real,
	`sk` real,
	`nilai_rapor` real,
	`tp1_skor` real,
	`tp1_deskripsi` text,
	`tp2_skor` real,
	`tp2_deskripsi` text,
	`pembimbing_sekolah` text,
	`pembimbing_instansi` text,
	`tempat_prakerin` text,
	`tgl_mulai` text,
	`tgl_selesai` text,
	`catatan` text,
	FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nilai_prakerin_siswa_id_tahun_ajaran_id_unique` ON `nilai_prakerin` (`siswa_id`,`tahun_ajaran_id`);--> statement-breakpoint
CREATE TABLE `nilai_tp` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nilai_id` integer NOT NULL,
	`tp_id` integer NOT NULL,
	`capaian` text NOT NULL,
	FOREIGN KEY (`nilai_id`) REFERENCES `nilai`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tp_id`) REFERENCES `tujuan_pembelajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nilai_tp_nilai_id_tp_id_unique` ON `nilai_tp` (`nilai_id`,`tp_id`);--> statement-breakpoint
CREATE TABLE `siswa` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nis` text NOT NULL,
	`nisn` text,
	`nama` text NOT NULL,
	`kelas_id` integer,
	`jurusan` text,
	`tempat_lahir` text,
	`tanggal_lahir` text,
	`jenis_kelamin` text,
	`agama` text,
	`alamat` text,
	`no_hp` text,
	`no_hp_ortu` text,
	`nama_ayah` text,
	`pekerjaan_ayah` text,
	`nama_ibu` text,
	`pekerjaan_ibu` text,
	`nama_wali` text,
	`pendidikan_wali` text,
	`pekerjaan_wali` text,
	`alamat_wali` text,
	`anak_ke` integer,
	`jlh_sdr_kandung` integer,
	`status` text DEFAULT 'aktif' NOT NULL,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `siswa_nis_unique` ON `siswa` (`nis`);--> statement-breakpoint
CREATE TABLE `subdimensi_p5` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dimensi_id` integer NOT NULL,
	`nama` text NOT NULL,
	`deskripsi_berkembang` text,
	`deskripsi_cakap` text,
	`deskripsi_mahir` text,
	FOREIGN KEY (`dimensi_id`) REFERENCES `dimensi_p5`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tabel` text NOT NULL,
	`record_id` integer NOT NULL,
	`action` text NOT NULL,
	`synced_at` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tahun_ajaran` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`semester` integer NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tujuan_pembelajaran` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mapel_id` integer NOT NULL,
	`kode_tp` text NOT NULL,
	`deskripsi_tuntas` text NOT NULL,
	`deskripsi_remediasi` text NOT NULL,
	FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tujuan_pembelajaran_mapel_id_kode_tp_unique` ON `tujuan_pembelajaran` (`mapel_id`,`kode_tp`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);