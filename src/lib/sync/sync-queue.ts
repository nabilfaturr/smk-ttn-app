import { getDb } from "../db"
import { syncLog } from "../db/schema"

export function addToSyncLog(
  tabel: string,
  recordId: string,
  action: "insert" | "update" | "delete",
) {
  try {
    const db = getDb()
    db.insert(syncLog)
      .values({
        tabel,
        record_id: recordId,
        action,
        synced_at: new Date().toISOString(),
        status: "pending",
        retry_count: 0,
        next_retry_at: null,
        last_error: null,
      })
      .run()
  } catch {
    // silently fail - sync log is non-critical
  }
}
