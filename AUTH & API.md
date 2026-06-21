# AUTH & API

Dokumen ini merangkum seluruh dokumentasi AUTH dan API yang ditemukan di project, berdasarkan implementasi aktual di `api-client.js`, `supabase/functions`, `backoffice/backend`, `pos/frontend`, dan `kds/frontend`.

## Ringkasan arsitektur

Project ini memakai 3 lapisan API:

1. `api-client.js`
   Client facade utama untuk Backoffice dan POS. Banyak endpoint `/api/*` sebenarnya dipetakan ke Supabase Edge Functions, query Supabase langsung, atau local storage.

2. `supabase/functions/*`
   Lapisan API aktif utama untuk auth, orders, dashboard, reports, settings, analytics, dan favorites.

3. `backoffice/backend/*`
   Backend Express legacy untuk beberapa route seperti favorites, analytics, receipt/display settings, dan upload QRIS.

## Base URL dan pola akses

### Supabase

- Base Supabase: `https://mzucfndifneytbesirkx.supabase.co`
- Base Edge Functions: `https://mzucfndifneytbesirkx.supabase.co/functions/v1`

### Client-side virtual API

Frontend juga memakai `API.request(endpoint, options)` dan interceptor `window.fetch` yang mengubah request `/api/*` menjadi panggilan internal. Jadi beberapa endpoint terlihat seperti REST biasa, padahal dieksekusi oleh:

- Edge Function
- Query Supabase langsung
- Local storage mock

### Legacy Express backend

Server legacy di `backoffice/backend/server.js` expose:

- `/health`
- `/api/favorites`
- `/api/analytics/top-products`
- `/api/outlets/:id/receipt-settings`
- `/api/outlets/:id/display-settings`
- `/api/outlets/:id/qris`

## AUTH documentation

## Gambaran auth

Auth aktif utama berada di Edge Function `auth-login`.

Jenis login yang tersedia:

1. `main-login`
   Untuk manager / owner / superadmin.

2. `superadmin-login`
   Untuk superadmin / owner / manager.

3. `pin-login`
   Untuk staff / cashier berbasis PIN.

## Header auth

Untuk Edge Function, client mengirim:

```http
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
x-nashty-token: <user-access-token>
```

Catatan:

- Header `Authorization` berisi anon key Supabase, bukan user token.
- User token dikirim di header custom `x-nashty-token`.
- Ini adalah pola yang dipakai `API.edgeRequest()`.

## Penyimpanan sesi

### Main session

Disimpan di local storage key:

```txt
nashty_main_session
```

Contoh isi:

```json
{
  "admin": {},
  "adminToken": "jwt",
  "refreshToken": "jwt-refresh",
  "tenantId": "uuid",
  "timestamp": "2026-06-21T10:00:00.000Z"
}
```

### Staff session

Disimpan di:

```txt
nashty_session
```

### KDS session

Disimpan di:

```txt
nashty_kds_session
```

### POS compatibility keys

POS juga menulis:

```txt
nashty_token
nashty_user
nashty_outlet
```

untuk menjaga kompatibilitas dengan auth layer lain.

## Edge Function auth

### POST `/functions/v1/auth-login`

Method yang didukung:

- `POST`
- `OPTIONS`

Body umum:

```json
{
  "action": "main-login | superadmin-login | pin-login",
  "username": "optional",
  "password": "optional",
  "pin": "optional",
  "outletId": "optional"
}
```

### `action: main-login`

Body:

```json
{
  "action": "main-login",
  "username": "manager@nashty",
  "password": "secret",
  "outletId": "optional"
}
```

Perilaku:

- Valid role: `manager`, `superadmin`, `owner`
- Jika username `admin`, `admin1`, `admin2`, `admin3`, atau `admin4`, email dipaksa menjadi `manager@nashty`
- Jika akun `inactive`, request ditolak
- Access token berlaku `1h`
- Refresh token berlaku `30 hari`
- Login dicatat ke `activity_logs`

Response sukses:

```json
{
  "success": true,
  "token": "jwt",
  "refreshToken": "jwt-refresh",
  "expiresIn": "1h",
  "user": {
    "id": "uuid",
    "name": "Manager",
    "email": "manager@nashty",
    "role": "manager",
    "tenantId": "uuid",
    "outletId": "uuid"
  }
}
```

### `action: superadmin-login`

Body sama seperti `main-login`, tapi role yang diizinkan:

- `superadmin`
- `owner`
- `manager`

### `action: pin-login`

Body:

```json
{
  "action": "pin-login",
  "pin": "1234",
  "outletId": "uuid-optional"
}
```

Perilaku:

- PIN wajib ada
- Jika `outletId` dikirim, user dicari berdasarkan `pin + outlet_id`
- Access token berlaku `12h`
- Refresh token berlaku `30 hari`
- Login dicatat ke `activity_logs`

Response sukses:

```json
{
  "success": true,
  "token": "jwt",
  "refreshToken": "jwt-refresh",
  "expiresIn": "12h",
  "user": {
    "id": "uuid",
    "name": "Kasir",
    "role": "cashier",
    "tenantId": "uuid",
    "outletId": "uuid"
  }
}
```

## Logout dan restore session

### Main auth client

Method:

- `API.mainAuth.login(username, password)`
- `API.mainAuth.logout()`
- `API.mainAuth.restoreSession()`

### Staff auth client

Method:

- `API.auth.getStaff(outletId?)`
- `API.auth.login(pin, outletId?)`
- `API.auth.logout()`
- `API.auth.restoreSession()`

## Catatan auth penting

1. Refresh token memang diterbitkan oleh `auth-login`, tetapi di codebase ini tidak ada endpoint refresh aktif yang benar-benar mengonsumsi refresh token.
2. Dokumentasi lama di `backoffice/backend/API_REFERENCE.md` menyebut `/api/auth/refresh`, `/api/auth/logout`, dan `/api/auth/validate`, tetapi implementasinya tidak ditemukan di backend aktif saat ini.
3. KDS memakai auth yang sama, yaitu `POST /functions/v1/auth-login` dengan `action: pin-login`.

## API documentation

## 1. API facade di `api-client.js`

`API.request(endpoint, options)` adalah facade utama. Endpoint yang didukung:

### Auth

- `POST /auth-login`
- `POST /auth/login`
- `GET /auth/staff?outletId=...`

### Favorites

- `GET /favorites?userId=...`
- `POST /favorites`
- `DELETE /favorites/:id`
- `PUT /favorites/reorder`

### Analytics

- `GET /analytics/top-products?outletId=...&days=...&limit=...`

### Products

- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`
- `POST /products/:id/duplicate`

### Categories

- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

### Orders

- `GET /orders`
- `POST /orders`
- `GET /orders/:id`
- `PATCH/PUT /orders/:id/status`

### Reports

- `POST /reports/sales`
- `POST /reports/top-products`

### Settings

- `GET /settings`
- `PUT /settings`
- `POST /settings/:outletId/logo`

### Shifts

- `GET /shifts/:shiftId/summary`

### Users

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

### Outlets

- `GET /outlets`

### Activity Logs

- `GET /activity-logs`

### Costs

- `GET /costs`
- `POST /costs`
- `PUT /costs/:id`
- `DELETE /costs/:id`

### Health

- `GET /health`

## 2. Edge Functions

## Favorites API

### GET `/functions/v1/favorites-api?action=get&userId=<uuid>`

Response:

```json
{
  "success": true,
  "favorites": [
    {
      "id": "uuid",
      "userId": "uuid",
      "productId": "uuid",
      "position": 0,
      "product": {
        "id": "uuid",
        "name": "Nasi Goreng",
        "price": 25000,
        "image": "url",
        "category_id": "uuid"
      },
      "createdAt": "2026-06-21T10:00:00.000Z"
    }
  ]
}
```

### POST `/functions/v1/favorites-api?action=add`

Body:

```json
{
  "userId": "uuid",
  "productId": "uuid",
  "position": 0
}
```

Response:

```json
{
  "success": true,
  "favorite": {
    "id": "uuid",
    "user_id": "uuid",
    "product_id": "uuid",
    "position": 0
  }
}
```

Error khusus:

- `FAVORITES_LIMIT_EXCEEDED`
- `FAVORITE_ALREADY_EXISTS`

### DELETE `/functions/v1/favorites-api?action=remove&id=<favoriteId>`

Response:

```json
{
  "success": true,
  "message": "Favorite removed"
}
```

### PUT `/functions/v1/favorites-api?action=reorder`

Body:

```json
{
  "userId": "uuid",
  "favorites": [
    { "id": "uuid-1", "position": 0 },
    { "id": "uuid-2", "position": 1 }
  ]
}
```

## Analytics API

### GET `/functions/v1/analytics-api?outletId=<uuid>&days=7&limit=20`

Mengembalikan top products berdasarkan order `completed`.

Response:

```json
{
  "success": true,
  "period": {
    "days": 7,
    "from": "2026-06-14T00:00:00.000Z",
    "to": "2026-06-21T23:59:59.000Z"
  },
  "products": [
    {
      "productId": "uuid",
      "name": "Ayam Bakar Madu",
      "salesCount": 25,
      "revenue": 1375000,
      "trend": "up",
      "trendPercentage": 20
    }
  ],
  "totalSales": 25,
  "totalRevenue": 1375000
}
```

Catatan:

- Memakai cache memory TTL `6 jam`
- Juga menulis cache ke tabel `analytics_cache`

## Settings API

### GET `/functions/v1/settings-api?action=get&outletId=<uuid>`

Response:

```json
{
  "success": true,
  "settings": {
    "receipt": {
      "logo": null,
      "headerText": "Welcome to Our Restaurant",
      "footerText": "Thank you for your visit!",
      "fontSize": "medium",
      "qrCode": { "enabled": false, "url": "" },
      "socialMedia": {
        "facebook": "",
        "instagram": "",
        "twitter": "",
        "tiktok": ""
      },
      "promoMessages": []
    },
    "customerDisplay": {
      "backgroundColor": "#1a1a1a",
      "textColor": "#ffffff",
      "accentColor": "#f59e0b",
      "restaurantName": "Restaurant",
      "tagline": "",
      "promoImages": []
    }
  },
  "updatedAt": null
}
```

### POST `/functions/v1/settings-api?action=update&outletId=<uuid>`

atau lewat `PUT`, tergantung caller.

Body:

```json
{
  "settings": {
    "brandName": "Nashty Hot Chicken",
    "taxRate": 11
  }
}
```

Response:

```json
{
  "success": true,
  "message": "Settings updated",
  "settings": {
    "brandName": "Nashty Hot Chicken",
    "taxRate": 11
  }
}
```

### POST `/functions/v1/settings-api?action=upload-logo&outletId=<uuid>`

Saat ini belum diimplementasikan penuh di edge function.

Response:

```json
{
  "success": false,
  "error": "Please upload directly to Supabase Storage from frontend",
  "info": "Use supabase.storage.from(receipts).upload() in frontend"
}
```

Catatan:

- Upload logo aktual dilakukan oleh `API.outletSettings.uploadLogo()` langsung ke Supabase Storage, bukan oleh edge function.

## Dashboard API

### POST `/functions/v1/dashboard-api`

Action yang didukung:

- `kpi`
- `recent-orders`
- `weekly-chart`

Body umum:

```json
{
  "action": "kpi",
  "tenantId": "uuid",
  "outletId": "uuid",
  "limit": 10
}
```

### `action: kpi`

Response:

```json
{
  "success": true,
  "data": {
    "date": "2026-06-21",
    "totalOrders": 45,
    "grossRevenue": 2250000,
    "netRevenue": 2125000,
    "totalDiscounts": 125000,
    "averageOrderValue": 47222,
    "growth": 15.5,
    "yesterday": {
      "totalOrders": 39,
      "revenue": 1843000
    },
    "salesByPayment": [
      { "method": "cash", "count": 25, "revenue": 1250000 }
    ]
  }
}
```

### `action: recent-orders`

Response:

```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-ABC123",
      "order_type": "dine-in",
      "total": 55000,
      "payment_status": "paid",
      "order_status": "pending",
      "created_at": "2026-06-21T10:00:00.000Z",
      "table_number": "T03",
      "customer_name": "Budi"
    }
  ]
}
```

### `action: weekly-chart`

Response:

```json
{
  "success": true,
  "data": [450000, 520000, 480000, 610000, 580000, 550000, 620000],
  "labels": ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
}
```

## Orders API

### POST `/functions/v1/orders-api`

Action yang didukung:

- `create`
- `get-orders`
- `update-status`
- `start-shift`
- `end-shift`

### `action: create`

Body:

```json
{
  "action": "create",
  "tenantId": "uuid",
  "outletId": "uuid",
  "userId": "uuid",
  "shiftId": "uuid-optional",
  "orderType": "dine-in",
  "tableNumber": "T03",
  "items": [
    {
      "productId": "uuid",
      "name": "Ayam Bakar Madu",
      "qty": 2,
      "price": 55000,
      "notes": "Pedas",
      "modifiers": []
    }
  ],
  "subtotal": 110000,
  "tax": 12100,
  "discount": 0,
  "total": 122100,
  "paymentMethod": "cash",
  "paymentStatus": "paid",
  "customerName": "Budi",
  "customerPhone": "0812xxxx"
}
```

Response:

```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "ORD-ABC123"
  },
  "orderNumber": "ORD-ABC123"
}
```

### `action: get-orders`

Body:

```json
{
  "action": "get-orders",
  "tenantId": "uuid",
  "outletId": "uuid-optional",
  "status": "pending",
  "limit": 20
}
```

Response:

```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid",
      "order_items": []
    }
  ]
}
```

### `action: update-status`

Body:

```json
{
  "action": "update-status",
  "orderId": "uuid",
  "orderStatus": "completed",
  "kitchenStatus": "ready"
}
```

### `action: start-shift`

Body:

```json
{
  "action": "start-shift",
  "outletId": "uuid",
  "userId": "uuid",
  "startCash": 500000
}
```

### `action: end-shift`

Body:

```json
{
  "action": "end-shift",
  "shiftId": "uuid",
  "endCash": 650000,
  "notes": "Saldo sesuai"
}
```

## Reports API

### POST `/functions/v1/reports-api`

Action yang didukung:

- `sales`
- `top-products`

### `action: sales`

Body:

```json
{
  "action": "sales",
  "tenantId": "uuid",
  "outletId": "uuid-optional",
  "dateFrom": "2026-06-01",
  "dateTo": "2026-06-21",
  "groupBy": "day"
}
```

Response:

```json
{
  "success": true,
  "summary": {
    "totalRevenue": 12500000,
    "totalOrders": 250,
    "totalDiscount": 125000,
    "averageOrderValue": 50000
  },
  "data": [
    {
      "date": "2026-06-21",
      "count": 45,
      "revenue": 2125000,
      "discount": 50000
    }
  ],
  "byPaymentMethod": [
    {
      "method": "cash",
      "count": 150,
      "revenue": 7500000
    }
  ]
}
```

### `action: top-products`

Body:

```json
{
  "action": "top-products",
  "tenantId": "uuid",
  "outletId": "uuid-optional",
  "dateFrom": "2026-06-01",
  "dateTo": "2026-06-21",
  "limit": 20
}
```

Response:

```json
{
  "success": true,
  "products": [
    {
      "productId": "uuid",
      "name": "Ayam Bakar Madu",
      "quantity": 80,
      "revenue": 4400000
    }
  ]
}
```

## 3. Direct Supabase methods di `api-client.js`

Method berikut tidak melewati edge function:

### Users

- `API.users.getAll(filters)`
- `API.users.create(userData)`
- `API.users.update(id, userData)`
- `API.users.delete(id)`

Tabel: `users`

### Categories

- `API.categories.getAll()`
- `API.categories.create(data)`
- `API.categories.update(id, data)`
- `API.categories.delete(id)`

Tabel: `categories`

### Products

- `API.products.getAll(filters)`
- `API.products.getById(id)`
- `API.products.create(data)`
- `API.products.update(id, data)`
- `API.products.delete(id)`

Tabel: `products`

### Modifiers

- `API.modifiers.getAll()`

Tabel:

- `modifier_groups`
- `modifier_options`

### Menu

- `API.menu.getOutletMenu(outletId)`

Mengambil:

- `categories`
- `products`
- relasi `product_modifiers`
- relasi `modifier_groups`
- relasi `modifier_options`

### Shifts

- `API.shifts.getActive()`

Mengambil dari tabel `shifts`.

### Outlets

- `API.outlets.getAll()`

Tabel: `outlets`

### Activity logs

`API.request('/activity-logs')` mengambil langsung dari tabel `activity_logs`, dibatasi 50 data terbaru.

### Costs

`/costs` saat ini bukan backend database, melainkan local storage mock:

- simpan ke `nashty_costs`
- create / update / delete dilakukan di browser

## 4. KDS API client

`kds/frontend/js/api.js` memakai:

- `POST /functions/v1/auth-login` untuk login PIN
- Query Supabase langsung ke tabel `orders`
- Query Supabase langsung ke tabel `settings`

Method utama:

- `API.auth.login(pin, outletId?)`
- `API.orders.getKDSQueue(outletId)`
- `API.orders.getAll(filters)`
- `API.orders.updateKitchenStatus(orderId, status)`
- `API.orders.getKitchenStats(outletId)` -> fallback mock
- `API.orders.getConfig(outletId)`
- `API.settings.get(outletId)`

## 5. Legacy Express backend

## Health check

### GET `/health`

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-21T10:00:00.000Z"
}
```

## Favorites

### POST `/api/favorites`

Body:

```json
{
  "userId": "uuid",
  "productId": "uuid",
  "position": 0
}
```

### GET `/api/favorites?userId=<uuid>`

### DELETE `/api/favorites/:productId`

Catatan:

- Delete memakai header `x-user-id`

### PUT `/api/favorites/reorder`

Body:

```json
{
  "productIds": ["uuid-1", "uuid-2"]
}
```

## Analytics

### GET `/api/analytics/top-products?outletId=<uuid>&days=7&limit=20`

Memakai RPC `get_top_products`.

## Receipt settings

### GET `/api/outlets/:id/receipt-settings`

Field yang diambil:

- `receipt_logo`
- `receipt_header`
- `receipt_footer`
- `receipt_font_size`
- `receipt_qr_feedback`
- `receipt_social_facebook`
- `receipt_social_instagram`
- `receipt_social_twitter`
- `receipt_social_tiktok`
- `receipt_promos`

### PUT `/api/outlets/:id/receipt-settings`

Body langsung di-pass sebagai object update ke tabel `outlets`.

## Display settings

### GET `/api/outlets/:id/display-settings`

Field:

- `display_background_color`
- `display_text_color`
- `display_accent_color`
- `display_promo_images`

### PUT `/api/outlets/:id/display-settings`

Body langsung di-pass sebagai object update ke tabel `outlets`.

## QRIS

### GET `/api/outlets/:id/qris`

Response:

```json
{
  "qris_static_url": "https://..."
}
```

### POST `/api/outlets/:id/qris/upload`

Body:

```json
{
  "imageBase64": "data:image/png;base64,...",
  "fileName": "qris.png"
}
```

Validasi:

- `imageBase64` wajib
- `fileName` wajib
- maksimal `2MB`
- ekstensi hanya `jpg`, `jpeg`, `png`

### DELETE `/api/outlets/:id/qris`

Mengosongkan field `qris_static_url`.

## Error patterns

Format error yang umum ditemukan:

```json
{
  "error": "message"
}
```

atau:

```json
{
  "success": false,
  "error": "message"
}
```

Status code yang dipakai:

- `400` validasi gagal
- `401` kredensial salah / unauthorized
- `403` akun inactive
- `405` method tidak diizinkan
- `500` internal error
- `501` fitur belum diimplementasikan

## Audit tombol dan function

Bagian ini khusus menjawab permintaan untuk mengecek apakah ada tombol atau function yang tidak benar-benar melempar data.

## Temuan utama

### 1. `backoffice/frontend/js/pages/kds.js`

Ada pemanggilan method yang tidak ada di `api-client.js`:

- `API.kds.updateCategoryProductionTime(catId, timeMinutes)`
- `API.kds.getAnalytics()`

Status:

- `API.kds` tidak terdefinisi di `api-client.js`
- tombol yang bergantung pada dua method ini tidak akan mengirim data ke backend
- hasilnya kemungkinan error runtime saat tombol ditekan

UI yang terdampak:

- tombol `Ubah Target` di halaman `kds-time`
- halaman `kds-analytics`

### 2. `backoffice/frontend/js/pages/system.js`

File ini memiliki syntax error:

```js
};
```

tambahan setelah definisi `PAGES.settings`.

Status:

- `node --check` gagal dengan `SyntaxError: Unexpected token '}'`
- semua kode setelah titik itu berpotensi tidak tereksekusi
- ini bisa membuat function/tombol di halaman system tidak pernah aktif

UI yang terdampak paling jelas:

- `PAGES.actlogs`
- semua handler yang didefinisikan setelah error parse

### 3. QRIS di halaman system tidak mengirim ke backend

Di `backoffice/frontend/js/pages/system.js`:

- `window.uploadQRIS()`
- `window.removeQRIS()`

Status:

- hanya menulis / menghapus `localStorage` key `nashty_qris_static`
- tidak memanggil endpoint backend atau edge function
- padahal backend legacy sudah punya route:
  - `POST /api/outlets/:id/qris/upload`
  - `DELETE /api/outlets/:id/qris`

Kesimpulan:

- tombol `Upload QRIS`, `Ganti QRIS`, dan `Hapus` tidak melempar data ke server
- perubahan hanya lokal di browser saat ini

### 4. Export logs di `activity-logs.js` berisiko tidak terpanggil

Di `backoffice/frontend/js/pages/activity-logs.js`, tombol memakai:

```html
onclick="exportLogs()"
```

tetapi `exportLogs()` didefinisikan di scope lokal `activityLogsPage()` dan hanya diexpose sebagai:

```js
window.activityLogsModule = { updateFilter, exportLogs };
```

Status:

- inline handler mencari `exportLogs()` global
- function yang tersedia global justru `activityLogsModule.exportLogs`

Kesimpulan:

- tombol `Export CSV` kemungkinan tidak jalan jika halaman ini dipakai langsung
- seharusnya handler memanggil `activityLogsModule.exportLogs()`

### 5. Search/filter logs di halaman system masih placeholder

Di `backoffice/frontend/js/pages/system.js`:

- input search logs hanya `toast('Fitur pencarian logs menyusul')`
- filter module hanya `toast('Fitur filter menyusul')`
- filter date range hanya `toast('Fitur filter menyusul')`

Status:

- event memang terpanggil
- tetapi tidak melempar payload pencarian / filter ke API manapun

### 6. Upload foto produk masih placeholder

Di `backoffice/frontend/js/pages/menu.js` ada upload zone dengan aksi:

```js
toast('Upload foto - coming soon')
```

Status:

- tombol terpasang
- tidak mengirim file atau payload apapun

### 7. Upload logo struk masih placeholder

Di `backoffice/frontend/js/pages/pos.js` pada bagian receipt:

```js
toast('Upload logo belum tersedia, menggunakan logo default')
```

Status:

- tombol ada
- tidak melempar data file ke backend atau storage

### 8. Tombol export outlet masih placeholder

Di `backoffice/frontend/js/pages/business.js`:

```js
toast('Fitur export belum tersedia')
```

Status:

- tombol ada
- tidak menghasilkan request atau export data

## Handler yang sudah benar-benar melempar data

Berikut handler yang saya cek dan memang mengirim data:

- `window.saveBranding()` -> `API.request('/settings/' + API.session.outletId, { method: 'PUT', body: ... })`
- `window.uploadLogo()` -> `API.request('/settings/:outletId/logo', { method: 'POST', body: base64 })`, lalu upload ke Supabase Storage
- `savePosGeneral()` -> `PUT /settings`
- `savePosReceipt()` -> `PUT /settings`
- `saveKdsWorkflow()` -> `API.settings.update(...)`
- `saveKdsAlerts()` -> `API.settings.update(...)`
- `API.auth.login()` -> `POST /functions/v1/auth-login`
- `API.orders.create()` -> `POST /functions/v1/orders-api`
- `API.reports.getSales()` -> `POST /functions/v1/reports-api`

Catatan:

- `saveKdsWorkflow()` dan `saveKdsAlerts()` benar-benar mengirim data.
- Problem KDS ada di fitur `kds-time` dan `kds-analytics`, bukan di dua tombol save ini.

## Prioritas perbaikan

Jika mau dibereskan setelah dokumentasi ini, urutan paling penting:

1. Hapus syntax error di `backoffice/frontend/js/pages/system.js`
2. Implement `API.kds` atau ubah `kds.js` agar memakai method API yang benar
3. Sambungkan QRIS system page ke endpoint backend, bukan local storage
4. Perbaiki `onclick="exportLogs()"` menjadi handler global yang valid
5. Ganti tombol placeholder upload/export dengan implementasi nyata

## Kesimpulan

AUTH dan API aktif utama project ini berpusat di `api-client.js` dan `supabase/functions`.

Untuk pertanyaan audit:

- Ya, ada beberapa tombol/function yang tidak melempar data
- yang paling kritis adalah fitur KDS tertentu, QRIS di halaman system, placeholder upload/export, dan syntax error di `system.js`
