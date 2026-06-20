# ✅ Nashty OS Setup Complete

## Database Configuration

### Supabase Database
- **URL**: https://mzucfndifneytbesirkx.supabase.co
- **Database**: postgres
- **Port**: 5432

### Railway Deployment
- **Project ID**: 610491e6-4a5d-433b-ae87-760711f4a04c
- **Repository**: xolvoncollective/nashtyxolvon
- **Frontend**: https://nashtyxolvon2.pages.dev

---

## 🏪 Outlet Configuration

**Single Outlet**: **Nashty Pusat**
- Address: Jl. Pusat No. 1, Jakarta
- Phone: +62 21 1234 5678
- Status: Active

---

## 🔑 User Credentials

### Main Admin Login (Authentication Gateway)
```
Username: admin1
Password: admin1
Outlet: Nashty Pusat
```

### Superadmin Login (Backoffice & Cost Module)
```
Username: superadmin@nashty
Password: nashty1111
```

### POS Staff PINs (4-digit)
| PIN  | Name       | Role     | Description        |
|------|------------|----------|--------------------|
| 0000 | Superadmin | Owner    | Full system access |
| 1212 | Manager    | Manager  | Store management   |
| 9999 | Owner      | Owner    | Business owner     |
| 8888 | Kasir      | Cashier  | POS operator       |

---

## 📦 Database Content

- ✅ 1 Tenant: Nashty Restaurant
- ✅ 1 Outlet: Nashty Pusat  
- ✅ 4 Users (POS Staff with hashed PINs)
- ✅ 4 Categories (Makanan, Minuman, Snack, Dessert)
- ✅ 6 Sample Products

---

## 🧪 Testing Instructions

### 1. Open Application
```
https://nashtyxolvon2.pages.dev
```

### 2. Login Flow
1. Enter credentials: `admin1` / `admin1`
2. Select outlet: **Nashty Pusat**
3. Click **LOGIN**

### 3. Access POS Terminal
1. Click **POS Terminal** button
2. Enter PIN: `0000`, `1212`, `9999`, or `8888`
3. Click **AUTHORIZE**

### 4. Access Backoffice
1. Click **Backoffice** button
2. Enter superadmin credentials:
   - Username: `superadmin@nashty`
   - Password: `nashty1111`
3. Click **ESCALATE PRIVILEGES**

### 5. Access KDS (Kitchen Display)
1. Click **KDS Kitchen** button
2. No authentication required (direct access)

---

## 🔧 Maintenance Scripts

### Setup Fresh Database
```bash
cd backoffice/backend
npx tsx setup-nashty-pusat.ts
```

This script will:
- Clean all existing data
- Create tenant & outlet
- Create 4 users with correct PINs
- Create sample categories & products

### Fix Existing PINs
```bash
cd backoffice/backend
npx tsx fix-pins.ts
```

Updates plain text PINs to bcrypt hashed format.

---

## 🐛 Fixes Applied

### 1. Auto-Logout Issue ✅
- **Problem**: Users logged out immediately after Backoffice login
- **Solution**: 
  - Fixed token payload format (superToken → token)
  - Added outlet data to superadmin response
  - Increased auth timeout from 2s to 5s
  - Added backward compatibility

### 2. Invalid PIN Issue ✅
- **Problem**: POS login always showed "Invalid PIN"
- **Solution**:
  - PINs now properly hashed with bcrypt
  - Database seeded with correct hashed PINs
  - All 4 users verified with correct PIN format

### 3. Multiple Outlets ✅
- **Problem**: Confusion with Demo and Main Branch outlets
- **Solution**:
  - Cleaned all existing outlets
  - Created single outlet: "Nashty Pusat"
  - Updated all users to use this outlet

---

## 📝 Environment Variables (Railway)

```env
CORS_ORIGIN="https://nashtyxolvon2.pages.dev"
DATABASE_MODE="postgres"
JWT_SECRET="ZaidunkMargin"
NODE_ENV="production"
SUPABASE_URL="https://mzucfndifneytbesirkx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
PORT=5432
```

---

## 🚀 Deployment Status

- ✅ Code pushed to xolvoncollective/nashtyxolvon
- ✅ Railway auto-deploy configured
- ✅ Supabase database configured
- ✅ All fixes deployed

---

## 📞 Support

If issues persist:
1. Check Railway deployment logs
2. Verify Supabase connection
3. Re-run setup script: `npx tsx setup-nashty-pusat.ts`
4. Check browser console for errors

---

**Last Updated**: June 20, 2026
**Status**: ✅ Production Ready
