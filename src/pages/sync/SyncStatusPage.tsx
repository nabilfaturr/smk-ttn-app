import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSyncStore, type SyncDataChangeEvent } from "@/stores/syncStore"
import { toast } from "sonner"

export function SyncStatusPage() {
  const {
    connectionStatus,
    pendingCount,
    lastSync,
    setConnectionStatus,
    setPendingCount,
    setLastSync,
    setFailedCount,
    setFirebaseConfigured,
    listenerStarted,
    recentChanges,
  } = useSyncStore()
  const [logs, setLogs] = useState<any[]>([])
  const [pulling, setPulling] = useState(false)

  async function loadStatus() {
    const res = await window.electronAPI.syncGetStatus()
    if (res?.error) return
    setConnectionStatus(res.online ? "online" : "offline")
    setPendingCount(res.pendingCount ?? 0)
    setFailedCount(res.failedCount ?? 0)
    setFirebaseConfigured(!!res.firebaseConfigured)
    setLastSync(res.lastSync ?? null)
    setLogs(res.recentLogs ?? [])
  }

  useEffect(() => { loadStatus() }, [])

  async function handleManualSync() {
    toast.info("Memulai sinkronisasi...")
    const result = await window.electronAPI.syncTriggerManualSync()
    if (result.success) {
      toast.success("Sinkronisasi selesai")
    } else {
      toast.error(`${result.count ?? 0} data masih pending`)
    }
    loadStatus()
  }

  async function handlePull() {
    const ok = confirm(
      "Restore dari Cloud akan menimpa data lokal dengan data dari Firebase.\n\n" +
        "Lanjutkan? (Data lokal yang belum ter-sync akan hilang)",
    )
    if (!ok) return

    setPulling(true)
    const toastId = toast.loading("Menarik data dari cloud...")
    try {
      const result = await window.electronAPI.syncPullFromCloud()
      if (result.success) {
        toast.success(
          `Restore selesai: ${result.totalUpserted} data dari ${result.tables.length} tabel`,
          { id: toastId },
        )
      } else {
        toast.error(`Restore gagal: ${result.error ?? "unknown error"}`, { id: toastId })
      }
    } catch (err: any) {
      toast.error(`Restore gagal: ${err?.message ?? err}`, { id: toastId })
    } finally {
      setPulling(false)
      loadStatus()
    }
  }

  async function handleExport() {
    const res = await window.electronAPI.syncExportDatabase()
    if (res) {
      toast.success(`Database diekspor ke ${res}`)
    }
    loadStatus()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Sinkronisasi</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Koneksi Internet</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={connectionStatus === "online" ? "default" : "secondary"} className="text-base">
              {connectionStatus === "online" ? "Online" : connectionStatus === "offline" ? "Offline" : "Memeriksa..."}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Antrean Sinkronisasi</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">data menunggu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Terakhir Sinkron</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{lastSync ? new Date(lastSync).toLocaleString("id-ID") : "Belum pernah"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleManualSync} disabled={connectionStatus !== "online"}>
          Sinkronkan Sekarang
        </Button>
        <Button
          variant="outline"
          onClick={handlePull}
          disabled={pulling || connectionStatus !== "online"}
        >
          {pulling ? "Menarik data..." : "Restore dari Cloud"}
        </Button>
        <Button variant="outline" onClick={handleExport}>
          Export Database
        </Button>
      </div>

      {logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Aktivitas Terakhir</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Tabel</th>
                    <th className="p-2 text-left">Aksi</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="p-2">{log.tabel}</td>
                      <td className="p-2">{log.action}</td>
                      <td className="p-2">
                        <Badge variant={log.status === "success" ? "default" : log.status === "pending" ? "secondary" : "destructive"}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">{new Date(log.synced_at).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {recentChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span>Perubahan Real-time</span>
              {listenerStarted && <Badge variant="outline" className="bg-cyan-50 text-cyan-700">Listener aktif</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Tabel</th>
                    <th className="p-2 text-left">Tipe</th>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {recentChanges.map((change: SyncDataChangeEvent, i) => (
                    <tr key={`${change.id}-${change.timestamp}-${i}`} className="border-b last:border-0">
                      <td className="p-2">{change.table}</td>
                      <td className="p-2">
                        <Badge variant={change.type === "added" ? "default" : change.type === "modified" ? "secondary" : "destructive"}>
                          {change.type}
                        </Badge>
                      </td>
                      <td className="p-2 font-mono text-xs">{change.id.slice(0, 12)}…</td>
                      <td className="p-2 text-xs text-muted-foreground">{new Date(change.timestamp).toLocaleTimeString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Perubahan di tabel dari cloud — refetch halaman untuk lihat data terbaru.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
