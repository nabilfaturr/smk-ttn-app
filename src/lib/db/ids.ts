/**
 * UUID generator + device ID helper.
 *
 * - `generateId()`: UUID v4 string, no extra deps (use Node built-in)
 * - `getDeviceId()` / `setDeviceId()`: unique identifier per app install
 *   - Disimpan di OS userData/device-id (persist)
 *   - Di-load sekali pas startup oleh electron/main.ts
 *   - Digunakan sebagai `device_id` di tabel transaksional (tracking asal data)
 * - `loadOrCreateDeviceId()`: baca atau buat device-id file di userData
 *   - Hanya jalan di Electron main process (butuh `app.getPath`)
 *   - Di-test env, return UUID statis
 */

import { randomUUID } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export function generateId(): string {
  return randomUUID()
}

let cachedDeviceId: string | null = null

export function getDeviceId(): string {
  return cachedDeviceId ?? "unknown-device"
}

export function setDeviceId(id: string): void {
  cachedDeviceId = id
}

export function clearDeviceId(): void {
  cachedDeviceId = null
}

const DEVICE_ID_FILENAME = "device-id"

export function loadOrCreateDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId

  let userData: string
  try {
    const { app } = require("electron")
    userData = app.getPath("userData")
  } catch {
    cachedDeviceId = "test-device-" + randomUUID()
    return cachedDeviceId
  }

  const file = join(userData, DEVICE_ID_FILENAME)
  if (existsSync(file)) {
    cachedDeviceId = readFileSync(file, "utf-8").trim()
    if (cachedDeviceId) return cachedDeviceId
  }

  const id = randomUUID()
  writeFileSync(file, id, "utf-8")
  cachedDeviceId = id
  return id
}

