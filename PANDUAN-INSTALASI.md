# Panduan Instalasi — Sistem Absensi & Penilaian SMK TTN

> Untuk **pengguna akhir** (guru, wali kelas, admin sekolah). Bukan untuk developer.

Aplikasi desktop untuk mengelola absensi, penilaian, dan rapor siswa SMK Taruna Tekno Nusantara. Berjalan **offline** di komputer sekolah. Firebase sync opsional untuk sinkronisasi antar-perangkat.

---

## 1. Syarat Sistem

| Komponen | Minimum |
|---|---|
| Sistem Operasi | Windows 10 (64-bit) atau lebih baru |
| RAM | 4 GB |
| Ruang disk kosong | 500 MB (untuk aplikasi + data) |
| Koneksi internet | **Tidak wajib** (kecuali pakai Firebase sync) |

---

## 2. Download Installer

1. Buka browser, kunjungi halaman rilis:
   **https://github.com/nabilfaturr/smk-ttn-app/releases**
2. Pilih rilis **terbaru** (paling atas, biasanya `v1.x.x`)
3. Di bagian **Assets**, klik file:
   ```
   Sistem.Absensi.dan.Penilaian.SMK.TTN-1.x.x-Setup.exe
   ```
   (Ukuran ~200 MB — pastikan koneksi stabil)
4. Simpan file di folder yang mudah ditemukan (mis. **Desktop** atau **Downloads**)

> **Catatan:** Nama file di GitHub menggunakan **titik** (`Sistem.Absensi...`) bukan spasi — itu normal, GitHub mengubahnya otomatis untuk URL.

---

## 3. Install di Windows

1. **Klik dua kali** file `.exe` yang sudah di-download
2. Jika muncul peringatan **Windows protected your PC** (layar biru SmartScreen):
   - Klik **More info**
   - Klik **Run anyway** (aplikasi ini aman, hanya belum punya sertifikat code-signing resmi)
3. Pilih **bahasa installer** → klik **OK**
4. Klik **Next** di layar sambutan
5. (Opsional) Ganti folder install di **Destination Folder** → klik **Next**
   - Default: `C:\Users\<nama-kamu>\AppData\Local\Programs\Sistem Absensi dan Penilaian SMK TTN\`
   - Disarankan biarkan default
6. Klik **Install** → tunggu proses selesai (~1-2 menit)
7. Centang **Launch Sistem Absensi dan Penilaian SMK TTN** → klik **Finish**

Aplikasi akan terbuka otomatis. Ikon shortcut muncul di **Start Menu** dan (opsional) **Desktop**.

---

## 4. Login Pertama Kali

Saat aplikasi pertama kali dibuka, database masih kosong dan hanya tersedia akun admin bawaan:

| Field | Nilai |
|---|---|
| Username | `admin` |
| Password | `admin123` |

**⚠️ Segera ganti password default!**

1. Setelah login sebagai `admin`, buka menu **Settings** (pojok kanan atas atau sidebar)
2. Pilih **Ubah Password**
3. Masukkan password lama (`admin123`) + password baru (min. 8 karakter, gabungan huruf & angka)
4. Klik **Simpan**

> **Buat akun pengguna lain** (guru, wali kelas) melalui menu **Master Data → Users**. Setiap akun punya **kode login 5 digit** yang digunakan untuk login dari menu utama.

---

## 5. Lokasi Data (Penting untuk Backup!)

Semua data absensi, nilai, dan rapor disimpan **lokal** di:

```
C:\Users\<nama-kamu>\AppData\Roaming\smk-ttn-app\smk-ttn.db
```

**Cara membuka folder data:**

1. Tekan **Windows + R**
2. Ketik: `%APPDATA%\smk-ttn-app`
3. Tekan **Enter**

**Backup rutin:** copy file `smk-ttn.db` ke USB drive / cloud (OneDrive, Google Drive) secara berkala. Ini satu-satunya cara mengembalikan data jika komputer rusak.

> Folder `AppData` tersembunyi. Kalau tidak muncul di File Explorer, aktifkan **View → Hidden items** di ribbon.

---

## 6. Update ke Versi Baru

Installer NSIS bisa **upgrade** installasi lama secara otomatis. Tidak perlu uninstall dulu.

1. Download installer versi baru dari halaman Releases
2. Jalankan file `.exe` seperti biasa
3. Installer mendeteksi installasi lama → klik **Next** → **Install**
4. Data dan database **tidak hilang** saat update
5. Login seperti biasa setelah selesai

---

## 7. Uninstall

1. Buka **Settings → Apps → Installed apps** (Windows 11) atau **Control Panel → Programs and Features** (Windows 10)
2. Cari **Sistem Absensi dan Penilaian SMK TTN**
3. Klik **Uninstall** → konfirmasi

> **⚠️ Uninstall TIDAK menghapus database** di `AppData\Roaming\smk-ttn-app\`. Hapus manual jika memang ingin bersih total. **Backup dulu sebelum hapus!**

---

## 8. Masalah Umum

### SmartScreen block / "Windows protected your PC"
Lihat langkah 3.2 di atas — klik **More info → Run anyway**. Aman.

### Antivirus mendeteksi virus (false positive)
Installer unsigned kadang ditandai AV. Klik **Allow / Add exception** untuk:
- File `.exe` installer
- Folder install aplikasi
- File `smk-ttn.db` di AppData

### Lupa password admin
Tidak ada fitur reset password dari dalam aplikasi (by design — data lokal, tidak ada server). Solusi:
1. Buka langsung database SQLite (`smk-ttn.db`) pakai tool seperti [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Edit tabel `users`, ganti kolom `password_hash` untuk user `admin` dengan hash baru (lihat dokumentasi developer untuk hash algo)

Atau hubungi developer untuk reset manual.

### Aplikasi tidak mau buka / crash saat start
1. Pastikan Windows versi 64-bit (cek di **Settings → System → About**)
2. Coba **klik kanan aplikasi → Run as administrator**
3. Hapus folder cache: `%APPDATA%\smk-ttn-app\cache\` (data utama tidak ikut terhapus)

### Mau sinkronisasi data antar-komputer
Aktifkan **Firebase Sync**:
1. Buka **Settings → Firebase Sync**
2. Masukkan konfigurasi Firebase project (diberikan oleh developer)
3. Klik **Sync Now** untuk push data ke cloud, atau otomatis tiap 30 detik

Butuh konfigurasi Firebase? Hubungi developer/admin IT sekolah.

---

## 9. Bantuan & Kontak

| Masalah | Kontak |
|---|---|
| Bug / error aplikasi | Buka issue di https://github.com/nabilfaturr/smk-ttn-app/issues |
| Pertanyaan fitur | Hubungi admin sekolah / developer |
| Reset password | Admin sekolah / developer |
| Setup Firebase sync | Developer / admin IT |

---

**Versi panduan:** 1.0.0
**Versi aplikasi:** 1.0.0 (atau lihat di **Settings → About**)
