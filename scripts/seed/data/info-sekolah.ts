/**
 * Seed: info_sekolah (1 row).
 */
import type { Db } from "../connection"
import * as schema from "../../../src/lib/db/schema"
import { log } from "../helpers"

const DEFAULT_INFO = {
  nama: "SMK Taruna Tekno Nusantara",
  alamat:
    "Jl. Pembangunan No. 45, Sidirejo, Kec. Namo Rambe, Kab. Deli Serdang, Prov. Sumatera Utara 20351",
  tempat: "Namorambe",
  kepala_sekolah: "Muhsin Rokan, S.Kom, S.H. M.H. Gr",
  npsn: "70035993",
}

export function seedInfoSekolah(db: Db): void {
  const existing = db.select().from(schema.infoSekolah).get()
  if (existing) {
    log("  → info_sekolah already exists, skip")
    return
  }
  db.insert(schema.infoSekolah).values(DEFAULT_INFO).run()
  log("  ✓ info_sekolah inserted (SMK Taruna Tekno Nusantara)")
}
