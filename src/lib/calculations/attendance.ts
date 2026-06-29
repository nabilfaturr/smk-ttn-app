export type AbsensiStatus = "H" | "DL" | "S" | "I" | "TK"

export type AbsensiRecord = {
  siswa_id: number
  status: AbsensiStatus
}

export type RecapItem = {
  siswa_id: number
  total_hadir: number
  total_dl: number
  total_s: number
  total_i: number
  total_tk: number
}

export function calculateRecap(records: AbsensiRecord[]): RecapItem {
  return {
    siswa_id: records[0]?.siswa_id ?? 0,
    total_hadir: records.filter((r) => r.status === "H").length,
    total_dl: records.filter((r) => r.status === "DL").length,
    total_s: records.filter((r) => r.status === "S").length,
    total_i: records.filter((r) => r.status === "I").length,
    total_tk: records.filter((r) => r.status === "TK").length,
  }
}

export function convertJamToHari(totalJam: number, jamPerHari: number): number {
  return Math.floor(totalJam / jamPerHari)
}

export function getStatusLabel(status: AbsensiStatus): string {
  const labels: Record<AbsensiStatus, string> = {
    H: "Hadir",
    DL: "Dinas Luar",
    S: "Sakit",
    I: "Izin",
    TK: "Tanpa Keterangan",
  }
  return labels[status]
}
