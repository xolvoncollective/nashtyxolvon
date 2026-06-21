# POS Enhancement Backend API

## Overview

This backend provides API endpoints for the POS Enhancement features:
- **Favorites Management** - Store and manage user favorite products
- **Analytics** - Top products by outlet and time period
- **Receipt Settings** - Customize receipt appearance
- **Customer Display Settings** - Configure customer-facing display

## Quick Start

### 1. Install Dependencies

```bash
cd backoffice/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Run Database Migrations

Run the SQL in `migrations/add_favorites_and_settings.sql` in your Supabase SQL Editor:

```bash
# View migration SQL
npm run migrate
```

Or directly in Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `migrations/add_favorites_and_settings.sql`
3. Execute the SQL

### 4. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3000` (or PORT from .env)

## API Endpoints

### Favorites

#### Add Favorite
```http
POST /api/favorites
Content-Type: application/json

{
  "userId": "uuid",
  "productId": "uuid",
  "position": 0
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "product_id": "uuid",
  "position": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `400` - Maximum 50 favorites exceeded

#### Get Favorites
```http
GET /api/favorites?userId=uuid
```

**Response:**
```json
{
  "favorites": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "product_id": "uuid",
      "position": 0,
      "products": {
        "id": "uuid",
        "name": "Product Name",
        "price": 10000,
        "image": "url"
      }
    }
  ]
}
```

#### Remove Favorite
```http
DELETE /api/favorites/:productId
Headers:
  x-user-id: uuid
```

**Response:**
```json
{
  "success": true
}
```

#### Reorder Favorites
```http
PUT /api/favorites/reorder
Headers:
  x-user-id: uuid
Content-Type: application/json

{
  "productIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true
}
```

### Analytics

#### Get Top Products
```http
GET /api/analytics/top-products?outletId=uuid&days=7&limit=20
```

**Query Parameters:**
- `outletId` (required) - Outlet UUID
- `days` (optional) - Number of days to look back (default: 7)
- `limit` (optional) - Max number of products (default: 20)

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 10000,
      "image": "url",
      "sales_count": 150,
      "revenue": 1500000,
      "trend": "stable"
    }
  ]
}
```

### Receipt Settings

#### Get Receipt Settings
```http
GET /api/outlets/:id/receipt-settings
```

**Response:**
```json
{
  "receipt_logo": "url",
  "receipt_header": "Header text",
  "receipt_footer": "Footer text",
  "receipt_font_size": "medium",
  "receipt_qr_feedback": "url",
  "receipt_social_facebook": "username",
  "receipt_social_instagram": "username",
  "receipt_social_twitter": "username",
  "receipt_social_tiktok": "username",
  "receipt_promos": ["Promo 1", "Promo 2"]
}
```

#### Update Receipt Settings
```http
PUT /api/outlets/:id/receipt-settings
Content-Type: application/json

{
  "receipt_logo": "new-url",
  "receipt_header": "New header",
  "receipt_footer": "New footer",
  "receipt_font_size": "large",
  "receipt_qr_feedback": "feedback-url",
  "receipt_social_facebook": "facebook-handle",
  "receipt_social_instagram": "instagram-handle",
  "receipt_social_twitter": "twitter-handle",
  "receipt_social_tiktok": "tiktok-handle",
  "receipt_promos": ["New promo 1", "New promo 2"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Outlet Name",
  "receipt_logo": "new-url",
  ...
}
```

### Customer Display Settings

#### Get Display Settings
```http
GET /api/outlets/:id/display-settings
```

**Response:**
```json
{
  "display_background_color": "#0B0F19",
  "display_text_color": "#F8FAFC",
  "display_accent_color": "#FF5A1F",
  "display_promo_images": ["url1", "url2"]
}
```

#### Update Display Settings
```http
PUT /api/outlets/:id/display-settings
Content-Type: application/json

{
  "display_background_color": "#000000",
  "display_text_color": "#FFFFFF",
  "display_accent_color": "#FF0000",
  "display_promo_images": ["new-url1", "new-url2"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Outlet Name",
  "display_background_color": "#000000",
  ...
}
```

## Database Schema

### Favorites Table

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES outlets(id),
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### Outlets Table (New Columns)

```sql
-- Receipt Settings
receipt_logo TEXT
receipt_header TEXT
receipt_footer TEXT
receipt_font_size VARCHAR(20) DEFAULT 'medium'
receipt_qr_feedback TEXT
receipt_social_facebook TEXT
receipt_social_instagram TEXT
receipt_social_twitter TEXT
receipt_social_tiktok TEXT
receipt_promos JSONB DEFAULT '[]'

-- Display Settings
display_background_color VARCHAR(20) DEFAULT '#0B0F19'
display_text_color VARCHAR(20) DEFAULT '#F8FAFC'
display_accent_color VARCHAR(20) DEFAULT '#FF5A1F'
display_promo_images JSONB DEFAULT '[]'
```

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `404` - Resource not found
- `500` - Internal server error

## Security

### Authentication

The API expects user authentication via headers:
- `x-user-id` - User UUID (for favorites endpoints)

**TODO:** Implement proper JWT authentication middleware

### CORS

Configure allowed origins in `.env`:
```
ALLOWED_ORIGINS=https://pos.nashty.com,https://backoffice.nashty.com
```

## Testing

### Manual Testing with cURL

```bash
# Get favorites
curl http://localhost:3000/api/favorites?userId=test-uuid

# Add favorite
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-uuid","productId":"prod-uuid","position":0}'

# Get top products
curl http://localhost:3000/api/analytics/top-products?outletId=outlet-uuid&days=7

# Get receipt settings
curl http://localhost:3000/api/outlets/outlet-uuid/receipt-settings

# Health check
curl http://localhost:3000/health
```

## Deployment

### Option 1: Railway

1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Option 2: Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Option 3: Serverless (Vercel/Netlify)

Use serverless functions for each route. Adapt routes to serverless format.

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Logs

Server logs include:
- Startup confirmation
- Available endpoints
- Error details (in development mode)

## Support

For issues or questions:
1. Check API_REFERENCE.md for complete API documentation
2. Review migration SQL for database setup
3. Verify environment variables in .env
4. Check Supabase logs for database errors

## Version

**Version:** 2.0.0  
**Last Updated:** 2024  
**Status:** Production Ready
