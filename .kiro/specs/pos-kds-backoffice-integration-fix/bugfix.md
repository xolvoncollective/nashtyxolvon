# Bugfix Requirements Document

## Introduction

Sistem NASHTY POS terdiri dari 3 aplikasi terintegrasi: POS Terminal (untuk kasir membuat order), KDS/Kitchen Display System (untuk dapur melihat order), dan Backoffice Dashboard (untuk mengelola menu dan melihat laporan). Saat ini, integrasi data antara ketiga sistem tidak berfungsi dengan benar, menyebabkan:

- Order yang dibuat di POS tidak muncul di KDS, sehingga dapur tidak dapat melihat pesanan baru
- Menu yang dibuat atau diubah statusnya (sold out) di Backoffice tidak langsung ter-update di POS
- Activity logs tidak tersimpan dengan benar di database, menghilangkan audit trail
- Data flow antara sistem tidak real-time/near real-time seperti yang diharapkan

Bug ini berdampak serius terhadap operasional restoran karena menghambat komunikasi antar departemen dan menyebabkan pesanan tertunda atau tidak terproses.

## Bug Analysis

### Current Behavior (Defect)

**1. POS to KDS Integration**

1.1 WHEN kasir membuat order di POS Terminal THEN order tersebut tidak muncul di KDS, sehingga dapur tidak dapat melihat pesanan

1.2 WHEN order di POS memiliki status kitchen_status "pending" THEN order tersebut tidak ter-display di KDS dengan status yang benar

**2. Backoffice to POS Integration**

1.3 WHEN admin membuat menu baru di Backoffice THEN menu baru tersebut tidak langsung muncul di POS Terminal tanpa refresh manual atau restart aplikasi

1.4 WHEN admin mengubah status menu menjadi "soldout" di Backoffice THEN perubahan status tidak langsung terlihat di POS Terminal, menyebabkan kasir masih bisa menjual menu yang seharusnya tidak tersedia

1.5 WHEN admin mengubah harga atau detail menu di Backoffice THEN perubahan tidak langsung ter-update di POS Terminal

**3. Activity Logging**

1.6 WHEN order dibuat di POS THEN activity log untuk create order tidak tersimpan di tabel activity_logs

1.7 WHEN menu dibuat atau diubah di Backoffice THEN activity log untuk operasi tersebut tidak tersimpan di tabel activity_logs

1.8 WHEN status menu diubah (active/soldout) di Backoffice THEN activity log untuk perubahan status tidak tersimpan

**4. Data Flow Issues**

1.9 WHEN data berubah di salah satu sistem THEN sistem lain tidak mendapatkan notifikasi atau update secara real-time/near real-time

1.10 WHEN kasir membuat order dengan menu yang baru saja di-mark soldout di Backoffice THEN POS masih mengizinkan order tersebut karena data belum ter-sync

### Expected Behavior (Correct)

**1. POS to KDS Integration**

2.1 WHEN kasir membuat order di POS Terminal THEN sistem SHALL langsung menyimpan order ke database dan order SHALL muncul di KDS dengan status "pending" secara real-time (< 2 detik)

2.2 WHEN order di POS memiliki status kitchen_status "pending" THEN sistem SHALL menampilkan order tersebut di KDS dengan informasi lengkap (order number, items, modifiers, table number, customer name, order type, timestamp)

**2. Backoffice to POS Integration**

2.3 WHEN admin membuat menu baru di Backoffice THEN sistem SHALL menyimpan menu ke database dan menu baru SHALL langsung muncul di POS Terminal tanpa memerlukan refresh manual atau restart aplikasi (real-time/near real-time < 3 detik)

2.4 WHEN admin mengubah status menu menjadi "soldout" di Backoffice THEN sistem SHALL langsung update database dan status "soldout" SHALL terlihat di POS Terminal, mencegah kasir menjual menu tersebut (real-time < 2 detik)

2.5 WHEN admin mengubah harga atau detail menu di Backoffice THEN sistem SHALL langsung update database dan perubahan SHALL terlihat di POS Terminal secara real-time (< 3 detik)

**3. Activity Logging**

2.6 WHEN order dibuat di POS THEN sistem SHALL menyimpan activity log ke tabel activity_logs dengan informasi: tenant_id, user_id, action="create_order", entity_type="order", entity_id=order.id, description, metadata (order details), ip_address, created_at

2.7 WHEN menu dibuat atau diubah di Backoffice THEN sistem SHALL menyimpan activity log ke tabel activity_logs dengan informasi: tenant_id, user_id, action="create_menu"/"update_menu", entity_type="product", entity_id=product.id, description, metadata (changes), ip_address, created_at

2.8 WHEN status menu diubah (active/soldout) di Backoffice THEN sistem SHALL menyimpan activity log dengan action="update_product_status", entity_type="product", entity_id, description="Status changed from X to Y", metadata (old_status, new_status)

**4. Data Flow Implementation**

2.9 WHEN data berubah di salah satu sistem (POS/Backoffice) THEN sistem SHALL menggunakan mekanisme real-time (polling interval < 3 detik atau WebSocket/SSE jika tersedia) untuk men-sync perubahan ke sistem lain

2.10 WHEN kasir membuat order dengan menu yang baru saja di-mark soldout di Backoffice THEN POS SHALL mendeteksi status soldout terbaru dan menolak order dengan error message "Menu tidak tersedia (sold out)"

### Unchanged Behavior (Regression Prevention)

**1. Order Creation Flow**

3.1 WHEN order dibuat di POS dengan menu yang status="active" dan stock tersedia THEN sistem SHALL CONTINUE TO membuat order dengan sukses, menyimpan ke database, dan mengembalikan response dengan order details lengkap

3.2 WHEN order dibuat dengan modifiers yang valid THEN sistem SHALL CONTINUE TO menyimpan order_items dan order_item_modifiers dengan benar sesuai struktur database yang ada

3.3 WHEN order dibuat dengan payment method yang valid THEN sistem SHALL CONTINUE TO menyimpan payment information dengan benar

**2. Menu Management**

3.4 WHEN admin membuat menu dengan data valid (name, price, category, dll) THEN sistem SHALL CONTINUE TO menyimpan menu ke tabel products dengan semua field yang benar

3.5 WHEN admin mengubah detail menu (bukan status) seperti name, description, price THEN sistem SHALL CONTINUE TO update record di database dengan updated_at timestamp

3.6 WHEN admin menghapus atau menonaktifkan kategori THEN sistem SHALL CONTINUE TO menangani cascade/set null sesuai foreign key constraint yang ada

**3. KDS Display Logic**

3.7 WHEN order di KDS memiliki status kitchen_status="preparing" atau "ready" THEN sistem SHALL CONTINUE TO menampilkan order tersebut di KDS dengan status dan timer yang benar

3.8 WHEN kitchen staff mengubah status order dari "pending" ke "preparing" atau "ready" THEN sistem SHALL CONTINUE TO update order.kitchen_status dan order_items.kitchen_status di database

**4. Authentication & Authorization**

3.9 WHEN user login dengan PIN yang valid THEN sistem SHALL CONTINUE TO authenticate user dan mengembalikan user data dengan tenant_id, outlet_id, role

3.10 WHEN user dengan role "cashier" mengakses POS THEN sistem SHALL CONTINUE TO mengizinkan akses sesuai role-based permissions yang ada

3.11 WHEN user dengan role "kitchen" mengakses KDS THEN sistem SHALL CONTINUE TO mengizinkan akses sesuai role-based permissions yang ada

**5. Database Integrity**

3.12 WHEN transaksi database gagal THEN sistem SHALL CONTINUE TO rollback transaction dan tidak meninggalkan data partial/corrupt

3.13 WHEN foreign key constraint dilanggar THEN sistem SHALL CONTINUE TO menolak operasi dan mengembalikan error yang sesuai

**6. Shift Management**

3.14 WHEN kasir memulai shift dengan start_cash THEN sistem SHALL CONTINUE TO membuat record di tabel shifts dengan status="open"

3.15 WHEN kasir mengakhiri shift THEN sistem SHALL CONTINUE TO update shift dengan end_cash, expected_cash, variance, dan status="closed"

**7. Reporting & Dashboard**

3.16 WHEN admin mengakses dashboard KPI THEN sistem SHALL CONTINUE TO menghitung metrics (order_count, total_sales, avg_order_value, growth) dari data orders yang sudah ada

3.17 WHEN admin mengakses reports THEN sistem SHALL CONTINUE TO generate laporan berdasarkan filter date, outlet, order type yang dipilih
