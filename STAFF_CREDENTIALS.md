# NASHTY OS - Staff Login Credentials

## 🔐 CORRECT PIN CODES (Updated 2025-01-13)

| Name | Role | PIN | Access Level |
|------|------|-----|--------------|
| **Superadmin** | superadmin | `0000` | Full system access, Settings menu |
| **Manager** | manager | `1212` | Manager functions |
| **Kasir** | manager | `8888` | POS cashier operations |
| **Owner** | manager | `9999` | Owner dashboard |

## 📋 Main Login (Email + Password)

| Email | Password | Access |
|-------|----------|--------|
| `superadmin@nashty` | `nashty1111` | Full access + Settings |
| `admin1@nashty` | `admin1` | Regular admin (no Settings) |

## ⚠️ IMPORTANT NOTES

1. **PIN Authentication** is used for POS staff selection
2. **Email/Password** is used for main launcher login
3. Settings menu **ONLY visible** to `superadmin@nashty`
4. All other users see Settings menu **locked (🔒 icon)**

## 🧪 Testing Quick Reference

### Test PIN Login (POS):
```javascript
// Correct test data:
const staffMember = "Kasir";
const correctPIN = "8888";  // NOT 1234!
```

### Test Main Login:
```javascript
// Superadmin login:
email: "superadmin@nashty"
password: "nashty1111"

// Regular admin login:
email: "admin1@nashty"  
password: "admin1"
```

## 🔗 Production URL
https://nashtyxolvon2.pages.dev

---

**Last Updated**: 2025-01-13  
**UAT Score Before Fix**: 75/100  
**Target Score After Fix**: 90+/100
