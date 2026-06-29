import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { DataTable, type ColumnDef } from "@/components/tables/DataTable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { dedupeTahunAjarans, type AcademicYear } from "@/lib/utils/tahun-ajaran"

type Summary = {
  totalKelas: number
  totalSiswa: number
  totalMapel: number
  totalGuru: number
}

type ArsipSiswa = {
  id: number
  nis: string
  nisn: string
  nama: string
  kelas_id: number | null
  status: string
  kelas?: { id: number; nama_kelas: string; program_keahlian: string | null } | null
}

export function ArsipPage() {
  const navigate = useNavigate()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [selectedTa, setSelectedTa] = useState("")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [siswaList, setSiswaList] = useState<ArsipSiswa[]>([])
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingSiswa, setLoadingSiswa] = useState(false)

  // Load TA non-aktif (exclude active)
  useEffect(() => {
    window.electronAPI.academicYearGetAll().then((res) => {
      if (!Array.isArray(res)) return
      const deduped = dedupeTahunAjarans(res)
      const nonActive = deduped.filter((t) => !t.is_active)
      // Sort: descending by nama (TA paling baru di atas)
      nonActive.sort((a, b) => b.nama.localeCompare(a.nama))
      setYears(nonActive)
      if (nonActive.length > 0) setSelectedTa(String(nonActive[0].id))
    })
  }, [])

  // Load summary + siswa saat TA berubah
  const loadData = useCallback(async () => {
    if (!selectedTa) return
    const taId = Number(selectedTa)

    setLoadingSummary(true)
    setLoadingSiswa(true)

    const [sumRes, sisRes] = await Promise.all([
      window.electronAPI.arsipGetSummary(taId),
      window.electronAPI.arsipGetSiswaList(taId),
    ])

    if (sumRes && !sumRes.error && sumRes.summary) {
      setSummary(sumRes.summary)
    } else {
      setSummary(null)
    }
    setLoadingSummary(false)

    if (sisRes && !sisRes.error && Array.isArray(sisRes.siswa)) {
      setSiswaList(sisRes.siswa)
    } else {
      setSiswaList([])
    }
    setLoadingSiswa(false)
  }, [selectedTa])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedTaNama = useMemo(
    () => years.find((t) => String(t.id) === selectedTa)?.nama ?? "",
    [years, selectedTa],
  )

  const columns: ColumnDef<ArsipSiswa>[] = [
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

  function handleLihatRapor(row: ArsipSiswa) {
    if (!row.kelas_id) return
    navigate(`/generate-report?taId=${selectedTa}&kelasId=${row.kelas_id}&siswaId=${row.id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Arsip Tahun Ajaran</h2>
        <p className="text-sm text-muted-foreground">
          Lihat data historis dari tahun ajaran sebelumnya (read-only)
        </p>
      </div>

      <div className="grid max-w-xs gap-1.5">
        <Label>Pilih Tahun Ajaran</Label>
        {years.length > 0 ? (
          <Select value={selectedTa} onValueChange={setSelectedTa}>
            <SelectTrigger>
              <SelectValue>
                {years.find((t) => String(t.id) === selectedTa)?.nama ?? "Pilih TA"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {years.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Belum ada arsip TA non-aktif
          </div>
        )}
      </div>

      {selectedTa && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              title="Total Kelas"
              value={summary?.totalKelas ?? 0}
              loading={loadingSummary}
            />
            <SummaryCard
              title="Total Siswa"
              value={summary?.totalSiswa ?? 0}
              loading={loadingSummary}
            />
            <SummaryCard
              title="Total Mapel"
              value={summary?.totalMapel ?? 0}
              loading={loadingSummary}
            />
            <SummaryCard
              title="Total Guru Pengampu"
              value={summary?.totalGuru ?? 0}
              loading={loadingSummary}
            />
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold">
              Daftar Siswa {selectedTaNama && `TA ${selectedTaNama}`}
            </h3>
            <DataTable
              columns={columns}
              data={siswaList}
              searchPlaceholder="Cari siswa (nama/NIS)..."
              searchKeys={["nama", "nis"]}
              extraActions={(row) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLihatRapor(row)}
                  disabled={!row.kelas_id}
                >
                  Lihat Rapor
                </Button>
              )}
            />
            {loadingSiswa && (
              <p className="mt-2 text-sm text-muted-foreground">Memuat data siswa...</p>
            )}
            {!loadingSiswa && siswaList.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Tidak ada siswa aktif di TA ini.
              </p>
            )}
          </div>
        </>
      )}

      {years.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada arsip</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Arsip akan tersedia setelah ada lebih dari satu tahun ajaran. Saat ini hanya TA
            aktif ({new Date().getFullYear()}/{new Date().getFullYear() + 1}) yang ada.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  loading,
}: {
  title: string
  value: number
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-2xl font-semibold text-muted-foreground">—</p>
        ) : (
          <p className="text-2xl font-semibold">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}
