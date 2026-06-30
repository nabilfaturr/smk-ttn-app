import { useAuthStore } from "../../stores/authStore"
import { useUIStore } from "../../stores/uiStore"
import { Menu } from "lucide-react"
import { SyncStatusBadge } from "./SyncStatusBadge"
import { useSyncStatus } from "@/hooks/useSyncStatus"

export function Header() {
  const { user } = useAuthStore()
  const { toggleSidebar } = useUIStore()

  useSyncStatus()

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          Sistem Absensi dan Penilaian
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <SyncStatusBadge />
        <span className="text-sm font-medium text-gray-900">
          {user?.nama || user?.username}
        </span>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {user?.roles?.join(" + ") || user?.role || "Guru"}
        </span>
      </div>
    </header>
  )
}
