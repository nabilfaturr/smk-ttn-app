import { execSync, spawnSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import { platform } from "node:process"

const VERSION = process.env.npm_package_version ?? "1.0.0"
const TAG = `v${VERSION}`
const DIST_DIR = "dist"

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`)
  const res = spawnSync(cmd, { stdio: "inherit", shell: true, ...opts })
  if (res.status !== 0) process.exit(res.status ?? 1)
}

function header(s) {
  console.log(`\n${"=".repeat(60)}\n${s}\n${"=".repeat(60)}`)
}

header(`Release Windows .exe — ${TAG}`)

if (platform !== "win32") {
  console.warn(`\n[PERINGATAN] Script ini sebaiknya dijalankan di Windows.`)
  console.warn(`Sekarang berjalan di: ${platform}`)
  console.warn(`Build Windows .exe dari Linux butuh Wine + dependensi tambahan.`)
  console.warn(`Lanjut? Tekan Ctrl+C dalam 5 detik untuk batal...\n`)
  execSync("sleep 5", { stdio: "inherit" })
}

header("1. Validasi prerequisites")

try {
  execSync("gh --version", { stdio: "pipe" })
  console.log("[OK] gh CLI terinstall")
} catch {
  console.error("[X] gh CLI tidak ditemukan. Install: https://cli.github.com/")
  process.exit(1)
}

try {
  execSync("git rev-parse --is-inside-work-tree", { stdio: "pipe" })
  console.log("[OK] Git repo valid")
} catch {
  console.error("[X] Bukan di dalam Git repo")
  process.exit(1)
}

header("2. Validasi tag")
try {
  execSync(`git rev-parse ${TAG}`, { stdio: "pipe" })
  console.log(`[OK] Tag ${TAG} ada di local`)
} catch {
  console.log(`[!] Tag ${TAG} belum ada. Akan dibuat dari HEAD.`)
  run(`git tag -a ${TAG} -m "Release ${TAG}"`)
}

try {
  execSync(`git ls-remote --tags origin ${TAG}`, { stdio: "pipe" })
  console.log(`[OK] Tag ${TAG} sudah di-push ke origin`)
} catch {
  console.log(`[>] Push tag ${TAG} ke origin`)
  run(`git push origin ${TAG}`)
}

header("3. Build Windows installer")
run("npm run build:win")

header("4. Cari file .exe")
if (!existsSync(DIST_DIR)) {
  console.error(`[X] Folder ${DIST_DIR}/ tidak ada. Build gagal?`)
  process.exit(1)
}

const exeFiles = readdirSync(DIST_DIR).filter(
  (f) => f.toLowerCase().endsWith(".exe") && !f.toLowerCase().includes("blockmap"),
)

if (exeFiles.length === 0) {
  console.error(`[X] Tidak ada file .exe di ${DIST_DIR}/`)
  process.exit(1)
}

console.log("[OK] File installer ditemukan:")
for (const f of exeFiles) console.log(`     - ${f}`)

header("5. Buat GitHub Release")
const notes = `## Instalasi

1. Download file \`${exeFiles[0]}\` di bawah
2. Jalankan installer (akan install ke sistem)
3. Login dengan default admin: \`admin\` / \`admin123\` (ganti setelah first login)

## Catatan

- Aplikasi jalan offline, SQLite local
- Firebase sync opsional (via Settings → Firebase Sync)
- Lihat README untuk dokumentasi lengkap
`

const draftFlag = process.argv.includes("--draft") ? "--draft" : ""
const title = `Sistem Absensi dan Penilaian SMK TTN ${TAG}`

const cmd = [
  "gh",
  "release",
  "create",
  TAG,
  ...exeFiles.map((f) => `"dist/${f}"`),
  "--title",
  `"${title}"`,
  "--notes",
  `"${notes.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`,
  draftFlag,
].join(" ")

run(cmd)

header("DONE!")
console.log(`Release ${TAG} berhasil dibuat di GitHub.`)
console.log(`Lihat: https://github.com/nabilfaturr/smk-ttn-app/releases/tag/${TAG}`)
