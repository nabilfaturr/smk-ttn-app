/**
 * Seed: mata_pelajaran (24 mapel).
 *
 * Struktur:
 * - 9 Mapel Umum
 * - 6 Mapel Agama (multi-religion, difilter per siswa)
 * - 6 Mapel Kejuruan RPL
 * - 6 Mapel Kejuruan TKJ
 * - 2 Mapel Pilihan Mulok
 *
 * Total: 9 + 6 + 6 + 6 + 2 = 29 (lebih dari 24 karena agama ada 6).
 */

import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { log, pickOne, createRng } from "../helpers"

type MapelSpec = {
  kode_mapel: string
  nama_mapel: string
  kelompok: "umum" | "kejuruan" | "muatan_lokal" | "khusus"
  jenis: "reguler" | "prakerin" | "ketarunaan" | "kokurikuler"
  bidang_studi: string // for matching guru
  agama_target?: string
}

const MAPEL_UMUM: MapelSpec[] = [
  { kode_mapel: "BIND", nama_mapel: "Bahasa Indonesia", kelompok: "umum", jenis: "reguler", bidang_studi: "Bahasa Indonesia" },
  { kode_mapel: "BING", nama_mapel: "Bahasa Inggris", kelompok: "umum", jenis: "reguler", bidang_studi: "Bahasa Inggris" },
  { kode_mapel: "MTK", nama_mapel: "Matematika", kelompok: "umum", jenis: "reguler", bidang_studi: "Matematika" },
  { kode_mapel: "IPA", nama_mapel: "Ilmu Pengetahuan Alam", kelompok: "umum", jenis: "reguler", bidang_studi: "IPA" },
  { kode_mapel: "IPS", nama_mapel: "Ilmu Pengetahuan Sosial", kelompok: "umum", jenis: "reguler", bidang_studi: "IPS" },
  { kode_mapel: "PKN", nama_mapel: "Pendidikan Pancasila", kelompok: "umum", jenis: "reguler", bidang_studi: "PKN" },
  { kode_mapel: "PJOK", nama_mapel: "Pendidikan Jasmani, Olahraga, dan Kesehatan", kelompok: "umum", jenis: "reguler", bidang_studi: "PJOK" },
  { kode_mapel: "SB", nama_mapel: "Seni Budaya", kelompok: "umum", jenis: "reguler", bidang_studi: "Seni Budaya" },
  { kode_mapel: "BSA", nama_mapel: "Basic Science Aviation (BSA)", kelompok: "muatan_lokal", jenis: "reguler", bidang_studi: "Sains" },
  { kode_mapel: "PU", nama_mapel: "Penalaran Umum (PU)", kelompok: "muatan_lokal", jenis: "reguler", bidang_studi: "Penalaran" },
]

const MAPEL_AGAMA: MapelSpec[] = [
  { kode_mapel: "AGAMA_ISLAM", nama_mapel: "Pendidikan Agama Islam", kelompok: "umum", jenis: "reguler", bidang_studi: "Pendidikan Agama Islam", agama_target: "AGAMA_ISLAM" },
  { kode_mapel: "AGAMA_KRISTEN", nama_mapel: "Pendidikan Agama Kristen", kelompok: "umum", jenis: "reguler", bidang_studi: "Pendidikan Agama Islam", agama_target: "AGAMA_KRISTEN" },
  { kode_mapel: "AGAMA_KATOLIK", nama_mapel: "Pendidikan Agama Katolik", kelompok: "umum", jenis: "reguler", bidang_studi: "Pendidikan Agama Islam", agama_target: "AGAMA_KATOLIK" },
  { kode_mapel: "AGAMA_HINDU", nama_mapel: "Pendidikan Agama Hindu", kelompok: "umum", jenis: "reguler", bidang_studi: "Pendidikan Agama Islam", agama_target: "AGAMA_HINDU" },
  { kode_mapel: "AGAMA_BUDDHA", nama_mapel: "Pendidikan Agama Buddha", kelompok: "umum", jenis: "reguler", bidang_studi: "Pendidikan Agama Islam", agama_target: "AGAMA_BUDDHA" },
  { kode_mapel: "AGAMA_KONGHUCU", nama_mapel: "Pendidikan Agama Konghucu", kelompok: "umum", jenis: "reguler", bidang_studi: "Pendidikan Agama Islam", agama_target: "AGAMA_KONGHUCU" },
]

const MAPEL_KEJURUAN_RPL: MapelSpec[] = [
  { kode_mapel: "PWEB", nama_mapel: "Pemrograman Web dan Perangkat Bergerak", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Pemrograman Web" },
  { kode_mapel: "PBO", nama_mapel: "Pemrograman Berorientasi Objek", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Pemrograman Berorientasi Objek" },
  { kode_mapel: "BD", nama_mapel: "Basis Data", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Basis Data" },
  { kode_mapel: "PPL", nama_mapel: "Projek Kreatif Rekayasa Perangkat Lunak", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Pemrograman Web" },
  { kode_mapel: "PKWU", nama_mapel: "Projek Kreatif dan Kewirausahaan", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Kewirausahaan" },
  { kode_mapel: "DDK", nama_mapel: "Pemrograman Berbasis Teks, Grafis, dan Multimedia", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Desain Grafis" },
  { kode_mapel: "CS", nama_mapel: "Cyber Security", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Pemrograman Web" },
]

const MAPEL_KEJURUAN_TKJ: MapelSpec[] = [
  { kode_mapel: "JAR", nama_mapel: "Jaringan Komputer", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Jaringan Komputer" },
  { kode_mapel: "ADS", nama_mapel: "Administrasi Server", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Administrasi Server" },
  { kode_mapel: "CLOUD", nama_mapel: "Cloud Computing", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Jaringan Komputer" },
  { kode_mapel: "IOT", nama_mapel: "Internet of Things", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Jaringan Komputer" },
  { kode_mapel: "FO", nama_mapel: "Instalasi Fiber Optik", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Jaringan Komputer" },
  { kode_mapel: "LINUX", nama_mapel: "Sistem Operasi Linux", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Administrasi Server" },
  { kode_mapel: "PKWU", nama_mapel: "Projek Kreatif dan Kewirausahaan", kelompok: "kejuruan", jenis: "reguler", bidang_studi: "Kewirausahaan" },
]

const MAPEL_PRAKERIN: MapelSpec[] = [
  { kode_mapel: "PRAKERIN_RPL", nama_mapel: "Praktik Kerja Lapangan (RPL)", kelompok: "khusus", jenis: "prakerin", bidang_studi: "Pemrograman Web" },
  { kode_mapel: "PRAKERIN_TKJ", nama_mapel: "Praktik Kerja Lapangan (TKJ)", kelompok: "khusus", jenis: "prakerin", bidang_studi: "Jaringan Komputer" },
]

const MAPEL_KETARUNAAN: MapelSpec[] = [
  { kode_mapel: "KETARUNAAN", nama_mapel: "Mata Pelajaran Ketarunaan", kelompok: "khusus", jenis: "ketarunaan", bidang_studi: "PKN" },
]

const MAPEL_KOKURIKULER: MapelSpec[] = [
  { kode_mapel: "KOKURIKULER_BBM", nama_mapel: "Kokurikuler BBM (Bela Bernegara)", kelompok: "khusus", jenis: "kokurikuler", bidang_studi: "PKN" },
  { kode_mapel: "KOKURIKULER_BKK", nama_mapel: "Kokurikuler BKK (Bela Kemanusiaan)", kelompok: "khusus", jenis: "kokurikuler", bidang_studi: "PKN" },
]

const ALL_MAPEL: MapelSpec[] = [
  ...MAPEL_UMUM,
  ...MAPEL_AGAMA,
  ...MAPEL_KEJURUAN_RPL,
  ...MAPEL_KEJURUAN_TKJ,
  ...MAPEL_PRAKERIN,
  ...MAPEL_KETARUNAAN,
  ...MAPEL_KOKURIKULER,
]

/* ------------------------------------------------------------------ */
/*  Seed                                                               */
/* ------------------------------------------------------------------ */

export function seedMapel(db: Db): Map<string, { id: number; spec: MapelSpec }> {
  const existing = db.select().from(schema.mataPelajaran).all()
  const existingByKode = new Map(existing.map((m) => [m.kode_mapel, m]))

  // Note: Tidak ada `guru_id` di mapel lagi (Step 7). Guru pengampu per
  // (mapel, kelas, TA) sepenuhnya di tabel junction `mapel_kelas_guru`.
  // Backfill junction di `backfillMapelKelasGuru` (pilih guru dari
  // bidang_studi match).

  const result = new Map<string, { id: number; spec: MapelSpec }>()

  for (const spec of ALL_MAPEL) {
    let mapelId: number
    if (existingByKode.has(spec.kode_mapel)) {
      mapelId = existingByKode.get(spec.kode_mapel)!.id
    } else {
      const inserted = db
        .insert(schema.mataPelajaran)
        .values({
          kode_mapel: spec.kode_mapel,
          nama_mapel: spec.nama_mapel,
          jenis: spec.jenis,
          kelompok: spec.kelompok,
          agama_target: spec.agama_target ?? null,
        })
        .returning()
        .get()!
      mapelId = inserted.id
      // Update existingByKode agar duplikat kode_mapel (mis. PKWU di RPL & TKJ) tidak insert ulang
      existingByKode.set(spec.kode_mapel, inserted)
    }
    result.set(spec.kode_mapel, { id: mapelId, spec })
  }
  log(`  ✓ mata_pelajaran (${result.size} total)`)
  return result
}

/**
 * Backfill `mapel_kelas_guru` junction untuk fresh DB.
 *
 * Untuk setiap mapel reguler, pilih guru dari `bidang_studi` match,
 * lalu assign ke semua kelas di TA aktif. Idempotent: skip kalau row sudah ada.
 *
 * Dipanggil dari full-seed.ts setelah seedMapel DAN seedKelas.
 */
export function backfillMapelKelasGuru(db: Db): void {
  const taAktif = db
    .select()
    .from(schema.tahunAjaran)
    .where(eq(schema.tahunAjaran.is_active, 1))
    .get()
  if (!taAktif) {
    log(`  ⚠ backfill junction skip: tidak ada TA aktif`)
    return
  }

  // Pick guru from bidang_studi (sama dengan logika lama di seedMapel)
  const allGuru = db.select().from(schema.guru).all()
  const guruByBidang = new Map<string, number[]>()
  for (const g of allGuru) {
    const key = g.bidang_studi ?? ""
    if (!guruByBidang.has(key)) guruByBidang.set(key, [])
    guruByBidang.get(key)!.push(g.id)
  }
  const allGuruIds = allGuru.map((g) => g.id)
  const rng = createRng(8888) // deterministic

  const mapelReguler = db
    .select()
    .from(schema.mataPelajaran)
    .where(eq(schema.mataPelajaran.jenis, "reguler"))
    .all()

  const kelasAll = db.select().from(schema.kelas).all()
  if (mapelReguler.length === 0 || kelasAll.length === 0) {
    log(`  ⚠ backfill junction skip: mapel=${mapelReguler.length}, kelas=${kelasAll.length}`)
    return
  }

  // Existing rows (untuk idempotency)
  const existingRows = db
    .select()
    .from(schema.mapelKelasGuru)
    .where(eq(schema.mapelKelasGuru.tahun_ajaran_id, taAktif.id))
    .all()
  const existingKey = new Set(
    existingRows.map((r) => `${r.mapel_id}-${r.kelas_id}-${r.tahun_ajaran_id}`),
  )

  // Map mapel_id → picked guru (deterministic per mapel)
  // Fallback: kalau bidang_studi gak ada guru match, ambil guru random dari semua guru
  const mapelToGuru = new Map<number, number>()
  for (const m of mapelReguler) {
    const spec = ALL_MAPEL.find((s) => s.kode_mapel === m.kode_mapel)
    if (!spec) continue
    let guruIds = guruByBidang.get(spec.bidang_studi)
    if (!guruIds || guruIds.length === 0) {
      guruIds = allGuruIds
    }
    if (guruIds.length === 0) continue
    mapelToGuru.set(m.id, pickOne(guruIds, rng))
  }

  let inserted = 0
  let skipped = 0
  let noGuru = 0
  for (const m of mapelReguler) {
    const guruId = mapelToGuru.get(m.id)
    if (!guruId) {
      noGuru++
      continue
    }
    for (const k of kelasAll) {
      const key = `${m.id}-${k.id}-${taAktif.id}`
      if (existingKey.has(key)) {
        skipped++
        continue
      }
      db.insert(schema.mapelKelasGuru)
        .values({
          mapel_id: m.id,
          kelas_id: k.id,
          guru_id: guruId,
          tahun_ajaran_id: taAktif.id,
        })
        .run()
      inserted++
    }
  }
  log(`  ✓ mapel_kelas_guru backfill (${inserted} new, ${skipped} skip, ${noGuru} no guru)`)
}
