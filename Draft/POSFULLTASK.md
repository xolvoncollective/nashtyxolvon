# POSFULLTASK.md - Panduan Cara Main Opsi 1 (Vanilla + Express)

Dokumen ini berisi daftar tugas untuk memigrasikan mockup `NASHTY_POS_Mockup.html` menjadi aplikasi POS utuh menggunakan arsitektur Vanilla HTML/CSS/JS (Frontend) yang terintegrasi dengan Express API dan database SQLite (Backend).

## Tugas Integrasi Backend & Frontend

### 1. Konfigurasi Express Server
- [x] Mengatur Express di `backend/src/index.ts` agar menyajikan folder `POSLITE` sebagai folder aset statis.
- [x] Memastikan rute `/` menyajikan `index.html` dari folder `POSLITE`.

### 2. Login & Staf Dinamis
- [x] Mengambil daftar kasir aktif dari endpoint API `/api/auth/staff/1` saat halaman login pertama kali dimuat (menggantikan data `STAFF` hardcoded).
- [x] Mengubah verifikasi PIN di frontend dari pemeriksaan lokal menjadi panggilan API POST `/api/auth/login` dengan mengirim `{ userId, pin }`.

### 3. Manajemen Shift Kasir
- [x] Memeriksa apakah ada shift aktif saat kasir berhasil login dengan memanggil GET `/api/shifts/active/1`.
- [x] Jika tidak ada shift aktif, tampilkan modal pembukaan shift (`ShiftModal`).
- [x] Saat kasir memasukkan uang modal awal dan mengklik "Buka Shift", panggil API POST `/api/shifts` dengan `{ outletId: 1, userId, openingCash }`.
- [x] Implementasikan penutupan shift lewat API PUT `/api/shifts/:id/close` dengan mengirim uang tunai akhir (`closingCash`), lalu tampilkan rekap laporan shift (Z-Report) dari data yang dikembalikan API.

### 4. Menu & Kategori Dinamis
- [x] Mengambil kategori dan item menu yang aktif secara real-time dari database lewat endpoint GET `/api/menu/outlet/1` (menggantikan variabel global `CATS` dan `MENU` hardcoded).
- [x] Memetakan emoji dan ikon SVG dari database ke UI POS secara dinamis.

### 5. Checkout & Submit Transaksi
- [x] Saat kasir menyelesaikan transaksi pembayaran di payment modal, kumpulkan seluruh data cart (item, kuantitas, catatan, modifier yang dipilih, diskon, tipe order, metode pembayaran, nominal bayar, kembalian) dan kirim ke API POST `/api/orders`.
- [x] Pastikan respons sukses dari server mereset cart, memperbarui status shift, dan memicu struk pembayaran (toast/print).

### 6. Riwayat Transaksi per Shift
- [x] Mengambil riwayat transaksi riil untuk shift yang sedang berjalan melalui endpoint GET `/api/orders/shift/:shiftId`.
- [x] Mengintegrasikan tombol Void Order dengan memanggil API PUT `/api/orders/:id/void` dengan verifikasi PIN Manager melalui API POST `/api/auth/verify-manager-pin`.
