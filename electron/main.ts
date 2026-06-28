import { app, BrowserWindow } from "electron"
import path from "path"

let mainWindow: BrowserWindow | null = null

const isDev = !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Sistem Absensi dan Penilaian - SMK TTN",
    show: true,
  })

  mainWindow.webContents.on("did-fail-load", (_, code, desc, url) => {
    console.error(`[renderer] did-fail-load: code=${code} desc=${desc} url=${url}`)
  })
  mainWindow.webContents.on("render-process-gone", (_, details) => {
    console.error(`[renderer] render-process-gone:`, details)
  })
  mainWindow.webContents.on("preload-error", (_, preloadPath, error) => {
    console.error(`[renderer] preload-error: path=${preloadPath}`, error)
  })

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show()
  })

  if (isDev && process.env.NODE_ENV !== "test") {
    mainWindow.loadURL("http://localhost:5173")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
  }

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

import { initDatabase } from "../src/lib/db"
import { startSyncEngine } from "../src/lib/sync/sync-engine"
import "./ipc/auth.handlers"
import "./ipc/arsip.handlers"
import "./ipc/student.handlers"
import "./ipc/teacher.handlers"
import "./ipc/class.handlers"
import "./ipc/subject.handlers"
import "./ipc/mapel-assignment.handlers"
import "./ipc/academic-year.handlers"
import "./ipc/config.handlers"
import "./ipc/attendance.handlers"
import "./ipc/grade.handlers"
import "./ipc/ekskul.handlers"
import "./ipc/report.handlers"
import "./ipc/sync.handlers"
import "./ipc/shell.handlers"
import "./ipc/firebase-config.handlers"

app.whenReady().then(() => {
  initDatabase()
  // Start background sync engine (interval 30 detik)
  startSyncEngine()
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
