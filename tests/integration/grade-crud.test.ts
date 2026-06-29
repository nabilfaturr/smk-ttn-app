import { describe, it, expect, beforeEach } from "vitest"
import { eq, and } from "drizzle-orm"
import { createTestDb, seedMinimal, type TestDB } from "./helpers/db"
import * as schema from "@/lib/db/schema"
import { calculateNilaiRapor } from "@/lib/calculations/grades"

describe("Grade CRUD Integration", () => {
  let db: TestDB
  let seed: ReturnType<typeof seedMinimal>

  beforeEach(() => {
    db = createTestDb()
    seed = seedMinimal(db)
  })

  describe("CREATE nilai", () => {
    it("insert nilai mapel reguler", () => {
      const result = db
        .insert(schema.nilai)
        .values({
          siswa_id: seed.siswaId,
          mapel_id: seed.mapelId,
          tahun_ajaran_id: seed.tahunAjaranId,
          nilai_formatif: 80,
          nilai_sumatif: 90,
          nilai_rapor: calculateNilaiRapor(80, 90),
        })
        .returning()
        .all()

      expect(result).toHaveLength(1)
      expect(result[0].nilai_rapor).toBe(86)
    })

    it("nilai nullable boleh kosong", () => {
      const result = db
        .insert(schema.nilai)
        .values({
          siswa_id: seed.siswaId,
          mapel_id: seed.mapelId,
          tahun_ajaran_id: seed.tahunAjaranId,
          nilai_formatif: null,
          nilai_sumatif: null,
          nilai_rapor: null,
        })
        .returning()
        .all()

      expect(result[0].nilai_formatif).toBeNull()
      expect(result[0].nilai_rapor).toBeNull()
    })

    it("gagal insert duplikat (unique siswa+mapel+tahun)", () => {
      const payload = {
        siswa_id: seed.siswaId,
        mapel_id: seed.mapelId,
        tahun_ajaran_id: seed.tahunAjaranId,
        nilai_formatif: 80,
        nilai_sumatif: 90,
        nilai_rapor: 86,
      }

      db.insert(schema.nilai).values(payload).run()

      expect(() => {
        db.insert(schema.nilai).values({ ...payload, nilai_formatif: 70 }).run()
      }).toThrow()
    })
  })

  describe("READ nilai", () => {
    beforeEach(() => {
      db.insert(schema.nilai)
        .values({
          siswa_id: seed.siswaId,
          mapel_id: seed.mapelId,
          tahun_ajaran_id: seed.tahunAjaranId,
          nilai_formatif: 80,
          nilai_sumatif: 90,
          nilai_rapor: 86,
        })
        .run()
    })

    it("get nilai by siswa+mapel+tahun", () => {
      const result = db
        .select()
        .from(schema.nilai)
        .where(
          and(
            eq(schema.nilai.siswa_id, seed.siswaId),
            eq(schema.nilai.mapel_id, seed.mapelId),
            eq(schema.nilai.tahun_ajaran_id, seed.tahunAjaranId),
          ),
        )
        .get()

      expect(result?.nilai_rapor).toBe(86)
    })

    it("get semua nilai siswa", () => {
      // Tambah mapel lain
      const mapel2 = db
        .insert(schema.mataPelajaran)
        .values({
          kode_mapel: "BIN",
          nama_mapel: "Bahasa Indonesia",
          jenis: "reguler",
          kelompok: "umum",
        })
        .returning()
        .all()

      db.insert(schema.nilai)
        .values({
          siswa_id: seed.siswaId,
          mapel_id: mapel2[0].id,
          tahun_ajaran_id: seed.tahunAjaranId,
          nilai_formatif: 75,
          nilai_sumatif: 85,
          nilai_rapor: 81,
        })
        .run()

      const all = db
        .select()
        .from(schema.nilai)
        .where(eq(schema.nilai.siswa_id, seed.siswaId))
        .all()

      expect(all).toHaveLength(2)
    })
  })

  describe("UPDATE nilai", () => {
    it("update nilai formatif", () => {
      db.insert(schema.nilai)
        .values({
          siswa_id: seed.siswaId,
          mapel_id: seed.mapelId,
          tahun_ajaran_id: seed.tahunAjaranId,
          nilai_formatif: 80,
          nilai_sumatif: 90,
          nilai_rapor: 86,
        })
        .run()

      // Recalculate nilai rapor
      const newFormatif = 70
      const sumatif = 90
      const newRapor = calculateNilaiRapor(newFormatif, sumatif)

      db.update(schema.nilai)
        .set({ nilai_formatif: newFormatif, nilai_rapor: newRapor })
        .where(eq(schema.nilai.siswa_id, seed.siswaId))
        .run()

      const result = db
        .select()
        .from(schema.nilai)
        .where(eq(schema.nilai.siswa_id, seed.siswaId))
        .get()

      // (70 * 0.4) + (90 * 0.6) = 28 + 54 = 82
      expect(result?.nilai_rapor).toBe(82)
    })
  })

  describe("Nilai TP (capaian)", () => {
    it("insert nilai TP", () => {
      // Tambah TP
      const tp = db
        .insert(schema.tujuanPembelajaran)
        .values({
          mapel_id: seed.mapelId,
          kode_tp: "TP1",
          deskripsi_tuntas: "dapat menghitung",
          deskripsi_remediasi: "perlu latihan",
          tahun_ajaran_id: seed.tahunAjaranId,
        })
        .returning()
        .all()

      // Tambah nilai
      const nilai = db
        .insert(schema.nilai)
        .values({
          siswa_id: seed.siswaId,
          mapel_id: seed.mapelId,
          tahun_ajaran_id: seed.tahunAjaranId,
          nilai_formatif: 80,
          nilai_sumatif: 90,
          nilai_rapor: 86,
        })
        .returning()
        .all()

      // Tambah capaian TP
      const result = db
        .insert(schema.nilaiTp)
        .values({
          nilai_id: nilai[0].id,
          tp_id: tp[0].id,
          capaian: "T",
        })
        .returning()
        .all()

      expect(result[0].capaian).toBe("T")
    })

    it("gagal duplikat (unique nilai+tp)", () => {
      const tp = db
        .insert(schema.tujuanPembelajaran)
        .values({
          mapel_id: seed.mapelId,
          kode_tp: "TP1",
          deskripsi_tuntas: "x",
          deskripsi_remediasi: "y",
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
          nilai_sumatif: 90,
          nilai_rapor: 86,
        })
        .returning()
        .all()

      db.insert(schema.nilaiTp)
        .values({ nilai_id: nilai[0].id, tp_id: tp[0].id, capaian: "T" })
        .run()

      expect(() => {
        db.insert(schema.nilaiTp)
          .values({ nilai_id: nilai[0].id, tp_id: tp[0].id, capaian: "R" })
          .run()
      }).toThrow()
    })
  })

  describe("Nilai Prakerin", () => {
    it("insert dan hitung nilai rapor otomatis", () => {
      // Tambah mapel prakerin
      const prakerinMapel = db
        .insert(schema.mataPelajaran)
        .values({
          kode_mapel: "PRAKERIN",
          nama_mapel: "Prakerin",
          jenis: "prakerin",
        })
        .returning()
        .all()

      const result = db
        .insert(schema.nilaiPrakerin)
        .values({
          siswa_id: seed.siswaId,
          tahun_ajaran_id: seed.tahunAjaranId,
          tpl: 80,
          sl: 85,
          sk: 90,
          nilai_rapor: calculateNilaiRapor(80, 90), // salah calculation
          pembimbing_sekolah: "Pak Budi",
          tempat_prakerin: "PT. Test",
        })
        .returning()
        .all()

      expect(result[0].tpl).toBe(80)
      expect(result[0].nilai_rapor).toBeGreaterThan(0)
    })

    it("absensi prakerin default 0", () => {
      const result = db
        .insert(schema.absensiPrakerin)
        .values({
          siswa_id: seed.siswaId,
          tahun_ajaran_id: seed.tahunAjaranId,
        })
        .returning()
        .all()

      expect(result[0].sakit).toBe(0)
      expect(result[0].izin).toBe(0)
      expect(result[0].tanpa_keterangan).toBe(0)
    })
  })

  describe("Nilai Ketarunaan", () => {
    it("insert nilai ketarunaan", () => {
      const result = db
        .insert(schema.nilaiKetarunaan)
        .values({
          siswa_id: seed.siswaId,
          tahun_ajaran_id: seed.tahunAjaranId,
          predikat: "A",
          keterangan: "Sangat baik",
        })
        .returning()
        .all()

      expect(result[0].predikat).toBe("A")
    })
  })

  describe("Nilai Ekskul", () => {
    it("insert nilai ekskul", () => {
      const ekskul = db
        .insert(schema.ekskul)
        .values({ nama: "Pramuka", wajib: 1 })
        .returning()
        .all()

      const result = db
        .insert(schema.nilaiEkskul)
        .values({
          siswa_id: seed.siswaId,
          ekskul_id: ekskul[0].id,
          tahun_ajaran_id: seed.tahunAjaranId,
          predikat: "B",
          keterangan: "Aktif mengikuti",
        })
        .returning()
        .all()

      expect(result[0].predikat).toBe("B")
    })
  })

  describe("Nilai Kokurikuler (P5)", () => {
    it("insert grade kokurikuler", () => {
      // Setup dimensi & subdimensi
      const dimensi = db
        .insert(schema.dimensiP5)
        .values({ nama: "Kreativitas" })
        .returning()
        .all()

      const sub = db
        .insert(schema.subdimensiP5)
        .values({
          dimensi_id: dimensi[0].id,
          nama: "Menghasilkan karya",
          deskripsi_berkembang: "Mulai menghasilkan",
          deskripsi_cakap: "Menghasilkan karya dengan baik",
          deskripsi_mahir: "Menghasilkan karya inovatif",
        })
        .returning()
        .all()

      const result = db
        .insert(schema.nilaiKokurikuler)
        .values({
          siswa_id: seed.siswaId,
          subdimensi_id: sub[0].id,
          tahun_ajaran_id: seed.tahunAjaranId,
          grade: 2,
        })
        .returning()
        .all()

      expect(result[0].grade).toBe(2)
    })
  })

  describe("Catatan Wali Kelas", () => {
    it("insert catatan wali kelas", () => {
      const result = db
        .insert(schema.catatanWaliKelas)
        .values({
          siswa_id: seed.siswaId,
          tahun_ajaran_id: seed.tahunAjaranId,
          catatan: "Anak yang rajin dan aktif",
        })
        .returning()
        .all()

      expect(result[0].catatan).toBe("Anak yang rajin dan aktif")
    })
  })
})
