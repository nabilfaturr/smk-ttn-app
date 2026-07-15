import { useEffect, useRef } from "react"
import { Outlet } from "react-router-dom"
import { toast } from "sonner"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useSyncStore, type SyncDataChangeEvent } from "@/stores/syncStore"

const TABLE_LABELS: Record<string, string> = {
  users: "User",
  tahun_ajaran: "Tahun Ajaran",
  guru: "Guru",
  kelas: "Kelas",
  siswa: "Siswa",
  mata_pelajaran: "Mata Pelajaran",
  absensi: "Absensi",
  nilai: "Nilai",
  nilai_tp: "Nilai TP",
  nilai_prakerin: "Nilai Prakerin",
  ekskul: "Ekstrakurikuler",
  nilai_ekskul: "Nilai Ekskul",
  catatan_wali_kelas: "Catatan Wali Kelas",
  mapel_kelas_guru: "Assignment Mapel",
  tujuan_pembelajaran: "Tujuan Pembelajaran",
  info_sekolah: "Info Sekolah",
  konfigurasi: "Konfigurasi",
  dimensi_p5: "Dimensi P5",
  subdimensi_p5: "Subdimensi P5",
  subdimensi_p5_tingkat: "Subdimensi P5 Tingkat",
  nilai_kokurikuler: "Nilai Kokurikuler",
  absensi_prakerin: "Absensi Prakerin",
}

const TYPE_VERB: Record<SyncDataChangeEvent["type"], string> = {
  added: "Data baru",
  modified: "Diperbarui",
  removed: "Dihapus",
}

/**
 * Pasang listener: tiap ada perubahan dari Firestore real-time,
 * tampilkan toast ringkas.
 */
function SyncToastWatcher() {
  const recentChanges = useSyncStore((s) => s.recentChanges)
  const lastSeenRef = useRef<number>(Date.now())

  useEffect(() => {
    if (recentChanges.length === 0) return
    const fresh = recentChanges.filter((c) => c.timestamp > lastSeenRef.current)
    if (fresh.length === 0) return
    lastSeenRef.current = fresh[0].timestamp
    // Show toast hanya untuk 3 event pertama, sisanya silent
    const toShow = fresh.slice(0, 3)
    for (const ev of toShow.reverse()) {
      const label = TABLE_LABELS[ev.table] ?? ev.table
      const verb = TYPE_VERB[ev.type] ?? "Berubah"
      toast.info(`${verb} · ${label}`, {
        description: `ID: ${ev.id.slice(0, 8)}…`,
        duration: 2500,
      })
    }
  }, [recentChanges])

  return null
}

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <SyncToastWatcher />
    </div>
  )
}
