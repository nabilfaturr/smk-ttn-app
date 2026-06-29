import { ipcMain } from "electron"
import { getDb } from "../../src/lib/db"
import { kelas, guru, users, tahunAjaran } from "../../src/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"
import { addToSyncLog } from "../../src/lib/sync/sync-queue"

/**
 * Sync users.role dengan status wali kelas:
 * - Kalau guru ditugaskan jadi wali_kelas (wali_kelas_id di-set) → tambah role "wali_kelas"
 * - Kalau guru di-unset dari wali_kelas (wali_kelas_id nullified) dan TIDAK jadi wali kelas lain
 *   → hapus role "wali_kelas" (juga hapus "guru" kalau role sebelumnya "wali_kelas" saja, misal HONORER-only)
 * @param excludeKelasId - kelas yang sedang di-update/delete, supaya tidak dihitung
 */
function syncWaliKelasRole(
  db: ReturnType<typeof getDb>,
  guruId: number,
  excludeKelasId: number | null = null,
) {
  const g = db.select().from(guru).where(eq(guru.id, guruId)).get()
  if (!g) return
  const conditions = [eq(kelas.wali_kelas_id, guruId)]
  if (excludeKelasId != null) conditions.push(ne(kelas.id, excludeKelasId))
  const otherKelasAsWali = db
    .select({ id: kelas.id })
    .from(kelas)
    .where(and(...conditions))
    .all()
  const isWali = otherKelasAsWali.length > 0

  const u = db.select().from(users).where(eq(users.id, g.user_id)).get()
  if (!u) return

  const currentRoles = u.role.split(",").map((r) => r.trim()).filter(Boolean)

  if (isWali && !currentRoles.includes("wali_kelas")) {
    const newRoles = [...currentRoles, "wali_kelas"]
    db.update(users).set({ role: newRoles.join(",") }).where(eq(users.id, u.id)).run()
  } else if (!isWali && currentRoles.includes("wali_kelas")) {
    const newRoles = currentRoles.filter((r) => r !== "wali_kelas")
    if (newRoles.length === 0) newRoles.push("guru") // fallback minimal role
    db.update(users).set({ role: newRoles.join(",") }).where(eq(users.id, u.id)).run()
  }
}

ipcMain.handle("class:create", async (_event, data) => {
  try {
    const db = getDb()
    const result = db.insert(kelas).values(data).run()
    const id = Number(result.lastInsertRowid)
    addToSyncLog("kelas", id, "insert")
    if (data.wali_kelas_id) {
      syncWaliKelasRole(db, data.wali_kelas_id)
    }
    return { success: true, id }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("class:update", async (_event, { id, data }) => {
  try {
    const db = getDb()
    // Cari wali_kelas_id lama SEBELUM update untuk sync role
    const before = db.select({ wali_kelas_id: kelas.wali_kelas_id }).from(kelas).where(eq(kelas.id, id)).get()
    const oldWaliId = before?.wali_kelas_id ?? null
    const newWaliId = data.wali_kelas_id !== undefined ? data.wali_kelas_id : oldWaliId

    db.update(kelas).set(data).where(eq(kelas.id, id)).run()
    addToSyncLog("kelas", id, "update")

    // Sync role untuk wali_kelas_id lama (mungkin di-unset atau di-replace)
    if (oldWaliId) syncWaliKelasRole(db, oldWaliId, id)
    // Sync role untuk wali_kelas_id baru (kalau berbeda)
    if (newWaliId && newWaliId !== oldWaliId) syncWaliKelasRole(db, newWaliId, id)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("class:delete", async (_event, id) => {
  try {
    const db = getDb()
    const before = db.select({ wali_kelas_id: kelas.wali_kelas_id }).from(kelas).where(eq(kelas.id, id)).get()
    db.delete(kelas).where(eq(kelas.id, id)).run()
    addToSyncLog("kelas", id, "delete")
    if (before?.wali_kelas_id) syncWaliKelasRole(db, before.wali_kelas_id, id)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("class:getAll", async () => {
  try {
    const db = getDb()
    const result = db
      .select()
      .from(kelas)
      .leftJoin(guru, eq(kelas.wali_kelas_id, guru.id))
      .leftJoin(tahunAjaran, eq(kelas.tahun_ajaran_id, tahunAjaran.id))
      .all()
    return result.map((r) => ({
      ...r.kelas,
      wali_kelas_nama: r.guru?.nama ?? "-",
      tahun_ajaran_nama: r.tahun_ajaran?.nama ?? "-",
    }))
  } catch (error: any) {
    return { error: error.message }
  }
})
