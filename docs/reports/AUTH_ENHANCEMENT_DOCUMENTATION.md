# NASHTY OS - Authentication Enhancement Documentation

## Overview

The Enhanced Authentication System v2.0 provides enterprise-grade security features for the NASHTY OS POS application, including JWT token management, automatic token refresh, role-based access control (RBAC), audit logging, and integration with the offline encryption system.

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Permissions System](#permissions-system)
6. [Audit Logging](#audit-logging)
7. [API Reference](#api-reference)
8. [Backend Integration](#backend-integration)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────┐
│         NASHTY OS Application               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │   Enhanced Auth Manager (v2.0)      │  │
│  ├─────────────────────────────────────┤  │
│  │  • JWT Token Management             │  │
│  │  • Auto Token Refresh               │  │
│  │  • Session Monitoring               │  │
│  │  • RBAC Permission Checks           │  │
│  │  • Audit Event Logging              │  │
│  └──────────────┬──────────────────────┘  │
│                 │                           │
│  ┌──────────────▼──────────────────────┐  │
│  │    Encryption Service                │  │
│  ├─────────────────────────────────────┤  │
│  │  • AES-256-GCM Encryption           │  │
│  │  • PBKDF2 Key Derivation            │  │
│  │  • Secure Token Storage             │  │
│  └─────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
         │                    │
         │                    │
    ┌────▼────┐         ┌─────▼─────┐
    │ Backend │         │ IndexedDB │
    │   API   │         │  Storage  │
    └─────────┘         └───────────┘
```

### Authentication Flow

```
┌────────┐                    ┌──────────┐                  ┌──────────┐
│ User   │                    │ Launcher │                  │   POS    │
└───┬────┘                    └────┬─────┘                  └────┬─────┘
    │                              │                             │
    │ 1. Login with PIN            │                             │
    ├─────────────────────────────>│                             │
    │                              │                             │
    │ 2. Verify credentials        │                             │
    │ 3. Generate JWT tokens       │                             │
    │                              │                             │
    │ 4. postMessage(auth data)    │                             │
    │                              ├────────────────────────────>│
    │                              │                             │
    │                              │ 5. Store tokens securely    │
    │                              │ 6. Derive encryption key    │
    │                              │ 7. Start session            │
    │                              │                             │
    │                              │ 8. Schedule token refresh   │
    │                              │ 9. Start session monitoring │
    │                              │                             │
    │ 10. App initialized          │                             │
    │<─────────────────────────────────────────────────────────┤
    │                              │                             │
```

---

## Features

### 1. JWT Token Management ✅
- **Access Token**: Short-lived (default: 1 hour)
- **Refresh Token**: Long-lived (default: 30 days)
- **Automatic Refresh**: Tokens refreshed 5 minutes before expiry
- **Client-Side JWT Decoding**: Parse token claims without verification
- **Token Expiry Detection**: Automatic logout on expired tokens

### 2. Secure Token Storage ✅
- **Integration with EncryptionService**: Tokens can be encrypted at rest
- **LocalStorage with AES-256-GCM**: Sensitive data encrypted
- **Device ID Binding**: Tokens tied to specific devices
- **Automatic Key Derivation**: PBKDF2 with 100,000 iterations

### 3. Role-Based Access Control (RBAC) ✅
- **Predefined Roles**: 
  - `cashier`: Basic POS operations
  - `server`: Order creation and editing
  - `supervisor`: Advanced operations, reporting
  - `manager`: Full operational access
  - `admin`: System-wide permissions
- **Permission Checking**: Granular permission validation
- **Permission Wildcards**: Support for `pos.*`, `*` patterns
- **Keyboard Shortcut Permissions**: Restrict privileged shortcuts

### 4. Session Management ✅
- **Session Timeout**: Configurable (default: 12 hours)
- **Activity Monitoring**: Track user actions
- **Auto-Logout on Timeout**: Graceful session termination
- **Session Recovery**: Resume on page refresh

### 5. Audit Logging ✅
- **Auth Events**: Login, logout, token refresh
- **Permission Denials**: Unauthorized access attempts
- **API Access**: Failed API calls (401/403)
- **Keyboard Shortcuts**: Permission-denied shortcut attempts
- **Storage**: LocalStorage (max 1,000 entries)
- **Filters**: By user, event type, date range

### 6. Fetch Interceptor ✅
- **Auto-Add Authorization Header**: Bearer token injection
- **401 Handling**: Automatic token refresh on unauthorized
- **403 Handling**: Log permission denials
- **Retry Logic**: Retry failed requests after token refresh

### 7. Dev Mode Support ✅
- **Demo Credentials**: Auto-login on localhost
- **Skip Launcher Auth**: Direct access for development
- **Demo Token Generation**: Client-side JWT creation

---

## Installation

### 1. Include Required Scripts

**In `pos/frontend/index.html`** (in this order):

```html
<!-- Encryption Service (required) -->
<script src="js/services/encryption-service.js"></script>

<!-- Enhanced Authentication (NEW) -->
<script src="../../shared/auth-enhanced.js"></script>

<!-- Your app code -->
<script src="js/app.js"></script>
```

### 2. Verify Loading

Open browser console and verify:

```
✅ EncryptionService module loaded
✅ Enhanced Authentication System v2.0 loaded
[AUTH v2] Initializing enhanced authentication...
```

---

## Usage

### Basic API Usage

#### Check Authentication

```javascript
// Check if user is authenticated
if (NASHTY_AUTH.hasValidAuth()) {
  console.log('User is authenticated');
}

// Get current session
const session = NASHTY_AUTH.getSession();
console.log(session.user.name); // "John Doe"
console.log(session.permissions); // ["pos.view", "pos.create_order", ...]
```

#### Get User Information

```javascript
const user = NASHTY_AUTH.getUser();
console.log(user);
// {
//   id: "uuid",
//   name: "John Doe",
//   role: "cashier",
//   tenantId: "uuid",
//   outletId: "uuid"
// }

const outlet = NASHTY_AUTH.getOutlet();
console.log(outlet);
// {
//   id: "uuid",
//   name: "Main Branch"
// }

const token = NASHTY_AUTH.getToken();
console.log(token); // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Manual Token Refresh

```javascript
try {
  const success = await NASHTY_AUTH.refreshToken();
  if (success) {
    console.log('Token refreshed successfully');
  }
} catch (error) {
  console.error('Token refresh failed:', error);
}
```

#### Logout

```javascript
// Logout with reason
NASHTY_AUTH.logout('user_logout');

// Available reasons:
// - 'user_logout': User clicked logout button
// - 'session_timeout': Session expired
// - 'token_expired': Token couldn't be refreshed
// - 'unauthorized': 401/403 from API
```

---

## Permissions System

### Available Permissions

```javascript
// POS Permissions
'pos.view'             // View POS interface
'pos.create_order'     // Create new orders
'pos.edit_order'       // Edit existing orders
'pos.delete_order'     // Delete orders
'pos.apply_discount'   // Apply discounts
'pos.refund'           // Process refunds
'pos.void_transaction' // Void transactions

// Payment Permissions
'payment.cash'         // Accept cash payments
'payment.card'         // Process card payments
'payment.digital'      // Accept digital payments

// Shift Permissions
'shift.open'           // Open shift
'shift.close'          // Close shift
'shift.view_reports'   // View shift reports

// Inventory Permissions
'inventory.view'       // View inventory
'inventory.adjust'     // Adjust inventory levels

// Settings Permissions
'settings.view'        // View settings
'settings.edit'        // Edit settings

// Admin Permissions
'admin.manage_users'   // Manage users
'admin.view_audit_log' // View audit logs
'admin.system_config'  // System configuration
```

### Role Definitions

```javascript
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
    'pos.*',           // All POS permissions
    'payment.*',       // All payment permissions
    'shift.*',         // All shift permissions
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
  
  admin: ['*']         // All permissions
};
```

### Permission Checking

#### Single Permission Check

```javascript
// Check if user has permission
if (NASHTY_AUTH.hasPermission('pos.apply_discount')) {
  // User can apply discounts
  applyDiscount();
} else {
  showToast('⛔ You need permission to apply discounts', 'error');
}
```

#### Multiple Permission Checks

```javascript
// Check if user has ANY of these permissions
if (NASHTY_AUTH.hasAnyPermission('pos.edit_order', 'pos.delete_order')) {
  // User can edit OR delete orders
  showEditDeleteButtons();
}

// Check if user has ALL of these permissions
if (NASHTY_AUTH.hasAllPermissions('pos.refund', 'payment.cash')) {
  // User can refund AND handle cash
  processRefund();
}
```

#### Require Permission (Throw on Deny)

```javascript
try {
  // Will throw error if permission denied
  NASHTY_AUTH.requirePermission('pos.void_transaction', 'void this transaction');
  
  // Code only executes if permission granted
  voidTransaction();
  
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    console.error(error.message);
    // "Unauthorized: You need 'pos.void_transaction' permission to void this transaction"
  }
}
```

### Keyboard Shortcuts with Permissions

Keyboard shortcuts automatically check permissions:

```javascript
// In keyboard-shortcuts.js
{
  'Ctrl+P': {
    action: 'openPayment',
    description: 'Open payment dialog',
    requiresPermission: 'pos.create_order'  // ← Permission required
  },
  
  'Delete': {
    action: 'removeSelectedItem',
    description: 'Remove selected item',
    requiresPermission: 'pos.edit_order'
  },
  
  'Shift+F1': {
    action: 'assignProduct',
    description: 'Assign product to F1',
    requiresPermission: 'settings.edit'  // Only supervisor+
  }
}
```

**Behavior**: If user presses `Delete` without `pos.edit_order` permission:
- Shortcut is blocked
- Toast message: "⛔ Unauthorized: You need 'pos.edit_order' permission"
- Audit event logged

---

## Audit Logging

### Logged Events

The system automatically logs:

1. **Authentication Events**:
   - `session_started`: User logged in
   - `session_ended`: User logged out
   - `token_refreshed`: Token auto-refreshed

2. **Authorization Events**:
   - `permission_denied`: Permission check failed
   - `api_permission_denied`: API returned 403
   - `shortcut_permission_denied`: Keyboard shortcut blocked

3. **Custom Events**: Log your own events

### Logging Events

```javascript
// Log custom audit event
NASHTY_AUTH.logAuditEvent('order_voided', {
  orderId: '12345',
  amount: 150000,
  reason: 'Customer request',
  approvedBy: 'Manager John'
});
```

### Retrieving Audit Log

```javascript
// Get all audit events
const allEvents = NASHTY_AUTH.getAuditLog();
console.log(allEvents);

// Filter by user
const userEvents = NASHTY_AUTH.getAuditLog({
  userId: 'user-uuid'
});

// Filter by event type
const permissionDenials = NASHTY_AUTH.getAuditLog({
  eventType: 'permission_denied'
});

// Filter by date range
const todayEvents = NASHTY_AUTH.getAuditLog({
  startDate: '2024-01-15T00:00:00Z',
  endDate: '2024-01-15T23:59:59Z'
});

// Multiple filters
const filteredEvents = NASHTY_AUTH.getAuditLog({
  userId: 'user-uuid',
  eventType: 'session_started',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### Audit Log Entry Format

```javascript
{
  id: "uuid",
  type: "permission_denied",
  timestamp: "2024-01-15T10:30:00.000Z",
  userId: "user-uuid",
  permission: "pos.void_transaction",
  action: "void this transaction",
  // ... other event-specific data
}
```

### Real-Time Monitoring

Listen for audit events in real-time:

```javascript
window.addEventListener('nashty:audit-log', (event) => {
  const auditEvent = event.detail;
  
  console.log(`[AUDIT] ${auditEvent.type}:`, auditEvent);
  
  // Send to monitoring service
  if (auditEvent.type === 'permission_denied') {
    sendToMonitoring(auditEvent);
  }
});
```

---

## API Reference

### `NASHTY_AUTH` Global Object

#### Session Methods

##### `hasValidAuth(): boolean`
Check if user is authenticated with valid token.

```javascript
if (NASHTY_AUTH.hasValidAuth()) {
  // User is authenticated
}
```

##### `getSession(): object | null`
Get current session object.

```javascript
const session = NASHTY_AUTH.getSession();
// {
//   token: "jwt-token",
//   user: { id, name, role, ... },
//   outlet: { id, name },
//   startTime: 1642248000000,
//   permissions: ["pos.view", "pos.create_order", ...]
// }
```

##### `getAuthData(): object`
Get authentication data (token, user, outlet).

```javascript
const { token, user, outlet } = NASHTY_AUTH.getAuthData();
```

##### `getToken(): string | null`
Get access token.

##### `getUser(): object | null`
Get user object.

##### `getOutlet(): object | null`
Get outlet object.

#### Permission Methods

##### `hasPermission(permission: string): boolean`
Check if user has specific permission.

```javascript
NASHTY_AUTH.hasPermission('pos.apply_discount'); // true/false
```

##### `hasAnyPermission(...permissions: string[]): boolean`
Check if user has any of the permissions.

```javascript
NASHTY_AUTH.hasAnyPermission('pos.refund', 'pos.void_transaction');
```

##### `hasAllPermissions(...permissions: string[]): boolean`
Check if user has all permissions.

```javascript
NASHTY_AUTH.hasAllPermissions('pos.refund', 'payment.cash');
```

##### `requirePermission(permission: string, action?: string): void`
Require permission or throw error.

```javascript
try {
  NASHTY_AUTH.requirePermission('admin.system_config');
  // Proceed with privileged operation
} catch (error) {
  console.error(error.message);
}
```

##### `getUserPermissions(): string[]`
Get all user permissions.

```javascript
const permissions = NASHTY_AUTH.getUserPermissions();
// ["pos.view", "pos.create_order", "payment.cash", ...]
```

#### Action Methods

##### `logout(reason?: string): Promise<void>`
Logout and clear session.

```javascript
NASHTY_AUTH.logout('user_logout');
```

##### `refreshToken(): Promise<boolean>`
Manually refresh access token.

```javascript
const success = await NASHTY_AUTH.refreshToken();
```

#### Audit Methods

##### `logAuditEvent(type: string, data: object): void`
Log custom audit event.

```javascript
NASHTY_AUTH.logAuditEvent('custom_event', {
  foo: 'bar',
  timestamp: new Date().toISOString()
});
```

##### `getAuditLog(filters?: object): array`
Get audit log entries with optional filters.

```javascript
const events = NASHTY_AUTH.getAuditLog({
  userId: 'uuid',
  eventType: 'permission_denied',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

---

## Backend Integration

### Required API Endpoints

#### 1. Token Refresh Endpoint

```javascript
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token-string"
}

// Response
{
  "success": true,
  "token": "new-access-token",
  "refreshToken": "new-refresh-token", // Optional
  "user": { /* user object */ },
  "outlet": { /* outlet object */ }
}
```

**Implementation Example (Node.js/Express)**:

```javascript
router.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        sub: user.id, 
        role: user.role,
        tenantId: user.tenantId,
        outletId: user.outletId
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Optionally rotate refresh token
    const newRefreshToken = jwt.sign(
      { sub: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        outletId: user.outletId
      },
      outlet: {
        id: user.outlet.id,
        name: user.outlet.name
      }
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});
```

#### 2. JWT Token Format

**Access Token Payload**:

```json
{
  "sub": "user-uuid",
  "name": "John Doe",
  "role": "cashier",
  "tenantId": "tenant-uuid",
  "outletId": "outlet-uuid",
  "iat": 1642248000,
  "exp": 1642251600
}
```

**Required Claims**:
- `sub`: User ID (subject)
- `role`: User role (for RBAC)
- `exp`: Expiry timestamp (for auto-refresh)
- `iat`: Issued at timestamp

**Optional Claims**:
- `name`: User display name
- `tenantId`: Multi-tenant ID
- `outletId`: Branch/outlet ID

#### 3. Protected API Endpoints

All API endpoints should:
1. Verify JWT token in `Authorization` header
2. Extract user info from token
3. Check permissions if needed
4. Return 401 for invalid/expired tokens
5. Return 403 for permission denials

```javascript
// Middleware example
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1]; // Bearer <token>
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Permission checking middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = ROLES[userRole] || [];
    
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: 'Permission denied', required: permission });
    }
  };
};

// Usage
router.post('/orders', authenticateJWT, requirePermission('pos.create_order'), async (req, res) => {
  // Create order
});
```

---

## Security Best Practices

### 1. Token Security

✅ **DO**:
- Store tokens in localStorage (encrypted if needed)
- Use HTTPS for all API calls
- Set short expiry for access tokens (1 hour)
- Use long expiry for refresh tokens (30 days)
- Rotate refresh tokens on use
- Implement token revocation on logout

❌ **DON'T**:
- Store tokens in cookies (CSRF risk)
- Use localStorage on HTTP sites (XSS risk)
- Set very long access token expiry
- Share tokens between users/devices
- Log tokens in console/logs

### 2. Permission Management

✅ **DO**:
- Check permissions on both client and server
- Use granular permissions (avoid wildcards in production)
- Log permission denials for security monitoring
- Review role permissions regularly
- Implement least privilege principle

❌ **DON'T**:
- Rely only on client-side permission checks
- Give users more permissions than needed
- Use generic "admin" role for everything
- Skip permission checks for "internal" operations

### 3. Audit Logging

✅ **DO**:
- Log all authentication events
- Log permission denials
- Log sensitive operations (refunds, voids, etc.)
- Send audit logs to backend periodically
- Review audit logs for suspicious activity
- Keep audit logs for compliance (6-12 months)

❌ **DON'T**:
- Log sensitive data (passwords, card numbers)
- Store audit logs only on client
- Ignore audit log patterns
- Delete audit logs prematurely

### 4. Session Management

✅ **DO**:
- Set reasonable session timeouts (12 hours)
- Monitor user activity
- Logout on browser close (if needed)
- Clear encryption keys on logout
- Invalidate tokens server-side on logout

❌ **DON'T**:
- Use infinite session timeouts
- Allow multiple active sessions per user (without tracking)
- Keep encryption keys after logout
- Trust client-side session state alone

---

## Troubleshooting

### Common Issues

#### 1. "No valid authentication found"

**Cause**: Token not received from launcher or expired

**Solution**:
```javascript
// Check if in dev mode
if (window.location.hostname === 'localhost') {
  // Dev mode should auto-login with demo credentials
  console.log('Dev mode: check if auth-enhanced.js loaded correctly');
}

// Production: check postMessage from launcher
window.addEventListener('message', (event) => {
  console.log('Received message:', event.data);
});
```

#### 2. "Token refresh failed"

**Cause**: Refresh token invalid or backend endpoint not working

**Solution**:
```javascript
// Check backend endpoint
fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    refreshToken: NASHTY_AUTH.getAuthData().refreshToken 
  })
}).then(res => res.json()).then(console.log);

// Check if refresh token exists
console.log('Refresh token:', localStorage.getItem('nashty_refresh_token'));
```

#### 3. "Permission denied" unexpectedly

**Cause**: User role doesn't have required permission

**Solution**:
```javascript
// Check user role and permissions
const user = NASHTY_AUTH.getUser();
console.log('User role:', user.role);
console.log('User permissions:', NASHTY_AUTH.getUserPermissions());

// Check if specific permission is granted
console.log('Has permission?', NASHTY_AUTH.hasPermission('pos.apply_discount'));
```

#### 4. Keyboard shortcuts not working

**Cause**: Input field focused or permission denied

**Solution**:
```javascript
// Check if input focused
console.log('Active element:', document.activeElement.tagName);

// Check shortcut permissions
const shortcuts = window.KeyboardShortcutHandler?.shortcuts;
if (shortcuts) {
  shortcuts.forEach((config, combo) => {
    if (config.requiresPermission) {
      console.log(
        `${combo}: ${NASHTY_AUTH.hasPermission(config.requiresPermission) ? '✅' : '❌'}`
      );
    }
  });
}
```

#### 5. Encryption key initialization failed

**Cause**: EncryptionService not loaded or token invalid

**Solution**:
```javascript
// Check if EncryptionService loaded
console.log('EncryptionService:', window.EncryptionService);

// Manually initialize encryption key
const user = NASHTY_AUTH.getUser();
const token = NASHTY_AUTH.getToken();
if (user && token) {
  window.EncryptionService.deriveKey(user.id, token)
    .then(() => console.log('✅ Key derived'))
    .catch(err => console.error('❌ Key derivation failed:', err));
}
```

---

## Migration Guide

### Migrating from Old Auth System

If you're using the old `shared/auth.js`, here's how to migrate:

#### 1. Replace Script Tag

**Before**:
```html
<script src="../shared/auth.js"></script>
```

**After**:
```html
<script src="js/services/encryption-service.js"></script>
<script src="../shared/auth-enhanced.js"></script>
```

#### 2. Update API Calls

**Before**:
```javascript
if (window.NASHTY_AUTH && NASHTY_AUTH.hasValidAuth()) {
  const token = NASHTY_AUTH.getToken();
  // Use token
}
```

**After** (same API, backward compatible):
```javascript
if (NASHTY_AUTH.hasValidAuth()) {
  const token = NASHTY_AUTH.getToken();
  // Use token
}
```

#### 3. Add Permission Checks (Optional)

```javascript
// Add permission checks to privileged operations
if (NASHTY_AUTH.hasPermission('pos.apply_discount')) {
  applyDiscount();
} else {
  showToast('Permission denied', 'error');
}
```

#### 4. Enable Audit Logging (Optional)

```javascript
// Log important events
NASHTY_AUTH.logAuditEvent('order_completed', {
  orderId: order.id,
  amount: order.total,
  userId: NASHTY_AUTH.getUser().id
});
```

---

## Configuration

### Customize Auth Config

Edit `shared/auth-enhanced.js`:

```javascript
const AUTH_CONFIG = {
  // ... defaults
  
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000,  // Refresh 5 min before expiry
  SESSION_TIMEOUT: 12 * 60 * 60 * 1000,    // 12 hour timeout
  MAX_RETRY_ATTEMPTS: 3,                    // Max refresh retries
  MAX_AUDIT_ENTRIES: 1000                   // Max audit log size
};
```

### Customize Roles and Permissions

Edit `shared/auth-enhanced.js`:

```javascript
const PERMISSIONS = {
  // Add custom permissions
  'custom.action': 'Custom action description'
};

const ROLES = {
  // Add custom roles
  custom_role: [
    'pos.view',
    'pos.create_order',
    'custom.action'
  ]
};
```

---

## Support

### Getting Help

1. **Check Console Logs**: All auth operations are logged with `[AUTH v2]` prefix
2. **Check Audit Log**: Review recent events for clues
3. **Test in Dev Mode**: Localhost auto-login helps isolate issues
4. **Verify Backend**: Test token refresh endpoint directly

### Reporting Issues

When reporting auth issues, include:

1. Browser console logs (filter by `[AUTH v2]`)
2. Network tab (API calls to `/auth/refresh`)
3. User role and permissions
4. Steps to reproduce
5. Expected vs actual behavior

---

**Version**: 2.0  
**Last Updated**: 2024-01-15  
**Author**: NASHTY OS Development Team  
**License**: Proprietary

