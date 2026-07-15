import { ipcMain } from "electron"
import { getDb } from "../../src/lib/db"
import { infoSekolah, konfigurasi } from "../../src/lib/db/schema"
import { eq } from "drizzle-orm"
import { addToSyncLog } from "../../src/lib/sync/sync-queue"

ipcMain.handle("config:getInfo", async () => {
  try {
    const db = getDb()
    return db.select().from(infoSekolah).get()
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("config:updateInfo", async (_event, data) => {
  try {
    const db = getDb()
    const existing = db.select().from(infoSekolah).get()
    if (existing) {
      db.update(infoSekolah).set(data).where(eq(infoSekolah.id, existing.id)).run()
      addToSyncLog("info_sekolah", existing.id, "update")
    } else {
      const result = db.insert(infoSekolah).values(data).returning().get()
      const id = result.id
      addToSyncLog("info_sekolah", id, "insert")
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("config:getKonfigurasi", async () => {
  try {
    const db = getDb()
    return db.select().from(konfigurasi).all()
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("config:updateKonfigurasi", async (_event, data) => {
  try {
    const db = getDb()
    for (const item of data) {
      const existing = db.select().from(konfigurasi).where(eq(konfigurasi.kunci, item.kunci)).get()
      if (existing) {
        db.update(konfigurasi).set({ nilai: item.nilai }).where(eq(konfigurasi.kunci, item.kunci)).run()
        addToSyncLog("konfigurasi", existing.id, "update")
      }
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})
