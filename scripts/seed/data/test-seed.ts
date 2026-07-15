/**
 * Test seed mode (minimal data untuk E2E test).
 *
 * Reuse helper default seed (info, konfigurasi, admin, dimensi, ekskul, TA)
 * + tambah 1 guru "guru" + 1 mapel BIND + 1 kelas "X TEST" + 3 siswa + 1 TP
 * + 1 junction mapel_kelas_guru.
 *
 * TUJUAN: Functional E2E test (save nilai, edit, validasi, dll) bisa run
 * dengan data yang konsisten tanpa overhead 270 siswa.
 *
 * User accounts:
 * - admin / admin123 (admin)
 * - guru  / guru123  (guru BIND, X TEST)
 * - walikelas / wali123 (wali kelas X TEST, optional)
 */

import type { Db } from "../connection"
import { log, logStep } from "../helpers"
import { seedInfoSekolah } from "./info-sekolah"
import { seedKonfigurasi } from "./konfigurasi"
import { seedAdminUser } from "./users"
import { seedDimensiP5 } from "./dimensi-p5"
import { seedEkskul } from "./ekskul"
import { seedTahunAjaran, getActiveTahunAjaranId } from "./tahun-ajaran"
import * as schema from "../../../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { generateId } from "../../../src/lib/db/ids"

export function runTestSeed(db: Db) {
  const STEPS = 9

  logStep(1, STEPS, "Info Sekolah")
  seedInfoSekolah(db)

  logStep(2, STEPS, "Konfigurasi")
  seedKonfigurasi(db)

  logStep(3, STEPS, "Users (admin + guru + walikelas)")
  seedAdminUser(db)
  seedTestUsers(db)

  logStep(4, STEPS, "Dimensi P5 + Subdimensi")
  seedDimensiP5(db)

  logStep(5, STEPS, "Ekskul")
  seedEkskul(db)

  logStep(6, STEPS, "Tahun Ajaran (1 TA aktif)")
  seedTahunAjaran(db)
  const taId = getActiveTahunAjaranId(db)
  log(`  Active TA: ${taId}`)

  logStep(7, STEPS, "Guru (1 record: bidang_studi=Bahasa Indonesia)")
  const guruId = seedTestGuru(db)

  logStep(8, STEPS, "Mapel (BIND) + Kelas (X TEST) + 3 Siswa + 1 TP + 1 Junction")
  const { mapelId, kelasId, siswaIds } = seedTestAcademicData(db, taId, guruId)

  logStep(9, STEPS, "Link guru user → guru record (bidang_studi=Bahasa Indonesia)")
  linkTestGuruUser(db, guruId)

  log(`\n✅ Test seed selesai.`)
  log(`   Login: admin/admin123, guru/guru123, walikelas/wali123`)
  log(`   Mapel BIND ID: ${mapelId}`)
  log(`   Kelas X TEST ID: ${kelasId}`)
  log(`   Siswa IDs (${siswaIds.length}): ${siswaIds.join(", ")}`)
}

function seedTestUsers(db: Db): void {
  const hashed = (pwd: string) => bcrypt.hashSync(pwd, 10)
  const users = [
    { username: "guru", password: "guru123", role: "guru" },
    { username: "walikelas", password: "wali123", role: "wali_kelas" },
  ]
  for (const u of users) {
    const existing = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, u.username))
      .get()
    if (existing) continue
    const kodeLogin = `T${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`
    db.insert(schema.users)
      .values({
        username: u.username,
        password: hashed(u.password),
        role: u.role,
        kode_login: kodeLogin,
      })
      .run()
  }
  log(`  ✓ test users: guru, walikelas`)
}

function seedTestGuru(db: Db): string {
  const existing = db
    .select()
    .from(schema.guru)
    .where(eq(schema.guru.nip, "TEST-001"))
    .get()
  if (existing) return existing.id

  // user_id di-set kemudian di linkTestGuruUser (butuh user.id dari users table)
  // Di sini insert guru dengan user_id temporary (user walikelas dulu),
  // lalu di-update ke user "guru" oleh linkTestGuruUser.
  const userWalikelas = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, "walikelas"))
    .get()
  if (!userWalikelas) throw new Error("walikelas user not seeded")

  const inserted = db
    .insert(schema.guru)
    .values({
      id: generateId(),
      user_id: userWalikelas.id,
      nip: "TEST-001",
      nama: "Guru Test BIND",
      bidang_studi: "Bahasa Indonesia",
    })
    .returning()
    .get()
  log(`  ✓ guru BIND id=${inserted.id}`)
  return inserted.id
}

function linkTestGuruUser(db: Db, guruId: string): void {
  const userGuru = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, "guru"))
    .get()
  if (!userGuru) return
  db.update(schema.guru)
    .set({ user_id: userGuru.id })
    .where(eq(schema.guru.id, guruId))
    .run()
  log(`  ✓ guru record linked to user "guru"`)
}

function seedTestAcademicData(
  db: Db,
  taId: string,
  guruId: string,
): { mapelId: string; kelasId: string; siswaIds: string[] } {
  // Mapel BIND
  let mapelId: string
  const mapelExisting = db
    .select()
    .from(schema.mataPelajaran)
    .where(eq(schema.mataPelajaran.kode_mapel, "BIND"))
    .get()
  if (mapelExisting) {
    mapelId = mapelExisting.id
  } else {
    const inserted = db
      .insert(schema.mataPelajaran)
      .values({
        id: generateId(),
        kode_mapel: "BIND",
        nama_mapel: "Bahasa Indonesia",
        jenis: "reguler",
        kelompok: "umum",
      })
      .returning()
      .get()
    mapelId = inserted.id
  }
  log(`  ✓ mapel BIND id=${mapelId}`)

  // Kelas X TEST
  let kelasId: string
  const kelasExisting = db
    .select()
    .from(schema.kelas)
    .where(
      and(eq(schema.kelas.nama_kelas, "X TEST"), eq(schema.kelas.tahun_ajaran_id, taId)),
    )
    .get()
  if (kelasExisting) {
    kelasId = kelasExisting.id
  } else {
    const inserted = db
      .insert(schema.kelas)
      .values({
        id: generateId(),
        nama_kelas: "X TEST",
        tingkat: 10,
        program_keahlian: "RPL",
        tahun_ajaran_id: taId,
      })
      .returning()
      .get()
    kelasId = inserted.id
  }
  log(`  ✓ kelas X TEST id=${kelasId}`)

  // 3 Siswa
  const siswaData = [
    { nis: "TEST-001", nama: "Andi Pratama" },
    { nis: "TEST-002", nama: "Budi Santoso" },
    { nis: "TEST-003", nama: "Citra Lestari" },
  ]
  const siswaIds: string[] = []
  for (const s of siswaData) {
    const existing = db
      .select()
      .from(schema.siswa)
      .where(eq(schema.siswa.nis, s.nis))
      .get()
    if (existing) {
      siswaIds.push(existing.id)
      // Update kelas_id kalau belum
      if (existing.kelas_id !== kelasId) {
        db.update(schema.siswa)
          .set({ kelas_id: kelasId })
          .where(eq(schema.siswa.id, existing.id))
          .run()
      }
      continue
    }
    const inserted = db
      .insert(schema.siswa)
      .values({
        id: generateId(),
        nis: s.nis,
        nama: s.nama,
        kelas_id: kelasId,
        jenis_kelamin: s.nis === "TEST-003" ? "Perempuan" : "Laki-Laki",
        agama: "ISLAM",
      })
      .returning()
      .get()
    siswaIds.push(inserted.id)
  }
  log(`  ✓ ${siswaIds.length} siswa`)

  // 1 TP untuk BIND
  const tpExisting = db
    .select()
    .from(schema.tujuanPembelajaran)
    .where(
      and(
        eq(schema.tujuanPembelajaran.mapel_id, mapelId),
        eq(schema.tujuanPembelajaran.kode_tp, "TP-BIND-1"),
        eq(schema.tujuanPembelajaran.tahun_ajaran_id, taId),
      ),
    )
    .get()
  if (!tpExisting) {
    db.insert(schema.tujuanPembelajaran)
      .values({
        id: generateId(),
        mapel_id: mapelId,
        kode_tp: "TP-BIND-1",
        deskripsi_tuntas: "Mampu memahami teks naratif dengan baik.",
        deskripsi_remediasi: "Perlu peningkatan dalam memahami struktur teks.",
        tahun_ajaran_id: taId,
      })
      .run()
  }
  log(`  ✓ TP BIND-1`)

  // Junction mapel_kelas_guru
  const junctionExisting = db
    .select()
    .from(schema.mapelKelasGuru)
    .where(
      and(
        eq(schema.mapelKelasGuru.mapel_id, mapelId),
        eq(schema.mapelKelasGuru.kelas_id, kelasId),
        eq(schema.mapelKelasGuru.guru_id, guruId),
        eq(schema.mapelKelasGuru.tahun_ajaran_id, taId),
      ),
    )
    .get()
  if (!junctionExisting) {
    db.insert(schema.mapelKelasGuru)
      .values({
        id: generateId(),
        mapel_id: mapelId,
        kelas_id: kelasId,
        guru_id: guruId,
        tahun_ajaran_id: taId,
      })
      .run()
  }
  log(`  ✓ junction mapel_kelas_guru (BIND + X TEST + guru TEST-001)`)

  return { mapelId, kelasId, siswaIds }
}
