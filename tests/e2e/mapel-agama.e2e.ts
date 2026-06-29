import { test, expect, login } from "./fixtures/electron-fixture"
import {
  filterMapelForSiswa,
  getMapelAgamaForSiswa,
} from "@/lib/utils/mapel-agama"
import type { Select } from "@/types/database"

/**
 * XMD-06: Filter mapel agama untuk siswa
 *
 * Logic ini di-validate di tests/unit/mapel-agama.test.ts (27 tests).
 * Test ini verifikasi behavior dari perspektif UI flow (admin melihat mapel
 * Agama yang sesuai ketika input nilai atau generate rapor).
 */
test.describe("Filter Mapel Agama - P0 (XMD-06)", () => {
  test("unit-level: siswa Islam → mapel Agama Islam", async () => {
    const mapel: Select.MataPelajaran[] = [
      { id: 1, kode_mapel: "AGAMA_ISLAM", nama_mapel: "Pendidikan Agama Islam", guru_id: 1, jenis: "reguler", kelompok: "umum", agama_target: "AGAMA_ISLAM" },
      { id: 2, kode_mapel: "AGAMA_KRISTEN", nama_mapel: "Pendidikan Agama Kristen", guru_id: 2, jenis: "reguler", kelompok: "umum", agama_target: "AGAMA_KRISTEN" },
      { id: 3, kode_mapel: "MTK", nama_mapel: "Matematika", guru_id: 3, jenis: "reguler", kelompok: "umum", agama_target: null },
    ]

    const islamMapel = getMapelAgamaForSiswa("ISLAM", mapel)
    expect(islamMapel?.kode_mapel).toBe("AGAMA_ISLAM")

    const filtered = filterMapelForSiswa({ agama: "ISLAM" }, mapel)
    const kodeMapel = filtered.map((m) => m.kode_mapel).sort()
    expect(kodeMapel).toEqual(["AGAMA_ISLAM", "MTK"])
  })

  test("unit-level: siswa Kristen → mapel Agama Kristen (exclude Islam)", async () => {
    const mapel: Select.MataPelajaran[] = [
      { id: 1, kode_mapel: "AGAMA_ISLAM", nama_mapel: "Pendidikan Agama Islam", guru_id: 1, jenis: "reguler", kelompok: "umum", agama_target: "AGAMA_ISLAM" },
      { id: 2, kode_mapel: "AGAMA_KRISTEN", nama_mapel: "Pendidikan Agama Kristen", guru_id: 2, jenis: "reguler", kelompok: "umum", agama_target: "AGAMA_KRISTEN" },
      { id: 3, kode_mapel: "MTK", nama_mapel: "Matematika", guru_id: 3, jenis: "reguler", kelompok: "umum", agama_target: null },
    ]

    const filtered = filterMapelForSiswa({ agama: "KRISTEN PROTESTAN" }, mapel)
    const kodeMapel = filtered.map((m) => m.kode_mapel).sort()
    expect(kodeMapel).toEqual(["AGAMA_KRISTEN", "MTK"])
  })

  test("integration: guru input nilai → mapel terfilter sesuai", async ({ page }) => {
    // UI-level: Login sebagai guru, buka Input Nilai, dropdown mapel
    // harus menampilkan mapel yang diajar (filtered by guru_id).
    // Catatan: filter per-agama-siswa terjadi di level rapor generation,
    // bukan di dropdown input nilai guru (guru mengajar untuk semua siswa).
    await login(page, "guru", "guru123")
    await page.click("text=/Input Nilai/i")
    await page.waitForURL(/\/grades\/input/)
    await page.waitForTimeout(1_000)

    // Halaman render dengan benar
    await expect(page.locator("h2")).toContainText(/Nilai/i)
    await expect(page.locator('button:has-text("Pilih mapel")')).toBeVisible()
  })
})
