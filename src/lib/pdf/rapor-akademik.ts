/**
 * Generator Rapor Akademik — Kurikulum Merdeka (SMK TTN).
 *
 * Format mengikuti contoh "RAPORT KURMER XII RPL.docx":
 *   1. Identitas Siswa (tabel 2-kolom)
 *   2. Nilai Mata Pelajaran (tabel grouped: Umum / Kejuruan / Muatan Lokal)
 *   3. Kokurikuler (narasi)
 *   4. Ekstrakurikuler (7 rows: Ketarunaan + 6 pilihan)
 *   5. Ketidakhadiran (3 rows: Sakit/Izin/TK)
 *   6. Catatan Wali Kelas
 *   7. TTD Orang Tua/Wali Kelas/Kepala Sekolah
 *
 * Page: A4 portrait, margin ~0.5cm.
 * Font: Helvetica 8.5pt untuk body, 10pt untuk header section.
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
} from "../db/schema"
import { eq, and } from "drizzle-orm"
import PDFDocument from "pdfkit"
import { createPdfDocument } from "./pdf-utils"
import { generateNarasiKokurikuler } from "../calculations/grades"
import { calculateRanking } from "../calculations/ranking"

/* ------------------------------------------------------------------ */
/*  Konfigurasi kolom per table (ukurannya dalam points, 1cm ≈ 28.35) */
/* ------------------------------------------------------------------ */

const CM = 28.35

// Lebar area konten: 21cm (A4) - 0.5cm margin kiri - 0.5cm margin kanan = 20cm
const CONTENT_WIDTH = 20 * CM

// Table 1: Identitas (2 sub-kolom: left label-value, right label-value)
const T1_COLS = [2.3 * CM, 0.5 * CM, 6.5 * CM, 0.5 * CM, 3.2 * CM, 0.5 * CM, 6.8 * CM]

// Table 2: Nilai (No, Mapel, Nilai, Capaian)
const T2_COLS = [0.9 * CM, 6.5 * CM, 2.0 * CM, 10.5 * CM]

// Table 4: Ekskul (No, Ekskul, Predikat, Keterangan)
const T4_COLS = [0.9 * CM, 6.5 * CM, 2.5 * CM, 10.0 * CM]

// Table 5: Ketidakhadiran (narrow, doesn't fill page)
const T5_COLS = [3.5 * CM, 0.6 * CM, 2.3 * CM, 1.2 * CM]

// Table 7: TTD (3 kolom sama besar)
const T7_COLS = [6.6 * CM, 6.6 * CM, 6.6 * CM]

/* ------------------------------------------------------------------ */
/*  Mapping program_keahlian → bidang/program/konsentrasi            */
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
/*  Filter mapel per group                                             */
/* ------------------------------------------------------------------ */

// Mapel yang masuk "A. Kelompok Mata Pelajaran Umum" (3 mapel tetap)
const UMUM_KODES = ["PKN", "BIND"]

// Mapel kejuruan per program keahlian
const KEJURUAN_BY_PROGRAM: Record<string, string[]> = {
  RPL: ["PWEB", "PBO", "BD", "PPL", "DDK", "CS"],
  TKJ: ["JAR", "ADS", "CLOUD", "IOT", "FO", "LINUX"],
}

// Muatan Lokal (saat ini cuma BJ)
const MUATAN_LOKAL_KODES = ["BJ"]

/* ------------------------------------------------------------------ */
/*  Generator utama                                                     */
/* ------------------------------------------------------------------ */

export function generateRaporAkademik(
  siswaId: string,
  kelasId: string,
  tahunAjaranId: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const db = getDb()
      const doc = createPdfDocument()
      const buffers: Buffer[] = []
      doc.on("data", (chunk: Buffer) => buffers.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(buffers)))
      doc.on("error", reject)

      const s = db.select().from(siswaTable).where(eq(siswaTable.id, siswaId)).get()!
      const k = db.select().from(kelasTable).where(eq(kelasTable.id, kelasId)).get()!
      const tahun = db.select().from(tahunTable).where(eq(tahunTable.id, tahunAjaranId)).get()!
      const programLabels = getProgramLabels(k.program_keahlian)

      /* =============================================================== */
      /*  Section 1: Identitas Siswa (2-col table)                        */
      /* =============================================================== */
      const semesterText = `${tahun.semester} (${tahun.semester === 1 ? "Satu" : "Dua"}) / ${tahun.semester === 1 ? "Ganjil" : "Genap"}`
      const t1Rows: string[][] = [
        ["Nama Siswa", ":", s.nama, "", "Prog. Keahlian", ":", programLabels.program],
        ["NIS / NISN", ":", `${s.nis ?? "-"} / ${s.nisn ?? "-"}`, "", "Konsentrasi Keahlian", ":", programLabels.konsentrasi],
        ["Bid. Keahlian", ":", programLabels.bidang, "", "Kelas", ":", k.nama_kelas],
        ["Sekolah", ":", "SMK Taruna Tekno Nusantara", "", "Semester", ":", semesterText],
        ["Alamat", ":", "Jl. Pembangunan, Sidirejo, Kec. Namo Rambe, Kab. Deli Serdang, Prov. Sumatera Utara", "", "Tahun Pelajaran", ":", tahun.nama],
      ]
      drawTable(doc, T1_COLS, t1Rows, { fontSize: 8.5 })
      doc.moveDown(0.4)

      /* =============================================================== */
      /*  Section 2: Nilai Mata Pelajaran (4-col, grouped)                */
      /* =============================================================== */
      const mapelAll = db.select().from(mapelTable).where(eq(mapelTable.jenis, "reguler")).all()
      const mapelByKode = new Map(mapelAll.map((m) => [m.kode_mapel, m]))
      const nilaiBySiswaMapel = new Map<string, number | null>()
      const allNilai = db
        .select()
        .from(nilaiTable)
        .where(and(eq(nilaiTable.siswa_id, s.id), eq(nilaiTable.tahun_ajaran_id, tahunAjaranId)))
        .all()
      for (const n of allNilai) {
        nilaiBySiswaMapel.set(`${n.mapel_id}`, n.nilai_rapor)
      }

      // Build nilai rows per group
      const t2Rows: Array<string[] | { groupHeader: string; colspan: number }> = []
      let noUrut = 0

      const addNilai = (kode: string) => {
        const m = mapelByKode.get(kode)
        if (!m) return
        // Filter agama: kalau mapel agama, harus sesuai siswa.agama
        if (m.agama_target && m.agama_target !== `AGAMA_${s.agama?.split(" ")[0]?.toUpperCase() ?? ""}`) return
        noUrut++
        const nilai = nilaiBySiswaMapel.get(`${m.id}`) ?? null
        const nilaiStr = nilai != null ? String(Math.round(nilai)) : "-"
        t2Rows.push([String(noUrut), m.nama_mapel, nilaiStr, ""]) // deskripsi dikosongkan (auto-gen)
      }

      // A. Umum
      t2Rows.push({ groupHeader: "A. Kelompok Mata Pelajaran Umum:", colspan: 4 })
      // Agama (sesuai siswa) + PKN + BIND
      const agamaKode = `AGAMA_${s.agama?.split(" ")[0]?.toUpperCase() ?? ""}`
      const agamaMapel = mapelAll.find((m) => m.agama_target && m.agama_target === agamaKode)
      if (agamaMapel) addNilai(agamaMapel.kode_mapel)
      for (const kode of UMUM_KODES) addNilai(kode)

      // B. Kejuruan
      t2Rows.push({ groupHeader: "B. Kelompok Mata Pelajaran Kejuruan:", colspan: 4 })
      const kejuruanKodes = KEJURUAN_BY_PROGRAM[k.program_keahlian ?? "RPL"] ?? KEJURUAN_BY_PROGRAM.RPL!
      for (const kode of kejuruanKodes) addNilai(kode)

      // Muatan Lokal
      t2Rows.push({ groupHeader: "Muatan Lokal", colspan: 4 })
      for (const kode of MUATAN_LOKAL_KODES) addNilai(kode)

      // Header + body
      drawSectionedTable(doc, T2_COLS, ["No", "Mata Pelajaran", "Nilai Akhir", "Capaian Kompetensi"], t2Rows, {
        fontSize: 10,
        headerFontSize: 10,
        noBorder: false,
      })
      doc.moveDown(0.4)

      /* =============================================================== */
      /*  Section 3: Kokurikuler (P5)                                     */
      /* =============================================================== */
      const kokuValues = db
        .select()
        .from(nilaiKokurikulerTable as any)
        .where(and(
          eq(nilaiKokurikulerTable.siswa_id as any, s.id),
          eq(nilaiKokurikulerTable.tahun_ajaran_id as any, tahunAjaranId),
        ))
        .all() as any[]

      const kokurikulerRows: string[][] = [["Kokurikuler"]]
      if (kokuValues.length > 0) {
        const subdimensiRows = db.select().from(subdimensiP5Table as any).all() as any[]
        const narasiInput = kokuValues.map((v) => {
          const sd = subdimensiRows.find((sd) => sd.id === v.subdimensi_id)
          return {
            subdimensi_id: v.subdimensi_id,
            grade: v.grade ?? 0,
            deskripsi_berkembang: sd?.deskripsi_berkembang ?? "",
            deskripsi_cakap: sd?.deskripsi_cakap ?? "",
            deskripsi_mahir: sd?.deskripsi_mahir ?? "",
          }
        })
        const narasi = generateNarasiKokurikuler(narasiInput)
        kokurikulerRows.push([narasi])
      } else {
        kokurikulerRows.push([""])
      }
      drawTable(doc, [CONTENT_WIDTH], kokurikulerRows, { fontSize: 9, headerRows: [0], bold: true })
      doc.moveDown(0.4)

      /* =============================================================== */
      /*  Section 4: Ekstrakurikuler (hanya yang di-enroll siswa)           */
      /* =============================================================== */
      const eks = db
        .select()
        .from(ekskulTable)
        .leftJoin(ekskulMasterTable, eq(ekskulTable.ekskul_id, ekskulMasterTable.id))
        .where(and(eq(ekskulTable.siswa_id, s.id), eq(ekskulTable.tahun_ajaran_id, tahunAjaranId)))
        .all()

      // Sort: wajib duluan, lalu nama abjad. Hanya tampilkan yang di-enroll.
      const allEkskulMaster = db
        .select()
        .from(ekskulMasterTable)
        .all()
        .sort((a, b) => {
          if (a.wajib !== b.wajib) return b.wajib - a.wajib
          return a.nama.localeCompare(b.nama)
        })
      const ekskulRows: string[][] = [["No", "Ekstrakurikuler", "Predikat", "Keterangan"]]
      let noEkskul = 0
      for (const e of allEkskulMaster) {
        const nilai = eks.find((row) => row.ekskul?.id === e.id)
        if (!nilai) continue
        noEkskul++
        ekskulRows.push([
          String(noEkskul),
          e.nama,
          nilai.nilai_ekskul?.predikat || "A",
          e.wajib === 1 ? "Wajib" : "Pilihan",
        ])
      }
      // Tabel minimal punya 1 baris (template T4_COLS)
      if (ekskulRows.length === 1) {
        ekskulRows.push(["-", "-", "-", "-"])
      }
      drawTable(doc, T4_COLS, ekskulRows, {
        fontSize: 10,
        headerFontSize: 10,
      })
      doc.moveDown(0.4)

      /* =============================================================== */
      /*  Section 5: Ketidakhadiran                                         */
      /* =============================================================== */
      const startDate = tahun.tanggal_mulai
      const endDate = tahun.tanggal_selesai
      const jamPerHariRow = db.select().from(configTable).where(eq(configTable.kunci, "JAM_PER_HARI")).get()
      const jamPerHari = jamPerHariRow ? parseInt(jamPerHariRow.nilai) : 6

      const absS = db
        .select()
        .from(absensiTable)
        .where(
          and(
            eq(absensiTable.siswa_id, s.id),
            gteDate(absensiTable.tanggal, startDate),
            lteDate(absensiTable.tanggal, endDate),
          ),
        )
        .all() as any[]
      const sakitHari = Math.floor(absS.filter((a) => a.status === "S").length / jamPerHari)
      const izinHari = Math.floor(absS.filter((a) => a.status === "I").length / jamPerHari)
      const tkHari = Math.floor(absS.filter((a) => a.status === "TK").length / jamPerHari)

      const t5Rows: string[][] = [
        ["Ketidakhadiran", "Ketidakhadiran", "Ketidakhadiran", "Ketidakhadiran"],
        ["Sakit", ":", String(sakitHari), "Hari"],
        ["Izin", ":", String(izinHari), "Hari"],
        ["Tanpa Keterangan", ":", String(tkHari), "Hari"],
      ]
      drawTable(doc, T5_COLS, t5Rows, { fontSize: 10, headerRows: [0], bold: true })
      doc.moveDown(0.4)

      /* =============================================================== */
      /*  Section 6: Catatan Wali Kelas                                    */
      /* =============================================================== */
      const catatan = db
        .select()
        .from(catatanTable)
        .where(and(eq(catatanTable.siswa_id, s.id), eq(catatanTable.tahun_ajaran_id, tahunAjaranId)))
        .get()
      const catatanRows: string[][] = [
        ["Catatan Wali Kelas"],
        [catatan?.catatan ?? ""],
      ]
      drawTable(doc, [11.8 * CM], catatanRows, { fontSize: 10, headerRows: [0], bold: true })
      doc.moveDown(0.6)

      /* =============================================================== */
      /*  Section 7: TTD Orang Tua / Wali Kelas / Kepala Sekolah            */
      /* =============================================================== */
      // Tanggal: hari ini dalam format Indonesia
      const today = new Date()
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      const tanggalStr = `Namorambe, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`

      const t7Rows: string[][] = [
        ["Tanggapan Orang Tua/Wali Murid", "Tanggapan Orang Tua/Wali Murid", "Tanggapan Orang Tua/Wali Murid"],
        ["", "", ""],
        ["", "", tanggalStr],
        ["Mengetahui", "", ""],
        ["Orangtua/Wali", "", "Walikelas"],
        ["", "", ""],
        ["Kepala Sekolah", "", ""],
      ]
      // Use special layout for TTD
      drawTtdTable(doc, T7_COLS, {
        namaOrtu: s.nama_ayah ?? "Orangtua/Wali",
        namaKepsek: "Muhsin Rokan, S.Kom, S.H. M.H. Gr",
        namaWaliKelas: "............................",
      })
      doc.moveDown(0.2)
      doc.fontSize(8.5).font("Helvetica").text(`(15)`, { align: "right" })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

/* ------------------------------------------------------------------ */
/*  Helper: gte / lte untuk tanggal                                    */
/* ------------------------------------------------------------------ */

function gteDate(col: any, val: string) {
  // import dynamically to avoid top-level import issues
  const { gte } = require("drizzle-orm")
  return gte(col, val)
}
function lteDate(col: any, val: string) {
  const { lte } = require("drizzle-orm")
  return lte(col, val)
}

/* ------------------------------------------------------------------ */
/*  Helper: drawTable dengan border                                     */
/* ------------------------------------------------------------------ */

type TableOptions = {
  fontSize?: number
  headerFontSize?: number
  headerRows?: number[]
  bold?: boolean
  noBorder?: boolean
}

function drawTable(
  doc: PDFKit.PDFDocument,
  colWidths: number[],
  rows: string[][],
  opts: TableOptions = {},
) {
  const fontSize = opts.fontSize ?? 10
  const headerFontSize = opts.headerFontSize ?? fontSize
  const headerRows = new Set(opts.headerRows ?? [])
  const startX = doc.page.margins.left
  const startY = doc.y
  const lineHeight = fontSize * 1.5
  const padding = 4

  // Calculate row heights (for auto-wrap text)
  const rowHeights: number[] = []
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri]
    let maxH = lineHeight + padding * 2
    for (let ci = 0; ci < row.length; ci++) {
      const w = colWidths[ci] ?? 100
      const text = row[ci] ?? ""
      doc.fontSize(headerRows.has(ri) ? headerFontSize : fontSize)
      const h = doc.heightOfString(text, { width: w - padding * 2 })
      maxH = Math.max(maxH, h + padding * 2)
    }
    rowHeights.push(maxH)
  }

  let y = startY
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri]
    const isHeader = headerRows.has(ri)

    // Check if we need a new page
    if (y + rowHeights[ri] > doc.page.height - doc.page.margins.bottom) {
      doc.addPage()
      y = doc.page.margins.top
    }

    let x = startX
    for (let ci = 0; ci < row.length; ci++) {
      const w = colWidths[ci] ?? 100
      // Draw border
      if (!opts.noBorder) {
        doc.rect(x, y, w, rowHeights[ri]).stroke()
      }
      // Draw text
      const text = row[ci] ?? ""
      doc
        .font(isHeader || opts.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(isHeader ? headerFontSize : fontSize)
        .text(text, x + padding, y + padding, {
          width: w - padding * 2,
          height: rowHeights[ri] - padding * 2,
          align: ci === 0 ? "left" : "left",
          ellipsis: true,
        })
      x += w
    }
    y += rowHeights[ri]
  }
  doc.y = y
}

/* ------------------------------------------------------------------ */
/*  Helper: drawSectionedTable — header row + body with group dividers  */
/* ------------------------------------------------------------------ */

function drawSectionedTable(
  doc: PDFKit.PDFDocument,
  colWidths: number[],
  header: string[],
  rows: Array<string[] | { groupHeader: string; colspan: number }>,
  opts: TableOptions = {},
) {
  const fontSize = opts.fontSize ?? 10
  const headerFontSize = opts.headerFontSize ?? fontSize
  const startX = doc.page.margins.left
  const startY = doc.y
  const lineHeight = fontSize * 1.5
  const padding = 4
  const totalWidth = colWidths.reduce((a, b) => a + b, 0)

  // Calculate total height needed
  let y = startY
  const allBlocks: Array<{ type: "header" | "group" | "row"; height: number; data: any }> = []

  // Header
  let h = lineHeight + padding * 2
  for (const text of header) {
    doc.fontSize(headerFontSize)
    h = Math.max(h, doc.heightOfString(text, { width: (colWidths[header.indexOf(text)] ?? 100) - padding * 2 }) + padding * 2)
  }
  allBlocks.push({ type: "header", height: h, data: header })

  // Body
  for (const row of rows) {
    if ("groupHeader" in row) {
      doc.fontSize(fontSize)
      const gh = doc.heightOfString(row.groupHeader, { width: totalWidth - padding * 2 }) + padding * 2
      allBlocks.push({ type: "group", height: gh, data: row })
    } else {
      let rh = lineHeight + padding * 2
      for (let ci = 0; ci < row.length; ci++) {
        const w = colWidths[ci] ?? 100
        doc.fontSize(fontSize)
        const textH = doc.heightOfString(row[ci] ?? "", { width: w - padding * 2 })
        rh = Math.max(rh, textH + padding * 2)
      }
      allBlocks.push({ type: "row", height: rh, data: row })
    }
  }

  for (const block of allBlocks) {
    if (y + block.height > doc.page.height - doc.page.margins.bottom) {
      doc.addPage()
      y = doc.page.margins.top
    }

    if (block.type === "header") {
      let x = startX
      for (let ci = 0; ci < block.data.length; ci++) {
        const w = colWidths[ci] ?? 100
        if (!opts.noBorder) doc.rect(x, y, w, block.height).stroke()
        doc.font("Helvetica-Bold").fontSize(headerFontSize).text(
          block.data[ci] ?? "",
          x + padding,
          y + padding,
          { width: w - padding * 2, align: "left" }
        )
        x += w
      }
    } else if (block.type === "group") {
      const gh = block.data as { groupHeader: string; colspan: number }
      if (!opts.noBorder) doc.rect(startX, y, totalWidth, block.height).stroke()
      doc.font("Helvetica").fontSize(fontSize).text(
        gh.groupHeader,
        startX + padding,
        y + padding,
        { width: totalWidth - padding * 2, align: "left" }
      )
    } else {
      const row = block.data as string[]
      let x = startX
      for (let ci = 0; ci < row.length; ci++) {
        const w = colWidths[ci] ?? 100
        if (!opts.noBorder) doc.rect(x, y, w, block.height).stroke()
        const isFirstCol = ci === 0
        doc.font("Helvetica").fontSize(fontSize).text(
          row[ci] ?? "",
          x + padding,
          y + padding,
          { width: w - padding * 2, align: isFirstCol ? "left" : "left" }
        )
        x += w
      }
    }
    y += block.height
  }
  doc.y = y
}

/* ------------------------------------------------------------------ */
/*  Helper: drawTtdTable — TTD 3-col dengan signature lines             */
/* ------------------------------------------------------------------ */

function drawTtdTable(
  doc: PDFKit.PDFDocument,
  colWidths: number[],
  opts: { namaOrtu: string; namaKepsek: string; namaWaliKelas: string },
) {
  const startX = doc.page.margins.left
  const startY = doc.y
  const cellPadding = 6
  const lineHeight = 12
  const totalWidth = colWidths.reduce((a, b) => a + b, 0)

  // Row heights
  const rowHeights = [
    lineHeight + cellPadding * 2, // Header
    lineHeight * 1.5, // Empty
    lineHeight + cellPadding * 2, // Tanggal
    lineHeight + cellPadding * 2, // Mengetahui
    lineHeight * 2 + cellPadding * 2, // Orangtua / Walikelas
    lineHeight * 2, // empty
    lineHeight * 2 + cellPadding * 2, // Kepala Sekolah
  ]

  // Check page break
  const totalHeight = rowHeights.reduce((a, b) => a + b, 0)
  if (startY + totalHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage()
  }

  let y = startY

  // Row 0: Header "Tanggapan Orang Tua/Wali Murid" (spans 3 cols, center)
  doc.rect(startX, y, totalWidth, rowHeights[0]).stroke()
  doc.font("Helvetica-Bold").fontSize(10).text(
    "Tanggapan Orang Tua/Wali Murid",
    startX,
    y + cellPadding,
    { width: totalWidth, align: "center" }
  )
  y += rowHeights[0]

  // Row 1: Empty (3 cells)
  for (let i = 0; i < 3; i++) {
    doc.rect(startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, colWidths[i], rowHeights[1]).stroke()
  }
  y += rowHeights[1]

  // Row 2: Tanggal (right-aligned in col 2)
  for (let i = 0; i < 3; i++) {
    doc.rect(startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, colWidths[i], rowHeights[2]).stroke()
  }
  const today = new Date()
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  const tanggalStr = `Namorambe, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`
  doc.font("Helvetica").fontSize(10).text(
    tanggalStr,
    startX + colWidths[0] + colWidths[1],
    y + cellPadding,
    { width: colWidths[2] - cellPadding * 2, align: "left" }
  )
  y += rowHeights[2]

  // Row 3: "Mengetahui" (col 0)
  for (let i = 0; i < 3; i++) {
    doc.rect(startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, colWidths[i], rowHeights[3]).stroke()
  }
  doc.font("Helvetica").fontSize(10).text(
    "Mengetahui",
    startX + cellPadding,
    y + cellPadding,
    { width: colWidths[0] - cellPadding * 2, align: "left" }
  )
  y += rowHeights[3]

  // Row 4: "Orangtua/Wali" + signature line (col 0) | "Walikelas" + signature line (col 2)
  for (let i = 0; i < 3; i++) {
    doc.rect(startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, colWidths[i], rowHeights[4]).stroke()
  }
  doc.font("Helvetica").fontSize(10).text(
    "Orangtua/Wali",
    startX + cellPadding,
    y + cellPadding,
    { width: colWidths[0] - cellPadding * 2, align: "left" }
  )
  // Signature line for Orangtua
  doc.moveTo(startX + cellPadding, y + rowHeights[4] - cellPadding - 2)
    .lineTo(startX + colWidths[0] - cellPadding, y + rowHeights[4] - cellPadding - 2)
    .stroke()
  // Walikelas in col 2
  doc.font("Helvetica").fontSize(10).text(
    "Walikelas",
    startX + colWidths[0] + colWidths[1] + cellPadding,
    y + cellPadding,
    { width: colWidths[2] - cellPadding * 2, align: "left" }
  )
  doc.moveTo(startX + colWidths[0] + colWidths[1] + cellPadding, y + rowHeights[4] - cellPadding - 2)
    .lineTo(startX + colWidths[0] + colWidths[1] + colWidths[2] - cellPadding, y + rowHeights[4] - cellPadding - 2)
    .stroke()
  y += rowHeights[4]

  // Row 5: Empty
  for (let i = 0; i < 3; i++) {
    doc.rect(startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, colWidths[i], rowHeights[5]).stroke()
  }
  y += rowHeights[5]

  // Row 6: "Kepala Sekolah" (col 1, center) + nama (col 1, center)
  for (let i = 0; i < 3; i++) {
    doc.rect(startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, colWidths[i], rowHeights[6]).stroke()
  }
  // Label "Kepala Sekolah" di col 1
  doc.font("Helvetica").fontSize(10).text(
    "Kepala Sekolah",
    startX + colWidths[0] + cellPadding,
    y + cellPadding,
    { width: colWidths[1] - cellPadding * 2, align: "left" }
  )
  // Nama Kepsek di col 1, lebih ke bawah
  doc.font("Helvetica").fontSize(10).text(
    opts.namaKepsek,
    startX + colWidths[0] + cellPadding,
    y + cellPadding + lineHeight + 4,
    { width: colWidths[1] - cellPadding * 2, align: "left" }
  )

  doc.y = y + rowHeights[6]
}
