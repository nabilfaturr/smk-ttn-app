/**
 * Seed: siswa (270 siswa, 30 per kelas).
 *
 * Distribusi agama mengikuti proporsi Indonesia.
 * Generate biodata lengkap: NIS, NISN, TTL, alamat, ortu, dll.
 *
 * Default mode: insert 5 siswa (XII RPL: 2001-2005, XI TKJ A: 2001-2005).
 * Full mode: insert 270 siswa (per kelas, NIS unique).
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq } from "drizzle-orm"
import { createRng, log, logProgress, generateNisn, generatePhone, pickOne, randInt, randDate } from "../helpers"
import {
  NAMA_DEPAN_LAKI,
  NAMA_DEPAN_PEREMPUAN,
  NAMA_BELAKANG,
  KOTA_LAHIR,
  PEKERJAAN_ORTU,
  PENDIDIKAN_WALI,
  JALAN_PREFIX,
  KELURAHAN,
  KECAMATAN,
  ALAMAT_KOTA,
  pickAgama,
} from "./shared"

type SiswaSpec = {
  nis: string
  nisn: string
  nama: string
  kelas_id: number
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: "Laki-Laki" | "Perempuan"
  agama: string
  alamat: string
  no_hp: string
  no_hp_ortu: string
  nama_ayah: string
  pekerjaan_ayah: string
  nama_ibu: string
  pekerjaan_ibu: string
  nama_wali: string
  pendidikan_wali: string
  pekerjaan_wali: string
  alamat_wali: string
  anak_ke: number
  jlh_sdr_kandung: number
  status: "aktif"
}

// NOTE: siswa.jurusan adalah denormalized copy dari kelas.program_keahlian.
// Form Tambah Siswa tidak lagi menampilkan field ini (di-derive dari kelas.program_keahlian).
// DB column tetap ada untuk backward-compat; seed tidak lagi populate.

function buildSiswaForKelas(
  kelasId: number,
  kelasNama: string,
  programKeahlian: "RPL" | "TKJ",
  nisStart: number,
  count: number,
  rngSeed: number,
): SiswaSpec[] {
  const rng = createRng(rngSeed)
  const specs: SiswaSpec[] = []
  const nisUsed = new Set<string>()

  for (let i = 0; i < count; i++) {
    const isFemale = rng() < 0.5
    const namaDepan = pickOne(isFemale ? NAMA_DEPAN_PEREMPUAN : NAMA_DEPAN_LAKI, rng)
    const namaBelakang1 = pickOne(NAMA_BELAKANG, rng)
    const namaBelakang2 = rng() < 0.3 ? " " + pickOne(NAMA_BELAKANG, rng) : ""
    const nama = `${namaDepan} ${namaBelakang1}${namaBelakang2}`

    let nis = String(nisStart + i).padStart(4, "0")
    while (nisUsed.has(nis)) nis = String(randInt(2000, 9999, rng)).padStart(4, "0")
    nisUsed.add(nis)

    const nisn = generateNisn(rng)

    // Usia 15-18 tahun, dihitung mundur dari sekarang
    const tahunSekarang = new Date().getFullYear()
    const tahunLahir = tahunSekarang - randInt(15, 18, rng)
    const tanggalLahir = randDate(
      `${tahunLahir}-01-01`,
      `${tahunLahir}-12-31`,
      rng,
    )

    const tempatLahir = pickOne(KOTA_LAHIR, rng)
    const agama = pickAgama(rng)
    const jl = pickOne(JALAN_PREFIX, rng)
    const nomor = randInt(1, 200, rng)
    const rt = randInt(1, 12, rng)
    const rw = randInt(1, 12, rng)
    const kelurahan = pickOne(KELURAHAN, rng)
    const kecamatan = pickOne(KECAMATAN, rng)
    const kota = pickOne(ALAMAT_KOTA, rng)
    const alamat = `${jl} No. ${nomor}, RT ${rt}/RW ${rw}, Kel. ${kelurahan}, Kec. ${kecamatan}, ${kota}`

    const namaAyah = `${pickOne(NAMA_DEPAN_LAKI, rng)} ${pickOne(NAMA_BELAKANG, rng)}`
    const namaIbu = `${pickOne(NAMA_DEPAN_PEREMPUAN, rng)} ${pickOne(NAMA_BELAKANG, rng)}`
    const pekerjaanAyah = pickOne(PEKERJAAN_ORTU, rng)
    const pekerjaanIbu = pickOne(PEKERJAAN_ORTU, rng)
    const namaWali = rng() < 0.3 ? namaAyah : "" // 30% wali = ayah
    const pendidikanWali = pickOne(PENDIDIKAN_WALI, rng)
    const pekerjaanWali = namaWali ? pekerjaanAyah : ""

    const anakKe = randInt(1, 4, rng)
    const jlhSdr = randInt(0, 4, rng)

    specs.push({
      nis,
      nisn,
      nama,
      kelas_id: kelasId,
      tempat_lahir: tempatLahir,
      tanggal_lahir: tanggalLahir,
      jenis_kelamin: isFemale ? "Perempuan" : "Laki-Laki",
      agama,
      alamat,
      no_hp: generatePhone(rng),
      no_hp_ortu: generatePhone(rng),
      nama_ayah: namaAyah,
      pekerjaan_ayah: pekerjaanAyah,
      nama_ibu: namaIbu,
      pekerjaan_ibu: pekerjaanIbu,
      nama_wali: namaWali,
      pendidikan_wali: pendidikanWali,
      pekerjaan_wali: pekerjaanWali,
      alamat_wali: namaWali ? alamat : "",
      anak_ke: anakKe,
      jlh_sdr_kandung: jlhSdr,
      status: "aktif",
    })
  }
  return specs
}

/* ------------------------------------------------------------------ */
/*  Default: 5 siswa (testing)                                        */
/* ------------------------------------------------------------------ */

const DEFAULT_SISWA: Array<{ nama: string; nis: string; kelas: string; jenisKelamin: "Laki-Laki" | "Perempuan"; agama: string }> = [
  { nama: "Andi Pratama", nis: "2001", kelas: "XII RPL", jenisKelamin: "Laki-Laki", agama: "ISLAM" },
  { nama: "Budi Santoso", nis: "2002", kelas: "XII RPL", jenisKelamin: "Laki-Laki", agama: "ISLAM" },
  { nama: "Citra Lestari", nis: "2003", kelas: "XII RPL", jenisKelamin: "Perempuan", agama: "KRISTEN PROTESTAN" },
  { nama: "Dewi Anggraini", nis: "2004", kelas: "XI TKJ A", jenisKelamin: "Perempuan", agama: "ISLAM" },
  { nama: "Eko Saputra", nis: "2005", kelas: "XI TKJ A", jenisKelamin: "Laki-Laki", agama: "ISLAM" },
]

export function seedSiswaDefault(
  db: Db,
  kelasIdByNama: Map<string, number>,
): void {
  const existing = db.select().from(schema.siswa).all()
  if (existing.length >= 5) {
    log("  → siswa default already seeded, skip")
    return
  }
  const rng = createRng(100)
  for (const s of DEFAULT_SISWA) {
    if (existing.find((e) => e.nis === s.nis)) continue
    const kelasId = kelasIdByNama.get(s.kelas)
    if (!kelasId) {
      log(`  ⚠ kelas ${s.kelas} not found, skip siswa ${s.nama}`)
      continue
    }
    db.insert(schema.siswa)
      .values({
        nis: s.nis,
        nisn: generateNisn(rng),
        nama: s.nama,
        kelas_id: kelasId,
        tempat_lahir: "Jakarta",
        tanggal_lahir: "2007-05-15",
        jenis_kelamin: s.jenisKelamin,
        agama: s.agama,
        alamat: "Jl. Test No. 1, Jakarta",
        no_hp: "081234567890",
        no_hp_ortu: "081234567891",
        nama_ayah: "Bapak Test",
        pekerjaan_ayah: "Wiraswasta",
        nama_ibu: "Ibu Test",
        pekerjaan_ibu: "Ibu Rumah Tangga",
        status: "aktif",
      })
      .run()
  }
  log(`  ✓ siswa default (5 total)`)
}

/* ------------------------------------------------------------------ */
/*  Full: 270 siswa (30 per kelas × 9 kelas)                          */
/* ------------------------------------------------------------------ */

const KELAS_FOR_FULL: Array<{ nama: string; program: "RPL" | "TKJ"; nisStart: number }> = [
  { nama: "X RPL 1", program: "RPL", nisStart: 2101 },
  { nama: "X RPL 2", program: "RPL", nisStart: 2131 },
  { nama: "X TKJ 1", program: "TKJ", nisStart: 2161 },
  { nama: "XI RPL", program: "RPL", nisStart: 2201 },
  { nama: "XI TKJ A", program: "TKJ", nisStart: 2231 },
  { nama: "XI TKJ B", program: "TKJ", nisStart: 2261 },
  { nama: "XII RPL", program: "RPL", nisStart: 2301 },
  { nama: "XII TKJ A", program: "TKJ", nisStart: 2331 },
  { nama: "XII TKJ B", program: "TKJ", nisStart: 2361 },
]

const SISWA_PER_KELAS = 30

export function seedSiswaFull(
  db: Db,
  kelasIdByNama: Map<string, number>,
): number {
  const existing = db.select().from(schema.siswa).all()
  const existingNis = new Set(existing.map((s) => s.nis))
  let inserted = 0
  let kelasIdx = 0

  for (const k of KELAS_FOR_FULL) {
    const kelasId = kelasIdByNama.get(k.nama)
    if (!kelasId) {
      log(`  ⚠ kelas ${k.nama} not found, skip`)
      continue
    }
    const specs = buildSiswaForKelas(
      kelasId,
      k.nama,
      k.program,
      k.nisStart,
      SISWA_PER_KELAS,
      50000 + kelasIdx * 1000,
    )
    for (const s of specs) {
      if (existingNis.has(s.nis)) continue
      db.insert(schema.siswa).values(s).run()
      inserted++
    }
    kelasIdx++
    logProgress(kelasIdx, KELAS_FOR_FULL.length, `kelas ${k.nama}`)
  }
  log(`  ✓ siswa full (${inserted} new, total now ${existing.length + inserted})`)
  return inserted
}

/* ------------------------------------------------------------------ */
/*  Lookup                                                             */
/* ------------------------------------------------------------------ */

export function getSiswaByKelas(db: Db, kelasId: number) {
  return db
    .select()
    .from(schema.siswa)
    .where(eq(schema.siswa.kelas_id, kelasId))
    .all()
}

export function getAllSiswa(db: Db) {
  return db.select().from(schema.siswa).all()
}
