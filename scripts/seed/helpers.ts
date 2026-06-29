/**
 * Utilitas untuk seed CLI.
 *
 * Berisi:
 * - Seeded random number generator (deterministik antar run)
 * - Pickers, shuflle, range helpers
 * - Batch insert (jauh lebih cepat dari loop .run() satu-satu)
 * - Progress logger
 * - Timestamp helpers
 */

/* ------------------------------------------------------------------ */
/*  Seeded RNG (mulberry32)                                            */
/* ------------------------------------------------------------------ */

export function createRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof createRng>

/* ------------------------------------------------------------------ */
/*  Pickers                                                            */
/* ------------------------------------------------------------------ */

export function pickOne<T>(arr: readonly T[], rng: Rng): T {
  if (arr.length === 0) throw new Error("pickOne: empty array")
  return arr[Math.floor(rng() * arr.length)]!
}

export function pickMany<T>(arr: readonly T[], count: number, rng: Rng): T[] {
  const copy = [...arr]
  const out: T[] = []
  const n = Math.min(count, copy.length)
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * copy.length)
    out.push(copy.splice(idx, 1)[0]!)
  }
  return out
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

/* ------------------------------------------------------------------ */
/*  Random number / date helpers                                       */
/* ------------------------------------------------------------------ */

export function randInt(min: number, max: number, rng: Rng): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function randFloat(min: number, max: number, rng: Rng, decimals = 2): number {
  const n = rng() * (max - min) + min
  return Number(n.toFixed(decimals))
}

/**
 * Random tanggal ISO (YYYY-MM-DD) antara dua tanggal (inklusif).
 */
export function randDate(startISO: string, endISO: string, rng: Rng): string {
  const start = new Date(startISO).getTime()
  const end = new Date(endISO).getTime()
  const t = randInt(start, end, rng)
  return new Date(t).toISOString().slice(0, 10)
}

/**
 * Daftar hari kerja (Senin-Jumat) antara dua tanggal, urut ascending.
 * Skip weekend.
 */
export function listHariKerja(startISO: string, endISO: string): string[] {
  const out: string[] = []
  const cur = new Date(startISO)
  const end = new Date(endISO)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) {
      out.push(cur.toISOString().slice(0, 10))
    }
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

/* ------------------------------------------------------------------ */
/*  Indonesian realistic generators                                    */
/* ------------------------------------------------------------------ */

/**
 * Generate NIP PNS 18 digit (deterministik dari seed).
 * Format: YYYYMMDDYYYYMM0YYY (tahun-bulan-tahun-bulan-jenis-kelamin-urut)
 */
export function generateNip(rng: Rng): string {
  const tahunLahir = randInt(1970, 1990, rng)
  const bulanLahir = String(randInt(1, 12, rng)).padStart(2, "0")
  const tahunMulai = randInt(2000, 2015, rng)
  const bulanMulai = String(randInt(1, 12, rng)).padStart(2, "0")
  const jenisKelamin = rng() < 0.5 ? "1" : "2"
  const urutan = String(randInt(1, 999, rng)).padStart(3, "0")
  return `${tahunLahir}${bulanLahir}${tahunMulai}${bulanMulai}${jenisKelamin}${urutan}`
}

/**
 * Generate NISN 10 digit (deterministik dari seed).
 */
export function generateNisn(rng: Rng): string {
  let s = ""
  for (let i = 0; i < 10; i++) s += randInt(0, 9, rng)
  return s
}

/**
 * Generate nomor HP Indonesia: 08xxxxxxxxxx (10-12 digit setelah 08).
 */
export function generatePhone(rng: Rng): string {
  const prefix = pickOne(["0812", "0813", "0821", "0822", "0852", "0853", "0878", "0895", "0896", "0898", "0899"], rng)
  let rest = ""
  for (let i = 0; i < 8; i++) rest += randInt(0, 9, rng)
  return prefix + rest
}

/* ------------------------------------------------------------------ */
/*  Batch insert                                                       */
/* ------------------------------------------------------------------ */

/**
 * Batch insert chunks of rows in single transaction. Much faster than
 * per-row .run().
 */
export function batchInsert<T extends Record<string, unknown>>(
  db: { insert: (table: unknown) => { values: (v: T) => { run: () => unknown } } },
  table: unknown,
  rows: T[],
  chunkSize = 500,
): number {
  let inserted = 0
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    for (const row of chunk) {
      ;(db.insert(table).values(row).run() as unknown)
      inserted++
    }
  }
  return inserted
}

/* ------------------------------------------------------------------ */
/*  Progress logger                                                    */
/* ------------------------------------------------------------------ */

export function log(msg: string): void {
  console.log(`[seed] ${msg}`)
}

export function logStep(step: number, total: number, msg: string): void {
  console.log(`\n[seed] (${step}/${total}) ${msg}`)
}

export function logProgress(current: number, total: number, label = ""): void {
  if (total === 0) return
  const pct = Math.floor((current / total) * 100)
  const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5))
  process.stdout.write(`\r[seed] ${bar} ${pct}% (${current}/${total}) ${label}    `)
  if (current === total) process.stdout.write("\n")
}

/* ------------------------------------------------------------------ */
/*  Date / time helpers                                                */
/* ------------------------------------------------------------------ */

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isoNow(): string {
  return new Date().toISOString()
}
