import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuthStore } from "@/stores/authStore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useSafeSelected } from "@/hooks/useSafeSelected"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"

const STATUSES = ["H", "DL", "S", "I", "TK"] as const
type Status = (typeof STATUSES)[number]
const STATUS_LABELS: Record<Status, string> = { H: "Hadir", DL: "Dinas Luar", S: "Sakit", I: "Izin", TK: "Alpa" }
const STATUS_COLORS: Record<Status, string> = {
  H: "bg-green-100 text-green-800 border-green-300",
  DL: "bg-blue-100 text-blue-800 border-blue-300",
  S: "bg-yellow-100 text-yellow-800 border-yellow-300",
  I: "bg-purple-100 text-purple-800 border-purple-300",
  TK: "bg-red-100 text-red-800 border-red-300",
}

type SiswaItem = { id: number; nama: string }

export function AttendanceInputPage() {
  const { user } = useAuthStore()
  const [kelasList, setKelasList] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState<string>("")
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split("T")[0])
  const [jam, setJam] = useState("1")
  const [siswa, setSiswa] = useState<SiswaItem[]>([])
  const [statuses, setStatuses] = useState<Record<number, Status>>({})
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const loadKelas = useCallback(async () => {
    const res = await window.electronAPI.classGetAll()
    if (!Array.isArray(res)) return
    if (user?.roles?.includes("wali_kelas") && user.kelas_id) {
      setSelectedKelas(String(user.kelas_id))
      setKelasList(res.filter((k: any) => k.id === user.kelas_id))
    } else {
      setKelasList(res)
    }
  }, [user])

  const loadSiswa = useCallback(async () => {
    if (!selectedKelas) return
    const res = await window.electronAPI.studentGetAll()
    if (!Array.isArray(res)) return
    const filtered = res
      .map((r: any) => r.siswa ?? r)
      .filter((s: any) => String(s.kelas_id) === selectedKelas && s.status === "aktif")
    setSiswa(filtered)

    const existing = await window.electronAPI.attendanceGetByClassAndDate(
      selectedKelas,
      tanggal,
      Number(jam),
    )
    if (Array.isArray(existing) && existing.length > 0) {
      const map: Record<number, Status> = {}
      for (const e of existing) {
        map[e.siswa_id] = e.status as Status
      }
      setStatuses(map)
    } else {
      const defaults: Record<number, Status> = {}
      for (const s of filtered) defaults[s.id] = "H"
      setStatuses(defaults)
    }
  }, [selectedKelas, tanggal, jam])

  useEffect(() => { loadKelas() }, [loadKelas])
  useSafeSelected(kelasList, selectedKelas, setSelectedKelas)
  useEffect(() => { loadSiswa() }, [loadSiswa])

  const sortedFiltered = useMemo(() => {
    let result = [...siswa]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((s) => s.nama.toLowerCase().includes(q))
    }
    result.sort((a, b) => {
      const cmp = a.nama.localeCompare(b.nama)
      return sortDir === "asc" ? cmp : -cmp
    })
    return result
  }, [siswa, search, sortDir])

  async function handleSave() {
    setLoading(true)
    const data = siswa.map((s) => ({
      siswaId: s.id,
      kelasId: selectedKelas,
      tanggal,
      jamPelajaran: Number(jam),
      status: statuses[s.id] ?? "H",
    }))
    const result = await window.electronAPI.attendanceSave(data)
    if (result.success) {
      toast.success("Absensi berhasil disimpan")
    } else {
      toast.error(result.error ?? "Gagal menyimpan")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Input Absensi Harian</h2>

      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-1.5">
          <Label>Kelas</Label>
          <Select value={selectedKelas} onValueChange={setSelectedKelas}>
            <SelectTrigger className="w-48">
              <SelectValue>
                {kelasList.find((k) => String(k.id) === selectedKelas)?.nama_kelas ?? "Pilih kelas"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {kelasList.map((k) => (
                <SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Tanggal</Label>
          <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-44" />
        </div>

        <div className="grid gap-1.5">
          <Label>Jam Pelajaran</Label>
          <Select value={jam} onValueChange={setJam}>
            <SelectTrigger className="w-32">
              <SelectValue>Jam ke-{jam}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                <SelectItem key={j} value={String(j)}>Jam ke-{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedKelas && siswa.length > 0 && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm" style={{ tableLayout: "auto" }}>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-10 px-2 py-3 text-center text-xs font-semibold uppercase">No</th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase whitespace-nowrap">
                    <button
                      onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Nama Siswa
                      {sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    </button>
                  </th>
                  {STATUSES.map((s) => (
                    <th
                      key={s}
                      title={STATUS_LABELS[s]}
                      className={`px-1 py-3 text-center text-xs font-semibold uppercase border-l ${STATUS_COLORS[s]}`}
                    >
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map((s, i) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-2 py-3 text-center text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-2 py-3 font-medium text-sm whitespace-nowrap">{s.nama}</td>
                    {STATUSES.map((st) => {
                      const isActive = statuses[s.id] === st
                      return (
                        <td
                          key={st}
                          className={`px-1 py-3 text-center border-l cursor-pointer transition-colors ${
                            isActive ? STATUS_COLORS[st] : "hover:bg-muted/50"
                          }`}
                          onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: st }))}
                        >
                          <input
                            type="radio"
                            name={`siswa-${s.id}`}
                            value={st}
                            checked={isActive}
                            onChange={() => setStatuses((prev) => ({ ...prev, [s.id]: st }))}
                            className="h-4 w-4 cursor-pointer accent-current"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="font-medium">Keterangan:</span>
            {STATUSES.map((s) => (
              <span key={s} className="inline-flex items-center gap-1">
                <span className={`inline-block w-5 h-5 rounded text-[10px] font-bold leading-5 text-center border ${STATUS_COLORS[s]}`}>
                  {s}
                </span>
                <span>{STATUS_LABELS[s]}</span>
              </span>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Menampilkan {sortedFiltered.length} dari {siswa.length} siswa
            {search && ` (filter: "${search}")`}
          </p>
        </div>
      )}

      {selectedKelas && siswa.length === 0 && (
        <p className="text-sm text-muted-foreground">Tidak ada siswa di kelas ini.</p>
      )}

      {selectedKelas && siswa.length > 0 && (
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Absensi"}
        </Button>
      )}
    </div>
  )
}
