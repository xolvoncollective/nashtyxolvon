# 📄 Panduan Konfigurasi Receipt Printing - NASHTY OS

## 🎯 Overview

Sistem receipt printing di NASHTY OS dirancang khusus untuk **web app** yang bisa diakses dari berbagai device (komputer kasir, tablet, smartphone). Karena berbasis web, sistem ini menggunakan **browser printing API** bukan thermal printer driver.

---

## 🏗️ Arsitektur Receipt System

```
┌─────────────────────────────────────────────┐
│           USER FLOW                         │
├─────────────────────────────────────────────┤
│                                             │
│  1. Kasir checkout order di POS             │
│  2. Click "Print Receipt" button            │
│  3. Browser membuka print dialog            │
│  4. Pilih printer (thermal/regular)         │
│  5. Print!                                  │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           TECHNICAL FLOW                    │
├─────────────────────────────────────────────┤
│                                             │
│  POS Frontend (checkout.js)                 │
│         ↓                                   │
│  ReceiptGenerator.generateReceipt()         │
│         ↓                                   │
│  Build HTML template + styling              │
│         ↓                                   │
│  Open new window with receipt HTML          │
│         ↓                                   │
│  window.print() → Browser Print Dialog      │
│         ↓                                   │
│  User selects printer                       │
│         ↓                                   │
│  Receipt dicetak!                           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📋 Cara Konfigurasi Receipt

### A. Konfigurasi Dasar (Via Backoffice)

1. **Login ke Backoffice** sebagai superadmin atau outlet manager
2. **Buka menu "Settings" → "Receipt Settings"**
3. **Isi konfigurasi:**

#### 1. **Logo Upload** (Opsional)
   - Format: PNG, JPG, atau SVG
   - Ukuran maksimal: 2MB
   - Recommended size: 300x100px (landscape)
   - Logo akan muncul di bagian atas receipt

   ```javascript
   // Cara kerja:
   // - File di-upload → Convert to Base64
   // - Disimpan ke localStorage / Supabase
   // - Ditampilkan sebagai <img> tag di receipt
   ```

#### 2. **Header Text** (Opsional)
   - Max 200 karakter
   - Multi-line supported (tekan Enter untuk line baru)
   - Contoh:
     ```
     Selamat Datang di NASHTY Restaurant
     Jl. Merdeka No. 123, Jakarta
     Telp: 021-12345678
     ```

#### 3. **Footer Text** (Opsional)
   - Max 300 karakter
   - Multi-line supported
   - Contoh:
     ```
     Terima kasih atas kunjungan Anda!
     Barang yang sudah dibeli tidak dapat dikembalikan
     Follow us: @nashtyrestaurant
     ```

#### 4. **Font Size**
   - Small (10pt) - Untuk thermal printer 58mm
   - Medium (12pt) - Untuk thermal printer 80mm ✅ Recommended
   - Large (14pt) - Untuk regular printer A4

#### 5. **QR Code for Feedback** (Opsional)
   - Toggle ON/OFF
   - Masukkan URL feedback form (Google Forms, Typeform, dll)
   - QR code akan generate otomatis
   - Pelanggan bisa scan untuk kasih review

   ```javascript
   // QR Code Library: qrcode.js
   // Generate URL: https://api.qrserver.com/v1/create-qr-code/
   ```

#### 6. **Social Media Links** (Opsional)
   - Facebook URL
   - Instagram URL
   - Twitter/X URL
   - TikTok URL
   - Akan tampil sebagai footer di receipt

#### 7. **Promotional Messages** (Max 3)
   - Message 1, 2, 3 (max 150 char each)
   - Sistem akan **random pilih salah satu** di setiap receipt
   - Contoh:
     - "Dapatkan diskon 10% untuk kunjungan berikutnya!"
     - "Follow Instagram @nashty untuk info promo terbaru"
     - "Free dessert untuk ulang tahun kamu!"

4. **Klik "Save Settings"**
5. **Test print dari POS**

---

### B. Konfigurasi Advanced (Via Code)

#### Edit Receipt Template

File: `pos/frontend/js/services/receipt-generator.js`

```javascript
class ReceiptGenerator {
  buildTemplate(order, settings) {
    return `
      <div style="width:300px;font-family:monospace;font-size:12pt;">
        
        <!-- LOGO -->
        ${settings.receiptLogo ? 
          `<img src="${settings.receiptLogo}" 
                style="max-width:200px;display:block;margin:0 auto 10px;">` 
          : ''}
        
        <!-- HEADER -->
        ${settings.receiptHeader ? 
          `<div style="text-align:center;margin:10px 0;">
            ${settings.receiptHeader}
          </div>` 
          : ''}
        
        <!-- OUTLET NAME -->
        <div style="text-align:center;font-weight:bold;">
          ${order.outletName}
        </div>

        <hr style="border:0;border-top:1px dashed #333;" />

        <!-- ORDER INFO -->
        <div style="text-align:center;font-size:10pt;">
          <div>Order #${order.orderNumber}</div>
          <div>${this.formatDateTime(order.createdAt)}</div>
          <div>Kasir: ${order.cashierName}</div>
        </div>

        <hr style="border:0;border-top:1px dashed #333;" />

        <!-- ORDER ITEMS -->
        ${order.items.map(item => `
          <div style="display:flex;justify-content:space-between;">
            <span>${item.name} x${item.quantity}</span>
            <span>${this.formatCurrency(item.price * item.quantity)}</span>
          </div>
        `).join('')}

        <hr style="border:0;border-top:1px dashed #333;" />

        <!-- TOTALS -->
        <div style="font-weight:bold;">
          <div style="display:flex;justify-content:space-between;">
            <span>Subtotal:</span>
            <span>${this.formatCurrency(order.subtotal)}</span>
          </div>
          ${order.tax > 0 ? `
          <div style="display:flex;justify-content:space-between;">
            <span>Pajak:</span>
            <span>${this.formatCurrency(order.tax)}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;
                      font-size:14pt;border-top:2px solid #333;padding-top:5px;">
            <span>TOTAL:</span>
            <span>${this.formatCurrency(order.total)}</span>
          </div>
        </div>

        <!-- PROMO (Random) -->
        ${settings.receiptPromos?.length > 0 ?
          `<div style="background:#f0f0f0;padding:10px;margin:10px 0;
                       border:1px dashed #333;text-align:center;font-weight:bold;">
            ${this.selectRandomPromo(settings.receiptPromos)}
          </div>` : ''}

        <!-- QR CODE -->
        ${settings.receiptQrFeedback ? 
          `<div style="text-align:center;margin:15px 0;">
            <img src="${this.generateQrCodeUrl(settings.receiptQrFeedback)}" 
                 style="width:100px;height:100px;">
            <div style="font-size:10px;">Scan untuk Feedback</div>
          </div>` : ''}

        <!-- FOOTER -->
        ${settings.receiptFooter ?
          `<div style="text-align:center;margin:10px 0;font-size:10pt;">
            ${settings.receiptFooter}
          </div>` : ''}

        <div style="text-align:center;margin-top:15px;font-size:10pt;">
          Terima kasih atas kunjungan Anda!
        </div>
      </div>
    `;
  }
}
```

#### Custom CSS untuk Print

```css
@media print {
  @page {
    size: 80mm auto; /* Thermal printer 80mm width */
    margin: 0;
  }
  
  body {
    margin: 0;
    padding: 0;
  }
  
  /* Hide everything except receipt */
  body * {
    visibility: hidden;
  }
  
  .receipt-preview,
  .receipt-preview * {
    visibility: visible;
  }
  
  /* Force black text for better printing */
  * {
    color: black !important;
    background: white !important;
  }
}
```

---

## 🖨️ Setup Printer (Hardware)

### A. Thermal Printer (Recommended)

#### 1. **Pilih Thermal Printer yang Support Browser**

Recommended brands:
- **Epson TM-T82** (80mm, USB/Ethernet)
- **Xprinter XP-80C** (80mm, USB)
- **HOIN HOP-E801** (58mm, Bluetooth)
- **Star mPOP** (58mm, Bluetooth)

#### 2. **Install Driver Printer**

**Windows:**
1. Colok USB printer
2. Windows akan auto-detect
3. Install driver dari CD atau download dari website vendor
4. Test print dari "Devices and Printers"

**Mac:**
1. System Preferences → Printers & Scanners
2. Click "+" untuk add printer
3. Pilih printer yang detected
4. Install driver jika diminta

**Android Tablet:**
1. Install ESC/POS Print Service dari Play Store
2. Pair Bluetooth printer
3. Browser akan detect printer

#### 3. **Set Printer sebagai Default**

- Agar setiap kali print tidak perlu pilih printer manual
- Settings → Printers → Set as Default

#### 4. **Configure Paper Size**

**Untuk thermal printer 80mm:**
```
Paper Width: 80mm (3.15 inches)
Paper Height: Continuous (auto)
Margins: 0mm all sides
```

**Untuk thermal printer 58mm:**
```
Paper Width: 58mm (2.28 inches)  
Paper Height: Continuous (auto)
Margins: 0mm all sides
Font Size: Small (10pt)
```

---

### B. Regular Printer (A4 Paper)

Jika tidak punya thermal printer, bisa pakai printer biasa:

1. **Set Font Size ke "Large"** di receipt settings
2. **Print ke PDF** dulu untuk preview
3. **Potong kertas manual** setelah print

---

## 🔧 Cara Kerja di Browser

### 1. **Browser Print API**

```javascript
// Cara print dari JavaScript
async function printReceipt(receiptHtml) {
  // Buat window baru
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  
  // Masukkan HTML + CSS
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <style>
        @media print {
          @page { 
            size: 80mm auto; /* Thermal printer */
            margin: 0; 
          }
          body { margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body>${receiptHtml}</body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Tunggu sebentar agar image load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Trigger print dialog
  printWindow.print();
  
  // Close window setelah print (opsional)
  printWindow.onafterprint = () => printWindow.close();
}
```

### 2. **Auto-Print vs Manual**

**Manual Print (Current):**
- User click "Print Receipt" button
- Browser buka print dialog
- User pilih printer + settings
- User click "Print"

**Auto-Print (Future Enhancement):**
```javascript
// Bisa enable auto-print dengan:
window.print(); // Langsung print tanpa dialog

// TAPI browser modern block ini untuk security
// Harus enable di settings:
// Chrome: chrome://settings/content/popups
// Firefox: about:preferences#privacy
```

---

## 🐛 Troubleshooting

### ❌ Problem: Receipt tidak print

**Penyebab:**
1. Printer tidak connected
2. Driver belum terinstall
3. Paper size tidak cocok
4. Browser block popup

**Solusi:**
```bash
# 1. Cek printer status
# Windows: Control Panel → Devices and Printers
# Mac: System Preferences → Printers

# 2. Test print dari app lain (Notepad, Word)

# 3. Enable popup di browser
# Chrome → Settings → Privacy → Site Settings → Popups
# Allow: [your-pos-url]

# 4. Cek browser console untuk error
# F12 → Console tab
```

---

### ❌ Problem: Layout berantakan / tidak rapi

**Penyebab:**
- CSS tidak load dengan benar
- Font size terlalu besar untuk paper width
- Image terlalu besar

**Solusi:**

1. **Adjust Font Size:**
   ```javascript
   // Untuk thermal 58mm: gunakan Small (10pt)
   // Untuk thermal 80mm: gunakan Medium (12pt)
   // Untuk A4 paper: gunakan Large (14pt)
   ```

2. **Resize Logo:**
   ```css
   img {
     max-width: 200px; /* Jangan lebih dari paper width */
     max-height: 100px;
     display: block;
     margin: 0 auto;
   }
   ```

3. **Fix Line Breaking:**
   ```css
   /* Paksa text wrap, jangan overflow */
   .receipt-item span {
     max-width: 150px;
     word-wrap: break-word;
     white-space: normal;
   }
   ```

4. **Test di Browser Dulu:**
   ```javascript
   // Preview receipt sebelum print
   const preview = document.getElementById('preview');
   preview.innerHTML = receiptHtml;
   
   // Measure width
   console.log('Receipt width:', preview.offsetWidth);
   // Harus < 300px untuk thermal 80mm
   // Harus < 220px untuk thermal 58mm
   ```

---

### ❌ Problem: QR Code tidak muncul

**Penyebab:**
- QR library belum load
- URL tidak valid
- Image blocked by printer

**Solusi:**

1. **Pastikan library loaded:**
   ```html
   <!-- Tambahkan di HTML -->
   <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
   ```

2. **Generate QR as Base64:**
   ```javascript
   // Lebih reliable daripada external URL
   async generateQrCodeBase64(url) {
     const canvas = document.createElement('canvas');
     await QRCode.toCanvas(canvas, url, { width: 100 });
     return canvas.toDataURL('image/png');
   }
   
   // Usage:
   const qrImage = await generateQrCodeBase64(feedbackUrl);
   html += `<img src="${qrImage}" style="width:100px;height:100px;">`;
   ```

---

### ❌ Problem: Print sangat lambat

**Penyebab:**
- Image terlalu besar (file size)
- Banyak image di receipt
- Printer connection slow (Bluetooth)

**Solusi:**

1. **Compress Logo:**
   ```javascript
   // Sebelum save, compress image
   async compressImage(file) {
     const canvas = document.createElement('canvas');
     const ctx = canvas.getContext('2d');
     const img = new Image();
     
     return new Promise((resolve) => {
       img.onload = () => {
         // Max width 300px
         const maxWidth = 300;
         const scale = maxWidth / img.width;
         canvas.width = maxWidth;
         canvas.height = img.height * scale;
         
         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
         
         // Convert to JPEG 80% quality
         canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
       };
       img.src = URL.createObjectURL(file);
     });
   }
   ```

2. **Gunakan USB bukan Bluetooth:**
   - USB = 480 Mbps
   - Bluetooth = 3 Mbps
   - USB jauh lebih cepat!

3. **Preload Receipt Template:**
   ```javascript
   // Load settings sekali di awal
   class POSApp {
     async init() {
       this.receiptSettings = await this.loadReceiptSettings();
       // Sekarang settings sudah di memory
     }
     
     async checkout() {
       // Generate receipt pakai settings yang sudah di-cache
       const receipt = ReceiptGenerator.generate(
         order, 
         this.receiptSettings // No API call!
       );
     }
   }
   ```

---

## 🎨 Custom Receipt Designs

### Design 1: Minimalist

```javascript
buildMinimalistTemplate(order, settings) {
  return `
    <div style="width:300px;font-family:'Courier New';font-size:12pt;
                text-align:center;padding:20px;">
      <h1 style="font-size:24pt;margin:0;">${order.outletName}</h1>
      <p style="margin:5px 0;">━━━━━━━━━━━━━━━</p>
      
      ${order.items.map(item => `
        <div style="display:flex;justify-content:space-between;margin:8px 0;">
          <span>${item.quantity}x ${item.name}</span>
          <span>${this.formatCurrency(item.price * item.quantity)}</span>
        </div>
      `).join('')}
      
      <p style="margin:10px 0;">━━━━━━━━━━━━━━━</p>
      <h2 style="font-size:18pt;margin:10px 0;">
        TOTAL: ${this.formatCurrency(order.total)}
      </h2>
      
      <p style="font-size:10pt;margin-top:20px;">
        ${this.formatDateTime(order.createdAt)}<br>
        Order #${order.orderNumber}
      </p>
    </div>
  `;
}
```

### Design 2: Modern with Emoji

```javascript
buildModernTemplate(order, settings) {
  return `
    <div style="width:300px;font-family:'Arial';font-size:12pt;padding:20px;">
      <div style="text-align:center;background:#FF5A1F;color:white;
                  padding:15px;border-radius:10px;margin-bottom:20px;">
        <h1 style="margin:0;font-size:20pt;">🍕 ${order.outletName}</h1>
      </div>
      
      <div style="background:#f5f5f5;padding:15px;border-radius:8px;">
        ${order.items.map(item => `
          <div style="display:flex;justify-content:space-between;
                      margin-bottom:10px;padding-bottom:10px;
                      border-bottom:1px solid #ddd;">
            <div>
              <div style="font-weight:bold;">${item.name}</div>
              <div style="font-size:10pt;color:#666;">Qty: ${item.quantity}</div>
            </div>
            <div style="font-weight:bold;color:#FF5A1F;">
              ${this.formatCurrency(item.price * item.quantity)}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-top:20px;padding-top:20px;border-top:2px solid #333;">
        <div style="display:flex;justify-content:space-between;
                    font-size:16pt;font-weight:bold;">
          <span>💰 TOTAL</span>
          <span>${this.formatCurrency(order.total)}</span>
        </div>
      </div>
      
      <div style="text-align:center;margin-top:20px;padding-top:20px;
                  border-top:1px dashed #999;color:#666;font-size:10pt;">
        <p>🙏 Terima kasih atas kunjungan Anda!</p>
        <p>${this.formatDateTime(order.createdAt)}</p>
        <p>Order #${order.orderNumber}</p>
      </div>
    </div>
  `;
}
```

### Design 3: Classic Restaurant

```javascript
buildClassicTemplate(order, settings) {
  return `
    <div style="width:300px;font-family:'Georgia',serif;font-size:12pt;padding:20px;">
      <div style="text-align:center;border:3px double #000;padding:20px;">
        ${settings.receiptLogo ? 
          `<img src="${settings.receiptLogo}" style="max-width:150px;margin-bottom:10px;">` 
          : ''}
        <h1 style="margin:0;font-size:22pt;font-weight:normal;">
          ${order.outletName}
        </h1>
        ${settings.receiptHeader ? 
          `<p style="margin:10px 0;font-size:10pt;">${settings.receiptHeader}</p>` 
          : ''}
      </div>
      
      <table style="width:100%;margin-top:20px;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #000;">
            <th style="text-align:left;padding:8px 0;">Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr style="border-bottom:1px solid #ddd;">
              <td style="padding:8px 0;">${item.name}</td>
              <td style="text-align:center;">${item.quantity}</td>
              <td style="text-align:right;">
                ${this.formatCurrency(item.price * item.quantity)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top:20px;padding-top:20px;border-top:2px solid #000;">
        <table style="width:100%;">
          <tr>
            <td style="text-align:right;padding:5px 0;">Subtotal:</td>
            <td style="text-align:right;width:120px;font-weight:bold;">
              ${this.formatCurrency(order.subtotal)}
            </td>
          </tr>
          ${order.tax > 0 ? `
          <tr>
            <td style="text-align:right;padding:5px 0;">Tax:</td>
            <td style="text-align:right;font-weight:bold;">
              ${this.formatCurrency(order.tax)}
            </td>
          </tr>` : ''}
          <tr style="border-top:2px solid #000;">
            <td style="text-align:right;padding:10px 0;font-size:14pt;">
              <strong>TOTAL:</strong>
            </td>
            <td style="text-align:right;font-size:14pt;font-weight:bold;">
              ${this.formatCurrency(order.total)}
            </td>
          </tr>
        </table>
      </div>
      
      <div style="text-align:center;margin-top:30px;font-size:10pt;
                  padding-top:20px;border-top:1px solid #ddd;">
        <p style="margin:5px 0;">${this.formatDateTime(order.createdAt)}</p>
        <p style="margin:5px 0;">Order #${order.orderNumber}</p>
        <p style="margin:5px 0;">Cashier: ${order.cashierName}</p>
        ${settings.receiptFooter ? 
          `<p style="margin:15px 0 5px;font-style:italic;">
            ${settings.receiptFooter}
          </p>` 
          : ''}
      </div>
    </div>
  `;
}
```

---

## 🚀 Best Practices

### 1. **Keep It Simple**
- Jangan terlalu banyak image/logo
- Fokus ke readability
- Test print sebelum deploy

### 2. **Optimize for Speed**
- Cache receipt settings di localStorage
- Compress images before upload
- Gunakan USB printer bukan Bluetooth

### 3. **Test di Multiple Devices**
- Desktop browser (Chrome, Firefox)
- Tablet (iPad, Android)
- Mobile phone (Android, iOS)

### 4. **Provide Preview**
- Selalu tampilkan preview before print
- User bisa check layout dulu

### 5. **Fallback Plan**
- Jika print gagal, save receipt as PDF
- Email receipt ke customer
- SMS receipt link

---

## 📱 Mobile Printing (Android/iOS)

### Android

1. **Install Print Service:**
   ```
   Play Store → "Star Print Service" atau "Epson Print Enabler"
   ```

2. **Connect Printer:**
   - Bluetooth pairing
   - Atau WiFi Direct

3. **Print dari Browser:**
   - Browser akan detect print service
   - Same flow dengan desktop

### iOS (iPad/iPhone)

1. **AirPrint Compatible Printer:**
   - Epson TM-T82III with AirPrint
   - Star mPOP with AirPrint

2. **Print dari Safari:**
   - Safari → Share → Print
   - Select AirPrint printer

---

## 🔮 Future Enhancements

### 1. **Cloud Print**
```javascript
// Send receipt to cloud printing service
async printViaCloud(receipt) {
  await fetch('https://printnode.com/api/print', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + API_KEY },
    body: JSON.stringify({
      printerId: PRINTER_ID,
      content: receipt,
      contentType: 'raw_html'
    })
  });
}
```

### 2. **Email Receipt**
```javascript
async emailReceipt(order, customerEmail) {
  await fetch('/api/send-receipt', {
    method: 'POST',
    body: JSON.stringify({
      to: customerEmail,
      subject: `Receipt #${order.orderNumber}`,
      html: ReceiptGenerator.generate(order)
    })
  });
}
```

### 3. **WhatsApp Receipt**
```javascript
async sendWhatsAppReceipt(order, phoneNumber) {
  const receiptUrl = await uploadReceiptPDF(order);
  await fetch('/api/whatsapp/send', {
    method: 'POST',
    body: JSON.stringify({
      to: phoneNumber,
      message: `Terima kasih! Receipt Anda: ${receiptUrl}`
    })
  });
}
```

---

## 📞 Support

Jika ada masalah:
1. Check browser console (F12)
2. Check printer status
3. Test print dari app lain
4. Contact developer

---

**Last Updated:** June 23, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
