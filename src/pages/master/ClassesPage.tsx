import { useState, useEffect, useMemo, useCallback } from "react"
import { DataTable, type ColumnDef } from "@/components/tables/DataTable"
import { FormDialog, type FieldConfig } from "@/components/forms/FormDialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { dedupeTahunAjarans, type AcademicYear } from "@/lib/utils/tahun-ajaran"

type ClassItem = {
  id: number
  nama_kelas: string
  tingkat: number
  program_keahlian: string
  wali_kelas_id: number | null
  wali_kelas_nama: string
  tahun_ajaran_id: number | null
  tahun_ajaran_nama: string
}

type Teacher = { id: number; nama: string }

export function ClassesPage() {
  const [data, setData] = useState<ClassItem[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [activeTa, setActiveTa] = useState<AcademicYear | null>(null)
  const [editItem, setEditItem] = useState<ClassItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<ClassItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    const [res, t, y] = await Promise.all([
      window.electronAPI.classGetAll(),
      window.electronAPI.teacherGetAll(),
      window.electronAPI.academicYearGetAll(),
    ])
    if (Array.isArray(res)) setData(res)
    if (Array.isArray(t)) setTeachers(t)
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

  // Selalu filter ke TA aktif (locked)
  const filteredData = useMemo(() => {
    if (!activeTa) return data
    return data.filter((c) => String(c.tahun_ajaran_id) === String(activeTa.id))
  }, [data, activeTa])

  const columns: ColumnDef<ClassItem>[] = [
    { key: "nama_kelas", header: "Nama Kelas" },
    { key: "tingkat", header: "Tingkat" },
    { key: "program_keahlian", header: "Program Keahlian" },
    { key: "wali_kelas_nama", header: "Wali Kelas" },
    { key: "tahun_ajaran_nama", header: "Tahun Ajaran" },
  ]

  const fields: FieldConfig[] = [
    { name: "nama_kelas", label: "Nama Kelas", type: "text", required: true, placeholder: "Contoh: XII RPL" },
    {
      name: "tingkat", label: "Tingkat", type: "select", required: true,
      options: [
        { value: "10", label: "X (10)" },
        { value: "11", label: "XI (11)" },
        { value: "12", label: "XII (12)" },
      ],
    },
    {
      name: "program_keahlian", label: "Program Keahlian", type: "select",
      options: [
        { value: "RPL", label: "RPL" },
        { value: "TKJ", label: "TKJ" },
        { value: "Penerbangan", label: "Penerbangan" },
        { value: "Ketarunaan", label: "Ketarunaan" },
      ],
    },
    {
      name: "wali_kelas_id", label: "Wali Kelas", type: "select",
      options: teachers.map((t) => ({ value: String(t.id), label: t.nama })),
    },
  ]

  async function handleSubmit(values: Record<string, any>) {
    setIsLoading(true)
    const payload: Record<string, any> = {
      ...values,
      tingkat: Number(values.tingkat),
      wali_kelas_id: values.wali_kelas_id || null,
    }
    // Auto-set TA ke active untuk create. Edit: pertahankan TA original.
    if (editItem) {
      payload.tahun_ajaran_id = editItem.tahun_ajaran_id
    } else {
      if (!activeTa) {
        toast.error("Tidak ada tahun ajaran aktif. Hubungi admin.")
        setIsLoading(false)
        return
      }
      payload.tahun_ajaran_id = activeTa.id
    }
    if (editItem) {
      await window.electronAPI.classUpdate(editItem.id, payload)
    } else {
      await window.electronAPI.classCreate(payload)
    }
    setIsLoading(false)
    setDialogOpen(false)
    setEditItem(null)
    load()
  }

  async function handleDelete() {
    if (!deleteItem) return
    await window.electronAPI.classDelete(deleteItem.id)
    setDeleteItem(null)
    load()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Data Kelas</h2>

      <div className="grid max-w-xs gap-1.5">
        <Label>Tahun Ajaran</Label>
        <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
          {activeTa ? `${activeTa.nama} (Aktif)` : "—"}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        onAdd={() => { setEditItem(null); setDialogOpen(true) }}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true) }}
        onDelete={(row) => setDeleteItem(row)}
        searchPlaceholder="Cari kelas..."
        searchKeys={["nama_kelas"]}
      />
      <FormDialog
        title={editItem ? "Edit Kelas" : "Tambah Kelas"}
        fields={fields}
        defaultValues={editItem
          ? { ...editItem, tingkat: String(editItem.tingkat), wali_kelas_id: String(editItem.wali_kelas_id ?? "") }
          : undefined}
        onSubmit={handleSubmit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoading={isLoading}
      />
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
            <AlertDialogDescription>Yakin ingin menghapus {deleteItem?.nama_kelas}?</AlertDialogDescription>
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
