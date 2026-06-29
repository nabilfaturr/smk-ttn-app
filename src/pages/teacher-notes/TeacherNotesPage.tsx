import { useState, useEffect, useCallback } from "react"
import { useAuthStore } from "@/stores/authStore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function TeacherNotesPage() {
  const { user } = useAuthStore()
  const [kelasList, setKelasList] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState("")
  const [siswa, setSiswa] = useState<any[]>([])
  const [selectedSiswa, setSelectedSiswa] = useState<number | null>(null)
  const [catatan, setCatatan] = useState("")
  const [tahunAjaran, setTahunAjaran] = useState(0)

  const load = useCallback(async () => {
    const [k, t] = await Promise.all([window.electronAPI.classGetAll(), window.electronAPI.academicYearGetAll()])
    if (Array.isArray(k)) {
      if (user?.roles?.includes("wali_kelas") && user.kelas_id) {
        setSelectedKelas(String(user.kelas_id))
        setKelasList(k.filter((c: any) => c.id === user.kelas_id))
      } else {
        setKelasList(k)
      }
    }
    if (Array.isArray(t)) { const aktif = t.find((y: any) => y.is_active); if (aktif) setTahunAjaran(aktif.id) }
  }, [user])

  useEffect(() => { load() }, [load])

  const loadSiswa = useCallback(async () => {
    if (!selectedKelas) return
    const res = await window.electronAPI.studentGetAll()
    if (!Array.isArray(res)) return
    setSiswa(res.map((r: any) => r.siswa ?? r).filter((s: any) => String(s.kelas_id) === selectedKelas && s.status === "aktif"))
  }, [selectedKelas])

  useEffect(() => { loadSiswa() }, [loadSiswa])

  const loadCatatan = useCallback(async () => {
    if (!selectedSiswa || !tahunAjaran) return
    const res = await window.electronAPI.teacherNoteGetBySiswa(selectedSiswa, tahunAjaran)
    setCatatan(res?.catatan ?? "")
  }, [selectedSiswa, tahunAjaran])

  useEffect(() => { loadCatatan() }, [loadCatatan])

  async function handleSave() {
    if (!selectedSiswa) return
    await window.electronAPI.teacherNoteSave({ siswaId: selectedSiswa, tahunAjaranId: tahunAjaran, catatan })
    toast.success("Catatan disimpan")
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Catatan Wali Kelas</h2>

      <div className="flex gap-4">
        <div className="grid gap-1.5 max-w-xs">
          <Label>Kelas</Label>
          <Select value={selectedKelas} onValueChange={(v) => { setSelectedKelas(v); setSelectedSiswa(null) }}>
            <SelectTrigger>
              <SelectValue>
                {kelasList.find((k) => String(k.id) === selectedKelas)?.nama_kelas ?? "Pilih kelas"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>{kelasList.map((k) => <SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {siswa.length > 0 && (
          <div className="grid gap-1.5 max-w-xs">
            <Label>Siswa</Label>
            <Select value={String(selectedSiswa ?? "")} onValueChange={(v) => setSelectedSiswa(Number(v))}>
              <SelectTrigger>
                <SelectValue>
                  {siswa.find((s) => String(s.id) === String(selectedSiswa ?? ""))?.nama ?? "Pilih siswa"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>{siswa.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedSiswa && (
        <div className="space-y-4 max-w-xl">
          <div className="grid gap-1.5">
            <Label>Catatan untuk rapor</Label>
            <Textarea
              rows={5}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis catatan wali kelas untuk siswa ini..."
            />
          </div>
          <Button onClick={handleSave}>Simpan Catatan</Button>
        </div>
      )}
    </div>
  )
}
