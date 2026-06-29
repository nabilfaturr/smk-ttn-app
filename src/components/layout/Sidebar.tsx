import { useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"
import { cn } from "@/lib/utils"
import { useUIStore } from "../../stores/uiStore"
import {
  LayoutDashboard,
  Users,
  UserCog,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  Award,
  BookMarked,
  Briefcase,
  FileText,
  StickyNote,
  Printer,
  RefreshCw,
  Menu,
  LogOut,
  Settings,
  ClipboardList,
  Target,
  Layers,
  Archive,
} from "lucide-react"

const menuByRole: Record<string, { label: string; icon: any; path: string }[]> = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Data Siswa", icon: Users, path: "/students" },
    { label: "Data Kelas", icon: GraduationCap, path: "/classes" },
    { label: "Data Guru", icon: BookOpen, path: "/teachers" },
    { label: "Data Mapel", icon: BookMarked, path: "/subjects" },
    { label: "Tahun Ajaran", icon: Calendar, path: "/academic-years" },
    { label: "Absensi", icon: ClipboardCheck, path: "/attendance" },
    { label: "Nilai", icon: FileSpreadsheet, path: "/grades" },
    { label: "Ekstrakurikuler", icon: Award, path: "/ekskul" },
    { label: "Kelola Guru Pengampu", icon: UserCog, path: "/mapel-assignments" },
    { label: "Kelola TP", icon: Target, path: "/master/learning-objectives" },
    { label: "Arsip", icon: Archive, path: "/arsip" },
    { label: "Kokurikuler (P5)", icon: Target, path: "/kokurikuler" },
    { label: "Atur Kokurikuler/Tingkat", icon: Layers, path: "/kokurikuler/tingkat" },
    { label: "Prakerin", icon: Briefcase, path: "/prakerin" },
    { label: "Catatan Wali Kelas", icon: StickyNote, path: "/teacher-notes" },
    { label: "Generate Rapor", icon: Printer, path: "/generate-report" },
    { label: "Sinkronisasi", icon: RefreshCw, path: "/sync" },
    { label: "Pengaturan", icon: Settings, path: "/settings" },
  ],
  wali_kelas: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Input Absensi", icon: ClipboardList, path: "/attendance/input" },
    { label: "Rekap Absensi", icon: ClipboardCheck, path: "/attendance/recap" },
    { label: "Catatan Wali Kelas", icon: StickyNote, path: "/teacher-notes" },
  ],
  guru: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Input Nilai", icon: FileText, path: "/grades/input" },
    { label: "Kelola TP", icon: Target, path: "/master/learning-objectives" },
  ],
}

function getMergedMenu(roles: string[]) {
  const seen = new Set<string>()
  const items: { label: string; icon: any; path: string }[] = []
  for (const role of roles) {
    const roleItems = menuByRole[role]
    if (!roleItems) continue
    for (const item of roleItems) {
      if (!seen.has(item.path)) {
        seen.add(item.path)
        items.push(item)
      }
    }
  }
  return items
}

export function Sidebar() {
  const { user } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()

  const items = user ? getMergedMenu(user.roles) : []

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-gray-200 bg-white transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <span className="text-sm font-bold text-blue-700">SMK TTN</span>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      <div className="border-t p-3">
        {!sidebarCollapsed && user && (
          <div className="mb-2 text-xs text-gray-500">
            <div className="truncate font-medium text-gray-900">
              {user.nama || user.username}
            </div>
            <div className="truncate">({user.roles.join(", ")})</div>
          </div>
        )}
        <button
          onClick={() => {
            useAuthStore.getState().logout()
            navigate("/login")
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          {!sidebarCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )
}
