# Sistem Sinkronisasi SMK TTN — Diagram Arsitektur

> Visualisasi alur sinkronisasi antara SQLite (lokal) dan Firebase Firestore (cloud).
> Render otomatis di GitHub, VSCode Preview, dan HTML viewer (lihat `architecture.html`).

---

## 1. Big Picture — Arsitektur Tinggi

```mermaid
flowchart LR
    User(["👤 User"])

    subgraph Local["💻 LOKAL (Source of Truth)"]
        UI["⚛️ React UI<br/>(renderer)"]
        IPC["🔌 IPC Bridge<br/>(preload)"]
        Handler["📡 IPC Handlers<br/>(main process)"]
        DB[("🗄️ SQLite<br/>22 tables")]
        Queue["📋 sync_log<br/>(outbox)"]
        Engine["⚙️ Sync Engine<br/>setInterval 30s"]
        Listener["📡 Listener Engine<br/>onSnapshot"]
    end

    subgraph Cloud["☁️ CLOUD (Replica)"]
        FS[("🔥 Firestore<br/>19 collections")]
    end

    User -->|CRUD| UI
    UI -->|window.electronAPI| IPC
    IPC -->|invoke| Handler
    Handler -->|INSERT/UPDATE/DELETE| DB
    Handler -->|addToSyncLog| Queue

    Engine -->|read pending| Queue
    Engine -->|pushToFirestore| FS
    Engine -->|UPDATE status| Queue

    FS -.->|onSnapshot realtime| Listener
    Listener -->|upsert| DB
    Listener -->|broadcast| UI

    classDef local fill:#dbeafe,stroke:#1e40af,color:#000
    classDef cloud fill:#fef3c7,stroke:#a16207,color:#000
    classDef user fill:#fce7f3,stroke:#9d174d,color:#000

    class User user
    class UI,IPC,Handler,DB,Queue,Engine,Listener local
    class FS cloud
```

**Prinsip**: SQLite = source of truth, Firestore = replica. Selalu operasi di local dulu, sync engine yang handle bolak-balik.

---

## 2. Outbox Pattern — Buku Pesanan

```mermaid
flowchart TD
    A["User: Tambah Siswa 'Budi'"] --> B["IPC Handler<br/>student.handlers.ts:38-79"]
    B --> C{"Transaction<br/>(atomic)"}
    C -->|1| D["INSERT siswa<br/>(SQLite)"]
    C -->|2| E["INSERT sync_log<br/>status=pending"]
    D --> F["✅ Local: Siswa ada<br/>UI langsung tampil"]
    E --> G["📋 Antrian: 1 row pending"]

    style A fill:#fce7f3
    style B fill:#dbeafe
    style C fill:#fbbf24
    style D fill:#86efac
    style E fill:#86efac
    style F fill:#bbf7d0
    style G fill:#fed7aa
```

**Kenapa outbox?**
- ✅ **Atomic**: insert data + catat antrian dalam 1 transaksi — kalau crash, no half-state
- ✅ **Resilient**: app crash? sync_log masih ada → di-retry saat restart
- ✅ **Idempotent**: UNIQUE constraint di sync_log → no duplicate entries

---

## 3. Push Flow (Local → Cloud) — Setiap 30 Detik

```mermaid
sequenceDiagram
    autonumber
    participant Timer as ⏰ setInterval(30s)
    participant Engine as ⚙️ Sync Engine
    participant DB as 🗄️ SQLite
    participant FS as 🔥 Firestore

    Timer->>Engine: tick → runSyncCycle()
    Engine->>Engine: isRunning guard (skip kalau masih jalan)
    Engine->>Engine: isOnline() check

    alt Offline
        Engine-->>Timer: skip cycle, retry 30s lagi
    else Online
        Engine->>DB: SELECT * FROM sync_log<br/>WHERE status='pending' LIMIT 20
        DB-->>Engine: [5 records]

        loop For each record (batch max 20)
            Engine->>DB: SELECT row from siswa WHERE id=?
            DB-->>Engine: { nis, nama, kelas_id, ... }
            Engine->>FS: setDoc('siswa', id, row)
            alt Push success
                FS-->>Engine: ✓ OK
                Engine->>DB: UPDATE sync_log SET status='success'
            else Push failed
                FS-->>Engine: ✗ Error
                Engine->>DB: UPDATE sync_log SET<br/>status='failed', retry_count++,<br/>next_retry_at=now+30s
            end
        end

        Engine-->>Timer: { processed: 5, success: 4, failed: 1 }
    end
```

**Retry strategy** (exponential backoff):
```
Retry 1: 30 detik
Retry 2: 1 menit
Retry 3: 2 menit
Retry 4: 4 menit
Retry 5: 8 menit
         ↓
    dead_letter (perlu manual)
```

---

## 4. Real-time Listener (Cloud → Local) — Push dari Device Lain

```mermaid
sequenceDiagram
    autonumber
    participant DeviceA as 💻 Device A
    participant FS as 🔥 Firestore
    participant DeviceB as 💻 Device B
    participant UI as ⚛️ UI Device B

    Note over DeviceA,DeviceB: Keduanya subscribe onSnapshot saat start

    DeviceA->>FS: setDoc('siswa', 'abc-123', {nama: "Budi"})
    FS-->>FS: write committed

    par Real-time notification
        FS-->>DeviceA: onSnapshot fires (own write)
        FS-->>DeviceB: onSnapshot fires
    end

    DeviceB->>DeviceB: listener-engine.ts: snapshot.docChanges()
    DeviceB->>DeviceB: change.type === 'added'
    DeviceB->>DeviceB: upsert ke SQLite lokal
    DeviceB->>UI: IPC broadcast → 'sync:change:siswa'
    UI->>UI: re-render → "Budi" muncul di list

    Note over DeviceB,UI: Delay: < 1 detik end-to-end
```

**Cost**: 22 onSnapshot subscriptions = 22 reads saat initial subscribe, lalu 1 read per perubahan.

---

## 5. Pull on Startup — Recovery saat Buka App

```mermaid
flowchart TD
    A["🚀 App Start"] --> B["loadEnvFile → inject process.env"]
    B --> C["app.whenReady()"]
    C --> D["initDatabase()"]
    C --> E["startSyncEngine()<br/>setInterval 30s"]
    C --> F["pullOnStartup()"]
    C --> G["startListener()<br/>22 onSnapshot"]
    C --> H["createWindow()"]

    F --> F1{"Loop 19 collections<br/>(parent → child order)"}
    F1 --> F2["getDocs(collection)"]
    F2 --> F3["For each doc"]
    F3 --> F4{"Ada di local?"}
    F4 -->|No| F5["INSERT SQLite<br/>(onConflictDoNothing)"]
    F4 -->|Yes| F6["UPDATE SQLite<br/>(onConflictDoUpdate)"]
    F5 --> F1
    F6 --> F1
    F1 -->|Done| F7["return { totalUpserted: 47 }"]

    style A fill:#fce7f3
    style E fill:#fed7aa
    style F fill:#86efac
    style G fill:#86efac
    style H fill:#dbeafe
```

**Kapan dipakai?**
- Device baru di-install → pull data existing dari cloud
- Multi-device setup → catch up dengan perubahan dari device lain
- Restore after crash → recover missed changes

---

## 6. Tambah Siswa — Full End-to-End Scenario

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant UI as ⚛️ React UI
    participant IPC as 🔌 Preload Bridge
    participant Handler as 📡 IPC Handler
    participant DB as 🗄️ SQLite
    participant Log as 📋 sync_log
    participant Engine as ⚙️ Sync Engine
    participant FS as 🔥 Firestore
    participant DeviceB as 💻 Device B

    User->>UI: Isi form, klik "Simpan"
    UI->>IPC: window.electronAPI.studentCreate(data)
    IPC->>Handler: ipcRenderer.invoke("student:create", data)
    Handler->>Handler: Validasi (NIS unique, required fields)

    rect rgb(220, 252, 231)
        Note over Handler,Log: TRANSACTION (atomic)
        Handler->>DB: INSERT INTO siswa (...)
        DB-->>Handler: newId = "abc-123-uuid"
        Handler->>Log: INSERT sync_log<br/>(tabel=siswa, status=pending)
    end

    Handler-->>IPC: { success: true, id: "abc-123-uuid" }
    IPC-->>UI: response
    UI->>UI: Toast "Siswa berhasil ditambahkan"
    UI->>User: ✅ Langsung terlihat di list (instant)

    Note over Engine: ... 30 detik berlalu ...

    Engine->>Log: SELECT WHERE status='pending'
    Log-->>Engine: 1 row (siswa/abc-123)
    Engine->>DB: SELECT * FROM siswa WHERE id='abc-123'
    DB-->>Engine: { nis, nama, ... }
    Engine->>FS: setDoc('siswa', 'abc-123', row)
    FS-->>Engine: ✓
    Engine->>Log: UPDATE SET status='success'

    Note over FS,DeviceB: Real-time listener fires
    FS-->>DeviceB: onSnapshot: siswa/abc-123 added
    DeviceB->>DeviceB: upsert SQLite
    DeviceB->>DeviceB: broadcast IPC → renderer
    DeviceB->>DeviceB: UI re-render
```

**Total delay**: 0-30 detik untuk sampai ke cloud, < 1 detik dari cloud ke device lain.

---

## 7. Sync Engine State Machine

```mermaid
stateDiagram-v2
    [*] --> Pending: addToSyncLog()

    Pending --> Syncing: runSyncCycle()<br/>pickup
    Syncing --> Success: pushToFirestore() OK
    Syncing --> Failed: pushToFirestore() error

    Success --> [*]: cycle done
    Failed --> Pending: next_retry_at ≤ now<br/>(exponential backoff)

    Failed --> DeadLetter: retry_count ≥ 5

    note right of Pending
        ⏰ Default state
        Waiting for next interval tick
    end note

    note right of Syncing
        🔄 In-flight
        Marked pending during cycle
        (guard: isRunning check)
    end note

    note right of Failed
        ⚠️ Retry scheduled
        30s → 1m → 2m → 4m → 8m
    end note

    note right of DeadLetter
        ❌ Stuck
        Need manual intervention
        (delete row atau fix root cause)
    end note
```

---

## 8. Tabel yang Di-Sync

```mermaid
flowchart TB
    subgraph Excluded["❌ EXCLUDED (tidak di-sync)"]
        E1["sync_log<br/>(outbox internal)"]
        E2["nilai_ketarunaan<br/>(deprecated)"]
    end

    subgraph Master["📦 MASTER (parent)"]
        M1["users"]
        M2["guru"]
        M3["tahun_ajaran"]
        M4["kelas"]
        M5["mata_pelajaran"]
        M6["mapel_kelas_guru"]
        M7["info_sekolah"]
        M8["konfigurasi"]
        M9["ekskul"]
        M10["dimensi_p5"]
        M11["subdimensi_p5"]
        M12["subdimensi_p5_tingkat"]
        M13["siswa"]
    end

    subgraph Transaksi["📊 TRANSAKSI (child)"]
        T1["tujuan_pembelajaran"]
        T2["absensi"]
        T3["nilai"]
        T4["nilai_tp"]
        T5["nilai_prakerin"]
        T6["absensi_prakerin"]
        T7["nilai_ekskul"]
        T8["nilai_kokurikuler"]
        T9["catatan_wali_kelas"]
    end

    style Excluded fill:#fee2e2
    style Master fill:#dbeafe
    style Transaksi fill:#dcfce7
```

**22 syncable** (1 deprecated + 1 outbox excluded) → **20 collection** di Firestore.

---

## 9. Cost & Quota

```mermaid
pie title Free Tier Firebase (Spark Plan)
    "Writes/day (20K limit)" : 20
    "Reads/day (50K limit)" : 50
```

**Per demo session (~1-2 jam)**:
| Action | Writes | Reads |
|---|---|---|
| Tambah 1 siswa via UI | 1 | 0 |
| Tambah 1 nilai | 1 | 0 |
| Listener subscribe 22 collection (start) | 0 | 22 |
| Real-time update dari device lain | 0 | 1-5 |
| **Total demo** | **~20-50** | **~100-200** |

**Sangat hemat** — pakai < 1% free tier.

---

## 10. Recovery — Apa yang Terjadi Saat Crash?

```mermaid
flowchart TD
    A["💥 App crash<br/>(mid-write)"] --> B{"sync_log<br/>status?"}
    B -->|pending| C["Row belum ter-push<br/>→ re-push saat restart"]
    B -->|failed| D["Row sudah attempt<br/>→ retry dengan backoff"]
    B -->|success| E["Row sudah di cloud<br/>→ no action needed"]

    C --> F["🚀 App restart"]
    D --> F
    E --> G["✅ Nothing to do"]

    F --> H["pullOnStartup()<br/>catch up dari cloud"]
    F --> I["startSyncEngine()<br/>resume pending"]

    H --> J["✅ Local SQLite up-to-date"]
    I --> J

    style A fill:#fee2e2
    style J fill:#bbf7d0
```

**Outbox pattern** = no data loss. Kalau crash saat push, sync_log masih `pending` → di-retry.

---

## 📁 File yang Berkaitan

| File | Baris | Fungsi |
|---|---|---|
| `src/lib/sync/sync-queue.ts` | 26 | Outbox pattern (`addToSyncLog`) |
| `src/lib/sync/sync-engine.ts` | 623 | Main loop, batch, retry |
| `src/lib/sync/firebase-config.ts` | 215 | Init, push, delete Firestore |
| `src/lib/sync/listener-engine.ts` | 145 | Real-time onSnapshot |
| `src/lib/sync/config-storage.ts` | 136 | Encrypted config (OS keychain) |
| `src/lib/sync/retry-strategy.ts` | 91 | Exponential backoff |

**Total**: 1.236 baris kode sync.

---

## 🎯 Key Takeaways (Visual)

```mermaid
mindmap
  root((Sistem<br/>Sinkronisasi<br/>SMK TTN))
    Outbox
      atomic
      idempotent
      resilient
    Engine
      interval 30s
      batch 20
      retry exponential
    Listener
      onSnapshot
      realtime 1s
      cross-device
    Storage
      SQLite truth
      Firestore replica
      encrypted config
    Quota
      20K writes/day
      50K reads/day
      demo cuma pakai 1%
```

---

**Buka di browser**: `architecture.html` (di folder ini) untuk render interaktif dengan klik & zoom.
