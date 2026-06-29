import { describe, it, expect, beforeEach } from "vitest"
import { eq } from "drizzle-orm"
import { createTestDb, seedMinimal, type TestDB } from "./helpers/db"
import * as schema from "@/lib/db/schema"

describe("Multi-Role (combined wali_kelas + guru)", () => {
  let db: TestDB
  let seed: ReturnType<typeof seedMinimal>

  beforeEach(() => {
    db = createTestDb()
    seed = seedMinimal(db)
  })

  it("user bisa punya role wali_kelas,guru (comma-separated)", () => {
    const user = db
      .insert(schema.users)
      .values({
        username: "budi_test",
        password: "hash",
        role: "wali_kelas,guru",
      })
      .returning()
      .all()

    expect(user[0].role).toBe("wali_kelas,guru")

    const roles = user[0].role.split(",")
    expect(roles).toContain("wali_kelas")
    expect(roles).toContain("guru")
  })

  it("single role user still works backward compat", () => {
    const user = db
      .insert(schema.users)
      .values({
        username: "guru_test",
        password: "hash",
        role: "guru",
      })
      .returning()
      .all()

    const roles = user[0].role.split(",")
    expect(roles).toEqual(["guru"])
  })

  it("kode_login column tersedia", () => {
    const user = db
      .insert(schema.users)
      .values({
        username: "user_test",
        password: "hash",
        role: "guru",
        kode_login: "12345",
      })
      .returning()
      .all()

    expect(user[0].kode_login).toBe("12345")
  })

  it("cascade delete TP with nilai_tp still works", () => {
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

    const nt = db
      .insert(schema.nilaiTp)
      .values({
        nilai_id: nilai[0].id,
        tp_id: tp[0].id,
        capaian: "T",
      })
      .returning()
      .all()

    // Cascade: delete nilai_tp first, then TP
    const related = db.select({ id: schema.nilaiTp.id }).from(schema.nilaiTp).where(eq(schema.nilaiTp.tpId, tp[0].id)).all()
    expect(related).toHaveLength(1)

    for (const r of related) {
      db.delete(schema.nilaiTp).where(eq(schema.nilaiTp.id, r.id)).run()
    }

    expect(() => {
      db.delete(schema.tujuanPembelajaran).where(eq(schema.tujuanPembelajaran.id, tp[0].id)).run()
    }).not.toThrow()

    const afterTp = db.select().from(schema.tujuanPembelajaran).where(eq(schema.tujuanPembelajaran.id, tp[0].id)).all()
    expect(afterTp).toHaveLength(0)
  })
})
