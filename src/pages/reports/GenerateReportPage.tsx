import { useState, useEffect, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { FolderOpen, ExternalLink, Copy } from "lucide-react"

export function GenerateReportPage() {
  const [kelasList, setKelasList] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState("")
  const [tahunAjaran, setTahunAjaran] = useState(0)
  const [jenisRapor, setJenisRapor] = useState("akademik")
  const [completeness, setCompleteness] = useState<any[]>([])
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([])
  const [raporDir, setRaporDir] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const [k, t, dir] = await Promise.all([
      window.electronAPI.classGetAll(),
      window.electronAPI.academicYearGetAll(),
      window.electronAPI.reportGetRaporDir(),
    ])
    if (Array.isArray(k)) setKelasList(k)
    if (Array.isArray(t)) { const aktif = t.find((y: any) => y.is_active); if (aktif) setTahunAjaran(aktif.id) }
    if (typeof dir === "string") setRaporDir(dir)
  }, [])

  useEffect(() => { load() }, [load])

  const checkCompleteness = useCallback(async () => {
    if (!selectedKelas || !tahunAjaran) return
    const res = await window.electronAPI.reportCheckCompleteness(Number(selectedKelas), tahunAjaran)
    if (Array.isArray(res)) setCompleteness(res)
  }, [selectedKelas, tahunAjaran])

  useEffect(() => { if (selectedKelas) checkCompleteness() }, [checkCompleteness, selectedKelas])

  async function handleGenerate() {
    setLoading(true)
    try {
      if (jenisRapor === "akademik") {
        const res = await window.electronAPI.reportGenerateBatchAkademik(Number(selectedKelas), tahunAjaran)
        if (Array.isArray(res)) {
          setGeneratedFiles(res)
          toast.success(`${res.length} rapor berhasil di-generate`, {
            description: `Disimpan di: ${raporDir}`,
            duration: 5000,
          })
        } else if (res?.error) {
          toast.error(res.error)
        }
      } else {
        toast.info("Generate per siswa untuk rapor prakerin. Pilih satu siswa terlebih dahulu.")
      }
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  async function handleOpenFolder() {
    const res = await window.electronAPI.openPath(raporDir)
    if (res?.error) toast.error(`Gagal buka folder: ${res.error}`)
  }

  async function handleOpenFile(filePath: string) {
    const res = await window.electronAPI.openPath(filePath)
    if (res?.error) toast.error(`Gagal buka file: ${res.error}`)
  }

  async function handleShowInFolder(filePath: string) {
    await window.electronAPI.showItemInFolder(filePath)
  }

  async function handleCopyPath(filePath: string) {
    try {
      await navigator.clipboard.writeText(filePath)
      toast.success("Path di-copy ke clipboard")
    } catch {
      toast.error("Gagal copy path")
    }
  }

  async function handleSaveToFolder() {
    if (generatedFiles.length === 0) return
    const result = await window.electronAPI.showOpenDialog({ properties: ["openDirectory"] })
    if (result.canceled || !result.filePaths?.[0]) return
    await window.electronAPI.reportSaveToFolder(generatedFiles, result.filePaths[0])
    toast.success(`File disalin ke ${result.filePaths[0]}`)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Generate Rapor</h2>

      <div className="flex flex-wrap gap-4">
        <div className="grid gap-1.5 max-w-xs">
          <Label>Jenis Rapor</Label>
          <Select value={jenisRapor} onValueChange={setJenisRapor}>
            <SelectTrigger className="w-48">
              <SelectValue>
                {jenisRapor === "akademik" ? "Rapor Akademik" : jenisRapor === "prakerin" ? "Rapor Prakerin" : "Pilih jenis"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="akademik">Rapor Akademik</SelectItem>
              <SelectItem value="prakerin">Rapor Prakerin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5 max-w-xs">
          <Label>Kelas</Label>
          <Select value={selectedKelas} onValueChange={setSelectedKelas}>
            <SelectTrigger className="w-48">
              <SelectValue>
                {kelasList.find((k) => String(k.id) === selectedKelas)?.nama_kelas ?? "Pilih kelas"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {kelasList.map((k) => <SelectItem key={k.id} value={String(k.id)}>{k.nama_kelas}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {completeness.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Kelengkapan Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {completeness.map((c) => (
                <div key={c.siswa_id} className="flex items-center gap-2 rounded-md border p-2">
                  <span className="flex-1 text-sm font-medium">{c.nama}</span>
                  <Badge variant={c.status === "lengkap" ? "default" : "secondary"}>
                    {c.status === "lengkap" ? "Lengkap" : `${c.missingData.length} kurang`}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? "Generating..." : `Generate ${jenisRapor === "akademik" ? "Rapor Akademik" : "Rapor Prakerin"}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">File Ter-generate ({generatedFiles.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Path info + quick actions */}
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-3">
              <FolderOpen className="size-4 text-muted-foreground" />
              <code className="flex-1 text-xs text-muted-foreground truncate" title={raporDir}>
                {raporDir}
              </code>
              <Button size="sm" variant="outline" onClick={handleOpenFolder}>
                <ExternalLink className="mr-1 size-3" /> Buka Folder
              </Button>
              <Button size="sm" variant="outline" onClick={handleSaveToFolder}>
                <Copy className="mr-1 size-3" /> Simpan ke Folder Lain
              </Button>
            </div>

            {/* File list */}
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
              {generatedFiles.map((f, i) => {
                const fileName = f.split("/").pop() ?? f
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <span className="flex-1 truncate" title={f}>{fileName}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleOpenFile(f)}
                    >
                      Buka
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleShowInFolder(f)}
                    >
                      Reveal
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
