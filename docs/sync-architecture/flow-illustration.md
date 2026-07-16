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

## 8️⃣ Pull #1 — On Startup (Saat App Launch)

```
🚀 APP START
    │
    ▼
[1] initDatabase() ← buka SQLite, apply migrations
    │
    ▼
[2] pullOnStartup() ← NON-BLOCKING (UI render paralel)
    │
    │   TUJUAN:
    │   • Device baru install (kosong, perlu pull semua)
    │   • Multi-device catch up (perubahan dari Device B)
    │   • Restore after crash (yang belum sempat push)
    │
    ├─► Loop 19 collections (parent → child FK order)
    │       Kenapa parent dulu? Karena child punya FK ke parent
    │
    │   For each collection:           🔥 FIRESTORE         🗄️ SQLITE LOKAL
    │   ┌────────────────────────┐         │                    │
    │   │ getDocs('kelas')       │ ───────►│ ◄── 9 docs ──────►│
    │   │                        │         │                    │
    │   │ for each doc:          │         │                    │
    │   │ ┌────────────────────┐ │         │                    │
    │   │ │ Ada di lokal?      │ │         │                    │
    │   │ ├─ Tidak → INSERT    │ │         │                    │
    │   │ └─ Ada   → UPDATE    │ │         │                    │
    │   │ └────────────────────┘ │         │                    │
    │   └────────────────────────┘         │                    │
    │                                      │                    │
    │   ┌────────────────────────┐         │                    │
    │   │ getDocs('siswa')       │ ───────►│ ◄── 270 docs ─────►│
    │   │ getDocs('nilai')       │ ───────►│ ◄── 1260 docs ────►│
    │   │ getDocs('absensi')     │ ───────►│ ◄── 3000 docs ────►│
    │   │ ... (16 more)          │         │                    │
    │   └────────────────────────┘         │                    │
    │                                      │                    │
    └─► Return { success: true, totalUpserted: 12K+ }
    │
    ▼
[3] startListener() ← subscribe 22 onSnapshot (untuk pull #2)
    │
    ▼
[4] createWindow() → UI render
    │
    ▼
User lihat data up-to-date! ✅
```

**Code** (`src/lib/sync/sync-engine.ts:130-210`):

```typescript
export async function pullOnStartup() {
  // Loop 19 collections (parent → child FK order)
  for (const { name, schema, hasId } of PULLABLE_TABLES) {
    const snapshot = await getDocs(collection(firestoreDb, name))
    
    for (const doc of snapshot.docs) {
      // INSERT kalau belum ada, UPDATE kalau sudah ada
      sqlite.insert(schema)
        .values({ id: doc.id, ...doc.data() })
        .onConflictDoUpdate({ target: schema.id, set: doc.data() })
        .run()
    }
  }
  
  return { success: true, totalUpserted: totalCount }
}
```

---

## 9️⃣ Pull #2 — Real-time Listener (Instant, < 1 detik)

```
   DEVICE A                                  🔥 FIRESTORE                          DEVICE B
      │                                          │                                     │
      │ push siswa "Budi" ke Firestore           │                                     │
      ├─────────────────────────────────────────►│                                     │
      │                                          │                                     │
      │                              write committed                                     │
      │                                          │                                     │
      │                                  ┌───────┴───────┐                             │
      │                                  │               │                             │
      │                                  ▼               ▼                             │
      │                          onSnapshot A    onSnapshot B ← subscribe 22 collection
      │                          (own write)     (real-time notification)               │
      │                                                                  │              │
      │                                                                  ▼              │
      │                                                       listener-engine.ts        │
      │                                                       snapshot.docChanges()     │
      │                                                                  │              │
      │                                                                  ▼              │
      │                                                       ┌──────────────────┐      │
      │                                                       │ type='added'     │      │
      │                                                       │ id='abc-123'     │      │
      │                                                       │ data={...}       │      │
      │                                                       └────────┬─────────┘      │
      │                                                                  │              │
      │                                                                  ▼              │
      │                                                       upsert ke SQLite lokal    │
      │                                                                  │              │
      │                                                                  ▼              │
      │                                                       mainWindow.webContents    │
      │                                                       .send('sync:change:       │
      │                                                              siswa', row)         │
      │                                                                  │              │
      │                                                                  ▼              │
      │                                                       ⚛️ Renderer: re-render     │
      │                                                                  │              │
      │                                                                  ▼              │
      │                                                       ✅ "Budi" muncul di       │
      │                                                          list Device B!          │
      │                                                                                  │
      │ ◄───── TOTAL DELAY: < 1 DETIK ───────────────────────────────────────────────────┘
```

**Code** (`src/lib/sync/listener-engine.ts`):

```typescript
export function startListener() {
  // Subscribe 22 collection (semua yang bisa berubah)
  for (const table of PULLABLE_TABLES) {
    onSnapshot(collection(firestoreDb, table.name), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // type: 'added' | 'modified' | 'removed'
        if (change.type === 'added' || change.type === 'modified') {
          // Upsert ke SQLite (insert or update)
          sqlite.insert(table.schema)
            .values({ id: change.doc.id, ...change.doc.data() })
            .onConflictDoUpdate({ target: table.schema.id, set: change.doc.data() })
            .run()
          
          // Broadcast ke renderer (real-time UI update)
          mainWindow?.webContents.send(
            `sync:change:${table.name}`,
            { id: change.doc.id, data: change.doc.data() }
          )
        }
        
        if (change.type === 'removed') {
          // Hapus dari SQLite
          sqlite.delete(table.schema)
            .where(eq(table.schema.id, change.doc.id))
            .run()
        }
      })
    })
  }
}
```

---

## 🔟 Push vs Pull — Beda & Kapan Dipakai

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          3 JENIS SYNC FLOW                                   │
└──────────────────────────────────────────────────────────────────────────────┘

   ╔════════════════╗         ╔════════════════╗         ╔════════════════╗
   ║  PUSH          ║         ║  PULL          ║         ║  PULL          ║
   ║  (Local→Cloud) ║         ║  (Cloud→Local) ║         ║  (Cloud→Local) ║
   ║                ║         ║  On Startup    ║         ║  Real-time     ║
   ║  ⏰ 30s        ║         ║  🚀 App launch ║         ║  📡 onSnapshot ║
   ╚════════╤═══════╝         ╚════════╤═══════╝         ╚════════╤═══════╝
            │                          │                           │
            ▼                          ▼                           ▼
   • Sync engine baca          • getDocs per collection      • docChanges per change
     sync_log (pending)        • Loop 19 collections         • type: added/modified/removed
   • pushToFirestore           • INSERT or UPDATE local      • Upsert/Delete local
   • UPDATE status             • Total: ~12K+ rows           • Broadcast ke renderer
   • Batch 20 per cycle        • Parent → child order        • Delay: < 1 detik

   ARAH:    Local ──30s──► Cloud   Cloud ──1x──► Local   Cloud ──instant──► Local
   WHEN:    Tiap 30 detik          Saat app start           Saat ada perubahan
   COST:    20 writes/cycle        1 read/collection        1 read/change
```

**Kapan masing-masing dipakai?**

| Skenario | Yang Jalan |
|---|---|
| User tambah data → Device lain lihat | **Push** (30s) + **Listener** (instant) |
| Install di PC baru | **Pull on Startup** (semua) + **Listener** (lanjut) |
| PC lain crash, restart | **Pull on Startup** (catch up missed) + **Listener** (lanjut) |
| User edit data di Device A | **Push** (30s) + **Listener** ke Device B (instant) |
| Internet mati sebentar | **Push** retry (backoff), **Listener** reconnect otomatis |

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
