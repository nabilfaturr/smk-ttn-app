/**
 * Hook untuk fetch tahun ajaran (TA) aktif dari database.
 *
 * Tahun ajaran aktif adalah row di tabel `tahun_ajaran` dengan
 * `is_active = 1`. Hook ini fetch on mount dan cache hasilnya.
 *
 * @returns `{ ta, loading }`:
 *   - `ta: { id, nama, semester } | null` — null jika belum ada TA aktif
 *   - `loading: boolean` — true saat pertama kali fetch
 *
 * @example
 * const { ta } = useActiveTahunAjaran()
 * if (ta) console.log(ta.nama) // "2025/2026"
 */
import { useEffect, useState, useCallback } from "react"

export type ActiveTahunAjaran = {
  id: number
  nama: string
  semester: 1 | 2
}

export function useActiveTahunAjaran() {
  const [ta, setTa] = useState<ActiveTahunAjaran | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.academicYearGetAll()
    if (Array.isArray(res)) {
      const aktif = res.find((t: any) => t.is_active === 1 || t.is_active === true)
      if (aktif) {
        setTa({
          id: aktif.id,
          nama: aktif.nama,
          semester: aktif.semester,
        })
      } else {
        setTa(null)
      }
    } else {
      setTa(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ta, loading, refresh }
}
