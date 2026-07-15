/**
 * useDataInvalidation — trigger refetch saat ada perubahan data di Firestore.
 *
 * Karena project tidak pakai React Query, kita pakai pattern:
 * - Counter increment tiap ada perubahan ke table yang di-watch
 * - Page yang pakai hook ini add counter ke useEffect dependency → refetch
 *
 * Contoh:
 *   const { bumpVersion } = useDataInvalidation(["siswa", "kelas"])
 *   useEffect(() => { load() }, [bumpVersion])
 */

import { useEffect, useRef, useState } from "react"
import { useSyncStore } from "@/stores/syncStore"

export function useDataInvalidation(tables: string[]) {
  const [version, setVersion] = useState(0)
  const recentChanges = useSyncStore((s) => s.recentChanges)
  const lastSeenRef = useRef<number>(0)

  useEffect(() => {
    if (recentChanges.length === 0) return
    // Cek apakah ada perubahan ke table yang di-watch
    const hasRelevant = recentChanges.some(
      (c) => tables.includes(c.table) && c.timestamp > lastSeenRef.current,
    )
    if (hasRelevant) {
      lastSeenRef.current = Date.now()
      setVersion((v) => v + 1)
    }
  }, [recentChanges, tables])

  return { bumpVersion: version }
}
