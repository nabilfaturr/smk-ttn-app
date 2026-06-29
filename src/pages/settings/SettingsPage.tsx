import { useState, useEffect } from "react"
import { useAuthStore } from "@/stores/authStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { FirebaseConfigSection } from "@/components/settings/FirebaseConfigSection"

export function SettingsPage() {
  const { user } = useAuthStore()
  const [info, setInfo] = useState({ nama: "", alamat: "", kepala_sekolah: "", npsn: "" })
  const [configs, setConfigs] = useState<{ kunci: string; nilai: string; keterangan: string }[]>([])
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" })

  useEffect(() => {
    async function load() {
      const [infoRes, configRes] = await Promise.all([
        window.electronAPI.configGetInfo(),
        window.electronAPI.configGetKonfigurasi(),
      ])
      if (infoRes) setInfo(infoRes)
      if (Array.isArray(configRes)) setConfigs(configRes)
    }
    load()
  }, [])

  async function handleInfoSave() {
    await window.electronAPI.configUpdateInfo(info)
    toast.success("Info sekolah diperbarui")
  }

  async function handleConfigSave() {
    await window.electronAPI.configUpdateKonfigurasi(configs)
    toast.success("Konfigurasi diperbarui")
  }

  async function handlePasswordSave() {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error("Isi semua field")
      return
    }
    if (!user) return
    const result = await window.electronAPI.changePassword(user.id, passwordForm.oldPassword, passwordForm.newPassword)
    if (result.success) {
      toast.success("Password berhasil diubah")
      setPasswordForm({ oldPassword: "", newPassword: "" })
    } else {
      toast.error(result.error ?? "Gagal mengubah password")
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Pengaturan</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Info Sekolah</CardTitle></CardHeader>
        <CardContent className="grid gap-4 max-w-md">
          <div className="grid gap-1.5">
            <Label>Nama Sekolah</Label>
            <Input value={info.nama} onChange={(e) => setInfo((p) => ({ ...p, nama: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Alamat</Label>
            <Input value={info.alamat} onChange={(e) => setInfo((p) => ({ ...p, alamat: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Kepala Sekolah</Label>
            <Input value={info.kepala_sekolah} onChange={(e) => setInfo((p) => ({ ...p, kepala_sekolah: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>NPSN</Label>
            <Input value={info.npsn} onChange={(e) => setInfo((p) => ({ ...p, npsn: e.target.value }))} />
          </div>
          <Button onClick={handleInfoSave} className="w-fit">Simpan Info Sekolah</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Konfigurasi Sistem</CardTitle></CardHeader>
        <CardContent className="grid gap-4 max-w-md">
          {configs.map((c) => (
            <div key={c.kunci} className="grid gap-1.5">
              <Label>{c.keterangan} ({c.kunci})</Label>
              <Input
                value={c.nilai}
                onChange={(e) =>
                  setConfigs((prev) =>
                    prev.map((x) => (x.kunci === c.kunci ? { ...x, nilai: e.target.value } : x)),
                  )
                }
              />
            </div>
          ))}
          <Button onClick={handleConfigSave} className="w-fit">Simpan Konfigurasi</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ganti Password</CardTitle></CardHeader>
        <CardContent className="grid gap-4 max-w-md">
          <div className="grid gap-1.5">
            <Label>Password Lama</Label>
            <Input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Password Baru</Label>
            <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <Button onClick={handlePasswordSave} className="w-fit">Ubah Password</Button>
        </CardContent>
      </Card>

      <FirebaseConfigSection />
    </div>
  )
}
