import { ipcMain } from "electron"
import bcrypt from "bcryptjs"
import { getDb } from "../../src/lib/db"
import { users, guru, kelas } from "../../src/lib/db/schema"
import { eq, or } from "drizzle-orm"
import crypto from "crypto"

function generateKodeLogin(): string {
  return crypto.randomInt(10000, 99999).toString()
}

export function getOrCreateKodeLogin(db: ReturnType<typeof getDb>, userId: number): string {
  const user = db.select().from(users).where(eq(users.id, userId)).get()
  if (!user) throw new Error("User not found")
  if (user.kode_login) return user.kode_login
  let kode = generateKodeLogin()
  while (db.select().from(users).where(eq(users.kode_login, kode)).get()) {
    kode = generateKodeLogin()
  }
  db.update(users).set({ kode_login: kode }).where(eq(users.id, userId)).run()
  return kode
}

ipcMain.handle("auth:login", async (_event, { username, password }: { username: string; password: string }) => {
  try {
    const db = getDb()
    const user = db
      .select()
      .from(users)
      .where(or(eq(users.kode_login, username), eq(users.username, username)))
      .get()
    if (!user) return { error: "Kode Login / Username atau password salah" }

    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) return { error: "Kode Login / Username atau password salah" }

    const roles = user.role.split(",")
    let additionalData: Record<string, any> = {}
    let kelas_id: number | undefined

    if (roles.includes("wali_kelas") || roles.includes("guru")) {
      const g = db.select().from(guru).where(eq(guru.user_id, user.id)).get()
      if (g) {
        additionalData.guru_id = g.id
        additionalData.nama = g.nama
        if (roles.includes("wali_kelas")) {
          const kelasData = db.select().from(kelas).where(eq(kelas.wali_kelas_id, g.id)).get()
          if (kelasData) {
            additionalData.kelas_id = kelasData.id
          }
        }
      }
    }

    // Auto-generate kode_login jika belum ada
    const kode_login = user.kode_login || getOrCreateKodeLogin(db, user.id)

    return {
      id: user.id,
      username: user.username,
      kode_login,
      role: user.role,
      roles,
      ...additionalData,
    }
  } catch {
    return { error: "Terjadi kesalahan saat login" }
  }
})

ipcMain.handle("auth:logout", async () => {
  return { success: true }
})

ipcMain.handle("auth:change-password", async (_event, { userId, oldPassword, newPassword }) => {
  try {
    const db = getDb()
    const user = db.select().from(users).where(eq(users.id, userId)).get()
    if (!user) return { error: "User tidak ditemukan" }

    const valid = bcrypt.compareSync(oldPassword, user.password)
    if (!valid) return { error: "Password lama salah" }

    const hashed = bcrypt.hashSync(newPassword, 10)
    db.update(users).set({ password: hashed }).where(eq(users.id, userId)).run()
    return { success: true }
  } catch {
    return { error: "Gagal mengubah password" }
  }
})

ipcMain.handle("auth:reset-password", async (_event, { userId }: { userId: number }) => {
  try {
    const db = getDb()
    const user = db.select().from(users).where(eq(users.id, userId)).get()
    if (!user) return { error: "User tidak ditemukan" }

    const newPassword = crypto.randomInt(100000, 999999).toString()
    const hashed = bcrypt.hashSync(newPassword, 10)
    db.update(users).set({ password: hashed }).where(eq(users.id, userId)).run()
    return { success: true, newPassword }
  } catch {
    return { error: "Gagal mereset password" }
  }
})
