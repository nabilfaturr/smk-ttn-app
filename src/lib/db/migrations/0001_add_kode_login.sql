ALTER TABLE users ADD COLUMN `kode_login` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `users_kode_login_unique` ON `users` (`kode_login`);
