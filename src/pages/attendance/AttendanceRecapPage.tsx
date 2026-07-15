import { useState, useEffect, useCallback } from "react"
import { DataTable, type ColumnDef } from "@/components/tables/DataTable"
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
import { useAuthStore } from "@/stores/authStore"
import { TahunAjaranInfo } from "@/components/common/TahunAjaranInfo"

type RecapRow = {
  siswa_id: number
  nama: string
  total_hadir: number
  total_dl: number
  total_s: number
  total_i: number
  total_tk: number
}

export function AttendanceRecapPage() {
  const { user } = useAuthStore()
  const [kelasList, setKelasList] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState<string>("")
  const [tglMulai, setTglMulai] = useState("")
  const [tglSelesai, setTglSelesai] = useState("")
  const [data, setData] = useState<RecapRow[]>([])

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

  useEffect(() => { loadKelas() }, [loadKelas])

  async function handleCari() {
    if (!selectedKelas || !tglMulai || !tglSelesai) return
    const [recap, siswaRes] = await Promise.all([
      window.electronAPI.attendanceGetRecap(selectedKelas, tglMulai, tglSelesai),
      window.electronAPI.studentGetAll(),
    ])
    if (!Array.isArray(recap) || !Array.isArray(siswaRes)) return
    const siswaMap: Record<number, string> = {}
    for (const r of siswaRes) {
      const s = r.siswa ?? r
      siswaMap[s.id] = s.nama
    }
    setData(
      recap.map((r: any) => ({
        siswa_id: r.siswa_id,
        nama: siswaMap[r.siswa_id] ?? "-",
        total_hadir: Number(r.total_hadir),
        total_dl: Number(r.total_dl),
        total_s: Number(r.total_s),
        total_i: Number(r.total_i),
        total_tk: Number(r.total_tk),
      })),
    )
  }

  const columns: ColumnDef<RecapRow>[] = [
    { key: "nama", header: "Nama" },
    { key: "total_hadir", header: "Hadir" },
    { key: "total_dl", header: "Dinas Luar" },
    { key: "total_s", header: "Sakit" },
    { key: "total_i", header: "Izin" },
    { key: "total_tk", header: "Tanpa Ket." },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Rekap Absensi</h2>

      <TahunAjaranInfo />

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
          <Label>Tanggal Mulai</Label>
          <Input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} className="w-44" />
        </div>

        <div className="grid gap-1.5">
          <Label>Tanggal Selesai</Label>
          <Input type="date" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)} className="w-44" />
        </div>

        <Button onClick={handleCari}>Cari</Button>
      </div>

      {data.length > 0 && <DataTable columns={columns} data={data} pageSize={1000} />}
    </div>
  )
}
