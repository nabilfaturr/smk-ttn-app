/**
 * Seed: 8 dimensi SMK TTN + 25 subdimensi + 75 narasi template.
 *
 * Migrasi dari master lama (Profil Pelajar Pancasila, 6 dimensi) ke master sekolah
 * (8 dimensi SMK TTN). Data nilai_kokurikuler lama jadi orphan, harus di-reset.
 *
 * Default aktif: 3 dimensi (KEIMANAN, KEWARGANEGARAAN, PENALARAN KRITIS) di X, XI, XII.
 * 5 dimensi lain non-aktif default — admin bisa toggle via KokurikulerTingkatPage.
 *
 * Pola narasi: action verb di awal, 1 kalimat per sub, spesifik per sub (bukan generic).
 */
import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { log } from "../helpers"
import { eq, and, inArray } from "drizzle-orm"

type DimensiDef = {
  nama: string
  subdimensi: Array<{
    nama: string
    berkembang: string
    cakap: string
    mahir: string
  }>
}

const DEFAULT_DIMENSI: DimensiDef[] = [
  {
    nama: "Keimanan dan Ketaqwaan Terhadap Tuhan Yang Maha Esa",
    subdimensi: [
      {
        nama: "Hubungan dengan Tuhan Yang Maha Esa",
        berkembang:
          "Memulai mengenal dan mengamalkan ajaran Tuhan Yang Maha Esa dalam kehidupan sehari-hari.",
        cakap:
          "Menghayati dan mengamalkan ajaran Tuhan Yang Maha Esa secara konsisten, serta mampu menegakkannya dalam kehidupan.",
        mahir:
          "Menginternalisasi nilai ketakwaan terhadap Tuhan Yang Maha Esa dan menjadikannya pedoman utama dalam mengambil keputusan hidup.",
      },
      {
        nama: "Hubungan dengan sesama Manusia",
        berkembang:
          "Mulai menunjukkan sikap hormat dan empati terhadap sesama dalam interaksi sehari-hari.",
        cakap:
          "Menunjukkan perilaku akhlak mulia yang mencerminkan kedewasaan moral dan spiritual serta menginternalisasi nilai kasih sayang, kejujuran, keadilan dan tanggung jawab dalam kehidupan pribadi, sosial, dan dunia kerja.",
        mahir:
          "Menjadi teladan akhlak mulia dalam pergaulan sosial, serta aktif menginspirasi orang lain untuk berlaku jujur, adil, dan penuh tanggung jawab.",
      },
      {
        nama: "Hubungan dengan Lingkungan Alam",
        berkembang: "Mulai peduli terhadap kelestarian lingkungan alam sekitar.",
        cakap: "Memahami pentingnya menjaga kelestarian lingkungan alam dan menerapkannya dalam kehidupan sehari-hari.",
        mahir: "Aktif menginisiasi kegiatan pelestarian lingkungan alam dan mendorong orang lain untuk berpartisipasi.",
      },
    ],
  },
  {
    nama: "Kewargaan",
    subdimensi: [
      {
        nama: "Kewargaan Lokal",
        berkembang: "Mulai mengenal norma, aturan, dan nilai sosial budaya di lingkungan sekitar.",
        cakap:
          "Terbiasa berperilaku sesuai norma, aturan dan nilai sosial budaya yang berlaku di masyarakatnya dan lingkungan kerja.",
        mahir: "Menjadi teladan dalam melestarikan nilai sosial budaya lokal dan aktif mengembangkannya di lingkungan masyarakat.",
      },
      {
        nama: "Kewargaan Nasional",
        berkembang: "Mulai mengenal aturan, norma, dan nilai sosial budaya di tingkat nasional.",
        cakap:
          "Terbiasa berperilaku sesuai aturan, norma, dan nilai sosial budaya yang berlaku di lingkup nasional dan menghargai keberagaman budayanya, serta berpartisipasi aktif menjaga NKRI.",
        mahir: "Berperan aktif dalam menjaga keutuhan NKRI dan menginspirasi orang lain untuk bangga terhadap budaya nasional.",
      },
      {
        nama: "Kewargaan Global",
        berkembang: "Mulai mengenal budaya global dan perbedaan dengan budaya sendiri.",
        cakap: "Menghargai keberagaman budaya global dan mampu berinteraksi dengan baik dalam konteks internasional.",
        mahir: "Aktif membangun jejaring lintas budaya dan mempromosikan nilai-nilai kemanusiaan di tingkat global.",
      },
    ],
  },
  {
    nama: "Penalaran Kritis",
    subdimensi: [
      {
        nama: "Penyampaian Argumentasi",
        berkembang: "Mulai mampu menyampaikan pendapat dengan logika sederhana.",
        cakap: "Menyampaikan argumentasi berdasarkan data dan informasi yang relevan dengan jelas dan terstruktur.",
        mahir: "Menyampaikan argumentasi yang kuat dan meyakinkan dengan mempertimbangkan berbagai perspektif.",
      },
      {
        nama: "Pengembangan Keputusan",
        berkembang: "Mulai mampu mengambil keputusan dengan bimbingan.",
        cakap:
          "Mengambil keputusan berbasis bukti dengan data dan informasi dari berbagai sumber relevan yang saling terkait untuk lingkungan kerja.",
        mahir: "Mengambil keputusan strategis yang tepat dengan mempertimbangkan dampak jangka panjang dan berbagai sudut pandang.",
      },
      {
        nama: "Penyelesaian Masalah",
        berkembang: "Mulai mampu mengidentifikasi masalah dengan bimbingan.",
        cakap: "Menganalisis masalah dari berbagai sudut pandang dan menemukan solusi yang tepat secara mandiri.",
        mahir: "Mengembangkan solusi inovatif untuk masalah kompleks dan mengkoordinasikan penerapannya.",
      },
    ],
  },
  {
    nama: "Kreativitas",
    subdimensi: [
      {
        nama: "Fleksibilitas berpikir",
        berkembang: "Mulai mampu melihat masalah dari satu sudut pandang.",
        cakap: "Mampu melihat masalah dari berbagai sudut pandang dan menghasilkan alternatif solusi.",
        mahir: "Menghasilkan pendekatan baru yang orisinal dalam menghadapi tantangan dan situasi kompleks.",
      },
      {
        nama: "Karya",
        berkembang: "Mulai menghasilkan karya sederhana dengan bimbingan.",
        cakap: "Menghasilkan karya orisinal yang memenuhi kriteria estetika dan fungsionalitas.",
        mahir: "Menciptakan karya yang inovatif dan diakui sebagai kontribusi bermakna di bidangnya.",
      },
      {
        nama: "Produk",
        berkembang: "Mulai merancang produk dengan bimbingan.",
        cakap: "Merancang produk yang orisinal dan aplikatif untuk memenuhi kebutuhan pengguna.",
        mahir: "Mengembangkan produk inovatif yang berdampak luas dan berkelanjutan.",
      },
    ],
  },
  {
    nama: "Kolaborasi",
    subdimensi: [
      {
        nama: "Berbagi",
        berkembang: "Mulai mampu berbagi sumber daya dengan orang lain.",
        cakap: "Berbagi pengetahuan, pengalaman, dan sumber daya secara efektif untuk mencapai tujuan bersama.",
        mahir: "Menginspirasi budaya berbagi yang inklusif dan berkelanjutan di lingkungan kerja dan masyarakat.",
      },
      {
        nama: "Kerja sama",
        berkembang: "Mulai bekerja sama dalam kelompok kecil dengan bimbingan.",
        cakap: "Bekerja sama secara efektif dalam tim untuk mencapai tujuan bersama dengan hasil yang optimal.",
        mahir: "Memimpin kolaborasi lintas tim dan menghasilkan sinergi yang melampaui ekspektasi.",
      },
      {
        nama: "Peduli",
        berkembang: "Mulai menunjukkan kepedulian terhadap anggota tim.",
        cakap: "Menunjukkan kepedulian aktif terhadap kesejahteraan anggota tim dan memberikan dukungan yang diperlukan.",
        mahir: "Membangun lingkungan kerja yang penuh empati dan kepedulian, di mana setiap anggota merasa dihargai dan didukung.",
      },
    ],
  },
  {
    nama: "Kemandirian",
    subdimensi: [
      {
        nama: "Bertanggung Jawab",
        berkembang: "Mulai mampu bertanggung jawab atas tindakan sendiri dengan bimbingan.",
        cakap: "Bertanggung jawab penuh atas tindakan, keputusan, dan hasil kerja sendiri secara konsisten.",
        mahir: "Menjadi teladan tanggung jawab dan menginspirasi orang lain untuk meningkatkan akuntabilitas.",
      },
      {
        nama: "Kepemimpinan",
        berkembang: "Mulai menunjukkan inisiatif dalam kelompok.",
        cakap: "Memimpin tim dengan visi yang jelas dan mampu memotivasi anggota untuk mencapai tujuan.",
        mahir: "Memimpin perubahan organisasi dan mengembangkan pemimpin-pemimpin baru yang efektif.",
      },
      {
        nama: "Pengembangan Diri",
        berkembang: "Mulai mengenali kekuatan dan area pengembangan diri.",
        cakap: "Aktif mengembangkan diri melalui pembelajaran berkelanjutan untuk meningkatkan kompetensi.",
        mahir: "Menjadi pembelajar seumur hidup yang secara konsisten mendorong batas-batas pengembangan diri.",
      },
    ],
  },
  {
    nama: "Kesehatan",
    subdimensi: [
      {
        nama: "Hidup bersih dan sehat",
        berkembang: "Mulai menerapkan pola hidup bersih dalam kehidupan sehari-hari.",
        cakap: "Menerapkan pola hidup bersih dan sehat secara konsisten di berbagai aspek kehidupan.",
        mahir: "Menjadi promotor gaya hidup sehat dan menginspirasi lingkungan untuk menerapkan pola hidup bersih.",
      },
      {
        nama: "Kebugaran, kesehatan fisik, dan kesehatan mental",
        berkembang: "Mulai menjaga kebugaran tubuh dan mengenali pentingnya kesehatan mental.",
        cakap: "Menjaga keseimbangan antara kebugaran fisik, kesehatan jasmani, dan kesehatan mental dalam keseharian.",
        mahir: "Mengelola keseimbangan fisik, mental, dan emosional dengan baik, serta menjadi contoh dalam menjaga kesehatan holistik.",
      },
      {
        nama: "Kesehatan Lingkungan",
        berkembang: "Mulai peduli terhadap kebersihan lingkungan sekitar.",
        cakap: "Berkontribusi aktif dalam menjaga kebersihan dan kesehatan lingkungan tempat tinggal dan kerja.",
        mahir: "Memimpin inisiatif kesehatan lingkungan yang berdampak luas dan berkelanjutan bagi masyarakat.",
      },
    ],
  },
  {
    nama: "Komunikasi",
    subdimensi: [
      {
        nama: "Menyimak",
        berkembang: "Mulai mampu menyimak dengan fokus terbatas.",
        cakap: "Menyimak dengan penuh perhatian dan memahami pesan dengan akurasi tinggi dalam berbagai konteks.",
        mahir: "Menyimak secara analitis, menangkap nuansa dan makna tersembunyi, serta merespons dengan bijaksana.",
      },
      {
        nama: "Berbicara",
        berkembang: "Mulai mampu menyampaikan pendapat dengan jelas.",
        cakap: "Berbicara dengan jelas, terstruktur, dan persuasif untuk berbagai audiens dan tujuan.",
        mahir: "Berbicara dengan otoritas dan karisma, mampu mempengaruhi dan menginspirasi audiens luas.",
      },
      {
        nama: "Membaca",
        berkembang: "Mulai mampu membaca teks dengan pemahaman terbatas.",
        cakap: "Membaca secara kritis dan analitis untuk memahami, mengevaluasi, dan mengintegrasikan informasi.",
        mahir: "Membaca dengan kedalaman tinggi, menghasilkan sintesis baru, dan mengarahkan diskusi berbasis bukti.",
      },
      {
        nama: "Menulis",
        berkembang: "Mulai mampu menulis dengan struktur sederhana.",
        cakap: "Menulis dengan jelas, terstruktur, dan efektif untuk berbagai tujuan dan audiens.",
        mahir: "Menulis dengan gaya orisinal dan berdampak, mampu menghasilkan karya yang diakui secara luas.",
      },
    ],
  },
]

/** Dimensi yang aktif by default (3 dari 8). */
const DEFAULT_AKTIF_NAMA: Set<string> = new Set([
  "Keimanan dan Ketaqwaan Terhadap Tuhan Yang Maha Esa",
  "Kewargaan",
  "Penalaran Kritis",
])

const ALL_TINGKAT = [10, 11, 12] as const

export function seedDimensiP5(db: Db): { idMap: Map<string, number>; subdimensiMap: Map<string, number> } {
  const expectedDimensiNames = new Set(DEFAULT_DIMENSI.map((d) => d.nama))

  // Hapus dimensi lama yang tidak ada di master baru (cascade nilai_kokurikuler)
  const existingDimensi = db.select().from(schema.dimensiP5).all()
  const dimensiToDelete = existingDimensi.filter((d) => !expectedDimensiNames.has(d.nama))
  for (const d of dimensiToDelete) {
    const oldSubIds = db
      .select({ id: schema.subdimensiP5.id })
      .from(schema.subdimensiP5)
      .where(eq(schema.subdimensiP5.dimensi_id, d.id))
      .all()
      .map((r) => r.id)
    if (oldSubIds.length > 0) {
      db.delete(schema.nilaiKokurikuler)
        .where(inArray(schema.nilaiKokurikuler.subdimensi_id, oldSubIds))
        .run()
      db.delete(schema.subdimensiP5Tingkat)
        .where(inArray(schema.subdimensiP5Tingkat.subdimensi_id, oldSubIds))
        .run()
      db.delete(schema.subdimensiP5).where(inArray(schema.subdimensiP5.id, oldSubIds)).run()
    }
    db.delete(schema.dimensiP5).where(eq(schema.dimensiP5.id, d.id)).run()
  }
  if (dimensiToDelete.length > 0) {
    log(`  ✓ dimensi cleanup (${dimensiToDelete.length} lama dihapus)`)
  }

  // Re-fetch setelah cleanup
  const dimensiExisting = db.select().from(schema.dimensiP5).all()
  const idMap = new Map<string, number>(dimensiExisting.map((d) => [d.nama, d.id]))

  // Insert/update dimensi
  for (const d of DEFAULT_DIMENSI) {
    if (!idMap.has(d.nama)) {
      const inserted = db.insert(schema.dimensiP5).values({ nama: d.nama }).returning().get()!
      idMap.set(d.nama, inserted.id)
    }
  }

  // Sync subdimensi
  const subExisting = db.select().from(schema.subdimensiP5).all()
  const subdimensiMap = new Map<string, number>()
  for (const sub of subExisting) {
    subdimensiMap.set(sub.nama, sub.id)
  }

  for (const d of DEFAULT_DIMENSI) {
    const dimensiId = idMap.get(d.nama)!
    for (const sub of d.subdimensi) {
      const found = subExisting.find((s) => s.dimensi_id === dimensiId && s.nama === sub.nama)
      if (!found) {
        const inserted = db
          .insert(schema.subdimensiP5)
          .values({
            dimensi_id: dimensiId,
            nama: sub.nama,
            deskripsi_berkembang: sub.berkembang,
            deskripsi_cakap: sub.cakap,
            deskripsi_mahir: sub.mahir,
          })
          .returning()
          .get()!
        subdimensiMap.set(sub.nama, inserted.id)
      } else {
        // Update deskripsi kalau berubah
        if (
          found.deskripsi_berkembang !== sub.berkembang ||
          found.deskripsi_cakap !== sub.cakap ||
          found.deskripsi_mahir !== sub.mahir
        ) {
          db.update(schema.subdimensiP5)
            .set({
              deskripsi_berkembang: sub.berkembang,
              deskripsi_cakap: sub.cakap,
              deskripsi_mahir: sub.mahir,
            })
            .where(eq(schema.subdimensiP5.id, found.id))
            .run()
        }
        subdimensiMap.set(sub.nama, found.id)
      }
    }
  }

  // Set default aktif: 3 dimensi × 3 tingkat = 9 rows
  const tingkatExisting = db.select().from(schema.subdimensiP5Tingkat).all()
  const tingkatSet = new Set(tingkatExisting.map((t) => `${t.subdimensi_id}-${t.tingkat}`))
  let aktifInserted = 0
  for (const dimensiNama of DEFAULT_AKTIF_NAMA) {
    const dimensiId = idMap.get(dimensiNama)
    if (!dimensiId) continue
    const subIds = db
      .select({ id: schema.subdimensiP5.id })
      .from(schema.subdimensiP5)
      .where(eq(schema.subdimensiP5.dimensi_id, dimensiId))
      .all()
      .map((r) => r.id)
    for (const subId of subIds) {
      for (const tingkat of ALL_TINGKAT) {
        const key = `${subId}-${tingkat}`
        if (!tingkatSet.has(key)) {
          db.insert(schema.subdimensiP5Tingkat)
            .values({ subdimensi_id: subId, tingkat })
            .run()
          aktifInserted++
        }
      }
    }
  }
  if (aktifInserted > 0) {
    log(`  ✓ default aktif (${aktifInserted} subdimensi × tingkat baru)`)
  }

  // Hapus tingkat untuk subdimensi yang dimensi-nya non-aktif (supaya bersih)
  const nonAktifDimensi = DEFAULT_DIMENSI.filter((d) => !DEFAULT_AKTIF_NAMA.has(d.nama)).map(
    (d) => d.nama,
  )
  let nonAktifRemoved = 0
  for (const dimensiNama of nonAktifDimensi) {
    const dimensiId = idMap.get(dimensiNama)
    if (!dimensiId) continue
    const subIds = db
      .select({ id: schema.subdimensiP5.id })
      .from(schema.subdimensiP5)
      .where(eq(schema.subdimensiP5.dimensi_id, dimensiId))
      .all()
      .map((r) => r.id)
    for (const subId of subIds) {
      for (const tingkat of ALL_TINGKAT) {
        const deleted = db
          .delete(schema.subdimensiP5Tingkat)
          .where(
            and(
              eq(schema.subdimensiP5Tingkat.subdimensi_id, subId),
              eq(schema.subdimensiP5Tingkat.tingkat, tingkat),
            ),
          )
          .run()
        nonAktifRemoved += deleted.changes
      }
    }
  }
  if (nonAktifRemoved > 0) {
    log(`  ✓ non-aktif cleanup (${nonAktifRemoved} tingkat dihapus)`)
  }

  log(`  ✓ dimensi_p5 (${idMap.size}) + subdimensi_p5 (${subdimensiMap.size})`)
  return { idMap, subdimensiMap }
}
