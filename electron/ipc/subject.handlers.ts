import { ipcMain } from "electron"
import { getDb } from "../../src/lib/db"
import { mataPelajaran, guru } from "../../src/lib/db/schema"
import { eq } from "drizzle-orm"
import { addToSyncLog } from "../../src/lib/sync/sync-queue"

ipcMain.handle("subject:create", async (_event, data) => {
  try {
    const db = getDb()
    const result = db.insert(mataPelajaran).values(data).returning().get()
    const id = result.id
    addToSyncLog("mata_pelajaran", id, "insert")
    return { success: true, id }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("subject:update", async (_event, { id, data }) => {
  try {
    const db = getDb()
    db.update(mataPelajaran).set(data).where(eq(mataPelajaran.id, id)).run()
    addToSyncLog("mata_pelajaran", id, "update")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("subject:delete", async (_event, id) => {
  try {
    const db = getDb()
    db.delete(mataPelajaran).where(eq(mataPelajaran.id, id)).run()
    addToSyncLog("mata_pelajaran", id, "delete")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("subject:getAll", async () => {
  try {
    const db = getDb()
    // Tidak join guru karena `mata_pelajaran.guru_id` di-deprecated.
    // Untuk cek "siapa guru MTK di kelas X" gunakan
    // `mapelAssignment:getByMapel`.
    return db.select().from(mataPelajaran).all()
  } catch (error: any) {
    return { error: error.message }
  }
})
