import { ipcMain } from "electron"
import { getDb } from "../../src/lib/db"
import {
  mapelKelasGuru,
  mataPelajaran,
  kelas,
  guru,
  tahunAjaran,
} from "../../src/lib/db/schema"
import { eq, and, sql, inArray } from "drizzle-orm"
import { addToSyncLog } from "../../src/lib/sync/sync-queue"

/**
 * Get semua assignment untuk 1 mapel di TA tertentu.
 * Output: [{kelas_id, kelas_nama, guru_id, guru_nama, assignment_id, is_assigned}]
 * Kelas yang belum di-assign = is_assigned=false, guru_id=null.
 *
 * Dipakai di halaman "Kelola Guru Pengampu" (Step 4).
 */
ipcMain.handle("mapelAssignment:getByMapel", async (_event, { mapelId, tahunAjaranId }) => {
  try {
    const db = getDb()
    if (!mapelId || !tahunAjaranId) {
      return { error: "mapelId dan tahunAjaranId wajib diisi" }
    }
    const assignments = db
      .select()
      .from(mapelKelasGuru)
      .where(
        and(
          eq(mapelKelasGuru.mapel_id, mapelId),
          eq(mapelKelasGuru.tahun_ajaran_id, tahunAjaranId),
        ),
      )
      .all()
    const allKelas = db.select().from(kelas).all()
    const allGuru = db.select().from(guru).all()
    const guruMap = new Map(allGuru.map((g) => [g.id, g]))

    return allKelas.map((k) => {
      const a = assignments.find((x) => x.kelas_id === k.id)
      const g = a ? guruMap.get(a.guru_id) : null
      return {
        kelas_id: k.id,
        kelas_nama: k.nama_kelas,
        assignment_id: a?.id ?? null,
        guru_id: a?.guru_id ?? null,
        guru_nama: g?.nama ?? null,
        is_assigned: !!a,
      }
    })
  } catch (error: any) {
    return { error: error.message }
  }
})

/**
 * Get semua assignment untuk 1 guru di TA tertentu.
 * Output: [{mapel_id, mapel_kode, mapel_nama, kelas_id, kelas_nama}]
 */
ipcMain.handle("mapelAssignment:getByGuru", async (_event, { guruId, tahunAjaranId }) => {
  try {
    const db = getDb()
    if (!guruId || !tahunAjaranId) {
      return { error: "guruId dan tahunAjaranId wajib diisi" }
    }
    const rows = db
      .select({
        assignment_id: mapelKelasGuru.id,
        mapel_id: mataPelajaran.id,
        mapel_kode: mataPelajaran.kode_mapel,
        mapel_nama: mataPelajaran.nama_mapel,
        kelas_id: kelas.id,
        kelas_nama: kelas.nama_kelas,
      })
      .from(mapelKelasGuru)
      .innerJoin(mataPelajaran, eq(mataPelajaran.id, mapelKelasGuru.mapel_id))
      .innerJoin(kelas, eq(kelas.id, mapelKelasGuru.kelas_id))
      .where(
        and(
          eq(mapelKelasGuru.guru_id, guruId),
          eq(mapelKelasGuru.tahun_ajaran_id, tahunAjaranId),
        ),
      )
      .all()
    return rows
  } catch (error: any) {
    return { error: error.message }
  }
})

/**
 * Get semua assignment untuk 1 kelas di TA tertentu.
 * Output: [{mapel_id, mapel_kode, mapel_nama, guru_id, guru_nama}]
 */
ipcMain.handle("mapelAssignment:getByKelas", async (_event, { kelasId, tahunAjaranId }) => {
  try {
    const db = getDb()
    if (!kelasId || !tahunAjaranId) {
      return { error: "kelasId dan tahunAjaranId wajib diisi" }
    }
    const rows = db
      .select({
        assignment_id: mapelKelasGuru.id,
        mapel_id: mataPelajaran.id,
        mapel_kode: mataPelajaran.kode_mapel,
        mapel_nama: mataPelajaran.nama_mapel,
        guru_id: guru.id,
        guru_nama: guru.nama,
      })
      .from(mapelKelasGuru)
      .innerJoin(mataPelajaran, eq(mataPelajaran.id, mapelKelasGuru.mapel_id))
      .innerJoin(guru, eq(guru.id, mapelKelasGuru.guru_id))
      .where(
        and(
          eq(mapelKelasGuru.kelas_id, kelasId),
          eq(mapelKelasGuru.tahun_ajaran_id, tahunAjaranId),
        ),
      )
      .all()
    return rows
  } catch (error: any) {
    return { error: error.message }
  }
})

/**
 * Upsert: create atau update assignment untuk (mapel, kelas, TA).
 * Dipakai untuk edit per-cell di halaman admin.
 */
ipcMain.handle(
  "mapelAssignment:upsert",
  async (_event, { mapelId, kelasId, guruId, tahunAjaranId }) => {
    try {
      const db = getDb()
      if (!mapelId || !kelasId || !guruId || !tahunAjaranId) {
        return { error: "mapelId, kelasId, guruId, tahunAjaranId wajib diisi" }
      }
      // Validasi: mapel, kelas, guru exists
      const m = db.select().from(mataPelajaran).where(eq(mataPelajaran.id, mapelId)).get()
      const k = db.select().from(kelas).where(eq(kelas.id, kelasId)).get()
      const g = db.select().from(guru).where(eq(guru.id, guruId)).get()
      if (!m) return { error: "Mapel tidak ditemukan" }
      if (!k) return { error: "Kelas tidak ditemukan" }
      if (!g) return { error: "Guru tidak ditemukan" }

      const existing = db
        .select()
        .from(mapelKelasGuru)
        .where(
          and(
            eq(mapelKelasGuru.mapel_id, mapelId),
            eq(mapelKelasGuru.kelas_id, kelasId),
            eq(mapelKelasGuru.tahun_ajaran_id, tahunAjaranId),
          ),
        )
        .get()
      if (existing) {
        if (existing.guru_id === guruId) {
          return { success: true, id: existing.id, unchanged: true }
        }
        db.update(mapelKelasGuru)
          .set({ guru_id: guruId })
          .where(eq(mapelKelasGuru.id, existing.id))
          .run()
        addToSyncLog("mapel_kelas_guru", existing.id, "update")
        return { success: true, id: existing.id, changed: true }
      }
      const result = db
        .insert(mapelKelasGuru)
        .values({
          mapel_id: mapelId,
          kelas_id: kelasId,
          guru_id: guruId,
          tahun_ajaran_id: tahunAjaranId,
        }).returning().get()
      const id = result.id
      addToSyncLog("mapel_kelas_guru", id, "insert")
      return { success: true, id }
    } catch (error: any) {
      return { error: error.message }
    }
  },
)

/**
 * Bulk upsert: simpan banyak assignment sekaligus untuk 1 mapel di 1 TA.
 * assignments: [{kelas_id, guru_id}]
 *
 * Untuk hapus assignment, kirim guru_id = null (delete row).
 */
ipcMain.handle(
  "mapelAssignment:bulkUpsert",
  async (_event, { mapelId, tahunAjaranId, assignments }) => {
    try {
      const db = getDb()
      if (!mapelId || !tahunAjaranId || !Array.isArray(assignments)) {
        return { error: "mapelId, tahunAjaranId, assignments[] wajib diisi" }
      }

      let inserted = 0
      let updated = 0
      let deleted = 0

      for (const a of assignments) {
        if (!a.kelas_id) continue
        const existing = db
          .select()
          .from(mapelKelasGuru)
          .where(
            and(
              eq(mapelKelasGuru.mapel_id, mapelId),
              eq(mapelKelasGuru.kelas_id, a.kelas_id),
              eq(mapelKelasGuru.tahun_ajaran_id, tahunAjaranId),
            ),
          )
          .get()

        if (!a.guru_id) {
          // guru_id null = hapus assignment
          if (existing) {
            db.delete(mapelKelasGuru).where(eq(mapelKelasGuru.id, existing.id)).run()
            addToSyncLog("mapel_kelas_guru", existing.id, "delete")
            deleted++
          }
          continue
        }

        if (existing) {
          if (existing.guru_id !== a.guru_id) {
            db.update(mapelKelasGuru)
              .set({ guru_id: a.guru_id })
              .where(eq(mapelKelasGuru.id, existing.id))
              .run()
            addToSyncLog("mapel_kelas_guru", existing.id, "update")
            updated++
          }
        } else {
          const result = db
            .insert(mapelKelasGuru)
            .values({
              mapel_id: mapelId,
              kelas_id: a.kelas_id,
              guru_id: a.guru_id,
              tahun_ajaran_id: tahunAjaranId,
            }).returning().get()
          addToSyncLog(
            "mapel_kelas_guru",
            result.id,
            "insert",
          )
          inserted++
        }
      }
      return { success: true, inserted, updated, deleted }
    } catch (error: any) {
      return { error: error.message }
    }
  },
)

/**
 * Delete assignment by id.
 */
ipcMain.handle("mapelAssignment:delete", async (_event, id) => {
  try {
    const db = getDb()
    if (!id) return { error: "id wajib diisi" }
    const existing = db.select().from(mapelKelasGuru).where(eq(mapelKelasGuru.id, id)).get()
    if (!existing) return { success: true, notFound: true }
    db.delete(mapelKelasGuru).where(eq(mapelKelasGuru.id, id)).run()
    addToSyncLog("mapel_kelas_guru", id, "delete")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

/**
 * Get list master guru (untuk dropdown di UI).
 */
ipcMain.handle("mapelAssignment:getGuruList", async () => {
  try {
    const db = getDb()
    return db
      .select({ id: guru.id, nama: guru.nama, nip: guru.nip, bidang_studi: guru.bidang_studi })
      .from(guru)
      .orderBy(guru.nama)
      .all()
  } catch (error: any) {
    return { error: error.message }
  }
})
