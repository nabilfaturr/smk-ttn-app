/**
 * Sync Engine — push data lokal ke Firebase Firestore.
 *
 * Cara kerja:
 * 1. Background interval 30 detik (saat app running, ada internet)
 * 2. Baca tabel `sync_log` yang berstatus "pending"
 * 3. Untuk setiap record:
 *    - insert/update: baca row dari SQLite, push ke Firestore (collection = table name)
 *    - delete: hapus dari Firestore
 * 4. Update status sync_log (success / failed)
 *
 * Sync log harus di-insert oleh setiap CRUD handler (lihat addToSyncLog
 * di sync-queue.ts).
 */

import { getDb } from "../db"
import {
  syncLog,
  users,
  guru,
  tahunAjaran,
  kelas,
  mataPelajaran,
  siswa,
  absensi,
  tujuanPembelajaran,
  nilai,
  nilaiTp,
  nilaiPrakerin,
  absensiPrakerin,
  ekskul,
  nilaiEkskul,
  mapelKelasGuru,
  dimensiP5,
  subdimensiP5,
  subdimensiP5Tingkat,
  nilaiKokurikuler,
  catatanWaliKelas,
  infoSekolah,
  konfigurasi,
} from "../db/schema"
import { eq } from "drizzle-orm"
import net from "net"
import { initFirebase, pushToFirestore, deleteFromFirestore, getFirebaseConfig } from "./firebase-config"

/* ------------------------------------------------------------------ */
/*  Tabel yang di-sync ke Firestore                                   */
/*  Key: nama tabel di sync_log.tabel                                 */
/*  Value: schema reference                                            */
/* ------------------------------------------------------------------ */

const SYNCABLE_TABLES: Record<string, any> = {
  users,
  guru,
  tahun_ajaran: tahunAjaran,
  kelas,
  mata_pelajaran: mataPelajaran,
  siswa,
  absensi,
  tujuan_pembelajaran: tujuanPembelajaran,
  nilai,
  nilai_tp: nilaiTp,
  nilai_prakerin: nilaiPrakerin,
  absensi_prakerin: absensiPrakerin,
  ekskul,
  nilai_ekskul: nilaiEkskul,
  mapel_kelas_guru: mapelKelasGuru,
  dimensi_p5: dimensiP5,
  subdimensi_p5: subdimensiP5,
  subdimensi_p5_tingkat: subdimensiP5Tingkat,
  nilai_kokurikuler: nilaiKokurikuler,
  catatan_wali_kelas: catatanWaliKelas,
  info_sekolah: infoSekolah,
  konfigurasi,
}

// Daftar tabel yang TIDAK di-sync (sync_log sendiri + tabel deprecated)
const EXCLUDED_TABLES = new Set(["sync_log", "nilai_ketarunaan"])

/* ------------------------------------------------------------------ */
/*  Engine state                                                       */
/* ------------------------------------------------------------------ */

let syncInterval: ReturnType<typeof setInterval> | null = null
let isRunning = false
let isOnlineCached: { value: boolean; ts: number } | null = null

/* ------------------------------------------------------------------ */
/*  Internet check                                                     */
/* ------------------------------------------------------------------ */

function isOnline(): boolean {
  // Cache untuk 10 detik agar tidak spam socket
  if (isOnlineCached && Date.now() - isOnlineCached.ts < 10_000) {
    return isOnlineCached.value
  }
  try {
    const socket = new net.Socket()
    let resolved = false
    const result = socket.connect(80, "8.8.8.8", () => {
      resolved = true
      socket.destroy()
    })
    socket.setTimeout(2000, () => {
      if (!resolved) socket.destroy()
    })
    // Note: ini best-effort. Karena socket connect itu async,
    // kita asumsikan true kecuali ada error. Untuk lebih akurat,
    // bisa pakai DNS lookup atau fetch ke endpoint.
    isOnlineCached = { value: true, ts: Date.now() }
    return true
  } catch {
    isOnlineCached = { value: false, ts: Date.now() }
    return false
  }
}

/* ------------------------------------------------------------------ */
/*  Sync engine lifecycle                                              */
/* ------------------------------------------------------------------ */

export function startSyncEngine() {
  if (syncInterval) return
  syncInterval = setInterval(() => {
    runSyncCycle().catch((err) => console.error("[sync] cycle error:", err))
  }, 30000)
}

export function stopSyncEngine() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

/* ------------------------------------------------------------------ */
/*  Sync cycle: process pending records                                */
/* ------------------------------------------------------------------ */

const BATCH_SIZE = 20

export async function runSyncCycle(): Promise<{ processed: number; success: number; failed: number }> {
  if (isRunning) return { processed: 0, success: 0, failed: 0 }
  isRunning = true
  const result = { processed: 0, success: 0, failed: 0 }

  try {
    const online = isOnline()
    if (!online) return result

    // Init Firebase kalau belum
    const ok = initFirebase()
    if (!ok) return result

    const db = getDb()
    const pending = db
      .select()
      .from(syncLog)
      .where(eq(syncLog.status, "pending"))
      .limit(BATCH_SIZE)
      .all()

    for (const record of pending) {
      result.processed++

      if (EXCLUDED_TABLES.has(record.tabel)) {
        // Tabel yang tidak di-sync, langsung tandai success
        db.update(syncLog)
          .set({ status: "success", synced_at: new Date().toISOString() })
          .where(eq(syncLog.id, record.id))
          .run()
        result.success++
        continue
      }

      const tableRef = SYNCABLE_TABLES[record.tabel]
      if (!tableRef) {
        // Tabel tidak dikenal, tandai failed
        db.update(syncLog)
          .set({ status: "failed", synced_at: new Date().toISOString() })
          .where(eq(syncLog.id, record.id))
          .run()
        result.failed++
        continue
      }

      try {
        if (record.action === "delete") {
          await deleteFromFirestore(record.tabel, String(record.record_id))
        } else {
          // insert atau update: baca row dari SQLite, push ke Firestore
          const row = db
            .select()
            .from(tableRef)
            .where(eq(tableRef.id, record.record_id))
            .get()
          if (!row) {
            // Row sudah dihapus, treat sebagai delete
            await deleteFromFirestore(record.tabel, String(record.record_id))
          } else {
            await pushToFirestore(record.tabel, row, String(record.record_id))
          }
        }
        db.update(syncLog)
          .set({ status: "success", synced_at: new Date().toISOString() })
          .where(eq(syncLog.id, record.id))
          .run()
        result.success++
      } catch (err: any) {
        console.error(`[sync] Failed to sync ${record.tabel}/${record.record_id}:`, err)
        db.update(syncLog)
          .set({ status: "failed", synced_at: new Date().toISOString() })
          .where(eq(syncLog.id, record.id))
          .run()
        result.failed++
      }
    }
  } finally {
    isRunning = false
  }
  return result
}

/* ------------------------------------------------------------------ */
/*  Manual trigger                                                     */
/* ------------------------------------------------------------------ */

export async function triggerManualSync(): Promise<{ success: boolean; count?: number; processed?: number; failed?: number }> {
  const result = await runSyncCycle()
  const db = getDb()
  const stillPending = db
    .select()
    .from(syncLog)
    .where(eq(syncLog.status, "pending"))
    .all()
  return {
    success: result.failed === 0,
    count: stillPending.length,
    processed: result.processed,
    failed: result.failed,
  }
}

/* ------------------------------------------------------------------ */
/*  Status reporting                                                   */
/* ------------------------------------------------------------------ */

export type SyncStatus = {
  online: boolean
  firebaseConfigured: boolean
  pendingCount: number
  failedCount: number
  lastSync: string | null
  recentLogs: Array<{
    id: string
    tabel: string
    record_id: string
    action: string
    status: string
    synced_at: string
  }>
}

export function getSyncStatus(): SyncStatus {
  const db = getDb()
  const pending = db
    .select()
    .from(syncLog)
    .where(eq(syncLog.status, "pending"))
    .all()
  const failed = db
    .select()
    .from(syncLog)
    .where(eq(syncLog.status, "failed"))
    .all()
  const successAll = db
    .select()
    .from(syncLog)
    .where(eq(syncLog.status, "success"))
    .all()
  const lastSuccess = successAll[successAll.length - 1]
  const recentLogs = db
    .select()
    .from(syncLog)
    .all()
    .slice(-10)
    .reverse()

  return {
    online: isOnline(),
    firebaseConfigured: isFirebaseConfigured(),
    pendingCount: pending.length,
    failedCount: failed.length,
    lastSync: lastSuccess?.synced_at ?? null,
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      tabel: l.tabel,
      record_id: l.record_id,
      action: l.action,
      status: l.status,
      synced_at: l.synced_at,
    })),
  }
}

/* ------------------------------------------------------------------ */
/*  Firebase configuration check                                        */
/* ------------------------------------------------------------------ */

function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig()
  return !!(cfg.apiKey && cfg.projectId)
}

/* ------------------------------------------------------------------ */
/*  PULL: fetch from Firestore → upsert ke SQLite                       */
/* ------------------------------------------------------------------ */

import { getDocs, collection } from "firebase/firestore"
import { getFirestoreDb } from "./firebase-config"

/**
 * Daftar tabel master yang di-pull dari Firestore.
 * Urutan penting: parent dulu, baru yang punya FK.
 * (Tabel tanpa FK bisa dipull duluan tanpa error FK constraint.)
 */
const PULLABLE_TABLES: Array<{ name: string; schema: any; hasId: boolean }> = [
  { name: "users", schema: users, hasId: true },
  { name: "tahun_ajaran", schema: tahunAjaran, hasId: true },
  { name: "info_sekolah", schema: infoSekolah, hasId: true },
  { name: "konfigurasi", schema: konfigurasi, hasId: true },
  { name: "dimensi_p5", schema: dimensiP5, hasId: true },
  { name: "subdimensi_p5", schema: subdimensiP5, hasId: true },
  { name: "subdimensi_p5_tingkat", schema: subdimensiP5Tingkat, hasId: true },
  { name: "ekskul", schema: ekskul, hasId: true },
  { name: "guru", schema: guru, hasId: true },
  { name: "mata_pelajaran", schema: mataPelajaran, hasId: true },
  { name: "kelas", schema: kelas, hasId: true },
  { name: "mapel_kelas_guru", schema: mapelKelasGuru, hasId: true },
  { name: "siswa", schema: siswa, hasId: true },
]

export type PullResult = {
  success: boolean
  totalFetched: number
  totalUpserted: number
  tables: Array<{ name: string; fetched: number; upserted: number; error?: string }>
  error?: string
}

/**
 * Pull semua data master dari Firestore ke local SQLite.
 * Strategi: INSERT OR REPLACE per row (overwrite local).
 * Urutan: parent table dulu, baru child (FK-safe).
 */
export async function pullFromFirestore(
  onProgress?: (table: string, fetched: number) => void,
): Promise<PullResult> {
  const result: PullResult = {
    success: true,
    totalFetched: 0,
    totalUpserted: 0,
    tables: [],
  }

  // Init Firebase kalau belum
  if (!initFirebase()) {
    return { ...result, success: false, error: "Firebase not configured" }
  }

  const db = getFirestoreDb()
  if (!db) {
    return { ...result, success: false, error: "Firestore not initialized" }
  }

  const sqlite = getDb()

  for (const { name, schema, hasId } of PULLABLE_TABLES) {
    try {
      const snap = await getDocs(collection(db, name))
      const docs = snap.docs
      let upserted = 0

      if (docs.length > 0) {
        onProgress?.(name, docs.length)
      }

      for (const docSnap of docs) {
        const data = docSnap.data() as Record<string, any>
        // Firestore doc ID kita set sebagai string dari SQLite id (di pushToFirestore)
        // Pakai ID dari data kalau ada, fallback ke doc id
        const id = hasId && data.id != null ? Number(data.id) : null

        // Strip undefined values (Drizzle gak terima undefined)
        const cleanData: Record<string, any> = {}
        for (const [k, v] of Object.entries(data)) {
          if (v !== undefined) cleanData[k] = v
        }

        try {
          if (id != null && hasId) {
            // Upsert by id
            sqlite.insert(schema).values({ id, ...cleanData }).onConflictDoUpdate({
              target: schema.id,
              set: cleanData,
            }).run()
          } else {
            // Insert (tabel tanpa id autoincrement — gak ada di master)
            sqlite.insert(schema).values(cleanData).run()
          }
          upserted++
        } catch (rowErr: any) {
          // Skip individual row errors, lanjut ke row berikutnya
          console.warn(`[pull] ${name} row id=${id} failed:`, rowErr?.message ?? rowErr)
        }
      }

      result.totalFetched += docs.length
      result.totalUpserted += upserted
      result.tables.push({ name, fetched: docs.length, upserted })
    } catch (tableErr: any) {
      const msg = tableErr?.message ?? String(tableErr)
      console.error(`[pull] table ${name} failed:`, msg)
      result.tables.push({ name, fetched: 0, upserted: 0, error: msg })
      // Lanjut ke table berikutnya — partial pull lebih berguna daripada gagal total
    }
  }

  return result
}

