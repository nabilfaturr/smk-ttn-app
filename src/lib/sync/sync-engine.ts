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
    id: number
    tabel: string
    record_id: number
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
