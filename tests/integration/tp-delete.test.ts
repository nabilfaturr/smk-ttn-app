import { describe, it, expect, beforeEach } from "vitest"
import { eq } from "drizzle-orm"
import { createTestDb, seedMinimal, type TestDB } from "./helpers/db"
import * as schema from "@/lib/db/schema"

describe("TP Delete with Cascade", () => {
  let db: TestDB
  let seed: ReturnType<typeof seedMinimal>

  beforeEach(() => {
    db = createTestDb()
    seed = seedMinimal(db)
  })

  it("hapus TP tanpa nilai_tp (no-op cascade) harus sukses", () => {
    const tp = db
      .insert(schema.tujuanPembelajaran)
      .values({
        mapel_id: seed.mapelId,
        kode_tp: "TP-01",
        deskripsi_tuntas: "Test",
        deskripsi_remediasi: "Test",
        tahun_ajaran_id: seed.tahunAjaranId,
      })
      .returning()
      .all()

    // Cascade: delete terkait nilai_tp dulu (tidak ada)
    const related = db.select({ id: schema.nilaiTp.id }).from(schema.nilaiTp).where(eq(schema.nilaiTp.tpId, tp[0].id)).all()
    expect(related).toHaveLength(0)

    for (const r of related) {
      db.delete(schema.nilaiTp).where(eq(schema.nilaiTp.id, r.id)).run()
    }

    // Delete TP
    db.delete(schema.tujuanPembelajaran).where(eq(schema.tujuanPembelajaran.id, tp[0].id)).run()

    // Verify: TP terhapus
    const after = db.select().from(schema.tujuanPembelajaran).where(eq(schema.tujuanPembelajaran.id, tp[0].id)).all()
    expect(after).toHaveLength(0)
  })

  it("hapus TP dengan nilai_tp terkait harus sukses (cascade)", () => {
    const tp = db
      .insert(schema.tujuanPembelajaran)
      .values({
        mapel_id: seed.mapelId,
        kode_tp: "TP-01",
        deskripsi_tuntas: "Test",
        deskripsi_remediasi: "Test",
        tahun_ajaran_id: seed.tahunAjaranId,
      })
      .returning()
      .all()

    // Buat nilai dulu
    const nilai = db
      .insert(schema.nilai)
      .values({
        siswa_id: seed.siswaId,
        mapel_id: seed.mapelId,
        tahun_ajaran_id: seed.tahunAjaranId,
        nilai_formatif: 80,
      })
      .returning()
      .all()

    // Buat nilai_tp yang referensi TP
    const nt = db
      .insert(schema.nilaiTp)
      .values({
        nilai_id: nilai[0].id,
        tp_id: tp[0].id,
        capaian: "T",
      })
      .returning()
      .all()

    // Cascade: delete nilai_tp dulu
    const related = db.select({ id: schema.nilaiTp.id }).from(schema.nilaiTp).where(eq(schema.nilaiTp.tpId, tp[0].id)).all()
    expect(related).toHaveLength(1)
    expect(related[0].id).toBe(nt[0].id)

    for (const r of related) {
      db.delete(schema.nilaiTp).where(eq(schema.nilaiTp.id, r.id)).run()
    }

    // Delete TP — harus sukses (FK ke nilai_tp sudah dihapus)
    expect(() => {
      db.delete(schema.tujuanPembelajaran).where(eq(schema.tujuanPembelajaran.id, tp[0].id)).run()
    }).not.toThrow()

    // Verify: TP terhapus
    const afterTp = db.select().from(schema.tujuanPembelajaran).where(eq(schema.tujuanPembelajaran.id, tp[0].id)).all()
    expect(afterTp).toHaveLength(0)

    // Verify: nilai_tp juga terhapus
    const afterNt = db.select().from(schema.nilaiTp).where(eq(schema.nilaiTp.tpId, tp[0].id)).all()
    expect(afterNt).toHaveLength(0)
  })

  it("hapus TP TANPA cascade harus FAIL (foreign key constraint)", () => {
    const tp = db
      .insert(schema.tujuanPembelajaran)
      .values({
        mapel_id: seed.mapelId,
        kode_tp: "TP-01",
        deskripsi_tuntas: "Test",
        deskripsi_remediasi: "Test",
        tahun_ajaran_id: seed.tahunAjaranId,
      })
      .returning()
      .all()

    // Buat nilai
    const nilai = db
      .insert(schema.nilai)
      .values({
        siswa_id: seed.siswaId,
        mapel_id: seed.mapelId,
        tahun_ajaran_id: seed.tahunAjaranId,
        nilai_formatif: 80,
      })
      .returning()
      .all()

    // Buat nilai_tp
    db.insert(schema.nilaiTp).values({
      nilai_id: nilai[0].id,
      tp_id: tp[0].id,
      capaian: "T",
    }).run()

    // Delete TP LANGSUNG (tanpa cascade) — harus error
    expect(() => {
      db.delete(schema.tujuanPembelajaran).where(eq(schema.tujuanPembelajaran.id, tp[0].id)).run()
    }).toThrow()
  })
})
