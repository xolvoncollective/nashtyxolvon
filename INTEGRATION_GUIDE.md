# Integration Guide - Menghubungkan Mockup ke Backend API

## Prinsip Integrasi (Sesuai PROJECT SYSTEM CONTEXT)

✅ **DILARANG** membuat ulang aplikasi dari nol  
✅ **WAJIB** mempertahankan HTML, CSS, dan layout mockup yang ada  
✅ **FOKUS** pada:
1. Cleanup JavaScript yang ada
2. Fix perhitungan matematika (pajak, service charge, diskon)
3. Replace hardcoded data dengan API calls

---

## Step 1: Include API Client

Tambahkan di bagian `<head>` setelah tag `<title>`:

```html
<!-- API Client -->
<script src="api-client.js"></script>
```

---

## Step 2: Modifikasi Login Function

### SEBELUM (Hardcoded):
```javascript
const STAFF = [
  { id: 'citra', name: 'Citra', role: 'Kasir', pin: '1234', color: '#E4540C' },
  { id: 'budi', name: 'Budi', role: 'Kasir', pin: '2345', color: '#3B82F6' }
];
```

### SESUDAH (API-Connected):
```javascript
// Di bagian initialization
let STAFF = [];

// Load staff dari API
async function loadStaff() {
  try {
    const data = await API.auth.getStaff();
    STAFF = data.staff.map(s => ({
      id: s.id,
      name: s.name,
      role: s.role,
      pin: '', // Don't store PIN in frontend
      avatar: s.avatar
    }));
    renderStaffGrid();
  } catch (error) {
    console.error('Failed to load staff:', error);
  }
}

// Panggil saat page load
loadStaff();
```

### Login dengan PIN:
```javascript
async function doLogin(pin) {
  try {
    const result = await API.auth.login(pin);
    
    if (result.success) {
      currentUser = result.user;
      
      // Check active shift
      const shiftData = await API.shifts.getActive();
      
      if (!shiftData.shift) {
        // Prompt for shift start
        showShiftStartModal();
      } else {
        // Continue with existing shift
        proceedToApp();
      }
    }
  } catch (error) {
    showError('PIN salah atau user tidak ditemukan');
  }
}
```

---

## Step 3: Load Menu dari API

### SEBELUM (Hardcoded):
```javascript
const CATS = [
  { id: 'main', label: 'Makanan', svg: '...' },
  { id: 'drink', label: 'Minuman', svg: '...' }
];

const MENU = [
  { id: 1, cat: 'main', n: 'Nasi Goreng', p: 35000, ... }
];
```

### SESUDAH (API-Connected):
```javascript
let CATS = [];
let MENU = [];

async function loadCategories() {
  try {
    const data = await API.categories.getAll();
    CATS = data.categories.map(c => ({
      id: c.id,
      label: c.name,
      slug: c.slug,
      icon: c.icon,
      color: c.color
    }));
    renderCategoryTabs();
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

async function loadProducts(categoryId = null) {
  try {
    const filters = categoryId ? { categoryId } : {};
    const data = await API.products.getAll(filters);
    
    MENU = data.products.map(p => ({
      id: p.id,
      cat: p.category_id,
      n: p.name,
      p: p.price,
      d: p.description,
      img: p.image_url,
      isFav: p.is_favorite === 1,
      hasOpts: p.has_modifiers === 1
    }));
    
    renderMenuGrid();
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}

// Load on page init
async function initPOS() {
  await loadCategories();
  await loadProducts();
}
```

---

## Step 4: Fix Perhitungan Matematika

### SEBELUM (Potential Floating-Point Error):
```javascript
function calcT() {
  const sub = cart.reduce((s, i) => s + i.p * i.qty, 0);
  const disc = Math.min(discount, sub);
  const base = sub - disc;
  const tax = Math.round(base * .11);  // ❌ Bisa error pembulatan
  const svc = Math.round(base * .05);  // ❌ Bisa error pembulatan
  return { sub, disc, base, tax, svc, grand: base + tax + svc };
}
```

### SESUDAH (Accurate Calculation):
```javascript
function calcT() {
  // Subtotal: sum all items (harga × qty)
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
  
  return {
    sub,      // Subtotal sebelum diskon
    disc,     // Nilai diskon
    base,     // Subtotal setelah diskon
    tax,      // Pajak 11%
    svc,      // Service charge 5%
    grand     // Total akhir
  };
}
```

### Test Cases untuk Validasi:
```javascript
// Test Case 1: Tanpa Diskon
cart = [{ id: 1, n: 'Item A', p: 100000, qty: 1 }];
discount = 0;
// Expected: sub=100000, disc=0, base=100000, tax=11000, svc=5000, grand=116000

// Test Case 2: Dengan Diskon Rp10.000
cart = [{ id: 1, n: 'Item A', p: 100000, qty: 1 }];
discount = 10000;
// Expected: sub=100000, disc=10000, base=90000, tax=9900, svc=4500, grand=104400

// Test Case 3: Multiple Items
cart = [
  { id: 1, n: 'Item A', p: 55000, qty: 2 },
  { id: 2, n: 'Item B', p: 22000, qty: 1 }
];
discount = 0;
// Expected: sub=132000, disc=0, base=132000, tax=14520, svc=6600, grand=153120
```

---

## Step 5: Submit Order ke Backend

### SESUDAH Payment Success:
```javascript
async function processPayment(paymentMethod, amount) {
  try {
    const { sub, disc, tax, svc, grand } = calcT();
    
    // Map cart items ke format API
    const items = cart.map(item => ({
      productId: item.id,
      productName: item.n,
      quantity: item.qty,
      unitPrice: item.p,
      subtotal: item.p * item.qty,
      notes: item.note || null,
      modifiers: item.selectedMods ? item.selectedMods.map(m => ({
        groupId: m.groupId,
        groupName: m.groupName,
        optionId: m.optionId,
        optionName: m.optionName,
        priceAdjustment: m.priceAdjustment || 0
      })) : []
    }));
    
    // Submit order
    const orderData = {
      orderType: orderType, // 'dine-in', 'takeaway', etc
      tableNumber: document.getElementById('tbl-no').value || null,
      items: items,
      subtotal: sub,
      discount: disc,
      tax: tax,
      serviceCharge: svc,
      total: grand,
      paymentMethod: paymentMethod,
      notes: null
    };
    
    const result = await API.orders.create(orderData);
    
    if (result.success) {
      console.log('Order created:', result.order);
      showSuccessModal(result.order);
      clearCart();
    }
  } catch (error) {
    console.error('Failed to create order:', error);
    showError('Gagal menyimpan order. Silakan coba lagi.');
  }
}
```

---

## Step 6: Load Order History dari API

### SEBELUM (Hardcoded):
```javascript
const HISTORY = [
  { id: 1, no: 'SNY-0187', table: 'T12', ... }
];
```

### SESUDAH (API-Connected):
```javascript
let HISTORY = [];

async function loadOrderHistory(filters = {}) {
  try {
    const data = await API.orders.getAll({
      limit: 50,
      ...filters
    });
    
    HISTORY = data.orders.map(o => ({
      id: o.id,
      no: o.order_number,
      table: o.table_number || '-',
      type: o.order_type,
      cashier: o.cashier_name,
      time: formatTime(o.created_at),
      method: o.payment_method,
      status: o.payment_status,
      sub: o.subtotal,
      disc: o.discount,
      tax: o.tax,
      svc: o.service_charge,
      total: o.total,
      items: o.items
    }));
    
    renderHistoryList();
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
```

---

## Step 7: Shift Management

### Start Shift:
```javascript
async function startShift(startCash) {
  try {
    const result = await API.shifts.start(startCash);
    
    if (result.success) {
      console.log('Shift started:', result.shift);
      return result.shift;
    }
  } catch (error) {
    if (error.message.includes('already has an open shift')) {
      showError('Anda sudah memiliki shift aktif');
    } else {
      showError('Gagal memulai shift');
    }
  }
}
```

### End Shift:
```javascript
async function endShift(endCash, notes) {
  try {
    const shiftId = API.session.shiftId;
    if (!shiftId) throw new Error('No active shift');
    
    const result = await API.shifts.end(shiftId, endCash, notes);
    
    if (result.success) {
      console.log('Shift ended:', result.shift);
      showShiftReport(result.shift);
      return result.shift;
    }
  } catch (error) {
    console.error('Failed to end shift:', error);
    showError('Gagal menutup shift');
  }
}
```

---

## Checklist Integrasi

### POS Module:
- [ ] Replace `STAFF` dengan `API.auth.getStaff()`
- [ ] Implement `API.auth.login(pin)`
- [ ] Replace `CATS` dengan `API.categories.getAll()`
- [ ] Replace `MENU` dengan `API.products.getAll()`
- [ ] Fix `calcT()` function - test dengan cases di atas
- [ ] Implement `API.orders.create()` setelah payment
- [ ] Replace `HISTORY` dengan `API.orders.getAll()`
- [ ] Implement `API.shifts.start()` dan `API.shifts.end()`
- [ ] Test calculation: subtotal, diskon, pajak, service charge, kembalian

### KDS Module:
- [ ] Load pending orders dengan `API.orders.getAll({ kitchenStatus: 'pending' })`
- [ ] Update order status dengan `API.orders.updateStatus()`
- [ ] Setup auto-refresh setiap 5 detik untuk real-time updates
- [ ] Group orders by station (Grill/Bar)

### Backoffice Module:
- [ ] Load KPI dengan `API.dashboard.getKPI()`
- [ ] Load recent orders dengan `API.dashboard.getRecentOrders()`
- [ ] Load shift reports dengan `API.shifts.getHistory()`

---

## Testing Workflow

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
2. **Open Browser:**
   ```
   http://localhost:3001/NASHTY_POS_Mockup.html
   ```

3. **Test Login:**
   - PIN: 1234 (Citra Dewi)
   - Should load staff from API

4. **Test Menu:**
   - Should load categories and products from API
   - Click category should filter products

5. **Test Cart Calculation:**
   - Add items to cart
   - Verify subtotal calculation
   - Apply discount
   - Verify tax (11%) and service charge (5%)
   - Verify grand total = base + tax + svc

6. **Test Order Submit:**
   - Complete payment
   - Check backend logs for order creation
   - Verify order appears in history

7. **Test KDS:**
   ```
   http://localhost:3001/NASHTY_KDS_Mockup.html
   ```
   - Should show orders with kitchen_status='pending'
   - Mark as complete should update status

---

## Common Issues & Solutions

### Issue: CORS Error
**Solution:** Backend sudah configured dengan `cors: { origin: '*' }`

### Issue: API calls return 400
**Solution:** Check `API.session` memiliki `tenantId` dan `outletId`

### Issue: Perhitungan tidak akurat
**Solution:** Use `Math.round()` untuk pajak dan service charge

### Issue: Order tidak muncul di KDS
**Solution:** Check `kitchen_status` di order, pastikan `'pending'`

---

## Next Steps (Phase 2 - Production)

1. Migrate database dari SQLite ke Supabase
2. Update `api-client.js` base URL ke production
3. Deploy backend ke Cloudflare Workers
4. Deploy frontend ke Cloudflare Pages
5. Setup WebSocket untuk real-time KDS updates

---

**Status:** ✅ Backend Ready | ⏳ Frontend Integration In Progress
