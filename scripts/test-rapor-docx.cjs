const path = require("path")
const os = require("os")
const fs = require("fs")
const Module = require("module")

// Create mock electron module
const mockPath = path.join(__dirname, "electron-mock.js")
const dbPath = path.join(os.homedir(), ".config", "smk-ttn-app", "smk-ttn.db")
const projectRoot = process.cwd()
fs.writeFileSync(mockPath, `module.exports = { app: { getAppPath: () => ${JSON.stringify(projectRoot)}, getPath: (n) => n === "userData" ? ${JSON.stringify(path.dirname(dbPath))} : "" } }`)

// Override module resolution for "electron" BEFORE any other code
const originalLoad = Module._load
Module._load = function(request, ...args) {
  if (request === "electron") {
    return require(mockPath)
  }
  return originalLoad.call(this, request, ...args)
}

// Now require the actual logic
const { initDatabase, getDb } = require("../src/lib/db")
const { siswa, kelas, tahunAjaran } = require("../src/lib/db/schema")
const { eq, and } = require("drizzle-orm")
const { generateRaporDocx } = require("../src/lib/pdf/rapor-docx")

initDatabase()
const db = getDb()

const k = db.select().from(kelas).where(eq(kelas.nama_kelas, "XII RPL")).get()
const sList = db.select().from(siswa).where(and(eq(siswa.kelas_id, k.id), eq(siswa.status, "aktif"))).all()
const s = sList[0]
const ta = db.select().from(tahunAjaran).where(eq(tahunAjaran.is_active, 1)).get()

console.log(`Generating rapor for: ${s.nama} (${s.nis}), kelas: ${k.nama_kelas}, TA: ${ta.nama}`)
console.log(`Siswa count in XII RPL: ${sList.length}`)

try {
  const docx = generateRaporDocx(s.id, k.id, ta.id)
  const outPath = "/tmp/test-rapor.docx"
  fs.writeFileSync(outPath, docx)
  console.log(`✅ Rapor saved to ${outPath} (${docx.length} bytes)`)
} catch (err) {
  console.error("❌ Error:", err.message)
  console.error(err.stack)
}