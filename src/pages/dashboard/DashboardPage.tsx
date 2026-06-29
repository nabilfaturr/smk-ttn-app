import { useState, useEffect } from "react"
import { useAuthStore } from "../../stores/authStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, Calendar } from "lucide-react"

export function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ siswa: 0, kelas: 0, guru: 0, tahunAjaran: "" })

  useEffect(() => {
    async function load() {
      const [siswa, kelas, guru, tahun] = await Promise.all([
        window.electronAPI.studentGetAll(),
        window.electronAPI.classGetAll(),
        window.electronAPI.teacherGetAll(),
        window.electronAPI.academicYearGetAll(),
      ])
      const aktifTahun = Array.isArray(tahun) ? tahun.find((t: any) => t.is_active) : null
      setStats({
        siswa: Array.isArray(siswa) ? siswa.length : 0,
        kelas: Array.isArray(kelas) ? kelas.length : 0,
        guru: Array.isArray(guru) ? guru.length : 0,
        tahunAjaran: aktifTahun?.nama ?? "-",
      })
    }
    load()
  }, [])

  const cards = [
    { title: "Total Siswa", value: stats.siswa, icon: Users, color: "bg-blue-50 text-blue-700" },
    { title: "Total Kelas", value: stats.kelas, icon: GraduationCap, color: "bg-green-50 text-green-700" },
    { title: "Total Guru", value: stats.guru, icon: BookOpen, color: "bg-purple-50 text-purple-700" },
    { title: "Tahun Ajaran", value: stats.tahunAjaran, icon: Calendar, color: "bg-orange-50 text-orange-700" },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <p className="text-muted-foreground">Selamat datang, {user?.nama || user?.username}!</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
