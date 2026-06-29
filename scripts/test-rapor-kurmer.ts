/**
 * Generate sample rapor untuk visual comparison dengan docx sample.
 *
 * Usage: npx tsx scripts/test-rapor-kurmer.ts
 */

// Monkey-patch Electron's `app` to provide getPath when running outside Electron.
// This allows getDb() from src/lib/db to work in plain Node.
import Module from "node:module"
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, ...args) {
  if (request === "electron") {
    // Return a fake electron module
    return require.resolve("./fake-electron.js")
  }
  return originalResolve.call(this, request, ...args)
}

import { openDatabase, closeSqlite } from "./seed/connection"
import { generateRaporAkademik } from "../src/lib/pdf/rapor-akademik"
import * as schema from "../src/lib/db/schema"
import { eq } from "drizzle-orm"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"

async function main() {
  const { db, sqlite } = openDatabase()

  // Find a XII RPL siswa
  const kelasXIIRPL = db
    .select()
    .from(schema.kelas)
    .where(eq(schema.kelas.nama_kelas, "XII RPL"))
    .get()
  if (!kelasXIIRPL) {
    console.log("XII RPL not found")
    return
  }
  const siswa = db
    .select()
    .from(schema.siswa)
    .where(eq(schema.siswa.kelas_id, kelasXIIRPL.id))
    .get()
  if (!siswa) {
    console.log("No siswa in XII RPL")
    return
  }
  const taAktif = db
    .select()
    .from(schema.tahunAjaran)
    .where(eq(schema.tahunAjaran.is_active, 1))
    .get()
  if (!taAktif) {
    console.log("No active TA")
    return
  }

  console.log(`Generating rapor for siswa ${siswa.nama} (id=${siswa.id})`)
  console.log(`Kelas: ${kelasXIIRPL.nama_kelas}, TA: ${taAktif.nama}`)

  try {
    const pdf = await generateRaporAkademik(siswa.id, kelasXIIRPL.id, taAktif.id)
    const out = path.join(os.tmpdir(), "rapor-kurmer-sample.pdf")
    fs.writeFileSync(out, pdf)
    console.log(`✅ PDF generated: ${out} (${pdf.length} bytes)`)
    console.log(`\nTo render: pdftoppm -png ${out} /tmp/rapor-page`)
  } catch (err: any) {
    console.log(`❌ Error: ${err.message}`)
    console.log(err.stack)
  }

  closeSqlite(sqlite)
}

main()
