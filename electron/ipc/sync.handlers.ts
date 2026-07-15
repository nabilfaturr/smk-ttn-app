import { ipcMain, dialog } from "electron"
import {
  getSyncStatus,
  triggerManualSync,
  exportDatabase,
  pullFromFirestore,
  pullOnStartup,
  getStartupPullState,
} from "../../src/lib/sync/sync-engine"
import {
  startListener,
  stopListener,
  isListenerStarted,
  getListenerStats,
} from "../../src/lib/sync/listener-engine"

ipcMain.handle("sync:getStatus", async () => {
  try {
    return getSyncStatus()
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("sync:getStartupPullState", async () => {
  return getStartupPullState()
})

ipcMain.handle("sync:triggerStartupPull", async () => {
  return await pullOnStartup()
})

ipcMain.handle("sync:getListenerState", async () => {
  return {
    started: isListenerStarted(),
    stats: getListenerStats(),
  }
})

ipcMain.handle("sync:startListener", async () => {
  return startListener()
})

ipcMain.handle("sync:stopListener", async () => {
  stopListener()
  return { success: true }
})

ipcMain.handle("sync:triggerManualSync", async () => {
  try {
    return await triggerManualSync()
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("sync:pullFromCloud", async (_event, options?: { onProgress?: boolean }) => {
  try {
    const result = await pullFromFirestore(
      options?.onProgress
        ? (table, fetched) => {
            // Send progress event ke renderer
            // (ipcMain.emit / event.sender.send — pakai event yang dikirim)
          }
        : undefined,
    )
    return result
  } catch (error: any) {
    return { success: false, error: error.message, totalFetched: 0, totalUpserted: 0, tables: [] }
  }
})

ipcMain.handle("sync:exportDatabase", async () => {
  try {
    const result = await dialog.showSaveDialog({
      defaultPath: "smk-ttn-backup.db",
      filters: [{ name: "Database", extensions: ["db", "sqlite"] }],
    })
    if (result.canceled) return null
    return result.filePath
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("dialog:showSave", async (_event, options) => {
  const result = await dialog.showSaveDialog(options)
  return result
})

ipcMain.handle("dialog:showOpen", async (_event, options) => {
  const result = await dialog.showOpenDialog(options)
  return result
})
