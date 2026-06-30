import { useSyncStore, type SyncBadgeStatus } from "@/stores/syncStore"
import { CheckCircle2, AlertCircle, Loader2, CloudOff, Cloud, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

function formatRelative(iso: string | null): string {
  if (!iso) return ""
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return "baru saja"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  return `${d} hari lalu`
}

function deriveStatus(
  online: boolean,
  firebaseConfigured: boolean,
  pendingCount: number,
  failedCount: number,
  syncing: boolean,
  lastSync: string | null,
): SyncBadgeStatus {
  if (!firebaseConfigured) return "unconfigured"
  if (!online) return "offline"
  if (failedCount > 0) return "error"
  if (syncing) return "syncing"
  if (pendingCount > 0) return "pending"
  return "synced"
}

const STATUS_CONFIG: Record<
  SyncBadgeStatus,
  {
    label: (pendingCount: number, lastSync: string | null) => string
    className: string
    icon: React.ComponentType<{ className?: string }>
    spin?: boolean
  }
> = {
  synced: {
    label: (_p, lastSync) => (lastSync ? `Tersinkron · ${formatRelative(lastSync)}` : "Tersinkron"),
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    icon: CheckCircle2,
  },
  syncing: {
    label: () => "Menyinkronkan...",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Loader2,
    spin: true,
  },
  pending: {
    label: (p) => `${p} data belum sync`,
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    icon: AlertCircle,
  },
  error: {
    label: (p, _l) => `${p} data gagal sync`,
    className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    icon: XCircle,
  },
  offline: {
    label: (p) => (p > 0 ? `${p} data · offline` : "Offline"),
    className: "bg-gray-100 text-gray-600 border-gray-200",
    icon: CloudOff,
  },
  unconfigured: {
    label: () => "Sync nonaktif",
    className: "bg-gray-100 text-gray-500 border-gray-200",
    icon: Cloud,
  },
}

export function SyncStatusBadge() {
  const { connectionStatus, pendingCount, failedCount, lastSync, firebaseConfigured, syncing } =
    useSyncStore()

  const status = deriveStatus(
    connectionStatus === "online",
    firebaseConfigured,
    pendingCount,
    failedCount,
    syncing,
    lastSync,
  )

  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <button
      type="button"
      title={
        status === "unconfigured"
          ? "Sync nonaktif — konfigurasi di Settings → Firebase Sync"
          : status === "offline"
            ? "Tidak ada koneksi internet"
            : "Lihat detail di Sinkronisasi"
      }
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
        config.className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", config.spin && "animate-spin")} />
      <span>{config.label(pendingCount, lastSync)}</span>
    </button>
  )
}
