import { describe, it, expect } from "vitest"
import {
  calculateNilaiRapor,
  generateDeskripsiTP,
  calculateNilaiRaporPrakerin,
  generateNarasiKokurikuler,
} from "@/lib/calculations/grades"

describe("calculateNilaiRapor", () => {
  it("menghitung nilai rapor dengan bobot default (40% formatif, 60% sumatif)", () => {
    // (80 * 0.4) + (90 * 0.6) = 32 + 54 = 86
    expect(calculateNilaiRapor(80, 90)).toBe(86)
  })

  it("menghitung dengan bobot custom", () => {
    // (70 * 0.3) + (80 * 0.7) = 21 + 56 = 77
    expect(calculateNilaiRapor(70, 80, 0.3, 0.7)).toBe(77)
  })

  it("membulatkan ke 2 desimal", () => {
    // (85 * 0.4) + (87 * 0.6) = 34 + 52.2 = 86.2
    expect(calculateNilaiRapor(85, 87)).toBe(86.2)
  })

  it("membulatkan ke bawah untuk desimal panjang", () => {
    // (83 * 0.4) + (86 * 0.6) = 33.2 + 51.6 = 84.8
    expect(calculateNilaiRapor(83, 86)).toBe(84.8)
  })

  it("return null jika formatif null", () => {
    expect(calculateNilaiRapor(null, 90)).toBeNull()
  })

  it("return null jika sumatif null", () => {
    expect(calculateNilaiRapor(80, null)).toBeNull()
  })

  it("return null jika keduanya null", () => {
    expect(calculateNilaiRapor(null, null)).toBeNull()
  })

  it("handle nilai 0 dengan benar", () => {
    // (0 * 0.4) + (0 * 0.6) = 0
    expect(calculateNilaiRapor(0, 0)).toBe(0)
  })

  it("handle nilai 100 dengan benar", () => {
    // (100 * 0.4) + (100 * 0.6) = 100
    expect(calculateNilaiRapor(100, 100)).toBe(100)
  })

  it("return 84.6 untuk (85, 84.333)", () => {
    // (85 * 0.4) + (84.333 * 0.6) = 34 + 50.5998 = 84.5998 -> 84.6
    expect(calculateNilaiRapor(85, 84.333)).toBe(84.6)
  })
})

describe("generateDeskripsiTP", () => {
  it("menghasilkan deskripsi untuk capaian Tuntas", () => {
    const result = generateDeskripsiTP([
      {
        kode_tp: "TP1",
        capaian: "T",
        deskripsi_tuntas: "mengenal bilangan cacah",
        deskripsi_remediasi: "mengulang materi bilangan cacah",
      },
    ])
    expect(result).toBe("Mencapai kompetensi dengan sangat baik dalam hal mengenal bilangan cacah")
  })

  it("menghasilkan deskripsi untuk capaian Remediasi", () => {
    const result = generateDeskripsiTP([
      {
        kode_tp: "TP1",
        capaian: "R",
        deskripsi_tuntas: "mengenal bilangan cacah",
        deskripsi_remediasi: "mengulang materi bilangan cacah",
      },
    ])
    expect(result).toBe("Perlu peningkatan dalam hal mengulang materi bilangan cacah")
  })

  it("menggabungkan beberapa TP dengan separator titik", () => {
    const result = generateDeskripsiTP([
      {
        kode_tp: "TP1",
        capaian: "T",
        deskripsi_tuntas: "menjumlahkan bilangan",
        deskripsi_remediasi: "mengulang penjumlahan",
      },
      {
        kode_tp: "TP2",
        capaian: "R",
        deskripsi_tuntas: "mengurangkan bilangan",
        deskripsi_remediasi: "mengulang pengurangan",
      },
    ])
    expect(result).toBe(
      "Mencapai kompetensi dengan sangat baik dalam hal menjumlahkan bilangan. Perlu peningkatan dalam hal mengulang pengurangan",
    )
  })

  it("return string kosong untuk array kosong", () => {
    expect(generateDeskripsiTP([])).toBe("")
  })

  it("handle mix T dan R dengan benar", () => {
    const result = generateDeskripsiTP([
      { kode_tp: "TP1", capaian: "T", deskripsi_tuntas: "A", deskripsi_remediasi: "a" },
      { kode_tp: "TP2", capaian: "R", deskripsi_tuntas: "B", deskripsi_remediasi: "b" },
      { kode_tp: "TP3", capaian: "T", deskripsi_tuntas: "C", deskripsi_remediasi: "c" },
    ])
    expect(result).toBe("Mencapai kompetensi dengan sangat baik dalam hal A. Perlu peningkatan dalam hal b. Mencapai kompetensi dengan sangat baik dalam hal C")
  })
})

describe("calculateNilaiRaporPrakerin", () => {
  it("menghitung rata-rata TPL+SL+SK", () => {
    // (80 + 85 + 90) / 3 = 85
    expect(calculateNilaiRaporPrakerin(80, 85, 90)).toBe(85)
  })

  it("membulatkan ke 2 desimal", () => {
    // (80 + 85 + 86) / 3 = 83.666... -> 83.67
    expect(calculateNilaiRaporPrakerin(80, 85, 86)).toBe(83.67)
  })

  it("membulatkan 83.665 ke 83.67", () => {
    expect(calculateNilaiRaporPrakerin(80, 85, 86)).toBe(83.67)
  })

  it("return null jika salah satu komponen null", () => {
    expect(calculateNilaiRaporPrakerin(null, 85, 90)).toBeNull()
    expect(calculateNilaiRaporPrakerin(80, null, 90)).toBeNull()
    expect(calculateNilaiRaporPrakerin(80, 85, null)).toBeNull()
  })

  it("return null jika semuanya null", () => {
    expect(calculateNilaiRaporPrakerin(null, null, null)).toBeNull()
  })

  it("handle nilai 0", () => {
    expect(calculateNilaiRaporPrakerin(0, 0, 0)).toBe(0)
  })

  it("handle nilai 100", () => {
    expect(calculateNilaiRaporPrakerin(100, 100, 100)).toBe(100)
  })

  it("return nilai yang sama untuk 3 angka identik", () => {
    expect(calculateNilaiRaporPrakerin(75, 75, 75)).toBe(75)
  })
})

describe("generateNarasiKokurikuler", () => {
  const sampleData = [
    {
      subdimensi_id: 1,
      grade: 1,
      deskripsi_berkembang: "Mulai memahami konsep A",
      deskripsi_cakap: "Memahami konsep A dengan baik",
      deskripsi_mahir: "Menguasai konsep A dengan sangat baik",
    },
    {
      subdimensi_id: 2,
      grade: 2,
      deskripsi_berkembang: "Mulai memahami konsep B",
      deskripsi_cakap: "Memahami konsep B dengan baik",
      deskripsi_mahir: "Menguasai konsep B dengan sangat baik",
    },
    {
      subdimensi_id: 3,
      grade: 3,
      deskripsi_berkembang: "Mulai memahami konsep C",
      deskripsi_cakap: "Memahami konsep C dengan baik",
      deskripsi_mahir: "Menguasai konsep C dengan sangat baik",
    },
  ]

  it("mengambil deskripsi_berkembang untuk grade 1", () => {
    const result = generateNarasiKokurikuler([sampleData[0]])
    expect(result).toBe("Mulai memahami konsep A")
  })

  it("mengambil deskripsi_cakap untuk grade 2", () => {
    const result = generateNarasiKokurikuler([sampleData[1]])
    expect(result).toBe("Memahami konsep B dengan baik")
  })

  it("mengambil deskripsi_mahir untuk grade 3", () => {
    const result = generateNarasiKokurikuler([sampleData[2]])
    expect(result).toBe("Menguasai konsep C dengan sangat baik")
  })

  it("menggabungkan semua grade dengan separator titik", () => {
    const result = generateNarasiKokurikuler(sampleData)
    expect(result).toBe(
      "Mulai memahami konsep A. Memahami konsep B dengan baik. Menguasai konsep C dengan sangat baik",
    )
  })

  it("return string kosong untuk array kosong", () => {
    expect(generateNarasiKokurikuler([])).toBe("")
  })

  it("skip grade yang tidak valid", () => {
    const result = generateNarasiKokurikuler([
      { ...sampleData[0], grade: 99 as any },
      sampleData[1],
    ])
    expect(result).toBe("Memahami konsep B dengan baik")
  })
})
