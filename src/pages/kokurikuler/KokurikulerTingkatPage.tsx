import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"

type SubdimensiTingkat = {
  subdimensi_id: number
  nama: string
  tingkat_10: boolean
  tingkat_11: boolean
  tingkat_12: boolean
}

type DimensiGroup = {
  dimensi_id: number
  nama: string
  subdimensi: SubdimensiTingkat[]
}

export function KokurikulerTingkatPage() {
  const [dimensi, setDimensi] = useState<DimensiGroup[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.electronAPI.kokurikulerGetSubdimensiTingkat()
    if (Array.isArray(res)) {
      setDimensi(res as DimensiGroup[])
    } else if (res?.error) {
      toast.error(res.error)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(subdimensiId: number, tingkat: 10 | 11 | 12, active: boolean) {
    const res = await window.electronAPI.kokurikulerToggleSubdimensiTingkat(subdimensiId, tingkat, active)
    if (res?.error) {
      toast.error(res.error)
      return
    }
    // Update local state
    setDimensi((prev) =>
      prev.map((d) => ({
        ...d,
        subdimensi: d.subdimensi.map((sd) => {
          if (sd.subdimensi_id === subdimensiId) {
            const key = `tingkat_${tingkat}` as keyof SubdimensiTingkat
            return { ...sd, [key]: active }
          }
          return sd
        }),
      })),
    )
    toast.success(`Subdimensi ${active ? "diaktifkan" : "dinonaktifkan"} untuk tingkat ${tingkat === 10 ? "X" : tingkat === 11 ? "XI" : "XII"}`)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Memuat data...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Kelola Kokurikuler per Tingkat</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Atur subdimensi P5 yang aktif untuk setiap tingkat kelas (X, XI, XII). Centang untuk mengaktifkan.
        </p>
      </div>

      {dimensi.map((d) => (
        <Card key={d.dimensi_id}>
          <CardHeader>
            <CardTitle className="text-base">{d.nama}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left text-sm font-medium">Subdimensi</th>
                  <th className="py-2 px-2 text-center text-sm font-medium">Kelas X</th>
                  <th className="py-2 px-2 text-center text-sm font-medium">Kelas XI</th>
                  <th className="py-2 px-2 text-center text-sm font-medium">Kelas XII</th>
                </tr>
              </thead>
              <tbody>
                {d.subdimensi.map((sd) => (
                  <tr key={sd.subdimensi_id} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-sm">{sd.nama}</td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={sd.tingkat_10}
                        onCheckedChange={(v) => handleToggle(sd.subdimensi_id, 10, !!v)}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={sd.tingkat_11}
                        onCheckedChange={(v) => handleToggle(sd.subdimensi_id, 11, !!v)}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={sd.tingkat_12}
                        onCheckedChange={(v) => handleToggle(sd.subdimensi_id, 12, !!v)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      {dimensi.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Belum ada dimensi P5. Jalankan seed terlebih dahulu.
          </CardContent>
        </Card>
      )}
    </div>
  )
}