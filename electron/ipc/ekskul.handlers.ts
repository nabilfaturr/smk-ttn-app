import { ipcMain } from "electron"
import { getDb } from "../../src/lib/db"
import {
  ekskul,
  nilaiEkskul,
  siswa,
  kelas as kelasTable,
  tahunAjaran,
  syncLog,
} from "../../src/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { addToSyncLog } from "../../src/lib/sync/sync-queue"

/**
 * List semua master ekskul (7: Ketarunaan + 6 pilihan).
 * Sorted: wajib duluan (Ketarunaan), lalu abjad.
 */
ipcMain.handle("ekskul:getAll", async () => {
  try {
    const db = getDb()
    const list = db.select().from(ekskul).all()
    return list.sort((a, b) => {
      if (a.wajib !== b.wajib) return b.wajib - a.wajib
      return a.nama.localeCompare(b.nama)
    })
  } catch (error: any) {
    return { error: error.message }
  }
})

/**
 * Ambil enrollment ekskul untuk satu kelas.
 * Return: [{ siswa_id, nama, enrolled_ekskul_ids: number[] }]
 */
ipcMain.handle("ekskul-siswa:getByKelas", async (_event, { kelasId, tahunAjaranId }) => {
  try {
    const db = getDb()
    const siswaList = db
      .select()
      .from(siswa)
      .where(and(eq(siswa.kelas_id, kelasId), eq(siswa.status, "aktif")))
      .all()

    const siswaIds = siswaList.map((s) => s.id)
    if (siswaIds.length === 0) return []

    const enrollments = db
      .select()
      .from(nilaiEkskul)
      .where(
        and(
          inArray(nilaiEkskul.siswa_id, siswaIds),
          eq(nilaiEkskul.tahun_ajaran_id, tahunAjaranId),
        ),
      )
      .all()

    return siswaList.map((s) => ({
      siswa_id: s.id,
      nama: s.nama,
      nis: s.nis,
      enrolled_ekskul_ids: enrollments
        .filter((e) => e.siswa_id === s.id)
        .map((e) => e.ekskul_id),
    }))
  } catch (error: any) {
    return { error: error.message }
  }
})

/**
 * Enroll siswa ke ekskul (idempotent: skip kalau sudah enrolled).
 * tahunAjaranId WAJIB ada.
 */
ipcMain.handle("ekskul-siswa:enroll", async (_event, { siswaId, ekskulId, tahunAjaranId }) => {
  try {
    const db = getDb()
    if (!siswaId || !ekskulId || !tahunAjaranId) {
      return { error: "siswaId, ekskulId, dan tahunAjaranId wajib diisi" }
    }

    // Cek siswa aktif
    const s = db.select().from(siswa).where(eq(siswa.id, siswaId)).get()
    if (!s) return { error: "Siswa tidak ditemukan" }
    if (s.status !== "aktif") return { error: "Siswa tidak aktif, tidak bisa enroll" }

    // Cek ekskul exists
    const e = db.select().from(ekskul).where(eq(ekskul.id, ekskulId)).get()
    if (!e) return { error: "Ekskul tidak ditemukan" }

    // Idempotent: cek existing
    const existing = db
      .select()
      .from(nilaiEkskul)
      .where(
        and(
          eq(nilaiEkskul.siswa_id, siswaId),
          eq(nilaiEkskul.ekskul_id, ekskulId),
          eq(nilaiEkskul.tahun_ajaran_id, tahunAjaranId),
        ),
      )
      .get()
    if (existing) return { success: true, id: existing.id, alreadyEnrolled: true }

    const result = db
      .insert(nilaiEkskul)
      .values({
        siswa_id: siswaId,
        ekskul_id: ekskulId,
        tahun_ajaran_id: tahunAjaranId,
        predikat: "A",
        keterangan: null,
      }).returning().get()
    const id = result.id
    addToSyncLog("nilai_ekskul", id, "insert")
    return { success: true, id }
  } catch (error: any) {
    return { error: error.message }
  }
})

/**
 * Unenroll siswa dari ekskul.
 * - Wajib ekskul (Ketarunaan) TIDAK boleh di-unenroll.
 */
ipcMain.handle("ekskul-siswa:unenroll", async (_event, { siswaId, ekskulId, tahunAjaranId }) => {
  try {
    const db = getDb()
    if (!siswaId || !ekskulId || !tahunAjaranId) {
      return { error: "siswaId, ekskulId, dan tahunAjaranId wajib diisi" }
    }

    // Cek ekskul wajib → blok
    const e = db.select().from(ekskul).where(eq(ekskul.id, ekskulId)).get()
    if (!e) return { error: "Ekskul tidak ditemukan" }
    if (e.wajib === 1) {
      return { error: `Ekskul "${e.nama}" wajib dan tidak bisa dihapus` }
    }

    const existing = db
      .select()
      .from(nilaiEkskul)
      .where(
        and(
          eq(nilaiEkskul.siswa_id, siswaId),
          eq(nilaiEkskul.ekskul_id, ekskulId),
          eq(nilaiEkskul.tahun_ajaran_id, tahunAjaranId),
        ),
      )
      .get()
    if (!existing) return { success: true, notFound: true }

    db.delete(nilaiEkskul).where(eq(nilaiEkskul.id, existing.id)).run()
    addToSyncLog("nilai_ekskul", existing.id, "delete")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

/**
 * Bulk enroll: tambah banyak siswa sekaligus ke satu ekskul.
 * Idempotent per siswa.
 */
ipcMain.handle("ekskul-siswa:enrollBulk", async (_event, { siswaIds, ekskulId, tahunAjaranId }) => {
  try {
    const db = getDb()
    if (!Array.isArray(siswaIds) || siswaIds.length === 0) {
      return { error: "siswaIds wajib array tidak kosong" }
    }
    if (!ekskulId || !tahunAjaranId) {
      return { error: "ekskulId dan tahunAjaranId wajib diisi" }
    }

    const e = db.select().from(ekskul).where(eq(ekskul.id, ekskulId)).get()
    if (!e) return { error: "Ekskul tidak ditemukan" }

    let enrolled = 0
    let skipped = 0
    for (const siswaId of siswaIds) {
      const existing = db
        .select()
        .from(nilaiEkskul)
        .where(
          and(
            eq(nilaiEkskul.siswa_id, siswaId),
            eq(nilaiEkskul.ekskul_id, ekskulId),
            eq(nilaiEkskul.tahun_ajaran_id, tahunAjaranId),
          ),
        )
        .get()
      if (existing) {
        skipped++
        continue
      }
      const result = db
        .insert(nilaiEkskul)
        .values({
          siswa_id: siswaId,
          ekskul_id: ekskulId,
          tahun_ajaran_id: tahunAjaranId,
          predikat: "A",
          keterangan: null,
        }).returning().get()
      addToSyncLog("nilai_ekskul", result.id, "insert")
      enrolled++
    }
    return { success: true, enrolled, skipped }
  } catch (error: any) {
    return { error: error.message }
  }
})
