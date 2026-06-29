import { ipcMain, dialog } from "electron"
import { getSyncStatus, triggerManualSync, exportDatabase } from "../../src/lib/sync/sync-engine"

ipcMain.handle("sync:getStatus", async () => {
  try {
    return getSyncStatus()
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("sync:triggerManualSync", async () => {
  try {
    return await triggerManualSync()
  } catch (error: any) {
    return { error: error.message }
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
