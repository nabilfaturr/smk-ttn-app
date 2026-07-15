import { useState, useEffect, useMemo, useCallback } from "react"
import { DataTable, type ColumnDef } from "@/components/tables/DataTable"
import { FormDialog, type FieldConfig } from "@/components/forms/FormDialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { dedupeTahunAjarans, type AcademicYear } from "@/lib/utils/tahun-ajaran"
import { translateDbError } from "@/lib/utils/db-error"
import { useDataInvalidation } from "@/hooks/useDataInvalidation"

type Student = {
  id: number
  nis: string
  nisn: string
  nama: string
  kelas_id: number | null
  status: string
  kelas?: { nama_kelas: string; tahun_ajaran_id: number | null; program_keahlian: string | null } | null
}

type ClassItem = { id: number; nama_kelas: string; tahun_ajaran_id: number | null; program_keahlian: string | null }

export function StudentsPage() {
  const [data, setData] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [activeTa, setActiveTa] = useState<AcademicYear | null>(null)
  const [selectedKelas, setSelectedKelas] = useState<string>("all")
  const [editItem, setEditItem] = useState<Student | null>(null)
  const [deleteItem, setDeleteItem] = useState<Student | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    const [res, c, y] = await Promise.all([
      window.electronAPI.studentGetAll(),
      window.electronAPI.classGetAll(),
      window.electronAPI.academicYearGetAll(),
    ])
    if (Array.isArray(res)) {
      // Enrich siswa dengan data kelas (frontend join, backend tidak return join)
      const kelasById = new Map<number, ClassItem>()
      if (Array.isArray(c)) for (const k of c) kelasById.set(k.id, k)
      const enriched: Student[] = res.map((r: any) => {
        const siswaRow = r.siswa ?? r
        const kelas = siswaRow.kelas_id != null ? kelasById.get(siswaRow.kelas_id) ?? null : null
        return { ...siswaRow, kelas }
      })
      setData(enriched)
    }
    if (Array.isArray(c)) setClasses(c)
    if (Array.isArray(y)) {
      const deduped = dedupeTahunAjarans(y)
      const aktifRaw = y.find((ta) => ta.is_active)
      const aktif = aktifRaw
        ? deduped.find((d) => d.nama === aktifRaw.nama) ?? null
        : null
      setActiveTa(aktif)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Real-time: refetch saat ada perubahan di table siswa/kelas/tahun_ajaran
  const { bumpVersion } = useDataInvalidation(["siswa", "kelas", "tahun_ajaran"])
  useEffect(() => { load() }, [load, bumpVersion])

  // Filter kelas sesuai TA aktif
  const kelasInTa = useMemo(
    () => activeTa ? classes.filter((c) => String(c.tahun_ajaran_id) === String(activeTa.id)) : [],
    [classes, activeTa],
  )

  // Filter siswa: by TA (via kelas) + by kelas
  const filteredData = useMemo(() => {
    if (!activeTa) return data
    return data.filter((s) => {
      // "Tanpa kelas" → tampilkan siswa tanpa kelas_id (orphan)
      if (selectedKelas === "none") {
        return s.kelas_id == null
      }
      // Default: hanya siswa yang punya kelas di TA aktif
      if (s.kelas?.tahun_ajaran_id == null) return false
      if (String(s.kelas.tahun_ajaran_id) !== String(activeTa.id)) return false
      if (selectedKelas !== "all" && String(s.kelas_id) !== selectedKelas) return false
      return true
    })
  }, [data, activeTa, selectedKelas])

  // Hitung jumlah siswa tanpa kelas (orphan) untuk banner
  const orphanCount = useMemo(
    () => data.filter((s) => s.kelas_id == null).length,
    [data],
  )

  // Reset kelas filter kalau kelas yang dipilih tidak ada di TA
  useEffect(() => {
    if (selectedKelas === "none") return
    if (selectedKelas !== "all" && !kelasInTa.some((k) => String(k.id) === selectedKelas)) {
      setSelectedKelas("all")
    }
  }, [activeTa, kelasInTa, selectedKelas])

  const columns: ColumnDef<Student>[] = [
    { key: "nis", header: "NIS" },
    { key: "nama", header: "Nama" },
    {
      key: "kelas",
      header: "Kelas",
      render: (row) => row.kelas?.nama_kelas ?? "—",
    },
    {
      key: "jurusan",
      header: "Jurusan",
      render: (row) => row.kelas?.program_keahlian ?? "—",
    },
    { key: "status", header: "Status" },
  ]

  const fields: FieldConfig[] = [
    { name: "nis", label: "NIS", type: "text", required: true, placeholder: "Nomor Induk Siswa" },
    { name: "nisn", label: "NISN", type: "text", placeholder: "Nomor Induk Siswa Nasional" },
    { name: "nama", label: "Nama", type: "text", required: true, placeholder: "Nama lengkap siswa" },
    {
      name: "kelas_id",
      label: "Kelas",
      type: "select",
      required: true,
      options: [{ value: "", label: "Pilih kelas..." }, ...kelasInTa.map((c) => ({ value: String(c.id), label: c.nama_kelas }))],
    },
    { name: "jenis_kelamin", label: "Jenis Kelamin", type: "select", required: true, options: [{ value: "Laki-Laki", label: "Laki-Laki" }, { value: "Perempuan", label: "Perempuan" }] },
    { name: "tempat_lahir", label: "Tempat Lahir", type: "text" },
    { name: "tanggal_lahir", label: "Tanggal Lahir", type: "date" },
    { name: "agama", label: "Agama", type: "select", options: [{ value: "ISLAM", label: "Islam" }, { value: "KRISTEN PROTESTAN", label: "Kristen Protestan" }, { value: "KATOLIK", label: "Katolik" }, { value: "HINDU", label: "Hindu" }, { value: "BUDDHA", label: "Buddha" }, { value: "KONGHUCU", label: "Konghucu" }] },
    { name: "alamat", label: "Alamat", type: "textarea" },
    { name: "no_hp", label: "No HP", type: "text" },
    { name: "no_hp_ortu", label: "No HP Orang Tua", type: "text" },
    { name: "nama_ayah", label: "Nama Ayah", type: "text" },
    { name: "pekerjaan_ayah", label: "Pekerjaan Ayah", type: "text" },
    { name: "nama_ibu", label: "Nama Ibu", type: "text" },
    { name: "pekerjaan_ibu", label: "Pekerjaan Ibu", type: "text" },
    { name: "nama_wali", label: "Nama Wali", type: "text" },
    { name: "pendidikan_wali", label: "Pendidikan Wali", type: "text" },
    { name: "pekerjaan_wali", label: "Pekerjaan Wali", type: "text" },
    { name: "alamat_wali", label: "Alamat Wali", type: "textarea" },
    { name: "anak_ke", label: "Anak Ke", type: "number" },
    { name: "jlh_sdr_kandung", label: "Jumlah Saudara Kandung", type: "number" },
    { name: "status", label: "Status", type: "select", options: [{ value: "aktif", label: "Aktif" }, { value: "tidak_aktif", label: "Tidak Aktif" }] },
  ]

  async function handleSubmit(values: Record<string, any>) {
    setIsLoading(true)

    // Pre-check NIS duplicate SEBELUM submit (agar error message lebih spesifik)
    if (values.nis && values.nis.trim() !== "") {
      const check = await window.electronAPI.studentCheckNis({
        nis: values.nis.trim(),
        excludeId: editItem?.id,
      })
      if (check && "available" in check && !check.available) {
        setIsLoading(false)
        toast.error(
          `NIS ${values.nis} sudah digunakan oleh siswa "${check.existingNama}". Gunakan NIS yang berbeda.`,
        )
        return
      }
    }

    const payload = {
      ...values,
      kelas_id: values.kelas_id ? Number(values.kelas_id) : null,
      anak_ke: values.anak_ke ? Number(values.anak_ke) : null,
      jlh_sdr_kandung: values.jlh_sdr_kandung ? Number(values.jlh_sdr_kandung) : null,
    }
    const result = editItem
      ? await window.electronAPI.studentUpdate(editItem.id, payload)
      : await window.electronAPI.studentCreate(payload)
    setIsLoading(false)

    // Cek error dari IPC — TETAP buka form agar user bisa perbaiki
    if (result && typeof result === "object" && "error" in result) {
      const friendly = translateDbError(result.error)
      toast.error(friendly)
      // TIDAK close dialog, TIDAK clear editItem → user bisa perbaiki field
      return
    }

    setDialogOpen(false)
    setEditItem(null)
    load()
  }

  async function handleDelete() {
    if (!deleteItem) return
    await window.electronAPI.studentDelete(deleteItem.id)
    setDeleteItem(null)
    load()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Data Siswa</h2>

      <div className="flex flex-wrap items-end gap-4">
        <div className="grid max-w-xs gap-1.5">
          <Label>Tahun Ajaran</Label>
          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
            {activeTa ? `${activeTa.nama} (Aktif)` : "—"}
          </div>
        </div>

        <div className="grid max-w-xs gap-1.5">
          <Label>Kelas</Label>
          <Select value={selectedKelas} onValueChange={setSelectedKelas}>
            <SelectTrigger>
              <SelectValue>
                {selectedKelas === "all"
                  ? "Semua kelas"
                  : selectedKelas === "none"
                    ? "Tanpa kelas"
                    : kelasInTa.find((k) => String(k.id) === selectedKelas)?.nama_kelas ?? "Pilih kelas"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kelas</SelectItem>
              <SelectItem value="none">Tanpa kelas ({orphanCount})</SelectItem>
              {kelasInTa.map((k) => (
                <SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {orphanCount > 0 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            {orphanCount} siswa belum punya kelas
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Siswa tanpa kelas tidak muncul di rapor. Klik tombol di bawah untuk melihat &amp; atur.
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                onClick={() => setSelectedKelas("none")}
              >
                Lihat siswa tanpa kelas
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={filteredData}
        onAdd={() => { setEditItem(null); setDialogOpen(true) }}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true) }}
        onDelete={(row) => setDeleteItem(row)}
        searchPlaceholder="Cari siswa..."
        searchKeys={["nama", "nis"]}
      />
      <FormDialog
        title={editItem ? "Edit Siswa" : "Tambah Siswa"}
        description="Isi data identitas siswa. Field bertanda * wajib diisi."
        fields={fields}
        defaultValues={editItem ? { ...editItem, kelas_id: String(editItem.kelas_id ?? "") } : { status: "aktif" }}
        onSubmit={handleSubmit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoading={isLoading}
      />
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
            <AlertDialogDescription>Yakin ingin menghapus {deleteItem?.nama}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
