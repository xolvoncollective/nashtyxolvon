# 📚 API Reference - Nashty Backend

Quick reference untuk semua API endpoints.

**Base URL**: `https://nashty-backend-production.up.railway.app`

## 🔐 Authentication

Semua endpoints (kecuali `/health`) memerlukan JWT token di header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🏥 Health Check

### GET `/health`

Check server status.

**No auth required**

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-06-21T10:30:00.000Z",
  "version": "2.0.0",
  "environment": "production",
  "uptime": 3600
}
```

---

## 🔑 Auth Endpoints

### POST `/api/auth/refresh`

Refresh access token using refresh token.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "new-access-token",
  "refreshToken": "new-refresh-token",
  "expiresIn": "1h",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "role": "cashier",
    "tenantId": "uuid",
    "outletId": "uuid"
  }
}
```

### POST `/api/auth/logout`

Logout and blacklist current token.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET `/api/auth/validate`

Validate current token.

**Response:**
```json
{
  "success": true,
  "valid": true,
  "user": { "id": "uuid", "role": "cashier", ... }
}
```

---

## ⭐ Favorites Endpoints

### GET `/api/favorites`

Get user's favorite products.

**Query Params:**
- `userId` (required): UUID of user

**Response:**
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
        "image": "url"
      },
      "createdAt": "2024-06-21T10:00:00.000Z"
    }
  ]
}
```

### POST `/api/favorites`

Add product to favorites.

**Body:**
```json
{
  "userId": "uuid",
  "productId": "uuid",
  "position": 0
}
```

**Response:**
```json
{
  "success": true,
  "favorite": { "id": "uuid", "userId": "uuid", ... }
}
```

**Errors:**
- `400` - Maximum 50 favorites per user
- `400` - Product already in favorites

### DELETE `/api/favorites/:id`

Remove favorite.

**Response:**
```json
{
  "success": true,
  "message": "Favorite removed"
}
```

### PUT `/api/favorites/reorder`

Reorder favorites.

**Body:**
```json
{
  "userId": "uuid",
  "favorites": [
    { "id": "uuid-1", "position": 0 },
    { "id": "uuid-2", "position": 1 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Favorites reordered"
}
```

---

## 📊 Analytics Endpoints

### GET `/api/analytics/top-products`

Get top selling products.

**Query Params:**
- `outletId` (required): Outlet UUID
- `days` (optional): Number of days (default: 7)
- `limit` (optional): Number of products (default: 20)

**Response:**
```json
{
  "success": true,
  "period": {
    "days": 7,
    "from": "2024-06-14T00:00:00.000Z",
    "to": "2024-06-21T23:59:59.000Z"
  },
  "products": [
    {
      "productId": "uuid",
      "name": "Nasi Goreng",
      "salesCount": 150,
      "revenue": 3750000,
      "trend": "stable",
      "trendPercentage": 0
    }
  ],
  "totalSales": 500,
  "totalRevenue": 12500000
}
```

**Cache**: 6 hours

---

## ⚙️ Settings Endpoints

### GET `/api/outlets/:outletId/settings`

Get outlet settings.

**Response:**
```json
{
  "success": true,
  "settings": {
    "receipt": {
      "logo": "https://...",
      "headerText": "Welcome!",
      "footerText": "Thank you!",
      "fontSize": "medium",
      "qrCode": { "enabled": false, "url": "" },
      "socialMedia": { "instagram": "@restaurant" },
      "promoMessages": []
    },
    "customerDisplay": {
      "backgroundColor": "#1a1a1a",
      "textColor": "#ffffff",
      "accentColor": "#f59e0b"
    }
  },
  "updatedAt": "2024-06-21T10:00:00.000Z"
}
```

### PUT `/api/outlets/:outletId/settings`

Update outlet settings.

**Body:**
```json
{
  "receipt": {
    "headerText": "Selamat Datang!",
    "footerText": "Terima Kasih!",
    "fontSize": "large"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated",
  "settings": { ... }
}
```

### POST `/api/outlets/:outletId/upload-logo`

Upload receipt logo.

**Form Data:**
- `logo`: File (PNG/JPG/SVG, max 2MB)

**Response:**
```json
{
  "success": true,
  "url": "https://storage.supabase.co/.../logo.jpg",
  "fileName": "logos/outlet-id/logo-123456.jpg"
}
```

### POST `/api/outlets/:outletId/upload-promo-images`

Upload promotional images.

**Form Data:**
- `images`: File[] (PNG/JPG, max 5MB each, max 10 files)

**Response:**
```json
{
  "success": true,
  "urls": [
    "https://storage.supabase.co/.../promo-1.jpg",
    "https://storage.supabase.co/.../promo-2.jpg"
  ],
  "count": 2
}
```

---

## 🛒 Orders Endpoints

### POST `/api/orders`

Create new order.

**Body:**
```json
{
  "orderType": "dine-in",
  "tableNumber": "A5",
  "items": [
    {
      "productId": "uuid",
      "name": "Nasi Goreng",
      "qty": 2,
      "price": 25000,
      "notes": "Pedas"
    }
  ],
  "subtotal": 50000,
  "tax": 5000,
  "discount": 0,
  "total": 55000,
  "paymentMethod": "cash",
  "paymentStatus": "paid"
}
```

**Response:**
```json
{
  "success": true,
  "order": { "id": "uuid", "order_number": "ORD-ABC123", ... },
  "orderNumber": "ORD-ABC123"
}
```

### GET `/api/orders`

List orders with pagination.

**Query Params:**
- `outletId` (optional): Filter by outlet
- `status` (optional): Filter by status
- `dateFrom` (optional): Start date (YYYY-MM-DD)
- `dateTo` (optional): End date (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "orders": [ { "id": "uuid", ... } ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### GET `/api/orders/:id`

Get order details.

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "ORD-ABC123",
    "order_items": [ { "product_name": "Nasi Goreng", ... } ],
    ...
  }
}
```

### PATCH `/api/orders/:id/status`

Update order status.

**Body:**
```json
{
  "orderStatus": "completed",
  "kitchenStatus": "done"
}
```

**Response:**
```json
{
  "success": true,
  "order": { "id": "uuid", "order_status": "completed", ... }
}
```

---

## 📈 Dashboard Endpoints

### GET `/api/dashboard/kpi`

Get dashboard KPIs.

**Query Params:**
- `outletId` (optional): Filter by outlet
- `tenantId` (optional): Filter by tenant

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-06-21",
    "totalOrders": 45,
    "grossRevenue": 2250000,
    "netRevenue": 2125000,
    "totalDiscounts": 125000,
    "averageOrderValue": 47222,
    "growth": 15.5,
    "yesterday": { "totalOrders": 39, "revenue": 1843000 },
    "salesByType": [
      { "type": "dine-in", "count": 30, "revenue": 1500000 },
      { "type": "takeaway", "count": 15, "revenue": 625000 }
    ],
    "salesByPayment": [
      { "method": "cash", "count": 25, "revenue": 1250000 },
      { "method": "qris", "count": 20, "revenue": 875000 }
    ]
  }
}
```

### GET `/api/dashboard/recent-orders`

Get recent orders.

**Query Params:**
- `outletId` (optional): Filter by outlet
- `limit` (optional): Number of orders (default: 10)

**Response:**
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
      "order_status": "completed",
      "created_at": "2024-06-21T10:30:00.000Z"
    }
  ]
}
```

### GET `/api/dashboard/weekly-chart`

Get 7-day revenue chart data.

**Query Params:**
- `outletId` (optional): Filter by outlet

**Response:**
```json
{
  "success": true,
  "data": [450000, 520000, 480000, 610000, 580000, 550000, 620000],
  "labels": ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
}
```

---

## 📊 Reports Endpoints

### GET `/api/reports/sales`

Sales report with grouping.

**Query Params:**
- `outletId` (optional): Filter by outlet
- `dateFrom` (optional): Start date
- `dateTo` (optional): End date
- `groupBy` (optional): day/week/month (default: day)

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalRevenue": 12500000,
    "totalOrders": 250,
    "totalDiscount": 125000,
    "averageOrderValue": 50000,
    "dateRange": { "from": "2024-06-01", "to": "2024-06-21" }
  },
  "data": [
    { "date": "2024-06-21", "count": 45, "revenue": 2125000, "discount": 50000, "avgOrder": 47222 }
  ],
  "byPaymentMethod": [
    { "method": "cash", "count": 150, "revenue": 7500000 }
  ],
  "byOrderType": [
    { "type": "dine-in", "count": 180, "revenue": 9000000 }
  ]
}
```

### GET `/api/reports/products`

Product performance report.

**Query Params:**
- `outletId` (optional): Filter by outlet
- `dateFrom` (optional): Start date
- `dateTo` (optional): End date
- `limit` (optional): Number of products (default: 20)

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "productId": "uuid",
      "name": "Nasi Goreng",
      "quantity": 150,
      "revenue": 3750000,
      "orders": 145
    }
  ],
  "total": 87
}
```

---

## 🚫 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": [ { "path": ["userId"], "message": "Required" } ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "No authorization header"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Unauthorized to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Endpoint not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many requests. Please try again in 1 minute.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 1719835200
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All UUIDs are version 4
- Max request body size: 10MB
- Rate limits reset every minute
- File uploads use multipart/form-data
- All other requests use application/json

---

**Version**: 2.0.0  
**Last Updated**: 2024-06-21
