# NASHTY OS Deployment Guide

## 🌐 System Architecture

**Version:** 2.0 - Cloud Ready  
**Features:** Main Login Page, Admin Authentication, Supabase, Cloudflare Hosting

### Architecture Overview
```
┌─────────────────────────────────────────────────────┐
│                  Cloudflare Pages                    │
│  (Static Frontend: HTML, CSS, JS)                   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│               Vercel / Render.com                    │
│  (Node.js Backend API)                              │
│  • Main Auth API (admin/admin)                      │
│  • Staff PIN Auth                                   │
│  • Database API                                     │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                  Supabase Cloud                      │
│  • PostgreSQL Database                              │
│  • Row Level Security                               │
│  • Real-time subscriptions                          │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Deployment Steps

### 1. **Setup Supabase Database**
```sql
-- Run the migration script in Supabase SQL Editor
-- File: supabase-migration.sql
```

**Supabase Connection Details:**
- **URL:** https://mzucfndifneytbesirkx.supabase.co
- **Database:** PostgreSQL
- **Port:** 5432
- **Username:** postgres
- **Password:** ZaidunkMarginpublishable

**API Keys:**
- **Anon Key:** sb_publishable_OWaFhWTRVli8XZfIYmqpfg_aHCxBJYj
- **Service Role Key:** sb_secret_6XFZqLgu52yyoX4uZ0thZA_CMHQM1H7

### 2. **Configure Environment Variables**
Create `.env` file in `backoffice/backend/`:

```env
# Supabase Configuration
SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_OWaFhWTRVli8XZfIYmqpfg_aHCxBJYj
SUPABASE_SERVICE_ROLE_KEY=sb_secret_6XFZqLgu52yyoX4uZ0thZA_CMHQM1H7

# Database Configuration
SUPABASE_DB_HOST=db.mzucfndifneytbesirkx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=ZaidunkMarginpublishable
SUPABASE_DB_SSL=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-2026

# Server Configuration
PORT=3099
CORS_ORIGIN=https://your-domain.com
NODE_ENV=production

# Admin Credentials (Change these in production!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

### 3. **Deploy Backend API**

#### Option A: Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy backend
cd backoffice/backend
vercel
```

#### Option B: Render.com Deployment
1. Create new Web Service on Render
2. Connect GitHub repository
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Set environment variables from Step 2

### 4. **Deploy Frontend to Cloudflare Pages**

#### Deploy Static Files:
1. Go to Cloudflare Pages
2. Connect GitHub repository `zaidunk/himapatokayam`
3. Build settings:
   - **Build command:** `echo "No build required"`
   - **Build output directory:** `.`
4. Add environment variables:
   - `API_BASE_URL` = Your backend API URL

#### Custom Domain (Optional):
1. Add custom domain in Cloudflare Pages
2. Update CORS in backend: `CORS_ORIGIN=https://your-domain.com`

### 5. **Update API Client Configuration**
Edit `api-client-v2.js`:
```javascript
const API_BASE = 'https://your-backend-api.vercel.app/api';
// or
const API_BASE = 'https://your-backend-api.onrender.com/api';
```

---

## 🔐 Authentication System

### Main Login Page (`index.html`)
- **URL:** `/` (root path)
- **Default Credentials:** admin/admin
- **Session Duration:** 12 hours
- **Features:**
  - Choose between POS, KDS, or Backoffice
  - Admin authentication
  - Auto-redirect with valid session
  - Server status indicator

### Session Flow
1. User visits main page (`/`)
2. Selects app (POS/KDS/Backoffice)
3. Enters admin credentials (admin/admin)
4. Gets 12-hour session token
5. Redirected to selected app with session
6. Session persists in localStorage

### Admin vs Staff Authentication
- **Admin Auth:** Main login page → 12-hour session → Access all apps
- **Staff Auth:** PIN-based (1234, 2345, 3456, 0000) → Per-app access

---

## 🗄️ Database Migration

### From SQLite to Supabase PostgreSQL
1. **Schema Migration:** Run `supabase-migration.sql`
2. **Data Migration:** Use the included script (to be created)
3. **Indexes:** Automatically created
4. **RLS:** Row Level Security enabled

### Demo Data Included
- **Tenant:** Demo Tenant (demo-tenant)
- **Outlet:** Demo Outlet (demo-outlet)
- **Users:**
  - Citra Dewi (Cashier) - PIN: 1234
  - Budi Santoso (Cashier) - PIN: 2345
  - Ani Kitchen (Chef) - PIN: 3456
  - Admin Demo (Owner) - PIN: 0000

---

## 📁 File Structure for Deployment

```
himapatokayam/
├── index.html                    # Main login page
├── api-client-v2.js              # Enhanced API client
├── api-client.js                 # Legacy API client (backwards compatible)
├── pos/frontend/                 # POS app
├── kds/frontend/                 # KDS app
├── backoffice/frontend/          # Backoffice app
├── backoffice/backend/           # Node.js backend API
│   ├── .env                      # Environment variables
│   ├── package.json              # Dependencies
│   ├── src/
│   │   ├── index.ts             # Main server
│   │   ├── routes/main-auth.ts  # Admin auth
│   │   ├── supabase/            # Supabase client
│   │   └── ...                  # Other routes
├── supabase-migration.sql        # Database schema
├── DEPLOYMENT_GUIDE.md           # This file
└── README.md                     # Project overview
```

---

## 🔧 Development vs Production

### Development (Local)
```bash
# Start backend
cd backoffice/backend
npm run dev

# Access at:
# Main Page: http://localhost:3099/
# POS: http://localhost:3099/pos/frontend/index.html
# API: http://localhost:3099/api/...
```

### Production (Cloud)
- **Frontend:** Cloudflare Pages (Static)
- **Backend:** Vercel/Render (Node.js)
- **Database:** Supabase (PostgreSQL)

---

## 🧪 Testing Deployment

### 1. Test Main Login
```bash
# Check main page
curl https://your-domain.com/health
# Should return: {"status":"ok","version":"2.0"}

# Test admin login
curl -X POST https://your-api.com/api/main/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### 2. Test Database Connection
```bash
# Check Supabase connection
curl https://your-api.com/api/health
# Should show Supabase status
```

### 3. Test App Access
1. Visit `https://your-domain.com/`
2. Login with admin/admin
3. Select an app (POS/KDS/Backoffice)
4. Verify session persists

---

## 🔒 Security Considerations

### 1. Change Default Credentials
```env
# In production .env file:
ADMIN_USERNAME=your-secure-username
ADMIN_PASSWORD=your-strong-password
```

### 2. JWT Secret
- Generate strong JWT secret
- Keep it secure, never commit to Git
- Use environment variables

### 3. CORS Configuration
```env
# Allow only your domain
CORS_ORIGIN=https://your-domain.com
```

### 4. Supabase RLS
- Row Level Security enabled
- Tenant isolation policies
- Service role key for admin operations only

---

## 📊 Monitoring & Maintenance

### Health Checks
```
# API Health
GET /health

# Database Health
GET /api/health/db

# Supabase Connection
GET /api/health/supabase
```

### Logs
- **Backend:** Application logs on Vercel/Render
- **Database:** Supabase logs
- **Frontend:** Cloudflare Analytics

### Backup Strategy
- **Supabase:** Daily automatic backups
- **Manual:** Export data via SQL or Supabase dashboard

---

## 🚨 Troubleshooting

### Common Issues:

#### 1. CORS Errors
```javascript
// Check CORS_ORIGIN in backend .env
// Must match your frontend domain
```

#### 2. Database Connection Failed
- Verify Supabase credentials
- Check SSL configuration
- Test connection with pgAdmin or psql

#### 3. Session Not Persisting
- Clear browser localStorage
- Check session expiry (12 hours)
- Verify token validation

#### 4. Static Files Not Loading
- Cloudflare Pages build settings
- Check file paths (relative vs absolute)
- Verify Cloudflare cache

---

## 🔄 Update Process

### 1. Code Updates
```bash
# Push to GitHub
git add .
git commit -m "Update description"
git push origin main

# Auto-deploy to Cloudflare Pages (frontend)
# Auto-deploy to Vercel/Render (backend)
```

### 2. Database Schema Updates
1. Create new migration SQL
2. Run in Supabase SQL Editor
3. Test with existing data

### 3. Environment Variables
1. Update in deployment platform
2. Restart services if needed
3. Verify changes take effect

---

## 📞 Support

### Resources:
- **GitHub:** zaidunk/himapatokayam
- **Supabase:** https://supabase.com/dashboard/project/mzucfndifneytbesirkx
- **Cloudflare:** Pages dashboard
- **Backend:** Vercel/Render dashboard

### Default Access:
- **Main Login:** admin/admin
- **POS Login:** 1234 (Citra Dewi)
- **KDS Login:** 3456 (Ani Kitchen)
- **Backoffice:** 0000 (Admin Demo)

---

## ✅ Deployment Checklist

- [ ] Supabase database migrated
- [ ] Environment variables configured
- [ ] Backend deployed (Vercel/Render)
- [ ] Frontend deployed (Cloudflare Pages)
- [ ] Custom domain configured
- [ ] SSL certificates verified
- [ ] Default credentials changed
- [ ] Health checks passing
- [ ] All apps accessible
- [ ] Session persistence working
- [ ] Database connection stable

---

**🎉 Deployment Complete!** Your NASHTY OS system is now cloud-ready with main login page, admin authentication, and Supabase database.
