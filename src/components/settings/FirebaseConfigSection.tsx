/**
 * Firebase Sync Configuration UI.
 *
 * Admin input Firebase config (apiKey, projectId, dll), test koneksi,
 * dan simpan encrypted ke userData via Electron safeStorage.
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Cloud, CheckCircle2, AlertCircle, Trash2, ExternalLink } from "lucide-react"
import type { FirebaseConfigInput } from "@/types/electron-api"

export function FirebaseConfigSection() {
  const [config, setConfig] = useState<FirebaseConfigInput>({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [configured, setConfigured] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    setLoading(true)
    const saved = await window.electronAPI.firebaseConfigGet()
    if (saved) {
      setConfig({
        apiKey: "", // Don't restore full API key (security)
        authDomain: saved.authDomain ?? "",
        projectId: saved.projectId ?? "",
        storageBucket: saved.storageBucket ?? "",
        messagingSenderId: saved.messagingSenderId ?? "",
        appId: saved.appId ?? "",
      })
      setConfigured(!!saved.projectId)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!config.apiKey || !config.projectId) {
      toast.error("API Key dan Project ID wajib diisi")
      return
    }
    setSaving(true)
    const result = await window.electronAPI.firebaseConfigSave(config)
    if (result.success) {
      toast.success(
        result.encrypted
          ? "Config tersimpan (encrypted di OS keychain)"
          : "Config tersimpan (plain JSON — safeStorage tidak tersedia)",
      )
      setConfigured(true)
    } else {
      toast.error(`Gagal: ${result.error ?? "unknown error"}`)
    }
    setSaving(false)
  }

  async function handleTest() {
    if (!config.apiKey || !config.projectId) {
      toast.error("Isi API Key dan Project ID dulu")
      return
    }
    setTesting(true)
    const result = await window.electronAPI.firebaseConfigTest(config)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
    setTesting(false)
  }

  async function handleUnlink() {
    const ok = confirm("Hapus konfigurasi Firebase? Data lokal tidak akan terhapus, hanya sync ke cloud yang akan dimatikan.")
    if (!ok) return
    const result = await window.electronAPI.firebaseConfigDelete()
    if (result.success) {
      toast.success("Firebase config dihapus")
      setConfigured(false)
      setConfig({
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
      })
    } else {
      toast.error(`Gagal: ${result.error ?? "unknown error"}`)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cloud className="size-4" /> Firebase Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Cloud className="size-4" /> Firebase Sync
          </span>
          {configured ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="size-3" /> Terkonfigurasi
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="size-3" /> Belum dikonfigurasi
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p>
            Firebase digunakan untuk <strong>backup data</strong> ke cloud (Firestore).{" "}
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              Buka Firebase Console
              <ExternalLink className="size-3" />
            </a>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Buat project → Firestore Database → Project Settings → Your apps → Web app → copy config di bawah.
          </p>
        </div>

        <div className="grid gap-4 max-w-2xl">
          <div className="grid gap-1.5">
            <Label>API Key *</Label>
            <Input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig((p) => ({ ...p, apiKey: e.target.value }))}
              placeholder="AIzaSyD..."
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Project ID *</Label>
            <Input
              value={config.projectId}
              onChange={(e) => setConfig((p) => ({ ...p, projectId: e.target.value }))}
              placeholder="smk-ttn-prod"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Auth Domain</Label>
            <Input
              value={config.authDomain}
              onChange={(e) => setConfig((p) => ({ ...p, authDomain: e.target.value }))}
              placeholder="smk-ttn-prod.firebaseapp.com"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Storage Bucket</Label>
            <Input
              value={config.storageBucket}
              onChange={(e) => setConfig((p) => ({ ...p, storageBucket: e.target.value }))}
              placeholder="smk-ttn-prod.appspot.com"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Messaging Sender ID</Label>
            <Input
              value={config.messagingSenderId}
              onChange={(e) => setConfig((p) => ({ ...p, messagingSenderId: e.target.value }))}
              placeholder="1234567890"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>App ID</Label>
            <Input
              value={config.appId}
              onChange={(e) => setConfig((p) => ({ ...p, appId: e.target.value }))}
              placeholder="1:1234567890:web:abc123..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Config"}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? "Testing..." : "Test Koneksi"}
            </Button>
            {configured && (
              <Button variant="destructive" onClick={handleUnlink}>
                <Trash2 className="mr-1 size-4" /> Hapus Config
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-medium">⚠️ Tips Keamanan</p>
          <ul className="ml-4 mt-1 list-disc space-y-0.5">
            <li>API Key akan di-encrypt pakai OS keychain (Keychain/libsecret/DPAPI)</li>
            <li>Jangan share config di screenshot atau pesan</li>
            <li>Set Firestore security rules untuk production (lihat docs)</li>
            <li>Free Spark plan: 1GB storage, 50K reads/hari, 20K writes/hari</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
