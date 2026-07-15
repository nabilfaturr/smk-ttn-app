import { useState, useEffect, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Save, Info } from "lucide-react"

type SubdimensiItem = { id: string; subdimensi_id: string; nama: string; grade: number | null }
type DimensiItem = { dimensi_id: string; nama: string; subdimensi: SubdimensiItem[] }

type SiswaRow = { id: string; nama: string }

/**
 * State untuk grade per siswa per subdimensi.
 * Nested structure (avoid delimiter issues dengan UUID yang mengandung "-").
 * grades[siswaId][subdimensiId] = 1 | 2 | 3 | null
 */
type GradeMap = Record<string, Record<string, number | null>>

export function KokurikulerPage() {
  const [kelasList, setKelasList] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState("")
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [dimensi, setDimensi] = useState<DimensiItem[]>([])
  const [tahunAjaran, setTahunAjaran] = useState("")
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
      if (aktif) setTahunAjaran(String(aktif.id))
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
    setGrades(flatToNested(result.grades))
    setDirty(false)
  }, [selectedKelas, tahunAjaran])

  useEffect(() => { loadAllGrades() }, [loadAllGrades])

  function flatToNested(flat: Record<string, number | null>): GradeMap {
    const nested: GradeMap = {}
    for (const [key, grade] of Object.entries(flat)) {
      const sepIdx = key.indexOf("|")
      if (sepIdx < 0) continue
      const siswaId = key.slice(0, sepIdx)
      const subdimensiId = key.slice(sepIdx + 1)
      if (!nested[siswaId]) nested[siswaId] = {}
      nested[siswaId][subdimensiId] = grade
    }
    return nested
  }

  function updateGrade(siswaId: string, subdimensiId: string, value: string) {
    const grade = value === "-" ? null : Number(value)
    setGrades((prev) => ({
      ...prev,
      [siswaId]: { ...(prev[siswaId] ?? {}), [subdimensiId]: grade },
    }))
    setDirty(true)
  }

  async function handleSave() {
    if (siswaList.length === 0 || !tahunAjaran) return

    let saved = 0
    for (const [siswaId, siswaGrades] of Object.entries(grades)) {
      const gradesArr = Object.entries(siswaGrades)
        .filter(([, g]) => g != null)
        .map(([subdimensiId, grade]) => ({ subdimensiId, grade: grade as number }))
      if (gradesArr.length === 0) continue
      await window.electronAPI.gradeSaveKokurikuler({
        siswaId,
        tahunAjaranId: tahunAjaran,
        grades: gradesArr,
      })
      saved++
    }

    toast.success(`Nilai kokurikuler disimpan untuk ${saved} siswa`)
    setDirty(false)
    loadAllGrades()
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
                            const subdimensiId = sd.id ?? sd.subdimensi_id
                            const currentVal = grades[s.id]?.[subdimensiId]
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
