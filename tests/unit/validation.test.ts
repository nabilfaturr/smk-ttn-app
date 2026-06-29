import { describe, it, expect } from "vitest"
import {
  loginSchema,
  changePasswordSchema,
  tahunAjaranSchema,
  kelasSchema,
  mataPelajaranSchema,
  siswaSchema,
  statusAbsensiSchema,
  absensiItemSchema,
  tujuanPembelajaranSchema,
  nilaiSaveItemSchema,
  nilaiPrakerinSchema,
  nilaiKetarunaanSchema,
  nilaiEkskulSchema,
  nilaiKokurikulerSaveSchema,
  catatanWaliKelasSchema,
  konfigurasiSchema,
  infoSekolahSchema,
  formatZodErrors,
  validate,
} from "@/lib/utils/validation"

describe("loginSchema", () => {
  it("valid untuk input benar", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "admin123" })
    expect(result.success).toBe(true)
  })

  it("gagal untuk username kosong", () => {
    const result = loginSchema.safeParse({ username: "", password: "admin123" })
    expect(result.success).toBe(false)
  })

  it("gagal untuk password kosong", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "" })
    expect(result.success).toBe(false)
  })
})

describe("changePasswordSchema", () => {
  it("valid untuk input benar", () => {
    const result = changePasswordSchema.safeParse({
      userId: 1,
      oldPassword: "old",
      newPassword: "newpass123",
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk newPassword < 6 karakter", () => {
    const result = changePasswordSchema.safeParse({
      userId: 1,
      oldPassword: "old",
      newPassword: "abc",
    })
    expect(result.success).toBe(false)
  })
})

describe("tahunAjaranSchema", () => {
  it("valid untuk format benar", () => {
    const result = tahunAjaranSchema.safeParse({
      nama: "2025/2026",
      semester: 1,
      is_active: 1,
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk format nama salah", () => {
    const result = tahunAjaranSchema.safeParse({
      nama: "2025-2026",
      semester: 1,
    })
    expect(result.success).toBe(false)
  })

  it("gagal untuk semester invalid", () => {
    const result = tahunAjaranSchema.safeParse({
      nama: "2025/2026",
      semester: 3,
    })
    expect(result.success).toBe(false)
  })
})

describe("kelasSchema", () => {
  it("valid untuk input benar", () => {
    const result = kelasSchema.safeParse({
      nama_kelas: "XII RPL",
      tingkat: 12,
      program_keahlian: "RPL",
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk tingkat invalid", () => {
    const result = kelasSchema.safeParse({
      nama_kelas: "XIII",
      tingkat: 13,
    })
    expect(result.success).toBe(false)
  })
})

describe("mataPelajaranSchema", () => {
  it("valid untuk mapel reguler dengan kelompok", () => {
    const result = mataPelajaranSchema.safeParse({
      kode_mapel: "MTK",
      nama_mapel: "Matematika",
      jenis: "reguler",
      kelompok: "umum",
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk mapel reguler tanpa kelompok", () => {
    const result = mataPelajaranSchema.safeParse({
      kode_mapel: "MTK",
      nama_mapel: "Matematika",
      jenis: "reguler",
    })
    expect(result.success).toBe(false)
  })

  it("valid untuk mapel kokurikuler tanpa kelompok", () => {
    const result = mataPelajaranSchema.safeParse({
      kode_mapel: "P5",
      nama_mapel: "P5 Project",
      jenis: "kokurikuler",
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk kode_mapel dengan karakter invalid", () => {
    const result = mataPelajaranSchema.safeParse({
      kode_mapel: "mtk-lowercase",
      nama_mapel: "Matematika",
      jenis: "reguler",
      kelompok: "umum",
    })
    expect(result.success).toBe(false)
  })
})

describe("siswaSchema", () => {
  it("valid untuk data lengkap", () => {
    const result = siswaSchema.safeParse({
      nis: "12345",
      nama: "Budi",
      jenis_kelamin: "Laki-Laki",
      agama: "ISLAM",
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk NIS non-numeric", () => {
    const result = siswaSchema.safeParse({
      nis: "abc",
      nama: "Budi",
    })
    expect(result.success).toBe(false)
  })

  it("gagal untuk NIS < 4 digit", () => {
    const result = siswaSchema.safeParse({
      nis: "123",
      nama: "Budi",
    })
    expect(result.success).toBe(false)
  })

  it("default status = 'aktif' jika tidak diisi", () => {
    const result = siswaSchema.parse({
      nis: "12345",
      nama: "Budi",
    })
    expect(result.status).toBe("aktif")
  })

  it("gagal untuk tanggal_lahir format salah", () => {
    const result = siswaSchema.safeParse({
      nis: "12345",
      nama: "Budi",
      tanggal_lahir: "05-06-2026",
    })
    expect(result.success).toBe(false)
  })
})

describe("statusAbsensiSchema", () => {
  it("valid untuk semua status", () => {
    for (const s of ["H", "DL", "S", "I", "TK"]) {
      expect(statusAbsensiSchema.safeParse(s).success).toBe(true)
    }
  })

  it("gagal untuk status tidak dikenal", () => {
    expect(statusAbsensiSchema.safeParse("X").success).toBe(false)
  })
})

describe("absensiItemSchema", () => {
  it("valid untuk data benar", () => {
    const result = absensiItemSchema.safeParse({
      siswaId: 1,
      kelasId: 1,
      tanggal: "2026-06-05",
      jamPelajaran: 1,
      status: "H",
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk tanggal format salah", () => {
    const result = absensiItemSchema.safeParse({
      siswaId: 1,
      kelasId: 1,
      tanggal: "05/06/2026",
      jamPelajaran: 1,
      status: "H",
    })
    expect(result.success).toBe(false)
  })

  it("gagal untuk jamPelajaran di luar range", () => {
    const result = absensiItemSchema.safeParse({
      siswaId: 1,
      kelasId: 1,
      tanggal: "2026-06-05",
      jamPelajaran: 99,
      status: "H",
    })
    expect(result.success).toBe(false)
  })
})

describe("tujuanPembelajaranSchema", () => {
  it("valid untuk data benar", () => {
    const result = tujuanPembelajaranSchema.safeParse({
      mapel_id: 1,
      kode_tp: "TP1",
      deskripsi_tuntas: "Siswa dapat menghitung",
      deskripsi_remediasi: "Siswa perlu mengulang",
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk deskripsi_tuntas kosong", () => {
    const result = tujuanPembelajaranSchema.safeParse({
      mapel_id: 1,
      kode_tp: "TP1",
      deskripsi_tuntas: "",
      deskripsi_remediasi: "remidiasi",
    })
    expect(result.success).toBe(false)
  })
})

describe("nilaiSaveItemSchema", () => {
  it("valid untuk nilai dalam range", () => {
    const result = nilaiSaveItemSchema.safeParse({
      siswaId: 1,
      mapelId: 1,
      tahunAjaranId: 1,
      nilaiFormatif: 80,
      nilaiSumatif: 90,
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk nilai > 100", () => {
    const result = nilaiSaveItemSchema.safeParse({
      siswaId: 1,
      mapelId: 1,
      tahunAjaranId: 1,
      nilaiFormatif: 150,
      nilaiSumatif: 90,
    })
    expect(result.success).toBe(false)
  })

  it("gagal untuk nilai < 0", () => {
    const result = nilaiSaveItemSchema.safeParse({
      siswaId: 1,
      mapelId: 1,
      tahunAjaranId: 1,
      nilaiFormatif: -5,
      nilaiSumatif: 90,
    })
    expect(result.success).toBe(false)
  })

  it("valid untuk nilai null", () => {
    const result = nilaiSaveItemSchema.safeParse({
      siswaId: 1,
      mapelId: 1,
      tahunAjaranId: 1,
      nilaiFormatif: null,
      nilaiSumatif: null,
    })
    expect(result.success).toBe(true)
  })
})

describe("nilaiPrakerinSchema", () => {
  it("valid untuk data benar", () => {
    const result = nilaiPrakerinSchema.safeParse({
      siswaId: 1,
      tahunAjaranId: 1,
      tpl: 80,
      sl: 85,
      sk: 90,
    })
    expect(result.success).toBe(true)
  })

  it("valid dengan absensi", () => {
    const result = nilaiPrakerinSchema.safeParse({
      siswaId: 1,
      tahunAjaranId: 1,
      tpl: 80,
      sl: 85,
      sk: 90,
      absensi: { sakit: 1, izin: 2, tanpa_keterangan: 0 },
    })
    expect(result.success).toBe(true)
  })
})

describe("nilaiKetarunaanSchema", () => {
  it("valid untuk predikat A", () => {
    const result = nilaiKetarunaanSchema.safeParse({
      siswaId: 1,
      tahunAjaranId: 1,
      predikat: "A",
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk predikat invalid", () => {
    const result = nilaiKetarunaanSchema.safeParse({
      siswaId: 1,
      tahunAjaranId: 1,
      predikat: "E",
    })
    expect(result.success).toBe(false)
  })
})

describe("nilaiEkskulSchema", () => {
  it("valid untuk data benar", () => {
    const result = nilaiEkskulSchema.safeParse({
      siswaId: 1,
      ekskulId: 1,
      tahunAjaranId: 1,
      predikat: "B",
    })
    expect(result.success).toBe(true)
  })
})

describe("nilaiKokurikulerSaveSchema", () => {
  it("valid untuk grades", () => {
    const result = nilaiKokurikulerSaveSchema.safeParse({
      siswaId: 1,
      tahunAjaranId: 1,
      grades: [
        { subdimensiId: 1, grade: 1 },
        { subdimensiId: 2, grade: 2 },
        { subdimensiId: 3, grade: 3 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk grade invalid (4)", () => {
    const result = nilaiKokurikulerSaveSchema.safeParse({
      siswaId: 1,
      tahunAjaranId: 1,
      grades: [{ subdimensiId: 1, grade: 4 }],
    })
    expect(result.success).toBe(false)
  })

  it("gagal untuk grades kosong", () => {
    const result = nilaiKokurikulerSaveSchema.safeParse({
      siswaId: 1,
      tahunAjaranId: 1,
      grades: [],
    })
    expect(result.success).toBe(false)
  })
})

describe("catatanWaliKelasSchema", () => {
  it("valid untuk catatan non-kosong", () => {
    const result = catatanWaliKelasSchema.safeParse({
      siswaId: 1,
      tahunAjaranId: 1,
      catatan: "Anak yang rajin",
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk catatan kosong", () => {
    const result = catatanWaliKelasSchema.safeParse({
      siswaId: 1,
      tahunAjaranId: 1,
      catatan: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("konfigurasiSchema", () => {
  it("valid untuk data benar", () => {
    const result = konfigurasiSchema.safeParse({
      JAM_PER_HARI: 6,
      BOBOT_FORMATIF: 0.4,
      BOBOT_SUMATIF: 0.6,
      KONVENSI_JAM_HARI: "pembulatan",
    })
    expect(result.success).toBe(true)
  })

  it("coerce string ke number", () => {
    const result = konfigurasiSchema.safeParse({
      JAM_PER_HARI: "6",
      BOBOT_FORMATIF: "0.4",
      BOBOT_SUMATIF: "0.6",
      KONVENSI_JAM_HARI: "floor",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.JAM_PER_HARI).toBe(6)
    }
  })

  it("gagal untuk BOBOT > 1", () => {
    const result = konfigurasiSchema.safeParse({
      JAM_PER_HARI: 6,
      BOBOT_FORMATIF: 1.5,
      BOBOT_SUMATIF: 0.6,
      KONVENSI_JAM_HARI: "pembulatan",
    })
    expect(result.success).toBe(false)
  })

  it("gagal untuk KONVENSI_JAM_HARI invalid", () => {
    const result = konfigurasiSchema.safeParse({
      JAM_PER_HARI: 6,
      BOBOT_FORMATIF: 0.4,
      BOBOT_SUMATIF: 0.6,
      KONVENSI_JAM_HARI: "invalid",
    })
    expect(result.success).toBe(false)
  })
})

describe("infoSekolahSchema", () => {
  it("valid untuk data benar", () => {
    const result = infoSekolahSchema.safeParse({
      nama: "SMK Taruna Tekno Nusantara",
      alamat: "Jl. Pembangunan",
      kepala_sekolah: "Budi",
      npsn: "70035993",
    })
    expect(result.success).toBe(true)
  })

  it("gagal untuk NPSN != 8 digit", () => {
    const result = infoSekolahSchema.safeParse({
      nama: "SMK",
      npsn: "12345",
    })
    expect(result.success).toBe(false)
  })

  it("valid untuk NPSN kosong string", () => {
    const result = infoSekolahSchema.safeParse({
      nama: "SMK",
      npsn: "",
    })
    expect(result.success).toBe(true)
  })
})

describe("formatZodErrors", () => {
  it("format error ke object {field: message}", () => {
    const result = loginSchema.safeParse({ username: "", password: "" })
    if (!result.success) {
      const errors = formatZodErrors(result.error)
      expect(errors.username).toBeDefined()
      expect(errors.password).toBeDefined()
    } else {
      throw new Error("Expected validation to fail")
    }
  })
})

describe("validate helper", () => {
  it("return { success: true, data } untuk input valid", () => {
    const result = validate(loginSchema, { username: "admin", password: "pw" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.username).toBe("admin")
    }
  })

  it("return { success: false, errors } untuk input invalid", () => {
    const result = validate(loginSchema, { username: "", password: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.username).toBeDefined()
      expect(result.errors.password).toBeDefined()
    }
  })
})
