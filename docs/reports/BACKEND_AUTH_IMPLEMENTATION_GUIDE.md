# Backend Implementation Guide - Authentication

## Overview

Panduan lengkap untuk backend developer dalam mengimplementasikan endpoint autentikasi yang diperlukan oleh Enhanced Authentication System v2.0.

---

## Table of Contents

1. [Token Refresh Endpoint](#token-refresh-endpoint)
2. [JWT Token Generation](#jwt-token-generation)
3. [Authentication Middleware](#authentication-middleware)
4. [Permission Checking](#permission-checking)
5. [Database Schema](#database-schema)
6. [Environment Variables](#environment-variables)
7. [Testing](#testing)

---

## Token Refresh Endpoint

### Endpoint Specification

```
POST /api/auth/refresh
Content-Type: application/json
```

### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Success Response (200)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "role": "cashier",
    "tenantId": "550e8400-e29b-41d4-a716-446655440001",
    "outletId": "550e8400-e29b-41d4-a716-446655440002"
  },
  "outlet": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Main Branch"
  }
}
```

### Error Response (401)

```json
{
  "success": false,
  "error": "Invalid refresh token"
}
```

---

## Implementation Examples

### Node.js + Express + PostgreSQL

#### 1. Install Dependencies

```bash
npm install express jsonwebtoken bcrypt pg
```

#### 2. Token Refresh Implementation

```javascript
// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  // Validate request
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token is required'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if token is blacklisted (optional, for logout)
    const blacklisted = await db.query(
      'SELECT * FROM token_blacklist WHERE token = $1',
      [refreshToken]
    );

    if (blacklisted.rows.length > 0) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token has been revoked'
      });
    }

    // Get user from database
    const userResult = await db.query(`
      SELECT u.id, u.name, u.role, u.tenant_id, u.outlet_id, o.name as outlet_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      WHERE u.id = $1 AND u.is_active = true
    `, [decoded.sub]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    const user = userResult.rows[0];

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        sub: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: user.outlet_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Optionally rotate refresh token (recommended for security)
    const newRefreshToken = jwt.sign(
      { sub: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '30d' }
    );

    // Blacklist old refresh token (if rotating)
    await db.query(
      'INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2)',
      [refreshToken, new Date(decoded.exp * 1000)]
    );

    // Log token refresh for audit
    await db.query(
      'INSERT INTO audit_log (user_id, event_type, event_data) VALUES ($1, $2, $3)',
      [
        user.id,
        'token_refreshed',
        JSON.stringify({ timestamp: new Date().toISOString() })
      ]
    );

    // Return new tokens
    res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: user.outlet_id
      },
      outlet: {
        id: user.outlet_id,
        name: user.outlet_name
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);

    // Handle JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token has expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
```

---

### JWT Token Generation

#### Access Token (1 hour)

```javascript
const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      role: user.role,
      tenantId: user.tenant_id,
      outletId: user.outlet_id
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '1h',
      algorithm: 'HS256'
    }
  );
}
```

#### Refresh Token (30 days)

```javascript
function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { 
      expiresIn: '30d',
      algorithm: 'HS256'
    }
  );
}
```

#### Login Endpoint (Generate Both Tokens)

```javascript
router.post('/login', async (req, res) => {
  const { pin, outletId } = req.body;

  try {
    // Find user by PIN and outlet
    const userResult = await db.query(`
      SELECT u.*, o.name as outlet_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      WHERE u.pin = $1 AND u.outlet_id = $2 AND u.is_active = true
    `, [pin, outletId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN or outlet'
      });
    }

    const user = userResult.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database (optional, for tracking)
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
    );

    // Log login event
    await db.query(
      'INSERT INTO audit_log (user_id, event_type, event_data) VALUES ($1, $2, $3)',
      [
        user.id,
        'user_login',
        JSON.stringify({ 
          outletId,
          timestamp: new Date().toISOString() 
        })
      ]
    );

    res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        outletId: user.outlet_id,
        color: user.color
      },
      outlet: {
        id: user.outlet_id,
        name: user.outlet_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

---

### Authentication Middleware

#### JWT Verification Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Verify JWT token in Authorization header
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'No authorization header'
    });
  }

  // Extract token from "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authorization header format'
    });
  }

  const token = parts[1];

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.sub,
      name: decoded.name,
      role: decoded.role,
      tenantId: decoded.tenantId,
      outletId: decoded.outletId
    };

    next();

  } catch (error) {
    console.error('JWT verification error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

module.exports = { authenticateJWT };
```

#### Usage

```javascript
const { authenticateJWT } = require('./middleware/auth');

// Protect all routes
app.use('/api', authenticateJWT);

// Or protect specific routes
router.get('/orders', authenticateJWT, async (req, res) => {
  // req.user is available here
  const userId = req.user.id;
  // ...
});
```

---

### Permission Checking

#### Permission Definitions

```javascript
// config/permissions.js

const PERMISSIONS = {
  // POS
  'pos.view': 'View POS interface',
  'pos.create_order': 'Create new orders',
  'pos.edit_order': 'Edit existing orders',
  'pos.delete_order': 'Delete orders',
  'pos.apply_discount': 'Apply discounts',
  'pos.refund': 'Process refunds',
  'pos.void_transaction': 'Void transactions',
  
  // Payments
  'payment.cash': 'Accept cash payments',
  'payment.card': 'Process card payments',
  'payment.digital': 'Accept digital payments',
  
  // Shifts
  'shift.open': 'Open shift',
  'shift.close': 'Close shift',
  'shift.view_reports': 'View shift reports',
  
  // Inventory
  'inventory.view': 'View inventory',
  'inventory.adjust': 'Adjust inventory levels',
  
  // Settings
  'settings.view': 'View settings',
  'settings.edit': 'Edit settings',
  
  // Admin
  'admin.manage_users': 'Manage users',
  'admin.view_audit_log': 'View audit logs',
  'admin.system_config': 'System configuration'
};

const ROLES = {
  cashier: [
    'pos.view',
    'pos.create_order',
    'payment.cash',
    'payment.card',
    'payment.digital'
  ],
  server: [
    'pos.view',
    'pos.create_order',
    'pos.edit_order'
  ],
  supervisor: [
    'pos.*',
    'payment.*',
    'shift.*',
    'inventory.view',
    'settings.view'
  ],
  manager: [
    'pos.*',
    'payment.*',
    'shift.*',
    'inventory.*',
    'settings.*'
  ],
  admin: ['*']
};

module.exports = { PERMISSIONS, ROLES };
```

#### Permission Checking Middleware

```javascript
// middleware/permissions.js
const { ROLES } = require('../config/permissions');

/**
 * Check if user has permission
 */
function hasPermission(userRole, requiredPermission) {
  const rolePermissions = ROLES[userRole] || [];

  // Admin wildcard
  if (rolePermissions.includes('*')) {
    return true;
  }

  // Direct permission
  if (rolePermissions.includes(requiredPermission)) {
    return true;
  }

  // Wildcard permissions (e.g., 'pos.*')
  for (const perm of rolePermissions) {
    if (perm.endsWith('.*')) {
      const prefix = perm.slice(0, -2);
      if (requiredPermission.startsWith(prefix)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Middleware to require specific permission
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      // Log permission denial
      console.warn(`Permission denied: ${req.user.id} attempted ${permission}`);

      return res.status(403).json({
        success: false,
        error: 'Permission denied',
        required: permission
      });
    }

    next();
  };
}

module.exports = { hasPermission, requirePermission };
```

#### Usage

```javascript
const { authenticateJWT } = require('./middleware/auth');
const { requirePermission } = require('./middleware/permissions');

// Require permission for specific endpoints
router.post('/orders/:id/refund', 
  authenticateJWT, 
  requirePermission('pos.refund'), 
  async (req, res) => {
    // Process refund
  }
);

router.delete('/orders/:id', 
  authenticateJWT, 
  requirePermission('pos.delete_order'), 
  async (req, res) => {
    // Delete order
  }
);

router.post('/discounts', 
  authenticateJWT, 
  requirePermission('pos.apply_discount'), 
  async (req, res) => {
    // Apply discount
  }
);
```

---

## Database Schema

### Required Tables

#### 1. users table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  pin VARCHAR(4) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('cashier', 'server', 'supervisor', 'manager', 'admin')),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  outlet_id UUID NOT NULL REFERENCES outlets(id),
  color VARCHAR(7) DEFAULT '#E4540C',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_pin_outlet ON users(pin, outlet_id);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_outlet ON users(outlet_id);
```

#### 2. refresh_tokens table (optional, for tracking)

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- Cleanup expired tokens periodically
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM refresh_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

#### 3. token_blacklist table (for logout/revocation)

```sql
CREATE TABLE token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_token_blacklist_token ON token_blacklist(token);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);

-- Cleanup expired blacklisted tokens
CREATE OR REPLACE FUNCTION cleanup_expired_blacklisted_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

#### 4. audit_log table

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

---

## Environment Variables

### Required Variables

```bash
# .env file

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nashty_db

# JWT Secrets (use strong random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-min-32-chars

# Token Expiry
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=production
```

### Generate Secrets

```bash
# Generate random secrets (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Testing

### Manual Testing with cURL

#### 1. Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "pin": "1234",
    "outletId": "550e8400-e29b-41d4-a716-446655440002"
  }'
```

#### 2. Test Token Refresh

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### 3. Test Protected Endpoint

```bash
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Automated Tests (Jest)

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../app');

describe('Authentication', () => {
  let refreshToken;

  test('POST /api/auth/login - success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ pin: '1234', outletId: 'test-outlet-id' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user).toBeDefined();

    refreshToken = res.body.refreshToken;
  });

  test('POST /api/auth/login - invalid PIN', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ pin: '9999', outletId: 'test-outlet-id' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/refresh - success', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/refresh - invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Generate strong JWT secrets (min 32 characters)
- [ ] Set environment variables in production
- [ ] Create database tables (users, refresh_tokens, token_blacklist, audit_log)
- [ ] Test login endpoint
- [ ] Test token refresh endpoint
- [ ] Test protected endpoints with JWT
- [ ] Test permission checking
- [ ] Test error scenarios (invalid token, expired token, etc.)

### Post-Deployment

- [ ] Monitor token refresh success rate
- [ ] Monitor 401/403 responses
- [ ] Set up automated cleanup of expired tokens (cron job)
- [ ] Monitor audit logs for suspicious activity
- [ ] Set up alerts for failed authentication attempts
- [ ] Performance testing (token generation, verification)

---

## Security Recommendations

### Token Security

✅ **DO**:
- Use HTTPS for all endpoints
- Store JWT secrets securely (environment variables, secrets manager)
- Use strong random secrets (min 32 characters)
- Set short expiry for access tokens (1 hour)
- Rotate refresh tokens on use
- Blacklist tokens on logout

❌ **DON'T**:
- Hardcode secrets in code
- Use weak secrets (e.g., "secret", "password")
- Set very long access token expiry (>1 day)
- Reuse secrets across environments
- Log tokens in application logs

### Database Security

✅ **DO**:
- Use parameterized queries (prevent SQL injection)
- Hash sensitive data (PINs with bcrypt)
- Index frequently queried columns
- Clean up expired tokens regularly
- Backup audit logs

❌ **DON'T**:
- Store tokens in plain text
- Use string concatenation for SQL queries
- Keep expired tokens indefinitely
- Allow unlimited login attempts (implement rate limiting)

---

## Support

### Common Issues

1. **"Invalid token" on valid request**
   - Check if JWT_SECRET matches between token generation and verification
   - Verify token hasn't expired
   - Check Authorization header format ("Bearer <token>")

2. **Token refresh always fails**
   - Check if REFRESH_TOKEN_SECRET is set
   - Verify refresh token hasn't expired
   - Check token_blacklist for revoked tokens

3. **Permission checks always fail**
   - Verify role exists in ROLES configuration
   - Check if permission is correctly defined
   - Ensure user role is included in JWT payload

### Getting Help

- Check backend logs for JWT errors
- Test endpoints with Postman/Insomnia
- Verify database connection and queries
- Check environment variables are loaded

---

**Version**: 1.0  
**Last Updated**: 2024-01-15  
**For**: NASHTY OS Backend Developers

