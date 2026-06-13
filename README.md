# NASHTY OS — System README

**Project:** NASHTY OS — Sistem Operasional Restoran Terintegrasi  
**Client:** Nashty Hot Chicken × CafeMargin (PT Xolvon Kehidupan Cerdas Abadi)  
**Version:** 1.0 — Juni 2026  
**Status:** Development Active

---

## DAFTAR ISI

1. [Overview & Architecture](#1-overview--architecture)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Folder & Entry Points](#3-struktur-folder--entry-points)
4. [Cara Menjalankan Lokal](#4-cara-menjalankan-lokal)
5. [Database Schema (SQLite)](#5-database-schema-sqlite)
6. [API Reference Lengkap](#6-api-reference-lengkap)
7. [Payload Detail](#7-payload-detail)
8. [Alur Kerja Per Modul](#8-alur-kerja-per-modul)
9. [Business Logic & Rules](#9-business-logic--rules)
10. [Status & Transisi Order](#10-status--transisi-order)
11. [Alur Shift & Laporan](#11-alur-shift--laporan)
12. [Konfigurasi Outlet (Runtime)](#12-konfigurasi-outlet-runtime)
13. [Kredensial Demo](#13-kredensial-demo)
14. [Edge Cases Kritikal](#14-edge-cases-kritikal)
15. [Scope Boundaries](#15-scope-boundaries)
16. [Insight dari Mockup — Benang Merah & Gap Kritis](#16-insight-dari-mockup--benang-merah--gap-kritis)

---

## 1. Overview & Architecture

NASHTY OS adalah platform manajemen operasional restoran berbasis web. Terdiri dari **empat modul terintegrasi** yang semuanya berbagi satu backend Express.js:

| Modul | URL | Pengguna |
|---|---|---|
| **POS Terminal** | `localhost:5173/pos` atau `localhost:3099/pos/frontend/index.html` | Kasir |
| **Kitchen Display System (KDS)** | `localhost:5173/kds` atau `localhost:3099/kds/frontend/index.html` | Chef / Dapur |
| **Backoffice** | `localhost:5173/backoffice` atau `localhost:3099/backoffice/frontend/index.html` | Manager, Owner |
| **Member Landing Page** | `/member` | Pelanggan (publik, no-login) |

**Alur data:**

```
POS Terminal  ─┐
KDS Display   ─┼──► Express API (Node.js + TypeScript, port 3001) ──► SQLite (nashtypos.db)
Backoffice    ─┘         localhost:3001/api
```

> **Catatan port:** Flowchart resmi menggunakan `localhost:3001/api`. Script cepat lokal (`Cara_Running_di_Local.md`) menggunakan port `3099`. Verifikasi port aktif via `$env:PORT` sebelum dev.

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Vanilla HTML/CSS/JS (mockup siap) → target migrasi React 18 + Vite + TypeScript |
| **State Management** | Zustand (saat React diimplementasikan) |
| **Backend** | Express.js 4 + TypeScript |
| **Database (dev)** | SQLite via `better-sqlite3` (WAL mode) — file: `data/nashtypos.db` |
| **Database (prod target)** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Auth** | bcryptjs (PIN hash) + JWT (siap, belum aktif) |
| **ID Generation** | `nanoid` |
| **Validation** | Zod |
| **Deployment target** | Cloudflare Workers (backend) + Cloudflare Pages (frontend) |

---

## 3. Struktur Folder & Entry Points

```
project-root/
├── backoffice/
│   └── backend/                  ← BACKEND UTAMA (Express API + serve static)
│       ├── src/
│       │   ├── index.ts           ← Server entry point
│       │   ├── db/
│       │   │   ├── database.ts    ← Koneksi SQLite
│       │   │   ├── schema.sql     ← Definisi tabel
│       │   │   └── seed.ts        ← Data demo awal
│       │   └── routes/
│       │       ├── auth.ts
│       │       ├── categories.ts  ← (legacy; lihat /api/menu)
│       │       ├── products.ts    ← (legacy; lihat /api/menu)
│       │       ├── orders.ts
│       │       ├── shifts.ts
│       │       └── dashboard.ts
│       ├── data/
│       │   └── nashtypos.db       ← File database SQLite (auto-created)
│       └── package.json
├── pos/
│   └── frontend/
│       └── index.html             ← POS UI (di-serve oleh backend)
├── kds/
│   └── frontend/
│       └── index.html             ← KDS UI (di-serve oleh backend)
└── POSLITE/                       ← Folder mockup standalone (untuk dev/testing)
    ├── NASHTY_POS_Mockup.html
    ├── NASHTY_KDS_Mockup.html
    ├── NASHTY_Backoffice_Mockup_8.html
    └── api-client.js
```

> **Penting:** Backend Express sudah dikonfigurasi untuk menyajikan folder frontend sebagai static files. Tidak perlu server frontend terpisah.

---

## 4. Cara Menjalankan Lokal

### Script Cepat (PowerShell — jalankan dari folder root project):

```powershell
$port=3099; $p=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; if ($p) { Stop-Process -Id $p.OwningProcess -Force }; cd backoffice\backend; npm install; $env:PORT=$port; npm run dev
```

### Manual:

```bash
cd backoffice/backend
npm install
npm run db:seed   # Buat database + data demo (hanya pertama kali)
npm run dev       # Jalankan server (tsx watch, auto-reload)
```

### Verifikasi server aktif:

```bash
curl http://localhost:3099/api/health
# atau port 3001 sesuai konfigurasi
```

### URL Akses:

| Modul | URL |
|---|---|
| POS | `http://localhost:3099/pos/frontend/index.html` |
| KDS | `http://localhost:3099/kds/frontend/index.html` |
| Backoffice | `http://localhost:3099/backoffice/frontend/index.html` |

> **Printer:** Gunakan **Chrome atau Edge** (Chromium-based) karena printer struk memanfaatkan WebUSB API.

---

## 5. Database Schema (SQLite)

### Tabel & Kolom Utama

**`outlets`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT (UUID) | PK |
| `name` | TEXT NOT NULL | — |
| `address` | TEXT | — |
| `phone` | TEXT | — |
| `tax_rate` | REAL | default 0 |
| `tax_enabled` | INTEGER | 0/1 |
| `is_active` | INTEGER | 0/1 |
| `created_at` | TEXT | datetime |

**`users`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT (UUID) | PK |
| `outlet_id` | TEXT | FK → outlets |
| `name` | TEXT NOT NULL | — |
| `role` | TEXT | `owner` / `manager` / `kasir` / `chef` |
| `pin_hash` | TEXT | bcryptjs hash |
| `is_active` | INTEGER | 0/1 |
| `created_at` | TEXT | datetime |

**`shifts`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT (UUID) | PK |
| `outlet_id` | TEXT | FK → outlets |
| `user_id` | TEXT | FK → users |
| `started_at` | TEXT | datetime |
| `ended_at` | TEXT | nullable |
| `opening_cash` | REAL | default 0 |
| `closing_cash` | REAL | nullable |
| `status` | TEXT | `open` / `closed` |

**`menu_categories`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT (UUID) | PK |
| `outlet_id` | TEXT | FK → outlets |
| `station_id` | TEXT | FK → stations |
| `name` | TEXT NOT NULL | — |
| `emoji` | TEXT | — |
| `order_index` | INTEGER | urutan tampil |
| `is_active` | INTEGER | 0/1 |

**`menu_items`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT (UUID) | PK |
| `outlet_id` | TEXT | FK → outlets |
| `category_id` | TEXT | FK → menu_categories |
| `station_id` | TEXT | FK → stations |
| `name` | TEXT NOT NULL | — |
| `price` | REAL NOT NULL | — |
| `emoji` | TEXT | — |
| `photo_url` | TEXT | — |
| `is_active` | INTEGER | 0/1 |

**`orders`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT (UUID) | PK |
| `outlet_id` | TEXT | FK → outlets |
| `order_number` | TEXT UNIQUE | Format: `SNY-XXXX` (per outlet per hari, server-side) |
| `type` | TEXT | `dine_in` / `take_away` / `gofood` / `grabfood` / `shopee` |
| `table_number` | TEXT | nullable |
| `status` | TEXT | lihat [Status & Transisi](#10-status--transisi-order) |
| `user_id` | TEXT | FK → users (kasir) |
| `shift_id` | TEXT | FK → shifts |
| `subtotal` | REAL | — |
| `discount` | REAL | — |
| `tax` | REAL | — |
| `service_charge` | REAL | — |
| `total` | REAL | — |
| `void_reason` | TEXT | nullable |
| `void_by` | TEXT | nullable (user_id yang void) |
| `created_at` | TEXT | datetime |

**`order_items`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT (UUID) | PK |
| `order_id` | TEXT | FK → orders |
| `menu_item_id` | TEXT | FK → menu_items |
| `name` | TEXT | snapshot nama saat order |
| `price` | REAL | snapshot harga saat order |
| `quantity` | INTEGER NOT NULL | — |
| `item_status` | TEXT | `pending` / `ready` / `completed` |
| `station_id` | TEXT | FK → stations |
| `notes` | TEXT | nullable |

**`payments`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT (UUID) | PK |
| `order_id` | TEXT | FK → orders |
| `method` | TEXT | `tunai` / `qris` / `transfer` / `bca` / `debit` / `gofood` / `grabfood` / `shopee` |
| `amount` | REAL NOT NULL | — |
| `change_amount` | REAL | default 0 |
| `platform_ref` | TEXT | nullable (nomor order delivery) |
| `created_at` | TEXT | datetime |

**`modifier_groups`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT (UUID) | PK |
| `outlet_id` | TEXT | FK → outlets |
| `name` | TEXT | contoh: "Level Pedas" |
| `is_required` | INTEGER | 0/1 |
| `min_select` | INTEGER | — |
| `max_select` | INTEGER | — |

### Relasi Ringkas

- `outlets` → `users` (1:N via `users.outlet_id`)
- `outlets` → `shifts` (1:N via `shifts.outlet_id`)
- `shifts` → `orders` (1:N via `orders.shift_id`)
- `orders` → `order_items` (1:N via `order_items.order_id`)
- `orders` → `payments` (1:N, mendukung split payment)
- `order_items` → `order_item_modifiers` (1:N, bridge table)
- `menu_categories` → `menu_items` (1:N via `menu_items.category_id`)

---

## 6. API Reference Lengkap

**Base URL:** `http://localhost:3001/api` (atau port aktif sesuai `$env:PORT`)

### 🔐 AUTH — `/api/auth`

| Method | Endpoint | Digunakan oleh | Deskripsi |
|---|---|---|---|
| `GET` | `/api/auth/staff/:outletId` | POS | List kasir aktif untuk login screen |
| `POST` | `/api/auth/login` | POS | Verifikasi PIN kasir via bcryptjs |
| `POST` | `/api/auth/verify-manager-pin` | POS | Verifikasi PIN Manager untuk void/diskon besar |
| `GET` | `/api/auth/outlets` | Backoffice | List semua outlet aktif |

### 🍔 MENU — `/api/menu`

| Method | Endpoint | Digunakan oleh | Deskripsi |
|---|---|---|---|
| `GET` | `/api/menu/outlet/:outletId` | POS, Backoffice | Semua kategori + item + modifier groups per outlet dalam satu call |

> **Catatan:** Endpoint `/api/categories` dan `/api/products` dari dokumentasi lama masih ada tapi endpoint baru yang canonical adalah `/api/menu/outlet/:outletId`.

### 🧾 ORDERS — `/api/orders`

| Method | Endpoint | Digunakan oleh | Deskripsi |
|---|---|---|---|
| `POST` | `/api/orders` | POS | Buat order baru (transaksi atomik: orders + order_items + payments) |
| `GET` | `/api/orders` | KDS, Backoffice | List order dengan filter `outletId` + `kitchenStatus` |
| `GET` | `/api/orders/shift/:shiftId` | POS | Riwayat order per shift (untuk laporan dan void) |
| `GET` | `/api/orders/config/:outletId` | POS | Konfigurasi POS: service charge, metode pembayaran aktif, dll |
| `PATCH` | `/api/orders/:id/status` | KDS | Update status order atau status per item |
| `PUT` | `/api/orders/:id/void` | POS | Void order (memerlukan PIN Manager yang sudah diverifikasi) |

### ⏱️ SHIFTS — `/api/shifts`

| Method | Endpoint | Digunakan oleh | Deskripsi |
|---|---|---|---|
| `GET` | `/api/shifts/active/:outletId` | POS | Cek apakah ada shift aktif (dipanggil setelah login) |
| `POST` | `/api/shifts` | POS | Buka shift baru |
| `PUT` | `/api/shifts/:id/close` | POS | Tutup shift + generate summary |
| `GET` | `/api/shifts/:id/summary` | POS | Rekap lengkap shift: gross sales, void, breakdown per metode bayar |

### 📊 DASHBOARD — `/api/dashboard`

| Method | Endpoint | Digunakan oleh | Deskripsi |
|---|---|---|---|
| `GET` | `/api/dashboard/kpi` | Backoffice | KPI harian: revenue, transaksi, AOV, void, diskon, breakdown metode bayar |
| `GET` | `/api/dashboard/recent-orders` | Backoffice | N transaksi terbaru dengan nama kasir |

---

## 7. Payload Detail

### `POST /api/orders` — Request Body

```json
{
  "outletId": "uuid-outlet",
  "userId": "uuid-kasir",
  "shiftId": "uuid-shift",
  "orderType": "dine_in",
  "tableNumber": "T03",
  "items": [
    {
      "menuItemId": "uuid-item",
      "name": "Ayam Bakar Madu",
      "price": 55000,
      "quantity": 2,
      "notes": "Pedas extra",
      "modifiers": [
        {
          "optionId": "uuid-opt",
          "name": "Pedas Sedang",
          "price_adjustment": 0
        }
      ]
    }
  ],
  "payments": [
    {
      "method": "tunai",
      "amount": 130000,
      "change": 10000
    }
  ],
  "discountType": "nominal",
  "discountValue": 10000,
  "notes": "Meja pojok"
}
```

**Response sukses:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-order",
    "order_number": "SNY-0601-001",
    "status": "pending",
    "total": 120000,
    "items": []
  }
}
```

### `POST /api/auth/login` — Request Body

```json
{ "userId": "uuid-user", "pin": "1234" }
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "uuid-user",
    "name": "Citra Dewi",
    "role": "kasir",
    "outletId": "uuid-outlet",
    "outletName": "Galaxy Mall"
  }
}
```

### `POST /api/shifts` — Request Body

```json
{ "outletId": "uuid-outlet", "userId": "uuid-user", "openingCash": 500000 }
```

### `PUT /api/shifts/:id/close` — Request Body

```json
{ "closingCash": 1200000 }
```

### `PATCH /api/orders/:id/status` — Request Body

Update order keseluruhan:
```json
{ "status": "completed" }
```

Update per item (KDS):
```json
{ "itemId": "uuid-item", "itemStatus": "ready" }
```

### `PUT /api/orders/:id/void` — Request Body

```json
{ "reason": "Salah order", "voidBy": "uuid-manager" }
```

### `GET /api/dashboard/kpi` — Query Params

```
?outletId=uuid-outlet&date=2026-06-13
```

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2026-06-13",
    "totalOrders": 187,
    "grossRevenue": 4280000,
    "netRevenue": 4150000,
    "totalDiscounts": 130000,
    "averageOrderValue": 22888,
    "paymentMethods": [
      { "method": "tunai", "total_amount": 1240000 },
      { "method": "qris", "total_amount": 980000 }
    ]
  }
}
```

### `GET /api/menu/outlet/:outletId` — Response

```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": "uuid", "name": "Makanan", "emoji": "🍔" }
    ],
    "items": [
      {
        "id": "uuid-item",
        "name": "Ayam Bakar Madu",
        "price": 55000,
        "category_id": "uuid-cat",
        "modifier_groups": [
          {
            "id": "uuid-grp",
            "name": "Level Pedas",
            "is_required": true,
            "options": [
              { "name": "Original", "price_adjustment": 0 },
              { "name": "Pedas Extra", "price_adjustment": 2000 }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 8. Alur Kerja Per Modul

### 8.1 Modul POS — Alur Lengkap

```
Buka /pos
  └→ GET /api/auth/staff/:outletId   (load kartu staf)
       └→ Kasir klik kartu → input PIN
            └→ POST /api/auth/login
                 ├─ [GAGAL] Pesan error; lockout 5 menit setelah 3 kali gagal
                 └─ [SUKSES] Simpan session (userId, role, outletId)
                      └→ GET /api/shifts/active/:outletId
                           ├─ [Ada shift] Lanjut ke POS
                           └─ [Tidak ada] Tampil modal buka shift
                                └→ POST /api/shifts { openingCash }
                                     └→ GET /api/menu/outlet/:outletId (load menu)
                                          └→ [POS Aktif]

[POS Aktif]
  └→ Pilih tipe order (dine_in / take_away / gofood / grabfood / shopee)
       └→ Input nomor meja (wajib jika dine_in)
            └→ Pilih item dari grid → jika has_modifiers → Modal Modifier
                 └→ [required modifier belum dipilih] → tombol "Tambah" disabled
                 └→ [semua required terpenuhi] → Tambah ke cart
                      └→ [Opsional] Lookup member by nomor telepon
                      └→ [Opsional] Input diskon
                           └→ [Melebihi batas config] → POST /api/auth/verify-manager-pin
                      └→ Kalkulasi running total (lihat formula di Business Logic)
                           └→ Tap "Bayar" → Payment Modal
                                └→ [Tunai] Input nominal → hitung kembalian otomatis
                                └→ [Non-tunai] Konfirmasi manual
                                └→ [Delivery] Wajib input nomor order platform
                                └→ [Split] Tambah metode sampai total ≥ order total
                                     └→ POST /api/orders
                                          └→ [SUKSES] Struk cetak; KDS notif; clear cart
                                          └→ [GAGAL] Pesan error; tidak ada order terbuat
```

### 8.2 Modul KDS — Alur Polling

```
KDS Aktif
  └→ Polling GET /api/orders?outletId=X&kitchenStatus=pending  (setiap 5 detik)
       └→ Render order cards
            Auto-sort: Urgent (>20 mnt) → Warning (10–20 mnt) → Fresh (<10 mnt)
            └→ Timer live per detik per card
                 └→ [Chef selesai] Swipe ke kanan ≥90% lebar track
                      └→ PATCH /api/orders/:id/status { status: "completed" }
                           └→ Overlay muncul di POS (notifikasi ke kasir)
                                └→ [Kasir konfirmasi overlay] → Order diarsipkan
                                └→ [Kasir tidak konfirmasi] → Order tetap di status "ready"
```

### 8.3 Modul Backoffice — Dashboard Load

```
Buka /backoffice
  └→ Login email + password (Supabase Auth)
       └→ Pilih outlet dari OutletSwitcher
            └→ GET /api/dashboard/kpi?outletId=X&date=YYYY-MM-DD
            └→ GET /api/dashboard/recent-orders?outletId=X&limit=10
                 └→ Render KPI cards + tabel transaksi terbaru
```

---

## 9. Business Logic & Rules

### Kalkulasi Harga (Wajib Konsisten di Frontend & Backend)

```javascript
function calcTotal(cart, discount, outletConfig) {
  // 1. Subtotal: sum semua (harga_item × qty)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // 2. Diskon: tidak boleh melebihi subtotal
  const disc = Math.min(discount, subtotal);

  // 3. Base setelah diskon
  const base = subtotal - disc;

  // 4. Pajak (rate dari outlet config, default 11%)
  const tax = outletConfig.tax_enabled ? Math.round(base * outletConfig.tax_rate) : 0;

  // 5. Service charge (rate dari outlet config, default 5%)
  const sc = outletConfig.sc_enabled ? Math.round(base * outletConfig.sc_rate) : 0;

  // 6. Grand total
  const total = base + tax + sc;

  return { subtotal, disc, base, tax, sc, total };
}
```

**Test cases wajib validasi:**
- `sub=100000, disc=0` → `tax=11000, sc=5000, total=116000`
- `sub=100000, disc=10000` → `base=90000, tax=9900, sc=4500, total=104400`
- `sub=132000 (55000×2 + 22000×1), disc=0` → `tax=14520, sc=6600, total=153120`

### Kalkulasi Poin Loyalitas

```
Rp 100.000 pertama = 6 poin
Setiap tambahan Rp 50.000 = +3 poin
Poin hangus jika tidak digunakan dalam 1 tahun sejak diperoleh
Penukaran reward: saldo_poin ≥ poin_required
```

### Void Order

- Memerlukan `POST /api/auth/verify-manager-pin` terlebih dahulu
- Hanya role `manager` atau `owner` yang PIN-nya diterima
- `reason` wajib diisi, tidak boleh kosong
- Void tercatat di laporan shift dengan `void_by` (user_id manager) dan `void_reason`
- Order berstatus `voided` di-exclude dari `total_orders` laporan, tapi masuk `void_count`

### Diskon dengan Batas Konfigurasi

- Jika nilai diskon > batas yang diset di outlet config → wajib konfirmasi PIN Manager
- Diskon tidak boleh melebihi subtotal (dibatasi hard di frontend dan backend)

### Nomor Order

- Format: `SNY-XXXX` (sequence per outlet per hari)
- Di-generate server-side oleh Express.js
- Unik dalam satu hari operasional; tidak boleh ada duplikat

### Metode Pembayaran Aktif

- Ditentukan dari konfigurasi outlet di Backoffice
- `GET /api/orders/config/:outletId` mengembalikan metode yang aktif
- POS hanya menampilkan metode yang aktif

---

## 10. Status & Transisi Order

### Status Order Utama

```
pending  →  preparing  →  ready  →  completed
                                         ↓
                                      voided (butuh PIN Manager)
                                      cancelled (sebelum diproses)
```

| Status | Deskripsi | Siapa yang trigger |
|---|---|---|
| `pending` | Baru dibuat dari POS | Otomatis saat `POST /api/orders` |
| `preparing` | KDS: sedang dimasak | Chef via KDS |
| `ready` | Siap diambil/disajikan | Otomatis saat semua order_items = `ready` |
| `completed` | Diserahkan ke pelanggan | Kasir konfirmasi overlay di POS |
| `voided` | Dibatalkan + PIN Manager | Manager/Owner via POS |
| `cancelled` | Dibatalkan sebelum diproses | — |

### Status Per Item (`order_items.item_status`)

```
pending  →  ready  →  completed
```

> **Logika auto-update:** Saat **semua** `order_items` berubah ke `ready` atau `completed`, status `orders` utama **otomatis** diperbarui ke `ready`.

### Status Kitchen (untuk filter KDS)

Query parameter `kitchenStatus` yang dipakai KDS:
- `pending` — belum diproses dapur
- `preparing` — sedang dimasak  
- `ready` — siap, menunggu konfirmasi kasir

---

## 11. Alur Shift & Laporan

```
Kasir Login
  └→ GET /api/shifts/active/:outletId
       ├─ [Shift aktif ditemukan] → Lanjut transaksi langsung
       └─ [Tidak ada shift] → Modal buka shift
            └→ POST /api/shifts { outletId, userId, openingCash }
                 └→ [Shift open] → Transaksi bisa berjalan

Akhir Hari / Tutup Shift
  └→ Kasir klik "Tutup Shift"
       └→ PUT /api/shifts/:id/close { closingCash }
            └→ GET /api/shifts/:id/summary
                 └→ Tampil Laporan Z-Report
```

### Data yang Dihitung di Summary Shift

| Metrik | Keterangan |
|---|---|
| `total_orders` | Jumlah order (exclude `voided`) |
| `gross_sales` | Total subtotal sebelum diskon |
| `total_discount` | Total diskon yang diberikan |
| `total_sc` | Total service charge |
| `net_sales` | Pendapatan bersih akhir |
| `void_count` | Jumlah transaksi void |
| `opening_cash` | Modal kasir awal shift |
| `closing_cash` | Uang tunai saat tutup shift |
| Per metode bayar | `SUM(payments WHERE method='X')` untuk semua 8 metode |

### Metode Pembayaran yang Dilacak:
`tunai` · `qris` · `transfer` · `bca` · `debit` · `gofood` · `grabfood` · `shopee`

---

## 12. Konfigurasi Outlet (Runtime)

Konfigurasi berikut dapat diubah dari Backoffice dan **terefleksi ke POS/KDS dalam < 30 detik**:

| Konfigurasi | Default | Modul yang terpengaruh |
|---|---|---|
| Pajak (%) | 11% | POS |
| Tax enabled | true | POS |
| Service charge (%) | 5% | POS |
| SC enabled | true | POS |
| Metode bayar aktif | Semua | POS |
| Batas max diskon kasir | — | POS |
| Durasi auto-logout | — | POS |
| Production time per kategori | — | KDS (timer threshold) |
| Threshold warning KDS | 10 menit | KDS |
| Threshold overdue KDS | 20 menit | KDS |
| Audio alert | on | KDS |
| Compact mode threshold | 12 order | KDS |
| Default display mode | dark | KDS |

---

## 13. Kredensial Demo

Setelah `npm run db:seed`:

| PIN | Nama | Role |
|---|---|---|
| `0000` | Admin Demo | owner |
| `1234` | Citra Dewi | kasir |
| `2345` | Budi Santoso | kasir |
| `3456` | Ani Kitchen | chef |

**Tenant:** `demo-tenant`  
**Outlet:** `demo-outlet` — Galaxy Mall

---

## 14. Edge Cases Kritikal

### POS
- **Item dihapus saat ada di cart aktif:** Tampilkan notifikasi kuning `"Item [nama] tidak lagi tersedia, harap hapus dari cart"`. Jangan corrupt cart.
- **Shift belum ditutup saat hari berganti:** Pertahankan shift aktif. Owner/manager harus tutup manual.
- **Koneksi putus saat konfirmasi pembayaran:** Cek apakah order sudah tersimpan di server sebelum masuk offline queue. Jangan duplikat order.
- **Dua kasir buat order bersamaan:** Nomor order harus tetap unik (server-side sequence, bukan client).
- **Diskon melebihi subtotal:** Hard cap: `disc = Math.min(discount, subtotal)`.

### KDS
- **Koneksi terputus:** Banner offline muncul; timer tetap berjalan dari data terakhir. Jangan stop timer.
- **Chef swipe tapi kasir tidak konfirmasi overlay:** Order tetap di status `ready` sampai dikonfirmasi. **Tidak ada auto-archive.**
- **Antrean melebihi threshold:** Compact mode aktif otomatis.

### Backoffice
- **Owner hapus menu item yang ada di cart POS:** Item di cart tidak berubah. POS notif saat kasir buka cart berikutnya.
- **Import Excel duplikat nomor telepon:** Tampilkan daftar duplikat dan minta keputusan user (skip/overwrite). Jangan auto-overwrite.

---

## 15. Scope Boundaries

### In Scope (yang dibangun)
- POS Terminal (transaksi, modifier, diskon, split payment, void, shift, offline mode)
- KDS (realtime polling, urgency timer, swipe complete, audio alert)
- Backoffice (dashboard KPI, menu management, laporan, konfigurasi, tim)
- CRM integrasi NashtyPeople (poin, reward, segmen, member landing page `/member`)

### Out of Scope (tidak dibangun dalam proyek ini)
- Desain UI/UX baru (mockup sudah tersedia sebagai acuan)
- Hardware: tablet, thermal printer, monitor KDS
- Domain dan hosting (dikelola klien)
- Payment gateway pihak ketiga di luar 8 metode yang sudah didefinisikan
- Training dan onboarding staf Nashty
- Pembuatan akun Supabase / Cloudflare atas nama klien
- Fitur broadcast/blast via push notification atau email
- Laporan keuangan level akuntansi (laba rugi, neraca)

### Hak Akses Ringkas

| Fitur | Kasir | Manager | Owner |
|---|---|---|---|
| POS — Transaksi | ✅ | ✅ | ✅ |
| POS — Void (eksekusi) | ❌ | ✅ konfirmasi | ✅ konfirmasi |
| POS — Laporan Shift | ✅ | ✅ | ✅ |
| KDS | ✅ | ✅ | ✅ |
| Backoffice — Dashboard & Laporan | ❌ | ✅ | ✅ |
| Backoffice — Menu Management | ❌ | ✅ | ✅ |
| Backoffice — CRUD Kasir/Manager | ❌ | ✅ | ✅ |
| Backoffice — CRUD Owner | ❌ | ❌ | ✅ |
| Backoffice — Konfigurasi Outlet | ❌ | ✅ | ✅ |
| CRM — NashtyPeople | ❌ | ✅ | ✅ |

> **Rule multi-outlet:** Kasir hanya dapat login di outlet yang di-assign. Cross-outlet access diblokir.

---

*Single source of truth untuk NASHTY OS — POS · KDS · Backoffice*  
*v1.0 — Juni 2026 — CafeMargin × PT Xolvon Kehidupan Cerdas Abadi*

---

## 16. Insight dari Mockup — Benang Merah & Gap Kritis

> Bagian ini ditulis berdasarkan pembacaan langsung terhadap source code ketiga file mockup (POS, KDS, Backoffice). Berisi perilaku aktual yang diimplementasikan di mockup dan perbedaannya dengan dokumentasi — termasuk hal-hal yang harus diputuskan atau diperjelas sebelum integrasi penuh.

---

### 16.1 Benang Merah Sistem: Pola Desain yang Konsisten

**1. Dua Layer Modifier yang Berbeda — Opts vs Addons**

Mockup POS memisahkan modifier menjadi dua lapisan berbeda di UI, dan keduanya harus direpresentasikan secara berbeda di database dan payload:

- **`opts`** (Opsi / Modifier Groups): pilihan atribut item, bisa `single` (radio) atau `multi` (checkbox). Tidak mengubah harga base item. Contoh: `Level Pedas`, `Suhu Minuman`, `Bumbu Sate`.
- **`addons`** (Variasi Add-on): item tambahan berbayar yang meng-*augment* harga base item. Harganya dijumlahkan ke `item.p` sebelum masuk cart. Contoh: `Extra Sambal +Rp3.000`, `Oat Milk Upgrade +Rp5.000`.

Implikasi penting:
```javascript
// Saat addons dipilih, harga item di cart BUKAN lagi harga base
finalPrice = menu.basePrice + sum(selectedAddons.price)

// Item masuk cart dengan cartKey unik per kombinasi modifier+addon
cartKey = menuId + '_' + Date.now()  // satu baris cart baru per konfigurasi
```

Ini berbeda dari item tanpa modifier yang menggunakan `cartKey = String(menuId)` dan di-*merge* (qty diincrement). **Item dengan modifier/addon selalu menjadi baris cart tersendiri.** Backend harus mengikuti pola ini.

**2. Delivery Methods Dikunci dari Numpad Kasir**

Di POS mockup, saat metode bayar adalah `gofood`, `grabfood`, atau `shopee`:
- Numpad cash **di-lock** (opacity 0.15, pointer-events none)
- Input nominal tidak diperlukan
- Field tambahan `delivery-note` muncul (untuk PIN driver/catatan loker)
- Konfirmasi bisa langsung tanpa input nominal

Ini berarti validasi `uang_diterima ≥ total` **hanya berlaku untuk metode `tunai`**. Non-delivery non-cash (QRIS, Transfer, BCA, Debit) langsung enable konfirmasi tanpa numpad.

**3. Siklus KDS: `active` → `done` → `confirmed` (3 State, Bukan 2)**

Di mockup KDS, status internal order lebih granular dari yang ada di API docs:

```
active  →  done (chef swipe)  →  confirmed (kasir konfirmasi overlay)
```

State `done` adalah *intermediate state* — order hilang dari queue KDS tapi **belum diarsipkan** sampai kasir konfirmasi overlay di POS. Overlay di POS **tidak bisa ditutup tanpa konfirmasi** (click-outside diblokir). Ini adalah handshake dua pihak.

Di database, ini bisa direpresentasikan sebagai:
- `status = 'ready'` → chef sudah swipe, menunggu kasir
- `status = 'completed'` → kasir sudah konfirmasi

**4. Void PIN di Mockup Masih Hardcoded**

Di mockup POS, void menggunakan `const VOID_PIN = '1234'` yang hardcoded. Di produksi, ini harus diganti dengan `POST /api/auth/verify-manager-pin` yang check role `manager` atau `owner` dari database. **PIN void tidak boleh sama dengan PIN kasir biasa** — harus ada role check di backend.

**5. Member di POS: Lookup by Nomor Telepon, Bukan ID**

Mockup menyimpan member dalam object `MEMBERS` dengan key berupa nomor telepon (tanpa format, contoh `'08123456789'`). Lookup dilakukan client-side dengan exact string match. Di produksi:
- Search harus toleran terhadap format (`0812-3456-789` vs `08123456789`)
- Member data dari NashtyPeople CRM, bukan dari database POS lokal
- Segmentasi member: `vip`, `loyal`, `regular`, `new` (ada di mockup, harus konsisten dengan tier dinamis di CRM)

**6. Favorit Item Tersimpan di Memory Saja (Belum Persisten)**

Di mockup POS, `favorites` adalah `new Set()` yang hanya hidup selama session browser. Untuk produksi, favorit per kasir (atau per outlet) harus disimpan ke database — bisa di tabel `users` atau `outlet_config`.

**7. Kategori `Favorit` Sebagai Tab Dinamis**

Tab "Favorit" di category strip bukan kategori dari database — ini adalah filter client-side dari item yang di-star oleh kasir aktif. Bedakan ini dari `menu_categories` di database. Saat migrasi ke React, tab ini harus tetap ada tapi datanya dari `favorites` state/localStorage/server, **bukan** dari `GET /api/menu/outlet/:outletId`.

---

### 16.2 Gap: Yang Ada di Mockup tapi BELUM Ada di API/Schema

| # | Yang ada di mockup | Status di API | Yang perlu dibuat |
|---|---|---|---|
| 1 | `addon` sebagai layer harga tambahan di item (terpisah dari modifier group) | ⚠️ Belum eksplisit | Kolom atau relasi `item_addons` di `order_items`, atau representasi di JSON modifier |
| 2 | `cartKey` unik per kombinasi modifier/addon | ⚠️ Tidak ada di schema | Logic di backend: satu order_item baru per kombinasi, bukan merge |
| 3 | Void PIN hardcoded `'1234'` | ❌ Harus role-based | `POST /api/auth/verify-manager-pin` wajib check role, bukan PIN statis |
| 4 | Delivery method: field `delivNote` (catatan driver) | ⚠️ Tidak ada di schema | Kolom `platform_note` atau `delivery_note` di tabel `orders` |
| 5 | Item `sold: true` (status habis instan) | ⚠️ Di schema ada `is_active` | Butuh status `is_sold_out` yang berbeda dari `is_active` — sold out = sementara, inactive = permanen |
| 6 | Favorit item per kasir | ❌ Tidak ada | Tabel atau kolom `favorites` di `users` atau `outlet_config` |
| 7 | Segmen member: `vip`, `loyal`, `regular`, `new` | ⚠️ Di CRM ada tier dinamis | Harus konsisten antara hardcode di POS mockup dan tier dinamis CRM — jangan sampai ada mismatch label |
| 8 | History `voided` dengan `voidBy` dan `voidReason` | ✅ Ada di schema | Pastikan query laporan exclude voided dari `total_orders` tapi include di `void_count` |
| 9 | KDS: `status = 'done'` (intermediate, belum confirmed) | ⚠️ Tidak ada di API docs | Perlu state `ready` (chef done) vs `completed` (kasir confirm) — sudah ada di schema tapi tidak dieksplisitkan di API endpoint |
| 10 | Split payment: multiple payments per order | ✅ Ada di schema `payments` | Payload `POST /api/orders` sudah support array `payments[]` |
| 11 | Compact mode KDS aktif otomatis saat ≥12 order | ⚠️ Dikonfigurasi via `CFG.compactThreshold` | Di produksi, nilai ini harus diambil dari `GET /api/orders/config/:outletId` |
| 12 | Auto-logout timer (idle detection) | ❌ Tidak ada di mockup, ada di docs | Belum diimplementasikan di mockup — perlu `setInterval` + event listener untuk reset timer |
| 13 | Lockout setelah 3 gagal PIN (5 menit) | ❌ Mockup tidak ada lockout | Harus diimplementasikan di backend — track `failed_attempts` per `userId` |
| 14 | Nomor order format `SNY-XXXX` diincrement dari `HISTORY.length` | ⚠️ Client-side di mockup | Di produksi WAJIB server-side sequence; jangan generate di client |
| 15 | Refund (berbeda dari Void) | ⚠️ Di logs ada `refund` | Mockup menyebut `REFUNDS = []` tapi tidak diimplementasikan — perlu klarifikasi apakah refund adalah fitur terpisah |

---

### 16.3 Gap: Yang Ada di Dokumentasi tapi TIDAK ADA di Mockup

| # | Yang ada di docs | Status di mockup | Implikasi |
|---|---|---|---|
| 1 | Mode offline + sync queue | ❌ Tidak ada di mockup | Perlu IndexedDB atau localStorage untuk antrian offline — scope tambahan yang tidak trivial |
| 2 | Cetak struk via Bluetooth (WebUSB/ESC-POS) | ❌ Mockup hanya console.log | Integration Bluetooth printer perlu testing device fisik — jangan block release karena ini |
| 3 | PIN lockout setelah 3 kali gagal | ❌ Tidak ada | Backend harus implement, frontend harus show countdown timer |
| 4 | CRM / Member Landing Page (`/member`) | ❌ Tidak ada mockup | Modul CRM tidak punya mockup yang diupload — harus didesain dari nol |
| 5 | KDS: audio alert (Web Audio API) | ✅ Ada di mockup KDS (`CFG.soundEnabled`) | Tapi belum ada `playSound()` implementation — perlu difinalize |
| 6 | Multiple outlet di POS | ❌ Mockup hanya single outlet | OutletSwitcher ada di Backoffice tapi POS belum ada outlet selector |
| 7 | Inventori / stok bahan baku | ❌ Tidak ada | Disebutkan di docs tapi tidak ada mockup — klarifikasi apakah ini di-scope |
| 8 | Export laporan ke CSV/PDF dari POS | ⚠️ UI ada di mockup (tab Laporan) tapi logic-nya placeholder | Perlu implementasi generate PDF client-side atau server-side |

---

### 16.4 Keputusan Desain yang Perlu Dikonfirmasi Sebelum Build

Ini adalah ambiguitas yang ditemukan saat membaca mockup vs dokumentasi — **harus dijawab sebelum backend/frontend dibangun**:

**A. Bagaimana `addon` direpresentasikan di `order_items`?**

Pilihan 1: Addon masuk sebagai modifier biasa dalam JSON `modifiers[]` di `order_items`.
Pilihan 2: Addon harus punya kolom/relasi terpisah karena mempengaruhi harga.

Saat ini mockup me-*merge* harga addon ke `item.p` sebelum masuk cart. Artinya di database, `order_items.price` sudah mencakup addon. Tapi modifier `Level Pedas` (tanpa harga) juga tersimpan terpisah. **Pilihan 1 lebih sederhana tapi kehilangan breakdown.** Putuskan dan dokumentasikan.

**B. Apakah `sold_out` berbeda dari `is_active`?**

Di mockup ada `sold: true` yang menampilkan overlay "Habis" tapi item masih ada. Di schema hanya ada `is_active`. Jika staf perlu toggle "habis sementara" dari POS tanpa akses Backoffice, butuh field `is_sold_out` terpisah.

**C. Siapa yang bisa toggle `sold_out` item?**

Hanya manager via Backoffice? Atau kasir bisa langsung dari POS? Ini menentukan apakah perlu endpoint `PATCH /api/products/:id/sold-out` yang bisa dipanggil dari POS.

**D. Nomor urut order: reset per hari atau kumulatif?**

Mockup mengincrement dari `HISTORY.length + 186` (contoh: `SNY-0187`). Ini kumulatif. Tapi docs menyebut "unik dalam satu hari operasional". Putuskan: apakah `SNY-0001` reset setiap hari, atau terus naik selamanya? Keduanya valid tapi harus konsisten.

**E. Refund vs Void — apakah ini dua hal berbeda?**

Di Activity Log mockup Backoffice ada entri `"Refund diproses"` dengan nominal berbeda dari Void. Di POS mockup ada `REFUNDS = []` yang kosong. Apakah refund = partial cancellation (kembalikan sebagian uang) sedangkan void = full cancellation? Atau ini sinonim? Harus diklarifikasi sebelum schema payments difinalisasi.

---

### 16.5 Data Demo: Angka Riil dari Mockup

Gunakan angka ini sebagai ground truth saat unit testing kalkulasi:

**Transaksi HISTORY dari POS mockup:**

| No Order | Subtotal | Diskon | Tax (11%) | SC (5%) | Total |
|---|---|---|---|---|---|
| SNY-0187 | 129.000 | 0 | 14.190 | 6.450 | 149.640 |
| SNY-0186 | 55.000 | 0 | 6.050 | 2.750 | 63.800 |
| SNY-0185 | 115.000 | 10.000 | 11.550 | 5.250 | 121.800 |
| SNY-0184 (void) | 97.000 | 0 | 10.670 | 4.850 | 112.520 |
| SNY-0183 | 165.000 | 0 | 18.150 | 8.250 | 191.400 |

**Verifikasi formula pada SNY-0185:**
- base = 115.000 - 10.000 = 105.000
- tax = round(105.000 × 0.11) = 11.550 ✅
- sc = round(105.000 × 0.05) = 5.250 ✅
- total = 105.000 + 11.550 + 5.250 = 121.800 ✅

**KDS: Threshold urgency hardcoded di mockup:**

```javascript
const CFG = {
  warnMin:   10,  // kuning mulai di menit ke-10
  urgentMin: 20,  // merah mulai di menit ke-20
  compactThreshold: 12,  // compact mode aktif saat ≥12 order
  highlightDuration: 3500,  // ms: badge NEW hilang setelah 3.5 detik
}
```

Nilai-nilai ini harus bisa di-override dari Backoffice per outlet. Default di database = nilai di atas.

**Backoffice: Outlet yang ada di demo:**

| Outlet | Kota | Status | Revenue Hari Ini |
|---|---|---|---|
| Galaxy Mall | Surabaya | open | Rp 4.280.000 |
| Summarecon | Tangerang | open | Rp 3.120.000 |
| Pakuwon City | Surabaya | maintenance | Rp 0 |

**Member segments di POS mockup:**

| Kode | Label | Kunjungan |
|---|---|---|
| `vip` | ⭐ VIP | 34 kunjungan (contoh: Ahmad Sudirman) |
| `loyal` | Loyal | 16 kunjungan (contoh: Rina Kusuma) |
| `regular` | Reguler | 5 kunjungan (contoh: Doni Prasetyo) |
| `new` | Baru | — |

---

### 16.6 Behavior POS yang Tidak Terdokumentasi tapi Kritikal

Ditemukan dari membaca kode mockup — tidak ada di docs manapun:

1. **Item di cart dengan `opts`/`addons` menghasilkan baris cart baru (bukan increment qty).** Ini karena `cartKey = menuId + '_' + Date.now()`. Dua Ayam Bakar dengan Level Pedas berbeda = dua baris di cart, bukan satu baris qty 2.

2. **Item tanpa opts menggunakan `cartKey = String(menuId)` dan di-merge.** Tap dua kali = qty 2 di baris yang sama.

3. **Delivery methods dikunci untuk Dine In.** Saat `orderType === 'dine'`, tombol GoFood/GrabFood/ShopeeFood di payment modal di-disable dengan `pointer-events:none`. Backend harus validasi ini juga.

4. **Kategori "Favorit" tidak ada di database — murni client-side filter.** Saat `curCat === 'fav'`, menu difilter dari `favorites` Set, bukan dari API.

5. **Search menu cross-category.** Saat ada query di search box, filter kategori aktif diabaikan — semua item dari semua kategori dicari. Backend `GET /api/menu/outlet/:outletId` harus mengembalikan semua item, filtering dilakukan client-side.

6. **Tombol bayar berisi nilai total yang terupdate real-time:** `Bayar Rp 149.640`. Ini berarti `calcT()` dipanggil ulang setiap kali cart berubah, bukan hanya saat modal bayar dibuka.

7. **Modal Payment tidak bisa dibuka ulang jika sudah ada.** Terdapat guard: `if (document.getElementById('pay-ov')) return;`. Ini mencegah double-click "Bayar".

8. **Void PIN di mockup = `'1234'` (hardcoded, sama dengan PIN kasir Citra).** Ini BUG di mockup yang harus diperbaiki di produksi — void harus terpisah dari login PIN.

---

*Bagian 16 ditulis berdasarkan analisis source code: `NASHTY_POS_Mockup.html`, `NASHTY_KDS_Mockup.html`, `NASHTY_Backoffice_Mockup_8.html`*  
*Update: Juni 2026*
