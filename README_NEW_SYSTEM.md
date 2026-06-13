# 🚀 NASHTY OS v2.0 - Cloud Ready Restaurant System

## 🎯 Overview

**NASHTY OS** is now a complete cloud-ready restaurant management system with:
- **Main Login Page** with admin authentication
- **Supabase PostgreSQL** cloud database
- **Cloudflare Pages** for frontend hosting
- **12-hour session management**
- **Multi-app architecture** (POS, KDS, Backoffice)

---

## ✨ New Features in v2.0

### 1. **Main Login Page** (`/index.html`)
- Single entry point for all apps
- Admin authentication (username/password)
- 3 app selection: POS, KDS, Backoffice
- 12-hour persistent sessions
- Server status monitoring

### 2. **Supabase Integration**
- PostgreSQL database (replaces SQLite)
- Row Level Security (RLS)
- Cloud scalability
- Automatic backups
- Real-time subscriptions ready

### 3. **Enhanced API Client** (`api-client-v2.js`)
- Dual authentication (admin + staff)
- Session management
- Auto-token refresh
- Better error handling

### 4. **Cloud Deployment Ready**
- Static frontend (Cloudflare Pages)
- Node.js backend (Vercel/Render)
- Environment-based configuration
- Production security

---

## 🏗️ System Architecture

### Frontend (Static - Cloudflare Pages)
```
/
├── index.html           # Main login page
├── pos/frontend/        # POS Terminal
├── kds/frontend/        # Kitchen Display
└── backoffice/frontend/ # Management Dashboard
```

### Backend (Node.js - Vercel/Render)
```
backoffice/backend/
├── src/
│   ├── index.ts         # Main server
│   ├── routes/main-auth.ts  # Admin auth
│   ├── supabase/        # Supabase client
│   └── ...              # Existing routes
└── .env                 # Configuration
```

### Database (Supabase PostgreSQL)
- Full SaaS multi-tenant schema
- UUID primary keys
- RLS for data isolation
- Triggers for timestamps

---

## 🔐 Authentication Flow

### 1. **Admin Login** (Main Page)
```
User → Main Page → Select App → Login (admin/admin) → 12-hour Session → App
```

### 2. **Staff Login** (Per App)
```
POS/KDS → PIN Login (1234, 2345, 3456) → App Session
```

### 3. **Session Management**
- Admin sessions: 12 hours (localStorage)
- Staff sessions: Per app (PIN-based)
- Auto-logout on browser close
- Token validation on all requests

---

## 🧪 Default Credentials

### Main Login Page
- **Username:** `admin`
- **Password:** `admin`
- *Change in production!*

### Staff PINs (for POS/KDS)
- **Citra Dewi (Cashier):** `1234`
- **Budi Santoso (Cashier):** `2345`
- **Ani Kitchen (Chef):** `3456`
- **Admin Demo (Owner):** `0000`

---

## 🚀 Quick Start (Local Development)

### 1. **Start Backend**
```bash
cd backoffice/backend
npm install
npm run dev
```

### 2. **Access Applications**
- **Main Page:** http://localhost:3099/
- **POS:** http://localhost:3099/pos/frontend/index.html
- **KDS:** http://localhost:3099/kds/frontend/index.html
- **Backoffice:** http://localhost:3099/backoffice/frontend/index.html

### 3. **Login**
1. Go to http://localhost:3099/
2. Select an app (POS/KDS/Backoffice)
3. Login with `admin` / `admin`
4. Access selected app

---

## ☁️ Cloud Deployment

### 1. **Supabase Setup**
```sql
-- Run in Supabase SQL Editor:
-- File: supabase-migration.sql
```

### 2. **Backend Deployment** (Vercel/Render)
```bash
# Set environment variables:
SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_OWaFhWTRVli8XZfIYmqpfg_aHCxBJYj
SUPABASE_SERVICE_ROLE_KEY=sb_secret_6XFZqLgu52yyoX4uZ0thZA_CMHQM1H7
JWT_SECRET=your-secret-key
```

### 3. **Frontend Deployment** (Cloudflare Pages)
- Connect GitHub repository
- Build command: `echo "No build required"`
- Output directory: `.`
- Set `API_BASE_URL` environment variable

---

## 📁 Key Files

### Configuration
- `.env` - Backend environment variables
- `supabase-migration.sql` - Database schema
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide

### Frontend
- `index.html` - Main login page
- `api-client-v2.js` - Enhanced API client
- `api-client.js` - Legacy API client (backwards compatible)

### Backend
- `src/routes/main-auth.ts` - Admin authentication
- `src/supabase/supabase-client.ts` - Supabase integration
- `src/index.ts` - Updated server with main auth

---

## 🔧 Development Commands

```bash
# Install dependencies
cd backoffice/backend
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Test API
curl http://localhost:3099/health
curl http://localhost:3099/api/main/auth/apps
```

---

## 🧪 Testing

### API Testing
```bash
# Health check
curl http://localhost:3099/health

# Main auth login
curl -X POST http://localhost:3099/api/main/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Get available apps
curl http://localhost:3099/api/main/auth/apps
```

### Browser Testing
1. Open http://localhost:3099/
2. Test admin login
3. Test app selection
4. Test session persistence
5. Test app-specific functionality

---

## 🔄 Migration from v1.0

### What's Changed
1. **Added:** Main login page
2. **Added:** Admin authentication
3. **Added:** Supabase database
4. **Added:** Session management
5. **Enhanced:** API client with dual auth
6. **Updated:** Deployment for cloud hosting

### Migration Steps
1. Run Supabase schema migration
2. Update backend configuration
3. Deploy new frontend with main page
4. Test authentication flow
5. Verify data access

---

## 🛡️ Security Notes

### 1. **Change Default Credentials**
```env
# In production .env
ADMIN_USERNAME=your-secure-username
ADMIN_PASSWORD=your-strong-password
```

### 2. **JWT Security**
- Use strong JWT secret
- Set appropriate expiry (12 hours)
- Validate tokens on all protected routes

### 3. **CORS Configuration**
- Restrict to your domains only
- Use environment variables
- Never use `*` in production

### 4. **Supabase Security**
- Use RLS policies
- Limit service role key access
- Regular security audits

---

## 📊 Database Schema

### Key Tables
- `tenants` - Business tenants (SaaS)
- `outlets` - Restaurant locations
- `users` - Staff with roles
- `products` - Menu items
- `orders` - Customer orders
- `shifts` - Staff shifts
- `activity_logs` - Audit trail

### Features
- UUID primary keys
- Created/updated timestamps
- Soft delete pattern
- Tenant isolation
- Indexed for performance

---

## 🔍 Monitoring & Debugging

### Logs
- **Backend:** Console logs in development
- **Production:** Vercel/Render logs
- **Database:** Supabase logs

### Health Checks
```
GET /health                    # Overall system health
GET /api/health/db            # Database health
GET /api/health/supabase      # Supabase connection
```

### Debug Session Issues
1. Check localStorage for session data
2. Verify token expiration
3. Check browser console for errors
4. Test API endpoints directly

---

## 🤝 Support

### Resources
- **GitHub:** zaidunk/himapatokayam
- **Supabase:** https://supabase.com/dashboard/project/mzucfndifneytbesirkx
- **Documentation:** See `DEPLOYMENT_GUIDE.md`

### Default Access (for testing)
- **Main Login:** admin / admin
- **POS Access:** 1234, 2345
- **KDS Access:** 3456
- **Backoffice:** 0000

---

## ✅ Success Criteria

System is working when:
1. Main page loads with app selection
2. Admin login works (admin/admin)
3. App selection redirects correctly
4. Session persists for 12 hours
5. Staff PIN login works in apps
6. Database operations succeed
7. All 3 apps function correctly

---

## 🎉 Getting Started

1. **Local Development:**
   ```bash
   git clone https://github.com/zaidunk/himapatokayam.git
   cd himapatokayam/backoffice/backend
   npm install
   npm run dev
   ```

2. **Access:**
   - Open browser to http://localhost:3099/
   - Login with admin/admin
   - Select and test apps

3. **Cloud Deployment:**
   - Follow `DEPLOYMENT_GUIDE.md`
   - Migrate to Supabase
   - Deploy to Cloudflare + Vercel/Render

---

**🚀 Your restaurant management system is now cloud-ready!**
