import bcrypt from "bcryptjs"
import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq } from "drizzle-orm"
import { createRng, log, generateNip, pickOne } from "../helpers"
import { NAMA_DEPAN_LAKI, NAMA_DEPAN_PEREMPUAN, NAMA_BELAKANG } from "./shared"

const PASSWORD_DEFAULT = "smkttn2026"

type GuruSpec = {
  nip: string
  nama: string
  jenisKelamin: "Laki-Laki" | "Perempuan"
  bidangStudi: string
  username: string
  isWaliKelas: boolean
}

const NAMA_BIDANG_STUDI = [
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Matematika",
  "IPA",
  "IPS",
  "PKN",
  "PJOK",
  "Seni Budaya",
  "Bahasa Jawa",
  "Pemrograman Web",
  "Pemrograman Berorientasi Objek",
  "Basis Data",
  "Jaringan Komputer",
  "Administrasi Server",
  "Multimedia",
  "Desain Grafis",
  "Pendidikan Agama Islam",
  "Bahasa Jepang",
] as const

const USERNAME_GURU_BASE = [
  "budi", "sari", "agus", "dewi", "eko", "fitri", "hendro", "indri",
  "jaka", "kartika", "lutfi", "maya", "nanda", "okta", "pratama", "rini",
  "setiawan", "tri",
] as const

function buildGuruSpecs(): GuruSpec[] {
  const rng = createRng(20251234)
  const specs: GuruSpec[] = []
  const usedNips = new Set<string>()
  const usedUsernames = new Set<string>()

  for (let i = 0; i < 18; i++) {
    const isFemale = rng() < 0.45
    const namaDepan = pickOne(isFemale ? NAMA_DEPAN_PEREMPUAN : NAMA_DEPAN_LAKI, rng)
    const namaBelakang = pickOne(NAMA_BELAKANG, rng)
    const nama = `${namaDepan} ${namaBelakang}, S.Pd`

    let nip = generateNip(rng)
    while (usedNips.has(nip)) nip = generateNip(rng)
    usedNips.add(nip)

    let username = USERNAME_GURU_BASE[i] ?? `guru${i + 1}`
    while (usedUsernames.has(username)) username = `${username}${rng() < 0.5 ? "1" : "2"}`
    usedUsernames.add(username)

    specs.push({
      nip,
      nama,
      jenisKelamin: isFemale ? "Perempuan" : "Laki-Laki",
      bidangStudi: NAMA_BIDANG_STUDI[i] ?? "Umum",
      username,
      isWaliKelas: i < 6,
    })
  }
  return specs
}

function generateKodeLogin(db: Db): string {
  let kode: string
  do {
    kode = String(Math.floor(10000 + Math.random() * 90000))
  } while (db.select().from(schema.users).where(eq(schema.users.kode_login, kode)).get())
  return kode
}

export function seedAdminUser(db: Db): number {
  const existing = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, "admin"))
    .get()
  if (existing) {
    if (!existing.kode_login) {
      db.update(schema.users).set({ kode_login: generateKodeLogin(db) }).where(eq(schema.users.id, existing.id)).run()
    }
    log("  → admin user already exists, skip")
    return existing.id
  }
  const hashed = bcrypt.hashSync("admin123", 10)
  const inserted = db
    .insert(schema.users)
    .values({
      username: "admin",
      password: hashed,
      role: "admin",
      kode_login: generateKodeLogin(db),
    })
    .returning()
    .get()!
  log(`  ✓ admin user inserted (id=${inserted.id})`)
  return inserted.id
}

export function seedGuru(db: Db): GuruSpec[] {
  const specs = buildGuruSpecs()
  const hashed = bcrypt.hashSync(PASSWORD_DEFAULT, 10)

  let inserted = 0
  let skipped = 0
  for (const g of specs) {
    const roleStr = g.isWaliKelas ? "wali_kelas,guru" : "guru"

    const userExisting = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, g.username))
      .get()
    let userId: number
    if (userExisting) {
      userId = userExisting.id
      db.update(schema.users).set({ role: roleStr }).where(eq(schema.users.id, userId)).run()
      if (!userExisting.kode_login) {
        db.update(schema.users).set({ kode_login: generateKodeLogin(db) }).where(eq(schema.users.id, userId)).run()
      }
      skipped++
    } else {
      const user = db
        .insert(schema.users)
        .values({
          username: g.username,
          password: hashed,
          role: roleStr,
          kode_login: generateKodeLogin(db),
        })
        .returning()
        .get()!
      userId = user.id
      inserted++
    }

    const guruExisting = db
      .select()
      .from(schema.guru)
      .where(eq(schema.guru.nip, g.nip))
      .get()
    if (!guruExisting) {
      db.insert(schema.guru)
        .values({
          user_id: userId,
          nip: g.nip,
          nama: g.nama,
          bidang_studi: g.bidangStudi,
        })
        .run()
    }
  }
  log(`  ✓ users (${inserted} new, ${skipped} existing) + guru (${specs.length})`)
  return specs
}

type DemoUser = {
  username: string
  password: string
  role: string
  guruNip?: string
}

const DEMO_USERS: DemoUser[] = [
  { username: "walikelas", password: "wali123", role: "wali_kelas" },
  { username: "guru", password: "guru123", role: "guru" },
]

export function seedDemoUsers(db: Db): void {
  const hashed = (pwd: string) => bcrypt.hashSync(pwd, 10)
  let inserted = 0
  let skipped = 0

  for (const du of DEMO_USERS) {
    const existing = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, du.username))
      .get()
    if (existing) {
      skipped++
      continue
    }
    db.insert(schema.users)
      .values({
        username: du.username,
        password: hashed(du.password),
        role: du.role,
        kode_login: generateKodeLogin(db),
      })
      .run()
    inserted++
  }
  log(`  ✓ demo users (${inserted} new, ${skipped} existing)`)
}

export function linkDemoUsers(db: Db): void {
  const xiiRpl = db
    .select()
    .from(schema.kelas)
    .where(eq(schema.kelas.nama_kelas, "XII RPL"))
    .get()
  if (xiiRpl?.wali_kelas_id) {
    const userRow = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "walikelas"))
      .get()
    if (userRow) {
      db.update(schema.guru)
        .set({ user_id: userRow.id })
        .where(eq(schema.guru.id, xiiRpl.wali_kelas_id))
        .run()
    }
  }

  const guruPweb = db
    .select()
    .from(schema.guru)
    .where(eq(schema.guru.bidang_studi, "Pemrograman Web"))
    .get()
  if (guruPweb) {
    const userRow = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "guru"))
      .get()
    if (userRow) {
      db.update(schema.guru)
        .set({ user_id: userRow.id })
        .where(eq(schema.guru.id, guruPweb.id))
        .run()
    }
  }
  log(`  ✓ demo users linked to guru records`)
}

export function getGuruIdByUsername(db: Db, username: string): number | null {
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .get()
  if (!user) return null
  const guru = db
    .select()
    .from(schema.guru)
    .where(eq(schema.guru.user_id, user.id))
    .get()
  return guru?.id ?? null
}
