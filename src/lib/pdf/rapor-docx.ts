/**
 * Generator Rapor Akademik DOCX — Kurikulum Merdeka (SMK TTN).
 *
 * Output format: DOCX (Word) menggunakan docxtemplater + template asli.
 * Template: build/rapor-template.docx (dari RAPORT KURMER XII RPL.docx).
 *
 * Struktur data mengikuti template:
 *   1. Identitas Siswa (7-col table)
 *   2. Nilai Mata Pelajaran (grouped: Umum / Kejuruan / Muatan Lokal)
 *   3. Kokurikuler (narasi P5)
 *   4. Ekstrakurikuler (7 rows: Ketarunaan + 6 pilihan)
 *   5. Ketidakhadiran (Sakit/Izin/TK)
 *   6. Catatan Wali Kelas
 *   7. TTD Orang Tua / Wali Kelas / Kepala Sekolah
 */

import { getDb } from "../db"
import {
  siswa as siswaTable,
  kelas as kelasTable,
  mataPelajaran as mapelTable,
  nilai as nilaiTable,
  nilaiEkskul as ekskulTable,
  ekskul as ekskulMasterTable,
  catatanWaliKelas as catatanTable,
  konfigurasi as configTable,
  absensi as absensiTable,
  tahunAjaran as tahunTable,
  nilaiKokurikuler as nilaiKokurikulerTable,
  subdimensiP5 as subdimensiP5Table,
  subdimensiP5Tingkat as subdimensiP5TingkatTable,
  tujuanPembelajaran as tpTable,
  nilaiTp as nilaiTpTable,
  infoSekolah as infoSekolahTable,
} from "../db/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import * as fs from "fs"
import * as path from "path"
import { generateNarasiKokurikuler } from "../calculations/grades"

/* ------------------------------------------------------------------ */
/*  Mapping program_keahlian → bidang/program/konsentrasi             */
/* ------------------------------------------------------------------ */

const PROGRAM_KEAHLIAN_LABELS: Record<string, { bidang: string; program: string; konsentrasi: string }> = {
  RPL: {
    bidang: "Teknologi Informasi",
    program: "Pengembangan Perangkat Lunak dan Gim",
    konsentrasi: "Rekayasa Perangkat Lunak",
  },
  TKJ: {
    bidang: "Teknologi Informasi",
    program: "Teknik Komputer dan Jaringan",
    konsentrasi: "Teknik Komputer dan Jaringan",
  },
  Penerbangan: {
    bidang: "Teknologi Penerbangan",
    program: "Penerbangan",
    konsentrasi: "Penerbangan",
  },
  Ketarunaan: {
    bidang: "Ketarunaan",
    program: "Ketarunaan",
    konsentrasi: "Ketarunaan",
  },
}

function getProgramLabels(programKeahlian: string | null) {
  const key = programKeahlian ?? "RPL"
  return PROGRAM_KEAHLIAN_LABELS[key] ?? PROGRAM_KEAHLIAN_LABELS.RPL!
}

/* ------------------------------------------------------------------ */
/*  Mapel grouping per template                                        */
/* ------------------------------------------------------------------ */

// Kelompok Umum: Agama (sesuai siswa) + PKN + BIND
const UMUM_KODES = ["PKN", "BIND"]

// Kelompok Kejuruan: MTK + BING + mapel kejuruan per program
const KEJURUAN_EXTRA = ["MTK", "BING"]
const KEJURUAN_BY_PROGRAM: Record<string, string[]> = {
  RPL: ["PWEB", "PBO", "BD", "PPL", "PKWU", "DDK"],
  TKJ: ["JAR", "ADS", "CLOUD", "IOT", "FO", "LINUX", "PKWU"],
}

// Muatan Lokal: BSA + PU
const MUATAN_LOKAL_KODES = ["BSA", "PU"]

/* ------------------------------------------------------------------ */
/*  Capaian Kompetensi: Opsi A (1 kalimat per TP)                      */
/* ------------------------------------------------------------------ */

function generateCapaianKompetensi(
  db: ReturnType<typeof getDb>,
  nilaiId: number,
): string {
  const tpRows = db
    .select()
    .from(nilaiTpTable)
    .where(eq(nilaiTpTable.nilai_id, nilaiId))
    .all()

  if (tpRows.length === 0) return ""

  const sentences: string[] = []
  for (const ntp of tpRows) {
    const tp = db
      .select()
      .from(tpTable)
      .where(eq(tpTable.id, ntp.tp_id))
      .get()
    if (!tp) continue

    if (ntp.capaian === "T") {
      sentences.push(`Mencapai kompetensi dengan sangat baik dalam hal ${tp.deskripsi_tuntas}`)
    } else {
      sentences.push(`Perlu peningkatan dalam hal ${tp.deskripsi_remediasi}`)
    }
  }

  return sentences.join(". ")
}

/* ------------------------------------------------------------------ */
/*  Generator utama                                                     */
/* ------------------------------------------------------------------ */

export function generateRaporDocx(
  siswaId: number,
  kelasId: number,
  tahunAjaranId: number,
): Buffer {
  const db = getDb()

  // === Load data ===
  const s = db.select().from(siswaTable).where(eq(siswaTable.id, siswaId)).get()!
  const k = db.select().from(kelasTable).where(eq(kelasTable.id, kelasId)).get()!
  const tahun = db.select().from(tahunTable).where(eq(tahunTable.id, tahunAjaranId)).get()!
  const infoSekolah = db.select().from(infoSekolahTable).get()
  const programLabels = getProgramLabels(k.program_keahlian)

  // Semester text
  const semesterText = `${tahun.semester} (${tahun.semester === 1 ? "Satu" : "Dua"}) / ${tahun.semester === 1 ? "Ganjil" : "Genap"}`

  // === Table 0: Identitas ===
  const namaSekolah = infoSekolah?.nama ?? "SMK Taruna Tekno Nusantara"
  const alamatSekolah = infoSekolah?.alamat ?? "-"

  // === Table 1: Nilai per group ===
  const mapelAll = db.select().from(mapelTable).where(eq(mapelTable.jenis, "reguler")).all()
  const mapelByKode = new Map(mapelAll.map((m) => [m.kode_mapel, m]))
  const allNilai = db
    .select()
    .from(nilaiTable)
    .where(and(eq(nilaiTable.siswa_id, s.id), eq(nilaiTable.tahun_ajaran_id, tahunAjaranId)))
    .all()
  const nilaiByMapelId = new Map(allNilai.map((n) => [n.mapel_id, n]))

  type MapelRow = { no: string; nama_mapel: string; nilai_akhir: string; capaian: string }
  type NilaiGroup = { group_label: string; mapel_list: MapelRow[] }

  const nilaiGroups: NilaiGroup[] = []
  let noUrut = 0

  const buildMapelRow = (kode: string): MapelRow | null => {
    const m = mapelByKode.get(kode)
    if (!m) return null
    if (m.agama_target && m.agama_target !== `AGAMA_${s.agama?.split(" ")[0]?.toUpperCase() ?? ""}`) return null

    noUrut++
    const nilaiRecord = nilaiByMapelId.get(m.id)
    const nilai = nilaiRecord?.nilai_rapor ?? null
    const nilaiStr = nilai != null ? String(Math.round(nilai)) : "-"

    const capaian = nilaiRecord ? generateCapaianKompetensi(db, nilaiRecord.id) : ""

    return {
      no: String(noUrut),
      nama_mapel: m.nama_mapel,
      nilai_akhir: nilaiStr,
      capaian,
    }
  }

  // Group A: Umum (Agama + PKN + BIND)
  const umumRows: MapelRow[] = []
  const agamaKode = `AGAMA_${s.agama?.split(" ")[0]?.toUpperCase() ?? ""}`
  const agamaMapel = mapelAll.find((m) => m.agama_target && m.agama_target === agamaKode)
  if (agamaMapel) {
    const row = buildMapelRow(agamaMapel.kode_mapel)
    if (row) umumRows.push(row)
  }
  for (const kode of UMUM_KODES) {
    const row = buildMapelRow(kode)
    if (row) umumRows.push(row)
  }
  if (umumRows.length > 0) {
    nilaiGroups.push({ group_label: "A. Kelompok Mata Pelajaran Umum:", mapel_list: umumRows })
  }

  // Group B: Kejuruan (MTK + BING + kejuruan per program)
  const kejuruanRows: MapelRow[] = []
  for (const kode of KEJURUAN_EXTRA) {
    const row = buildMapelRow(kode)
    if (row) kejuruanRows.push(row)
  }
  const kejuruanKodes = KEJURUAN_BY_PROGRAM[k.program_keahlian ?? "RPL"] ?? KEJURUAN_BY_PROGRAM.RPL!
  for (const kode of kejuruanKodes) {
    const row = buildMapelRow(kode)
    if (row) kejuruanRows.push(row)
  }
  if (kejuruanRows.length > 0) {
    nilaiGroups.push({ group_label: "B. Kelompok Mata Pelajaran Kejuruan:", mapel_list: kejuruanRows })
  }

  // Group C: Muatan Lokal (BSA + PU)
  const mulokRows: MapelRow[] = []
  for (const kode of MUATAN_LOKAL_KODES) {
    const row = buildMapelRow(kode)
    if (row) mulokRows.push(row)
  }
  if (mulokRows.length > 0) {
    nilaiGroups.push({ group_label: "Muatan Lokal", mapel_list: mulokRows })
  }

  // === Table 2: Kokurikuler (Opsi A: gabung semua, filter by tingkat) ===
  const kokuValues = db
    .select()
    .from(nilaiKokurikulerTable as any)
    .where(and(
      eq(nilaiKokurikulerTable.siswa_id as any, s.id),
      eq(nilaiKokurikulerTable.tahun_ajaran_id as any, tahunAjaranId),
    ))
    .all() as any[]

  // Ambil subdimensi aktif untuk tingkat kelas siswa ini
  const activeSubIds = (db.select().from(subdimensiP5TingkatTable as any)
    .where(eq(subdimensiP5TingkatTable.tingkat as any, k.tingkat)).all() as any[])
    .map((t) => t.subdimensi_id)

  let kokurikulerText = ""
  if (kokuValues.length > 0 && activeSubIds.length > 0) {
    const subdimensiRows = db.select().from(subdimensiP5Table as any).all() as any[]
    const narasiInput = kokuValues
      .filter((v) => activeSubIds.includes(v.subdimensi_id))
      .map((v) => {
        const sd = subdimensiRows.find((sd) => sd.id === v.subdimensi_id)
        return {
          subdimensi_id: v.subdimensi_id,
          grade: v.grade ?? 0,
          deskripsi_berkembang: sd?.deskripsi_berkembang ?? "",
          deskripsi_cakap: sd?.deskripsi_cakap ?? "",
          deskripsi_mahir: sd?.deskripsi_mahir ?? "",
        }
      })
    kokurikulerText = generateNarasiKokurikuler(narasiInput)
  }

  // === Table 3: Ekskul (hanya yang di-enroll siswa) ===
  const eks = db
    .select()
    .from(ekskulTable)
    .leftJoin(ekskulMasterTable, eq(ekskulTable.ekskul_id, ekskulMasterTable.id))
    .where(and(eq(ekskulTable.siswa_id, s.id), eq(ekskulTable.tahun_ajaran_id, tahunAjaranId)))
    .all()

  const allEkskulMaster = db.select().from(ekskulMasterTable).all()
  const ekskulList: Array<{ no: string; nama_ekskul: string; predikat: string; keterangan: string }> = []

  // Tampilkan SEMUA ekskul yang di-enroll siswa (Ketarunaan + pilihan yang diikuti).
  // Predikat default "A" jika belum ada di DB. Guru dapat mengubah di DOCX.
  let noEkskul = 0
  // Sort: wajib duluan (Ketarunaan), lalu nama abjad
  const sortedEkskul = allEkskulMaster.sort((a, b) => {
    if (a.wajib !== b.wajib) return b.wajib - a.wajib
    return a.nama.localeCompare(b.nama)
  })
  for (const e of sortedEkskul) {
    const nilai = eks.find((row) => row.ekskul?.id === e.id)
    if (!nilai) continue // siswa tidak enroll → skip
    noEkskul++
    ekskulList.push({
      no: String(noEkskul),
      nama_ekskul: e.nama,
      predikat: nilai.nilai_ekskul?.predikat || "A",
      keterangan: e.wajib === 1 ? "Wajib" : "Pilihan",
    })
  }

  // === Table 4: Ketidakhadiran ===
  const tahunParts = tahun.nama.split("/").map((s) => parseInt(s.trim(), 10))
  const firstYear = tahunParts[0] ?? new Date().getFullYear()
  const secondYear = tahunParts[1] ?? firstYear + 1
  const isGanjil = tahun.semester === 1
  const startDate = isGanjil ? `${firstYear}-07-01` : `${secondYear}-01-01`
  const endDate = isGanjil ? `${firstYear}-12-31` : `${secondYear}-06-30`
  const jamPerHariRow = db.select().from(configTable).where(eq(configTable.kunci, "JAM_PER_HARI")).get()
  const jamPerHari = jamPerHariRow ? parseInt(jamPerHariRow.nilai) : 6

  const absS = db
    .select()
    .from(absensiTable)
    .where(
      and(
        eq(absensiTable.siswa_id, s.id),
        gte(absensiTable.tanggal, startDate),
        lte(absensiTable.tanggal, endDate),
      ),
    )
    .all() as any[]
  const sakitHari = Math.floor(absS.filter((a) => a.status === "S").length / jamPerHari)
  const izinHari = Math.floor(absS.filter((a) => a.status === "I").length / jamPerHari)
  const tkHari = Math.floor(absS.filter((a) => a.status === "TK").length / jamPerHari)

  // === Table 5: Catatan Wali Kelas ===
  const catatan = db
    .select()
    .from(catatanTable)
    .where(and(eq(catatanTable.siswa_id, s.id), eq(catatanTable.tahun_ajaran_id, tahunAjaranId)))
    .get()

  // === Table 6: TTD ===
  const today = new Date()
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  const tanggalStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`
  const kepalaSekolah = infoSekolah?.kepala_sekolah ?? ""
  const tempatTtd = infoSekolah?.tempat ?? "Namorambe"

  // === Build template data ===
  const templateData = {
    // Table 0: Identitas
    nama_siswa: s.nama,
    nis_nisn: `${s.nis ?? "-"} / ${s.nisn ?? "-"}`,
    bidang_keahlian: programLabels.bidang,
    prog_keahlian: programLabels.program,
    konsentrasi_keahlian: programLabels.konsentrasi,
    kelas: k.nama_kelas,
    sekolah: namaSekolah,
    semester: semesterText,
    alamat: alamatSekolah,
    tahun_ajaran: tahun.nama,

    // Table 1: Nilai
    nilai_groups: nilaiGroups,

    // Table 2: Kokurikuler
    kokurikuler_text: kokurikulerText,

    // Table 3: Ekskul
    ekskul_list: ekskulList.length > 0 ? ekskulList : [{ no: "", nama_ekskul: "", predikat: "", keterangan: "" }],

    // Table 4: Ketidakhadiran
    sakit_hari: String(sakitHari),
    izin_hari: String(izinHari),
    tk_hari: String(tkHari),

    // Table 5: Catatan Wali Kelas
    catatan_wali_kelas: catatan?.catatan ?? "",

    // Table 6: TTD
    tempat_ttd: tempatTtd,
    tanggal_ttd: tanggalStr,
    kepala_sekolah: kepalaSekolah,
  }

  // === Load template and render ===
  // Cari template di beberapa lokasi (dev vs production/packed)
  const candidatePaths = [
    path.join(__dirname, "rapor-template.docx"),           // dist-electron/ (packed)
    path.join(process.cwd(), "build/rapor-template.docx"),  // dev (from project root)
    path.join(path.dirname(__dirname), "rapor-template.docx"), // parent of dist-electron
  ]
  let templatePath: string | null = null
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      templatePath = p
      break
    }
  }
  if (!templatePath) {
    throw new Error(`Template rapor tidak ditemukan. Dicari di: ${candidatePaths.join(", ")}`)
  }

  const templateContent = fs.readFileSync(templatePath)
  const zip = new PizZip(templateContent)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  })

  doc.render(templateData)

  const generated = doc.getZip().generate({ type: "nodebuffer" })
  return generated
}