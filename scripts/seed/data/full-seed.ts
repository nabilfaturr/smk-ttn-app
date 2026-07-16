/**
 * Full seed mode (realistic data, idempotent).
 *
 * Insert (in dependency order):
 * 1. Info Sekolah
 * 2. Konfigurasi
 * 3. Users (admin + 18 guru)
 * 4. Dimensi P5 + Subdimensi
 * 5. Ekskul
 * 6. Tahun Ajaran (3 tahun)
 * 7. Mata Pelajaran (29 mapel)
 * 8. Kelas (9 kelas)
 * 9. Siswa (270 siswa)
 * 10. Tujuan Pembelajaran (30 sample TP)
 * 11. Absensi (~3.000 records)
 * 12. Nilai (~2.000 records)
 * 13. Nilai Ekskul (90 records)
 * 14. Nilai Kokurikuler (~1.710 records)
 * 15. Nilai Prakerin (60 records, XII TKJ)
 * 16. Catatan Wali Kelas (90 records, XII)
 */

import type { Db } from "../connection"
import { log, logStep } from "../helpers"
import { seedInfoSekolah } from "./info-sekolah"
import { seedKonfigurasi } from "./konfigurasi"
import { seedAdminUser, seedGuru, seedDemoUsers, linkDemoUsers } from "./users"
import { seedDimensiP5 } from "./dimensi-p5"
import { seedEkskul, autoEnrollWajibEkskul } from "./ekskul"
import { seedTahunAjaran, getActiveTahunAjaranId } from "./tahun-ajaran"
import { seedMapel, backfillMapelKelasGuru } from "./mapel"
import { seedKelas } from "./kelas"
import { seedSiswaFull } from "./siswa"
import { seedTujuanPembelajaran } from "./tujuan-pembelajaran"
import { seedAbsensi } from "./absensi"
import { seedNilai } from "./nilai"
import { seedNilaiTp } from "./nilai-tp"
import { seedNilaiEkskul, seedNilaiKokurikuler } from "./nilai-kokurikuler"
import { seedNilaiPrakerin } from "./prakerin"
import { seedCatatanWaliKelas } from "./catatan-wali-kelas"
import * as schema from "../../../src/lib/db/schema"
import { eq } from "drizzle-orm"

export function runFullSeed(db: Db) {
  const STEPS = 17

  logStep(1, STEPS, "Info Sekolah")
  seedInfoSekolah(db)

  logStep(2, STEPS, "Konfigurasi")
  seedKonfigurasi(db)

  logStep(3, STEPS, "Users (admin + 18 guru + 2 demo)")
  seedAdminUser(db)
  seedGuru(db)
  seedDemoUsers(db)

  logStep(4, STEPS, "Dimensi P5 + Subdimensi")
  const { subdimensiMap } = seedDimensiP5(db)
  // Hanya seed nilai untuk subdimensi yang aktif di SEMUA tingkat (default 3 dimensi).
  // 5 dimensi non-aktif tidak di-seed sama sekali.
  const dimensiAktifNama = new Set([
    "Keimanan dan Ketaqwaan Terhadap Tuhan Yang Maha Esa",
    "Kewargaan",
    "Penalaran Kritis",
  ])
  const dimensiAktifIds = new Set<number>()
  for (const d of db.select().from(schema.dimensiP5).all()) {
    if (dimensiAktifNama.has(d.nama)) dimensiAktifIds.add(d.id)
  }
  const subdimensiAktifIds: number[] = []
  for (const [nama, id] of subdimensiMap.entries()) {
    const sub = db.select().from(schema.subdimensiP5).where(eq(schema.subdimensiP5.id, id)).get()
    if (sub && dimensiAktifIds.has(sub.dimensi_id)) subdimensiAktifIds.push(id)
  }

  logStep(5, STEPS, "Ekskul")
  const ekskulIdMap = seedEkskul(db)

  logStep(6, STEPS, "Tahun Ajaran")
  seedTahunAjaran(db)
  const taId = getActiveTahunAjaranId(db)
  log(`  Active TA: ${taId}`)

  logStep(7, STEPS, "Mata Pelajaran (29 mapel)")
  const mapelIdByKode = seedMapel(db)

  logStep(8, STEPS, "Kelas (9 kelas)")
  const kelasIdByNama = seedKelas(db, taId)
  linkDemoUsers(db)
  backfillMapelKelasGuru(db)

  logStep(9, STEPS, "Siswa (270 siswa, 30 per kelas)")
  seedSiswaFull(db, kelasIdByNama)

  logStep(10, STEPS, "Tujuan Pembelajaran (30 sample TP)")
  seedTujuanPembelajaran(db, mapelIdByKode)

  logStep(11, STEPS, "Absensi")
  seedAbsensi(db, kelasIdByNama, mapelIdByKode)

  logStep(12, STEPS, "Nilai")
  seedNilai(db, kelasIdByNama, mapelIdByKode, taId)

  logStep(13, STEPS, "Nilai TP (capaian TP per siswa-mapel XII)")
  seedNilaiTp(db, kelasIdByNama, mapelIdByKode, taId)

  logStep(14, STEPS, "Nilai Ekskul (XII)")
  seedNilaiEkskul(db, kelasIdByNama, ekskulIdMap, taId)
  autoEnrollWajibEkskul(db, taId)

  logStep(15, STEPS, "Nilai Kokurikuler (P5)")
  seedNilaiKokurikuler(db, kelasIdByNama, subdimensiAktifIds, taId)

  logStep(16, STEPS, "Nilai Prakerin (XII TKJ)")
  seedNilaiPrakerin(db, kelasIdByNama, taId)

  logStep(17, STEPS, "Catatan Wali Kelas (semua kelas)")
  seedCatatanWaliKelas(db, kelasIdByNama, taId)

  log(`\n✅ Full seed selesai!`)
  log(`   - 9 kelas, 270 siswa`)
  log(`   - 29 mata pelajaran`)
  log(`   - Data lengkap untuk XII (ranking, rapor, P5, prakerin)`)
  log(`   - Catatan wali kelas untuk semua kelas`)
}
