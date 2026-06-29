/**
 * IPC handlers untuk Firebase config (get/save/delete/test).
 *
 * Bridge antara UI Settings (renderer) dan secure storage (main).
 */

import { ipcMain } from "electron"
import {
  saveEncryptedConfig,
  readEncryptedConfig,
  deleteEncryptedConfig,
  testFirebaseConnection,
  type FirebaseConfigFile,
} from "../../src/lib/sync/config-storage"
import { reloadFirebaseConfig } from "../../src/lib/sync/firebase-config"

ipcMain.handle("firebaseConfig:save", async (_event, config: FirebaseConfigFile) => {
  try {
    // Validasi minimal
    if (!config.apiKey || !config.projectId) {
      return { success: false, error: "API Key dan Project ID wajib diisi" }
    }
    const result = saveEncryptedConfig(config)
    if (result.success) {
      // Reload cache supaya sync engine pakai config baru
      reloadFirebaseConfig()
    }
    return result
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle("firebaseConfig:get", async () => {
  try {
    const config = readEncryptedConfig()
    if (!config) return null
    // Mask API key saat return ke renderer (security: jangan expose semua)
    return {
      ...config,
      apiKey: config.apiKey ? maskApiKey(config.apiKey) : "",
    }
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle("firebaseConfig:delete", async () => {
  try {
    const result = deleteEncryptedConfig()
    if (result.success) {
      reloadFirebaseConfig()
    }
    return result
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle("firebaseConfig:test", async (_event, config: FirebaseConfigFile) => {
  return await testFirebaseConnection(config)
})

/**
 * Mask API key untuk display: hanya tampilkan 4 karakter terakhir.
 * Contoh: "AIzaSyD...XyZ" (bukan full key)
 */
function maskApiKey(key: string): string {
  if (key.length <= 8) return "***"
  return `${key.slice(0, 4)}...${key.slice(-4)}`
}
