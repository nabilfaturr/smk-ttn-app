/**
 * Real-time listener engine — subscribes ke Firestore `onSnapshot`
 * untuk semua collection yang di-sync, push event ke renderer via IPC.
 *
 * Alur:
 * 1. startListener() dipanggil dari electron/main.ts setelah sync engine start
 * 2. Subscribe `onSnapshot` per collection di PULLABLE_TABLES
 * 3. Saat ada perubahan (add/modify/delete) di Firestore, push event ke renderer
 *    via IPC `sync:data-changed` (jika ada mainWindow)
 * 4. Renderer bisa react: invalidate cache, refetch data, show toast
 *
 * Konfigurasi (PULLABLE_TABLES) didefinisikan di sync-engine.ts (single source).
 */

import {
  collection,
  onSnapshot,
  type Query,
  type DocumentData,
  type QuerySnapshot,
  type FirestoreError,
  Unsubscribe,
} from "firebase/firestore"
import { getFirestoreDb, initFirebase } from "./firebase-config"
import { PULLABLE_TABLES_FOR_LISTENER } from "./sync-engine"

type ChangeEvent = {
  type: "added" | "modified" | "removed"
  table: string
  id: string
  timestamp: number
}

type ChangeListener = (event: ChangeEvent) => void

let started = false
let unsubscribers: Unsubscribe[] = []
const listeners: Set<ChangeListener> = new Set()
let mainWindowRef: { webContents: { send: (channel: string, data: any) => void } } | null = null

/**
 * Set mainWindow reference (dipanggil dari electron/main.ts).
 * Listener pakai ini untuk push event ke renderer.
 */
export function setListenerMainWindow(window: typeof mainWindowRef) {
  mainWindowRef = window
}

export function startListener(): { success: boolean; error?: string } {
  if (started) {
    return { success: true }
  }
  if (!initFirebase()) {
    return { success: false, error: "Firebase not configured" }
  }
  const db = getFirestoreDb()
  if (!db) {
    return { success: false, error: "Firestore not initialized" }
  }

  started = true
  unsubscribers = []

  for (const { name } of PULLABLE_TABLES_FOR_LISTENER) {
    try {
      const q: Query<DocumentData> = collection(db, name)
      const unsub = onSnapshot(
        q,
        { includeMetadataChanges: false },
        (snap: QuerySnapshot<DocumentData>) => {
          for (const change of snap.docChanges()) {
            const event: ChangeEvent = {
              type: change.type as ChangeEvent["type"],
              table: name,
              id: change.doc.id,
              timestamp: Date.now(),
            }
            notifyListeners(event)
            pushToRenderer(event)
          }
        },
        (err: FirestoreError) => {
          console.error(`[listener] ${name} error:`, err.message)
        },
      )
      unsubscribers.push(unsub)
    } catch (err: any) {
      console.error(`[listener] failed to subscribe to ${name}:`, err?.message ?? err)
    }
  }

  console.log(`[listener] subscribed to ${unsubscribers.length} collection(s)`)
  return { success: true }
}

export function stopListener() {
  for (const unsub of unsubscribers) {
    try {
      unsub()
    } catch {
      // ignore
    }
  }
  unsubscribers = []
  started = false
}

export function isListenerStarted(): boolean {
  return started
}

export function getListenerStats() {
  return {
    started,
    subscriptions: unsubscribers.length,
    listeners: listeners.size,
  }
}

export function onChange(callback: ChangeListener): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

function notifyListeners(event: ChangeEvent) {
  for (const l of listeners) {
    try {
      l(event)
    } catch (err) {
      console.error("[listener] callback error:", err)
    }
  }
}

function pushToRenderer(event: ChangeEvent) {
  if (mainWindowRef) {
    try {
      mainWindowRef.webContents.send("sync:data-changed", event)
    } catch (err) {
      console.error("[listener] failed to push to renderer:", err)
    }
  }
}
