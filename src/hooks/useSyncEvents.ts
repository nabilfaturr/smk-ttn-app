/**
 * useSyncEvents — subscribe ke real-time Firestore listener events dari main.
 *
 * Pasang sekali di root (mis. App.tsx). Update syncStore.recentChanges
 * supaya komponen lain bisa react (toast, refetch, etc).
 */

import { useEffect } from "react"
import { useSyncStore, type SyncDataChangeEvent } from "@/stores/syncStore"

export function useSyncEvents() {
  const pushRecentChange = useSyncStore((s) => s.pushRecentChange)

  useEffect(() => {
    if (!window.electronAPI?.onSyncDataChanged) return

    const unsubscribe = window.electronAPI.onSyncDataChanged((event: SyncDataChangeEvent) => {
      pushRecentChange(event)
    })

    return () => {
      unsubscribe?.()
    }
  }, [pushRecentChange])
}
