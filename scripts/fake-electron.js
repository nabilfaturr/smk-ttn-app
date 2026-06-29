/**
 * Fake Electron module untuk testing di luar Electron context.
 *
 * Hanya menyediakan `app.getPath()` yang return path ke userData
 * (yang sama dengan yang dipakai di scripts/seed/connection.ts).
 */

import os from "node:os"
import path from "node:path"

const userDataDir = path.join(os.homedir(), ".config", "smk-ttn-app")

export const app = {
  getPath(name: string) {
    if (name === "userData") return userDataDir
    if (name === "temp") return os.tmpdir()
    return userDataDir
  },
  isPackaged: false,
}

export const BrowserWindow = class {}
export const ipcMain = { handle: () => {} }
export const contextBridge = { exposeInMainWorld: () => {} }
export const ipcRenderer = { invoke: () => Promise.resolve() }
export const dialog = { showSaveDialog: () => Promise.resolve(), showOpenDialog: () => Promise.resolve() }
export const shell = { openPath: () => Promise.resolve(""), showItemInFolder: () => {} }
