# 📖 NASHTY OS - Panduan Operasional Harian

**Untuk**: Kasir, Kitchen Staff, Manager  
**Sistem**: NASHTY OS v3.1  
**Update Terakhir**: June 21, 2026

---

## 🏪 PEMBUKAAN TOKO (Sebelum Buka)

### ✅ **Checklist Pagi** (30 menit sebelum buka)

#### **1. Persiapan Hardware**
- [ ] Nyalakan komputer kasir
- [ ] Cek printer struk (kertas & tinta)
- [ ] Nyalakan customer display (jika ada)
- [ ] Nyalakan tablet KDS (dapur)
- [ ] Cek koneksi internet

#### **2. Buka Sistem**
```
1. Buka browser Chrome
2. Ketik: nashtyxolvon2.pages.dev
3. Tunggu halaman login muncul
```

#### **3. Login Manager/Owner** (untuk cek sistem)
```
USERNAME: admin1
PASSWORD: nashty1111

1. Pilih "Backoffice"
2. Cek dashboard
3. Pastikan semua data OK
4. Logout
```

---

## 💰 KASIR - START SHIFT

### **Langkah Buka Shift**

#### **1. Login Gateway**
```
URL: https://nashtyxolvon2.pages.dev
LOGIN: admin1 / nashty1111
PILIH: POS
```

#### **2. Pilih Staff**
```
Pilih nama kasir Anda
Masukkan PIN (4 digit)

CONTOH PIN:
- Citra: 8888
- Budi: 7777
- Owner: 9999
- Manager: 1212
```

#### **3. Modal Kas Awal**
```
Hitung uang di kasir
Masukkan jumlah (contoh: 500000)
Klik "Mulai Shift"
```

✅ **Shift Aktif - Siap Terima Order!**

---

## 🛒 KASIR - PROSES ORDER

### **Order Dine In** (Makan di Tempat)

#### **Step-by-Step:**
```
1. SEARCH PRODUK
   - Klik search box (atau tekan Space)
   - Ketik nama menu
   - Enter atau klik produk

2. PILIH MODIFIER (jika ada)
   - Level Pedas: Original/Sedang/Extra
   - Add-on: Nasi/Sambal/Lalapan
   - Klik "Tambah ke Cart"

3. TAMBAH PRODUK LAIN
   - Ulangi langkah 1-2
   - Atau gunakan F1-F12 (favorites)

4. SET MEJA
   - Pilih nomor meja
   - Atau ketik manual

5. BAYAR
   - Pilih metode: Tunai/Transfer/QRIS/dll
   - Masukkan jumlah bayar (Tunai)
   - Klik "Selesai"

6. CETAK STRUK
   - Otomatis cetak 2 copy
   - 1 untuk customer
   - 1 untuk dapur (KDS)
```

### **Order Take Away**
```
Sama seperti Dine In, tapi:
- Pilih "Take Away" bukan nomor meja
- Tanyakan nama customer (opsional)
```

### **Order Delivery** (GoFood/GrabFood/Shopee)
```
Sama seperti Dine In, tapi:
- Pilih platform: GoFood/GrabFood/Shopee
- Order ID otomatis dari sistem mereka
```

---

## ⌨️ KEYBOARD SHORTCUTS (OPSIONAL TAPI CEPAT!)

### **Dasar**
```
Space      = Focus ke search box
ESC        = Clear cart
Enter      = Complete payment (di modal bayar)
Ctrl + D   = Toggle customer display
```

### **Favorites** (Setup dulu di Settings)
```
F1  = Produk favorit #1 (contoh: Ayam Bakar)
F2  = Produk favorit #2 (contoh: Nasi Goreng)
F3  = Produk favorit #3 (contoh: Kopi Susu)
...
F12 = Produk favorit #12
```

**Cara Setup Favorites:**
```
1. Klik tombol ⭐ di kanan atas
2. Drag & drop produk ke slot F1-F12
3. Klik "Simpan"
4. Selesai! Sekarang tekan F1 langsung add produk
```

---

## 👨‍🍳 DAPUR - KITCHEN DISPLAY SYSTEM (KDS)

### **Login KDS**
```
URL: https://nashtyxolvon2.pages.dev/kds/frontend
PIN: 9999 (Owner) atau 1212 (Manager)
```

### **Cara Pakai KDS**

#### **Tampilan Order Card**
```
┌─────────────────────────────┐
│ #0188        │ 03:42 ⏱️    │ ← Nomor & Timer
│ T03 · Dine In              │ ← Meja & Jenis
├─────────────────────────────┤
│ 2  Nasi Goreng Spesial     │ ← Qty & Nama
│    • Pedas Sedang          │ ← Modifier
│                            │
│ 1  Kopi Susu Aren          │
│    • Dingin                │
│    • +Oat Milk             │ ← Add-on
│    ⚠ Jangan terlalu manis  │ ← Notes!
├─────────────────────────────┤
│ Kasir: Citra  [Swipe →]   │ ← Swipe selesai
└─────────────────────────────┘
```

#### **Warna Timer (Urgency)**
```
🟢 HIJAU (0-10 menit)   = On time, santai
🟡 KUNING (10-20 menit) = Warning, agak buru-buru
🔴 MERAH (>20 menit)    = URGENT! Prioritas tinggi!
```

#### **Cara Selesaikan Order**
```
1. Masak sesuai order card
2. Perhatikan notes (⚠ warna kuning)
3. Setelah selesai: SWIPE ke kanan →
4. Konfirmasi: Klik "Sudah Diserahkan"
5. Card hilang dari queue
```

### **Filter Orders**
```
TOMBOL DI ATAS:
- Semua      = Lihat semua order
- Dine In    = Hanya makan di tempat
- Take Away  = Hanya bungkus
- Delivery   = GoFood/Grab/Shopee
- Urgent     = Hanya yang merah (telat)
```

---

## 🔄 KASIR - OFFLINE MODE

### **Apa itu Offline Mode?**
```
Ketika internet mati, POS tetap jalan!
- Order tetap bisa diproses
- Data tersimpan lokal (aman, terenkripsi)
- Auto-sync saat internet kembali
```

### **Indikator Offline**
```
🔴 OFFLINE  = Di pojok kanan atas
⚠️ Warning = "Sistem offline, order tersimpan lokal"
🟢 ONLINE  = Auto-sync mulai
```

### **Yang Harus Dilakukan**
```
✅ BOLEH:
- Tetap terima order
- Proses pembayaran
- Print struk
- Tutup shift

❌ JANGAN:
- Panic!
- Refresh browser berkali-kali
- Logout
```

### **Saat Internet Kembali**
```
Otomatis:
1. Indikator berubah 🟢 ONLINE
2. Sync mulai (progress bar muncul)
3. "15 order berhasil disync"
4. Selesai!

Manual (jika perlu):
- Klik tombol "Sync Now" di kanan atas
```

---

## 💸 KASIR - CLOSE SHIFT

### **Langkah Tutup Shift**

#### **1. Hitung Kas Akhir**
```
- Hitung semua uang di kasir
- Pisahkan kas awal (Rp 500.000)
- Total pendapatan = Kas Akhir - Kas Awal
```

#### **2. Tutup di Sistem**
```
1. Klik tombol "Tutup Shift" (pojok kanan atas)
2. Masukkan Kas Akhir (contoh: 2300000)
3. Catatan (opsional): "Lancar, tidak ada masalah"
4. Klik "Tutup Shift"
```

#### **3. Summary Shift**
```
Sistem otomatis tampilkan:
- Total transaksi: 45 order
- Pendapatan kotor: Rp 2.300.000
- Pendapatan bersih: Rp 2.100.000
- Pajak dikumpulkan: Rp 200.000
- Metode pembayaran breakdown

PRINT SUMMARY INI!
Serahkan ke Manager
```

#### **4. Logout**
```
Klik nama kasir → Logout
Tutup browser (opsional)
```

---

## 🔧 TROUBLESHOOTING

### **Problem 1: Produk Tidak Muncul**
```
COBA:
1. Refresh halaman (Ctrl + F5)
2. Cek internet
3. Logout & login lagi

JIKA MASIH:
- Hubungi Manager
- Cek Backoffice → Products
```

### **Problem 2: Struk Tidak Print**
```
COBA:
1. Cek printer nyala
2. Cek kertas struk
3. Cek kabel printer
4. Print manual: Klik "Print Ulang" di modal

JIKA MASIH:
- Restart printer
- Restart komputer
```

### **Problem 3: Customer Display Tidak Muncul**
```
COBA:
1. Tekan Ctrl + D
2. Klik manual tombol 🖥️ di atas
3. Pastikan screen kedua nyala

CATATAN:
- Hanya jalan di Chrome/Edge
- Firefox/Safari pakai tombol manual
```

### **Problem 4: KDS Tidak Update**
```
COBA:
1. Refresh KDS (F5)
2. Cek internet
3. Login ulang

JIKA MASIH:
- Kasir tetap bisa order
- Manager cek Supabase dashboard
```

### **Problem 5: Lupa PIN**
```
SOLUSI:
- Hubungi Manager/Owner
- Manager reset di Backoffice → Team
- PIN baru diberikan
```

### **Problem 6: Offline Sync Gagal**
```
COBA:
1. Tunggu internet stabil
2. Klik "Sync Now" manual
3. Cek jumlah pending orders

JIKA MASIH:
- Jangan panic!
- Order tersimpan aman
- Export backup (Manager)
```

---

## 📊 MANAGER - DASHBOARD & REPORTS

### **Buka Backoffice**
```
URL: https://nashtyxolvon2.pages.dev
LOGIN: admin1 / nashty1111
PILIH: Backoffice
```

### **Dashboard Overview**
```
LIHAT:
- Pendapatan hari ini
- Total transaksi
- Rata-rata order
- Top 10 produk terlaris
- Metode pembayaran breakdown
```

### **Generate Reports**
```
1. Menu: Reports
2. Pilih periode: Hari Ini/Minggu/Bulan
3. Pilih jenis: Sales/Products/Kasir
4. Klik "Export" untuk Excel
```

### **Manage Menu**
```
TAMBAH PRODUK:
1. Menu: Products
2. Klik "Tambah Produk"
3. Isi: Nama, Harga, Kategori, Deskripsi
4. Upload foto (opsional)
5. Pilih modifier groups
6. Klik "Simpan"

EDIT HARGA:
1. Menu: Products
2. Cari produk
3. Klik "Edit"
4. Ubah harga
5. Simpan
```

### **Manage Team**
```
TAMBAH KASIR:
1. Menu: Team → Kasir
2. Klik "Tambah Kasir"
3. Isi: Nama, No HP, PIN (4 digit)
4. Pilih Outlet
5. Status: Aktif
6. Simpan

RESET PIN:
1. Menu: Team → Kasir
2. Cari nama kasir
3. Edit → Ubah PIN
4. Beritahu kasir PIN baru
```

---

## 🎯 TIPS & BEST PRACTICES

### **Untuk Kasir**
```
✅ DO:
- Smile & sapa customer
- Konfirmasi order sebelum bayar
- Cek modifier & add-on dengan teliti
- Print struk selalu 2 copy
- Tutup shift tepat waktu

❌ DON'T:
- Lupa pilih meja (Dine In)
- Skip modifier (tanya customer!)
- Logout sebelum shift tutup
- Panic saat offline
```

### **Untuk Dapur (KDS)**
```
✅ DO:
- Cek notes (⚠) sebelum masak
- Prioritas MERAH (urgent) dulu
- Swipe selesai setelah plating
- Komunikasi dengan kasir

❌ DON'T:
- Abaikan notes customer
- Lupa swipe selesai
- Refresh KDS terus-terusan
```

### **Untuk Manager**
```
✅ DO:
- Cek dashboard setiap hari
- Review reports mingguan
- Update harga jika perlu
- Backup data rutin
- Training staff baru

❌ DON'T:
- Ubah setting tanpa test dulu
- Delete produk yang masih ada di order
- Lupa tutup shift kasir
```

---

## 📞 KONTAK SUPPORT

### **Escalation Path**
```
1. KASIR → MANAGER (untuk issue operasional)
2. MANAGER → OWNER (untuk issue besar)
3. OWNER → TECH SUPPORT (untuk issue sistem)
```

### **Tech Support**
```
- Developer Contact: [Insert]
- Supabase Dashboard: https://supabase.com/dashboard
- Cloudflare Pages: https://dash.cloudflare.com
- GitHub Repo: xolvoncollective/nashtyxolvon
```

---

## 📝 DAILY CHECKLIST

### **Setiap Pagi**
- [ ] Cek internet
- [ ] Nyalakan semua device
- [ ] Login & test sistem
- [ ] Cek printer kertas
- [ ] Staff briefing (5 menit)

### **Setiap Sore (Sebelum Tutup)**
- [ ] Tutup semua shift kasir
- [ ] Print summary shift
- [ ] Cek pending offline orders
- [ ] Backup data (Manager)
- [ ] Matikan device

### **Setiap Minggu**
- [ ] Review reports mingguan
- [ ] Update produk jika perlu
- [ ] Training refresh (15 menit)
- [ ] Cek stock printer kertas

---

## 🎉 SELAMAT BEKERJA!

```
╔══════════════════════════════════════════╗
║                                          ║
║  NASHTY OS - Your Restaurant Partner    ║
║                                          ║
║  • Mudah digunakan                      ║
║  • Offline tetap jalan                  ║
║  • Support 24/7                         ║
║                                          ║
║  Ada pertanyaan? Tanya Manager! 😊      ║
║                                          ║
╚══════════════════════════════════════════╝
```

**Good luck & happy serving! 🔥**

---

**Last Updated**: June 21, 2026  
**Version**: v3.1  
**For**: Galaxy Mall, Surabaya
