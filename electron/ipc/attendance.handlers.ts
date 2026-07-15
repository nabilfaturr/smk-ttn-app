import { ipcMain } from "electron"
import { getDb } from "../../src/lib/db"
import { absensi, konfigurasi } from "../../src/lib/db/schema"
import { eq, and, between, sql } from "drizzle-orm"
import { addToSyncLog } from "../../src/lib/sync/sync-queue"

ipcMain.handle("attendance:getByClassAndDate", async (_event, { kelasId, tanggal, jamPelajaran }) => {
  try {
    const db = getDb()
    return db
      .select()
      .from(absensi)
      .where(
        and(
          eq(absensi.kelas_id, kelasId),
          eq(absensi.tanggal, tanggal),
          eq(absensi.jam_pelajaran, jamPelajaran),
        ),
      )
      .all()
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("attendance:save", async (_event, dataArray) => {
  try {
    const db = getDb()
    for (const data of dataArray) {
      const existing = db
        .select()
        .from(absensi)
        .where(
          and(
            eq(absensi.siswa_id, data.siswaId),
            eq(absensi.kelas_id, data.kelasId),
            eq(absensi.tanggal, data.tanggal),
            eq(absensi.jam_pelajaran, data.jamPelajaran),
          ),
        )
        .get()

      if (existing) {
        db.update(absensi).set({ status: data.status }).where(eq(absensi.id, existing.id)).run()
        addToSyncLog("absensi", existing.id, "update")
      } else {
        const result = db.insert(absensi)
          .values({
            siswa_id: data.siswaId,
            kelas_id: data.kelasId,
            tanggal: data.tanggal,
            status: data.status,
            jam_pelajaran: data.jamPelajaran,
          })
          .returning()
          .get()
        addToSyncLog("absensi", result.id, "insert")
      }
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("attendance:getRecap", async (_event, { kelasId, tanggalMulai, tanggalSelesai }) => {
  try {
    const db = getDb()
    return db
      .select({
        siswa_id: absensi.siswa_id,
        total_hadir: sql`SUM(CASE WHEN ${absensi.status} = 'H' THEN 1 ELSE 0 END)`.as("total_hadir"),
        total_dl: sql`SUM(CASE WHEN ${absensi.status} = 'DL' THEN 1 ELSE 0 END)`.as("total_dl"),
        total_s: sql`SUM(CASE WHEN ${absensi.status} = 'S' THEN 1 ELSE 0 END)`.as("total_s"),
        total_i: sql`SUM(CASE WHEN ${absensi.status} = 'I' THEN 1 ELSE 0 END)`.as("total_i"),
        total_tk: sql`SUM(CASE WHEN ${absensi.status} = 'TK' THEN 1 ELSE 0 END)`.as("total_tk"),
      })
      .from(absensi)
      .where(and(eq(absensi.kelas_id, kelasId), between(absensi.tanggal, tanggalMulai, tanggalSelesai)))
      .groupBy(absensi.siswa_id)
      .all()
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("attendance:convertToDays", async (_event, { kelasId, tanggalMulai, tanggalSelesai }) => {
  try {
    const db = getDb()
    const config = db.select().from(konfigurasi).where(eq(konfigurasi.kunci, "JAM_PER_HARI")).get()
    const jamPerHari = config ? parseInt(config.nilai) : 6

    const recap = db
      .select({
        siswa_id: absensi.siswa_id,
        total_s: sql`SUM(CASE WHEN ${absensi.status} = 'S' THEN 1 ELSE 0 END)`.as("total_s"),
        total_i: sql`SUM(CASE WHEN ${absensi.status} = 'I' THEN 1 ELSE 0 END)`.as("total_i"),
        total_tk: sql`SUM(CASE WHEN ${absensi.status} = 'TK' THEN 1 ELSE 0 END)`.as("total_tk"),
      })
      .from(absensi)
      .where(and(eq(absensi.kelas_id, kelasId), between(absensi.tanggal, tanggalMulai, tanggalSelesai)))
      .groupBy(absensi.siswa_id)
      .all()

    return recap.map((r) => ({
      siswa_id: r.siswa_id,
      sakit_hari: Math.floor(Number(r.total_s) / jamPerHari),
      izin_hari: Math.floor(Number(r.total_i) / jamPerHari),
      tanpa_keterangan_hari: Math.floor(Number(r.total_tk) / jamPerHari),
    }))
  } catch (error: any) {
    return { error: error.message }
  }
})
