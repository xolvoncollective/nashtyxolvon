# 🚀 Receipt Printing - Quick Start Guide

## TL;DR - Cara Setup Receipt dalam 5 Menit

### Step 1: Setup Printer (Hardware)

**Beli Thermal Printer (Recommended):**
- **Budget:** Xprinter XP-80C (~Rp 500rb) - USB
- **Mid-Range:** Epson TM-T82 (~Rp 3-5jt) - USB/Ethernet  
- **Premium:** Star mPOP (~Rp 7-10jt) - Bluetooth + Cash Drawer

**Atau pakai printer biasa** (temporary solution):
- Printer A4 biasa juga bisa
- Tapi perlu potong kertas manual

---

### Step 2: Install Printer Driver

**Windows:**
1. Colok USB printer
2. Install driver dari CD / download dari website
3. Set as "Default Printer"
4. Test print dari Notepad

**Mac:**
1. System Preferences → Printers & Scanners
2. Add printer
3. Test print

**Android Tablet:**
1. Install "Star Print Service" dari Play Store
2. Pair Bluetooth printer
3. Done!

---

### Step 3: Configure di Backoffice

1. Login Backoffice → **Settings** → **Receipt Settings**
2. Upload logo (opsional)
3. Isi header text:
   ```
   NASHTY RESTAURANT
   Jl. Merdeka No. 123
   Telp: 021-12345678
   ```
4. Pilih font size:
   - Small = Thermal 58mm
   - **Medium = Thermal 80mm** ✅ 
   - Large = A4 Paper
5. **Save**

---

### Step 4: Test Print dari POS

1. Login POS
2. Buat test order
3. Click **"Print Receipt"**
4. Browser akan buka print dialog
5. Pilih printer → **Print**
6. ✅ Receipt keluar!

---

## 🐛 Troubleshooting Cepat

### ❌ Receipt tidak print

**Solusi:**
```
1. Cek printer nyala & connected
2. Cek browser allow popup dari POS URL
3. F12 → Console → check error
4. Test print dari Notepad dulu
```

---

### ❌ Layout berantakan

**Penyebab:** Font size terlalu besar untuk paper width

**Solusi:**
```
Thermal 58mm → Font: Small
Thermal 80mm → Font: Medium ✅
A4 Paper → Font: Large
```

---

### ❌ Logo tidak muncul

**Penyebab:** File terlalu besar atau format salah

**Solusi:**
```
1. Compress logo < 500KB
2. Format: PNG (best) atau JPG
3. Ukuran: 300x100px (landscape)
4. Re-upload
```

---

### ❌ Print sangat lambat

**Solusi:**
```
1. Gunakan USB, bukan Bluetooth
2. Compress logo < 200KB
3. Disable QR code (temporary)
```

---

## 📋 Receipt Layout Explained

```
┌─────────────────────────────────┐
│                                 │
│  [LOGO] (opsional)              │
│                                 │
│  Header Text (opsional)         │
│  Nama Outlet, Alamat, Telp      │
│                                 │
│  ═══════════════════════════    │
│                                 │
│  Order #12345                   │
│  23 Jun 2026, 14:30             │
│  Kasir: Budi                    │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Nasi Goreng x2    Rp 50.000    │
│  Es Teh x2         Rp 10.000    │
│  Ayam Bakar x1     Rp 35.000    │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Subtotal:         Rp 95.000    │
│  Pajak (10%):      Rp  9.500    │
│  ═══════════════════════════    │
│  TOTAL:            Rp104.500    │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  [PROMO BOX] (random 1 of 3)    │
│  "Dapatkan diskon 10%!"         │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  [QR CODE] (opsional)           │
│  Scan untuk feedback            │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  FB | IG | Twitter | TikTok     │
│  (jika diisi di settings)       │
│                                 │
│  Footer Text (opsional)         │
│  "Terima kasih!"                │
│                                 │
└─────────────────────────────────┘
```

---

## ⚙️ Receipt Settings Options

| Setting | Description | Example |
|---------|-------------|---------|
| **Logo** | Image di atas receipt | logo.png (300x100px) |
| **Header** | Text di atas order | Nama outlet, alamat |
| **Footer** | Text di bawah total | "Terima kasih!" |
| **Font Size** | Small/Medium/Large | Medium (12pt) |
| **QR Code** | Feedback form URL | Google Forms link |
| **Social Media** | FB/IG/Twitter/TikTok | @yourpage |
| **Promos** | 3 pesan promosi | "Diskon 10%!" |

---

## 🎯 Best Practices

### ✅ DO:
- Upload logo PNG < 500KB
- Test print sebelum go-live
- Gunakan thermal printer 80mm (medium font)
- Set printer sebagai default
- Preview receipt sebelum print

### ❌ DON'T:
- Jangan upload logo > 2MB (lambat!)
- Jangan isi terlalu banyak text
- Jangan paksa large font di thermal 58mm
- Jangan lupa test di actual printer

---

## 💡 Pro Tips

1. **Logo Tips:**
   - Background transparent PNG
   - Landscape orientation (lebar > tinggi)
   - High contrast (hitam-putih best for thermal)

2. **Text Tips:**
   - Max 40 karakter per line untuk 80mm
   - Max 28 karakter per line untuk 58mm
   - Gunakan line break (Enter) untuk multi-line

3. **Performance Tips:**
   - USB > Bluetooth (10x lebih cepat)
   - Ethernet printer best untuk busy restaurant
   - Cache settings di localStorage

4. **Design Tips:**
   - Simple is better
   - Black & white best for thermal
   - Test print dari berbagai device

---

## 📞 Need Help?

**Error Message → Solution:**

| Error | Fix |
|-------|-----|
| "Cannot open print dialog" | Enable popups di browser |
| "Printer not found" | Check USB connection |
| "Layout overflow" | Reduce font size |
| "Image not loading" | Compress logo file |
| "Print too slow" | Use USB not Bluetooth |

---

## 🔗 Related Docs

- Full Guide: `RECEIPT_CONFIGURATION_GUIDE.md`
- API Reference: `pos/frontend/js/services/receipt-generator.js`
- Settings UI: `backoffice/frontend/settings/receipt-settings.html`

---

**Setup Time:** 5 minutes  
**Difficulty:** Easy ⭐⭐  
**Cost:** Rp 500rb - 10jt (printer)

✅ **You're ready to print receipts!**
