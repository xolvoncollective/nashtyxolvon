# Recap Update: Perubahan Semenjak Pull Terakhir

Semenjak proses pull terakhir, kita telah melakukan serangkaian perbaikan bug, peningkatan keamanan, dan pembaruan integrasi dalam *codebase* Nashtylite. Berikut adalah rincian lengkap dari perubahan yang telah diimplementasikan:

## 1. Peningkatan Backend & Keamanan (API)
- **Validasi Harga di Sisi Server (Server-Side Price Validation):** Logika `POST /api/orders` pada backend telah diperbarui. Kini, backend secara mandiri menghitung ulang total harga pesanan, pajak (Tax 10%), dan Service Charge (5%) berdasarkan master data produk di database. Hal ini dilakukan untuk mencegah eksploitasi dan manipulasi harga yang dikirim dari *client-side*.
- **Rate Limiting untuk Login (Keamanan):** Menambahkan mekanisme pelindungan *rate limiter* pada endpoint `/api/auth/login` untuk mencegah serangan *brute force*, sehingga membatasi jumlah percobaan login beruntun yang berulang dari alamat IP yang sama.

## 2. Perbaikan pada Modul KDS (Kitchen Display System)
- **Sinkronisasi Endpoint KDS:** Memperbaiki pemanggilan URL pada antarmuka KDS dan *controller* backend. (contoh: memperbaiki URL dari `/orders/kds/stats` menjadi `/orders/kitchen/stats` agar sesuai dengan *routing* yang tersedia).
- **Update Status Pesanan Dapur:** Memperbaiki alur dan format data (payload) pada proses pembaruan status pesanan dapur (misalnya saat menandai pesanan dari `pending` menjadi `ready`), agar status sinkron dengan POS dan Backoffice.

## 3. Integrasi Routing Frontend & Sistem
- **Static File Serving untuk Sub-Modul:** Melakukan merge dari *branch* `codingmampus` yang berisi perbaikan penyajian file *frontend*. File `index.ts` pada Express JS kini secara eksplisit melayani rute `/pos`, `/kds`, dan `/backoffice` langsung dari folder *frontend* masing-masing agar dapat berjalan pada satu port utama.

## 4. Perbaikan Workflow & Development (QoL)
- **Mode Bypass Autentikasi untuk Dev (Localhost):** Menambahkan pengaturan *bypass* pada script `shared/auth.js` yang akan menyuntikkan *demo credentials* secara otomatis saat aplikasi diakses melalui *localhost* atau `127.0.0.1`. Hal ini mempermudah proses testing dan pengembangan lokal karena memotong keharusan login penuh via *launcher*.
- **Pembaruan Script `kill-port.ps1`:** Script `kill-port.ps1` telah diperbarui agar lebih kokoh, kini mampu menangkap dan mematikan *(kill)* beberapa Process ID (PID) sekaligus yang menahan satu port yang sama tanpa terjadi *error*.
- **Pembaruan Dokumentasi:** Memindahkan dan memperbarui dokumentasi teknis API lama ke dalam `Draft/API_DOCUMENTATION.md` untuk mencerminkan *endpoint* dan *payload* yang digunakan saat ini.

---
*Catatan:* Semua *test integration* untuk perubahan API ini telah diperbarui agar sesuai dengan validasi sisi server yang baru diterapkan.
