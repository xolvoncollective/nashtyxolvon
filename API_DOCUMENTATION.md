# API Documentation - NASHTY POS

Base URL: `http://localhost:3000/api`

## Authentication

### POST /auth/login
Login dengan PIN

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

**Error Response:**
```json
{
  "error": "Invalid PIN"
}
```

### GET /auth/staff
Get available staff untuk PIN selection

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

---

## Categories

### GET /categories
Get all categories

**Query Params:**
- `tenantId` (required): Tenant ID

**Response:**
```json
{
  "categories": [
    {
      "id": "cat_123",
      "tenant_id": "demo-tenant",
      "name": "Makanan",
      "slug": "makanan",
      "description": "Menu makanan utama",
      "icon": "🍽️",
      "color": "#E4540C",
      "display_order": 0,
      "status": "active",
      "product_count": 10
    }
  ]
}
```

### GET /categories/:id
Get category by ID

**Response:**
```json
{
  "category": {
    "id": "cat_123",
    "name": "Makanan",
    // ... other fields
  }
}
```

---

## Products

### GET /products
Get all products with filters

**Query Params:**
- `tenantId` (required): Tenant ID
- `categoryId` (optional): Filter by category
- `search` (optional): Search by name or description
- `status` (optional): Filter by status (default: 'active')

**Response:**
```json
{
  "products": [
    {
      "id": "prod_123",
      "tenant_id": "demo-tenant",
      "category_id": "cat_123",
      "name": "Ayam Bakar Madu",
      "slug": "ayam-bakar-madu",
      "description": "Bumbu kacang & lalapan",
      "price": 55000,
      "cost": 25000,
      "sku": null,
      "image_url": null,
      "is_favorite": 0,
      "has_modifiers": 0,
      "stock_tracking": 0,
      "stock_qty": 0,
      "production_time": 15,
      "status": "active",
      "category_name": "Makanan",
      "category_color": "#E4540C"
    }
  ]
}
```

### GET /products/:id
Get product detail with modifiers

**Response:**
```json
{
  "product": {
    "id": "prod_123",
    "name": "Ayam Bakar Madu",
    "price": 55000,
    "has_modifiers": 1,
    "modifiers": [
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
            "group_id": "modgroup_123",
            "name": "Original",
            "price_adjustment": 0
          },
          {
            "id": "modopt_124",
            "group_id": "modgroup_123",
            "name": "Pedas Extra",
            "price_adjustment": 0
          }
        ]
      }
    ]
  }
}
```

### PATCH /products/:id/favorite
Toggle favorite status

**Response:**
```json
{
  "success": true,
  "is_favorite": 1
}
```

---

## Orders

### POST /orders
Create new order

**Request:**
```json
{
  "tenantId": "demo-tenant",
  "outletId": "demo-outlet",
  "shiftId": "shift_123", // optional
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
  "tax": 0,
  "serviceCharge": 0,
  "total": 110000,
  "paymentMethod": "cash",
  "notes": "Customer notes"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_123",
    "order_number": "2406110001",
    "order_type": "dine-in",
    "table_number": "T05",
    "total": 110000,
    "payment_status": "paid",
    "order_status": "confirmed",
    "kitchen_status": "pending",
    "cashier_name": "Citra Dewi",
    "items": [
      // ... order items with modifiers
    ]
  }
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

**Response:**
```json
{
  "orders": [
    {
      "id": "order_123",
      "order_number": "2406110001",
      "order_type": "dine-in",
      "table_number": "T05",
      "subtotal": 110000,
      "discount": 0,
      "tax": 0,
      "service_charge": 0,
      "total": 110000,
      "payment_method": "cash",
      "payment_status": "paid",
      "order_status": "confirmed",
      "kitchen_status": "pending",
      "cashier_name": "Citra Dewi",
      "created_at": "2024-06-11T10:30:00.000Z",
      "items": [
        {
          "id": "item_123",
          "product_name": "Ayam Bakar Madu",
          "quantity": 2,
          "unit_price": 55000,
          "subtotal": 110000,
          "notes": "Tanpa cabe",
          "kitchen_status": "pending",
          "modifiers": "..." // JSON array
        }
      ]
    }
  ]
}
```

### GET /orders/:id
Get order by ID

**Response:**
```json
{
  "order": {
    // Same structure as single order in GET /orders
  }
}
```

### PATCH /orders/:id/status
Update order status

**Request:**
```json
{
  "orderStatus": "completed", // optional
  "kitchenStatus": "ready" // optional
}
```

**Response:**
```json
{
  "success": true
}
```

**Order Status Values:**
- `pending` - Order baru dibuat
- `confirmed` - Order dikonfirmasi
- `preparing` - Sedang disiapkan
- `ready` - Siap disajikan
- `completed` - Order selesai
- `cancelled` - Order dibatalkan

**Kitchen Status Values:**
- `pending` - Belum diproses dapur
- `preparing` - Sedang dimasak
- `ready` - Siap disajikan
- `served` - Sudah disajikan

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

**Response:**
```json
{
  "success": true,
  "shift": {
    "id": "shift_123",
    "outlet_id": "demo-outlet",
    "user_id": "user_123",
    "start_cash": 100000,
    "status": "open",
    "started_at": "2024-06-11T08:00:00.000Z",
    "user_name": "Citra Dewi",
    "outlet_name": "Galaxy Mall"
  }
}
```

**Error Response:**
```json
{
  "error": "User already has an open shift",
  "shiftId": "shift_123"
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

**Response:**
```json
{
  "success": true,
  "shift": {
    "id": "shift_123",
    "start_cash": 100000,
    "end_cash": 500000,
    "expected_cash": 480000,
    "variance": 20000,
    "status": "closed",
    "started_at": "2024-06-11T08:00:00.000Z",
    "ended_at": "2024-06-11T16:00:00.000Z"
  }
}
```

### GET /shifts/active
Get active shift for user

**Query Params:**
- `userId` (required): User ID

**Response:**
```json
{
  "shift": {
    // Same structure as start shift response
  }
}
```

Or if no active shift:
```json
{
  "shift": null
}
```

### GET /shifts
Get shift history

**Query Params:**
- `outletId` (optional): Filter by outlet
- `userId` (optional): Filter by user
- `limit` (optional): Limit results (default: 20)

**Response:**
```json
{
  "shifts": [
    {
      "id": "shift_123",
      "start_cash": 100000,
      "end_cash": 500000,
      "expected_cash": 480000,
      "variance": 20000,
      "status": "closed",
      "started_at": "2024-06-11T08:00:00.000Z",
      "ended_at": "2024-06-11T16:00:00.000Z",
      "user_name": "Citra Dewi",
      "outlet_name": "Galaxy Mall",
      "order_count": 45,
      "total_sales": 3800000
    }
  ]
}
```

---

## Dashboard

### GET /dashboard/kpi
Get KPI metrics

**Query Params:**
- `tenantId` (required): Tenant ID
- `outletId` (optional): Filter by outlet
- `dateFrom` (optional): Start date (YYYY-MM-DD)
- `dateTo` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "kpi": {
    "today": {
      "order_count": 45,
      "total_sales": 3800000,
      "avg_order_value": 84444.44
    },
    "yesterday": {
      "total_sales": 3500000
    },
    "growth": "8.6",
    "topProducts": [
      {
        "product_name": "Ayam Bakar Madu",
        "total_qty": 35,
        "total_sales": 1925000
      }
    ],
    "salesByType": [
      {
        "order_type": "dine-in",
        "order_count": 30,
        "total_sales": 2500000
      },
      {
        "order_type": "takeaway",
        "order_count": 10,
        "total_sales": 800000
      },
      {
        "order_type": "gofood",
        "order_count": 5,
        "total_sales": 500000
      }
    ]
  }
}
```

### GET /dashboard/recent-orders
Get recent orders

**Query Params:**
- `tenantId` (required): Tenant ID
- `outletId` (optional): Filter by outlet
- `limit` (optional): Limit results (default: 10)

**Response:**
```json
{
  "orders": [
    // Same structure as GET /orders
  ]
}
```

---

## Error Responses

All endpoints can return these error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
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
  "error": "Internal server error",
  "stack": "..." // only in development
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Will be added in production.

## Authentication

Currently using simple PIN authentication. JWT authentication ready to be implemented:

```typescript
// Add JWT middleware
import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## Testing with cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234"}'

# Get categories
curl "http://localhost:3000/api/categories?tenantId=demo-tenant"

# Get products
curl "http://localhost:3000/api/products?tenantId=demo-tenant&categoryId=cat_123"

# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "demo-tenant",
    "outletId": "demo-outlet",
    "userId": "user_123",
    "orderType": "dine-in",
    "tableNumber": "T05",
    "items": [{
      "productId": "prod_123",
      "productName": "Test Product",
      "quantity": 1,
      "unitPrice": 50000,
      "subtotal": 50000
    }],
    "subtotal": 50000,
    "total": 50000,
    "paymentMethod": "cash"
  }'

# Get orders
curl "http://localhost:3000/api/orders?tenantId=demo-tenant&kitchenStatus=pending"

# Update order status
curl -X PATCH http://localhost:3000/api/orders/order_123/status \
  -H "Content-Type: application/json" \
  -d '{"kitchenStatus":"ready"}'
```

---

**API Version:** 1.0  
**Last Updated:** June 11, 2024
