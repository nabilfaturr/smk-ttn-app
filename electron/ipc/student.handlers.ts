import { ipcMain } from "electron"
import { getDb } from "../../src/lib/db"
import { siswa, kelas, ekskul, nilaiEkskul, tahunAjaran } from "../../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { addToSyncLog } from "../../src/lib/sync/sync-queue"

function autoEnrollWajibEkskul(db: ReturnType<typeof getDb>, siswaId: number): void {
  const s = db.select().from(siswa).where(eq(siswa.id, siswaId)).get()
  if (!s || s.status !== "aktif") return

  const taAktif = db.select().from(tahunAjaran).where(eq(tahunAjaran.is_active, 1)).get()
  if (!taAktif) return

  const wajibEkskul = db.select().from(ekskul).where(eq(ekskul.wajib, 1)).all()
  for (const e of wajibEkskul) {
    const existing = db
      .select()
      .from(nilaiEkskul)
      .where(
        and(
          eq(nilaiEkskul.siswa_id, siswaId),
          eq(nilaiEkskul.ekskul_id, e.id),
          eq(nilaiEkskul.tahun_ajaran_id, taAktif.id),
        ),
      )
      .get()
    if (existing) continue

    const result = db
      .insert(nilaiEkskul)
      .values({
        siswa_id: siswaId,
        ekskul_id: e.id,
        tahun_ajaran_id: taAktif.id,
        predikat: "A",
        keterangan: null,
      })
      .run()
    addToSyncLog("nilai_ekskul", Number(result.lastInsertRowid), "insert")
  }
}

ipcMain.handle("student:getAll", async () => {
  try {
    const db = getDb()
    return db.select().from(siswa).all()
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("student:checkNis", async (_event, params: { nis: string; excludeId?: number }) => {
  try {
    const db = getDb()
    if (!params?.nis || params.nis.trim() === "") {
      return { available: true }
    }
    const rows = db
      .select({ id: siswa.id, nama: siswa.nama })
      .from(siswa)
      .where(eq(siswa.nis, params.nis.trim()))
      .all()
    // Filter excludeId (untuk edit flow: NIS existing adalah siswa itu sendiri = OK)
    const conflicting = rows.find((r) => r.id !== params.excludeId)
    if (conflicting) {
      return { available: false, existingId: conflicting.id, existingNama: conflicting.nama }
    }
    return { available: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("student:create", async (_event, data) => {
  try {
    const db = getDb()
    const result = db.insert(siswa).values(data).run()
    const id = Number(result.lastInsertRowid)
    addToSyncLog("siswa", id, "insert")
    // Auto-enroll ekskul wajib (Ketarunaan) untuk siswa baru yang aktif
    if (data.status === "aktif" || data.status === undefined) {
      autoEnrollWajibEkskul(db, id)
    }
    return { success: true, id }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("student:update", async (_event, { id, data }) => {
  try {
    const db = getDb()
    db.update(siswa).set(data).where(eq(siswa.id, id)).run()
    addToSyncLog("siswa", id, "update")
    // Auto-enroll jika status berubah jadi aktif
    if (data.status === "aktif") {
      autoEnrollWajibEkskul(db, id)
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("student:delete", async (_event, id) => {
  try {
    const db = getDb()
    db.delete(siswa).where(eq(siswa.id, id)).run()
    addToSyncLog("siswa", id, "delete")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})
