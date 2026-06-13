# API Documentation - NASHTY OS v2.0

Base URL: `http://localhost:3000/api` (atau port aktif sesuai `$env:PORT`, misal `3099`)

## Authentication

### POST /auth/login
Login dengan PIN. Mengembalikan JWT token untuk otentikasi antar modul POS, KDS, dan Backoffice.

**Request:**
```json
{
  "pin": "1234",
  "outletId": "demo-outlet" // optional
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "name": "Citra Dewi",
    "email": "citra@nashty.demo",
    "role": "cashier",
    "tenantId": "demo-tenant",
    "outletId": "demo-outlet",
    "outletName": "Galaxy Mall",
    "tenantName": "Demo Restaurant"
  }
}
```

### GET /auth/staff
Get available staff untuk PIN selection.

**Query Params:**
- `outletId` (optional): Filter by outlet

**Response:**
```json
{
  "staff": [
    {
      "id": "user_123",
      "name": "Citra Dewi",
      "role": "cashier",
      "avatar": null
    }
  ]
}
```

### POST /auth/verify-manager-pin
Verifikasi PIN Manager (untuk kebutuhan void pesanan atau diskon yang melebihi batas).

**Request:**
```json
{
  "pin": "0000",
  "outletId": "demo-outlet" // optional
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "manager": {
    "id": "manager_123",
    "name": "Admin Demo",
    "role": "owner"
  }
}
```

### GET /auth/outlets
Daftar semua outlet yang aktif.

**Query Params:**
- `tenantId` (optional): Filter by tenant

**Response:**
```json
{
  "success": true,
  "outlets": [
    {
      "id": "demo-outlet",
      "name": "Galaxy Mall",
      "slug": "galaxy-mall",
      "address": "Jl. Galaxy Mall No. 123",
      "phone": "021-12345678",
      "status": "active"
    }
  ]
}
```

---

## Menu

### GET /menu/outlet/:outletId
*(Canonical Endpoint untuk memuat menu di POS)*
Memuat seluruh kategori, produk, dan *modifier groups* yang aktif untuk sebuah outlet dalam satu *request*.

**Response:**
```json
{
  "success": true,
  "data": {
    "outlet": {
      "id": "demo-outlet",
      "name": "Galaxy Mall",
      "address": "Jl. Galaxy Mall No. 123",
      "phone": "021-12345678"
    },
    "categories": [
      {
        "id": "cat_123",
        "name": "Makanan",
        "slug": "makanan",
        "description": "Menu makanan utama",
        "icon": "🍽️",
        "color": "#E4540C",
        "display_order": 0
      }
    ],
    "items": [
      {
        "id": "prod_123",
        "name": "Ayam Bakar Madu",
        "slug": "ayam-bakar-madu",
        "description": "Bumbu kacang & lalapan",
        "price": 55000,
        "category_id": "cat_123",
        "has_modifiers": 1,
        "modifier_groups": [
          {
            "id": "modgroup_123",
            "name": "Level Pedas",
            "type": "single",
            "required": 1,
            "min_select": 1,
            "max_select": 1,
            "options": [
              {
                "id": "modopt_123",
                "name": "Original",
                "price_adjustment": 0
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### GET /categories
Get all categories

**Query Params:**
- `tenantId` (required): Tenant ID

### GET /products
Get all products with filters

**Query Params:**
- `tenantId` (required): Tenant ID
- `categoryId` (optional): Filter by category
- `search` (optional): Search by name or description
- `status` (optional): Filter by status (default: 'active')

---

## Orders

### POST /orders
Create new order

**Request:**
```json
{
  "tenantId": "demo-tenant",
  "outletId": "demo-outlet",
  "shiftId": "shift_123", 
  "userId": "user_123",
  "orderType": "dine-in",
  "tableNumber": "T05",
  "items": [
    {
      "productId": "prod_123",
      "productName": "Ayam Bakar Madu",
      "quantity": 2,
      "unitPrice": 55000,
      "subtotal": 110000,
      "notes": "Tanpa cabe",
      "modifiers": [
        {
          "groupId": "modgroup_123",
          "groupName": "Level Pedas",
          "optionId": "modopt_123",
          "optionName": "Original",
          "priceAdjustment": 0
        }
      ]
    }
  ],
  "subtotal": 110000,
  "discount": 0,
  "tax": 12100,
  "serviceCharge": 5500,
  "total": 127600,
  "payments": [
    {
      "method": "cash",
      "amount": 130000,
      "change": 2400
    }
  ],
  "notes": "Customer notes"
}
```

### GET /orders
Get orders with filters

**Query Params:**
- `tenantId` (required): Tenant ID
- `outletId` (optional): Filter by outlet
- `status` (optional): Filter by order_status
- `kitchenStatus` (optional): Filter by kitchen_status
- `limit` (optional): Limit results (default: 50)
- `dateFrom` / `dateTo` (optional): Date range

### GET /orders/:id
Get order by ID

### PATCH /orders/:id/status
Update order status

**Request:**
```json
{
  "orderStatus": "completed", // optional
  "kitchenStatus": "ready" // optional
}
```

### PUT /orders/:id/void
Membatalkan (void) order. Memerlukan otorisasi dari akun dengan role `manager` atau `owner`.

**Request:**
```json
{
  "reason": "Salah input",
  "voidBy": "manager_123",
  "managerPin": "0000"
}
```

### GET /orders/shift/:shiftId
Daftar order berdasarkan Shift ID (untuk laporan per shift).

### GET /orders/config/:outletId
Konfigurasi POS per outlet (pajak, service charge, pengaturan KDS, metode bayar yang aktif).

---

## Kitchen Display System (KDS)

### GET /orders/kitchen/queue
Antrean dapur realtime yang di-polling oleh KDS. Mengembalikan pesanan yang memiliki `kitchen_status` `pending` atau `preparing`.

**Query Params:**
- `tenantId` (required)
- `outletId` (optional)

### GET /orders/kitchen/stats
Statistik performa dapur (rata-rata waktu persiapan, jumlah yang berstatus urgent/warning).

### GET /orders/kitchen/completed
Daftar pesanan yang sudah selesai (ready/served) pada hari ini.

### PATCH /orders/:id/items/:itemId/status
Update status level item di dalam dapur (untuk swipe item per item di KDS).

**Request:**
```json
{
  "status": "ready"
}
```

---

## Shifts

### POST /shifts/start
Start new shift

**Request:**
```json
{
  "outletId": "demo-outlet",
  "userId": "user_123",
  "startCash": 100000
}
```

### POST /shifts/:id/end
End shift

**Request:**
```json
{
  "endCash": 500000,
  "notes": "All good"
}
```

### GET /shifts/active
Get active shift for user

**Query Params:**
- `userId` (required): User ID

### GET /shifts/outlet/:outletId/active
Mendapatkan active shift berdasarkan ID outlet.

### GET /shifts/:id/summary
Rekap lengkap shift (penjualan, metode pembayaran, total discount, produk terlaris).

---

## Dashboard

### GET /dashboard/kpi
Get KPI metrics (Revenue, Transaksi, AOV, Pertumbuhan).

### GET /dashboard/recent-orders
10 transaksi terbaru.

### GET /dashboard/weekly-chart
Grafik penjualan 7 hari terakhir.

### GET /dashboard/payment-distribution
Persentase metode pembayaran yang digunakan pelanggan.

### GET /dashboard/top-products
10 produk terlaris berdasarkan periode (today, week, month).

### GET /dashboard/hourly-sales
Persebaran penjualan per jam (heatmap/grafik batang 24 jam).

---

## Error Responses

All endpoints can return these error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "errors": [
    { "field": "items", "message": "At least one item is required" }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid PIN"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Authentication Mechanism

API v2.0 menggunakan otentikasi JWT:
- Endpoint POS memerlukan header `Authorization: Bearer <token>`.
- Token didapatkan melalui `/api/auth/login`.
- Role berbasis kasir/dapur (*cashier*, *chef*) mendapatkan token berdurasi **12 jam**.
- Role berbasis manajemen (*manager*, *owner*) mendapatkan token berdurasi **30 menit**.

---

**API Version:** 2.0  
**Last Updated:** Juni 2026
