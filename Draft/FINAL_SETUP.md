# FINAL SETUP - NASHTY POS System

## ✅ GOOD NEWS - Backend Sudah Siap!

Backend yang ada di folder `NashtyFinal/backend` **sudah lengkap dan berjalan dengan baik!**

## 🚀 Quick Start (3 Steps)

### Step 1: Start Backend (Already Running! ✅)

```powershell
cd C:\Users\farsya\NashtyFinal\backend
# Backend sudah running di port 3000
# Check: http://localhost:3000/api/health
```

### Step 2: Access Mockup Files

Mockup HTML sudah di-copy ke `frontend/public/`:
- POS: `http://localhost:5173/NASHTY_POS_Mockup.html` (jika frontend dev server jalan)
- Atau buka langsung: `C:\Users\farsya\NashtyFinal\frontend\public\NASHTY_POS_Mockup.html`

### Step 3: Update api-client.js

File `api-client.js` sudah di-copy ke `frontend/public/` dengan API_BASE sudah benar (`http://localhost:3000/api`).

---

## 📡 Backend API Endpoints (Existing & Working)

### Authentication
```javascript
// Get staff list (perlu outletId)
GET /api/auth/staff/:outletId
// Response: { success: true, data: [{ id, name, role }] }

// Login dengan PIN
POST /api/auth/login
// Body: { userId: "...", pin: "1234" }
// Response: { success: true, data: { id, name, role, outlet_id } }

// Get outlets
GET /api/auth/outlets
// Response: { success: true, data: [{ id, name }] }
```

### Menu
```javascript
GET /api/menu/categories/:outletId
GET /api/menu/items/:outletId
GET /api/menu/items/:outletId/:categoryId
```

### Orders
```javascript
POST /api/orders
GET /api/orders/:outletId
GET /api/orders/detail/:orderId
PATCH /api/orders/:orderId/status
```

### Shifts
```javascript
POST /api/shifts/start
POST /api/shifts/end
GET /api/shifts/active/:userId
```

---

## 🔧 Integration Steps

### 1. Get Outlet ID First

Backend existing perlu `outletId` untuk banyak endpoint. Mari check database:

```powershell
cd C:\Users\farsya\NashtyFinal\backend
```

Check file `data/nashtypos.db` dengan SQLite browser, atau tambahkan endpoint:

```typescript
// Tambah di backend/src/index.ts
app.get('/api/debug/outlets', (req, res) => {
  const outlets = db.prepare('SELECT * FROM outlets').all();
  res.json(outlets);
});
```

### 2. Update Mockup HTML - Add API Client

Di setiap mockup HTML, tambahkan di bagian `<head>`:

```html
<!-- API Client -->
<script src="api-client.js"></script>
```

### 3. Initialize dengan Outlet ID

Di mockup, tambahkan di bagian initialization:

```javascript
// Set default outlet (get from backend first)
const DEFAULT_OUTLET_ID = 'demo-outlet'; // atau ID yang didapat dari DB

// Load staff untuk login
async function loadStaff() {
  try {
    const response = await fetch(`http://localhost:3000/api/auth/staff/${DEFAULT_OUTLET_ID}`);
    const data = await response.json();
    
    if (data.success) {
      STAFF = data.data.map(s => ({
        id: s.id,
        name: s.name,
        role: s.role,
        pin: '' // Don't store PIN in frontend
      }));
      renderStaffGrid();
    }
  } catch (error) {
    console.error('Failed to load staff:', error);
  }
}

// Load menu
async function loadMenu() {
  try {
    const response = await fetch(`http://localhost:3000/api/menu/items/${DEFAULT_OUTLET_ID}`);
    const data = await response.json();
    
    if (data.success) {
      MENU = data.data;
      renderMenuGrid();
    }
  } catch (error) {
    console.error('Failed to load menu:', error);
  }
}

// Call on page load
window.addEventListener('DOMContentLoaded', () => {
  loadStaff();
  loadMenu();
});
```

### 4. Update Login Function

```javascript
async function doLogin(userId, pin) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pin })
    });
    
    const data = await response.json();
    
    if (data.success) {
      currentUser = data.data;
      proceedToApp();
    } else {
      showError(data.error || 'Login gagal');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Koneksi ke server gagal');
  }
}
```

### 5. Update Order Submit

```javascript
async function submitOrder() {
  try {
    const { sub, disc, tax, svc, grand } = calcT();
    
    const orderData = {
      outletId: DEFAULT_OUTLET_ID,
      userId: currentUser.id,
      shiftId: currentShiftId, // dari shift start
      orderType: orderType, // 'dine-in', 'takeaway', etc
      tableNo: document.getElementById('tbl-no').value || null,
      items: cart.map(item => ({
        menuItemId: item.id,
        quantity: item.qty,
        unitPrice: item.p,
        subtotal: item.p * item.qty,
        notes: item.note || null,
        modifiers: item.modifiers || []
      })),
      subtotal: sub,
      discount: disc,
      tax: tax,
      serviceCharge: svc,
      total: grand,
      paymentMethod: paymentMethod,
      notes: null
    };
    
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Order created:', data.data);
      showSuccessModal(data.data);
      clearCart();
    } else {
      showError(data.error || 'Gagal menyimpan order');
    }
  } catch (error) {
    console.error('Submit order error:', error);
    showError('Koneksi ke server gagal');
  }
}
```

---

## ✅ Perhitungan Matematika yang Benar

Fungsi `calcT()` yang akurat:

```javascript
function calcT() {
  // Subtotal: sum all items
  const sub = cart.reduce((sum, item) => {
    return sum + (item.p * item.qty);
  }, 0);
  
  // Discount: tidak boleh melebihi subtotal
  const disc = Math.min(discount, sub);
  
  // Base amount setelah diskon
  const base = sub - disc;
  
  // Pajak 11% - round to nearest integer
  const tax = Math.round(base * 0.11);
  
  // Service charge 5% - round to nearest integer
  const svc = Math.round(base * 0.05);
  
  // Grand total
  const grand = base + tax + svc;
  
  return { sub, disc, base, tax, svc, grand };
}
```

**Test Cases:**

```javascript
// Test 1: Rp 100.000 tanpa diskon
// Expected: sub=100000, tax=11000, svc=5000, grand=116000

// Test 2: Rp 100.000 dengan diskon Rp 10.000
// Expected: sub=100000, disc=10000, base=90000, tax=9900, svc=4500, grand=104400

// Test 3: Multiple items (55000×2 + 22000×1)
// Expected: sub=132000, tax=14520, svc=6600, grand=153120
```

---

## 🎯 Checklist Integration

### POS Module (`NASHTY_POS_Mockup.html`)
- [ ] Add `<script src="api-client.js"></script>` to `<head>`
- [ ] Replace `STAFF` array dengan API call ke `/api/auth/staff/:outletId`
- [ ] Update login function ke `/api/auth/login`
- [ ] Replace `MENU` array dengan API call ke `/api/menu/items/:outletId`
- [ ] Fix `calcT()` function dengan formula yang benar
- [ ] Update order submit ke `/api/orders`
- [ ] Load order history dari `/api/orders/:outletId`
- [ ] Implement shift start/end

### KDS Module (`NASHTY_KDS_Mockup.html`)
- [ ] Load pending orders dari `/api/orders/:outletId?status=pending`
- [ ] Update order status dengan `/api/orders/:orderId/status`
- [ ] Auto-refresh setiap 5 detik
- [ ] Group by station (Grill/Bar)

### Backoffice Module (`NASHTY_Backoffice_Mockup_8.html`)
- [ ] Load dashboard metrics
- [ ] Load reports
- [ ] Manage menu
- [ ] Manage users

---

## 🔥 Priority: Start dengan POS Login

Mari mulai dari yang paling basic - Login screen:

### Test Login Flow:

1. **Get Outlet ID:**
   ```javascript
   fetch('http://localhost:3000/api/auth/outlets')
     .then(r => r.json())
     .then(d => console.log(d));
   ```

2. **Get Staff:**
   ```javascript
   const outletId = 'OUTLET_ID_DARI_STEP_1';
   fetch(`http://localhost:3000/api/auth/staff/${outletId}`)
     .then(r => r.json())
     .then(d => console.log(d));
   ```

3. **Login:**
   ```javascript
   const userId = 'USER_ID_DARI_STEP_2';
   const pin = '1234'; // PIN dari database
   
   fetch('http://localhost:3000/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ userId, pin })
   })
   .then(r => r.json())
   .then(d => console.log(d));
   ```

---

## 📊 Current Status

✅ Backend: Running di `http://localhost:3000`  
✅ Mockup Files: Copied to `frontend/public/`  
✅ API Client: Ready di `frontend/public/api-client.js`  
✅ Database: SQLite dengan seed data  

⏳ Next: Integrate mockup HTML dengan backend API  
⏳ Priority: Fix login flow dengan real API calls  

---

## 🤝 Need Help?

Jika ada error saat integrasi:

1. Check browser console (F12) untuk error messages
2. Check backend logs di terminal
3. Verify API endpoint dengan Postman/curl
4. Verify database data dengan SQLite browser

---

**Backend URL:** http://localhost:3000  
**API Base:** http://localhost:3000/api  
**Mockups:** C:\Users\farsya\NashtyFinal\frontend\public\

**Ready to integrate! 🚀**
