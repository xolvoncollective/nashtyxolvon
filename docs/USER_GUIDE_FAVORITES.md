# ⭐ User Guide: Favorites & Quick Access

**NASHTY OS POS System - Favorites Guide**  
**Version:** 1.0  
**Last Updated:** June 22, 2026

---

## 🎯 Overview

Favorites dan Quick Access Grid membantu Anda mengakses produk populer dengan cepat tanpa perlu mencari. Ideal untuk menu best-seller, seasonal items, atau produk yang sering dipesan.

**Manfaat:**
- ⚡ Akses produk 3x lebih cepat
- 🎨 Customize urutan sesuai preferensi
- 📊 Lihat produk recent dan trending
- 💾 Tersedia offline
- 👤 Personal per kasir

**Estimasi Time Saving:** 30% lebih cepat per order

---

## 📱 Quick Access Grid UI

### Lokasi
Quick Access Grid terletak di **sidebar kanan** layar POS, tepat di sebelah area cart.

### 3 Tab yang Tersedia

#### 1. ⭐ Favorites Tab
- **Isi:** Produk yang Anda tandai sebagai favorite
- **Maksimal:** 50 produk
- **Sorting:** Custom (drag-and-drop)
- **Persistence:** Saved per user

#### 2. 🕒 Recent Tab
- **Isi:** 20 produk terakhir yang Anda jual
- **Prioritas:** Item dari 24 jam terakhir muncul duluan
- **Auto-update:** Setiap kali selesai order
- **Show:** Usage count (berapa kali dijual)

#### 3. 🔥 Auto-Suggest Tab
- **Isi:** Top 20 best-selling products
- **Timeframe:** Last 7 days
- **Data Source:** Outlet-specific (fallback ke tenant jika <100 orders)
- **Refresh:** Every 6 hours
- **Indicators:** 📈 Up / ➡️ Stable / 📉 Down

### Collapse/Expand
- **Collapse:** Klik icon `<` di header grid
- **Expand:** Klik icon `>` atau nama tab
- **Keyboard:** `Ctrl+Q` (quick toggle)

---

## ⭐ Mengelola Favorites

### Menambahkan Favorite

**Cara 1: From Product List**
1. Cari produk di search box
2. **Right-click** pada produk
3. Pilih "⭐ Add to Favorites"
4. Produk langsung muncul di Favorites tab

**Cara 2: From Cart**
1. Tambahkan produk ke cart
2. Right-click item di cart
3. Pilih "⭐ Add to Favorites"

**Cara 3: Keyboard Shortcut**
1. Pilih produk di search results
2. Tekan `Shift+F` (Add to Favorites)

**Limit:**
- Maksimal **50 favorites** per user
- Jika sudah 50, Anda harus hapus salah satu

### Menghapus Favorite

**Cara 1: From Favorites Tab**
1. Buka Favorites tab
2. **Hover** pada produk yang ingin dihapus
3. Klik icon `×` (close) di pojok kanan atas
4. Konfirmasi "Remove from favorites?"

**Cara 2: Right-click**
1. Right-click produk di Favorites tab
2. Pilih "❌ Remove from Favorites"

**Cara 3: Keyboard**
1. Hover produk di Favorites tab
2. Tekan `Delete` key
3. Konfirmasi

### Mengatur Urutan (Reorder)

**Drag-and-Drop:**
1. Buka Favorites tab
2. **Click and hold** pada produk yang ingin dipindah
3. **Drag** ke posisi baru
4. **Release** untuk drop
5. Urutan otomatis tersimpan

**Tips:**
- Letakkan produk paling sering dipesan di atas
- Group produk serupa berdekatan
- Pertimbangkan flow order (appetizer → main → dessert)

**Touch Support:**
- Long press produk (1 detik)
- Drag dengan jari
- Release untuk drop

---

## 🕒 Recent Items Tab

### Cara Kerja
Recent Items otomatis melacak 20 produk terakhir yang Anda jual.

**Update Logic:**
1. Setiap kali order selesai (payment complete)
2. Semua produk dalam order masuk tracking
3. Jika produk sudah ada, counter bertambah
4. List diurutkan: **Last 24h first** → Usage count → Timestamp

### Informasi yang Ditampilkan
- **Product Name**
- **Image Thumbnail**
- **Price**
- **Usage Count:** Badge menunjukkan berapa kali dijual
- **Last Used:** Timestamp terakhir dijual

### Use Cases
- Repeat order dari pelanggan tetap
- Seasonal items yang trending
- Quick re-order tanpa search

---

## 🔥 Auto-Suggest Tab (Analytics)

### Data yang Ditampilkan

**Top 20 Products (Last 7 Days):**
- Product name & image
- Total sold quantity
- Trending indicator:
  - 📈 **Up:** Sales naik >10% vs 7 hari sebelumnya
  - ➡️ **Stable:** Sales stabil (±10%)
  - 📉 **Down:** Sales turun >10%

### Data Source Logic
```
IF outlet_orders_count >= 100 THEN
  Use outlet-specific data
ELSE
  Use tenant-level aggregated data (all outlets)
END IF
```

**Kenapa Tenant Fallback?**
- Outlet baru belum punya cukup data
- Data lebih akurat dengan sample size besar
- Consistency across outlets

### Refresh Schedule
- **Auto-refresh:** Every 6 hours
- **Manual refresh:** Click "🔄 Refresh" button
- **Cache:** Results cached for performance

### Use Cases
- **Stock Planning:** Produk trending perlu restock
- **Upselling:** Suggest popular items ke customer
- **Menu Optimization:** Pertimbangkan hapus produk dengan trend down

---

## ⚡ Quick Add to Cart

### From Any Tab
1. Buka Quick Access Grid (any tab)
2. **Click** produk thumbnail
3. Produk langsung masuk cart dengan quantity 1

### Quantity Shortcut
1. **Type number** di keyboard (e.g., `3`)
2. Quantity indicator muncul di screen
3. **Click** produk
4. Produk masuk cart dengan quantity 3

### Keyboard Navigation
- `Tab` → Navigate produk di grid
- `Enter` → Add selected product to cart
- `Arrow keys` → Move selection
- `Esc` → Deselect

---

## 🔄 Sync & Offline Support

### Favorites Sync

**Online Mode:**
- Perubahan favorites langsung sync ke server
- Response time: <200ms
- Available di semua device yang login dengan user sama

**Offline Mode:**
- Favorites changes masuk offline queue
- Perubahan tersimpan di IndexedDB
- Auto-sync saat koneksi kembali
- **Conflict Resolution:** Last-write-wins

### Recent Items Sync
- Stored locally di IndexedDB
- Tidak disync ke server (personal per device)
- Reset jika logout atau clear cache

### Auto-Suggest Sync
- Cached selama 6 jam
- Available offline (last cached data)
- Auto-refresh saat online

---

## 📊 Performance Metrics

| Operasi | Target | Actual | Status |
|---------|--------|--------|--------|
| **Load Favorites** | <500ms | <150ms | ✅ |
| **Add to Cart** | <100ms | 20-50ms | ✅ |
| **Drag-drop Reorder** | 60fps | 60fps | ✅ |
| **Tab Switch** | <100ms | <50ms | ✅ |
| **Recent Update** | <200ms | 50-100ms | ✅ |
| **Analytics Load** | <500ms | <400ms | ✅ |

---

## 💡 Tips & Best Practices

### Untuk Kasir

**Setup Favorites (First Time):**
1. Identifikasi 10-15 produk paling sering dipesan
2. Tambahkan ke Favorites
3. Atur urutan sesuai flow order
4. Test dengan real order

**Daily Usage:**
1. Mulai dari Favorites tab untuk fast orders
2. Gunakan Recent tab untuk repeat customers
3. Cek Auto-Suggest untuk upselling opportunities
4. Update favorites setiap minggu

**Optimisasi Kecepatan:**
- Hafalkan posisi produk di Favorites grid
- Gunakan keyboard shortcuts
- Combine dengan quantity entry (number keys)
- Practice sampai muscle memory

### Untuk Manager

**Analytics Insights:**
1. Monitor Auto-Suggest tab setiap hari
2. Identifikasi trending products (📈)
3. Investigate dropping products (📉)
4. Adjust menu/pricing based on data

**Team Training:**
1. Pastikan semua kasir setup favorites
2. Share best practices antar kasir
3. Review setup setiap bulan
4. Benchmark kecepatan order completion

**Menu Optimization:**
1. Produk dengan trend 📉 selama 30 hari → Consider remove
2. Produk dengan trend 📈 → Ensure stock availability
3. Compare auto-suggest vs favorites → Adjust marketing

---

## ❓ Troubleshooting

### ❌ Favorites Tidak Tersimpan

**Gejala:** Favorites hilang setelah reload

**Penyebab:**
- Browser cache cleared
- IndexedDB corrupted
- Not logged in

**Solusi:**
1. Pastikan logged in
2. Cek Settings → Storage → IndexedDB
3. Re-add favorites
4. Report ke IT jika persisten

### ❌ Drag-Drop Tidak Berfungsi

**Gejala:** Tidak bisa drag produk

**Penyebab:**
- Touch device tanpa proper support
- Browser extension conflict
- JavaScript error

**Solusi:**
1. Coba di browser lain (Chrome/Firefox)
2. Disable extensions
3. F12 → Console → Cek error
4. Use alternative: Right-click → "Move Up/Down"

### ⚠️ Auto-Suggest Tidak Update

**Gejala:** Data lama terus muncul

**Penyebab:**
- Cache stuck
- API error
- Analytics not running

**Solusi:**
1. Click "🔄 Refresh" button
2. Wait 10 seconds
3. Check online status
4. Clear browser cache
5. Report ke IT jika >24h tidak update

### ❌ Limit 50 Favorites Tercapai

**Gejala:** Tidak bisa add favorite baru

**Pesan:** "Maximum 50 favorites reached. Remove one to add new."

**Solusi:**
1. Review current favorites
2. Remove produk yang jarang digunakan
3. Prioritaskan best-sellers
4. Gunakan Recent tab untuk temporary items

---

## 🎯 Success Metrics

### Individual (Kasir)
- **Target:** 20+ favorites setup
- **Order Time:** Reduce by 30%
- **Mistakes:** Reduce by 50% (less search errors)

### Outlet (Manager)
- **Adoption:** >80% kasir use favorites daily
- **Coverage:** Favorites cover 60%+ of daily orders
- **Analytics Usage:** Check auto-suggest weekly

---

## 📞 Support & Resources

**Documentation:**
- User Guide (this document)
- Video Tutorial: [Link]
- FAQ: `docs/FAQ.md`

**Training:**
- Onboarding: 15 minutes
- Practice: 1 hour
- Mastery: 1 week daily usage

**Support:**
- IT Helpdesk: [Contact]
- Training Videos: [Link]
- Community Forum: [Link]

---

## 📋 Quick Reference Card

```
⭐ FAVORITES TAB
- Max 50 products
- Drag-drop to reorder
- Right-click to remove
- Shift+F to add

🕒 RECENT TAB
- Last 20 products
- 24h priority
- Usage count badge
- Auto-updated

🔥 AUTO-SUGGEST TAB
- Top 20 (7 days)
- Trending indicators
- 6-hour cache
- Outlet-specific

KEYBOARD SHORTCUTS:
- Ctrl+Q    → Toggle grid
- Shift+F   → Add to favorites
- Delete    → Remove favorite
- Enter     → Add to cart
- Tab       → Navigate grid
```

---

**🎯 Pro Tip:** Gunakan Favorites untuk speed, Recent untuk convenience, Auto-Suggest untuk data-driven upselling!

**Last Updated:** June 22, 2026  
**Version:** 1.0  
**Next Review:** December 2026
