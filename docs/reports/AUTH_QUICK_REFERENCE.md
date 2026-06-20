# Authentication Quick Reference

## 🚀 Quick Start

### Include Scripts
```html
<script src="js/services/encryption-service.js"></script>
<script src="../../shared/auth-enhanced.js"></script>
```

### Check Auth Status
```javascript
if (NASHTY_AUTH.hasValidAuth()) {
  const user = NASHTY_AUTH.getUser();
  console.log(`Welcome, ${user.name}!`);
}
```

---

## 📋 Common Tasks

### Get Current User
```javascript
const user = NASHTY_AUTH.getUser();
// { id, name, role, tenantId, outletId }

const token = NASHTY_AUTH.getToken();
const outlet = NASHTY_AUTH.getOutlet();
```

### Check Permissions
```javascript
// Single permission
if (NASHTY_AUTH.hasPermission('pos.apply_discount')) {
  applyDiscount();
}

// Any of multiple
if (NASHTY_AUTH.hasAnyPermission('pos.refund', 'pos.void_transaction')) {
  showRefundButton();
}

// All of multiple
if (NASHTY_AUTH.hasAllPermissions('pos.refund', 'payment.cash')) {
  processCashRefund();
}

// Require (throws error if denied)
try {
  NASHTY_AUTH.requirePermission('admin.system_config');
  updateSystemSettings();
} catch (error) {
  showToast(error.message, 'error');
}
```

### Logout
```javascript
NASHTY_AUTH.logout('user_logout');
```

### Audit Logging
```javascript
// Log custom event
NASHTY_AUTH.logAuditEvent('order_completed', {
  orderId: '12345',
  amount: 150000,
  paymentMethod: 'cash'
});

// Get audit log
const events = NASHTY_AUTH.getAuditLog({ userId: 'user-uuid' });

// Listen for events
window.addEventListener('nashty:audit-log', (e) => {
  console.log('[AUDIT]', e.detail);
});
```

---

## 🔐 Roles & Permissions

### Roles
| Role | Description |
|------|-------------|
| `cashier` | Basic POS + payments |
| `server` | Order creation/editing |
| `supervisor` | Advanced operations + reports |
| `manager` | Full operational access |
| `admin` | System-wide permissions |

### Common Permissions
```javascript
// POS
'pos.view'            // View interface
'pos.create_order'    // Create orders
'pos.edit_order'      // Edit orders
'pos.delete_order'    // Delete orders
'pos.apply_discount'  // Apply discounts
'pos.refund'          // Process refunds
'pos.void_transaction' // Void transactions

// Payments
'payment.cash'        // Cash payments
'payment.card'        // Card payments
'payment.digital'     // Digital payments

// Shifts
'shift.open'          // Open shift
'shift.close'         // Close shift
'shift.view_reports'  // View reports

// Settings
'settings.view'       // View settings
'settings.edit'       // Edit settings

// Admin
'admin.manage_users'  // Manage users
'admin.view_audit_log' // View audit logs
```

---

## 🎹 Keyboard Shortcuts with Permissions

### Protected Shortcuts
```javascript
Ctrl+P  → Open payment        (requires: pos.create_order)
Ctrl+S  → Save draft          (requires: pos.create_order)
Delete  → Remove cart item    (requires: pos.edit_order)
Shift+F1-F12 → Assign product (requires: settings.edit)
```

### Add Permission to Shortcut
```javascript
{
  'Ctrl+X': {
    action: 'customAction',
    description: 'Do something',
    requiresPermission: 'pos.custom_action'
  }
}
```

---

## 🔧 Backend Integration

### Token Refresh Endpoint
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
  "refreshToken": "new-refresh-token",
  "user": { id, name, role, tenantId, outletId },
  "outlet": { id, name }
}
```

### JWT Token Format
```json
{
  "sub": "user-uuid",
  "role": "cashier",
  "exp": 1642251600,
  "iat": 1642248000
}
```

### Protected Endpoint Example
```javascript
// Middleware
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Usage
router.post('/orders', authenticateJWT, async (req, res) => {
  // Create order
});
```

---

## 🐛 Troubleshooting

### "No valid authentication found"
```javascript
// Check if token exists
console.log('Token:', NASHTY_AUTH.getToken());

// Check if in dev mode
console.log('Hostname:', window.location.hostname);
```

### "Token refresh failed"
```javascript
// Check refresh token
console.log('Refresh token:', localStorage.getItem('nashty_refresh_token'));

// Test endpoint
fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    refreshToken: localStorage.getItem('nashty_refresh_token')
  })
}).then(res => res.json()).then(console.log);
```

### "Permission denied" unexpectedly
```javascript
// Check user role and permissions
const user = NASHTY_AUTH.getUser();
console.log('Role:', user.role);
console.log('Permissions:', NASHTY_AUTH.getUserPermissions());

// Check specific permission
console.log('Has permission?', NASHTY_AUTH.hasPermission('pos.apply_discount'));
```

### Keyboard shortcuts not working
```javascript
// Check if input focused
console.log('Active element:', document.activeElement.tagName);

// Check permission for shortcut
const hasPermission = NASHTY_AUTH.hasPermission('pos.create_order');
console.log('Can use Ctrl+P?', hasPermission);
```

---

## 📚 Full Documentation

For complete documentation, see: `AUTH_ENHANCEMENT_DOCUMENTATION.md`

---

## 🎯 API Reference

### Session
```javascript
NASHTY_AUTH.hasValidAuth()           // Check if authenticated
NASHTY_AUTH.getSession()             // Get session object
NASHTY_AUTH.getToken()               // Get access token
NASHTY_AUTH.getUser()                // Get user object
NASHTY_AUTH.getOutlet()              // Get outlet object
```

### Permissions
```javascript
NASHTY_AUTH.hasPermission(perm)      // Check single permission
NASHTY_AUTH.hasAnyPermission(...perms) // Check any of permissions
NASHTY_AUTH.hasAllPermissions(...perms) // Check all permissions
NASHTY_AUTH.requirePermission(perm, action) // Require or throw
NASHTY_AUTH.getUserPermissions()     // Get all user permissions
```

### Actions
```javascript
NASHTY_AUTH.logout(reason)           // Logout user
NASHTY_AUTH.refreshToken()           // Manually refresh token
```

### Audit
```javascript
NASHTY_AUTH.logAuditEvent(type, data) // Log custom event
NASHTY_AUTH.getAuditLog(filters)     // Get audit log
```

---

**Version**: 2.0  
**Last Updated**: 2024-01-15

