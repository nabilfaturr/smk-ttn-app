/**
 * Translate SQLite/Drizzle error messages ke bahasa Indonesia.
 *
 * Dipakai oleh frontend untuk tampilkan error friendly saat IPC return { error: ... }.
 *
 * Contoh:
 * - "UNIQUE constraint failed: siswa.nis" → "NIS sudah digunakan oleh siswa lain"
 * - "FOREIGN KEY constraint failed" → "Data terkait (kelas/guru) tidak ditemukan"
 */
export function translateDbError(rawMessage: string): string {
  const msg = rawMessage || ""

  // NIS unique
  if (msg.includes("UNIQUE constraint failed") && msg.includes("siswa.nis")) {
    return "NIS sudah digunakan oleh siswa lain. Gunakan NIS yang berbeda."
  }
  // NISN unique
  if (msg.includes("UNIQUE constraint failed") && msg.includes("siswa.nisn")) {
    return "NISN sudah digunakan oleh siswa lain."
  }
  // Generic unique
  if (msg.includes("UNIQUE constraint failed")) {
    const match = msg.match(/UNIQUE constraint failed: (\S+\.\S+)/)
    const field = match ? match[1].split(".")[1] : "data"
    return `${field} sudah digunakan. Gunakan nilai yang berbeda.`
  }
  // Foreign key
  if (msg.includes("FOREIGN KEY constraint failed")) {
    return "Data terkait (kelas/guru/TA) tidak ditemukan. Periksa pilihan Anda."
  }
  // Not null
  if (msg.includes("NOT NULL constraint failed")) {
    const match = msg.match(/NOT NULL constraint failed: (\S+\.\S+)/)
    const field = match ? match[1].split(".")[1] : "Field"
    return `${field} wajib diisi.`
  }
  // Default: tampilkan raw
  return msg || "Terjadi kesalahan pada database."
}
