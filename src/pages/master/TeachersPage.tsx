import { useState, useEffect, useCallback } from "react"
import { DataTable, type ColumnDef } from "@/components/tables/DataTable"
import { FormDialog, type FieldConfig } from "@/components/forms/FormDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Teacher = {
  id: number
  nip: string
  nama: string
  bidang_studi: string
  user_id?: number
  kode_login: string
}

export function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [editItem, setEditItem] = useState<Teacher | null>(null)
  const [deleteItem, setDeleteItem] = useState<Teacher | null>(null)
  const [resetConfirm, setResetConfirm] = useState<Teacher | null>(null)
  const [resetResult, setResetResult] = useState<{ nama: string; password: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const load = useCallback(async () => {
    const [res, userRes] = await Promise.all([
      window.electronAPI.teacherGetAll(),
      window.electronAPI.userGetAll(),
    ])
    if (Array.isArray(res)) {
      const users = Array.isArray(userRes) ? userRes : []
      const withKode = res.map((t: any) => ({
        ...t,
        kode_login: t.user_id ? users.find((u: any) => u.id === t.user_id)?.kode_login || "—" : "—",
      }))
      setTeachers(withKode)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const columns: ColumnDef<Teacher>[] = [
    { key: "kode_login", header: "Kode Login" },
    { key: "nip", header: "NIP" },
    { key: "nama", header: "Nama" },
    { key: "bidang_studi", header: "Bidang Studi" },
  ]

  const fields: FieldConfig[] = [
    { name: "nip", label: "NIP (opsional)", type: "text", placeholder: "NIP bersifat opsional" },
    { name: "nama", label: "Nama", type: "text", required: true, placeholder: "Nama lengkap guru" },
    {
      name: "bidang_studi",
      label: "Bidang Studi",
      type: "text",
      placeholder: "Contoh: Matematika",
    },
  ]

  async function handleSubmit(values: Record<string, any>) {
    setIsLoading(true)
    if (editItem) {
      await window.electronAPI.teacherUpdate(editItem.id, values)
      setIsLoading(false)
      setDialogOpen(false)
      setEditItem(null)
      load()
    } else {
      const result = await window.electronAPI.teacherCreate(values)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(
          `Guru berhasil ditambahkan. Kode: ${result.kode_login}, Pass: ${result.password}`,
        )
      }
      setIsLoading(false)
      setDialogOpen(false)
      load()
    }
  }

  async function handleDelete() {
    if (!deleteItem) return
    const result = await window.electronAPI.teacherDelete(deleteItem.id)
    if (result?.error) {
      toast.error(`Gagal hapus guru: ${result.error}`)
    } else {
      toast.success(`Guru ${deleteItem.nama} berhasil dihapus`)
    }
    setDeleteItem(null)
    load()
  }

  function handleResetClick(teacher: Teacher) {
    if (!teacher.user_id) {
      toast.error("Guru ini belum memiliki akun login")
      return
    }
    setResetConfirm(teacher)
  }

  async function handleResetConfirm() {
    if (!resetConfirm?.user_id) return
    setIsResetting(true)
    const teacherName = resetConfirm.nama
    const userId = resetConfirm.user_id
    setResetConfirm(null)
    const result = await window.electronAPI.resetPassword(userId)
    setIsResetting(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setResetResult({ nama: teacherName, password: result.newPassword })
    }
  }

  async function handleCopyPassword() {
    if (!resetResult?.password) return
    try {
      await navigator.clipboard.writeText(resetResult.password)
      toast.success("Password di-copy ke clipboard")
    } catch {
      toast.error("Gagal copy password")
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Data Guru</h2>

      <DataTable
        columns={columns}
        data={teachers}
        onAdd={() => {
          setEditItem(null)
          setDialogOpen(true)
        }}
        onEdit={(row) => {
          setEditItem(row)
          setDialogOpen(true)
        }}
        onDelete={(row) => setDeleteItem(row)}
        extraActions={(row) => (
          <Button variant="outline" size="sm" onClick={() => handleResetClick(row)}>
            Reset Pass
          </Button>
        )}
        searchPlaceholder="Cari guru..."
        searchKeys={["nama", "nip", "kode_login"]}
      />

      <FormDialog
        title={editItem ? "Edit Guru" : "Tambah Guru"}
        description={
          editItem ? "Ubah data guru" : "Tambahkan guru baru (akun login akan dibuat otomatis)"
        }
        fields={fields}
        defaultValues={editItem ?? undefined}
        onSubmit={handleSubmit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoading={isLoading}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Guru</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus {deleteItem?.nama}? Akun login guru ini juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!resetConfirm}
        onOpenChange={(o) => !o && setResetConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password Guru</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin mereset password untuk <strong>{resetConfirm?.nama}</strong>?
              <br />
              <br />
              Password lama akan diganti dengan password baru 6 digit acak. Guru harus login
              ulang dengan password baru. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm} disabled={isResetting}>
              {isResetting ? "Mereset..." : "Ya, Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!resetResult}
        onOpenChange={(o) => {
          if (!o) setResetResult(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password Berhasil Direset</AlertDialogTitle>
            <AlertDialogDescription>
              Password baru untuk <strong>{resetResult?.nama}</strong>:
              <div className="mt-3 flex items-center gap-2 rounded-md bg-yellow-50 p-3">
                <span className="flex-1 text-center font-mono text-lg font-bold tracking-widest">
                  {resetResult?.password}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                >
                  Copy
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Salin password ini dan berikan ke guru bersangkutan. Password tidak bisa ditampilkan
                lagi setelah dialog ini ditutup.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResetResult(null)}>Tutup</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
