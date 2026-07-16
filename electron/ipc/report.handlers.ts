import { ipcMain, app } from "electron"
import { getDb } from "../../src/lib/db"
import {
  siswa as siswaTable,
  kelas as kelasTable,
  nilai as nilaiTable,
  absensi as absensiTable,
  nilaiKokurikuler as kokurikulerTable,
  nilaiPrakerin as prakerinTable,
  absensiPrakerin as absenPrakerinTable,
} from "../../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { generateRaporDocx } from "../../src/lib/pdf/rapor-docx"
import { generateRaporPrakerin } from "../../src/lib/pdf/rapor-prakerin"
import { generateRaporPrakerinDocx } from "../../src/lib/pdf/rapor-prakerin-docx"
import fs from "fs"
import path from "path"

ipcMain.handle("report:generateAkademik", async (_event, { siswaId, kelasId, tahunAjaranId }) => {
  try {
    const docx = generateRaporDocx(siswaId, kelasId, tahunAjaranId)
    const raporDir = getRaporDir()
    const fileName = `Rapor_Akademik_${siswaId}_${tahunAjaranId}.docx`
    const filePath = path.join(raporDir, fileName)
    fs.writeFileSync(filePath, docx)
    return filePath
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("report:generatePrakerin", async (_event, { siswaId, tahunAjaranId }) => {
  try {
    const pdf = await generateRaporPrakerin(siswaId, tahunAjaranId)
    const raporDir = getRaporDir()
    const fileName = `Rapor_Prakerin_${siswaId}_${tahunAjaranId}.pdf`
    const filePath = path.join(raporDir, fileName)
    fs.writeFileSync(filePath, pdf)
    return filePath
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("report:generatePrakerinDocx", async (_event, { siswaId, tahunAjaranId }) => {
  try {
    const docx = generateRaporPrakerinDocx(siswaId, tahunAjaranId)
    const raporDir = getRaporDir()
    const db = getDb()
    const s = db.select().from(siswaTable).where(eq(siswaTable.id, siswaId)).get()
    const safeName = s ? s.nama.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_") : siswaId
    const fileName = `Rapor_Prakerin_${safeName}_${tahunAjaranId}.docx`
    const filePath = path.join(raporDir, fileName)
    fs.writeFileSync(filePath, docx)
    return { success: true, filePath }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("report:generateBatchAkademik", async (_event, { kelasId, tahunAjaranId }) => {
  try {
    const db = getDb()
    const siswaList = db
      .select()
      .from(siswaTable)
      .where(and(eq(siswaTable.kelas_id, kelasId), eq(siswaTable.status, "aktif")))
      .all()

    const raporDir = getRaporDir()
    const filePaths: string[] = []
    for (const s of siswaList) {
      const docx = generateRaporDocx(s.id, kelasId, tahunAjaranId)
      const safeName = s.nama.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_")
      const fileName = `Rapor_Akademik_${safeName}_${tahunAjaranId}.docx`
      const filePath = path.join(raporDir, fileName)
      fs.writeFileSync(filePath, docx)
      filePaths.push(filePath)
    }
    return filePaths
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("report:generateBatchPrakerinDocx", async (_event, { kelasId, tahunAjaranId }) => {
  try {
    const db = getDb()
    const siswaList = db
      .select()
      .from(siswaTable)
      .where(and(eq(siswaTable.kelas_id, kelasId), eq(siswaTable.status, "aktif")))
      .all()

    const raporDir = getRaporDir()
    const filePaths: string[] = []
    for (const s of siswaList) {
      const docx = generateRaporPrakerinDocx(s.id, tahunAjaranId)
      const safeName = s.nama.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_")
      const fileName = `Rapor_Prakerin_${safeName}_${tahunAjaranId}.docx`
      const filePath = path.join(raporDir, fileName)
      fs.writeFileSync(filePath, docx)
      filePaths.push(filePath)
    }
    return filePaths
  } catch (error: any) {
    return { error: error.message }
  }
})

/**
 * Direktori output rapor: `<userData>/Rapor/`.
 * Otomatis dibuat saat pertama kali dipanggil.
 */
function getRaporDir(): string {
  const dir = path.join(app.getPath("userData"), "Rapor")
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * IPC untuk UI: kembalikan path folder rapor (untuk ditampilkan di UI).
 */
ipcMain.handle("report:getRaporDir", async () => {
  return getRaporDir()
})

ipcMain.handle("report:saveToFolder", async (_event, { filePaths, destinationFolder }) => {
  try {
    for (const fp of filePaths) {
      const dest = path.join(destinationFolder, path.basename(fp))
      fs.copyFileSync(fp, dest)
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("report:checkCompleteness", async (_event, { kelasId, tahunAjaranId }) => {
  try {
    const db = getDb()
    const siswaList = db
      .select()
      .from(siswaTable)
      .where(and(eq(siswaTable.kelas_id, kelasId), eq(siswaTable.status, "aktif")))
      .all()

    const kelasInfo = db.select().from(kelasTable).where(eq(kelasTable.id, kelasId)).get()
    const isKelas12 = kelasInfo?.tingkat === 12

    return siswaList.map((s) => {
      const missingData: string[] = []
      const nilaiCount = db.select().from(nilaiTable).where(and(eq(nilaiTable.siswa_id, s.id), eq(nilaiTable.tahun_ajaran_id, tahunAjaranId))).all()
      if (nilaiCount.length === 0) missingData.push("Nilai")
      const absCount = db.select().from(absensiTable).where(eq(absensiTable.siswa_id, s.id)).all()
      if (absCount.length === 0) missingData.push("Absensi")
      const kokuCount = db.select().from(kokurikulerTable).where(and(eq(kokurikulerTable.siswa_id, s.id), eq(kokurikulerTable.tahun_ajaran_id, tahunAjaranId))).all()
      if (kokuCount.length === 0) missingData.push("Kokurikuler")

      if (isKelas12) {
        const prakerin = db
          .select()
          .from(prakerinTable)
          .where(and(eq(prakerinTable.siswa_id, s.id), eq(prakerinTable.tahun_ajaran_id, tahunAjaranId)))
          .get()
        if (!prakerin || prakerin.tpl === null || prakerin.sl === null || prakerin.sk === null) {
          missingData.push("Nilai Prakerin")
        }
        const absenPrakerin = db
          .select()
          .from(absenPrakerinTable)
          .where(and(eq(absenPrakerinTable.siswa_id, s.id), eq(absenPrakerinTable.tahun_ajaran_id, tahunAjaranId)))
          .get()
        if (!absenPrakerin) missingData.push("Absensi Prakerin")
      }

      return { siswa_id: s.id, nama: s.nama, status: missingData.length === 0 ? "lengkap" : "kurang", missingData }
    })
  } catch (error: any) {
    return { error: error.message }
  }
})