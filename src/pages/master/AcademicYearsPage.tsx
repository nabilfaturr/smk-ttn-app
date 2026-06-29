import { useState, useEffect, useCallback } from "react"
import { DataTable, type ColumnDef } from "@/components/tables/DataTable"
import { FormDialog, type FieldConfig } from "@/components/forms/FormDialog"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type AcademicYear = {
  id: number
  nama: string
  semester: number
  is_active: number
}

export function AcademicYearsPage() {
  const [data, setData] = useState<AcademicYear[]>([])
  const [editItem, setEditItem] = useState<AcademicYear | null>(null)
  const [deleteItem, setDeleteItem] = useState<AcademicYear | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await window.electronAPI.academicYearGetAll()
    if (Array.isArray(res)) setData(res)
  }, [])

  useEffect(() => { load() }, [load])

  const columns: ColumnDef<AcademicYear>[] = [
    { key: "nama", header: "Tahun Ajaran" },
    {
      key: "semester",
      header: "Semester",
      render: (row) => `Semester ${row.semester}`,
    },
    {
      key: "is_active",
      header: "Status",
      render: (row) =>
        row.is_active ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aktif</Badge> : <Badge variant="secondary">Tidak Aktif</Badge>,
    },
  ]

  const fields: FieldConfig[] = [
    { name: "nama", label: "Tahun Ajaran", type: "text", required: true, placeholder: "Contoh: 2025/2026" },
    {
      name: "semester",
      label: "Semester",
      type: "select",
      required: true,
      options: [
        { value: "1", label: "Semester 1 (Ganjil)" },
        { value: "2", label: "Semester 2 (Genap)" },
      ],
    },
    {
      name: "is_active",
      label: "Status Aktif",
      type: "radio",
      options: [
        { value: "1", label: "Aktif" },
        { value: "0", label: "Tidak Aktif" },
      ],
    },
  ]

  async function handleSubmit(values: Record<string, any>) {
    setIsLoading(true)
    const payload = { ...values, semester: Number(values.semester), is_active: Number(values.is_active) }
    if (editItem) {
      await window.electronAPI.academicYearUpdate(editItem.id, payload)
    } else {
      await window.electronAPI.academicYearCreate(payload)
    }
    setIsLoading(false)
    setDialogOpen(false)
    setEditItem(null)
    load()
  }

  async function handleDelete() {
    if (!deleteItem) return
    await window.electronAPI.academicYearDelete(deleteItem.id)
    setDeleteItem(null)
    load()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Data Tahun Ajaran</h2>
      <DataTable
        columns={columns}
        data={data}
        onAdd={() => { setEditItem(null); setDialogOpen(true) }}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true) }}
        onDelete={(row) => setDeleteItem(row)}
      />
      <FormDialog
        title={editItem ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}
        fields={fields}
        defaultValues={editItem ? { ...editItem, semester: String(editItem.semester), is_active: String(editItem.is_active) } : { is_active: "1" }}
        onSubmit={handleSubmit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoading={isLoading}
      />
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tahun Ajaran</AlertDialogTitle>
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
