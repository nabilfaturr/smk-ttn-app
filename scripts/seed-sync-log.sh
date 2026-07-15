#!/bin/bash
# Insert semua row di SYNCABLE tables ke sync_log (status=pending).
# Jalankan setelah seed, SEBELUM app start, biar initial push ke Firestore jalan.
#
# Usage: bash scripts/seed-sync-log.sh
#
# Requires: sqlite3 CLI + sync_log table exists (run npm run db:fresh:full first)

set -e

DB_PATH="${SMK_TTN_DB_PATH:-$HOME/.config/smk-ttn-app/smk-ttn.db}"

if [ ! -f "$DB_PATH" ]; then
  echo "DB not found: $DB_PATH"
  echo "Run: npm run db:fresh:full"
  exit 1
fi

# Tabel-tabel yang di-sync (master + transaksional, exclude sync_log + nilai_ketarunaan)
TABLES=(
  "users" "tahun_ajaran" "info_sekolah" "konfigurasi"
  "dimensi_p5" "subdimensi_p5" "subdimensi_p5_tingkat" "ekskul"
  "guru" "mata_pelajaran" "kelas" "mapel_kelas_guru" "siswa"
  "tujuan_pembelajaran" "absensi" "nilai" "nilai_tp"
  "nilai_prakerin" "absensi_prakerin" "nilai_ekskul"
  "nilai_kokurikuler" "catatan_wali_kelas"
)

TOTAL_QUEUED=0

for tabel in "${TABLES[@]}"; do
  # Count rows di tabel
  count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM \"$tabel\";")
  if [ "$count" -eq 0 ]; then
    echo "[$tabel] 0 rows, skip"
    continue
  fi

  # Insert semua id ke sync_log (skip kalau sudah ada)
  queued=$(sqlite3 "$DB_PATH" "
    INSERT INTO sync_log (id, tabel, record_id, action, synced_at, status, retry_count, next_retry_at, last_error, updated_at)
    SELECT
      lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' ||
      substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
      '$tabel',
      id,
      'insert',
      datetime('now'),
      'pending',
      0,
      NULL,
      NULL,
      datetime('now')
    FROM \"$tabel\"
    WHERE NOT EXISTS (
      SELECT 1 FROM sync_log sl
      WHERE sl.tabel = '$tabel' AND sl.record_id = \"$tabel\".id
    );
    SELECT changes();
  " | tail -1)

  echo "[$tabel] queued $queued / $count"
  TOTAL_QUEUED=$((TOTAL_QUEUED + queued))
done

echo ""
echo "Total queued: $TOTAL_QUEUED records"
echo ""
echo "Sekarang start app (npm run dev atau npx electron dist-electron/main.js)"
echo "Sync engine akan push semua ke Firestore dalam 30 detik (interval)."
