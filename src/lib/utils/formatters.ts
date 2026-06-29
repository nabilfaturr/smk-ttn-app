import { format, parseISO, isValid } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { STATUS_ABSENSI_LABELS, type StatusAbsensi } from "@/types/attendance"
import type { Select } from "@/types/database"
import { PREDIKAT_OPTIONS } from "@/types/grades"

/**
 * Format ISO date string (YYYY-MM-DD) ke "DD/MM/YYYY" untuk display.
 * Mendukung juga format datetime ISO (YYYY-MM-DDTHH:mm:ss).
 *
 * @example formatDate("2026-06-05") // "05/06/2026"
 */
export function formatDate(dateStr: string | null | undefined, withTime = false): string {
  if (!dateStr) return "-"
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr
    return withTime
      ? format(date, "dd/MM/yyyy HH:mm", { locale: idLocale })
      : format(date, "dd/MM/yyyy")
  } catch {
    return dateStr
  }
}

/**
 * Format tanggal ke format panjang bahasa Indonesia.
 *
 * @example formatDateLong("2026-06-05") // "5 Juni 2026"
 */
export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr
    return format(date, "d MMMM yyyy", { locale: idLocale })
  } catch {
    return dateStr
  }
}

/**
 * Format angka nilai ke 2 desimal, atau "-" jika null/undefined.
 *
 * @example formatNilai(85.236) // "85.24"
 */
export function formatNilai(nilai: number | null | undefined): string {
  if (nilai == null || isNaN(nilai)) return "-"
  return Number(nilai).toFixed(2)
}

/**
 * Format kode status absensi ke label panjang bahasa Indonesia.
 *
 * @example formatStatusAbsensi("H") // "Hadir"
 */
export function formatStatusAbsensi(status: StatusAbsensi | string | null | undefined): string {
  if (!status) return "-"
  return STATUS_ABSENSI_LABELS[status as StatusAbsensi] ?? status
}

/**
 * Format predikat (A/B/C/D) ke label dengan deskripsi singkat.
 *
 * @example formatPredikat("A") // "A (Sangat Baik)"
 */
export function formatPredikat(predikat: string | null | undefined): string {
  if (!predikat) return "-"
  const p = PREDIKAT_OPTIONS[predikat.toUpperCase()]
  return p ? `${p.label} (${p.deskripsi})` : predikat
}

/**
 * Format grade P5 (1/2/3) ke label deskriptif.
 *
 * @example formatGradeP5(1) // "Berkembang"
 * @example formatGradeP5(2) // "Cakap"
 * @example formatGradeP5(3) // "Mahir"
 */
export function formatGradeP5(grade: number | null | undefined): string {
  if (grade == null) return "-"
  const map: Record<number, string> = { 1: "Berkembang", 2: "Cakap", 3: "Mahir" }
  return map[grade] ?? "-"
}

/**
 * Format role user ke label Indonesia.
 */
export function formatUserRole(role: Select["User"]["role"] | string): string {
  const map: Record<string, string> = {
    admin: "Administrator",
    wali_kelas: "Wali Kelas",
    guru: "Guru",
  }
  return map[role] ?? role
}

/**
 * Format jenis kelamin ke label Indonesia.
 */
export function formatJenisKelamin(jk: string | null | undefined): string {
  if (!jk) return "-"
  return jk === "Laki-Laki" ? "L" : "P"
}

/**
 * Format semester ke "Ganjil" / "Genap".
 */
export function formatSemester(semester: number): string {
  return semester === 1 ? "Ganjil" : "Genap"
}

/**
 * Format status siswa ke label.
 */
export function formatStatusSiswa(status: string | null | undefined): string {
  if (!status) return "-"
  return status === "aktif" ? "Aktif" : "Tidak Aktif"
}

/**
 * Format angka dengan separator ribuan (untuk nilai rapor jumlah, dll).
 *
 * @example formatNumber(1234.5) // "1.234,50"
 */
export function formatNumber(num: number | null | undefined, decimals = 2): string {
  if (num == null || isNaN(num)) return "-"
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format nama bulan ke bahasa Indonesia.
 */
export function formatBulan(bulan: number): string {
  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]
  return namaBulan[bulan - 1] ?? "-"
}

/**
 * Format percentage (0-100) ke string dengan simbol %.
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return "-"
  return `${value.toFixed(decimals)}%`
}

/**
 * Truncate string panjang dengan ellipsis.
 */
export function truncate(text: string | null | undefined, maxLength = 50): string {
  if (!text) return "-"
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

/**
 * Inisial nama (untuk avatar).
 *
 * @example getInitials("Budi Santoso") // "BS"
 */
export function getInitials(nama: string | null | undefined): string {
  if (!nama) return "?"
  const parts = nama.trim().split(/\s+/)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
