import { ipcRenderer } from "electron"

export async function invokeIPC<T>(channel: string, ...args: any[]): Promise<T> {
  try {
    return await ipcRenderer.invoke(channel, ...args)
  } catch (error) {
    console.error(`IPC error on channel "${channel}":`, error)
    throw error
  }
}
