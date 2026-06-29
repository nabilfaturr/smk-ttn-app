import { describe, it, expect } from "vitest"
import {
  calculateRecap,
  convertJamToHari,
  getStatusLabel,
  type AbsensiRecord,
} from "@/lib/calculations/attendance"

describe("calculateRecap", () => {
  it("menghitung total per status untuk satu siswa", () => {
    const records: AbsensiRecord[] = [
      { siswa_id: 1, status: "H" },
      { siswa_id: 1, status: "H" },
      { siswa_id: 1, status: "S" },
      { siswa_id: 1, status: "I" },
    ]
    const result = calculateRecap(records)
    expect(result).toEqual({
      siswa_id: 1,
      total_hadir: 2,
      total_dl: 0,
      total_s: 1,
      total_i: 1,
      total_tk: 0,
    })
  })

  it("menghitung total dengan semua status", () => {
    const records: AbsensiRecord[] = [
      { siswa_id: 2, status: "H" },
      { siswa_id: 2, status: "DL" },
      { siswa_id: 2, status: "S" },
      { siswa_id: 2, status: "I" },
      { siswa_id: 2, status: "TK" },
    ]
    const result = calculateRecap(records)
    expect(result.total_hadir).toBe(1)
    expect(result.total_dl).toBe(1)
    expect(result.total_s).toBe(1)
    expect(result.total_i).toBe(1)
    expect(result.total_tk).toBe(1)
  })

  it("return 0 untuk semua field jika records kosong", () => {
    const result = calculateRecap([])
    expect(result.total_hadir).toBe(0)
    expect(result.total_dl).toBe(0)
    expect(result.total_s).toBe(0)
    expect(result.total_i).toBe(0)
    expect(result.total_tk).toBe(0)
    expect(result.siswa_id).toBe(0)
  })

  it("menghitung dari banyak record", () => {
    const records: AbsensiRecord[] = Array(10).fill({ siswa_id: 3, status: "H" as const })
    const result = calculateRecap(records)
    expect(result.total_hadir).toBe(10)
  })

  it("menghitung mix banyak status", () => {
    const records: AbsensiRecord[] = [
      { siswa_id: 4, status: "H" },
      { siswa_id: 4, status: "H" },
      { siswa_id: 4, status: "H" },
      { siswa_id: 4, status: "H" },
      { siswa_id: 4, status: "H" },
      { siswa_id: 4, status: "DL" },
      { siswa_id: 4, status: "DL" },
      { siswa_id: 4, status: "S" },
      { siswa_id: 4, status: "I" },
      { siswa_id: 4, status: "TK" },
    ]
    const result = calculateRecap(records)
    expect(result).toEqual({
      siswa_id: 4,
      total_hadir: 5,
      total_dl: 2,
      total_s: 1,
      total_i: 1,
      total_tk: 1,
    })
  })
})

describe("convertJamToHari", () => {
  it("mengkonversi jam ke hari dengan floor division", () => {
    // 19 jam / 6 jam_per_hari = 3.166... -> 3 hari
    expect(convertJamToHari(19, 6)).toBe(3)
  })

  it("mengembalikan 0 untuk jam < jamPerHari", () => {
    expect(convertJamToHari(3, 6)).toBe(0)
  })

  it("mengembalikan 1 untuk tepat 1 hari", () => {
    expect(convertJamToHari(6, 6)).toBe(1)
  })

  it("floor untuk hasil desimal", () => {
    // 12 jam / 5 = 2.4 -> 2
    expect(convertJamToHari(12, 5)).toBe(2)
  })

  it("handle 0 jam", () => {
    expect(convertJamToHari(0, 6)).toBe(0)
  })

  it("konversi 30 jam = 5 hari dengan 6 jam/hari", () => {
    expect(convertJamToHari(30, 6)).toBe(5)
  })
})

describe("getStatusLabel", () => {
  it("return 'Hadir' untuk H", () => {
    expect(getStatusLabel("H")).toBe("Hadir")
  })

  it("return 'Dinas Luar' untuk DL", () => {
    expect(getStatusLabel("DL")).toBe("Dinas Luar")
  })

  it("return 'Sakit' untuk S", () => {
    expect(getStatusLabel("S")).toBe("Sakit")
  })

  it("return 'Izin' untuk I", () => {
    expect(getStatusLabel("I")).toBe("Izin")
  })

  it("return 'Tanpa Keterangan' untuk TK", () => {
    expect(getStatusLabel("TK")).toBe("Tanpa Keterangan")
  })

  it("semua label harus non-kosong", () => {
    const statuses: Array<"H" | "DL" | "S" | "I" | "TK"> = ["H", "DL", "S", "I", "TK"]
    for (const s of statuses) {
      expect(getStatusLabel(s)).toBeTruthy()
      expect(getStatusLabel(s).length).toBeGreaterThan(0)
    }
  })
})
