import { useState, useEffect, useCallback } from "react"
import { DataTable, type ColumnDef } from "@/components/tables/DataTable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type SiswaPrakerin = {
  siswa_id: number; nama: string; tpl: number | null; sl: number | null; sk: number | null
  nilai_rapor: number | null; tp1_skor: number | null; tp1_deskripsi: string
  tp2_skor: number | null; tp2_deskripsi: string
  pembimbing_sekolah: string; pembimbing_instansi: string; tempat_prakerin: string
  tgl_mulai: string; tgl_selesai: string; catatan: string
  sakit: number; izin: number; tanpa_keterangan: number
}

export function PrakerinPage() {
  const [kelasList, setKelasList] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState("")
  const [siswa, setSiswa] = useState<SiswaPrakerin[]>([])
  const [tahunAjaran, setTahunAjaran] = useState(0)
  const [loading, setLoading] = useState(false)

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
    if (!selectedKelas || !tahunAjaran) return
    const sRes = await window.electronAPI.studentGetAll()
    if (!Array.isArray(sRes)) return
    const filtered = sRes.map((r: any) => r.siswa ?? r).filter((s: any) => String(s.kelas_id) === selectedKelas && s.status === "aktif")
    const rows: SiswaPrakerin[] = []
    for (const s of filtered) {
      const res = await window.electronAPI.gradeGetPrakerin(s.id, tahunAjaran)
      rows.push({
        siswa_id: s.id, nama: s.nama,
        tpl: res?.nilai?.tpl ?? null, sl: res?.nilai?.sl ?? null, sk: res?.nilai?.sk ?? null,
        nilai_rapor: res?.nilai?.nilai_rapor ?? null,
        tp1_skor: res?.nilai?.tp1_skor ?? null, tp1_deskripsi: res?.nilai?.tp1_deskripsi ?? "",
        tp2_skor: res?.nilai?.tp2_skor ?? null, tp2_deskripsi: res?.nilai?.tp2_deskripsi ?? "",
        pembimbing_sekolah: res?.nilai?.pembimbing_sekolah ?? "",
        pembimbing_instansi: res?.nilai?.pembimbing_instansi ?? "",
        tempat_prakerin: res?.nilai?.tempat_prakerin ?? "",
        tgl_mulai: res?.nilai?.tgl_mulai ?? "", tgl_selesai: res?.nilai?.tgl_selesai ?? "",
        catatan: res?.nilai?.catatan ?? "",
        sakit: res?.absensi?.sakit ?? 0, izin: res?.absensi?.izin ?? 0,
        tanpa_keterangan: res?.absensi?.tanpa_keterangan ?? 0,
      })
    }
    setSiswa(rows)
  }, [selectedKelas, tahunAjaran])

  useEffect(() => { loadSiswa() }, [loadSiswa])

  function update(siswaId: number, field: string, value: any) {
    setSiswa((prev) =>
      prev.map((s) => {
        if (s.siswa_id !== siswaId) return s
        const updated = { ...s, [field]: value }
        if (["tpl", "sl", "sk"].includes(field)) {
          const tpl = field === "tpl" ? Number(value) : s.tpl
          const sl = field === "sl" ? Number(value) : s.sl
          const sk = field === "sk" ? Number(value) : s.sk
          if (tpl != null && sl != null && sk != null && !isNaN(tpl) && !isNaN(sl) && !isNaN(sk)) {
            updated.nilai_rapor = Math.round(((tpl + sl + sk) / 3) * 100) / 100
          }
        }
        return updated
      }),
    )
  }

  async function handleSave() {
    setLoading(true)
    for (const s of siswa) {
      await window.electronAPI.gradeSavePrakerin({
        siswaId: s.siswa_id, tahunAjaranId: tahunAjaran,
        tpl: s.tpl, sl: s.sl, sk: s.sk,
        tp1_skor: s.tp1_skor, tp1_deskripsi: s.tp1_deskripsi,
        tp2_skor: s.tp2_skor, tp2_deskripsi: s.tp2_deskripsi,
        pembimbing_sekolah: s.pembimbing_sekolah,
        pembimbing_instansi: s.pembimbing_instansi, tempat_prakerin: s.tempat_prakerin,
        tgl_mulai: s.tgl_mulai, tgl_selesai: s.tgl_selesai, catatan: s.catatan,
        absensi: { sakit: s.sakit, izin: s.izin, tanpa_keterangan: s.tanpa_keterangan },
      })
    }
    setLoading(false)
    toast.success("Data prakerin berhasil disimpan")
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Nilai Prakerin (PKL)</h2>

      <div className="max-w-xs">
        <Label>Kelas</Label>
        <Select value={selectedKelas} onValueChange={setSelectedKelas}>
          <SelectTrigger>
            <SelectValue>
              {kelasList.find((k) => String(k.id) === selectedKelas)?.nama_kelas ?? "Pilih kelas"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {kelasList.map((k) => <SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {siswa.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-1">Nama</th><th className="p-1">TPL</th><th className="p-1">SL</th><th className="p-1">SK</th>
                <th className="p-1">Rapor</th><th className="p-1">TP1 Skor</th><th className="p-1">TP1 Desk</th>
                <th className="p-1">TP2 Skor</th><th className="p-1">TP2 Desk</th><th className="p-1">Pemb Sek</th>
                <th className="p-1">Pemb Inst</th><th className="p-1">Tempat</th><th className="p-1">Mulai</th><th className="p-1">Selesai</th>
                <th className="p-1">Sakit</th><th className="p-1">Izin</th><th className="p-1">TK</th>
              </tr>
            </thead>
            <tbody>
              {siswa.map((s) => (
                <tr key={s.siswa_id} className="border-b">
                  <td className="p-1 font-medium whitespace-nowrap">{s.nama}</td>
                  <td className="p-1"><Input type="number" className="w-14 h-7" value={s.tpl ?? ""} onChange={(e) => update(s.siswa_id, "tpl", e.target.value ? Number(e.target.value) : null)} /></td>
                  <td className="p-1"><Input type="number" className="w-14 h-7" value={s.sl ?? ""} onChange={(e) => update(s.siswa_id, "sl", e.target.value ? Number(e.target.value) : null)} /></td>
                  <td className="p-1"><Input type="number" className="w-14 h-7" value={s.sk ?? ""} onChange={(e) => update(s.siswa_id, "sk", e.target.value ? Number(e.target.value) : null)} /></td>
                  <td className="p-1 font-semibold">{s.nilai_rapor?.toFixed(2) ?? "-"}</td>
                  <td className="p-1"><Input type="number" className="w-14 h-7" value={s.tp1_skor ?? ""} onChange={(e) => update(s.siswa_id, "tp1_skor", e.target.value ? Number(e.target.value) : null)} /></td>
                  <td className="p-1"><Input className="w-24 h-7" value={s.tp1_deskripsi} onChange={(e) => update(s.siswa_id, "tp1_deskripsi", e.target.value)} /></td>
                  <td className="p-1"><Input type="number" className="w-14 h-7" value={s.tp2_skor ?? ""} onChange={(e) => update(s.siswa_id, "tp2_skor", e.target.value ? Number(e.target.value) : null)} /></td>
                  <td className="p-1"><Input className="w-24 h-7" value={s.tp2_deskripsi} onChange={(e) => update(s.siswa_id, "tp2_deskripsi", e.target.value)} /></td>
                  <td className="p-1"><Input className="w-24 h-7" value={s.pembimbing_sekolah} onChange={(e) => update(s.siswa_id, "pembimbing_sekolah", e.target.value)} /></td>
                  <td className="p-1"><Input className="w-24 h-7" value={s.pembimbing_instansi} onChange={(e) => update(s.siswa_id, "pembimbing_instansi", e.target.value)} /></td>
                  <td className="p-1"><Input className="w-24 h-7" value={s.tempat_prakerin} onChange={(e) => update(s.siswa_id, "tempat_prakerin", e.target.value)} /></td>
                  <td className="p-1"><Input type="date" className="w-28 h-7" value={s.tgl_mulai} onChange={(e) => update(s.siswa_id, "tgl_mulai", e.target.value)} /></td>
                  <td className="p-1"><Input type="date" className="w-28 h-7" value={s.tgl_selesai} onChange={(e) => update(s.siswa_id, "tgl_selesai", e.target.value)} /></td>
                  <td className="p-1"><Input type="number" className="w-14 h-7" value={s.sakit} onChange={(e) => update(s.siswa_id, "sakit", Number(e.target.value))} /></td>
                  <td className="p-1"><Input type="number" className="w-14 h-7" value={s.izin} onChange={(e) => update(s.siswa_id, "izin", Number(e.target.value))} /></td>
                  <td className="p-1"><Input type="number" className="w-14 h-7" value={s.tanpa_keterangan} onChange={(e) => update(s.siswa_id, "tanpa_keterangan", Number(e.target.value))} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {siswa.length > 0 && <Button onClick={handleSave} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>}
    </div>
  )
}
