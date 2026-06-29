import { useState, useEffect, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Award, Info, Check, X, Users } from "lucide-react"

type Ekskul = { id: number; nama: string; wajib: 0 | 1 }
type SiswaRow = {
  siswa_id: number
  nama: string
  nis: string
  enrolled_ekskul_ids: number[]
}

export function ExtracurricularPage() {
  const [kelasList, setKelasList] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState("")
  const [ekskulList, setEkskulList] = useState<Ekskul[]>([])
  const [data, setData] = useState<SiswaRow[]>([])
  const [tahunAjaranId, setTahunAjaranId] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<Set<string>>(new Set())

  const loadMaster = useCallback(async () => {
    const [k, t, e] = await Promise.all([
      window.electronAPI.classGetAll(),
      window.electronAPI.academicYearGetAll(),
      window.electronAPI.ekskulGetAll(),
    ])
    if (Array.isArray(k)) setKelasList(k)
    if (Array.isArray(t)) {
      const aktif = t.find((y: any) => y.is_active)
      if (aktif) setTahunAjaranId(aktif.id)
    }
    if (Array.isArray(e)) setEkskulList(e)
  }, [])

  useEffect(() => {
    loadMaster()
  }, [loadMaster])

  const loadData = useCallback(async () => {
    if (!selectedKelas || !tahunAjaranId) return
    setLoading(true)
    const res = await window.electronAPI.ekskulSiswaGetByKelas(
      Number(selectedKelas),
      tahunAjaranId,
    )
    if (Array.isArray(res)) {
      setData(res)
    } else {
      setData([])
    }
    setLoading(false)
  }, [selectedKelas, tahunAjaranId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const keyOf = (siswaId: number, ekskulId: number) => `${siswaId}-${ekskulId}`

  const toggleEnroll = async (siswaId: number, ekskulId: number, currentlyEnrolled: boolean) => {
    const key = keyOf(siswaId, ekskulId)
    if (pending.has(key)) return
    setPending((prev) => new Set(prev).add(key))

    // Optimistic update
    setData((prev) =>
      prev.map((row) => {
        if (row.siswa_id !== siswaId) return row
        const ids = currentlyEnrolled
          ? row.enrolled_ekskul_ids.filter((id) => id !== ekskulId)
          : [...row.enrolled_ekskul_ids, ekskulId]
        return { ...row, enrolled_ekskul_ids: ids }
      }),
    )

    const res = currentlyEnrolled
      ? await window.electronAPI.ekskulSiswaUnenroll({
          siswaId,
          ekskulId,
          tahunAjaranId,
        })
      : await window.electronAPI.ekskulSiswaEnroll({
          siswaId,
          ekskulId,
          tahunAjaranId,
        })

    setPending((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })

    if (res && "error" in res) {
      toast.error(res.error)
      // Revert optimistic update
      loadData()
    } else {
      const e = ekskulList.find((x) => x.id === ekskulId)
      toast.success(
        currentlyEnrolled
          ? `${e?.nama} dihapus dari siswa`
          : `${e?.nama} ditambahkan ke siswa`,
      )
    }
  }

  const enrolledCount = (ekskulId: number) =>
    data.filter((row) => row.enrolled_ekskul_ids.includes(ekskulId)).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Award className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Ekstrakurikuler</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengaturan</CardTitle>
          <CardDescription>
            Pilih kelas untuk mengelola ekskul siswa. Centang ekskul pilihan
            yang diikuti siswa. Ketarunaan bersifat wajib dan tidak bisa
            dihapus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label>Kelas</Label>
            <Select value={selectedKelas} onValueChange={setSelectedKelas}>
              <SelectTrigger>
                <SelectValue>
                  {kelasList.find((k) => String(k.id) === selectedKelas)?.nama_kelas ??
                    "Pilih kelas"}
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
        </CardContent>
      </Card>

      {selectedKelas && (
        <>
          {/* Counter per ekskul */}
          {ekskulList.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ekskulList.map((e) => {
                const count = enrolledCount(e.id)
                return (
                  <Badge
                    key={e.id}
                    variant={e.wajib === 1 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {e.nama}
                    {e.wajib === 1 ? " (Wajib)" : ""}: {count}/{data.length}
                  </Badge>
                )
              })}
            </div>
          )}

          {/* Info banner */}
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 flex gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong>Predikat di rapor:</strong> Otomatis "A" untuk semua
              ekskul yang diikuti. Jika perlu mengubah (misal siswa bermasalah
              di ekskul tertentu), edit langsung di file DOCX yang sudah
              di-generate.
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-sm text-muted-foreground">Memuat data...</div>
          ) : data.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                Tidak ada siswa aktif di kelas ini.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium sticky left-0 bg-muted/50 z-10">
                      Nama Siswa
                    </th>
                    {ekskulList.map((e) => (
                      <th
                        key={e.id}
                        className="p-3 text-center font-medium min-w-[120px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{e.nama}</span>
                          {e.wajib === 1 && (
                            <Badge variant="default" className="text-[10px] px-1.5">
                              Wajib
                            </Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.siswa_id} className="border-b">
                      <td className="p-3 font-medium sticky left-0 bg-background">
                        <div className="flex flex-col">
                          <span>{row.nama}</span>
                          <span className="text-xs text-muted-foreground">
                            {row.nis}
                          </span>
                        </div>
                      </td>
                      {ekskulList.map((e) => {
                        const enrolled = row.enrolled_ekskul_ids.includes(e.id)
                        const key = keyOf(row.siswa_id, e.id)
                        const isPending = pending.has(key)
                        return (
                          <td key={e.id} className="p-3 text-center">
                            {e.wajib === 1 ? (
                              <span
                                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary"
                                title="Wajib, otomatis terdaftar"
                              >
                                <Check className="h-4 w-4" />
                              </span>
                            ) : (
                              <Checkbox
                                checked={enrolled}
                                disabled={isPending}
                                onCheckedChange={() =>
                                  toggleEnroll(row.siswa_id, e.id, enrolled)
                                }
                                className="mx-auto"
                              />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
