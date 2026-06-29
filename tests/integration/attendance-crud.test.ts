import { describe, it, expect, beforeEach } from "vitest"
import { eq, and, gte, lte } from "drizzle-orm"
import { createTestDb, seedMinimal, type TestDB } from "./helpers/db"
import * as schema from "@/lib/db/schema"

describe("Attendance CRUD Integration", () => {
  let db: TestDB
  let seed: ReturnType<typeof seedMinimal>

  beforeEach(() => {
    db = createTestDb()
    seed = seedMinimal(db)
  })

  describe("CREATE absensi", () => {
    it("insert absensi untuk satu siswa", () => {
      const result = db
        .insert(schema.absensi)
        .values({
          siswa_id: seed.siswaId,
          kelas_id: seed.kelasId,
          tanggal: "2026-06-05",
          status: "H",
          jam_pelajaran: 1,
        })
        .returning()
        .all()

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe("H")
    })

    it("insert absensi untuk banyak siswa (bulk)", () => {
      const siswa2 = db
        .insert(schema.siswa)
        .values({
          nis: "2003",
          nama: "Siswa 2",
          kelas_id: seed.kelasId,
          status: "aktif",
        })
        .returning()
        .all()

      db.insert(schema.absensi)
        .values([
          {
            siswa_id: seed.siswaId,
            kelas_id: seed.kelasId,
            tanggal: "2026-06-05",
            status: "H",
            jam_pelajaran: 1,
          },
          {
            siswa_id: siswa2[0].id,
            kelas_id: seed.kelasId,
            tanggal: "2026-06-05",
            status: "S",
            jam_pelajaran: 1,
          },
        ])
        .run()

      const all = db.select().from(schema.absensi).all()
      expect(all).toHaveLength(2)
    })

    it("gagal insert duplikat (unique constraint siswa+tanggal+jam)", () => {
      db.insert(schema.absensi)
        .values({
          siswa_id: seed.siswaId,
          kelas_id: seed.kelasId,
          tanggal: "2026-06-05",
          status: "H",
          jam_pelajaran: 1,
        })
        .run()

      expect(() => {
        db.insert(schema.absensi)
          .values({
            siswa_id: seed.siswaId,
            kelas_id: seed.kelasId,
            tanggal: "2026-06-05",
            status: "S",
            jam_pelajaran: 1,
          })
          .run()
      }).toThrow()
    })

    it("boleh insert untuk jam pelajaran berbeda", () => {
      db.insert(schema.absensi)
        .values([
          {
            siswa_id: seed.siswaId,
            kelas_id: seed.kelasId,
            tanggal: "2026-06-05",
            status: "H",
            jam_pelajaran: 1,
          },
          {
            siswa_id: seed.siswaId,
            kelas_id: seed.kelasId,
            tanggal: "2026-06-05",
            status: "S",
            jam_pelajaran: 2,
          },
        ])
        .run()

      const all = db.select().from(schema.absensi).all()
      expect(all).toHaveLength(2)
    })
  })

  describe("READ absensi", () => {
    beforeEach(() => {
      // Seed beberapa absensi
      db.insert(schema.absensi)
        .values([
          { siswa_id: seed.siswaId, kelas_id: seed.kelasId, tanggal: "2026-06-05", status: "H", jam_pelajaran: 1 },
          { siswa_id: seed.siswaId, kelas_id: seed.kelasId, tanggal: "2026-06-05", status: "S", jam_pelajaran: 2 },
          { siswa_id: seed.siswaId, kelas_id: seed.kelasId, tanggal: "2026-06-06", status: "H", jam_pelajaran: 1 },
        ])
        .run()
    })

    it("get absensi by kelas + tanggal + jam", () => {
      const result = db
        .select()
        .from(schema.absensi)
        .where(
          and(
            eq(schema.absensi.kelas_id, seed.kelasId),
            eq(schema.absensi.tanggal, "2026-06-05"),
            eq(schema.absensi.jam_pelajaran, 1),
          ),
        )
        .all()

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe("H")
    })

    it("get absensi dalam rentang tanggal", () => {
      const result = db
        .select()
        .from(schema.absensi)
        .where(
          and(
            eq(schema.absensi.siswa_id, seed.siswaId),
            gte(schema.absensi.tanggal, "2026-06-05"),
            lte(schema.absensi.tanggal, "2026-06-06"),
          ),
        )
        .all()

      expect(result).toHaveLength(3)
    })

    it("get semua absensi siswa tertentu", () => {
      const result = db
        .select()
        .from(schema.absensi)
        .where(eq(schema.absensi.siswa_id, seed.siswaId))
        .all()

      expect(result).toHaveLength(3)
    })
  })

  describe("UPDATE absensi (UPSERT pattern)", () => {
    it("update absensi existing", () => {
      db.insert(schema.absensi)
        .values({
          siswa_id: seed.siswaId,
          kelas_id: seed.kelasId,
          tanggal: "2026-06-05",
          status: "H",
          jam_pelajaran: 1,
        })
        .run()

      db.update(schema.absensi)
        .set({ status: "S" })
        .where(
          and(
            eq(schema.absensi.siswa_id, seed.siswaId),
            eq(schema.absensi.tanggal, "2026-06-05"),
            eq(schema.absensi.jam_pelajaran, 1),
          ),
        )
        .run()

      const result = db
        .select()
        .from(schema.absensi)
        .where(eq(schema.absensi.siswa_id, seed.siswaId))
        .get()

      expect(result?.status).toBe("S")
    })
  })

  describe("Rekap absensi (aggregation)", () => {
    beforeEach(() => {
      // 1 H, 1 DL, 1 S, 1 I, 1 TK
      db.insert(schema.absensi)
        .values([
          { siswa_id: seed.siswaId, kelas_id: seed.kelasId, tanggal: "2026-06-05", status: "H", jam_pelajaran: 1 },
          { siswa_id: seed.siswaId, kelas_id: seed.kelasId, tanggal: "2026-06-05", status: "H", jam_pelajaran: 2 },
          { siswa_id: seed.siswaId, kelas_id: seed.kelasId, tanggal: "2026-06-05", status: "DL", jam_pelajaran: 3 },
          { siswa_id: seed.siswaId, kelas_id: seed.kelasId, tanggal: "2026-06-05", status: "S", jam_pelajaran: 4 },
          { siswa_id: seed.siswaId, kelas_id: seed.kelasId, tanggal: "2026-06-05", status: "I", jam_pelajaran: 5 },
          { siswa_id: seed.siswaId, kelas_id: seed.kelasId, tanggal: "2026-06-05", status: "TK", jam_pelajaran: 6 },
        ])
        .run()
    })

    it("hitung total per status untuk satu siswa", () => {
      const all = db
        .select()
        .from(schema.absensi)
        .where(eq(schema.absensi.siswa_id, seed.siswaId))
        .all()

      const recap = {
        H: all.filter((a) => a.status === "H").length,
        DL: all.filter((a) => a.status === "DL").length,
        S: all.filter((a) => a.status === "S").length,
        I: all.filter((a) => a.status === "I").length,
        TK: all.filter((a) => a.status === "TK").length,
      }

      expect(recap).toEqual({ H: 2, DL: 1, S: 1, I: 1, TK: 1 })
    })
  })

  describe("Foreign key constraint", () => {
    it("gagal insert dengan siswa_id invalid", () => {
      expect(() => {
        db.insert(schema.absensi)
          .values({
            siswa_id: 99999, // tidak ada
            kelas_id: seed.kelasId,
            tanggal: "2026-06-05",
            status: "H",
            jam_pelajaran: 1,
          })
          .run()
      }).toThrow()
    })

    it("gagal insert dengan kelas_id invalid", () => {
      expect(() => {
        db.insert(schema.absensi)
          .values({
            siswa_id: seed.siswaId,
            kelas_id: 99999, // tidak ada
            tanggal: "2026-06-05",
            status: "H",
            jam_pelajaran: 1,
          })
          .run()
      }).toThrow()
    })
  })
})
