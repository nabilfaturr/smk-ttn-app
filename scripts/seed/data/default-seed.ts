/**
 * Default seed mode (existing minimal data, idempotent).
 *
 * Insert:
 * - 1 info_sekolah
 * - 4 konfigurasi
 * - 1 admin user
 * - 8 dimensi P5 (existing) + subdimensi
 * - 6 ekskul (existing)
 * - 1 tahun_ajaran aktif (2025/2026 sem 1)
 *
 * Dipakai untuk first-launch app & testing ringan.
 */

import type { Db } from "../connection"
import { log, logStep } from "../helpers"
import { seedInfoSekolah } from "./info-sekolah"
import { seedKonfigurasi } from "./konfigurasi"
import { seedAdminUser } from "./users"
import { seedDimensiP5 } from "./dimensi-p5"
import { seedEkskul } from "./ekskul"
import { seedTahunAjaran, getActiveTahunAjaranId } from "./tahun-ajaran"

export function runDefaultSeed(db: Db) {
  const STEPS = 6
  logStep(1, STEPS, "Info Sekolah")
  seedInfoSekolah(db)
  logStep(2, STEPS, "Konfigurasi")
  seedKonfigurasi(db)
  logStep(3, STEPS, "Users (admin only)")
  seedAdminUser(db)
  logStep(4, STEPS, "Dimensi P5 + Subdimensi")
  seedDimensiP5(db)
  logStep(5, STEPS, "Ekskul")
  seedEkskul(db)
  logStep(6, STEPS, "Tahun Ajaran")
  seedTahunAjaran(db)
  const taId = getActiveTahunAjaranId(db)
  log(`\n✅ Default seed selesai. Tahun ajaran aktif ID: ${taId}`)
  return { activeTahunAjaranId: taId }
}
