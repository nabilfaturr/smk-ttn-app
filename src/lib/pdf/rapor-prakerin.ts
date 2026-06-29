import { getDb } from "../db"
import {
  siswa as siswaTable,
  infoSekolah as infoTable,
  nilaiPrakerin as prakerinTable,
  absensiPrakerin as absPrakerinTable,
  tahunAjaran as tahunTable,
} from "../db/schema"
import { eq, and } from "drizzle-orm"
import { createPdfDocument, addKop, addSectionTitle, addTable, addText } from "./pdf-utils"

export function generateRaporPrakerin(siswaId: number, tahunAjaranId: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const db = getDb()
      const doc = createPdfDocument()
      const buffers: Buffer[] = []
      doc.on("data", (chunk: Buffer) => buffers.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(buffers)))

      const s = db.select().from(siswaTable).where(eq(siswaTable.id, siswaId)).get()!
      const info = db.select().from(infoTable).get()!
      const tahun = db.select().from(tahunTable).where(eq(tahunTable.id, tahunAjaranId)).get()!
      const p = db
        .select()
        .from(prakerinTable)
        .where(and(eq(prakerinTable.siswa_id, siswaId), eq(prakerinTable.tahun_ajaran_id, tahunAjaranId)))
        .get()
      const abs = db
        .select()
        .from(absPrakerinTable)
        .where(and(eq(absPrakerinTable.siswa_id, siswaId), eq(absPrakerinTable.tahun_ajaran_id, tahunAjaranId)))
        .get()

      addKop(doc, info)
      addText(doc, "RAPOR PRAKERIN (PKL)", { fontSize: 14, bold: true, align: "center" })
      doc.moveDown(0.5)

      // Identitas
      addSectionTitle(doc, "A. Identitas")
      const identitas = [
        ["Nama Siswa", s.nama],
        ["NIS / NISN", `${s.nis ?? "-"} / ${s.nisn ?? "-"}`],
        ["Kelas", s.nama],
        ["Semester", `Semester ${tahun.semester}`],
        ["Tahun Pelajaran", tahun.nama],
        ["Pembimbing Sekolah", p?.pembimbing_sekolah ?? "-"],
        ["Pembimbing Instansi", p?.pembimbing_instansi ?? "-"],
        ["Tempat Prakerin", p?.tempat_prakerin ?? "-"],
        ["Tanggal Pelaksanaan", p?.tgl_mulai && p?.tgl_selesai ? `${p.tgl_mulai} s.d. ${p.tgl_selesai}` : "-"],
      ]
      addTable(doc, ["", ""], identitas, { columnWidths: [150, 295], fontSize: 9 })
      doc.moveDown(0.5)

      // Penilaian
      addSectionTitle(doc, "B. Tujuan Pembelajaran dan Penilaian")
      if (p) {
        const rows: (string | number | null)[][] = [
          ["1", p.tp1_deskripsi ?? "TP1", p.tp1_skor ?? "-", p.tp1_deskripsi ?? "-"],
        ]
        if (p.tp2_skor != null || p.tp2_deskripsi) {
          rows.push(["2", p.tp2_deskripsi ?? "TP2", p.tp2_skor ?? "-", p.tp2_deskripsi ?? "-"])
        }
        rows.push(["", "Nilai Rapor", p.nilai_rapor?.toFixed(2) ?? "-", ""])
        addTable(
          doc,
          ["No", "Tujuan Pembelajaran", "Skor", "Deskripsi Capaian"],
          rows,
          { columnWidths: [20, 200, 50, 175], fontSize: 8 },
        )
      }

      // Catatan
      if (p?.catatan) {
        addSectionTitle(doc, "C. Catatan")
        addText(doc, p.catatan, { fontSize: 9 })
      }

      // Ketidakhadiran
      addSectionTitle(doc, "D. Ketidakhadiran selama Prakerin")
      addTable(
        doc,
        ["Jenis", "Jumlah"],
        [
          ["Sakit", `${abs?.sakit ?? 0} hari`],
          ["Izin", `${abs?.izin ?? 0} hari`],
          ["Tanpa Keterangan", `${abs?.tanpa_keterangan ?? 0} hari`],
        ],
        { columnWidths: [150, 295], fontSize: 9 },
      )

      // TTD
      doc.moveDown(2)
      addTable(
        doc,
        ["Pembimbing Sekolah", "Kepala Sekolah"],
        [["______________________", "______________________"], [p?.pembimbing_sekolah ?? "-", info.kepala_sekolah ?? "-"]],
        { columnWidths: [222, 222], fontSize: 8 },
      )

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
