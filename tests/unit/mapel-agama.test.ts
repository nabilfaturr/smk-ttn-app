import { describe, it, expect } from "vitest"
import {
  isMapelAgama,
  getMapelAgamaForSiswa,
  filterMapelForSiswa,
  sortMapelForInput,
  groupMapelByKelompok,
  isGuruPengampuMapel,
  filterMapelByGuru,
} from "@/lib/utils/mapel-agama"
import type { Select } from "@/types/database"

// Mock data minimal untuk test
const mapelUmum = {
  id: 1,
  kode_mapel: "MTK",
  nama_mapel: "Matematika",
  guru_id: 10,
  jenis: "reguler" as const,
  kelompok: "umum" as const,
  agama_target: null,
}

const mapelAgamaIslam = {
  id: 2,
  kode_mapel: "AGAMA_ISLAM",
  nama_mapel: "Pendidikan Agama Islam",
  guru_id: 11,
  jenis: "reguler" as const,
  kelompok: "umum" as const,
  agama_target: "AGAMA_ISLAM",
}

const mapelAgamaKristen = {
  id: 3,
  kode_mapel: "AGAMA_KRISTEN",
  nama_mapel: "Pendidikan Agama Kristen",
  guru_id: 12,
  jenis: "reguler" as const,
  kelompok: "umum" as const,
  agama_target: "AGAMA_KRISTEN",
}

const mapelKejuruan = {
  id: 4,
  kode_mapel: "RPL",
  nama_mapel: "Rekayasa Perangkat Lunak",
  guru_id: 13,
  jenis: "reguler" as const,
  kelompok: "kejuruan" as const,
  agama_target: null,
}

const allMapel: Select.MataPelajaran[] = [
  mapelUmum,
  mapelAgamaIslam,
  mapelAgamaKristen,
  mapelKejuruan,
]

describe("isMapelAgama", () => {
  it("return true untuk mapel dengan agama_target", () => {
    expect(isMapelAgama(mapelAgamaIslam)).toBe(true)
  })

  it("return false untuk mapel tanpa agama_target", () => {
    expect(isMapelAgama(mapelUmum)).toBe(false)
  })

  it("return false untuk mapel dengan agama_target kosong string", () => {
    expect(isMapelAgama({ ...mapelUmum, agama_target: "" })).toBe(false)
  })

  it("return true untuk agama_target null (per definition mapel agama) — kasus eksplisit", () => {
    // Catatan: logikanya agama_target != null && != ""
    expect(isMapelAgama({ ...mapelUmum, agama_target: "AGAMA_HINDU" })).toBe(true)
  })
})

describe("getMapelAgamaForSiswa", () => {
  it("return mapel Agama Islam untuk siswa ISLAM", () => {
    const result = getMapelAgamaForSiswa("ISLAM", allMapel)
    expect(result?.kode_mapel).toBe("AGAMA_ISLAM")
  })

  it("return mapel Agama Kristen untuk siswa KRISTEN PROTESTAN", () => {
    const result = getMapelAgamaForSiswa("KRISTEN PROTESTAN", allMapel)
    expect(result?.kode_mapel).toBe("AGAMA_KRISTEN")
  })

  it("return null untuk siswa tanpa agama", () => {
    expect(getMapelAgamaForSiswa(null, allMapel)).toBeNull()
  })

  it("return null untuk agama yang tidak ada mapelnya", () => {
    // Misal: belum dibuat mapel Agama Hindu
    expect(getMapelAgamaForSiswa("HINDU", allMapel)).toBeNull()
  })

  it("return null untuk agama yang tidak dikenali", () => {
    // @ts-expect-error testing invalid input
    expect(getMapelAgamaForSiswa("AGAMA_LAIN", allMapel)).toBeNull()
  })

  it("return null untuk empty array", () => {
    expect(getMapelAgamaForSiswa("ISLAM", [])).toBeNull()
  })
})

describe("filterMapelForSiswa", () => {
  it("siswa Islam dapat mapel Agama Islam, exclude Kristen", () => {
    const result = filterMapelForSiswa({ agama: "ISLAM" }, allMapel)
    const kodeMapel = result.map((m) => m.kode_mapel).sort()
    expect(kodeMapel).toEqual(["AGAMA_ISLAM", "MTK", "RPL"])
  })

  it("siswa Kristen dapat mapel Agama Kristen, exclude Islam", () => {
    const result = filterMapelForSiswa({ agama: "KRISTEN PROTESTAN" }, allMapel)
    const kodeMapel = result.map((m) => m.kode_mapel).sort()
    expect(kodeMapel).toEqual(["AGAMA_KRISTEN", "MTK", "RPL"])
  })

  it("siswa tanpa agama hanya dapat mapel non-Agama", () => {
    const result = filterMapelForSiswa({ agama: null }, allMapel)
    const kodeMapel = result.map((m) => m.kode_mapel).sort()
    expect(kodeMapel).toEqual(["MTK", "RPL"])
  })

  it("siswa dengan agama tidak dikenali hanya dapat mapel non-Agama", () => {
    // @ts-expect-error testing invalid input
    const result = filterMapelForSiswa({ agama: "AGAMA_LAIN" }, allMapel)
    const kodeMapel = result.map((m) => m.kode_mapel).sort()
    expect(kodeMapel).toEqual(["MTK", "RPL"])
  })

  it("empty mapel list → empty result", () => {
    expect(filterMapelForSiswa({ agama: "ISLAM" }, [])).toEqual([])
  })
})

describe("sortMapelForInput", () => {
  it("mapel Agama muncul pertama", () => {
    const result = sortMapelForInput([mapelKejuruan, mapelAgamaIslam, mapelUmum])
    expect(result[0].kode_mapel).toBe("AGAMA_ISLAM")
  })

  it("sort by kelompok: umum → kejuruan → muatan_lokal → khusus", () => {
    const mapelMuatanLokal = {
      ...mapelUmum,
      id: 5,
      kode_mapel: "JWD",
      nama_mapel: "JWD",
      kelompok: "muatan_lokal" as const,
    }
    const result = sortMapelForInput([mapelKejuruan, mapelMuatanLokal, mapelUmum])
    expect(result[0].kelompok).toBe("umum")
    expect(result[1].kelompok).toBe("kejuruan")
    expect(result[2].kelompok).toBe("muatan_lokal")
  })

  it("sort by nama_mapel within same kelompok", () => {
    const mapelA = { ...mapelUmum, kode_mapel: "A", nama_mapel: "A" }
    const mapelB = { ...mapelUmum, kode_mapel: "B", nama_mapel: "B" }
    const mapelC = { ...mapelUmum, kode_mapel: "C", nama_mapel: "C" }
    const result = sortMapelForInput([mapelC, mapelA, mapelB])
    expect(result.map((m) => m.nama_mapel)).toEqual(["A", "B", "C"])
  })

  it("tidak mutate input array", () => {
    const original = [mapelKejuruan, mapelAgamaIslam]
    const snapshot = [...original]
    sortMapelForInput(original)
    expect(original).toEqual(snapshot)
  })
})

describe("groupMapelByKelompok", () => {
  it("group mapel by kelompok", () => {
    const result = groupMapelByKelompok(allMapel)
    expect(result.umum).toHaveLength(3) // MTK, AGAMA_ISLAM, AGAMA_KRISTEN
    expect(result.kejuruan).toHaveLength(1) // RPL
    expect(result.muatan_lokal).toHaveLength(0)
    expect(result.khusus).toHaveLength(0)
  })

  it("mapel tanpa kelompok masuk 'lain'", () => {
    const mapelTanpaKelompok = { ...mapelUmum, kelompok: null }
    const result = groupMapelByKelompok([mapelTanpaKelompok])
    expect(result.lain).toHaveLength(1)
  })
})

describe("isGuruPengampuMapel", () => {
  it("return true jika guru_id sama dengan mapel.guru_id", () => {
    expect(isGuruPengampuMapel(10, mapelUmum)).toBe(true)
  })

  it("return false jika guru_id berbeda", () => {
    expect(isGuruPengampuMapel(99, mapelUmum)).toBe(false)
  })

  it("return false jika guru_id null", () => {
    expect(isGuruPengampuMapel(null, mapelUmum)).toBe(false)
  })
})

describe("filterMapelByGuru", () => {
  it("return mapel yang diajar guru tertentu", () => {
    const result = filterMapelByGuru(allMapel, 10)
    expect(result).toHaveLength(1)
    expect(result[0].kode_mapel).toBe("MTK")
  })

  it("return empty array untuk guru yang tidak ada di mapel", () => {
    expect(filterMapelByGuru(allMapel, 999)).toEqual([])
  })

  it("return empty array untuk guru_id null", () => {
    expect(filterMapelByGuru(allMapel, null)).toEqual([])
  })
})
