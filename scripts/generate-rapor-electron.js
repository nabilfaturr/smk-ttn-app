/**
 * Generate sample rapor via Electron (avoids getDb() issue).
 *
 * Usage: npx electron scripts/generate-rapor-electron.js
 *
 * This script launches Electron, opens the DB, generates one rapor,
 * and saves it to /tmp/rapor-kurmer-sample.pdf.
 */

const { app } = require("electron")
const path = require("node:path")
const fs = require("node:fs")

app.whenReady().then(async () => {
  // Import dynamically after Electron app is ready
  const { initDatabase } = require("../src/lib/db")
  const { generateRaporAkademik } = require("../src/lib/pdf/rapor-akademik")
  const schema = require("../src/lib/db/schema")
  const { eq } = require("drizzle-orm")

  initDatabase()
  const db = require("../src/lib/db").getDb()

  // Find a XII RPL siswa
  const kelas = db
    .select()
    .from(schema.kelas)
    .where(eq(schema.kelas.nama_kelas, "XII RPL"))
    .get()
  if (!kelas) {
    console.log("XII RPL not found")
    app.quit()
    return
  }
  const siswa = db
    .select()
    .from(schema.siswa)
    .where(eq(schema.siswa.kelas_id, kelas.id))
    .get()
  if (!siswa) {
    console.log("No siswa in XII RPL")
    app.quit()
    return
  }
  const ta = db
    .select()
    .from(schema.tahunAjaran)
    .where(eq(schema.tahunAjaran.is_active, 1))
    .get()
  if (!ta) {
    console.log("No active TA")
    app.quit()
    return
  }

  console.log(`Generating rapor for ${siswa.nama} (id=${siswa.id}), TA=${ta.nama}`)

  try {
    const pdf = await generateRaporAkademik(siswa.id, kelas.id, ta.id)
    const out = "/tmp/rapor-kurmer-sample.pdf"
    fs.writeFileSync(out, pdf)
    console.log(`✅ PDF saved: ${out} (${pdf.length} bytes)`)
    console.log(`Render: pdftoppm -png ${out} /tmp/rapor-page`)
  } catch (err) {
    console.error("❌ Error:", err.message)
    console.error(err.stack)
  }
  app.quit()
})
