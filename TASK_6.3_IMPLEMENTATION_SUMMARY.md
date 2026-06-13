# Task 6.3 Implementation Summary

## JWT Token Reception from Parent Window

**Date:** 2024-01-10
**Task:** Update POS, KDS, and Backoffice to read JWT from parent window

## Implementation Details

### 1. Shared Authentication Handler Created

**File:** `shared/auth.js`

A centralized authentication module that:
- Listens for `postMessage` events from the launcher window (index.html)
- Validates message origin (`http://localhost:3099`)
- Stores JWT token, user, and outlet data in localStorage
- Automatically adds `Authorization: Bearer <token>` header to all fetch requests
- Redirects to launcher if token is missing or expired (401/403 responses)
- Syncs authentication data with `window.API.session` object

**Key Features:**
- Message listener for `NASHTY_AUTH` message type
- Secure origin validation
- Fetch interceptor for automatic Authorization header injection
- 401/403 response handling with automatic redirect
- Custom event dispatch (`nashty:auth-received`) for app-specific initialization
- localStorage keys: `nashty_token`, `nashty_user`, `nashty_outlet`

### 2. Module Updates

#### KDS Frontend
**File:** `kds/frontend/index.html`
- Added `<script src="../../shared/auth.js"></script>` before existing scripts
- Auth handler automatically initialized on page load

#### POS Frontend  
**File:** `pos/frontend/index.html`
- Added `<script src="../../shared/auth.js"></script>` before existing scripts
- Auth handler automatically initialized on page load

#### Backoffice Frontend
**File:** `backoffice/frontend/index.html`
- Added `<script src="../../shared/auth.js"></script>` before existing scripts
- Auth handler automatically initialized on page load

### 3. Integration with Existing Code

The shared auth handler integrates seamlessly with existing code:

1. **Automatic Token Sync:** When auth data is received, it automatically syncs with `window.API.session` if the API object exists
2. **Fetch Interception:** Overrides `window.fetch` to inject Authorization header on all requests
3. **Error Handling:** Catches 401/403 responses and redirects to launcher
4. **No App Changes Needed:** Existing API calls continue to work without modification

### 4. Workflow

```
┌──────────────┐
│   Launcher   │ (index.html)
│  (Port 3099) │
└──────┬───────┘
       │ 1. User logs in with PIN
       │ 2. Opens POS/KDS/Backoffice
       │
       ├─────── window.open('/pos')
       │        window.open('/kds')
       │        window.open('/backoffice')
       │
       │ 3. Send postMessage after 1 second
       ├─────── postMessage({
       │          type: 'NASHTY_AUTH',
       │          token: jwt_token,
       │          user: {...},
       │          outlet: {...}
       │        })
       │
       ▼
┌──────────────────────────┐
│   Child Window (Module)  │
│   POS / KDS / Backoffice │
└──────────────────────────┘
       │
       │ 4. shared/auth.js receives message
       ├─────── Validates origin
       ├─────── Stores in localStorage
       ├─────── Syncs with API.session
       ├─────── Dispatches event
       │
       │ 5. All API calls now include:
       ├─────── Authorization: Bearer <token>
       │
       │ 6. If 401/403 received:
       └─────── Redirect to launcher
```

### 5. Security Features

1. **Origin Validation:** Only accepts messages from `http://localhost:3099`
2. **Token Expiration:** Automatically detects expired tokens via 401/403 responses
3. **Secure Storage:** Uses localStorage (suitable for development, production should use httpOnly cookies)
4. **Automatic Cleanup:** Clears auth data on unauthorized responses

### 6. API Integration

The implementation works with existing API clients:

**KDS api.js:**
```javascript
const API = {
  session: {
    token: null,  // Auto-synced by shared/auth.js
    user: null,
    tenantId: null,
    outletId: null
  }
}
```

**POS api-client-v2.js:**
```javascript
const API = {
  session: {
    token: 'dev-token',  // Overridden by shared/auth.js
    user: {...},
    tenantId: 'demo-tenant',
    outletId: 'demo-outlet'
  }
}
```

### 7. Exposed API

`window.NASHTY_AUTH` provides:
- `hasValidAuth()` - Check if valid auth exists
- `getAuthData()` - Get token, user, outlet
- `getToken()` - Get JWT token
- `getUser()` - Get user object
- `getOutlet()` - Get outlet object
- `clearAuth()` - Clear all auth data
- `redirectToLauncher()` - Navigate to launcher
- `handleUnauthorized()` - Handle 401/403
- `syncWithAPI()` - Manually sync with API.session

### 8. Testing Checklist

- [x] Created shared/auth.js with postMessage listener
- [x] Added Authorization header to all fetch requests
- [x] Implemented 401/403 redirect logic
- [x] Updated KDS frontend to include auth script
- [x] Updated POS frontend to include auth script
- [x] Updated Backoffice frontend to include auth script
- [x] Synced auth data with existing API.session objects

### 9. Manual Testing Steps

1. **Start the server:**
   ```powershell
   .\start-local.ps1
   ```

2. **Open launcher:**
   - Navigate to `http://localhost:3099/`
   - Select outlet
   - Enter PIN
   - Click Login

3. **Test POS:**
   - Click "Open POS" button
   - Check browser console for auth logs:
     - `[NASHTY AUTH] Initializing authentication system...`
     - `[NASHTY AUTH] Received authentication data from launcher`
     - `[NASHTY AUTH] Syncing auth data with API.session`
   - Verify POS loads without redirect
   - Make an API call (e.g., load menu)
   - Check Network tab for `Authorization: Bearer <token>` header

4. **Test KDS:**
   - Click "Open KDS" button
   - Check browser console for auth logs
   - Verify KDS loads and polls for orders
   - Check Network tab for Authorization header

5. **Test Backoffice:**
   - Click "Open Backoffice" button
   - Check browser console for auth logs
   - Verify Backoffice loads dashboard
   - Check Network tab for Authorization header

6. **Test Unauthorized Redirect:**
   - Clear localStorage in POS/KDS/Backoffice
   - Refresh the module window
   - Should auto-redirect to launcher after 2 seconds

7. **Test Token Expiration:**
   - (If backend implements token expiration)
   - Wait for token to expire
   - Make an API call
   - Should receive 401 and redirect to launcher

### 10. Files Modified

```
c:\Users\farsya\himapatokayam\
├── shared/
│   └── auth.js                            (NEW - 230 lines)
├── kds/frontend/
│   └── index.html                         (MODIFIED - Added auth script)
├── pos/frontend/
│   └── index.html                         (MODIFIED - Added auth script)
└── backoffice/frontend/
    └── index.html                         (MODIFIED - Added auth script)
```

### 11. Next Steps (For Production)

1. **Token Refresh:** Implement token refresh logic before expiration
2. **HttpOnly Cookies:** Move JWT to httpOnly cookies for better security
3. **HTTPS Only:** Enforce HTTPS in production
4. **Token Validation:** Backend should validate token signature and expiration
5. **Session Management:** Implement server-side session tracking
6. **Multi-Tab Sync:** Sync auth state across browser tabs using BroadcastChannel API

## Completion Status

✅ Task 6.3 completed successfully

All three modules (POS, KDS, Backoffice) now:
- Receive JWT tokens from parent launcher window via postMessage
- Store tokens in localStorage for API requests
- Include tokens in Authorization header for all API calls
- Redirect to launcher if token is missing or expired

The implementation is ready for testing with the local development server.
