import { useState, useEffect, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Save, RotateCcw, Users, Info } from "lucide-react"

type Subject = {
  id: number
  kode_mapel: string
  nama_mapel: string
  jenis: string
}

type Guru = { id: number; nama: string; nip: string | null; bidang_studi: string | null }

type AssignmentRow = {
  kelas_id: number
  kelas_nama: string
  assignment_id: number | null
  guru_id: number | null
  guru_nama: string | null
  is_assigned: boolean
}

const NIL_VALUE = "__none__"

export function MapelAssignmentPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [guruList, setGuruList] = useState<Guru[]>([])
  const [selectedMapel, setSelectedMapel] = useState<string>("")
  const [tahunAjaranId, setTahunAjaranId] = useState(0)
  const [tahunAjaranNama, setTahunAjaranNama] = useState("")
  const [rows, setRows] = useState<AssignmentRow[]>([])
  const [original, setOriginal] = useState<Map<number, number | null>>(new Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadMaster = useCallback(async () => {
    const [subRes, guruRes, taRes] = await Promise.all([
      window.electronAPI.subjectGetAll(),
      window.electronAPI.mapelAssignmentGetGuruList(),
      window.electronAPI.academicYearGetAll(),
    ])
    if (Array.isArray(subRes)) {
      const sorted = [...subRes].sort((a: any, b: any) => a.kode_mapel.localeCompare(b.kode_mapel))
      setSubjects(sorted as Subject[])
    }
    if (Array.isArray(guruRes)) setGuruList(guruRes as Guru[])
    if (Array.isArray(taRes)) {
      const aktif = (taRes as any[]).find((t) => t.is_active)
      if (aktif) {
        setTahunAjaranId(aktif.id)
        setTahunAjaranNama(aktif.nama)
      }
    }
  }, [])

  useEffect(() => {
    loadMaster()
  }, [loadMaster])

  const loadAssignment = useCallback(async () => {
    if (!selectedMapel || !tahunAjaranId) return
    setLoading(true)
    const res = await window.electronAPI.mapelAssignmentGetByMapel(
      Number(selectedMapel),
      tahunAjaranId,
    )
    if (Array.isArray(res)) {
      setRows(res as AssignmentRow[])
      const orig = new Map<number, number | null>()
      for (const r of res as AssignmentRow[]) {
        orig.set(r.kelas_id, r.guru_id)
      }
      setOriginal(orig)
    } else {
      setRows([])
      setOriginal(new Map())
    }
    setLoading(false)
  }, [selectedMapel, tahunAjaranId])

  useEffect(() => {
    loadAssignment()
  }, [loadAssignment])

  const dirtyRows = rows.filter((r) => original.get(r.kelas_id) !== r.guru_id)

  function updateGuru(kelasId: number, newGuruId: number | null) {
    setRows((prev) =>
      prev.map((r) => (r.kelas_id === kelasId ? { ...r, guru_id: newGuruId, is_assigned: newGuruId != null } : r)),
    )
  }

  async function handleSave() {
    if (dirtyRows.length === 0) return
    setSaving(true)
    const assignments = dirtyRows.map((r) => ({
      kelas_id: r.kelas_id,
      guru_id: r.guru_id,
    }))
    const res = await window.electronAPI.mapelAssignmentBulkUpsert({
      mapelId: Number(selectedMapel),
      tahunAjaranId,
      assignments,
    })
    setSaving(false)
    if (res && "error" in res) {
      toast.error(res.error)
    } else {
      const r = res as { inserted: number; updated: number; deleted: number }
      const parts: string[] = []
      if (r.inserted) parts.push(`${r.inserted} ditambah`)
      if (r.updated) parts.push(`${r.updated} diubah`)
      if (r.deleted) parts.push(`${r.deleted} dihapus`)
      toast.success(`Disimpan (${parts.join(", ") || "tidak ada perubahan"})`)
      loadAssignment()
    }
  }

  function handleReset() {
    setRows((prev) =>
      prev.map((r) => ({ ...r, guru_id: original.get(r.kelas_id) ?? null })),
    )
  }

  const selectedSubject = subjects.find((s) => String(s.id) === selectedMapel)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Kelola Guru Pengampu</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Atur guru pengampu untuk setiap mata pelajaran per kelas di tahun ajaran{" "}
          <span className="font-medium">{tahunAjaranNama || "..."}</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih Mata Pelajaran</CardTitle>
          <CardDescription>
            Pilih mapel untuk mengatur guru pengampu di setiap kelas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-2xl">
            <Select value={selectedMapel} onValueChange={setSelectedMapel}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Pilih mata pelajaran..." />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.kode_mapel} - {s.nama_mapel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedMapel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedSubject?.kode_mapel} - {selectedSubject?.nama_mapel}
                </CardTitle>
                <CardDescription>
                  {rows.length} kelas · {rows.filter((r) => r.is_assigned).length} sudah
                  di-assign · {dirtyRows.length} perubahan belum disimpan
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={dirtyRows.length === 0 || saving}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={dirtyRows.length === 0 || saving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Memuat data...</div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">Tidak ada kelas.</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 text-left font-medium w-1/3">Kelas</th>
                      <th className="p-3 text-left font-medium">Guru Pengampu</th>
                      <th className="p-3 text-center font-medium w-32">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isDirty = original.get(row.kelas_id) !== row.guru_id
                      return (
                        <tr
                          key={row.kelas_id}
                          className={isDirty ? "border-b bg-yellow-50" : "border-b"}
                        >
                          <td className="p-3 font-medium">{row.kelas_nama}</td>
                          <td className="p-3">
                            <Select
                              value={row.guru_id ? String(row.guru_id) : NIL_VALUE}
                              onValueChange={(v) =>
                                updateGuru(row.kelas_id, v === NIL_VALUE ? null : Number(v))
                              }
                            >
                              <SelectTrigger className="h-9 max-w-md">
                                <SelectValue>
                                  {row.guru_nama ?? (
                                    <span className="text-muted-foreground italic">
                                      Belum di-assign
                                    </span>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NIL_VALUE}>
                                  <span className="text-muted-foreground italic">
                                    (Belum di-assign)
                                  </span>
                                </SelectItem>
                                {guruList.map((g) => (
                                  <SelectItem key={g.id} value={String(g.id)}>
                                    {g.nama}
                                    {g.bidang_studi ? (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({g.bidang_studi})
                                      </span>
                                    ) : null}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 text-center">
                            {isDirty ? (
                              <Badge variant="outline" className="bg-yellow-100">
                                Belum disimpan
                              </Badge>
                            ) : row.is_assigned ? (
                              <Badge variant="default">Assigned</Badge>
                            ) : (
                              <Badge variant="secondary">Kosong</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <div>
                Pilih <strong>(Belum di-assign)</strong> untuk menghapus assignment
                (guru tidak lagi mengajar mapel ini di kelas tersebut). Baris
                yang berubah ditandai <span className="text-yellow-700">kuning</span>{" "}
                dan harus di-klik <strong>Simpan Perubahan</strong>.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedMapel && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
            Pilih mata pelajaran terlebih dahulu untuk mengelola guru pengampu.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
