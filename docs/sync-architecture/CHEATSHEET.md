# Sync Cheat Sheet — SMK TTN

> 1-pager ringkas untuk referensi cepat. Print atau screenshot.

---

## ⚡ 30-Second Summary

```
SQLite (lokal) = source of truth
Firestore (cloud) = replica
Sync = 30 detik interval + real-time listener
Pattern = outbox (sync_log table)
```

---

## 🔄 Alur dalam 5 Langkah

```
1. User CRUD via UI
   ↓
2. IPC handler → INSERT ke SQLite + catat di sync_log
   ↓
3. UI langsung update (instant, no network)
   ↓
4. Setiap 30 detik: sync engine baca sync_log → push ke Firestore
   ↓
5. Listener onSnapshot di device lain → upsert SQLite → broadcast UI
```

---

## 📋 Tabel sync_log (Outbox)

> "Buku pesanan" yang mencatat setiap perubahan lokal. Outbox pattern = pisah "tulis data" dengan "kirim ke cloud" untuk reliability.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT (UUID) | Primary key |
| `tabel` | TEXT | Nama tabel (siswa, nilai, dll) |
| `record_id` | TEXT | UUID row yang berubah |
| `action` | TEXT | insert / update / delete |
| `status` | TEXT | pending / success / failed / dead_letter |
| `retry_count` | INT | Berapa kali sudah retry |
| `next_retry_at` | TEXT | Kapan coba lagi (exponential) |
| `synced_at` | TEXT | Timestamp sync |
| `last_error` | TEXT | Pesan error terakhir |

**Kenapa penting?** Detail lengkap di `sync-log-explained.md`. Singkatnya:
- ✅ **Atomic**: insert data + catat antrian dalam 1 transaction
- ✅ **Crash recovery**: app crash mid-write → sync_log persist → retry saat restart
- ✅ **Idempotent**: UNIQUE constraint → no duplicate entries
- ✅ **Retry reliable**: failed record otomatis retry dengan exponential backoff

---

## ⏰ Timing Penting

| Event | Delay |
|---|---|
| UI update setelah CRUD | 0 (instant, no network) |
| Local → Firestore | 0-30 detik (interval) |
| Firestore → Device lain | < 1 detik (real-time listener) |
| Pull on startup | 1-3 detik (19 collections) |

---

## 🔁 Retry Schedule

| Attempt | Delay | Total |
|---|---|---|
| 1 | 30s | 30s |
| 2 | 1m | 1m 30s |
| 3 | 2m | 3m 30s |
| 4 | 4m | 7m 30s |
| 5 | 8m | 15m 30s |
| 6+ | dead_letter | — |

---

## 📊 Quota Free Tier (Firebase Spark)

| Resource | Limit | Demo (1-2 jam) |
|---|---|---|
| Writes/day | 20.000 | ~20-50 |
| Reads/day | 50.000 | ~100-200 |
| Storage | 1 GB | < 50 MB |

**Pakai < 1% quota** saat demo. Aman.

---

## 🗂️ Tabel yang Di-Sync

| Master (12) | Transaksi (9) | Excluded (2) |
|---|---|---|
| users, guru, tahun_ajaran | tujuan_pembelajaran | sync_log |
| kelas, mata_pelajaran | absensi | nilai_ketarunaan |
| mapel_kelas_guru | nilai, nilai_tp | |
| info_sekolah, konfigurasi | nilai_prakerin | |
| ekskul, dimensi_p5 | absensi_prakerin | |
| subdimensi_p5, subdimensi_p5_tingkat | nilai_ekskul | |
| siswa | nilai_kokurikuler | |
| | catatan_wali_kelas | |

---

## 🛡️ Safety Mechanisms

| Mechanism | Fungsi |
|---|---|
| Outbox pattern | No data loss, atomic, idempotent |
| isRunning guard | No parallel cycles |
| BATCH_SIZE = 20 | Prevent quota spike |
| Doc ID = SQLite UUID | Idempotent re-push |
| Exponential backoff | Smart retry, no spam |
| dead_letter | Stop infinite retry |
| Pull on startup | Recovery missed changes |
| Real-time listener | Cross-device sync |

---

## 🐛 Mode Produksi vs Development

| | `npm run start` ⭐ | `npm run dev` |
|---|---|---|
| Process | 1 | 2 (race) |
| Sync engine | 1 presisi | 2 paralel |
| Untuk | Demo, production | Edit source (HMR) |
| Reload | Manual | Auto (HMR) |

**Untuk demo**: SELALU pakai `npm run start` (atau .exe installer).

---

## 📂 6 File Sync (1.236 baris)

```
src/lib/sync/
├── sync-queue.ts         26  → outbox (addToSyncLog)
├── sync-engine.ts       623  → main loop, batch, retry
├── firebase-config.ts   215  → init, push, delete
├── listener-engine.ts   145  → real-time onSnapshot
├── config-storage.ts    136  → encrypted config
└── retry-strategy.ts     91  → exponential backoff
```

---

## 🚀 Startup Sequence

```
T+0    : Electron main start
T+50ms : loadEnvFile() → process.env
T+100ms: app.whenReady()
T+100ms: ├─ initDatabase()
T+100ms: ├─ startSyncEngine()  → setInterval(30s)
T+100ms: ├─ pullOnStartup()    → catch up from cloud
T+100ms: ├─ startListener()    → 22 onSnapshot
T+100ms: └─ createWindow()     → load dist/index.html
T+200ms: UI render
```

---

## 🔍 Debugging Commands

```bash
# Lihat sync engine log
tail -f /tmp/opencode/dev.log | grep sync

# Cek sync_log
sqlite3 ~/.config/smk-ttn-app/smk-ttn.db \
  "SELECT tabel, action, status, retry_count, last_error
   FROM sync_log ORDER BY synced_at DESC LIMIT 20;"

# Force sync sekarang
# Di app: buka /sync-status → klik "Sinkronkan Sekarang"

# Cek Firestore Console
# https://console.firebase.google.com/project/smk-ttn-demo/firestore
```

---

## 🎯 TL;DR

> **"Outbox pattern + interval + listener = reliable sync tanpa data loss"**
>
> Setiap perubahan lokal dicatat dulu (outbox), lalu di-push 30 detik kemudian ke cloud. Real-time listener handle perubahan dari device lain. Kalau gagal, retry exponential. Kalau crash, restart aman karena outbox persist.

---

Lihat juga: `README.md` (diagram lengkap) | `architecture.html` (interaktif)
