# Backend API Specification - POS Enhancement

## Overview
Dokumentasi lengkap untuk backend API endpoints yang dibutuhkan untuk melengkapi POS Enhancement.

---

## 1. FAVORITES API

### Base URL
```
/api/favorites
```

### 1.1 Add Favorite
**Endpoint**: `POST /api/favorites`

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "uuid",
  "productId": "uuid",
  "position": 0
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "favorite": {
    "id": "uuid",
    "userId": "uuid",
    "productId": "uuid",
    "position": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response** (400 Bad Request - Max limit):
```json
{
  "success": false,
  "error": "Maximum 50 favorites per user"
}
```

**Validation**:
- userId and productId must be valid UUIDs
- Product must exist
- User must not have more than 50 favorites
- Duplicate favorites not allowed

**SQL**:
```sql
-- Check count
SELECT COUNT(*) FROM favorites WHERE user_id = ?;

-- Insert
INSERT INTO favorites (id, user_id, product_id, position, created_at)
VALUES (uuid_generate_v4(), ?, ?, ?, NOW());
```

---

### 1.2 Get Favorites
**Endpoint**: `GET /api/favorites`

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
```
userId (required): uuid
```

**Response** (200 OK):
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
        "image": "https://...",
        "categoryId": "uuid"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**SQL**:
```sql
SELECT 
  f.id,
  f.user_id,
  f.product_id,
  f.position,
  f.created_at,
  p.name as product_name,
  p.price as product_price,
  p.image as product_image,
  p.category_id as product_category_id
FROM favorites f
JOIN products p ON f.product_id = p.id
WHERE f.user_id = ?
ORDER BY f.position ASC;
```

---

### 1.3 Remove Favorite
**Endpoint**: `DELETE /api/favorites/:id`

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Favorite removed"
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Favorite not found"
}
```

**SQL**:
```sql
DELETE FROM favorites 
WHERE id = ? AND user_id = ?;
```

---

### 1.4 Reorder Favorites
**Endpoint**: `PUT /api/favorites/reorder`

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "uuid",
  "favorites": [
    { "id": "uuid-1", "position": 0 },
    { "id": "uuid-2", "position": 1 },
    { "id": "uuid-3", "position": 2 }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Favorites reordered"
}
```

**SQL** (Transaction):
```sql
BEGIN;

-- Update each favorite position
UPDATE favorites 
SET position = ? 
WHERE id = ? AND user_id = ?;

-- Repeat for all favorites in request

COMMIT;
```

---

## 2. ANALYTICS API

### Base URL
```
/api/analytics
```

### 2.1 Get Top Products
**Endpoint**: `GET /api/analytics/top-products`

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
```
outletId (required): uuid
days (optional, default: 7): integer (1-30)
limit (optional, default: 20): integer (1-50)
```

**Response** (200 OK):
```json
{
  "success": true,
  "period": {
    "days": 7,
    "from": "2024-01-08T00:00:00Z",
    "to": "2024-01-15T23:59:59Z"
  },
  "products": [
    {
      "productId": "uuid",
      "name": "Nasi Goreng",
      "salesCount": 156,
      "revenue": 3900000,
      "image": "https://...",
      "trend": "up",
      "trendPercentage": 23.5
    }
  ],
  "totalSales": 2450,
  "totalRevenue": 125000000
}
```

**Trend Calculation**:
- Compare current period vs previous period
- `up`: increase > 5%
- `down`: decrease > 5%
- `stable`: change ≤ 5%

**SQL**:
```sql
-- Current period sales
WITH current_sales AS (
  SELECT 
    oi.product_id,
    p.name,
    p.image,
    COUNT(*) as sales_count,
    SUM(oi.price * oi.quantity) as revenue
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  JOIN products p ON oi.product_id = p.id
  WHERE o.outlet_id = ?
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    AND o.status = 'completed'
  GROUP BY oi.product_id, p.name, p.image
),
-- Previous period for trend
previous_sales AS (
  SELECT 
    oi.product_id,
    COUNT(*) as prev_sales_count
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.outlet_id = ?
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    AND o.created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    AND o.status = 'completed'
  GROUP BY oi.product_id
)
SELECT 
  cs.product_id,
  cs.name,
  cs.image,
  cs.sales_count,
  cs.revenue,
  COALESCE(ps.prev_sales_count, 0) as prev_sales_count,
  CASE
    WHEN ps.prev_sales_count IS NULL OR ps.prev_sales_count = 0 THEN 'new'
    WHEN ((cs.sales_count - ps.prev_sales_count) / ps.prev_sales_count * 100) > 5 THEN 'up'
    WHEN ((cs.sales_count - ps.prev_sales_count) / ps.prev_sales_count * 100) < -5 THEN 'down'
    ELSE 'stable'
  END as trend,
  CASE
    WHEN ps.prev_sales_count IS NULL OR ps.prev_sales_count = 0 THEN 0
    ELSE ((cs.sales_count - ps.prev_sales_count) / ps.prev_sales_count * 100)
  END as trend_percentage
FROM current_sales cs
LEFT JOIN previous_sales ps ON cs.product_id = ps.product_id
ORDER BY cs.sales_count DESC
LIMIT ?;
```

**Fallback Logic**:
```
IF outlet transactions < 100 IN period:
  Query tenant-level aggregated data
  Filter by tenant_id instead of outlet_id
```

---

## 3. SETTINGS API

### Base URL
```
/api/outlets/:outletId/settings
```

### 3.1 Get Settings
**Endpoint**: `GET /api/outlets/:outletId/settings`

**Request Headers**:
```
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "settings": {
    "receipt": {
      "logo": "https://storage.supabase.co/...",
      "headerText": "Welcome to Our Restaurant",
      "footerText": "Thank you for your visit!",
      "fontSize": "medium",
      "qrCode": {
        "enabled": true,
        "url": "https://feedback.example.com"
      },
      "socialMedia": {
        "facebook": "https://facebook.com/...",
        "instagram": "https://instagram.com/...",
        "twitter": "",
        "tiktok": ""
      },
      "promoMessages": [
        "Get 20% off on weekdays!",
        "Free dessert with main course"
      ]
    },
    "customerDisplay": {
      "backgroundColor": "#1a1a1a",
      "textColor": "#ffffff",
      "accentColor": "#f59e0b",
      "restaurantName": "My Restaurant",
      "tagline": "Best Food in Town",
      "promoImages": [
        "https://storage.supabase.co/promo1.jpg",
        "https://storage.supabase.co/promo2.jpg"
      ]
    }
  }
}
```

**SQL**:
```sql
SELECT settings_json 
FROM outlet_settings 
WHERE outlet_id = ?;
```

---

### 3.2 Update Settings
**Endpoint**: `PUT /api/outlets/:outletId/settings`

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body**: Same as GET response structure

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Settings updated",
  "settings": { /* updated settings */ }
}
```

**Validation**:
- headerText: max 200 characters
- footerText: max 300 characters
- promoMessages: max 3 items, 150 characters each
- fontSize: enum ["small", "medium", "large"]
- URLs: valid HTTPS format
- Social media URLs: match platform domains

**SQL**:
```sql
INSERT INTO outlet_settings (outlet_id, settings_json, updated_at)
VALUES (?, ?, NOW())
ON CONFLICT (outlet_id) 
DO UPDATE SET 
  settings_json = EXCLUDED.settings_json,
  updated_at = NOW();
```

---

### 3.3 Upload Logo
**Endpoint**: `POST /api/outlets/:outletId/upload-logo`

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
```

**Request Body** (FormData):
```
logo: File (PNG/JPG/SVG, max 2MB)
```

**Response** (200 OK):
```json
{
  "success": true,
  "url": "https://storage.supabase.co/logos/outlet-uuid/logo.png"
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "File size exceeds 2MB" | "Invalid file type"
}
```

**Implementation**:
```javascript
const sharp = require('sharp');
const { Storage } = require('@supabase/storage-js');

async function uploadLogo(file, outletId) {
  // Validate
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('File size exceeds 2MB');
  }

  const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!validTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }

  // Resize to 200px width (maintain aspect ratio)
  let buffer = file.buffer;
  if (file.mimetype !== 'image/svg+xml') {
    buffer = await sharp(file.buffer)
      .resize({ width: 200, withoutEnlargement: true })
      .toBuffer();
  }

  // Upload to Supabase Storage
  const fileName = `logos/${outletId}/logo.${file.mimetype.split('/')[1]}`;
  const { data, error } = await storage
    .from('receipts')
    .upload(fileName, buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) throw error;

  // Get public URL
  const { publicURL } = storage
    .from('receipts')
    .getPublicUrl(fileName);

  return publicURL;
}
```

---

### 3.4 Upload Promo Images
**Endpoint**: `POST /api/outlets/:outletId/upload-promo-images`

**Request Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
```

**Request Body**:
```
images[]: File[] (max 10 images, 5MB each, JPG/PNG only)
```

**Response** (200 OK):
```json
{
  "success": true,
  "urls": [
    "https://storage.supabase.co/promos/outlet-uuid/promo1.jpg",
    "https://storage.supabase.co/promos/outlet-uuid/promo2.jpg"
  ]
}
```

**Validation**:
- Max 10 images
- Each max 5MB
- JPG/PNG only
- Optimize/compress before upload

---

## 4. DATABASE SCHEMA

### Tables to Create/Modify

#### favorites table
```sql
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_position ON favorites(user_id, position);
```

#### outlet_settings table
```sql
CREATE TABLE IF NOT EXISTS outlet_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(outlet_id)
);

CREATE INDEX idx_outlet_settings_outlet_id ON outlet_settings(outlet_id);
```

---

## 5. IMPLEMENTATION CHECKLIST

### Backend Developer Tasks

#### Phase 1: Favorites (Day 1)
- [ ] Create favorites table
- [ ] Implement POST /api/favorites
- [ ] Implement GET /api/favorites
- [ ] Implement DELETE /api/favorites/:id
- [ ] Implement PUT /api/favorites/reorder
- [ ] Add max 50 validation
- [ ] Test with Postman/Insomnia

#### Phase 2: Analytics (Day 2)
- [ ] Implement GET /api/analytics/top-products
- [ ] Add trend calculation logic
- [ ] Implement tenant-level fallback
- [ ] Add caching (6 hours)
- [ ] Test with various date ranges

#### Phase 3: Settings (Day 2-3)
- [ ] Create outlet_settings table
- [ ] Implement GET /api/outlets/:id/settings
- [ ] Implement PUT /api/outlets/:id/settings
- [ ] Setup Supabase Storage bucket
- [ ] Implement POST /api/outlets/:id/upload-logo
- [ ] Add image resize logic (sharp)
- [ ] Implement POST /api/outlets/:id/upload-promo-images
- [ ] Test file uploads

#### Phase 4: Testing & Documentation (Day 3)
- [ ] Write API tests (Jest/Mocha)
- [ ] Test error scenarios
- [ ] Test with large datasets
- [ ] Document API endpoints
- [ ] Create Postman collection
- [ ] Deploy to staging

---

## 6. ENVIRONMENT VARIABLES

Add to `.env`:
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
SUPABASE_STORAGE_BUCKET=receipts

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/svg+xml

# Analytics
ANALYTICS_CACHE_TTL=21600  # 6 hours in seconds
MIN_TRANSACTIONS_FOR_OUTLET_ANALYTICS=100
```

---

## 7. ERROR CODES

Standardized error responses:

```javascript
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Error Codes**:
- `FAVORITES_LIMIT_EXCEEDED` - Max 50 favorites
- `FAVORITE_NOT_FOUND` - Favorite doesn't exist
- `FAVORITE_ALREADY_EXISTS` - Duplicate favorite
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_FILE_TYPE` - Wrong file format
- `PRODUCT_NOT_FOUND` - Product doesn't exist
- `UNAUTHORIZED` - Invalid/missing auth token
- `VALIDATION_ERROR` - Request validation failed

---

## 8. RATE LIMITING

Recommended rate limits:

```javascript
// Favorites
POST /api/favorites         - 10 req/min
DELETE /api/favorites/:id   - 20 req/min
PUT /api/favorites/reorder  - 5 req/min

// Analytics (cached)
GET /api/analytics/*        - 30 req/min

// Settings
GET /api/outlets/*/settings - 60 req/min
PUT /api/outlets/*/settings - 10 req/min

// Uploads
POST /api/outlets/*/upload-* - 5 req/min
```

---

## 9. TESTING EXAMPLES

### cURL Examples

```bash
# Add favorite
curl -X POST https://api.nashty.com/api/favorites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "productId": "product-uuid",
    "position": 0
  }'

# Get top products
curl -X GET "https://api.nashty.com/api/analytics/top-products?outletId=outlet-uuid&days=7" \
  -H "Authorization: Bearer $TOKEN"

# Upload logo
curl -X POST https://api.nashty.com/api/outlets/outlet-uuid/upload-logo \
  -H "Authorization: Bearer $TOKEN" \
  -F "logo=@/path/to/logo.png"
```

---

**Document Version**: 1.0
**Last Updated**: ${new Date().toISOString()}
**Status**: Ready for Implementation
