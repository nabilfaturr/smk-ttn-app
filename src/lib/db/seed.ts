import bcrypt from "bcryptjs"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"

export function seedDatabase(db: ReturnType<typeof drizzle>) {
  // Cek apakah seed sudah pernah dijalankan
  const existingInfo = db.select().from(schema.infoSekolah).get()
  if (existingInfo) return

  // Info Sekolah
db.insert(schema.infoSekolah).values({
    nama: "SMK Taruna Tekno Nusantara",
    alamat: "Jl. Pembangunan, Sidirejo, Kec. Namo Rambe, Kab. Deli Serdang, Prov. Sumatera Utara",
    tempat: "Namorambe",
    kepala_sekolah: "Muhsin Rokan, S.Kom, S.H. M.H. Gr",
    npsn: "70035993",
  }).run()

  // Konfigurasi
  const configs = [
    { kunci: "JAM_PER_HARI", nilai: "6", keterangan: "Jumlah jam pelajaran per hari sekolah" },
    { kunci: "BOBOT_FORMATIF", nilai: "0.4", keterangan: "Bobot nilai formatif" },
    { kunci: "BOBOT_SUMATIF", nilai: "0.6", keterangan: "Bobot nilai sumatif" },
    { kunci: "KONVENSI_JAM_HARI", nilai: "pembulatan", keterangan: "Metode konversi jam ke hari" },
  ]
  for (const c of configs) {
    db.insert(schema.konfigurasi).values(c).run()
  }

  // Users - admin default
  const hashedPassword = bcrypt.hashSync("admin123", 10)
  db.insert(schema.users).values({
    username: "admin",
    password: hashedPassword,
    role: "admin",
  }).run()

  // Dimensi P5
  const dimensi = [
    "Keimanan dan Ketakwaan terhadap Tuhan YME",
    "Kewargaan",
    "Penalaran Kritis",
    "Kreativitas",
    "Kolaborasi",
    "Kemandirian",
    "Kesehatan",
    "Komunikasi",
  ]
  for (const nama of dimensi) {
    db.insert(schema.dimensiP5).values({ nama }).run()
  }

  // Subdimensi P5 (default sederhana) + assign ke semua tingkat
  const subdimensiNames = ["Akhlak Beragama", "Kolaborasi", "Kreativitas", "Penalaran Kritis", "Kemandirian", "Komunikasi"]
  const dimensiIds = db.select().from(schema.dimensiP5).all().map((d) => d.id)
  const subdimensiIds: string[] = []
  for (let i = 0; i < subdimensiNames.length; i++) {
    const inserted = db.insert(schema.subdimensiP5).values({
      dimensi_id: dimensiIds[i % dimensiIds.length],
      nama: subdimensiNames[i],
    }).returning().get()
    subdimensiIds.push(inserted.id)
  }
  for (const sid of subdimensiIds) {
    for (const tingkat of [10, 11, 12] as const) {
      db.insert(schema.subdimensiP5Tingkat).values({ subdimensi_id: sid, tingkat }).run()
    }
  }

  // Ekskul
  const ekskulList = ["Paskibra", "Karate", "Marching Band", "Pramuka", "Silat", "Taekwondo"]
  for (const nama of ekskulList) {
    db.insert(schema.ekskul).values({ nama, wajib: 0 }).run()
  }

  // Tahun Ajaran - 2025/2026 aktif
  db.insert(schema.tahunAjaran).values({
    nama: "2025/2026",
    semester: 1,
    is_active: 1,
  }).run()
}
