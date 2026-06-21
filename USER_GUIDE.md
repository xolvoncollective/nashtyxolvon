# 📖 NASHTY OS POS - User Guide

## Panduan Lengkap Sistem Point of Sale

---

## 🌟 Fitur Baru

### 1. Mode Offline
Sistem POS tetap berfungsi tanpa koneksi internet!

**Cara Kerja**:
- ✅ Semua produk ter-cache di browser
- ✅ Order disimpan dalam antrian offline
- ✅ Otomatis sync saat online kembali
- ✅ Tidak ada order yang hilang

**Indikator Status**:
- 🟢 **Badge Hijau**: Online dan tersinkronisasi
- 🔴 **Badge Merah + Angka**: Offline dengan X order pending
- 🟡 **Animasi**: Sedang melakukan sinkronisasi

**Cara Menggunakan**:
1. Buat order seperti biasa (sistem otomatis detect offline)
2. Order masuk ke antrian offline
3. Saat internet kembali, klik badge untuk sync manual (atau tunggu auto-sync)
4. Verifikasi semua order berhasil di Order History

---

### 2. Favorites & Quick Access

**Apa itu Favorites?**
Simpan hingga 50 produk favorit untuk akses cepat!

**Cara Menambah Favorite**:
1. Cari produk di search
2. Klik ⭐ icon pada produk
3. Produk muncul di Quick Access Grid sidebar

**Quick Access Tabs**:
- **⭐ Favorites**: Produk yang Anda favoritkan
- **🕐 Recent**: 20 produk terakhir yang Anda jual
- **📊 Auto-Suggest**: Top 20 produk terlaris minggu ini

**Reorder Favorites**:
1. Buka tab Favorites
2. Drag-and-drop produk ke posisi yang diinginkan
3. Otomatis tersimpan

**Tips**:
- Atur produk terlaris di posisi atas
- Gunakan Recent untuk pelanggan repeat order
- Auto-Suggest membantu menemukan produk populer

---

### 3. Keyboard Shortcuts

**Mengapa Gunakan Shortcuts?**
Hemat waktu hingga 50% dalam entry order!

#### 🧭 Navigasi

| Tombol | Fungsi |
|--------|--------|
| `Ctrl+P` | Buka dialog pembayaran |
| `Ctrl+S` | Simpan sebagai draft |
| `Ctrl+N` | Order baru (clear cart) |
| `Ctrl+D` | Tampilkan draft orders |
| `Ctrl+H` | Buka order history |
| `Alt+F` | Focus ke pencarian produk |
| `Esc` | Tutup dialog |

#### 🛒 Cart Operations

| Tombol | Fungsi |
|--------|--------|
| `↑` `↓` | Pilih item di cart |
| `Delete` | Hapus item terpilih |
| `+` `-` | Tambah/kurang quantity |
| `Enter` | Buka modifier item |

#### 🔢 Quantity Entry

**Cara Cepat Entry Quantity**:
1. Ketik angka (contoh: `3`)
2. Klik produk atau tekan F-key
3. Produk ditambahkan 3 unit sekaligus!

**Contoh**:
- Ketik `2` → Klik "Nasi Goreng" → Tambah 2 porsi
- Ketik `5` → Tekan `F1` → Tambah 5 unit produk F1

#### 🎹 Function Keys (F1-F12)

**Setup Product Shortcuts**:
1. Tekan `Shift+F1` (contoh untuk F1)
2. Pilih produk dari dialog
3. Klik "Assign"
4. Sekarang tekan `F1` untuk instant add!

**Tips**:
- Assign 12 produk terlaris ke F1-F12
- Gunakan untuk order cepat tanpa search
- Combine dengan quantity: `3` → `F5` = 3 unit produk F5

**Customize Shortcuts**:
1. Buka Settings → Keyboard Shortcuts
2. Klik pada shortcut yang ingin diubah
3. Tekan kombinasi tombol baru
4. Save changes

---

### 4. Receipt Customization

**Personalisasi Struk untuk Outlet Anda!**

#### Logo Upload
1. Buka Backoffice → Settings → Receipt Settings
2. Klik "Choose File" di Logo Upload
3. Pilih logo (PNG/JPG/SVG, max 2MB)
4. Logo otomatis di-resize ke 200px
5. Preview langsung muncul

#### Header & Footer Text
- **Header**: Teks di atas struk (max 200 karakter)
  - Contoh: "Selamat Datang di Restoran Kami"
- **Footer**: Teks di bawah struk (max 300 karakter)
  - Contoh: "Terima kasih atas kunjungan Anda\nFollow IG: @restokami"

**Line Breaks**: Gunakan `\n` untuk pindah baris

#### Font Size
- **Small (10pt)**: Untuk struk ringkas
- **Medium (12pt)**: Standard, paling umum
- **Large (14pt)**: Untuk visibilitas lebih baik

#### QR Code Feedback
1. Toggle "Enable QR Code"
2. Masukkan URL feedback form (harus HTTPS)
3. QR code 100x100px muncul di atas footer
4. Label: "Scan for Feedback"

#### Social Media Links
Masukkan URL lengkap:
- Facebook: `https://facebook.com/restokami`
- Instagram: `https://instagram.com/restokami`
- Twitter: `https://twitter.com/restokami`
- TikTok: `https://tiktok.com/@restokami`

Link muncul di footer dengan icon platform.

#### Promotional Messages
1. Masukkan hingga 3 pesan promo (max 150 karakter each)
2. Contoh:
   - "Diskon 20% setiap Selasa!"
   - "Gratis dessert untuk pembelian >100rb"
   - "Follow IG kami untuk info promo"
3. Sistem rotate random setiap print (beda-beda setiap struk)

**Live Preview**:
Semua perubahan langsung terlihat di panel preview! Coba berbagai kombinasi sebelum save.

---

### 5. Customer Display

**Tampilkan order di layar terpisah untuk pelanggan!**

#### Setup
**Requirements**:
- Monitor kedua terhubung ke PC
- Browser: Chrome atau Edge

**Cara Activate**:
1. Hubungkan monitor kedua
2. Sistem otomatis detect → muncul notifikasi
3. Klik "Enable Customer Display"
4. Window baru fullscreen di monitor kedua

**Manual Trigger** (jika notifikasi tidak muncul):
- Klik icon 🖥️ di pojok kanan atas
- Posisikan window di monitor kedua
- Klik fullscreen (F11)

#### Fitur

**Real-time Update**:
- Setiap item ditambahkan → langsung muncul di display
- Quantity, harga, subtotal, tax, total → semua update instant
- Update <200ms (sangat smooth!)

**Idle Mode Slideshow**:
- Setelah 30 detik tanpa aktivitas → masuk idle mode
- Tampilkan slideshow foto promo
- Upload hingga 10 foto (max 5MB each) di Settings
- Rotate setiap 10 detik
- Keluar otomatis saat ada order baru

**Customization**:
1. Buka Settings → Customer Display
2. Pilih warna:
   - Background color
   - Text color
   - Accent color (untuk highlight)
3. Sistem validate contrast ratio (aksesibilitas)
4. Upload logo restoran
5. Set tagline/slogan

**Tips**:
- Gunakan warna kontras tinggi (mudah dibaca dari jauh)
- Logo harus clear dan simple
- Foto promo beresolusi tinggi

---

## 🚀 Workflow Optimal

### Kasir Pemula (Gunakan Mouse)
1. Search produk → klik
2. Adjust quantity dengan +/- button
3. Klik "Payment" button
4. Pilih metode pembayaran
5. Klik "Complete Order"

**Estimasi**: 45-60 detik per order

---

### Kasir Berpengalaman (Keyboard Shortcuts)
1. `Alt+F` → ketik nama produk → `Enter`
2. Ulang untuk semua item
3. `↑` `↓` untuk navigasi cart (jika perlu adjust)
4. `Ctrl+P` → `Enter` → Pilih payment → `Enter`

**Estimasi**: 20-30 detik per order (2x lebih cepat!)

---

### Kasir Expert (F-Keys + Quantity)
1. Assign 12 produk terlaris ke F1-F12
2. Order 3 Nasi Goreng: `3` → `F1`
3. Order 2 Es Teh: `2` → `F5`
4. Order 1 Ayam Bakar: `F3`
5. `Ctrl+P` → Complete

**Estimasi**: 10-15 detik per order (4x lebih cepat!)

---

## 💡 Tips & Tricks

### Hemat Waktu
1. **Setup Favorites**: Pasang 50 produk terlaris
2. **Assign F-Keys**: 12 produk paling laku
3. **Use Quantity Entry**: Ketik angka sebelum pilih produk
4. **Drafts**: Simpan order pelanggan yang masih memilih (`Ctrl+S`)

### Mengatasi Masalah

**Internet Mati?**
- ✅ Tetap bisa terima order
- ✅ Order otomatis tersimpan
- ✅ Sync saat online kembali
- ⚠️ Jangan refresh browser saat offline!

**Shortcut Tidak Kerja?**
- Cek apakah ada dialog terbuka (tutup dengan `Esc`)
- Verify shortcut belum di-reassign
- Reset to defaults di Settings

**Customer Display Tidak Muncul?**
- Verify monitor kedua terdeteksi
- Coba manual trigger (klik icon 🖥️)
- Pastikan browser Chrome/Edge
- Check permissions (allow pop-ups)

**Favorites Tidak Sync?**
- Check koneksi internet
- Klik badge untuk manual sync
- Verify tidak lebih dari 50 favorites

---

## 🎓 Training Checklist

### Level 1: Basic (15 menit)
- [ ] Login ke sistem
- [ ] Search dan add produk
- [ ] Adjust quantity dengan +/-
- [ ] Complete order dengan payment
- [ ] View order history

### Level 2: Intermediate (30 menit)
- [ ] Gunakan offline mode (simulasi disconnect)
- [ ] Add 10 favorites
- [ ] Reorder favorites dengan drag-drop
- [ ] Save dan restore draft order
- [ ] Gunakan keyboard shortcuts dasar (`Ctrl+P`, `Alt+F`)

### Level 3: Advanced (45 menit)
- [ ] Assign products ke F1-F12
- [ ] Use quantity entry (type numbers)
- [ ] Customize keyboard shortcuts
- [ ] Gunakan cart navigation (arrows, +/-)
- [ ] Complete order tanpa mouse (full keyboard)

### Level 4: Expert (1 jam)
- [ ] Handle 20 orders <5 menit (average 15s/order)
- [ ] Setup receipt customization untuk outlet
- [ ] Configure customer display
- [ ] Troubleshoot common issues
- [ ] Train kasir baru

---

## 📞 Bantuan & Support

**In-App Help**:
- Press `F1` dua kali untuk shortcuts reference
- Hover pada icon ? untuk tooltips
- Klik "Help" di menu untuk user guide

**Dokumentasi**:
- User Guide (file ini)
- Keyboard Shortcuts Reference Card
- Training Videos (coming soon)

**Technical Support**:
- Email: support@nashtyos.com
- WhatsApp: +62-XXX-XXXX-XXXX
- Response time: <24 jam

---

## 🔄 Updates

**Version 2.0 - June 2026**
- ✅ Offline mode
- ✅ Favorites & Quick Access
- ✅ Keyboard shortcuts (30+ shortcuts)
- ✅ Receipt customization
- ✅ Customer display
- ✅ Performance optimizations

**Coming Soon**:
- Multi-currency support
- Advanced reporting
- Mobile POS app
- Integration with loyalty program

---

*Last updated: June 21, 2026*
*NASHTY OS Point of Sale System*
