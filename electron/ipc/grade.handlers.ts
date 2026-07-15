import { ipcMain } from "electron"
import { getDb } from "../../src/lib/db"
import {
  tujuanPembelajaran,
  nilai,
  nilaiTp,
  nilaiPrakerin,
  absensiPrakerin,
  nilaiKokurikuler,
  subdimensiP5,
  dimensiP5,
  subdimensiP5Tingkat,
  kelas as kelasTable,
  catatanWaliKelas,
  siswa,
  konfigurasi,
  syncLog,
} from "../../src/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { calculateNilaiRapor, calculateNilaiRaporPrakerin, generateDeskripsiTP, generateNarasiKokurikuler } from "../../src/lib/calculations/grades"
import { addToSyncLog } from "../../src/lib/sync/sync-queue"

// === Tujuan Pembelajaran ===
ipcMain.handle("tp:create", async (_event, data) => {
  try {
    const db = getDb()
    const result = db.insert(tujuanPembelajaran).values(data).returning().get()
    const id = result.id
    addToSyncLog("tujuan_pembelajaran", id, "insert")
    return { success: true, id }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("tp:update", async (_event, { id, data }) => {
  try {
    const db = getDb()
    db.update(tujuanPembelajaran).set(data).where(eq(tujuanPembelajaran.id, id)).run()
    addToSyncLog("tujuan_pembelajaran", id, "update")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("tp:delete", async (_event, id) => {
  try {
    const db = getDb()
    const related = db.select({ id: nilaiTp.id }).from(nilaiTp).where(eq(nilaiTp.tpId, id)).all()
    for (const r of related) {
      db.delete(nilaiTp).where(eq(nilaiTp.id, r.id)).run()
      addToSyncLog("nilai_tp", r.id, "delete")
    }
    db.delete(tujuanPembelajaran).where(eq(tujuanPembelajaran.id, id)).run()
    addToSyncLog("tujuan_pembelajaran", id, "delete")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("tp:getByMapel", async (_event, { mapelId, tahunAjaranId }) => {
  try {
    const db = getDb()
    if (tahunAjaranId != null) {
      return db
        .select()
        .from(tujuanPembelajaran)
        .where(
          and(
            eq(tujuanPembelajaran.mapel_id, mapelId),
            eq(tujuanPembelajaran.tahun_ajaran_id, tahunAjaranId),
          ),
        )
        .all()
    }
    return db
      .select()
      .from(tujuanPembelajaran)
      .where(eq(tujuanPembelajaran.mapel_id, mapelId))
      .all()
  } catch (error: any) {
    return { error: error.message }
  }
})

// === Nilai Reguler ===
ipcMain.handle("grade:getByMapelAndClass", async (_event, { mapelId, kelasId, tahunAjaranId }) => {
  try {
    const db = getDb()
    const siswaList = db.select().from(siswa).where(and(eq(siswa.kelas_id, kelasId), eq(siswa.status, "aktif"))).all()
    const tpList = db.select().from(tujuanPembelajaran).where(eq(tujuanPembelajaran.mapel_id, mapelId)).all()

    return siswaList.map((s) => {
      const n = db
        .select()
        .from(nilai)
        .where(and(eq(nilai.siswa_id, s.id), eq(nilai.mapel_id, mapelId), eq(nilai.tahun_ajaran_id, tahunAjaranId)))
        .get()
      const tpCapaian = n
        ? db
            .select()
            .from(nilaiTp)
            .where(eq(nilaiTp.nilai_id, n.id))
            .all()
            .map((nt) => {
              const tp = tpList.find((t) => t.id === nt.tp_id)
              return { tp_id: nt.tp_id, kode_tp: tp?.kode_tp ?? "", capaian: nt.capaian as "T" | "R" }
            })
        : []

      return {
        siswa_id: s.id,
        nama: s.nama,
        nilai_id: n?.id ?? null,
        nilai_formatif: n?.nilai_formatif ?? null,
        nilai_sumatif: n?.nilai_sumatif ?? null,
        nilai_rapor: n?.nilai_rapor ?? null,
        deskripsi: n?.deskripsi ?? "",
        tp_capaian: tpCapaian,
      }
    })
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("grade:save", async (_event, data) => {
  try {
    const db = getDb()
    const { siswaId, mapelId, tahunAjaranId, nilaiFormatif, nilaiSumatif, tpCapaian } = data

    const cfgF = db.select().from(konfigurasi).where(eq(konfigurasi.kunci, "BOBOT_FORMATIF")).get()
    const cfgS = db.select().from(konfigurasi).where(eq(konfigurasi.kunci, "BOBOT_SUMATIF")).get()
    const bobotF = cfgF ? parseFloat(cfgF.nilai) : 0.4
    const bobotS = cfgS ? parseFloat(cfgS.nilai) : 0.6
    const nilaiRapor = calculateNilaiRapor(nilaiFormatif, nilaiSumatif, bobotF, bobotS)

    const tpList = db.select().from(tujuanPembelajaran).where(eq(tujuanPembelajaran.mapel_id, mapelId)).all()
    const tpDeskripsi = tpCapaian
      ? tpCapaian.map((tc: any) => {
          const tp = tpList.find((t) => t.id === tc.tp_id)
          return { kode_tp: tp?.kode_tp ?? "", capaian: tc.capaian as "T" | "R", deskripsi_tuntas: tp?.deskripsi_tuntas ?? "", deskripsi_remediasi: tp?.deskripsi_remediasi ?? "" }
        })
      : []
    const deskripsi = generateDeskripsiTP(tpDeskripsi)

    const existing = db
      .select()
      .from(nilai)
      .where(and(eq(nilai.siswa_id, siswaId), eq(nilai.mapel_id, mapelId), eq(nilai.tahun_ajaran_id, tahunAjaranId)))
      .get()

    if (existing) {
      db.update(nilai)
        .set({ nilai_formatif: nilaiFormatif, nilai_sumatif: nilaiSumatif, nilai_rapor: nilaiRapor, deskripsi })
        .where(eq(nilai.id, existing.id))
        .run()
      addToSyncLog("nilai", existing.id, "update")
      if (tpCapaian) {
        db.delete(nilaiTp).where(eq(nilaiTp.nilai_id, existing.id)).run()
        for (const tc of tpCapaian) {
          const tpResult = db.insert(nilaiTp).values({ nilai_id: existing.id, tp_id: tc.tp_id, capaian: tc.capaian }).returning().get()
          addToSyncLog("nilai_tp", tpResult.id, "insert")
        }
      }
    } else {
      const result = db
        .insert(nilai)
        .values({ siswa_id: siswaId, mapel_id: mapelId, tahun_ajaran_id: tahunAjaranId, nilai_formatif: nilaiFormatif, nilai_sumatif: nilaiSumatif, nilai_rapor: nilaiRapor, deskripsi }).returning().get()
      const newId = result.id
      addToSyncLog("nilai", newId, "insert")
      if (tpCapaian) {
        for (const tc of tpCapaian) {
          const tpResult = db.insert(nilaiTp).values({ nilai_id: newId, tp_id: tc.tp_id, capaian: tc.capaian }).returning().get()
          addToSyncLog("nilai_tp", tpResult.id, "insert")
        }
      }
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

// === Nilai Prakerin ===
ipcMain.handle("grade:getPrakerin", async (_event, { siswaId, tahunAjaranId }) => {
  try {
    const db = getDb()
    const n = db.select().from(nilaiPrakerin).where(and(eq(nilaiPrakerin.siswa_id, siswaId), eq(nilaiPrakerin.tahun_ajaran_id, tahunAjaranId))).get()
    const abs = db.select().from(absensiPrakerin).where(and(eq(absensiPrakerin.siswa_id, siswaId), eq(absensiPrakerin.tahun_ajaran_id, tahunAjaranId))).get()
    return { nilai: n ?? null, absensi: abs ?? { sakit: 0, izin: 0, tanpa_keterangan: 0 } }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("grade:savePrakerin", async (_event, data) => {
  try {
    const db = getDb()
    const { siswaId, tahunAjaranId, tpl, sl, sk, absensi: abs, ...rest } = data
    const nilaiRapor = calculateNilaiRaporPrakerin(tpl, sl, sk)

    const existing = db.select().from(nilaiPrakerin).where(and(eq(nilaiPrakerin.siswa_id, siswaId), eq(nilaiPrakerin.tahun_ajaran_id, tahunAjaranId))).get()
    if (existing) {
      db.update(nilaiPrakerin).set({ ...rest, tpl, sl, sk, nilai_rapor: nilaiRapor }).where(eq(nilaiPrakerin.id, existing.id)).run()
      addToSyncLog("nilai_prakerin", existing.id, "update")
    } else {
      const result = db.insert(nilaiPrakerin).values({ siswa_id: siswaId, tahun_ajaran_id: tahunAjaranId, ...rest, tpl, sl, sk, nilai_rapor: nilaiRapor }).returning().get()
      addToSyncLog("nilai_prakerin", result.id, "insert")
    }

    const absExisting = db.select().from(absensiPrakerin).where(and(eq(absensiPrakerin.siswa_id, siswaId), eq(absensiPrakerin.tahun_ajaran_id, tahunAjaranId))).get()
    if (absExisting) {
      db.update(absensiPrakerin).set(abs).where(eq(absensiPrakerin.id, absExisting.id)).run()
      addToSyncLog("absensi_prakerin", absExisting.id, "update")
    } else {
      const result = db.insert(absensiPrakerin).values({ siswa_id: siswaId, tahun_ajaran_id: tahunAjaranId, ...abs }).returning().get()
      addToSyncLog("absensi_prakerin", result.id, "insert")
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

// === Ketarunaan (DEPRECATED — moved to ekskul.handlers.ts) ===
// Handler ini di-keep sebagai no-op agar UI lama tidak crash jika masih dipanggil.
// Akan dihapus pada rilis berikutnya.

// === Ekskul (DEPRECATED — moved to ekskul.handlers.ts) ===
// Handler ini di-keep sebagai no-op agar UI lama tidak crash jika masih dipanggil.
// Akan dihapus pada rilis berikutnya.

// === Kokurikuler ===
ipcMain.handle("grade:getKokurikuler", async (_event, { siswaId, tahunAjaranId }) => {
  try {
    const db = getDb()
    // Cari tingkat siswa via kelas
    const s = db.select().from(siswa).where(eq(siswa.id, siswaId)).get()
    const k = s?.kelas_id ? db.select().from(kelasTable).where(eq(kelasTable.id, s.kelas_id)).get() : null
    const tingkat = k?.tingkat
    // Ambil subdimensi aktif untuk tingkat ini
    const activeSubIds = tingkat != null
      ? db.select().from(subdimensiP5Tingkat).where(eq(subdimensiP5Tingkat.tingkat, tingkat)).all().map((t) => t.subdimensi_id)
      : db.select().from(subdimensiP5).all().map((sd) => sd.id)
    const dims = db.select().from(dimensiP5).all()
    const subdims = db.select().from(subdimensiP5).all().filter((sd) => activeSubIds.includes(sd.id))
    const values = db.select().from(nilaiKokurikuler).where(and(eq(nilaiKokurikuler.siswa_id, siswaId), eq(nilaiKokurikuler.tahun_ajaran_id, tahunAjaranId))).all()
    return dims.map((d) => ({
      dimensi_id: d.id,
      nama: d.nama,
      subdimensi: subdims.filter((sd) => sd.dimensi_id === d.id).map((sd) => {
        const v = values.find((nv) => nv.subdimensi_id === sd.id)
        return { subdimensi_id: sd.id, nama: sd.nama, grade: v?.grade ?? null, deskripsi_berkembang: sd.deskripsi_berkembang ?? "", deskripsi_cakap: sd.deskripsi_cakap ?? "", deskripsi_mahir: sd.deskripsi_mahir ?? "" }
      }),
    }))
  } catch (error: any) {
    return { error: error.message }
  }
})

/**
 * Bulk fetch: ambil SEMUA nilai kokurikuler untuk 1 kelas + 1 tahun ajaran
 * dalam 1 query (join nilai_kokurikuler dengan siswa by kelas_id).
 *
 * Return shape:
 * {
 *   dimensi: [...],          // dimensi + subdimensi structure (sama dengan getBySiswa)
 *   grades: {               // Map key: `${siswaId}-${subdimensiId}` → grade (1|2|3|null)
 *     "1-1": 2,
 *     "1-2": 3,
 *     ...
 *   }
 * }
 *
 * Lebih cepat dari N parallel calls karena:
 * - 1 IPC call (sebelumnya 30 calls untuk 30 siswa)
 * - 1 SQL query dengan join (sebelumnya 30 queries)
 */
ipcMain.handle("kokurikuler:getByKelas", async (_event, { kelasId, tahunAjaranId }) => {
  try {
    const db = getDb()
    // Cari tingkat kelas
    const k = db.select().from(kelasTable).where(eq(kelasTable.id, kelasId)).get()
    const tingkat = k?.tingkat
    // Ambil subdimensi aktif untuk tingkat ini
    const activeSubIds = tingkat != null
      ? db.select().from(subdimensiP5Tingkat).where(eq(subdimensiP5Tingkat.tingkat, tingkat)).all().map((t) => t.subdimensi_id)
      : db.select().from(subdimensiP5).all().map((sd) => sd.id)
    const dims = db.select().from(dimensiP5).all()
    const subdimsAll = db.select().from(subdimensiP5).all()
    const subdims = subdimsAll.filter((sd) => activeSubIds.includes(sd.id))
    // JOIN siswa + nilai_kokurikuler dalam 1 query
    const rows = db
      .select({
        siswa_id: nilaiKokurikuler.siswa_id,
        subdimensi_id: nilaiKokurikuler.subdimensi_id,
        grade: nilaiKokurikuler.grade,
      })
      .from(nilaiKokurikuler)
      .innerJoin(siswa, eq(nilaiKokurikuler.siswa_id, siswa.id))
      .where(and(eq(siswa.kelas_id, kelasId), eq(nilaiKokurikuler.tahun_ajaran_id, tahunAjaranId)))
      .all()
    const grades: Record<string, number> = {}
    for (const r of rows) {
      if (r.grade != null) {
        grades[`${r.siswa_id}-${r.subdimensi_id}`] = r.grade
      }
    }
    return {
      dimensi: dims
        .map((d) => ({
          dimensi_id: d.id,
          nama: d.nama,
          subdimensi: subdims.filter((sd) => sd.dimensi_id === d.id),
        }))
        .filter((d) => d.subdimensi.length > 0),
      grades,
    }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("grade:saveKokurikuler", async (_event, data) => {
  try {
    const db = getDb()
    const { siswaId, tahunAjaranId, grades } = data
    for (const g of grades) {
      const existing = db.select().from(nilaiKokurikuler).where(and(eq(nilaiKokurikuler.siswa_id, siswaId), eq(nilaiKokurikuler.subdimensi_id, g.subdimensiId), eq(nilaiKokurikuler.tahun_ajaran_id, tahunAjaranId))).get()
      if (existing) {
        if (g.grade) {
          db.update(nilaiKokurikuler).set({ grade: g.grade }).where(eq(nilaiKokurikuler.id, existing.id)).run()
          addToSyncLog("nilai_kokurikuler", existing.id, "update")
        } else {
          db.delete(nilaiKokurikuler).where(eq(nilaiKokurikuler.id, existing.id)).run()
          addToSyncLog("nilai_kokurikuler", existing.id, "delete")
        }
      } else if (g.grade) {
        const result = db.insert(nilaiKokurikuler).values({ siswa_id: siswaId, subdimensi_id: g.subdimensiId, tahun_ajaran_id: tahunAjaranId, grade: g.grade }).returning().get()
        addToSyncLog("nilai_kokurikuler", result.id, "insert")
      }
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

// === Kelola Kokurikuler per Tingkat (admin) ===

ipcMain.handle("kokurikuler:getSubdimensiTingkat", async () => {
  try {
    const db = getDb()
    const dims = db.select().from(dimensiP5).all()
    const subdims = db.select().from(subdimensiP5).all()
    const tingkatRows = db.select().from(subdimensiP5Tingkat).all()
    const tingkatMap = new Set(tingkatRows.map((t) => `${t.subdimensi_id}-${t.tingkat}`))
    return dims.map((d) => ({
      dimensi_id: d.id,
      nama: d.nama,
      subdimensi: subdims.filter((sd) => sd.dimensi_id === d.id).map((sd) => ({
        subdimensi_id: sd.id,
        nama: sd.nama,
        tingkat_10: tingkatMap.has(`${sd.id}-10`),
        tingkat_11: tingkatMap.has(`${sd.id}-11`),
        tingkat_12: tingkatMap.has(`${sd.id}-12`),
      })),
    }))
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("kokurikuler:toggleSubdimensiTingkat", async (_event, { subdimensiId, tingkat, active }) => {
  try {
    const db = getDb()
    if (active) {
      const existing = db.select().from(subdimensiP5Tingkat)
        .where(and(eq(subdimensiP5Tingkat.subdimensi_id, subdimensiId), eq(subdimensiP5Tingkat.tingkat, tingkat))).get()
      if (!existing) {
        const result = db.insert(subdimensiP5Tingkat).values({ subdimensi_id: subdimensiId, tingkat }).returning().get()
        addToSyncLog("subdimensi_p5_tingkat", result.id, "insert")
      }
    } else {
      const existing = db.select().from(subdimensiP5Tingkat)
        .where(and(eq(subdimensiP5Tingkat.subdimensi_id, subdimensiId), eq(subdimensiP5Tingkat.tingkat, tingkat))).get()
      if (existing) {
        db.delete(subdimensiP5Tingkat).where(eq(subdimensiP5Tingkat.id, existing.id)).run()
        addToSyncLog("subdimensi_p5_tingkat", existing.id, "delete")
      }
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

// === Catatan Wali Kelas ===
ipcMain.handle("teacherNote:save", async (_event, data) => {
  try {
    const db = getDb()
    const { siswaId, tahunAjaranId, catatan } = data
    const existing = db.select().from(catatanWaliKelas).where(and(eq(catatanWaliKelas.siswa_id, siswaId), eq(catatanWaliKelas.tahun_ajaran_id, tahunAjaranId))).get()
    if (existing) {
      db.update(catatanWaliKelas).set({ catatan }).where(eq(catatanWaliKelas.id, existing.id)).run()
      addToSyncLog("catatan_wali_kelas", existing.id, "update")
    } else {
      const result = db.insert(catatanWaliKelas).values({ siswa_id: siswaId, tahun_ajaran_id: tahunAjaranId, catatan }).returning().get()
      addToSyncLog("catatan_wali_kelas", result.id, "insert")
    }
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
})

ipcMain.handle("teacherNote:getBySiswa", async (_event, { siswaId, tahunAjaranId }) => {
  try {
    const db = getDb()
    return db.select().from(catatanWaliKelas).where(and(eq(catatanWaliKelas.siswa_id, siswaId), eq(catatanWaliKelas.tahun_ajaran_id, tahunAjaranId))).get() ?? null
  } catch (error: any) {
    return { error: error.message }
  }
})
