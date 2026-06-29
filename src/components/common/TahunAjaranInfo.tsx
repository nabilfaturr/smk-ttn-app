/**
 * Komponen read-only badge untuk menampilkan tahun ajaran aktif.
 *
 * Dipakai di halaman absensi & nilai untuk role admin — sebagai indikator
 * periode operasional saat ini (sesuai PRD Section 4.1).
 *
 * Hanya menampilkan informasi, TIDAK bisa diedit dari sini. Untuk ganti
 * tahun ajaran aktif, admin harus ke menu Data Tahun Ajaran.
 *
 * @example
 * <TahunAjaranInfo />
 */

import { Calendar, AlertCircle } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { useActiveTahunAjaran } from "@/hooks/useActiveTahunAjaran"
import { formatSemester } from "@/lib/utils/formatters"

export function TahunAjaranInfo() {
  const { user } = useAuthStore()
  const { ta, loading } = useActiveTahunAjaran()

  // Hanya tampilkan untuk admin. Wali kelas & guru sudah terikat
  // ke kelas/mapel masing-masing — TA tidak perlu ditampilkan eksplisit.
  if (!user?.roles?.includes("admin")) return null

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <Calendar className="size-4 animate-pulse" />
        <span>Memuat tahun ajaran...</span>
      </div>
    )
  }

  if (!ta) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <AlertCircle className="size-4" />
        <span>Belum ada tahun ajaran aktif. Set di menu Data Tahun Ajaran.</span>
      </div>
    )
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-md border bg-blue-50 px-3 py-1.5 text-sm text-blue-900"
      title="Tahun ajaran ini adalah periode operasional aktif sistem. Tidak dapat diubah dari sini — gunakan menu Data Tahun Ajaran."
    >
      <Calendar className="size-4" />
      <span className="font-medium">Tahun Ajaran Aktif:</span>
      <span className="font-semibold">{ta.nama}</span>
      <span className="text-blue-700">•</span>
      <span>Semester {ta.semester} ({formatSemester(ta.semester)})</span>
    </div>
  )
}
