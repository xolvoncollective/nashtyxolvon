# 🔐 NASHTY OS - Login Documentation

## Overview

Nashty OS menggunakan **dual authentication system**:
1. **Backoffice Login** - Username/Password untuk system_users (Superadmin, Owner, Manager)
2. **POS Login** - PIN untuk users (Cashiers/Staff per outlet)

---

## 📋 Table of Contents

1. [Login Types](#login-types)
2. [Backoffice Login](#backoffice-login)
3. [POS Login](#pos-login)
4. [Troubleshooting](#troubleshooting)
5. [API Reference](#api-reference)

---

## Login Types

### 1. Backoffice Login (Username + Password)
- **Target Users**: Superadmin, Owner, Manager, Cashier (backoffice access)
- **Table**: `system_users`
- **Authentication**: Username + Password + Outlet Selection
- **Token Duration**: 8 hours
- **Access**: Full system access (Dashboard, Reports, Analytics, Settings)

### 2. POS Login (PIN)
- **Target Users**: Cashiers, Staff
- **Table**: `users`
- **Authentication**: PIN + Outlet Selection
- **Token Duration**: 12 hours (shift duration)
- **Access**: POS system only (Sales, Orders, KDS)

---

## Backoffice Login

### Login Credentials (Seeded Data)

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `superadmin` | `nashty@2024` | superadmin | Full system access |
| `owner.nashty` | `nashty@2024` | owner | Owner access |
| `manager.galaxy` | `nashty@2024` | manager | Manager for Galaxy Mall |
| `manager.pakuwon` | `nashty@2024` | manager | Manager for Pakuwon TC |
| `cashier.citra` | `nashty@2024` | cashier | Cashier with backoffice access |

### Login Flow

1. User enters **username** (e.g., `superadmin`)
2. User enters **password** (`nashty@2024`)
3. User selects **outlet** from dropdown
4. System validates credentials against `system_users` table
5. System generates JWT token (8 hour expiry)
6. System redirects to dashboard

### API Request

```bash
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "action": "main-login",
    "username": "superadmin",
    "password": "nashty@2024",
    "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
  }'
```

### Success Response

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "8h",
  "user": {
    "id": "a1000000-0000-0000-0000-000000000001",
    "name": "Super Administrator",
    "username": "superadmin",
    "email": "superadmin@nashty.com",
    "role": "superadmin",
    "tenantId": "b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab",
    "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
  }
}
```

### Error Responses

#### Invalid Credentials
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

#### Account Locked
```json
{
  "success": false,
  "error": "Account locked due to multiple failed attempts. Contact admin."
}
```

---

## POS Login

### Login PINs (Seeded Data)

| Name | PIN | Outlet | Role |
|------|-----|--------|------|
| Citra Kusuma | `$2b$10$abcdefghijklmnopqrstuvwxyz123456` | Galaxy Mall | cashier |
| Budi Santoso | `$2b$10$abcdefghijklmnopqrstuvwxyz123457` | Galaxy Mall | cashier |
| Ani Wijaya | `$2b$10$abcdefghijklmnopqrstuvwxyz123458` | Galaxy Mall | cashier |
| Dina Permata | `$2b$10$abcdefghijklmnopqrstuvwxyz123459` | Pakuwon TC | cashier |
| Eko Prasetyo | `$2b$10$abcdefghijklmnopqrstuvwxyz123460` | Pakuwon TC | cashier |
| Fitri Wulandari | `$2b$10$abcdefghijklmnopqrstuvwxyz123461` | TP6 | cashier |

**Note**: PINs are stored as bcrypt hashes. The actual numeric PINs are:
- Citra: `1234`
- Budi: `2345`
- Ani: `3456`
- Dina: `4567`
- Eko: `5678`
- Fitri: `6789`

### Login Flow

1. User selects **outlet** from dropdown
2. User enters **PIN** (4-6 digits)
3. System validates PIN against `users` table for selected outlet
4. System generates JWT token (12 hour expiry)
5. System redirects to POS interface

### API Request

```bash
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "action": "pin-login",
    "pin": "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
    "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
  }'
```

### Success Response

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "12h",
  "user": {
    "id": "a1000000-0000-0000-0000-000000000005",
    "name": "Citra Kusuma",
    "role": "cashier",
    "tenantId": "b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab",
    "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
  }
}
```

### Error Responses

#### Invalid PIN
```json
{
  "success": false,
  "error": "Invalid PIN for this outlet"
}
```

#### Missing Outlet
```json
{
  "success": false,
  "error": "Outlet selection is required"
}
```

---

## Troubleshooting

### Problem: "Account locked due to multiple failed attempts"

**Cause**: User account is inactive (`is_active = false`)

**Solution**:
```sql
UPDATE system_users 
SET is_active = true 
WHERE username = 'superadmin';
```

### Problem: "Invalid credentials" for correct password

**Possible Causes**:
1. Wrong table - Backoffice uses `system_users`, POS uses `users`
2. Wrong password - Default is `nashty@2024` or `nashty1111`
3. User doesn't exist in database
4. Role mismatch - Check allowed roles for action

**Debug Steps**:
```sql
-- Check if user exists in system_users
SELECT id, username, role, is_active 
FROM system_users 
WHERE username = 'superadmin';

-- Check if user exists in users
SELECT id, name, role, status, outlet_id 
FROM users 
WHERE pin = '$2b$10$abcdefghijklmnopqrstuvwxyz123456';
```

### Problem: "Invalid PIN for this outlet"

**Cause**: PIN doesn't match any user in the selected outlet

**Solution**:
```sql
-- Check users for specific outlet
SELECT id, name, pin, outlet_id 
FROM users 
WHERE outlet_id = '71cb7d46-8f4e-4c3a-b9d1-1111111111a1'
AND status = 'active';
```

### Problem: Token expired

**Cause**: Token has exceeded its expiry time (8h for backoffice, 12h for POS)

**Solution**: Use refresh token to get new access token, or login again

---

## API Reference

### Endpoint

```
POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login
```

### Headers

```
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg
```

### Actions

#### 1. main-login (Backoffice)

**Request Body:**
```json
{
  "action": "main-login",
  "username": "superadmin",
  "password": "nashty@2024",
  "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
}
```

**Allowed Roles**: `manager`, `superadmin`, `owner`, `cashier`

#### 2. superadmin-login (Restricted Backoffice)

**Request Body:**
```json
{
  "action": "superadmin-login",
  "username": "superadmin",
  "password": "nashty@2024",
  "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
}
```

**Allowed Roles**: `superadmin`, `owner`, `manager`

#### 3. pin-login (POS)

**Request Body:**
```json
{
  "action": "pin-login",
  "pin": "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
  "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
}
```

**Allowed Roles**: Any role in `users` table

---

## Database Schema

### system_users (Backoffice)

```sql
CREATE TABLE system_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL, -- superadmin, owner, manager, cashier
  is_active BOOLEAN DEFAULT true,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  created_by UUID REFERENCES system_users(id)
);
```

### users (POS)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  outlet_id UUID REFERENCES outlets(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL, -- cashier, supervisor, etc
  pin TEXT, -- bcrypt hash for POS login
  password TEXT, -- bcrypt hash for web login (optional)
  avatar TEXT,
  status TEXT DEFAULT 'active', -- active, inactive
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Security Notes

1. **Password Hashing**: Production should use bcrypt with proper salt rounds
2. **JWT Secret**: Change `JWT_SECRET` environment variable in production
3. **Token Rotation**: Implement refresh token rotation for better security
4. **Rate Limiting**: Add rate limiting to prevent brute force attacks
5. **2FA**: Consider adding two-factor authentication for superadmin accounts
6. **Audit Logs**: All login attempts are logged in `activity_logs` table

---

## Quick Test Commands

### Test Backoffice Login
```bash
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg" \
  -d '{
    "action": "main-login",
    "username": "superadmin",
    "password": "nashty@2024",
    "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
  }'
```

### Test POS Login
```bash
curl -X POST https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg" \
  -d '{
    "action": "pin-login",
    "pin": "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
    "outletId": "71cb7d46-8f4e-4c3a-b9d1-1111111111a1"
  }'
```

---

## Contact & Support

For login issues or account access problems, contact:
- **Technical Support**: tech@nashty.com
- **Admin Support**: admin@nashty.com

---

**Last Updated**: 2026-06-22  
**Version**: 2.0.0  
**Status**: ✅ Production Ready
