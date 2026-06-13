# 🚀 NASHTY OS - Production Ready Package

## 📦 Package Overview

This folder contains everything needed to deploy NASHTY OS to production (Supabase + Cloudflare).

```
Production-Ready/
├── Database/           # Supabase SQL migration & seed data
├── Config/             # Environment configurations
├── Deployment/         # Deployment scripts & guides
├── Documentation/      # Complete system documentation
└── README.md          # This file
```

---

## ✅ What's Included

### 1. **Database** (`/Database/`)
- `supabase-migration.sql` - Complete PostgreSQL schema
- `supabase-seed-data.sql` - Demo data (5 admin users, tenant, outlet)
- `schema-diagram.md` - Database relationships

### 2. **Config** (`/Config/`)
- `.env.production` - Production environment template
- `cloudflare-pages.toml` - Cloudflare Pages configuration
- `vercel.json` - Vercel deployment configuration
- `render.yaml` - Render.com configuration

### 3. **Deployment** (`/Deployment/`)
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment instructions
- `cloudflare-setup.md` - Cloudflare Pages setup
- `supabase-setup.md` - Supabase configuration
- `backend-deployment.md` - Backend API deployment

### 4. **Documentation** (`/Documentation/`)
- `API_DOCUMENTATION.md` - Complete API reference
- `USER_GUIDE.md` - User manual (admin, cashier, chef)
- `SECURITY.md` - Security best practices
- `TROUBLESHOOTING.md` - Common issues & solutions

---

## 🔐 Credentials

### **Supabase**
- **URL:** https://mzucfndifneytbesirkx.supabase.co
- **Database:** postgres
- **Host:** db.mzucfndifneytbesirkx.supabase.co
- **Port:** 5432
- **Password:** ZaidunkMarginpublishable

### **Admin Users** (5 users)
1. **admin1** / admin1
2. **admin2** / admin2
3. **admin3** / admin3
4. **admin4** / admin4
5. **admin5** / admin5

### **Staff PINs**
- **Citra Dewi (Cashier):** 1234
- **Budi Santoso (Cashier):** 2345
- **Ani Kitchen (Chef):** 3456
- **Admin Demo (Owner):** 0000

### **JWT Configuration**
- **Secret:** ZaidunkMargin
- **Expires In:** 24h

---

## 🚀 Quick Deployment

### Step 1: Setup Supabase
```bash
1. Login to Supabase Dashboard
2. Open SQL Editor
3. Paste and run: Database/supabase-migration.sql
4. Verify tables created
```

### Step 2: Deploy Backend
**Option A: Vercel**
```bash
npm i -g vercel
cd backoffice/backend
vercel
```

**Option B: Render.com**
```bash
1. Connect GitHub repository
2. Use Config/render.yaml
3. Set environment variables from Config/.env.production
```

### Step 3: Deploy Frontend
**Cloudflare Pages**
```bash
1. Connect GitHub repository
2. Build command: echo "No build required"
3. Output directory: .
4. Set API_BASE_URL environment variable
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────┐
│       Cloudflare Pages                  │
│   (Static Frontend)                     │
│   • Main Login (/)                      │
│   • POS (/pos/frontend/)                │
│   • KDS (/kds/frontend/)                │
│   • Backoffice (/backoffice/frontend/)  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       Vercel / Render.com               │
│   (Node.js Backend API)                 │
│   • Main Auth (admin1-5/admin1-5)       │
│   • Staff PIN Auth (1234, 2345...)      │
│   • Database API                        │
│   • JWT: ZaidunkMargin, 24h             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Supabase Cloud                  │
│   • PostgreSQL Database                 │
│   • Row Level Security                  │
│   • Automatic Backups                   │
└─────────────────────────────────────────┘
```

---

## ✨ Key Features

### **Main Login System**
- **Single Entry Point:** `/` (index.html)
- **3 App Selection:** POS, KDS, Backoffice
- **5 Admin Users:** admin1 admin1 to admin5 admin5
- **24-Hour Session:** Persistent in localStorage
- **Auto-Redirect:** If session is still valid

### **Security**
- **JWT Authentication:** Secret = ZaidunkMargin
- **Session Management:** 24-hour expiry
- **CORS Protection:** Configured for your domain
- **XSS Protection:** Input sanitization
- **RLS:** Row Level Security in Supabase

### **Backend Features**
- **5 Admin Users:** Multi-user admin access
- **Staff PIN Auth:** 4 demo users with PINs
- **Supabase Ready:** PostgreSQL cloud database
- **API JWT Protected:** All endpoints secured
- **24h Session:** Long-running sessions

---

## 📝 Pre-Deployment Checklist

- [ ] Supabase account created
- [ ] Database migrated (supabase-migration.sql)
- [ ] Environment variables set (.env.production)
- [ ] Backend deployed (Vercel/Render)
- [ ] Frontend deployed (Cloudflare Pages)
- [ ] Custom domain configured (optional)
- [ ] SSL certificates verified
- [ ] Admin credentials changed from defaults
- [ ] Test all 3 apps (POS, KDS, Backoffice)
- [ ] Session persistence working
- [ ] Real-time order flow tested (POS → KDS)

---

## 🧪 Testing After Deployment

### 1. **Main Login**
```
URL: https://your-domain.com/
Login: admin1 / admin1
Expected: Login successful, app selection shown
```

### 2. **POS Terminal**
```
Select: POS
Login: admin1 / admin1
PIN: 1234 (Citra Dewi)
Test: Create order, payment, print
```

### 3. **KDS Kitchen**
```
Select: KDS  
Login: admin1 / admin1
PIN: 3456 (Ani Kitchen)
Test: Order appears from POS, status update
```

### 4. **Backoffice**
```
Select: Backoffice
Login: admin1 / admin1
PIN: 0000 (Admin Demo)
Test: Dashboard KPIs, order history
```

### 5. **Real-time Flow**
```
1. POS: Create order (Nasi Goreng + Es Teh)
2. KDS: Verify order appears automatically
3. KDS: Update status to Preparing → Ready
4. POS: Confirm delivery to customer
5. Backoffice: Check order in dashboard
```

---

## 🔧 Environment Variables

Copy from `Config/.env.production` and set in your hosting platform:

```env
# Supabase
SUPABASE_URL=https://mzucfndifneytbesirkx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_OWaFhWTRVli8XZfIYmqpfg_aHCxBJYj
SUPABASE_SERVICE_ROLE_KEY=sb_secret_6XFZqLgu52yyoX4uZ0thZA_CMHQM1H7

# Database
SUPABASE_DB_HOST=db.mzucfndifneytbesirkx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=ZaidunkMarginpublishable
SUPABASE_DB_SSL=true

# JWT
JWT_SECRET=ZaidunkMargin
JWT_EXPIRES_IN=24h

# Server
PORT=3099
CORS_ORIGIN=https://your-domain.com
NODE_ENV=production

# Admin Users (5 users)
ADMIN_USER_1=admin1:admin1
ADMIN_USER_2=admin2:admin2
ADMIN_USER_3=admin3:admin3
ADMIN_USER_4=admin4:admin4
ADMIN_USER_5=admin5:admin5
```

---

## 📞 Support

### **Documentation**
- **Deployment Guide:** `/Deployment/DEPLOYMENT_GUIDE.md`
- **API Docs:** `/Documentation/API_DOCUMENTATION.md`
- **User Guide:** `/Documentation/USER_GUIDE.md`

### **GitHub**
- **Repository:** zaidunk/himapatokayam
- **Issues:** Report bugs via GitHub Issues

### **Supabase**
- **Dashboard:** https://supabase.com/dashboard/project/mzucfndifneytbesirkx
- **SQL Editor:** For manual queries
- **Logs:** Real-time logging

---

## 🎯 Success Criteria

System is ready when:

1. ✅ Main login page loads
2. ✅ 5 admin users can login (admin1-admin5)
3. ✅ App selection works (POS/KDS/Backoffice)
4. ✅ Sessions persist for 24 hours
5. ✅ POS can create orders
6. ✅ KDS receives orders in real-time
7. ✅ Backoffice shows dashboard data
8. ✅ All authentication flows work
9. ✅ Database operations succeed
10. ✅ No console errors in browser

---

## 📈 Next Steps After Deployment

1. **Change default credentials** in production
2. **Setup monitoring** (error tracking, performance)
3. **Enable Supabase backups** (daily recommended)
4. **Configure Cloudflare caching** for static assets
5. **Setup custom domain** with SSL
6. **Test load performance** with multiple users
7. **Create admin documentation** for staff training
8. **Setup analytics** (Google Analytics, Mixpanel, etc.)

---

**🚀 Ready to deploy NASHTY OS to production!**

For detailed instructions, see `/Deployment/DEPLOYMENT_GUIDE.md`
