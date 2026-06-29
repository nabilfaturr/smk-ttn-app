/**
 * Quick verification script untuk cek data hasil seed.
 * Run: tsx scripts/seed/verify.ts
 */

import { openDatabase, closeSqlite } from "./connection"
import { sql } from "drizzle-orm"

function main() {
  const { db, sqlite } = openDatabase()

  console.log("\n📊 DB Summary:\n")

  const tables = [
    "users",
    "guru",
    "tahun_ajaran",
    "kelas",
    "mata_pelajaran",
    "siswa",
    "ekskul",
    "dimensi_p5",
    "subdimensi_p5",
    "tujuan_pembelajaran",
    "absensi",
    "nilai",
    "nilai_ekskul",
    "nilai_kokurikuler",
    "nilai_prakerin",
    "absensi_prakerin",
    "catatan_wali_kelas",
    "info_sekolah",
    "konfigurasi",
  ]

  for (const table of tables) {
    const result = sqlite.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }
    console.log(`  ${table.padEnd(25)} ${String(result.c).padStart(5)} rows`)
  }

  // Sample data
  console.log("\n📋 Sample data:\n")
  const kelasXIIRPL = sqlite
    .prepare("SELECT id, nama_kelas, tingkat, program_keahlian FROM kelas WHERE nama_kelas = 'XII RPL'")
    .get()
  console.log("Kelas XII RPL:", kelasXIIRPL)

  const siswaXIIRPL = sqlite
    .prepare("SELECT nis, nama, jenis_kelamin, agama FROM siswa WHERE kelas_id = ? LIMIT 5")
    .all((kelasXIIRPL as any).id)
  console.log("Sample siswa XII RPL:", siswaXIIRPL)

  const nilaiXIIRPL = sqlite
    .prepare(`
      SELECT s.nama, mp.nama_mapel, n.nilai_formatif, n.nilai_sumatif, n.nilai_rapor
      FROM nilai n
      JOIN siswa s ON n.siswa_id = s.id
      JOIN mata_pelajaran mp ON n.mapel_id = mp.id
      WHERE s.kelas_id = ?
      ORDER BY s.nama, mp.nama_mapel
      LIMIT 10
    `)
    .all((kelasXIIRPL as any).id)
  console.log("\nSample nilai XII RPL (10 rows):")
  for (const n of nilaiXIIRPL as any[]) {
    console.log(
      `  ${n.nama.padEnd(25)} | ${n.nama_mapel.padEnd(30)} | F=${n.nilai_formatif} S=${n.nilai_sumatif} R=${n.nilai_rapor}`,
    )
  }

  // Cek ranking-ready: apakah ada kelas XII dengan nilai lengkap
  const rankingReady = sqlite
    .prepare(`
      SELECT k.nama_kelas, COUNT(DISTINCT s.id) AS siswa_count, COUNT(n.id) AS nilai_count
      FROM kelas k
      JOIN siswa s ON s.kelas_id = k.id
      LEFT JOIN nilai n ON n.siswa_id = s.id
      WHERE k.tingkat = 12
      GROUP BY k.id
      ORDER BY k.nama_kelas
    `)
    .all()
  console.log("\n🏆 Ranking-ready (XII kelas):")
  for (const r of rankingReady as any[]) {
    console.log(
      `  ${r.nama_kelas.padEnd(15)} | ${r.siswa_count} siswa | ${r.nilai_count} nilai records`,
    )
  }

  closeSqlite(sqlite)
}

main()
