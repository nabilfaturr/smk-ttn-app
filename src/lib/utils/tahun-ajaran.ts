/**
 * Utilitas untuk tahun ajaran (TA).
 *
 * Tabel `tahun_ajaran` punya multiple row per TA (ganjil + genap).
 * Untuk UI dropdown, kita hanya butuh 1 row per TA → pakai `dedupeTahunAjarans`.
 *
 * Prioritas deduplikasi:
 * 1. `is_active = 1` (TA aktif)
 * 2. semester ganjil
 * 3. first seen (fallback)
 *
 * Sort: descending by nama (TA terbaru di atas).
 */

export type AcademicYear = {
  id: number
  nama: string
  semester: number | string
  is_active: number
}

export function dedupeTahunAjarans(taList: AcademicYear[]): AcademicYear[] {
  const byNama = new Map<string, AcademicYear>()
  for (const t of taList) {
    const existing = byNama.get(t.nama)
    if (!existing) {
      byNama.set(t.nama, t)
      continue
    }
    if (t.is_active && !existing.is_active) {
      byNama.set(t.nama, t)
      continue
    }
    const tIsGanjil = t.semester === 1 || t.semester === "ganjil"
    const eIsGanjil = existing.semester === 1 || existing.semester === "ganjil"
    if (tIsGanjil && !eIsGanjil) {
      byNama.set(t.nama, t)
    }
  }
  return Array.from(byNama.values()).sort((a, b) => b.nama.localeCompare(a.nama))
}
