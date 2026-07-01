export type TPCapaian = {
  kode_tp: string
  capaian: "T" | "R"
  deskripsi_tuntas: string
  deskripsi_remediasi: string
}

export function calculateNilaiRapor(
  nilaiFormatif: number | null,
  nilaiSumatif: number | null,
  bobotFormatif = 0.4,
  bobotSumatif = 0.6,
): number | null {
  if (nilaiFormatif == null || nilaiSumatif == null) return null
  return Math.round((nilaiFormatif * bobotFormatif + nilaiSumatif * bobotSumatif) * 100) / 100
}

export function generateDeskripsiTP(tpList: TPCapaian[]): string {
  return tpList
    .map((tp) => {
      if (tp.capaian === "T") {
        return `Mencapai kompetensi dengan sangat baik dalam hal ${tp.deskripsi_tuntas}`
      }
      return `Perlu peningkatan dalam hal ${tp.deskripsi_remediasi}`
    })
    .join(". ")
}

export function calculateNilaiRaporPrakerin(
  tpl: number | null,
  sl: number | null,
  sk: number | null,
): number | null {
  if (tpl == null || sl == null || sk == null) return null
  return Math.round(((tpl + sl + sk) / 3) * 100) / 100
}

export function generateNarasiKokurikuler(
  nilai: { subdimensi_id: number; grade: number; deskripsi_berkembang: string; deskripsi_cakap: string; deskripsi_mahir: string }[],
): string {
  const sentences = nilai
    .map((n) => {
      if (n.grade === 1) return n.deskripsi_berkembang
      if (n.grade === 2) return n.deskripsi_cakap
      if (n.grade === 3) return n.deskripsi_mahir
      return ""
    })
    .filter(Boolean)
    .map((s) => s.trim().replace(/\.+$/, ""))
  if (sentences.length === 0) return ""
  return sentences.join(". ")
}
