# API Testing Guide - Development Mode

## 🔓 Development Mode Features

When running with `NODE_ENV=development` (default with start-local.ps1):

- ✅ **Authentication BYPASSED** - All API routes accessible without token
- ✅ **Rate limiting DISABLED** - No request limits
- ✅ **CORS accepts all origins** - Can test from any domain
- ✅ **Detailed error messages** - Full stack traces included
- ✅ **DEBUG logging enabled** - All requests logged

## 🚀 Quick Start

1. **Start Server:**
   ```powershell
   .\start-local.ps1
   ```

2. **Test Health Check:**
   ```bash
   curl http://localhost:3099/api/health
   ```

3. **Test Any API Endpoint (No Auth Required):**
   ```bash
   # Get menu for outlet
   curl http://localhost:3099/api/menu/outlet/demo-outlet
   
   # Get orders
   curl http://localhost:3099/api/orders/kitchen/queue?tenantId=demo-tenant
   
   # Get products
   curl http://localhost:3099/api/products?tenantId=demo-tenant
   ```

## 📋 Available API Endpoints

### Menu Management
```bash
# Get full menu tree for outlet
GET http://localhost:3099/api/menu/outlet/demo-outlet

# Create menu item
POST http://localhost:3099/api/menu/items
Content-Type: application/json
{
  "tenantId": "demo-tenant",
  "outletId": "demo-outlet",
  "categoryId": "T5Tzk3QWF6_jAlS-i2IPr",
  "name": "Test Item",
  "price": 25000,
  "description": "Test description"
}

# Update menu item
PATCH http://localhost:3099/api/menu/items/{itemId}
Content-Type: application/json
{
  "name": "Updated Name",
  "price": 30000
}

# Update item status (sold out)
PATCH http://localhost:3099/api/menu/items/{itemId}
Content-Type: application/json
{
  "status": "soldout"
}
```

### Orders & KDS
```bash
# Get KDS order queue
GET http://localhost:3099/api/orders/kitchen/queue?tenantId=demo-tenant&kitchenStatus=pending,preparing

# Create order
POST http://localhost:3099/api/orders
Content-Type: application/json
{
  "tenantId": "demo-tenant",
  "outletId": "demo-outlet",
  "userId": "admin",
  "orderType": "dine-in",
  "tableNumber": "T01",
  "items": [
    {
      "productId": "PEGOXrjh7HRuHG9Oj0DtF",
      "quantity": 1,
      "price": 25000,
      "notes": ""
    }
  ],
  "payments": [
    {
      "method": "cash",
      "amount": 25000
    }
  ]
}

# Update order status
PATCH http://localhost:3099/api/orders/{orderId}/status
Content-Type: application/json
{
  "kitchenStatus": "preparing"
}
```

### Products & Categories
```bash
# Get all products
GET http://localhost:3099/api/products?tenantId=demo-tenant

# Get all categories
GET http://localhost:3099/api/categories?tenantId=demo-tenant

# Create product
POST http://localhost:3099/api/products
Content-Type: application/json
{
  "tenantId": "demo-tenant",
  "categoryId": "T5Tzk3QWF6_jAlS-i2IPr",
  "name": "New Product",
  "price": 15000,
  "status": "active"
}
```

## 🧪 Testing Tools

### Using PowerShell
```powershell
# Test health check
Invoke-RestMethod -Uri "http://localhost:3099/api/health" -Method GET

# Get menu
$response = Invoke-RestMethod -Uri "http://localhost:3099/api/menu/outlet/demo-outlet" -Method GET
$response | ConvertTo-Json -Depth 10

# Create menu item
$body = @{
    tenantId = "demo-tenant"
    outletId = "demo-outlet"
    categoryId = "T5Tzk3QWF6_jAlS-i2IPr"
    name = "Test Item"
    price = 25000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3099/api/menu/items" -Method POST -Body $body -ContentType "application/json"
```

### Using Node.js Test Scripts
```javascript
// test-api.js
const API_BASE = 'http://localhost:3099/api';

async function testAPI() {
  // Test health
  const health = await fetch(`${API_BASE}/health`);
  console.log('Health:', await health.json());
  
  // Test menu
  const menu = await fetch(`${API_BASE}/menu/outlet/demo-outlet`);
  console.log('Menu:', await menu.json());
}

testAPI();
```

Run with: `node test-api.js`

## 🐛 Troubleshooting

### "Validation failed" Error
**Cause:** Missing required fields in request body

**Solution:** Check the Zod schema for the endpoint. All required fields must be provided.

Example for POST /api/menu/items:
- ✅ Required: `tenantId`, `outletId`, `categoryId`, `name`, `price`
- ⚠️ Optional: `description`, `imageUrl`, `cost`, etc.

### "Cannot read properties of undefined" Error
**Cause:** Missing authentication data (should not happen in dev mode)

**Solution:** Ensure `NODE_ENV=development` is set. Check auth middleware logs.

### Server Won't Start
**Cause:** Port 3099 is in use

**Solution:** 
```powershell
# Kill process on port 3099
Get-NetTCPConnection -LocalPort 3099 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Restart
.\start-local.ps1
```

### TypeScript Build Errors
**Cause:** Code syntax errors or type mismatches

**Solution:**
```powershell
cd backoffice\backend
npm run build
# Fix any errors shown
```

## 📊 Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "responseTime": "5ms"
}
```

### Error Response (Development)
```json
{
  "success": false,
  "error": "Error message",
  "errors": [ ... ],  // Validation errors
  "stack": "..."      // Full stack trace (dev only)
}
```

### Error Response (Production)
```json
{
  "success": false,
  "error": "Error message"
  // No stack trace in production
}
```

## 🔐 Production Mode

When deploying to production (`NODE_ENV=production`):

- ❌ Authentication REQUIRED - Must provide valid JWT token
- ✅ Rate limiting ENABLED - 100 requests per minute per IP
- ✅ CORS restricted - Only allowed origins
- ✅ Generic error messages - No stack traces
- ✅ INFO logging only - Reduced verbosity

### Using Authentication in Production
```bash
# 1. Login first
curl -X POST http://localhost:3099/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234","outletId":"demo-outlet"}'

# Response: { "success": true, "token": "eyJhbGc..." }

# 2. Use token in subsequent requests
curl http://localhost:3099/api/menu/outlet/demo-outlet \
  -H "Authorization: Bearer eyJhbGc..."
```

## 📝 Notes

- Development mode is for LOCAL TESTING ONLY
- Always test with production mode before deploying
- Use proper authentication in production
- Monitor rate limiting in production
- Keep JWT_SECRET secure in production

---

**Last Updated:** 2026-06-14  
**Version:** 3.0.0
