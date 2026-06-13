# Panduan Menjalankan NASHTY POS di Local

Karena sistem NASHTY POS (KDS, POS, Backoffice) sekarang sepenuhnya terintegrasi secara dinamis dengan Backend Express.js & SQLite, Anda hanya perlu menjalankan backend-nya saja. Backend ini sudah dikonfigurasi untuk menjalankan API sekaligus menyajikan (*serve*) file HTML statis untuk aplikasi _frontend_.

### 🚀 Script Cepat (Copy-Paste ke Terminal)

Silakan **Copy (Ctrl+C)** satu baris perintah PowerShell di bawah ini dan **Paste (Ctrl+V)** ke terminal Anda (pastikan Anda berada di dalam folder utama `himapatokayam`), lalu tekan Enter:

```powershell
$port=3099; $p=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; if ($p) { Stop-Process -Id $p.OwningProcess -Force }; cd backoffice\backend; npm install; $env:PORT=$port; npm run dev
```

### 🔗 Link Akses Aplikasi

Setelah tulisan `NASHTY OS Backend Server Started` muncul di terminal, Anda bisa langsung mengakses aplikasi melalui link berikut:

- **Point of Sale (Kasir)**: [http://localhost:3099/pos/frontend/index.html](http://localhost:3099/pos/frontend/index.html)
- **Kitchen Display System (Dapur)**: [http://localhost:3099/kds/frontend/index.html](http://localhost:3099/kds/frontend/index.html)
- **Backoffice (Manajer)**: [http://localhost:3099/backoffice/frontend/index.html](http://localhost:3099/backoffice/frontend/index.html)

---

**Catatan Tambahan:**
1. Semua aplikasi akan menggunakan database terpusat yang sama (`data/nashtypos.db`).
2. Perubahan pada orderan di POS akan langsung masuk ke KDS, dan transaksi yang selesai di POS/KDS akan langsung masuk ke perhitungan Laporan di Backoffice.
3. Karena *Thermal Printer* memanfaatkan **WebUSB**, pastikan Anda membuka link POS menggunakan browser modern berbasis Chromium seperti **Google Chrome** atau **Microsoft Edge**.
