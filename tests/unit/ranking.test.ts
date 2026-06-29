import { describe, it, expect } from "vitest"
import { assignRanks } from "@/lib/calculations/ranking"

describe("assignRanks", () => {
  it("return rank 1 untuk siswa dengan jumlah tertinggi", () => {
    const result = assignRanks([
      { siswa_id: 1, nama: "Andi", jumlah: 300 },
      { siswa_id: 2, nama: "Budi", jumlah: 280 },
      { siswa_id: 3, nama: "Cici", jumlah: 260 },
    ])
    expect(result[0].rank).toBe(1)
    expect(result[0].nama).toBe("Andi")
  })

  it("sort descending by jumlah", () => {
    const result = assignRanks([
      { siswa_id: 1, nama: "A", jumlah: 100 },
      { siswa_id: 2, nama: "B", jumlah: 300 },
      { siswa_id: 3, nama: "C", jumlah: 200 },
    ])
    expect(result.map((r) => r.nama)).toEqual(["B", "C", "A"])
  })

  it("berikan rank sama untuk jumlah yang sama (tie)", () => {
    const result = assignRanks([
      { siswa_id: 1, nama: "A", jumlah: 300 },
      { siswa_id: 2, nama: "B", jumlah: 300 },
      { siswa_id: 3, nama: "C", jumlah: 280 },
    ])
    expect(result[0].rank).toBe(1)
    expect(result[1].rank).toBe(1)
    expect(result[2].rank).toBe(3) // skip 2 karena ada tie
  })

  it("tie 3 siswa dapat rank 1, 1, 1, dan berikutnya rank 4", () => {
    const result = assignRanks([
      { siswa_id: 1, nama: "A", jumlah: 300 },
      { siswa_id: 2, nama: "B", jumlah: 300 },
      { siswa_id: 3, nama: "C", jumlah: 300 },
      { siswa_id: 4, nama: "D", jumlah: 280 },
    ])
    expect(result[0].rank).toBe(1)
    expect(result[1].rank).toBe(1)
    expect(result[2].rank).toBe(1)
    expect(result[3].rank).toBe(4)
  })

  it("return array kosong untuk input kosong", () => {
    expect(assignRanks([])).toEqual([])
  })

  it("handle satu siswa", () => {
    const result = assignRanks([{ siswa_id: 1, nama: "Solo", jumlah: 100 }])
    expect(result[0].rank).toBe(1)
  })

  it("semua siswa dapat jumlah 0 → semua rank 1", () => {
    const result = assignRanks([
      { siswa_id: 1, nama: "A", jumlah: 0 },
      { siswa_id: 2, nama: "B", jumlah: 0 },
      { siswa_id: 3, nama: "C", jumlah: 0 },
    ])
    expect(result[0].rank).toBe(1)
    expect(result[1].rank).toBe(1)
    expect(result[2].rank).toBe(1)
  })

  it("tie pada posisi tengah", () => {
    const result = assignRanks([
      { siswa_id: 1, nama: "A", jumlah: 300 },
      { siswa_id: 2, nama: "B", jumlah: 250 },
      { siswa_id: 3, nama: "C", jumlah: 250 },
      { siswa_id: 4, nama: "D", jumlah: 200 },
    ])
    expect(result[0].rank).toBe(1) // A
    expect(result[1].rank).toBe(2) // B (tie dengan C)
    expect(result[2].rank).toBe(2) // C
    expect(result[3].rank).toBe(4) // D (skip 3)
  })

  it("rank increment dengan benar untuk descending unik", () => {
    const result = assignRanks([
      { siswa_id: 1, nama: "A", jumlah: 400 },
      { siswa_id: 2, nama: "B", jumlah: 300 },
      { siswa_id: 3, nama: "C", jumlah: 200 },
      { siswa_id: 4, nama: "D", jumlah: 100 },
    ])
    expect(result.map((r) => r.rank)).toEqual([1, 2, 3, 4])
  })

  it("preserve siswa_id di output", () => {
    const result = assignRanks([
      { siswa_id: 100, nama: "A", jumlah: 100 },
      { siswa_id: 200, nama: "B", jumlah: 200 },
    ])
    expect(result[0].siswa_id).toBe(200)
    expect(result[1].siswa_id).toBe(100)
  })
})
