import { ipcMain } from "electron"
import { getDb } from "../../src/lib/db"
import { tahunAjaran } from "../../src/lib/db/schema"
import { eq } from "drizzle-orm"
import { addToSyncLog } from "../../src/lib/sync/sync-queue"

ipcMain.handle("academicYear:create", async (_event, data) => {
  try {
    const db = getDb()
    if (data.is_active) {
      db.update(tahunAjaran).set({ is_active: 0 }).run()
    }
    const result = db.insert(tahunAjaran).values(data).run()
    const id = Number(result.lastInsertRowid)
    addToSyncLog("tahun_ajaran", id, "insert")
    return { success: true, id }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("academicYear:update", async (_event, { id, data }) => {
  try {
    const db = getDb()
    if (data.is_active) {
      db.update(tahunAjaran).set({ is_active: 0 }).run()
    }
    db.update(tahunAjaran).set(data).where(eq(tahunAjaran.id, id)).run()
    addToSyncLog("tahun_ajaran", id, "update")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("academicYear:delete", async (_event, id) => {
  try {
    const db = getDb()
    db.delete(tahunAjaran).where(eq(tahunAjaran.id, id)).run()
    addToSyncLog("tahun_ajaran", id, "delete")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("academicYear:getAll", async () => {
  try {
    const db = getDb()
    return db.select().from(tahunAjaran).all()
  } catch (error: any) {
    return { error: error.message }
  }
})
