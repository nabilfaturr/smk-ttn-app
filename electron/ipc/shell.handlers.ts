/**
 * Shell IPC: buka file/folder dengan default app OS.
 *
 * Dipakai oleh GenerateReportPage supaya user bisa langsung membuka PDF
 * rapor yang baru di-generate tanpa harus nyari di /tmp.
 */

import { ipcMain, shell } from "electron"

ipcMain.handle("shell:openPath", async (_event, filePath: string) => {
  try {
    if (!filePath) return { error: "Path kosong" }
    const result = await shell.openPath(filePath)
    if (result) {
      // shell.openPath return string error message kalau gagal (kosong = sukses)
      return { error: result }
    }
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle("shell:showItemInFolder", async (_event, filePath: string) => {
  try {
    if (!filePath) return { error: "Path kosong" }
    shell.showItemInFolder(filePath)
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
})
