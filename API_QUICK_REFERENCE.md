# 🚀 Pure Supabase API Quick Reference

**Base URL**: `https://mzucfndifneytbesirkx.supabase.co`  
**Edge Functions**: `/functions/v1`  
**Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg`

---

## 🔐 Authentication

### 1. Main Login (Admin/Manager)
```javascript
POST /functions/v1/auth-login
{
  "action": "main-login",
  "username": "admin@nashty.com",
  "password": "password123"
}
```

### 2. PIN Login (Staff/Cashier)
```javascript
POST /functions/v1/auth-login
{
  "action": "pin-login",
  "pin": "1234",
  "outletId": "uuid-outlet-id"
}
```

### 3. Token Refresh
```javascript
POST /functions/v1/auth-login
{
  "action": "refresh",
  "refreshToken": "your-refresh-token"
}
```

---

## 🛒 Orders

### 1. Create Order
```javascript
POST /functions/v1/orders-api
{
  "action": "create",
  "tenantId": "uuid",
  "outletId": "uuid",
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "productName": "Nasi Goreng",
      "quantity": 2,
      "unitPrice": 25000
    }
  ],
  "subtotal": 50000,
  "tax": 5000,
  "grandTotal": 55000,
  "paymentMethod": "cash"
}
```

### 2. Get Orders
```javascript
POST /functions/v1/orders-api
{
  "action": "get-orders",
  "tenantId": "uuid",
  "outletId": "uuid",
  "status": "completed",
  "startDate": "2024-06-01",
  "endDate": "2024-06-30"
}
```

### 3. Update Order Status
```javascript
POST /functions/v1/orders-api
{
  "action": "update-status",
  "orderId": "uuid",
  "orderStatus": "completed",
  "kitchenStatus": "served"
}
```

---

## 📊 Dashboard

### 1. Get KPIs
```javascript
POST /functions/v1/dashboard-api
{
  "action": "kpi",
  "tenantId": "uuid",
  "outletId": "uuid",
  "startDate": "2024-06-01",
  "endDate": "2024-06-30"
}
```

### 2. Recent Orders
```javascript
POST /functions/v1/dashboard-api
{
  "action": "recent-orders",
  "tenantId": "uuid",
  "outletId": "uuid",
  "limit": 10
}
```

### 3. Weekly Chart
```javascript
POST /functions/v1/dashboard-api
{
  "action": "weekly-chart",
  "tenantId": "uuid",
  "outletId": "uuid"
}
```

---

## 📈 Reports

### 1. Sales Report
```javascript
POST /functions/v1/reports-api
{
  "action": "sales",
  "tenantId": "uuid",
  "outletId": "uuid",
  "startDate": "2024-06-01",
  "endDate": "2024-06-30",
  "groupBy": "day"
}
```

### 2. Top Products
```javascript
POST /functions/v1/reports-api
{
  "action": "top-products",
  "tenantId": "uuid",
  "outletId": "uuid",
  "startDate": "2024-06-01",
  "endDate": "2024-06-30",
  "limit": 20
}
```

---

## ⭐ Favorites

### 1. Get Favorites
```javascript
GET /functions/v1/favorites-api?action=get&userId=uuid
```

### 2. Add Favorite
```javascript
POST /functions/v1/favorites-api
{
  "action": "add",
  "userId": "uuid",
  "productId": "uuid",
  "position": 0
}
```

### 3. Remove Favorite
```javascript
DELETE /functions/v1/favorites-api?action=remove&id=uuid
```

### 4. Reorder Favorites
```javascript
POST /functions/v1/favorites-api
{
  "action": "reorder",
  "userId": "uuid",
  "favorites": [
    { "id": "uuid1", "position": 0 },
    { "id": "uuid2", "position": 1 }
  ]
}
```

---

## 📊 Analytics

### Get Top Products (Cached 6h)
```javascript
GET /functions/v1/analytics-api?outletId=uuid&days=7&limit=20
```

**Response**:
```javascript
{
  "success": true,
  "period": {
    "days": 7,
    "from": "2024-06-14T00:00:00Z",
    "to": "2024-06-21T00:00:00Z"
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

---

## ⚙️ Settings

### 1. Get Outlet Settings
```javascript
GET /functions/v1/settings-api?action=get&outletId=uuid
```

### 2. Update Settings
```javascript
POST /functions/v1/settings-api
{
  "action": "update",
  "outletId": "uuid",
  "settings": {
    "receipt": {
      "logo": "https://...",
      "headerText": "Welcome!",
      "footerText": "Thank you!",
      "fontSize": "medium"
    },
    "customerDisplay": {
      "backgroundColor": "#1a1a1a",
      "textColor": "#ffffff"
    }
  }
}
```

---

## 📤 File Upload (Direct to Supabase Storage)

### Upload Logo
```javascript
// Use Supabase client directly
const { data, error } = await supabase.storage
  .from('receipts')
  .upload(`logos/${outletId}/logo.jpg`, file, { upsert: true });

const { data: urlData } = supabase.storage
  .from('receipts')
  .getPublicUrl(`logos/${outletId}/logo.jpg`);

console.log(urlData.publicUrl); // Use this URL
```

### Upload Promo Images
```javascript
const { data, error } = await supabase.storage
  .from('promotions')
  .upload(`promos/${outletId}/promo-${Date.now()}.jpg`, file);

const { data: urlData } = supabase.storage
  .from('promotions')
  .getPublicUrl(data.path);
```

---

## 🔧 Direct Supabase Queries (via API Client)

### Products
```javascript
// Get all products
const { data } = await API.supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId);

// Create product
const { data } = await API.supabase
  .from('products')
  .insert([{ name: 'New Product', price: 50000, tenant_id: tenantId }])
  .select();
```

### Categories
```javascript
// Get all categories
const { data } = await API.supabase
  .from('categories')
  .select('*')
  .eq('tenant_id', tenantId);
```

### Users
```javascript
// Get staff
const { data } = await API.supabase
  .from('users')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('outlet_id', outletId);
```

---

## 📦 Using API Client v3

### Initialize
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/api-client-v3-pure-supabase.js"></script>
```

### Main Auth
```javascript
// Login
const result = await API.mainAuth.login('admin@nashty.com', 'password123');

// Logout
API.mainAuth.logout();

// Restore session
if (API.mainAuth.restoreSession()) {
  console.log('Logged in as:', API.session.admin);
}
```

### Staff Auth
```javascript
// Get staff list
const { staff } = await API.auth.getStaff(outletId);

// PIN login
const result = await API.auth.login('1234', outletId);

// Logout
await API.auth.logout();
```

### Orders
```javascript
// Create order
const result = await API.orders.create({
  items: [...],
  subtotal: 50000,
  tax: 5000,
  grandTotal: 55000,
  paymentMethod: 'cash'
});

// Get orders
const { orders } = await API.orders.getAll({
  status: 'completed',
  startDate: '2024-06-01',
  endDate: '2024-06-30'
});
```

### Favorites
```javascript
// Get all
const { favorites } = await API.favorites.getAll();

// Add
await API.favorites.add(productId, position);

// Remove
await API.favorites.remove(favoriteId);

// Reorder
await API.favorites.reorder([
  { id: 'uuid1', position: 0 },
  { id: 'uuid2', position: 1 }
]);
```

### Analytics
```javascript
const { products, totalSales, totalRevenue } = await API.analytics.getTopProducts(
  outletId, // optional, uses session.outletId
  7,        // days
  20        // limit
);
```

### Settings
```javascript
// Get settings
const { settings } = await API.outletSettings.get(outletId);

// Update settings
await API.outletSettings.update(settingsObject, outletId);

// Upload logo
const { url } = await API.outletSettings.uploadLogo(file, outletId);

// Upload promo images
const { urls } = await API.outletSettings.uploadPromoImages([file1, file2], outletId);
```

---

## 🔒 Headers Required

### All Edge Function Requests
```javascript
{
  'Content-Type': 'application/json',
  'apikey': 'YOUR_SUPABASE_ANON_KEY',
  'Authorization': 'Bearer YOUR_JWT_TOKEN' // Optional for some endpoints
}
```

### Supabase Storage Requests
```javascript
{
  'apikey': 'YOUR_SUPABASE_ANON_KEY',
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

---

## 📍 Storage Buckets

### Receipts Bucket
- **Purpose**: Logo uploads for receipts
- **Max Size**: 2MB per file
- **Allowed**: PNG, JPG, SVG, WebP
- **Public**: Yes (read-only)
- **Path**: `receipts/logos/{outletId}/logo.{ext}`

### Promotions Bucket
- **Purpose**: Promotional images for customer display
- **Max Size**: 5MB per file
- **Allowed**: PNG, JPG, WebP
- **Public**: Yes (read-only)
- **Path**: `promotions/promos/{outletId}/promo-{timestamp}.{ext}`

---

## 🐛 Error Handling

### Common Error Responses
```javascript
// 400 Bad Request
{
  "error": "userId required",
  "code": "MISSING_PARAMETER"
}

// 401 Unauthorized
{
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}

// 403 Forbidden
{
  "error": "Maximum 50 favorites per user",
  "code": "FAVORITES_LIMIT_EXCEEDED"
}

// 500 Internal Server Error
{
  "error": "Database connection failed"
}
```

### Handling in Code
```javascript
try {
  const result = await API.favorites.add(productId);
  if (result.success) {
    console.log('Favorite added!');
  }
} catch (error) {
  if (error.message.includes('FAVORITES_LIMIT_EXCEEDED')) {
    alert('Maximum 50 favorites reached');
  } else {
    console.error('Error:', error);
  }
}
```

---

## 🚀 Quick Test Commands (curl)

```bash
# Test auth
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"action":"test"}'

# Test favorites
curl "https://mzucfndifneytbesirkx.supabase.co/functions/v1/favorites-api?action=get&userId=USER_ID" \
  -H "apikey: YOUR_ANON_KEY"

# Test analytics
curl "https://mzucfndifneytbesirkx.supabase.co/functions/v1/analytics-api?outletId=OUTLET_ID&days=7" \
  -H "apikey: YOUR_ANON_KEY"
```

---

**Quick Reference Updated**: 2024-06-21  
**API Version**: v3 (Pure Supabase)  
**Status**: ✅ All endpoints deployed and ready
