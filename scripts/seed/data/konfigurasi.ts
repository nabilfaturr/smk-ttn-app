/**
 * Seed: konfigurasi (key-value pairs).
 */
import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { log } from "../helpers"

const DEFAULTS: Array<{ kunci: string; nilai: string; keterangan: string }> = [
  { kunci: "JAM_PER_HARI", nilai: "6", keterangan: "Jumlah jam pelajaran per hari sekolah" },
  { kunci: "BOBOT_FORMATIF", nilai: "0.4", keterangan: "Bobot nilai formatif (40%)" },
  { kunci: "BOBOT_SUMATIF", nilai: "0.6", keterangan: "Bobot nilai sumatif (60%)" },
  { kunci: "KONVENSI_JAM_HARI", nilai: "pembulatan", keterangan: "Metode konversi jam ke hari" },
  { kunci: "KKM_DEFAULT", nilai: "75", keterangan: "KKM default untuk mata pelajaran" },
]

export function seedKonfigurasi(db: Db): void {
  const existing = db.select().from(schema.konfigurasi).all()
  const existingKeys = new Set(existing.map((c) => c.kunci))
  const toInsert = DEFAULTS.filter((c) => !existingKeys.has(c.kunci))
  if (toInsert.length === 0) {
    log("  → konfigurasi already complete, skip")
    return
  }
  for (const c of toInsert) {
    db.insert(schema.konfigurasi).values(c).run()
  }
  log(`  ✓ konfigurasi inserted (${toInsert.length} keys)`)
}
