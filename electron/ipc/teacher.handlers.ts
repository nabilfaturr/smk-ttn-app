import { ipcMain } from "electron"
import bcrypt from "bcryptjs"
import { getDb } from "../../src/lib/db"
import { guru, users } from "../../src/lib/db/schema"
import { eq } from "drizzle-orm"
import { addToSyncLog } from "../../src/lib/sync/sync-queue"
import { getOrCreateKodeLogin } from "./auth.handlers"
import crypto from "crypto"

ipcMain.handle("teacher:create", async (_event, data) => {
  try {
    const db = getDb()
    const password = crypto.randomInt(100000, 999999).toString()
    const hashed = bcrypt.hashSync(password, 10)
    // Username fallback kalau NIP kosong: generate unique random
    const username = data.nip && data.nip.trim() !== ""
      ? data.nip
      : `guru_${crypto.randomInt(100000, 999999)}`
    const insertedUser = db
      .insert(users)
      .values({ username, password: hashed, role: "guru" })
      .returning()
      .get()
    const userId = insertedUser.id
    const kode_login = getOrCreateKodeLogin(db, userId)
    addToSyncLog("users", userId, "insert")
    const insertedGuru = db
      .insert(guru)
      .values({ user_id: userId, nip: data.nip || null, nama: data.nama, bidang_studi: data.bidang_studi })
      .returning()
      .get()
    const guruId = insertedGuru.id
    addToSyncLog("guru", guruId, "insert")
    return { success: true, id: guruId, user_id: userId, kode_login, password }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("teacher:update", async (_event, { id, data }) => {
  try {
    const db = getDb()
    db.update(guru).set(data).where(eq(guru.id, id)).returning().get()
    addToSyncLog("guru", id, "update")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("teacher:delete", async (_event, id) => {
  try {
    const db = getDb()
    const g = db.select().from(guru).where(eq(guru.id, id)).get()
    if (g) {
      db.delete(users).where(eq(users.id, g.user_id)).run()
      addToSyncLog("users", g.user_id, "delete")
    }
    db.delete(guru).where(eq(guru.id, id)).run()
    addToSyncLog("guru", id, "delete")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("teacher:getAll", async () => {
  try {
    const db = getDb()
    return db.select().from(guru).all()
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("teacher:getById", async (_event, id) => {
  try {
    const db = getDb()
    return db.select().from(guru).where(eq(guru.id, id)).get()
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("user:getAll", async () => {
  try {
    const db = getDb()
    return db.select({ id: users.id, username: users.username, kode_login: users.kode_login }).from(users).all()
  } catch (error: any) {
    return { error: error.message }
  }
})
