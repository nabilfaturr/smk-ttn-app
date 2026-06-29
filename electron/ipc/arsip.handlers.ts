/**
 * Arsip handlers - akses data historis TA non-aktif.
 *
 * Tujuan: admin bisa lihat summary + siswa di TA lama (untuk cetak ulang
 * rapor, verifikasi, dll). Read-only — tidak ada create/update/delete.
 *
 * Data TIDAK di-mutate, hanya query. Aman untuk free access.
 */

import { ipcMain } from "electron"
import { getDb } from "../../src/lib/db"
import {
  kelas as kelasTable,
  siswa,
  mataPelajaran as mataPelajaranTable,
  mapelKelasGuru,
  tahunAjaran,
} from "../../src/lib/db/schema"
import { and, eq } from "drizzle-orm"

ipcMain.handle("arsip:getSummary", async (_event, tahunAjaranId: number) => {
  try {
    const db = getDb()

    // Total kelas di TA tsb
    const kelasRows = await db
      .select({ id: kelasTable.id })
      .from(kelasTable)
      .where(eq(kelasTable.tahun_ajaran_id, tahunAjaranId))
      .all()
    const totalKelas = kelasRows.length

    // Total siswa aktif di kelas-kelas tsb
    const kelasIds = new Set(kelasRows.map((k) => k.id))
    const allSiswaAktif = await db
      .select({ id: siswa.id, kelas_id: siswa.kelas_id })
      .from(siswa)
      .where(eq(siswa.status, "aktif"))
      .all()
    const totalSiswa = allSiswaAktif.filter((s) => s.kelas_id != null && kelasIds.has(s.kelas_id)).length

    // Total mapel reguler (mapel adalah global, tidak per TA)
    const totalMapel = await db
      .select({ id: mataPelajaranTable.id })
      .from(mataPelajaranTable)
      .where(eq(mataPelajaranTable.jenis, "reguler"))
      .all()
      .then((rows) => rows.length)

    // Total guru pengampu (guru yang punya assignment di TA tsb)
    const totalGuru = await db
      .select({ guru_id: mapelKelasGuru.guru_id })
      .from(mapelKelasGuru)
      .where(eq(mapelKelasGuru.tahun_ajaran_id, tahunAjaranId))
      .all()
      .then((rows) => new Set(rows.map((r) => r.guru_id)).size)

    return {
      success: true,
      summary: {
        totalKelas,
        totalSiswa,
        totalMapel,
        totalGuru,
      },
    }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("arsip:getSiswaList", async (_event, tahunAjaranId: number) => {
  try {
    const db = getDb()
    // Get kelas di TA tsb (include program_keahlian untuk kolom "Jurusan" di tabel)
    const kelasRows = await db
      .select({
        id: kelasTable.id,
        nama_kelas: kelasTable.nama_kelas,
        program_keahlian: kelasTable.program_keahlian,
      })
      .from(kelasTable)
      .where(eq(kelasTable.tahun_ajaran_id, tahunAjaranId))
      .all()
    const kelasById = new Map(kelasRows.map((k) => [k.id, k]))

    // Get all siswa aktif, lalu filter by kelas
    const allSiswa = await db
      .select()
      .from(siswa)
      .where(eq(siswa.status, "aktif"))
      .all()

    const siswaInTa = allSiswa
      .filter((s) => s.kelas_id != null && kelasById.has(s.kelas_id))
      .map((s) => ({
        ...s,
        kelas: kelasById.get(s.kelas_id!) ?? null,
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama))

    return { success: true, siswa: siswaInTa }
  } catch (error: any) {
    return { error: error.message }
  }
})
