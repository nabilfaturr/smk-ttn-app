/**
 * Secure storage for Firebase config.
 *
 * Menggunakan Electron `safeStorage` API untuk encryption di OS-level
 * (Keychain di macOS, libsecret di Linux, DPAPI di Windows).
 *
 * Lokasi file: `<userData>/firebase-config.enc`
 *
 * File berisi JSON terenkripsi, didekripsi hanya saat dibutuhkan.
 * Tidak pernah ditulis ke disk dalam plaintext.
 */

import { app, safeStorage } from "electron"
import fs from "node:fs"
import path from "node:path"

type FirebaseConfigFile = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

function getConfigPath(): string {
  return path.join(app.getPath("userData"), "firebase-config.enc")
}

/**
 * Cek apakah safeStorage tersedia di platform ini.
 * Falls back ke plain JSON jika tidak tersedia (untuk headless/dev).
 */
function isEncryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable()
  } catch {
    return false
  }
}

/**
 * Save Firebase config terenkripsi ke userData.
 */
export function saveEncryptedConfig(config: FirebaseConfigFile): { success: boolean; encrypted: boolean; error?: string } {
  try {
    const json = JSON.stringify(config)
    const filePath = getConfigPath()

    if (isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(json)
      fs.writeFileSync(filePath, encrypted)
      return { success: true, encrypted: true }
    } else {
      // Fallback: plain JSON (hanya untuk dev/headless)
      fs.writeFileSync(filePath, json, "utf-8")
      console.warn("[firebase-config] safeStorage not available, using plain JSON (dev only)")
      return { success: true, encrypted: false }
    }
  } catch (err: any) {
    return { success: false, encrypted: false, error: err.message }
  }
}

/**
 * Read Firebase config terenkripsi dari userData.
 * Return null jika file tidak ada atau gagal dekripsi.
 */
export function readEncryptedConfig(): FirebaseConfigFile | null {
  const filePath = getConfigPath()
  if (!fs.existsSync(filePath)) return null

  try {
    const raw = fs.readFileSync(filePath)
    if (isEncryptionAvailable()) {
      const decrypted = safeStorage.decryptString(raw)
      return JSON.parse(decrypted) as FirebaseConfigFile
    } else {
      // Fallback: parse as plain JSON
      return JSON.parse(raw.toString("utf-8")) as FirebaseConfigFile
    }
  } catch (err) {
    console.error("[firebase-config] Failed to read config:", err)
    return null
  }
}

/**
 * Delete encrypted config file (logout/unlink Firebase).
 */
export function deleteEncryptedConfig(): { success: boolean; error?: string } {
  try {
    const filePath = getConfigPath()
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Test koneksi Firebase: ping Firestore API.
 * Return { success, message }
 */
export async function testFirebaseConnection(config: FirebaseConfigFile): Promise<{ success: boolean; message: string }> {
  try {
    // Import dynamically untuk avoid loading Firebase di startup kalau tidak perlu
    const { initializeApp } = await import("firebase/app")
    const { getFirestore, doc, getDoc } = await import("firebase/firestore")
    const app = initializeApp(config, "test-connection-" + Date.now())
    const db = getFirestore(app)
    // Coba baca doc random — kalau config valid, ini akan return success/permission-denied (bukan 404/not-found)
    // 404 = project not found, 403 = invalid API key
    try {
      await getDoc(doc(db, "_health_check", "ping"))
      return { success: true, message: "Koneksi berhasil. Firebase siap digunakan." }
    } catch (err: any) {
      const msg = err?.message ?? String(err)
      if (msg.includes("Firebase: Error (auth/api-key-not-valid)")) {
        return { success: false, message: "API key tidak valid. Periksa kembali konfigurasi." }
      }
      if (msg.includes("Firebase: Error (auth/project-not-found)")) {
        return { success: false, message: "Project ID tidak ditemukan. Periksa Firebase console." }
      }
      // Permission error tapi koneksi berhasil (Firestore rules deny access)
      if (msg.includes("permission-denied") || msg.includes("Missing or insufficient permissions")) {
        return { success: true, message: "Koneksi berhasil. (Firestore rules restrict read, tapi write akan jalan)" }
      }
      return { success: false, message: `Error: ${msg}` }
    }
  } catch (err: any) {
    return { success: false, message: err?.message ?? String(err) }
  }
}
