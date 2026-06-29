import { useState, useEffect, useCallback } from "react"
import { DataTable, type ColumnDef } from "@/components/tables/DataTable"
import { FormDialog, type FieldConfig } from "@/components/forms/FormDialog"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type Subject = {
  id: number
  kode_mapel: string
  nama_mapel: string
  jenis: string
  kelompok: string | null
  agama_target: string | null
}

export function SubjectsPage() {
  const [data, setData] = useState<Subject[]>([])
  const [editItem, setEditItem] = useState<Subject | null>(null)
  const [deleteItem, setDeleteItem] = useState<Subject | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await window.electronAPI.subjectGetAll()
    if (Array.isArray(res)) setData(res)
  }, [])

  useEffect(() => { load() }, [load])

  const columns: ColumnDef<Subject>[] = [
    { key: "kode_mapel", header: "Kode" },
    { key: "nama_mapel", header: "Nama" },
    {
      key: "jenis", header: "Jenis",
      render: (row) => <Badge variant="outline">{row.jenis}</Badge>,
    },
    { key: "kelompok", header: "Kelompok" },
  ]

  const fields: FieldConfig[] = [
    { name: "kode_mapel", label: "Kode Mapel", type: "text", required: true, placeholder: "Contoh: BIND" },
    { name: "nama_mapel", label: "Nama Mapel", type: "text", required: true, placeholder: "Nama lengkap mapel" },
    // Catatan: "Guru Pengampu" dipindah ke halaman "Kelola Guru Pengampu"
    // (Step 4) karena 1 mapel bisa diajar guru berbeda per kelas.
    {
      name: "jenis", label: "Jenis", type: "select", required: true,
      options: [
        { value: "reguler", label: "Reguler" },
        { value: "prakerin", label: "Prakerin" },
        { value: "ketarunaan", label: "Ketarunaan" },
        { value: "kokurikuler", label: "Kokurikuler" },
      ],
    },
    {
      name: "kelompok", label: "Kelompok", type: "select",
      options: [
        { value: "", label: "Pilih..." },
        { value: "umum", label: "Umum" },
        { value: "kejuruan", label: "Kejuruan" },
        { value: "muatan_lokal", label: "Muatan Lokal" },
        { value: "khusus", label: "Khusus" },
      ],
    },
    {
      name: "agama_target", label: "Agama Target", type: "select",
      options: [
        { value: "", label: "Semua Agama" },
        { value: "ISLAM", label: "Islam" },
        { value: "KRISTEN PROTESTAN", label: "Kristen Protestan" },
      ],
    },
  ]

  async function handleSubmit(values: Record<string, any>) {
    setIsLoading(true)
    const payload = {
      ...values,
      // guru_id di-deprecated (pakai junction). Selalu null saat create/update mapel.
      guru_id: null,
      kelompok: values.kelompok || null,
      agama_target: values.agama_target || null,
    }
    if (editItem) {
      await window.electronAPI.subjectUpdate(editItem.id, payload)
    } else {
      await window.electronAPI.subjectCreate(payload)
    }
    setIsLoading(false)
    setDialogOpen(false)
    setEditItem(null)
    load()
  }

  async function handleDelete() {
    if (!deleteItem) return
    await window.electronAPI.subjectDelete(deleteItem.id)
    setDeleteItem(null)
    load()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Data Mata Pelajaran</h2>
      <DataTable
        columns={columns}
        data={data}
        onAdd={() => { setEditItem(null); setDialogOpen(true) }}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true) }}
        onDelete={(row) => setDeleteItem(row)}
        searchPlaceholder="Cari mapel..."
        searchKeys={["kode_mapel", "nama_mapel"]}
      />
      <FormDialog
        title={editItem ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
        fields={fields}
        defaultValues={editItem ? { ...editItem, kelompok: editItem.kelompok ?? "", agama_target: editItem.agama_target ?? "" } : { jenis: "reguler" }}
        onSubmit={handleSubmit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoading={isLoading}
      />
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Pelajaran</AlertDialogTitle>
            <AlertDialogDescription>Yakin ingin menghapus {deleteItem?.nama_mapel}?</AlertDialogDescription>
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
