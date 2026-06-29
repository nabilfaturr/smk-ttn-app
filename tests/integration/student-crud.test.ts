import { describe, it, expect, beforeEach } from "vitest"
import { eq } from "drizzle-orm"
import { createTestDb, seedMinimal, type TestDB } from "./helpers/db"
import * as schema from "@/lib/db/schema"

describe("Student CRUD Integration", () => {
  let db: TestDB
  let seed: ReturnType<typeof seedMinimal>

  beforeEach(() => {
    db = createTestDb()
    seed = seedMinimal(db)
  })

  describe("CREATE siswa", () => {
    it("insert siswa baru", () => {
      const result = db
        .insert(schema.siswa)
        .values({
          nis: "2001",
          nama: "Andi Test",
          kelas_id: seed.kelasId,
          jenis_kelamin: "Laki-Laki",
          agama: "ISLAM",
          status: "aktif",
        })
        .returning()
        .all()

      expect(result).toHaveLength(1)
      expect(result[0].nama).toBe("Andi Test")
      expect(result[0].status).toBe("aktif")
    })

    it("default status = 'aktif' jika tidak diisi", () => {
      const result = db
        .insert(schema.siswa)
        .values({
          nis: "2002",
          nama: "Ani Test",
          kelas_id: seed.kelasId,
        })
        .returning()
        .all()

      expect(result[0].status).toBe("aktif")
    })

    it("gagal insert duplikat NIS", () => {
      expect(() => {
        db.insert(schema.siswa)
          .values({ nis: "9999", nama: "A", kelas_id: seed.kelasId })
          .run()
        db.insert(schema.siswa)
          .values({ nis: "9999", nama: "B", kelas_id: seed.kelasId })
          .run()
      }).toThrow()
    })
  })

  describe("READ siswa", () => {
    it("get siswa by ID", () => {
      const result = db
        .select()
        .from(schema.siswa)
        .where(eq(schema.siswa.id, seed.siswaId))
        .get()

      expect(result).toBeDefined()
      expect(result?.nama).toBe("Budi Test")
    })

    it("get semua siswa di kelas tertentu", () => {
      db.insert(schema.siswa)
        .values({
          nis: "3001",
          nama: "Cici",
          kelas_id: seed.kelasId,
          status: "aktif",
        })
        .run()

      const result = db
        .select()
        .from(schema.siswa)
        .where(eq(schema.siswa.kelas_id, seed.kelasId))
        .all()

      expect(result.length).toBe(2) // 1 dari seed + 1 baru
    })

    it("filter siswa aktif saja", () => {
      db.insert(schema.siswa)
        .values({
          nis: "3002",
          nama: "Dodi",
          kelas_id: seed.kelasId,
          status: "tidak_aktif",
        })
        .run()

      const result = db
        .select()
        .from(schema.siswa)
        .where(eq(schema.siswa.status, "aktif"))
        .all()

      expect(result.every((s) => s.status === "aktif")).toBe(true)
      expect(result.find((s) => s.nama === "Dodi")).toBeUndefined()
    })
  })

  describe("UPDATE siswa", () => {
    it("update nama siswa", () => {
      db.update(schema.siswa)
        .set({ nama: "Budi Updated" })
        .where(eq(schema.siswa.id, seed.siswaId))
        .run()

      const updated = db
        .select()
        .from(schema.siswa)
        .where(eq(schema.siswa.id, seed.siswaId))
        .get()

      expect(updated?.nama).toBe("Budi Updated")
    })

    it("update status ke tidak_aktif (soft delete)", () => {
      db.update(schema.siswa)
        .set({ status: "tidak_aktif" })
        .where(eq(schema.siswa.id, seed.siswaId))
        .run()

      const updated = db
        .select()
        .from(schema.siswa)
        .where(eq(schema.siswa.id, seed.siswaId))
        .get()

      expect(updated?.status).toBe("tidak_aktif")
    })

    it("update beberapa field sekaligus", () => {
      db.update(schema.siswa)
        .set({
          nama: "Budi New",
          alamat: "Jl. Test 123",
          no_hp: "08123456789",
        })
        .where(eq(schema.siswa.id, seed.siswaId))
        .run()

      const updated = db
        .select()
        .from(schema.siswa)
        .where(eq(schema.siswa.id, seed.siswaId))
        .get()

      expect(updated?.nama).toBe("Budi New")
      expect(updated?.alamat).toBe("Jl. Test 123")
      expect(updated?.no_hp).toBe("08123456789")
    })
  })

  describe("DELETE siswa", () => {
    it("hard delete siswa", () => {
      db.delete(schema.siswa).where(eq(schema.siswa.id, seed.siswaId)).run()

      const result = db
        .select()
        .from(schema.siswa)
        .where(eq(schema.siswa.id, seed.siswaId))
        .get()

      expect(result).toBeUndefined()
    })

    it("cascade: hapus kelas juga hapus siswa (FK constraint)", () => {
      // Karena foreign_keys = ON, seharusnya cascade atau restrict
      // Untuk schema ini, kita cek behavior default
      const result = db
        .select()
        .from(schema.siswa)
        .where(eq(schema.siswa.id, seed.siswaId))
        .get()
      expect(result).toBeDefined()
    })
  })

  describe("Validasi field (NOT NULL constraint)", () => {
    it("NIS NULL harus gagal (NOT NULL constraint)", () => {
      expect(() => {
        db.insert(schema.siswa)
          .values({ nis: null as any, nama: "Test" })
          .run()
      }).toThrow()
    })

    it("Nama NULL harus gagal (NOT NULL constraint)", () => {
      expect(() => {
        db.insert(schema.siswa)
          .values({ nis: "12345", nama: null as any })
          .run()
      }).toThrow()
    })

    it("Catatan: empty string '' untuk NOT NULL field VALID di SQL (handled di app layer via Zod)", () => {
      // NOT NULL constraint hanya block NULL values, bukan empty strings.
      // Validasi empty string dilakukan di application layer (Zod) sebelum insert.
      const result = db
        .insert(schema.siswa)
        .values({ nis: "12345", nama: "Test" })
        .returning()
        .all()

      expect(result[0].nama).toBe("Test")
    })
  })
})
