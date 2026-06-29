import { describe, it, expect } from "vitest"
import {
  formatDate,
  formatDateLong,
  formatNilai,
  formatStatusAbsensi,
  formatPredikat,
  formatGradeP5,
  formatUserRole,
  formatJenisKelamin,
  formatSemester,
  formatStatusSiswa,
  formatNumber,
  formatBulan,
  formatPercent,
  truncate,
  getInitials,
} from "@/lib/utils/formatters"

describe("formatDate", () => {
  it("format ISO date ke DD/MM/YYYY", () => {
    expect(formatDate("2026-06-05")).toBe("05/06/2026")
  })

  it("format ISO datetime", () => {
    expect(formatDate("2026-06-05T10:30:00")).toBe("05/06/2026")
  })

  it("return '-' untuk null", () => {
    expect(formatDate(null)).toBe("-")
  })

  it("return '-' untuk undefined", () => {
    expect(formatDate(undefined)).toBe("-")
  })

  it("return '-' untuk string kosong", () => {
    expect(formatDate("")).toBe("-")
  })

  it("return original string untuk invalid date", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date")
  })

  it("dengan withTime = true, include HH:mm", () => {
    expect(formatDate("2026-06-05T10:30:00", true)).toBe("05/06/2026 10:30")
  })
})

describe("formatDateLong", () => {
  it("format ke bahasa Indonesia lengkap", () => {
    const result = formatDateLong("2026-06-05")
    expect(result).toContain("Juni")
    expect(result).toContain("2026")
  })

  it("return '-' untuk null", () => {
    expect(formatDateLong(null)).toBe("-")
  })
})

describe("formatNilai", () => {
  it("format angka ke 2 desimal", () => {
    expect(formatNilai(85.236)).toBe("85.24")
  })

  it("format integer tanpa desimal", () => {
    expect(formatNilai(85)).toBe("85.00")
  })

  it("return '-' untuk null", () => {
    expect(formatNilai(null)).toBe("-")
  })

  it("return '-' untuk undefined", () => {
    expect(formatNilai(undefined)).toBe("-")
  })

  it("return '-' untuk NaN", () => {
    expect(formatNilai(NaN)).toBe("-")
  })

  it("format 100 → '100.00'", () => {
    expect(formatNilai(100)).toBe("100.00")
  })

  it("format 0 → '0.00'", () => {
    expect(formatNilai(0)).toBe("0.00")
  })
})

describe("formatStatusAbsensi", () => {
  it("'H' → 'Hadir'", () => {
    expect(formatStatusAbsensi("H")).toBe("Hadir")
  })

  it("'DL' → 'Dinas Luar'", () => {
    expect(formatStatusAbsensi("DL")).toBe("Dinas Luar")
  })

  it("'S' → 'Sakit'", () => {
    expect(formatStatusAbsensi("S")).toBe("Sakit")
  })

  it("'I' → 'Izin'", () => {
    expect(formatStatusAbsensi("I")).toBe("Izin")
  })

  it("'TK' → 'Tanpa Keterangan'", () => {
    expect(formatStatusAbsensi("TK")).toBe("Tanpa Keterangan")
  })

  it("return '-' untuk null", () => {
    expect(formatStatusAbsensi(null)).toBe("-")
  })

  it("return original untuk status tidak dikenal", () => {
    expect(formatStatusAbsensi("XYZ")).toBe("XYZ")
  })
})

describe("formatPredikat", () => {
  it("'A' → 'A (Sangat Baik)'", () => {
    expect(formatPredikat("A")).toBe("A (Sangat Baik)")
  })

  it("'B' → 'B (Baik)'", () => {
    expect(formatPredikat("B")).toBe("B (Baik)")
  })

  it("'C' → 'C (Cukup)'", () => {
    expect(formatPredikat("C")).toBe("C (Cukup)")
  })

  it("'D' → 'D (Perlu Bimbingan)'", () => {
    expect(formatPredikat("D")).toBe("D (Perlu Bimbingan)")
  })

  it("return '-' untuk null", () => {
    expect(formatPredikat(null)).toBe("-")
  })

  it("return original untuk predikat tidak dikenal", () => {
    expect(formatPredikat("E")).toBe("E")
  })

  it("case insensitive (lowercase 'a')", () => {
    expect(formatPredikat("a")).toBe("A (Sangat Baik)")
  })
})

describe("formatGradeP5", () => {
  it("1 → 'Berkembang'", () => {
    expect(formatGradeP5(1)).toBe("Berkembang")
  })

  it("2 → 'Cakap'", () => {
    expect(formatGradeP5(2)).toBe("Cakap")
  })

  it("3 → 'Mahir'", () => {
    expect(formatGradeP5(3)).toBe("Mahir")
  })

  it("return '-' untuk null", () => {
    expect(formatGradeP5(null)).toBe("-")
  })

  it("return '-' untuk grade tidak valid", () => {
    expect(formatGradeP5(4)).toBe("-")
  })
})

describe("formatUserRole", () => {
  it("'admin' → 'Administrator'", () => {
    expect(formatUserRole("admin")).toBe("Administrator")
  })

  it("'wali_kelas' → 'Wali Kelas'", () => {
    expect(formatUserRole("wali_kelas")).toBe("Wali Kelas")
  })

  it("'guru' → 'Guru'", () => {
    expect(formatUserRole("guru")).toBe("Guru")
  })

  it("return original untuk role tidak dikenal", () => {
    expect(formatUserRole("unknown")).toBe("unknown")
  })
})

describe("formatJenisKelamin", () => {
  it("'Laki-Laki' → 'L'", () => {
    expect(formatJenisKelamin("Laki-Laki")).toBe("L")
  })

  it("'Perempuan' → 'P'", () => {
    expect(formatJenisKelamin("Perempuan")).toBe("P")
  })

  it("return '-' untuk null", () => {
    expect(formatJenisKelamin(null)).toBe("-")
  })
})

describe("formatSemester", () => {
  it("1 → 'Ganjil'", () => {
    expect(formatSemester(1)).toBe("Ganjil")
  })

  it("2 → 'Genap'", () => {
    expect(formatSemester(2)).toBe("Genap")
  })
})

describe("formatStatusSiswa", () => {
  it("'aktif' → 'Aktif'", () => {
    expect(formatStatusSiswa("aktif")).toBe("Aktif")
  })

  it("'tidak_aktif' → 'Tidak Aktif'", () => {
    expect(formatStatusSiswa("tidak_aktif")).toBe("Tidak Aktif")
  })

  it("return '-' untuk null", () => {
    expect(formatStatusSiswa(null)).toBe("-")
  })
})

describe("formatNumber", () => {
  it("format dengan separator ribuan Indonesia", () => {
    expect(formatNumber(1234.5)).toBe("1.234,50")
  })

  it("format integer", () => {
    expect(formatNumber(1000)).toBe("1.000,00")
  })

  it("return '-' untuk null", () => {
    expect(formatNumber(null)).toBe("-")
  })

  it("custom decimals", () => {
    expect(formatNumber(1234.567, 0)).toBe("1.235")
  })
})

describe("formatBulan", () => {
  it("1 → 'Januari'", () => {
    expect(formatBulan(1)).toBe("Januari")
  })

  it("6 → 'Juni'", () => {
    expect(formatBulan(6)).toBe("Juni")
  })

  it("12 → 'Desember'", () => {
    expect(formatBulan(12)).toBe("Desember")
  })

  it("return '-' untuk bulan invalid", () => {
    expect(formatBulan(13)).toBe("-")
    expect(formatBulan(0)).toBe("-")
  })
})

describe("formatPercent", () => {
  it("format angka + simbol %", () => {
    expect(formatPercent(85.5)).toBe("85.5%")
  })

  it("return '-' untuk null", () => {
    expect(formatPercent(null)).toBe("-")
  })

  it("custom decimals", () => {
    expect(formatPercent(85.555, 2)).toBe("85.56%")
  })
})

describe("truncate", () => {
  it("truncate string panjang dengan ellipsis", () => {
    const result = truncate("Ini adalah string yang sangat panjang", 10)
    expect(result).toBe("Ini adalah…")
  })

  it("return original jika lebih pendek dari max", () => {
    expect(truncate("Short", 10)).toBe("Short")
  })

  it("return '-' untuk null", () => {
    expect(truncate(null)).toBe("-")
  })

  it("default maxLength = 50", () => {
    const long = "a".repeat(100)
    expect(truncate(long).length).toBeLessThanOrEqual(51) // 50 chars + ellipsis
  })
})

describe("getInitials", () => {
  it("'Budi Santoso' → 'BS'", () => {
    expect(getInitials("Budi Santoso")).toBe("BS")
  })

  it("'Andi' → 'AN' (2 huruf pertama)", () => {
    expect(getInitials("Andi")).toBe("AN")
  })

  it("'Muhammad Rizki' → 'MR'", () => {
    expect(getInitials("Muhammad Rizki")).toBe("MR")
  })

  it("return '?' untuk null", () => {
    expect(getInitials(null)).toBe("?")
  })

  it("return '?' untuk empty string", () => {
    expect(getInitials("")).toBe("?")
  })

  it("handle multiple spaces", () => {
    expect(getInitials("Budi  Santoso")).toBe("BS")
  })

  it("return uppercase", () => {
    expect(getInitials("budi santoso")).toBe("BS")
  })
})
