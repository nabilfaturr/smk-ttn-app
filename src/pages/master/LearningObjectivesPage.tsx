import { useState, useEffect, useCallback } from "react"
import { useAuthStore } from "@/stores/authStore"
import { DataTable, type ColumnDef } from "@/components/tables/DataTable"
import { FormDialog, type FieldConfig } from "@/components/forms/FormDialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { dedupeTahunAjarans, type AcademicYear } from "@/lib/utils/tahun-ajaran"

type TP = { id: number; mapel_id: number; kode_tp: string; deskripsi_tuntas: string; deskripsi_remediasi: string; tahun_ajaran_id: number }
type Subject = { id: number; kode_mapel: string; nama_mapel: string }

const MAX_TP_PER_MAPEL = 7

function getNextKodeTp(existing: TP[]): string {
  const used = new Set(existing.map((t) => t.kode_tp))
  for (let n = 1; n <= existing.length + 1; n++) {
    const candidate = `TP${n}`
    if (!used.has(candidate)) return candidate
  }
  return `TP${existing.length + 1}`
}

export function LearningObjectivesPage() {
  const { user } = useAuthStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tahunAjarans, setTahunAjarans] = useState<AcademicYear[]>([])
  const [selectedMapel, setSelectedMapel] = useState("")
  const [selectedTa, setSelectedTa] = useState("")
  const [tpList, setTpList] = useState<TP[]>([])
  const [editItem, setEditItem] = useState<TP | null>(null)
  const [deleteItem, setDeleteItem] = useState<TP | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loadSubjects = useCallback(async () => {
    const [subRes, taRes] = await Promise.all([
      window.electronAPI.subjectGetAll(),
      window.electronAPI.academicYearGetAll(),
    ])
    if (!Array.isArray(subRes)) return
    if (Array.isArray(taRes)) {
      const deduped = dedupeTahunAjarans(taRes)
      setTahunAjarans(deduped)
      const aktif = taRes.find((t) => t.is_active)
      if (aktif && !selectedTa) {
        const activeId = deduped.find((d) => d.nama === aktif.nama)?.id
        if (activeId) setSelectedTa(String(activeId))
      }
    }
    // Filter via junction mapel_kelas_guru untuk role guru
    if (user?.roles?.includes("guru") && user.guru_id && Array.isArray(taRes)) {
      const aktif = taRes.find((t: any) => t.is_active)
      if (aktif) {
        const assignments = await window.electronAPI.mapelAssignmentGetByGuru(
          user.guru_id,
          aktif.id,
        )
        const taughtMapelIds = new Set(
          Array.isArray(assignments) ? assignments.map((a: any) => a.mapel_id) : [],
        )
        setSubjects(subRes.filter((s: any) => taughtMapelIds.has(s.id)))
        return
      }
    }
    setSubjects(subRes)
  }, [user, selectedTa])

  const loadTp = useCallback(async () => {
    if (!selectedMapel) return
    const res = await window.electronAPI.tpGetByMapel(
      selectedMapel,
      selectedTa || undefined,
    )
    if (Array.isArray(res)) setTpList(res)
  }, [selectedMapel, selectedTa])

  useEffect(() => { loadSubjects() }, [loadSubjects])
  useEffect(() => { loadTp() }, [loadTp])

  const columns: ColumnDef<TP>[] = [
    { key: "kode_tp", header: "Kode" },
    { key: "deskripsi_tuntas", header: "Deskripsi Tuntas" },
    { key: "deskripsi_remediasi", header: "Deskripsi Remediasi" },
  ]

  const fields: FieldConfig[] = [
    { name: "kode_tp", label: "Kode TP", type: "text", required: true, placeholder: "Contoh: TP1" },
    { name: "deskripsi_tuntas", label: "Deskripsi Tuntas", type: "textarea", required: true, placeholder: "Deskripsi jika siswa tuntas kompetensi ini" },
    { name: "deskripsi_remediasi", label: "Deskripsi Remediasi", type: "textarea", required: true, placeholder: "Deskripsi jika siswa perlu remediasi" },
  ]

  async function handleSubmit(values: Record<string, any>) {
    setIsLoading(true)
    if (!selectedTa) {
      toast.error("Pilih tahun ajaran terlebih dahulu")
      setIsLoading(false)
      return
    }
    const payload = {
      mapel_id: selectedMapel,
      tahun_ajaran_id: selectedTa,
      ...values,
    }
    if (editItem) {
      const result = await window.electronAPI.tpUpdate(editItem.id, payload)
      if (result?.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }
    } else {
      if (tpList.length >= MAX_TP_PER_MAPEL) {
        toast.error(`Maksimal ${MAX_TP_PER_MAPEL} TP per mapel`)
        setIsLoading(false)
        return
      }
      const result = await window.electronAPI.tpCreate(payload)
      if (result?.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }
    }
    setIsLoading(false)
    setDialogOpen(false)
    setEditItem(null)
    loadTp()
  }

  async function handleDelete() {
    if (!deleteItem) return
    const res = await window.electronAPI.tpDelete(deleteItem.id)
    if (res?.error) {
      toast.error(res.error)
      return
    }
    setDeleteItem(null)
    loadTp()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Kelola Tujuan Pembelajaran</h2>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Perhatian:</strong> Mengedit deskripsi TP akan mengubah teks rapor untuk siswa
        yang sudah dinilai. Pastikan deskripsi sudah final sebelum nilai di-input.
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="grid max-w-xs gap-1.5">
          <Label>Tahun Ajaran</Label>
          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
            {(() => {
              const ta = tahunAjarans.find((t) => String(t.id) === selectedTa)
              return ta ? `${ta.nama} (Aktif)` : "—"
            })()}
          </div>
        </div>

        <div className="grid max-w-xs gap-1.5">
          <Label>Mata Pelajaran</Label>
          <Select value={selectedMapel} onValueChange={setSelectedMapel}>
            <SelectTrigger>
              <SelectValue>
                {subjects.find((s) => String(s.id) === selectedMapel)
                  ? `${subjects.find((s) => String(s.id) === selectedMapel)?.nama_mapel} (${subjects.find((s) => String(s.id) === selectedMapel)?.kode_mapel})`
                  : "Pilih mapel"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.nama_mapel} ({s.kode_mapel})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMapel && (
        <>
          <p className="text-sm text-muted-foreground">
            Jumlah TP: {tpList.length}/{MAX_TP_PER_MAPEL}
          </p>
          <DataTable
            columns={columns}
            data={tpList}
            onAdd={
              tpList.length < MAX_TP_PER_MAPEL
                ? () => {
                    setEditItem(null)
                    setDialogOpen(true)
                  }
                : undefined
            }
            onEdit={(row) => {
              setEditItem(row)
              setDialogOpen(true)
            }}
            onDelete={(row) => setDeleteItem(row)}
          />
        </>
      )}

      {tpList.length >= MAX_TP_PER_MAPEL && (
        <p className="text-sm text-destructive">Maksimal {MAX_TP_PER_MAPEL} TP per mapel.</p>
      )}

      <FormDialog
        title={editItem ? "Edit TP" : "Tambah TP"}
        fields={fields}
        defaultValues={editItem ?? { kode_tp: getNextKodeTp(tpList) }}
        onSubmit={handleSubmit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoading={isLoading}
        maxWidth="wide"
      />

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus TP</AlertDialogTitle>
            <AlertDialogDescription>Yakin ingin menghapus {deleteItem?.kode_tp}?</AlertDialogDescription>
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
