/**
 * Generator Rapor Prakerin DOCX — Kurikulum Merdeka (SMK TTN).
 *
 * Output: DOCX (Word) editable via docxtemplater.
 * Template: build/rapor-prakerin-template.docx (dimodifikasi dari
 *           docs/RAPORT KURMER RPL@PKL.docx).
 *
 * Layout template (5 tabel):
 *   1. Identitas Siswa (8 field: Nama, NIS, NISN, Pembimbing x2, Tempat, Tanggal x2)
 *   2. Tujuan Pembelajaran TP1 & TP2 (4 field: TP1_SKOR, TP2_SKOR, TP1_DESKRIPSI, TP2_DESKRIPSI)
 *   3. Ketidakhadiran (hardcode)
 *   4. TTD (Pembimbing Sekolah + Kepala Sekolah)
 */

import { getDb } from "../db"
import {
  siswa as siswaTable,
  kelas as kelasTable,
  tahunAjaran as tahunTable,
  nilaiPrakerin as prakerinTable,
  infoSekolah as infoSekolahTable,
} from "../db/schema"
import { eq, and } from "drizzle-orm"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import * as fs from "fs"
import * as path from "path"

export function generateRaporPrakerinDocx(
  siswaId: string,
  tahunAjaranId: string,
): Buffer {
  const db = getDb()

  const s = db.select().from(siswaTable).where(eq(siswaTable.id, siswaId)).get()
  if (!s) throw new Error(`Siswa tidak ditemukan: ${siswaId}`)

  const k = s.kelas_id
    ? db.select().from(kelasTable).where(eq(kelasTable.id, s.kelas_id)).get()
    : null

  const tahun = db.select().from(tahunTable).where(eq(tahunTable.id, tahunAjaranId)).get()
  if (!tahun) throw new Error(`Tahun ajaran tidak ditemukan: ${tahunAjaranId}`)

  const nilai = db
    .select()
    .from(prakerinTable)
    .where(
      and(
        eq(prakerinTable.siswa_id, s.id),
        eq(prakerinTable.tahun_ajaran_id, tahunAjaranId),
      ),
    )
    .get()

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]
  const formatTanggal = (isoDate: string | null | undefined): string => {
    if (!isoDate) return "-"
    const [y, m, d] = isoDate.split("-").map((n) => parseInt(n, 10))
    if (!y || !m || !d) return isoDate
    return `${d} ${months[m - 1]} ${y}`
  }

  const tp1Skor = nilai?.tp1_skor != null ? String(nilai.tp1_skor) : "-"
  const tp1Desc = nilai?.tp1_deskripsi ?? "-"
  const tp2Skor = nilai?.tp2_skor != null ? String(nilai.tp2_skor) : "-"
  const tp2Desc = nilai?.tp2_deskripsi ?? "-"

  const templateData = {
    Nama: s.nama ?? "-",
    NIS: s.nis ?? "-",
    NISN: s.nisn ?? "-",
    Kelas: k?.nama_kelas ?? "-",
    Nama_Pembimbing_Sekolah: nilai?.pembimbing_sekolah ?? "-",
    Nama_Pembimbing_Instansi: nilai?.pembimbing_instansi ?? "-",
    Tempat_Prakerin: nilai?.tempat_prakerin ?? "-",
    Tanggal_Prakerin_Mulai: formatTanggal(nilai?.tgl_mulai),
    Tanggal_Prakerin_Selesai: formatTanggal(nilai?.tgl_selesai),
    PRAKERIN: `TP1: ${tp1Skor} | TP2: ${tp2Skor}`,
    KET_PRAKERIN: `TP1: ${tp1Desc}\nTP2: ${tp2Desc}`,
  }

  const candidatePaths = [
    path.join(__dirname, "rapor-prakerin-template.docx"),
    path.join(process.cwd(), "build/rapor-prakerin-template.docx"),
    path.join(path.dirname(__dirname), "rapor-prakerin-template.docx"),
  ]
  let templatePath: string | null = null
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      templatePath = p
      break
    }
  }
  if (!templatePath) {
    throw new Error(`Template rapor prakerin tidak ditemukan. Dicari di: ${candidatePaths.join(", ")}`)
  }

  const templateContent = fs.readFileSync(templatePath)
  const zip = new PizZip(templateContent)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  })

  doc.render(templateData)

  return doc.getZip().generate({ type: "nodebuffer" })
}
