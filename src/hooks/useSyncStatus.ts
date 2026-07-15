import { useEffect } from "react"
import { useSyncStore } from "@/stores/syncStore"

const POLL_INTERVAL_MS = 5000

/**
 * Polls sync status from main process every 5s and updates the store.
 * Used by SyncStatusBadge in Header to keep indicator fresh.
 */
export function useSyncStatus() {
  const {
    setConnectionStatus,
    setPendingCount,
    setFailedCount,
    setDeadLetterCount,
    setLastSync,
    setFirebaseConfigured,
    setStartupPullInProgress,
    setStartupPullResult,
    setListenerStarted,
  } = useSyncStore()

  useEffect(() => {
    let mounted = true

    async function poll() {
      if (!mounted) return
      try {
        const res = await window.electronAPI.syncGetStatus()
        if (!mounted || !res || res.error) return
        setConnectionStatus(res.online ? "online" : "offline")
        setPendingCount(res.pendingCount ?? 0)
        setFailedCount(res.failedCount ?? 0)
        setDeadLetterCount(res.deadLetterCount ?? 0)
        setLastSync(res.lastSync ?? null)
        setFirebaseConfigured(!!res.firebaseConfigured)
        if (res.startupPull) {
          setStartupPullInProgress(!!res.startupPull.inProgress)
          setStartupPullResult(res.startupPull.result ?? null)
        }
      } catch {
        // silent — main process not ready, or window closed
      }
    }

    async function pollListener() {
      if (!mounted) return
      try {
        const res = await window.electronAPI.syncGetListenerState?.()
        if (!mounted || !res) return
        setListenerStarted(!!res.started)
      } catch {
        // silent
      }
    }

    poll()
    pollListener()
    const id = setInterval(() => {
      poll()
      pollListener()
    }, POLL_INTERVAL_MS)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [
    setConnectionStatus,
    setPendingCount,
    setFailedCount,
    setDeadLetterCount,
    setLastSync,
    setFirebaseConfigured,
    setStartupPullInProgress,
    setStartupPullResult,
    setListenerStarted,
  ])
}
