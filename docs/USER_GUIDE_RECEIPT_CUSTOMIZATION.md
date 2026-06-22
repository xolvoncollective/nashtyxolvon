# 🧾 User Guide: Receipt Customization

**NASHTY OS Backoffice - Receipt Customization Guide**  
**Version:** 1.0  
**Last Updated:** June 22, 2026

---

## 🎯 Overview

Receipt Customization memungkinkan Anda untuk mempersonalisasi tampilan struk sesuai dengan branding restoran. Semua perubahan akan langsung terlihat di live preview dan diterapkan ke semua transaksi selanjutnya.

**Yang Bisa Dikustomisasi:**
- 🎨 Logo restoran
- 📝 Header text (greeting, jam operasional)
- 📝 Footer text (thank you message, terms)
- 🔠 Font size (10pt/12pt/14pt)
- 📱 QR code untuk feedback
- 🌐 Social media links
- 🎯 Promotional messages

**Update Time:** Perubahan berlaku dalam <1 detik

---

## 📂 Mengakses Settings

### Via Backoffice
1. Login ke backoffice: `https://your-domain.com/backoffice`
2. Navigate: **Settings** → **Receipt Settings**
3. Atau langsung: `/backoffice/pages/receipt-settings.html`

### Permissions
- ✅ **Superadmin:** Full access
- ✅ **Manager:** Can edit
- ❌ **Staff:** View only

---

## 🎨 Logo Upload

### Spesifikasi Logo
- **Format:** PNG, JPG, atau SVG
- **Ukuran File:** Maksimal 2 MB
- **Dimensi:** Akan di-resize otomatis ke width 200px (maintain aspect ratio)
- **Posisi:** Center, di bagian paling atas struk
- **Rekomendasi:** Square atau horizontal logo (ratio 1:1 atau 16:9)

### Cara Upload

**Step 1: Prepare Logo**
- Pastikan logo high-quality (minimal 200x200px)
- Background transparan (PNG) lebih baik
- Format SVG ideal untuk scalability

**Step 2: Upload**
1. Klik tombol "**Choose File**" di bagian Logo Upload
2. Browse dan pilih file logo
3. System akan validasi format dan ukuran
4. Preview muncul di bawah tombol upload
5. Logo juga muncul di Live Preview di sebelah kanan

**Step 3: Verify**
- Cek preview apakah logo terpotong
- Pastikan contrast dengan background
- Test print untuk verify actual size

### Troubleshooting

**❌ File Ditolak: "File too large"**
- Logo melebihi 2 MB
- **Solusi:** Compress image menggunakan TinyPNG atau ImageOptim
- Target: <500 KB ideal

**❌ Format Tidak Didukung**
- File bukan PNG/JPG/SVG
- **Solusi:** Convert ke PNG menggunakan image editor

**⚠️ Logo Terpotong di Print**
- Logo terlalu lebar untuk thermal printer
- **Solusi:** Crop logo ke aspect ratio 1:1 atau 2:1

---

## 📝 Header Text

### Purpose
Header text muncul **tepat di bawah logo**, biasanya berisi:
- Greeting ("Welcome!" / "Selamat Datang!")
- Tagline restoran
- Jam operasional
- Alamat outlet (optional)

### Spesifikasi
- **Maksimal:** 200 karakter
- **Line Breaks:** Supported dengan `\n` atau Enter key
- **Alignment:** Center
- **Font:** Bold

### Contoh Header Text
```
Welcome to NASHTY OS!
Premium Indonesian Cuisine
---
Open Daily: 10AM - 10PM
Jl. Galaxy Boulevard No. 123
```

### Tips
- ✅ **Keep it short:** 3-4 lines maksimal
- ✅ **Use line breaks:** Untuk readability
- ✅ **Include important info:** Jam buka, phone, address
- ❌ **Avoid long sentences:** Struk width terbatas

### Character Counter
- **Real-time counter** muncul di bawah input
- Menunjukkan sisa karakter (e.g., "150/200 characters")
- **Warning** muncul jika mendekati limit (>180 chars)

---

## 📝 Footer Text

### Purpose
Footer text muncul **di bagian paling bawah struk**, biasanya berisi:
- Thank you message
- Return policy
- Terms and conditions
- Contact information
- Promo info

### Spesifikasi
- **Maksimal:** 300 karakter
- **Line Breaks:** Supported
- **Alignment:** Center
- **Font:** Regular (smaller than header)

### Contoh Footer Text
```
Thank you for dining with us!
Visit us again soon for more delicious meals.
---
Returns accepted within 24 hours
For inquiries: (021) 1234-5678
www.nashtyos.com
```

### Tips
- ✅ **Warm closing:** "Thank you" message personal
- ✅ **CTA (Call to Action):** "Visit again", "Follow us"
- ✅ **Legal info:** Return policy jika perlu
- ❌ **Too formal:** Keep friendly and approachable

---

## 🔠 Font Size

### Available Options
| Size | Point | Best For | Readability |
|------|-------|----------|-------------|
| **Small** | 10pt | Maximized receipt width, fit more info | Good |
| **Medium** | 12pt | **Default**, balanced | Excellent |
| **Large** | 14pt | Elderly customers, accessibility | Best |

### What's Affected
- ✅ Header text
- ✅ Body text (items, prices)
- ✅ Footer text
- ❌ Logo size (not affected)

### Recommendation
- **Default:** 12pt (Medium)
- **Elderly-friendly outlets:** 14pt (Large)
- **Info-dense receipts:** 10pt (Small)

### Testing
1. Change font size in settings
2. Check live preview
3. **Print test receipt** (recommended!)
4. Verify with team/customers

---

## 📱 QR Code for Feedback

### Purpose
QR code memungkinkan customer memberikan feedback dengan mudah via smartphone scan.

### Setup

**Step 1: Create Feedback Form**
- Gunakan Google Forms, Typeform, atau SurveyMonkey
- URL harus **HTTPS** (secure)
- Mobile-friendly form

**Step 2: Enable QR Code**
1. Toggle "**Enable QR Code**" = ON
2. Input feedback URL (e.g., `https://forms.gle/abc123`)
3. System validasi URL (must be HTTPS)
4. QR code langsung generate di preview

**Step 3: Positioning**
- QR code muncul **di atas footer text**
- Size: 100x100 pixels
- Label: "Scan for Feedback" atau custom text

### URL Validation
- ✅ **Valid:** `https://forms.google.com/...`
- ✅ **Valid:** `https://www.surveymonkey.com/...`
- ❌ **Invalid:** `http://...` (not secure)
- ❌ **Invalid:** `www.example.com` (missing protocol)

### Best Practices
- ✅ Short URL (use bit.ly or tinyurl.com)
- ✅ Test QR code with multiple devices
- ✅ Incentivize feedback (e.g., "Scan for 10% off next visit")
- ✅ Monitor responses regularly

---

## 🌐 Social Media Links

### Supported Platforms
- **Facebook:** `https://facebook.com/your-page`
- **Instagram:** `https://instagram.com/your-account`
- **Twitter:** `https://twitter.com/your-handle`
- **TikTok:** `https://tiktok.com/@your-account`

### Setup
1. Input URL untuk setiap platform (optional)
2. System validasi domain platform
3. Icons otomatis muncul di footer
4. Empty fields tidak ditampilkan

### URL Validation
**Facebook:**
- ✅ `https://facebook.com/nashtyos`
- ✅ `https://www.facebook.com/nashtyos`
- ❌ `https://twitter.com/nashtyos` (wrong domain)

**Instagram:**
- ✅ `https://instagram.com/nashtyos`
- ✅ `https://www.instagram.com/nashtyos`
- ❌ `https://instagram.com/` (missing account)

### Display
- Links muncul dengan **icons** (Facebook logo, Instagram logo, dll)
- Text: "@your-handle" atau "/your-page"
- **Clickable** di digital receipts (email)
- **Scannable QR codes** di print receipts (optional)

### Best Practices
- ✅ Only add platforms you actively use
- ✅ Verify account names before adding
- ✅ Keep accounts public for customer access
- ❌ Don't add personal accounts

---

## 🎯 Promotional Messages

### Purpose
Rotating promotional messages di receipts untuk marketing campaigns.

### Spesifikasi
- **Jumlah:** Maksimal 3 messages
- **Panjang:** 150 karakter per message
- **Rotation:** Random per print (tidak urut)
- **Position:** Antara order items dan footer
- **Style:** Bold text dengan contrasting background

### Setup
1. Enable "**Show Promotional Messages**"
2. Input message 1 (required if enabled)
3. Input message 2 (optional)
4. Input message 3 (optional)
5. Messages akan rotate randomly

### Contoh Messages
**Message 1 (Current Promo):**
```
🎉 Happy Hour: 50% OFF drinks from 3-5 PM daily!
```

**Message 2 (Loyalty Program):**
```
Join our rewards program! Get 1 point for every Rp 10,000 spent.
```

**Message 3 (Upsell):**
```
Try our new Nasi Goreng Kemangi! Only Rp 35,000.
```

### Rotation Logic
- **Random:** Setiap print pilih 1 message secara random
- **Equal probability:** Setiap message punya chance yang sama
- **Single message:** Jika hanya 1 message, always show that

### Character Counter
- Real-time counter untuk setiap message
- Format: "120/150 characters"
- Warning jika >140 chars

### Best Practices
- ✅ **Action-oriented:** "Get", "Try", "Join"
- ✅ **Time-sensitive:** "Today only", "Limited time"
- ✅ **Clear benefit:** "50% OFF", "Free dessert"
- ✅ **Emojis:** Add visual appeal (1-2 per message)
- ❌ **Too salesy:** Avoid pushy language
- ❌ **Outdated promos:** Update regularly!

---

## 🔍 Live Preview

### Features
- **Real-time updates:** Changes reflect instantly (<100ms)
- **Accurate rendering:** WYSIWYG (What You See Is What You Get)
- **Scrollable:** For long receipts
- **Zoom:** Ctrl + MouseWheel to zoom in/out

### What's Shown
- ✅ Logo (if uploaded)
- ✅ Header text with formatting
- ✅ Sample order items
- ✅ Totals (subtotal, tax, grand total)
- ✅ Promotional message (random sample)
- ✅ QR code (if enabled)
- ✅ Social media links (if added)
- ✅ Footer text

### Limitations
- Preview uses sample data (not real order)
- Actual thermal printer may have slight differences
- **Always test print** before going live!

---

## 💾 Saving Settings

### Save Process
1. Review all settings dan live preview
2. Click "**💾 Save Receipt Settings**" button
3. System validasi semua inputs
4. Konfirmasi: "✅ Receipt settings saved successfully!"
5. Settings langsung aktif untuk semua new receipts

### Validation Errors
**❌ Missing Required Fields:**
- "Logo tidak diupload" (if logo required by policy)
- "Header text cannot be empty"

**❌ Character Limits:**
- "Header text exceeds 200 characters"
- "Promo message 2 exceeds 150 characters"

**❌ Invalid URLs:**
- "QR code URL must be HTTPS"
- "Invalid Facebook URL format"

**Fix errors dan save lagi**

### Apply Settings
- Settings tersimpan per outlet di Supabase
- All POS terminals di outlet akan load settings yang sama
- Perubahan efektif **immediately** (no restart needed)

---

## 🖨️ Testing Print Receipt

### Cara Test

**Step 1: Save Settings**
- Pastikan settings sudah saved

**Step 2: Buat Test Order**
1. Login ke POS
2. Tambahkan beberapa produk ke cart
3. Process payment (test mode)
4. Print receipt

**Step 3: Verify Print**
- ✅ Logo muncul dengan jelas
- ✅ Text tidak terpotong
- ✅ Font size readable
- ✅ QR code scannable (test dengan phone)
- ✅ Social media links readable
- ✅ Promo message muncul

### Common Print Issues

**❌ Logo Terlalu Besar / Terpotong**
- **Cause:** Logo width melebihi thermal printer width (typically 58mm or 80mm)
- **Fix:** Resize logo, max width 200px recommended

**❌ Text Terpotong di Kanan**
- **Cause:** Line terlalu panjang untuk printer width
- **Fix:** Use line breaks, keep lines <32 chars (for 58mm) or <48 chars (for 80mm)

**❌ QR Code Tidak Scannable**
- **Cause:** QR code terlalu kecil atau printer resolution rendah
- **Fix:** Test dengan printer resolution lebih tinggi, atau gunakan short URL

**⚠️ Font Size Terlalu Kecil**
- **Cause:** Setting Small (10pt) dengan printer low-res
- **Fix:** Increase to Medium (12pt) atau Large (14pt)

---

## 📊 Best Practices

### Design Guidelines

**Logo:**
- Square atau horizontal orientation
- High contrast (dark logo pada white paper)
- Transparent background (PNG)
- Minimal 200x200px resolution

**Header:**
- 3-4 lines maksimal
- Line 1: Greeting / Brand name
- Line 2: Tagline
- Line 3-4: Address / Contact

**Footer:**
- Thank you message (warm, personal)
- Call to action (visit again, follow us)
- Legal info jika diperlukan (return policy)
- Contact info (phone, email, website)

**Promo Messages:**
- Rotate messages every week/month
- Time-sensitive offers untuk urgency
- Clear benefit statement
- Test on actual receipts before deploy

### Accessibility

**Font Size:**
- Default: 12pt
- Elderly-friendly: 14pt
- Consider customer demographics

**Contrast:**
- Black text on white paper (standard)
- Bold for headers
- Regular for body

**QR Code:**
- Size: Min 100x100px
- Test scannability dengan berbagai devices
- Add text fallback (URL) jika needed

### Brand Consistency

**Maintain brand identity:**
- Logo sesuai brand guidelines
- Colors (jika colored printer)
- Tone of voice di text (formal vs casual)
- Social media presence updated

**Multi-Outlet:**
- Logo sama untuk all outlets (brand consistency)
- Header bisa beda (outlet-specific address)
- Footer sama atau outlet-specific
- Promo messages bisa outlet-specific atau centralized

---

## 🔄 Update Schedule

### Recommended Review Cadence

**Monthly:**
- Review promo messages
- Update seasonal offerings
- Check QR code links active

**Quarterly:**
- Review header/footer text
- Verify contact information
- Test print receipts
- Update social media links

**Yearly:**
- Refresh logo (if rebranding)
- Full design review
- Customer feedback on receipts

---

## 📞 Support & Resources

**Need Help?**
- Documentation: This guide
- Video tutorial: [Link]
- IT Support: [Contact]
- Training materials: [Link]

**Technical Issues:**
- Logo upload fails: Check file format and size
- Settings not saving: Check browser console (F12)
- Print issues: Contact IT support with printer model info

**Design Consultation:**
- Marketing team: For brand guidelines
- Graphic designer: For logo optimization

---

## 📋 Quick Checklist

```
✅ RECEIPT CUSTOMIZATION CHECKLIST

LOGO:
□ Upload high-quality logo (PNG/SVG)
□ Verify size <2 MB
□ Check preview rendering
□ Test print on actual printer

TEXT:
□ Header: 200 chars max, 3-4 lines
□ Footer: 300 chars max, warm closing
□ Spell-check all text
□ Verify contact info accurate

FONT SIZE:
□ Select appropriate size (default: 12pt)
□ Consider customer demographics
□ Test readability on print

QR CODE:
□ Create feedback form (HTTPS URL)
□ Enable QR code toggle
□ Input valid URL
□ Test scannability with phone

SOCIAL MEDIA:
□ Add active platform URLs only
□ Verify account names
□ Check domain validation passed

PROMO MESSAGES:
□ Write 1-3 messages (150 chars each)
□ Use action verbs and clear benefits
□ Set rotation for variety
□ Schedule monthly updates

TESTING:
□ Review live preview
□ Save settings
□ Create test order
□ Print test receipt
□ Verify all elements
□ Get team feedback

LAUNCH:
□ Inform all staff of changes
□ Monitor customer reactions
□ Collect feedback
□ Iterate based on feedback
```

---

**🎯 Pro Tip:** Print 5 test receipts before going live to catch any issues!

**Last Updated:** June 22, 2026  
**Version:** 1.0  
**Next Review:** December 2026
