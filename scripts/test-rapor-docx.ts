import { initDatabase, getDb } from "../src/lib/db"
import { siswa, kelas, tahunAjaran } from "../src/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { generateRaporDocx } from "../src/lib/pdf/rapor-docx"
import fs from "fs"

function main() {
  initDatabase()
  const db = getDb()

  const k = db.select().from(kelas).where(eq(kelas.nama_kelas, "XII RPL")).get()!
  const sList = db.select().from(siswa).where(and(eq(siswa.kelas_id, k.id), eq(siswa.status, "aktif"))).all()
  const s = sList[0]
  const ta = db.select().from(tahunAjaran).where(eq(tahunAjaran.is_active, 1)).get()!

  console.log(`Generating rapor for: ${s.nama} (${s.nis}), kelas: ${k.nama_kelas}, TA: ${ta.nama}`)
  console.log(`Siswa count in XII RPL: ${sList.length}`)

  try {
    const docx = generateRaporDocx(s.id, k.id, ta.id)
    const outPath = "/tmp/test-rapor.docx"
    fs.writeFileSync(outPath, docx)
    console.log(`✅ Rapor saved to ${outPath} (${docx.length} bytes)`)
  } catch (err: any) {
    console.error("❌ Error:", err.message)
    console.error(err.stack)
  }
}

main()
