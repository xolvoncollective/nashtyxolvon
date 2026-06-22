# 📴 User Guide: Offline Mode Operations

**NASHTY OS POS System - Offline Mode Guide**  
**Version:** 1.0  
**Last Updated:** June 22, 2026

---

## 🎯 Overview

Offline Mode memungkinkan Anda untuk tetap melayani pelanggan bahkan ketika koneksi internet terputus. Semua transaksi akan disimpan secara lokal dan otomatis disinkronkan saat koneksi kembali.

**Fitur Utama:**
- ✅ Buat pesanan tanpa internet
- ✅ Cari produk dari cache lokal
- ✅ Proses pembayaran offline
- ✅ Sinkronisasi otomatis saat online kembali
- ✅ Enkripsi data sensitif

---

## 🔔 Indikator Status Koneksi

### Status Online (Normal)
- **Ikon:** ✅ Hijau di navigation bar
- **Arti:** Sistem terhubung ke internet, semua transaksi langsung tersimpan
- **Action:** Tidak ada, lanjutkan normal

### Status Offline (Terputus)
- **Ikon:** 🔴 Merah dengan badge angka
- **Arti:** Internet terputus, transaksi masuk queue
- **Badge:** Menunjukkan jumlah pesanan yang belum disinkronkan
- **Action:** Lanjutkan transaksi, sistem akan sync otomatis

### Melihat Detail Status
1. Klik ikon status koneksi di navigation bar
2. Modal akan muncul menampilkan:
   - Status koneksi saat ini
   - Jumlah pesanan pending
   - Daftar pesanan yang menunggu sinkronisasi
   - Waktu terakhir sinkronisasi berhasil

---

## 📝 Cara Membuat Pesanan Offline

### Langkah 1: Verifikasi Mode Offline
- Pastikan banner "🔴 OFFLINE MODE" muncul di bagian atas
- Atau ikon status koneksi berwarna merah

### Langkah 2: Cari Produk (Seperti Biasa)
- Ketik nama produk di search box
- Sistem akan mencari di **cache lokal** (tidak perlu internet)
- Kecepatan: <100ms (sangat cepat)

**Tips:**
- Semua produk yang pernah dimuat akan tersedia offline
- Produk baru (belum pernah dimuat) tidak akan muncul

### Langkah 3: Tambah ke Cart
- Klik produk untuk tambah ke cart
- Response time: <50ms (instant)
- Semua operasi cart berjalan normal

### Langkah 4: Proses Pembayaran
- Klik tombol "Bayar" (Ctrl+P)
- Pilih metode pembayaran: Cash, Debit, Credit, QRIS
- Masukkan jumlah pembayaran
- Konfirmasi

### Langkah 5: Pesanan Masuk Queue
- ✅ Pesanan tersimpan di **offline queue**
- 🔒 Data sensitif dienkripsi dengan AES-256-GCM
- 📱 Cetak struk tetap bisa (offline receipt)
- ⏰ Timestamp asli dipertahankan

---

## 🔄 Proses Sinkronisasi Otomatis

### Kapan Sinkronisasi Terjadi?
1. **Saat koneksi kembali** (otomatis terdeteksi)
2. **Setiap 10 detik** sistem cek koneksi (jika offline)
3. **Manual:** Klik ikon status koneksi → "Sync Now"

### Urutan Sinkronisasi
1. **Pesanan paling lama** disinkronkan duluan (FIFO)
2. **Retry otomatis** hingga 3x jika gagal
3. **Notifikasi** muncul setelah sync selesai

### Notifikasi Hasil Sync
- **✅ Success:** "10 pesanan berhasil disinkronkan"
- **⚠️ Partial:** "8/10 pesanan berhasil, 2 gagal"
- **❌ Failed:** "Gagal menyinkronkan pesanan, akan retry otomatis"

---

## ⚡ Performance Metrics

| Operasi | Target | Actual | Keterangan |
|---------|--------|--------|------------|
| **Product Search** | <100ms | 10-30ms | 3x lebih cepat dari online |
| **Add to Cart** | <50ms | 10-20ms | Instant |
| **Save Order** | <200ms | 50-100ms | Enkripsi + save to IndexedDB |
| **Load Cart** | <50ms | 5-15ms | From cache |
| **Sync 100 Orders** | <30s | 20-25s | Auto-retry jika gagal |

---

## 🛡️ Keamanan Data Offline

### Enkripsi
- **Algorithm:** AES-256-GCM (military-grade)
- **Key Derivation:** PBKDF2 dengan 100,000 iterations
- **Dual-Factor Keying:** Session token + Device ID

### Data yang Dienkripsi
- ✅ Payment details (metode, jumlah)
- ✅ Customer information (nama, kontak)
- ✅ Order totals dan pricing
- ❌ Product names (tidak sensitif, tidak dienkripsi)

### Keamanan Tambahan
- 🔒 Keys non-extractable dari Web Crypto API
- 🗑️ Semua keys dihapus saat logout
- ⏰ Pesanan tersinkronisasi dihapus setelah 7 hari

---

## 📊 Kapasitas Penyimpanan Offline

### IndexedDB Storage
- **Total Storage:** Unlimited (depends on device)
- **Product Cache:** Max 10,000 produk per outlet
- **Offline Queue:** Unlimited (sampai sync berhasil)
- **Favorites:** Max 50 per user
- **Recent Items:** Max 20 per user

### Cleanup Otomatis
- Pesanan yang sudah sync: **Dihapus setelah 7 hari**
- Produk tidak aktif: **Dihapus saat next sync**
- Cache penuh: **Produk paling lama dihapus otomatis**

---

## ❓ Troubleshooting

### ❌ Produk Tidak Muncul di Search Offline

**Penyebab:** Produk belum pernah dimuat ke cache

**Solusi:**
1. Tunggu koneksi kembali
2. Buka halaman produk sekali (akan masuk cache)
3. Produk akan tersedia offline selanjutnya

### ❌ Pesanan Gagal Sync Terus

**Penyebab Umum:**
- Koneksi internet tidak stabil
- Server Supabase down
- Data order corrupted

**Solusi:**
1. Cek koneksi internet (ping google.com)
2. Tunggu 10 menit, sistem akan retry otomatis
3. Jika masih gagal, hubungi IT support
4. **JANGAN** logout sebelum sync berhasil (data akan hilang)

### ❌ Cache Penuh / Slow Performance

**Gejala:** Search lambat, UI lag

**Solusi:**
1. Buka Settings → Clear Cache
2. Atau logout → login lagi (fresh cache)
3. Cache akan dibangun ulang saat online

### ⚠️ Offline Terlalu Lama (>24 jam)

**Risiko:**
- Stok produk tidak terupdate
- Harga mungkin berubah
- Promo mungkin tidak aktif

**Rekomendasi:**
1. Segera hubungi IT/Manager
2. Verifikasi stok manual
3. Cross-check harga sebelum transaksi besar
4. Prioritaskan perbaikan koneksi

---

## 💡 Tips & Best Practices

### Untuk Kasir

1. **Familiarisasi dengan Offline Mode**
   - Latihan simulasi internet mati
   - Kenali indikator status koneksi
   - Pahami cara cek queue

2. **Saat Offline**
   - Tetap tenang, sistem tetap berfungsi
   - Informasikan ke pelanggan jika ada delay
   - Catat manual jika perlu sebagai backup

3. **Saat Koneksi Kembali**
   - Tunggu notifikasi "Sync Complete"
   - Verifikasi jumlah pesanan yang sync
   - Lapor ke manager jika ada yang gagal

### Untuk Manager

1. **Monitoring**
   - Cek status offline queue setiap shift
   - Pastikan semua kasir paham offline mode
   - Set reminder untuk cek sync status

2. **Maintenance**
   - Clear cache setiap minggu (off-peak hours)
   - Monitor storage usage di device
   - Backup data transaksi harian

3. **Emergency Protocol**
   - Siapkan koneksi backup (mobile hotspot)
   - Dokumentasikan semua transaksi offline
   - Verifikasi semua data setelah sync

---

## 📞 Support & Contacts

**Technical Issues:**
- IT Support: [Your IT Contact]
- Email: support@nashtyos.com
- Emergency Hotline: 24/7

**Training:**
- User Guide: `docs/USER_GUIDE_OFFLINE_MODE.md`
- Video Tutorial: [Link to video]
- FAQ: `docs/FAQ.md`

---

## 📋 Quick Reference Card

```
🟢 ONLINE   → Normal operations
🔴 OFFLINE  → Queue mode active

OFFLINE WORKFLOW:
1. Search product (uses cache)
2. Add to cart (instant)
3. Process payment
4. Order queued (encrypted)
5. Auto-sync when online

KEYBOARD SHORTCUTS:
- Alt+F      → Focus search
- Ctrl+P     → Process payment
- Ctrl+S     → Save draft
- Ctrl+N     → New order
- Esc        → Cancel/Close

SYNC STATUS:
Click 🔴 icon → View queue
```

---

**🎯 Remember:** Offline Mode adalah fitur safety net. Prioritaskan koneksi stabil untuk operasi optimal!

**Last Updated:** June 22, 2026  
**Version:** 1.0  
**Next Review:** December 2026
