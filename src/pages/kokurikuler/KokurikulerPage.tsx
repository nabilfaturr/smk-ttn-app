import { useState, useEffect, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Save, Info } from "lucide-react"

type SubdimensiItem = { subdimensi_id: number; nama: string; grade: number | null }
type DimensiItem = { dimensi_id: number; nama: string; subdimensi: SubdimensiItem[] }

type SiswaRow = { id: number; nama: string }

/**
 * State untuk grade per siswa per subdimensi.
 * Key: `${siswaId}-${subdimensiId}` → value: grade (1, 2, 3, atau null)
 */
type GradeMap = Record<string, number | null>

export function KokurikulerPage() {
  const [kelasList, setKelasList] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState("")
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [dimensi, setDimensi] = useState<DimensiItem[]>([])
  const [tahunAjaran, setTahunAjaran] = useState(0)
  const [grades, setGrades] = useState<GradeMap>({})
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    const [k, t] = await Promise.all([
      window.electronAPI.classGetAll(),
      window.electronAPI.academicYearGetAll(),
    ])
    if (Array.isArray(k)) setKelasList(k)
    if (Array.isArray(t)) {
      const aktif = t.find((y: any) => y.is_active)
      if (aktif) setTahunAjaran(aktif.id)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const loadSiswa = useCallback(async () => {
    if (!selectedKelas) return
    const res = await window.electronAPI.studentGetAll()
    if (!Array.isArray(res)) return
    const filtered = res
      .map((r: any) => r.siswa ?? r)
      .filter((s: any) => String(s.kelas_id) === selectedKelas && s.status === "aktif")
      .map((s: any) => ({ id: s.id, nama: s.nama }))
    setSiswaList(filtered)
  }, [selectedKelas])

  useEffect(() => { loadSiswa() }, [loadSiswa])

  /**
   * Load SEMUA nilai kokurikuler untuk 1 kelas dalam 1 IPC call.
   * Handler baru (kokurikuler:getByKelas) melakukan JOIN siswa+nilai_kokurikuler
   * dalam 1 SQL query, lalu return Map of grades (key: siswaId-subdimensiId).
   *
   * Sebelumnya: 1 IPC call per siswa (parallel) → lag untuk 30 siswa.
   * Sekarang: 1 IPC call total → instant.
   */
  const loadAllGrades = useCallback(async () => {
    if (!selectedKelas || !tahunAjaran) {
      setDimensi([])
      setGrades({})
      return
    }
    const result = await window.electronAPI.kokurikulerGetByKelas(selectedKelas, tahunAjaran)
    if (result?.error || !result) {
      setDimensi([])
      setGrades({})
      return
    }
    setDimensi(result.dimensi)
    setGrades(result.grades)
    setDirty(false)
  }, [selectedKelas, tahunAjaran])

  useEffect(() => { loadAllGrades() }, [loadAllGrades])

  function updateGrade(siswaId: number, subdimensiId: number, value: string) {
    const key = `${siswaId}-${subdimensiId}`
    // Pakai "-" sebagai placeholder non-empty. Convert ke null on change.
    const grade = value === "-" ? null : Number(value)
    setGrades((prev) => ({ ...prev, [key]: grade }))
    setDirty(true)
  }

  async function handleSave() {
    if (siswaList.length === 0 || !tahunAjaran) return

    const gradesPerSiswa: Record<number, Array<{ subdimensiId: number; grade: number }>> = {}
    for (const s of siswaList) {
      gradesPerSiswa[s.id] = []
    }

    // Kumpulkan semua grades per siswa
    for (const [key, grade] of Object.entries(grades)) {
      if (grade == null) continue
      const [siswaIdStr, subdimensiIdStr] = key.split("-")
      const siswaId = Number(siswaIdStr)
      const subdimensiId = Number(subdimensiIdStr)
      if (gradesPerSiswa[siswaId]) {
        gradesPerSiswa[siswaId].push({ subdimensiId, grade })
      }
    }

    // Save per siswa (1 IPC call per siswa)
    let saved = 0
    for (const [siswaIdStr, siswaGrades] of Object.entries(gradesPerSiswa)) {
      if (siswaGrades.length === 0) continue
      await window.electronAPI.gradeSaveKokurikuler({
        siswaId: Number(siswaIdStr),
        tahunAjaranId: tahunAjaran,
        grades: siswaGrades,
      })
      saved++
    }

    toast.success(`Nilai kokurikuler disimpan untuk ${saved} siswa`)
    setDirty(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Kokurikuler (P5)</h2>
        <div className="grid gap-1.5 max-w-xs">
          <Label>Kelas</Label>
          <Select value={selectedKelas} onValueChange={setSelectedKelas}>
            <SelectTrigger>
              <SelectValue>
                {kelasList.find((k) => String(k.id) === selectedKelas)?.nama_kelas ?? "Pilih kelas"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {kelasList.map((k) => (
                <SelectItem key={k.id} value={String(k.id)}>
                  {k.nama_kelas}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedKelas && (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          <Info className="mx-auto mb-2 size-8" />
          <p>Pilih kelas terlebih dahulu untuk melihat daftar siswa dan dimensi P5.</p>
        </div>
      )}

      {selectedKelas && siswaList.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          <p>Tidak ada siswa aktif di kelas ini.</p>
        </div>
      )}

      {siswaList.length > 0 && dimensi.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {siswaList.length} siswa × {dimensi.flatMap((d) => d.subdimensi).length} subdimensi
            </p>
            <Button onClick={handleSave} disabled={!dirty}>
              <Save className="mr-1 size-4" />
              {dirty ? "Simpan Perubahan" : "Tidak Ada Perubahan"}
            </Button>
          </div>

          <div className="space-y-8">
            {dimensi.map((d) => (
              <div key={d.dimensi_id} className="rounded-md border">
                <div className="border-b bg-muted/30 px-4 py-2">
                  <h3 className="text-sm font-semibold">{d.nama}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="sticky left-0 z-10 min-w-[180px] bg-muted/30 p-2 text-left font-medium">
                          Nama Siswa
                        </th>
                        {d.subdimensi.map((sd) => (
                          <th
                            key={sd.id}
                            className="min-w-[140px] p-2 text-left text-xs font-medium"
                            title={sd.nama}
                          >
                            {sd.nama}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {siswaList.map((s) => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-muted/10">
                          <td className="sticky left-0 z-10 bg-background p-2 font-medium">
                            {s.nama}
                          </td>
                          {d.subdimensi.map((sd) => {
                            // BUG FIX: pakai `sd.id` (bukan `sd.subdimensi_id` yang undefined).
                            // Sebelumnya key jadi "181-undefined" untuk semua subdimensi siswa
                            // yang sama, sehingga 1 klik update semua cell.
                            const subdimensiId = sd.id
                            const key = `${s.id}-${subdimensiId}`
                            const currentVal = grades[key]
                            // Pakai "-" sebagai placeholder. null → "-"
                            const displayVal = currentVal == null ? "-" : String(currentVal)
                            return (
                              <td key={subdimensiId} className="p-2">
                                <Select
                                  value={displayVal}
                                  onValueChange={(v) => updateGrade(s.id, subdimensiId, v)}
                                >
                                  <SelectTrigger className="h-8 w-full min-w-[100px]">
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="-">-</SelectItem>
                                    <SelectItem value="1">1 - Berkembang</SelectItem>
                                    <SelectItem value="2">2 - Cakap</SelectItem>
                                    <SelectItem value="3">3 - Mahir</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
