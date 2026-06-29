/**
 * Firebase configuration & connection.
 *
 * Config priority:
 *   1. Encrypted file di userData/firebase-config.enc (dari UI Settings admin)
 *   2. .env file (untuk development)
 *   3. Kosong → sync disabled
 *
 * Data flow:
 *   admin → Settings UI → save → IPC → saveFirebaseConfig() → encrypt & write
 *   sync engine → initFirebase() → getFirebaseConfig() → initializeApp
 *   push/delete → pushToFirestore / deleteFromFirestore
 */

import { initializeApp, type FirebaseApp } from "firebase/app"
import { getFirestore, collection, doc, setDoc, deleteDoc, writeBatch, type Firestore } from "firebase/firestore"
import { readEncryptedConfig } from "./config-storage"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

let firebaseApp: FirebaseApp | null = null
let firebaseDb: Firestore | null = null
let configLoaded = false

/* ------------------------------------------------------------------ */
/*  Config loading                                                     */
/* ------------------------------------------------------------------ */

/**
 * Ambil config dari encrypted file (prioritas 1) atau .env (fallback).
 * Hasil di-cache supaya tidak baca disk tiap kali.
 */
export function getFirebaseConfig(): FirebaseConfig {
  if (configLoaded && firebaseApp) {
    return cachedConfig
  }

  // Priority 1: dari encrypted file
  const fromFile = tryReadConfigFromFile()
  if (fromFile) {
    cachedConfig = fromFile
    configLoaded = true
    return fromFile
  }

  // Priority 2: dari .env (untuk development)
  const fromEnv: FirebaseConfig = {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) ?? "",
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) ?? "",
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) ?? "",
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) ?? "",
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) ?? "",
    appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) ?? "",
  }
  cachedConfig = fromEnv
  configLoaded = false // .env tidak dianggap "configured" (butuh save lewat UI)
  return fromEnv
}

let cachedConfig: FirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
}

function tryReadConfigFromFile(): FirebaseConfig | null {
  // Hanya bisa dipanggil dari main process (ada fs)
  if (typeof window === "undefined" && typeof process !== "undefined") {
    try {
      return readEncryptedConfig()
    } catch {
      return null
    }
  }
  return null
}

/**
 * Reset cache (dipanggil setelah save config baru via Settings).
 */
export function reloadFirebaseConfig(): void {
  configLoaded = false
  cachedConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  }
  firebaseApp = null
  firebaseDb = null
}

/* ------------------------------------------------------------------ */
/*  Init & connection                                                  */
/* ------------------------------------------------------------------ */

export function initFirebase(): boolean {
  if (firebaseApp) return true
  const cfg = getFirebaseConfig()
  if (!cfg.apiKey || !cfg.projectId) {
    return false
  }
  try {
    firebaseApp = initializeApp(cfg)
    firebaseDb = getFirestore(firebaseApp)
    return true
  } catch (err) {
    console.error("[firebase] init failed:", err)
    return false
  }
}

export function isFirebaseInitialized(): boolean {
  return firebaseApp !== null && firebaseDb !== null
}

export function getFirestoreDb(): Firestore | null {
  return firebaseDb
}

/* ------------------------------------------------------------------ */
/*  CRUD operations on Firestore                                       */
/* ------------------------------------------------------------------ */

export async function pushToFirestore(
  collectionName: string,
  data: any,
  docId: string,
): Promise<void> {
  if (!firebaseDb) throw new Error("Firebase not initialized")
  // Convert Date objects to ISO strings (Firestore tidak support Date langsung)
  const serialized = serializeForFirestore(data)
  await setDoc(doc(firebaseDb, collectionName, docId), serialized)
}

export async function deleteFromFirestore(
  collectionName: string,
  docId: string,
): Promise<void> {
  if (!firebaseDb) throw new Error("Firebase not initialized")
  await deleteDoc(doc(firebaseDb, collectionName, docId))
}

export async function batchPushToFirestore(
  collectionName: string,
  dataArray: { id: string; data: any }[],
): Promise<void> {
  if (!firebaseDb) throw new Error("Firebase not initialized")
  const batch = writeBatch(firebaseDb)
  for (const item of dataArray) {
    const serialized = serializeForFirestore(item.data)
    batch.set(doc(firebaseDb, collectionName, item.id), serialized)
  }
  await batch.commit()
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Convert values to Firestore-compatible format.
 * - Date → ISO string
 * - null/undefined → keep as-is
 * - Object/Array → recurse
 */
function serializeForFirestore(value: any): any {
  if (value === null || value === undefined) return value
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(serializeForFirestore)
  if (typeof value === "object") {
    const out: any = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = serializeForFirestore(v)
    }
    return out
  }
  return value
}
