# Flow Sinkronisasi SMK TTN — Ilustrasi Text (ASCII)

> Visualisasi alur sync dalam plain text. Tidak perlu render, langsung terbaca.
> Cocok untuk dicetak, di-paste ke chat, atau dibaca cepat.

---

## 1️⃣ User CRUD → SQLite → sync_log (5 Phase)

```
👤 USER                    ⚛️ UI                    📡 HANDLER                  🗄️ SQLITE
   │                          │                          │                          │
   │ Klik "Simpan"            │                          │                          │
   ├─────────────────────────►│                          │                          │
   │                          │ Form submit              │                          │
   │                          ├─────────────────────────►│                          │
   │                          │                          │ [1] Validasi             │
   │                          │                          │     • NIS unique         │
   │                          │                          │     • Required fields    │
   │                          │                          │                          │
   │                          │                          │ [2] TRANSACTION START    │
   │                          │                          ├─────────────────────────►│
   │                          │                          │                          │
   │                          │                          │ [3] INSERT siswa         │
   │                          │                          │     VALUES (nama, nis,   │
   │                          │                          │           kelas, ...)    │
   │                          │                          ├─────────────────────────►│
   │                          │                          │                          │
   │                          │                          │ [4] INSERT sync_log      │
   │                          │                          │     (tabel=siswa,        │
   │                          │                          │      record_id=abc-123,  │
   │                          │                          │      action=insert,      │
   │                          │                          │      status=pending)     │
   │                          │                          ├─────────────────────────►│
   │                          │                          │                          │
   │                          │                          │ [5] TRANSACTION COMMIT   │
   │                          │                          │◄─────────────────────────┤
   │                          │                          │                          │
   │                          │ ◄────────── success ─────┤                          │
   │                          │ (id: abc-123)            │                          │
   │ ◄── Toast "Sukses" ──────┤                          │                          │
   │                          │                          │                          │
   │ ✅ Langsung lihat di list (INSTANT, no network)     │                          │
   │                          │                          │                          │
```

**Kunci**: Step 3 + 4 dalam **1 transaction** (atomic). Kalau salah satu gagal, keduanya rollback — no half-state.

---

## 2️⃣ Sync Engine Cycle (Setiap 30 Detik)

```
   ⏰ setInterval(30s)              ⚙️ SYNC ENGINE                🗄️ SQLITE               🔥 FIRESTORE
            │                            │                            │                        │
            │ tick!                      │                            │                        │
            ├───────────────────────────►│                            │                        │
            │                            │ [1] isRunning?             │                        │
            │                            │     (skip kalau masih      │                        │
            │                            │      jalan dari cycle      │                        │
            │                            │      sebelumnya)           │                        │
            │                            │                            │                        │
            │                            │ [2] isOnline()?            │                        │
            │                            │     HEAD ke google.com     │                        │
            │                            │                            │                        │
            │                            │ ┌─ OFFLINE ─────────────┐  │                        │
            │                            │ │  return, retry 30s  │  │                        │
            │                            │ └──────────────────────┘  │                        │
            │                            │                            │                        │
            │                            │ [3] SELECT pending         │                        │
            │                            │     WHERE status IN        │                        │
            │                            │     ('pending',            │                        │
            │                            │      'failed-eligible')    │                        │
            │                            │     LIMIT 20               │                        │
            │                            ├───────────────────────────►│                        │
            │                            │                            │                        │
            │                            │ ◄── 5 records ────────────┤                        │
            │                            │                            │                        │
            │                            │ [4] For each record:       │                        │
            │                            │                            │                        │
            │                            │   ┌── record 1 ──────────┐  │                        │
            │                            │   │ SELECT row from siswa│  │                        │
            │                            │   ├──────────────────────┤  │                        │
            │                            │   │◄──── row ───────────┤  │                        │
            │                            │   │ setDoc('siswa', ...) │  │                        │
            │                            │   ├─────────────────────┼──┼───────────────────────►│
            │                            │   │                     │  │                        │
            │                            │   │                     │  │ ◄───── OK ───────────┤
            │                            │   │ UPDATE status='success'                       │
            │                            │   ├─────────────────────┼──┼────────────────────────┤
            │                            │   └─────────────────────┘  │                        │
            │                            │                            │                        │
            │                            │   (ulangi 4x lagi)         │                        │
            │                            │                            │                        │
            │                            │ [5] Return                 │                        │
            │                            │     { processed: 5,        │                        │
            │                            │       success: 4,          │                        │
            │                            │       failed: 1 }          │                        │
            │                            │                            │                        │
            │ ◄──── cycle done ──────────┤                            │                        │
            │                            │                            │                        │
   T+30s   │ (cycle berikutnya)          │                            │                        │
            │                            │                            │                        │
```

---

## 3️⃣ State Machine sync_log (Lifecycle)

```
   ┌──────────┐
   │   [∅]    │   ← Row baru di-insert
   │ initial  │
   └────┬─────┘
        │
        │ addToSyncLog()
        │ (dalam transaction dg INSERT data)
        │
        ▼
   ┌──────────┐
   │ pending  │   ◄── status: 'pending'
   │          │       retry_count: 0
   │ ⏰       │       next_retry_at: null
   └────┬─────┘
        │
        │ runSyncCycle() pickup (max 30s)
        │
        ▼
   ┌──────────┐
   │ syncing  │   ◄── (transient, dalam proses push)
   │          │       isRunning guard aktif
   │ 🔄       │       (tidak ada status 'syncing' di DB,
   └────┬─────┘        cuma logical state saat di-proses)
        │
   ┌────┴────────────────┐
   │                     │
   │ push OK             │ push error
   │                     │
   ▼                     ▼
┌──────────┐         ┌──────────┐
│ success  │         │ failed   │   ◄── status: 'failed'
│          │         │          │       retry_count: 1, 2, 3, ...
│ ✅       │         │ ⚠️       │       next_retry_at: +30s, +1m, +2m, ...
└────┬─────┘         └────┬─────┘
     │                     │
     │ cleanup             │ retry (next_retry_at ≤ now)
     │ (>7 hari)            │ OR
     │                     │ retry_count ≥ 5
     ▼                     ▼
   [∅]                 ┌─────────────┐
   deleted             │ dead_letter │   ◄── status: 'dead_letter'
                       │             │       BUTUH MANUAL INTERVENTION
                       │ ❌          │       (delete row atau fix issue)
                       └─────────────┘
```

---

## 4️⃣ Multi-Device Real-time Sync

```
   DEVICE A (Linux)              ☁️ FIRESTORE              DEVICE B (Windows)
        │                            │                            │
        │ Tambah siswa "Budi"        │                            │
        ├─────► SQLite local ───────┐│                            │
        │       INSERT siswa ✓     ││                            │
        │       INSERT sync_log    ││                            │
        │       (status=pending)   ││                            │
        │                          ││                            │
        │      ... 30s ...         ││                            │
        │                            │                            │
        │ Sync engine pickup        │                            │
        │ push to Firestore         │                            │
        ├───────────────────────────►│                            │
        │                            │                            │
        │                            │ ──── onSnapshot fires ────►│
        │                            │      (real-time, <1s)      │
        │                            │                            │
        │                            │                     listener-engine
        │                            │                     docChanges() →
        │                            │                     type='added'
        │                            │                            │
        │                            │                     upsert ke SQLite B
        │                            │                            │
        │                            │                     broadcast IPC
        │                            │                            │
        │                            │                     UI B re-render
        │                            │                            │
        │                            │                     ✅ "Budi" muncul
        │                            │                     di list B!
```

**Waktu total**: 0-30s (push) + <1s (listener) = max 31 detik dari Device A → Device B.

---

## 5️⃣ Failure & Recovery (3 Skenario)

### A. Network Down Saat Push

```
T+0s   : User tambah siswa "Budi"
T+0.1s : SQLite + sync_log inserted ✓
        : ... 30s kemudian sync engine jalan ...

T+30s  : SELECT pending → 1 row
T+30.1s: pushToFirestore() → NetworkError!
T+30.2s: UPDATE sync_log SET status='failed',
                              retry_count=1,
                              next_retry_at=now+30s

T+60s  : cycle lagi → cek status='failed' AND next_retry_at ≤ now
T+60.1s: retry push → success ✓
T+60.2s: status='success'

Total delay: 60s (1 retry) — bukan data loss!
```

### B. App Crash Mid-Write

```
T+0s   : User tambah siswa
T+0.1s : [1] INSERT siswa ✓
T+0.15s: 💥 APP CRASH (sebelum INSERT sync_log)
        : atau
T+0.1s : [1] INSERT siswa ✓
T+0.2s : [2] INSERT sync_log ✓
T+0.25s: 💥 APP CRASH (sebelum COMMIT)

(restart)
T+10s  : app.whenReady() → initDatabase()
T+10s  : pullOnStartup() → catch up dari cloud
         (kalau Device B sudah push, Budi ada di cloud,
          Device A akan pull row ini)

ATAU kalau Device A satu-satunya:
T+40s  : sync cycle jalan → pending row ada
         (kalau sempat ke-commit sebelum crash)
T+40s  : push ke cloud ✓
```

### C. Quota Exceeded (Firestore)

```
T+30s  : cycle → push 1 row → QuotaExceededError!
T+30.1s: status='failed', retry_count=1, next_retry_at=+30s
T+60s  : retry → masih quota
T+60.1s: retry_count=2, next_retry_at=+1m
T+2m   : retry → masih quota
T+2m1s : retry_count=3, next_retry_at=+2m
T+4m   : retry → quota reset (kalau harian) atau masih
T+4m1s : retry_count=4, next_retry_at=+4m
T+8m   : retry → quota reset → success!
        : status='success'

ATAU kalau masih gagal:
T+8m1s : retry_count=5 → dead_letter
        : NEEDS MANUAL FIX (tunggu quota reset besok, atau upgrade plan)
```

---

## 6️⃣ Yang Di-Sync vs Tidak

```
  ✅ SYNC (22 tabel)                       ❌ EXCLUDED (2 tabel)
  ─────────────────                       ────────────────────
  ┌─ MASTER (12) ─┐                       ┌──────────┐
  │ users         │                       │ sync_log │  ← internal outbox
  │ guru          │                       │ (jangan  │     (kalau di-sync →
  │ tahun_ajaran  │                       │  sync!)  │     infinite loop)
  │ kelas         │                       └──────────┘
  │ mata_pelajaran│
  │ mapel_kelas_  │                       ┌──────────────┐
  │   guru        │                       │ nilai_       │  ← deprecated
  │ info_sekolah  │                       │ ketarunaan   │     (fitur dihapus)
  │ konfigurasi   │                       └──────────────┘
  │ ekskul        │
  │ dimensi_p5    │
  │ subdimensi_p5 │
  │ subdimensi_   │
  │   p5_tingkat  │
  │ siswa         │
  └───────────────┘
  ┌─ TRANSAKSI (10) ─┐
  │ tujuan_          │
  │   pembelajaran   │
  │ absensi          │
  │ nilai            │
  │ nilai_tp         │
  │ nilai_prakerin   │
  │ absensi_prakerin │
  │ nilai_ekskul     │
  │ nilai_kokuri-    │
  │   kuler          │
  │ catatan_wali_    │
  │   kelas          │
  └──────────────────┘
```

---

## 7️⃣ TL;DR — 1 Liner per Phase

```
┌─────────────────────────────────────────────────────────────┐
│  👤 CRUD → SQLite + sync_log → ⏰ 30s → 🔥 Firestore       │
│              ↑                                ↓              │
│              └── 📡 listener (real-time) ────┘              │
│                                                             │
│  Reliability: outbox + transaction + retry + listener       │
│  Cost: < 1% free tier per demo                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Cheat Sheet untuk Dijawab ke Dosen

| Pertanyaan Dosen | Jawaban Singkat |
|---|---|
| "Data di-sync ke mana?" | Firebase Firestore (cloud) |
| "Seberapa sering?" | 30 detik untuk push, real-time untuk listener |
| "Kalau offline?" | App tetap jalan, data antri di sync_log, auto-push saat online |
| "Kalau app crash?" | Outbox pattern = no data loss, sync_log persist |
| "Berapa biaya?" | Free tier (Spark) — 20K writes/day, 50K reads/day |
| "Multi-device?" | Ya, real-time sync via onSnapshot |
| "Conflict resolution?" | Validasi di level aplikasi (UNIQUE constraint) |
| "Audit trail?" | sync_log menyimpan semua history |

Lihat juga: `sync-log-explained.md` (detail sync_log) | `CHEATSHEET.md` (1-pager) | `README.md` (Mermaid)
