import { useState, useEffect, useCallback } from "react"
import { useAuthStore } from "@/stores/authStore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { TahunAjaranInfo } from "@/components/common/TahunAjaranInfo"

type Subject = { id: number; kode_mapel: string; nama_mapel: string }
type TP = { id: number; kode_tp: string }
type GradeRow = {
  siswa_id: number
  nama: string
  nilai_formatif: number | null
  nilai_sumatif: number | null
  nilai_rapor: number | null
  deskripsi: string
  tp_capaian: { tp_id: number; kode_tp: string; capaian: string }[]
}

export function GradeInputPage() {
  const { user } = useAuthStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedMapel, setSelectedMapel] = useState("")
  const [kelasList, setKelasList] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState("")
  const [tpList, setTpList] = useState<TP[]>([])
  const [rows, setRows] = useState<GradeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [tahunAjaran, setTahunAjaran] = useState<number>(0)
  const [myKelasIds, setMyKelasIds] = useState<Set<number>>(new Set())

  const loadInit = useCallback(async () => {
    const [subRes, kelasRes, tahunRes] = await Promise.all([
      window.electronAPI.subjectGetAll(),
      window.electronAPI.classGetAll(),
      window.electronAPI.academicYearGetAll(),
    ])
    let activeTaId = 0
    if (Array.isArray(tahunRes)) {
      const aktif = tahunRes.find((t: any) => t.is_active)
      if (aktif) {
        activeTaId = aktif.id
        setTahunAjaran(aktif.id)
      }
    }
    // Filter mapel via junction mapel_kelas_guru untuk role guru
    if (Array.isArray(subRes) && user?.roles?.includes("guru") && user.guru_id && activeTaId) {
      const assignments = await window.electronAPI.mapelAssignmentGetByGuru(
        user.guru_id,
        activeTaId,
      )
      const taughtMapelIds = new Set(
        Array.isArray(assignments) ? assignments.map((a: any) => a.mapel_id) : [],
      )
      setSubjects(subRes.filter((s: any) => taughtMapelIds.has(s.id)))
    } else if (Array.isArray(subRes)) {
      setSubjects(subRes)
    }
    if (Array.isArray(kelasRes)) setKelasList(kelasRes)
  }, [user])

  useEffect(() => { loadInit() }, [loadInit])

  useEffect(() => {
    if (!selectedMapel) return
    window.electronAPI
      .tpGetByMapel(selectedMapel, tahunAjaran || undefined)
      .then((res) => {
        if (Array.isArray(res)) setTpList(res)
      })
  }, [selectedMapel, tahunAjaran])

  // Filter kelas: untuk guru, hanya tampilkan kelas yang diajar untuk mapel ini
  useEffect(() => {
    async function loadKelasForMapel() {
      if (!selectedMapel || !tahunAjaran || !user?.guru_id) {
        setMyKelasIds(new Set())
        return
      }
      const assignments = await window.electronAPI.mapelAssignmentGetByGuru(
        user.guru_id,
        tahunAjaran,
      )
      if (Array.isArray(assignments)) {
        const ids = new Set(
          (assignments as any[])
            .filter((a) => a.mapel_id === selectedMapel)
            .map((a) => a.kelas_id),
        )
        setMyKelasIds(ids)
      }
    }
    if (user?.roles?.includes("guru")) {
      loadKelasForMapel()
    } else {
      setMyKelasIds(new Set()) // admin: no filter
    }
    setSelectedKelas("") // reset kelas selection
  }, [selectedMapel, tahunAjaran, user])

  const loadGrade = useCallback(async () => {
    if (!selectedMapel || !selectedKelas || !tahunAjaran) return
    const res = await window.electronAPI.gradeGetByMapelAndClass(selectedMapel, selectedKelas, tahunAjaran)
    if (Array.isArray(res)) setRows(res)
  }, [selectedMapel, selectedKelas, tahunAjaran])

  useEffect(() => { loadGrade() }, [loadGrade])

  function updateNilai(siswaId: number, field: "nilai_formatif" | "nilai_sumatif", value: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.siswa_id !== siswaId) return r
        const updated = { ...r, [field]: value ? Number(value) : null }
        const formatif = field === "nilai_formatif" ? (value ? Number(value) : null) : r.nilai_formatif
        const sumatif = field === "nilai_sumatif" ? (value ? Number(value) : null) : r.nilai_sumatif
        if (formatif != null && sumatif != null) {
          updated.nilai_rapor = Math.round((formatif * 0.4 + sumatif * 0.6) * 100) / 100
        } else {
          updated.nilai_rapor = null
        }
        return updated
      }),
    )
  }

  function updateCapaian(siswaId: number, tpId: number, value: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.siswa_id !== siswaId) return r
        // Cari entry existing; kalau tidak ada, tambahkan baru
        const existingIdx = r.tp_capaian.findIndex((tc) => tc.tp_id === tpId)
        const tpInfo = tpList.find((t) => t.id === tpId)
        let tpCapaian: typeof r.tp_capaian
        if (existingIdx >= 0) {
          // Update existing
          tpCapaian = r.tp_capaian.map((tc, i) =>
            i === existingIdx ? { ...tc, capaian: value } : tc,
          )
        } else {
          // Tambah entry baru dengan kode_tp yang benar
          tpCapaian = [
            ...r.tp_capaian,
            { tp_id: tpId, kode_tp: tpInfo?.kode_tp ?? "", capaian: value },
          ]
        }
        return { ...r, tp_capaian: tpCapaian }
      }),
    )
  }

  async function handleSave() {
    for (const r of rows) {
      if (r.nilai_formatif != null && (r.nilai_formatif < 0 || r.nilai_formatif > 100)) {
        toast.error(`Nilai formatif ${r.nama} harus antara 0 dan 100`)
        return
      }
      if (r.nilai_sumatif != null && (r.nilai_sumatif < 0 || r.nilai_sumatif > 100)) {
        toast.error(`Nilai sumatif ${r.nama} harus antara 0 dan 100`)
        return
      }
    }

    setLoading(true)
    for (const r of rows) {
      await window.electronAPI.gradeSave({
        siswaId: r.siswa_id,
        mapelId: selectedMapel,
        tahunAjaranId: tahunAjaran,
        nilaiFormatif: r.nilai_formatif,
        nilaiSumatif: r.nilai_sumatif,
        tpCapaian: r.tp_capaian.filter((tc) => tc.capaian).map((tc) => ({ tp_id: tc.tp_id, capaian: tc.capaian })),
      })
    }
    setLoading(false)
    toast.success("Nilai berhasil disimpan")
    loadGrade()
  }

  const mapel = subjects.find((s) => s.id === selectedMapel)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Input Nilai</h2>

      <TahunAjaranInfo />

      <div className="flex flex-wrap gap-4">
        <div className="grid gap-1.5">
          <Label>Mata Pelajaran</Label>
          <Select value={selectedMapel} onValueChange={setSelectedMapel}>
            <SelectTrigger className="w-64">
              <SelectValue>
                {subjects.find((s) => String(s.id) === selectedMapel)?.nama_mapel ?? "Pilih mapel"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.nama_mapel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Kelas</Label>
          <Select value={selectedKelas} onValueChange={setSelectedKelas}>
            <SelectTrigger className="w-48">
              <SelectValue>
                {kelasList.find((k) => String(k.id) === selectedKelas)?.nama_kelas ?? "Pilih kelas"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {kelasList
                .filter((k) => {
                  // Untuk role guru, hanya kelas yang diajar untuk mapel ini
                  if (user?.roles?.includes("guru") && myKelasIds.size > 0) {
                    return myKelasIds.has(k.id)
                  }
                  return true
                })
                .map((k) => (
                  <SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">No</th>
                <th className="p-2 text-left">Nama</th>
                <th className="p-2 text-left">Formatif</th>
                <th className="p-2 text-left">Sumatif</th>
                <th className="p-2 text-left">Rapor</th>
                {tpList.map((tp) => (
                  <th key={tp.id} className="p-2 text-center">{tp.kode_tp}</th>
                ))}
                <th className="p-2 text-left">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.siswa_id} className="border-b last:border-0">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2 font-medium">{r.nama}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      data-invalid={r.nilai_formatif != null && (r.nilai_formatif < 0 || r.nilai_formatif > 100)}
                      className="w-20 h-8"
                      value={r.nilai_formatif ?? ""}
                      onChange={(e) => updateNilai(r.siswa_id, "nilai_formatif", e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      data-invalid={r.nilai_sumatif != null && (r.nilai_sumatif < 0 || r.nilai_sumatif > 100)}
                      className="w-20 h-8"
                      value={r.nilai_sumatif ?? ""}
                      onChange={(e) => updateNilai(r.siswa_id, "nilai_sumatif", e.target.value)}
                    />
                  </td>
                  <td className="p-2 font-semibold">{r.nilai_rapor ?? "-"}</td>
                  {tpList.map((tp) => {
                    const capaian = r.tp_capaian.find((tc) => tc.tp_id === tp.id)
                    const current = capaian?.capaian ?? ""
                    return (
                      <td key={tp.id} className="p-2 text-center">
                        {/* Button group: lebih clickable & reliable dari Select dropdown
                            di tabel yang rapat. Klik T/R untuk set, klik lagi untuk clear. */}
                        <div className="inline-flex gap-0.5 rounded border bg-muted/20 p-0.5">
                          <button
                            type="button"
                            data-testid={`tp-t-${r.siswa_id}-${tp.id}`}
                            className={
                              "h-7 w-7 rounded text-xs font-semibold transition-colors " +
                              (current === "T"
                                ? "bg-green-600 text-white shadow"
                                : "bg-transparent text-muted-foreground hover:bg-green-100 hover:text-green-700")
                            }
                            onClick={() => {
                              updateCapaian(r.siswa_id, tp.id, current === "T" ? "" : "T")
                            }}
                            title={current === "T" ? "Tuntas (klik untuk clear)" : "Set Tuntas"}
                          >
                            T
                          </button>
                          <button
                            type="button"
                            data-testid={`tp-r-${r.siswa_id}-${tp.id}`}
                            className={
                              "h-7 w-7 rounded text-xs font-semibold transition-colors " +
                              (current === "R"
                                ? "bg-red-600 text-white shadow"
                                : "bg-transparent text-muted-foreground hover:bg-red-100 hover:text-red-700")
                            }
                            onClick={() => {
                              updateCapaian(r.siswa_id, tp.id, current === "R" ? "" : "R")
                            }}
                            title={current === "R" ? "Remediasi (klik untuk clear)" : "Set Remediasi"}
                          >
                            R
                          </button>
                        </div>
                      </td>
                    )
                  })}
                  <td className="max-w-xs truncate p-2 text-xs text-muted-foreground">{r.deskripsi || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Semua Nilai"}
        </Button>
      )}
    </div>
  )
}
