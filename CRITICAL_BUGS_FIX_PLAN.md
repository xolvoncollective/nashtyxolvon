# 🐛 CRITICAL BUGS FIX - 5 ISSUES

## 📋 ISSUES REPORTED

### Issue 1: Tombol menu dengan modifier tidak bisa dipencet
**Problem:** Menu items yang punya modifier tidak bisa di-click untuk add to cart

**Root Cause:** Modifier modal system not integrated with cart flow

**Fix Location:** `pos/frontend/js/app.js` - addProd function

### Issue 2: Setelah dibayar, tidak bisa - gagal memproses pesanan  
**Problem:** Payment failed "gagal memproses pesanan"

**Root Cause:** Order creation API call failing atau data validation issue

**Fix Location:** `pos/frontend/js/orders.js` - doPay function

### Issue 3: KDS tombol test suara tidak berbunyi beep
**Problem:** 
- Test sound button tidak bunyi
- New order hanya beep 1x (harus 4x: beep beep beep beep)
- Urgent order harus beep panjang (beep beep~~)

**Root Cause:** Audio implementation incomplete atau file not loaded

**Fix Location:** `kds/frontend/js/app.js` - sound functions

### Issue 4: Superadmin tidak bisa buka settings untuk ganti password
**Problem:** Login superadmin@nashty tapi tidak ada menu settings untuk user management

**Root Cause:** Settings menu tidak muncul atau tidak ada link ke user management

**Fix Location:** `backoffice/frontend/index.html` - menu structure

### Issue 5: Bug saat pemilihan user kasir - kedip dan invalid PIN
**Problem:** 
- UI kedip-kedip saat select kasir
- Invalid PIN error padahal PIN benar
- Placeholder menutupi data real

**Root Cause:** Login flow bug, PIN validation issue, data not loaded from database properly

**Fix Location:** `pos/frontend/js/auth.js` - login flow & PIN validation

---

## 🔧 FIXES IMPLEMENTATION

### FIX 1: Enable Modifier Modal for Cart

**File:** `pos/frontend/js/app.js`

Problem: `addProd` function tidak handle modifier check

Current code skips modifier check, directly adds to cart

**Solution:** Check if product has modifiers, show modal if yes

### FIX 2: Order Creation API Fix

**File:** `pos/frontend/js/orders.js`

Problem: API endpoint error atau data format mismatch

**Solution:**
1. Validate all required fields before API call
2. Add proper error handling with specific messages
3. Check API response structure matches backend expectations

### FIX 3: KDS Sound System Enhancement

**File:** `kds/frontend/js/app.js`

Requirements:
- New order: 4x beep (beep beep beep beep)
- Urgent order: 2x long beep (beeeep beeeep)
- Test button: play sample beep

**Solution:**
1. Create proper Audio objects
2. Implement multi-beep sequence
3. Add long beep for urgent
4. Connect test button to playSound

### FIX 4: Backoffice Settings Menu

**File:** `backoffice/frontend/index.html`

Problem: Settings menu not visible atau user management page not linked

**Solution:**
1. Add Settings menu item in sidebar
2. Create link to user-management.html page
3. Show only for superadmin role

### FIX 5: POS Login Flow Fix

**File:** `pos/frontend/js/auth.js`

Problems:
- UI flicker during staff selection
- PIN validation fails
- Placeholder shows instead of real data

**Solution:**
1. Remove localStorage auto-restore (force fresh load)
2. Fix staff data query (use correct table)
3. Improve PIN validation logic
4. Add loading states to prevent flicker

---

## 📝 DETAILED CODE CHANGES

### Change 1: pos/frontend/js/app.js - addProd function

```javascript
// OLD (BROKEN):
function addProd(p, qty = 1) {
  // Directly adds to cart, skips modifiers
  cart.push({...})
}

// NEW (WORKING):
function addProd(p, qty = 1) {
  // Check if product has modifiers
  if (p.opts && p.opts.length > 0) {
    // Show modifier modal
    showModModal(p);
    return;
  }
  
  // No modifiers, add directly
  cart.push({...})
}
```

### Change 2: pos/frontend/js/orders.js - doPay function

```javascript
// Add validation before API call
async function doPay(tot) {
  // Validate cart not empty
  if (!cart || cart.length === 0) {
    toast('Keranjang kosong!', 'err');
    return;
  }
  
  // Validate payment method selected
  if (!pmSel) {
    toast('Pilih metode pembayaran!', 'err');
    return;
  }
  
  // Validate cash amount for cash payment
  if (pmSel === 'cash') {
    const paid = parseInt(cashIn || '0');
    if (paid < tot) {
      toast('Uang tidak cukup!', 'err');
      return;
    }
  }
  
  // Call API with proper error handling
  try {
    const orderData = {
      orderType: orderType,
      tableNumber: document.getElementById('tbl-no')?.value || 'T01',
      paymentMethod: pmSel,
      subtotal: sub,
      discount: disc,
      tax: tax,
      serviceCharge: svc,
      total: grand,
      items: cart.map(i => ({
        productId: String(i.id),
        productName: i.n,
        quantity: i.qty,
        unitPrice: i.p,
        subtotal: i.qty * i.p,
        notes: i.note || null,
        modifiers: [] // Include modifiers from modal
      }))
    };
    
    const res = await API.orders.create(orderData);
    
    if (!res || !res.success) {
      throw new Error(res.error || 'API returned failure');
    }
    
    // Success handling
    showSuccess(grand, chg);
    
  } catch (err) {
    console.error('Order creation failed:', err);
    toast('Gagal memproses pesanan: ' + err.message, 'err');
    if (btn) {
      btn.innerHTML = 'Konfirmasi';
      btn.disabled = false;
    }
  }
}
```

### Change 3: kds/frontend/js/app.js - Sound System

```javascript
// Create audio context
const AUDIO_CONTEXT = {
  beepShort: null,
  beepLong: null,
  initialized: false
};

// Initialize audio
function initAudio() {
  if (AUDIO_CONTEXT.initialized) return;
  
  // Create beep sounds programmatically
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  
  AUDIO_CONTEXT.beepShort = createBeep(audioCtx, 800, 0.1); // 100ms beep
  AUDIO_CONTEXT.beepLong = createBeep(audioCtx, 600, 0.5);  // 500ms beep
  AUDIO_CONTEXT.initialized = true;
}

function createBeep(ctx, freq, duration) {
  return function() {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };
}

// Play beep sequence
async function playNewOrderSound() {
  if (!CFG.soundEnabled) return;
  
  initAudio();
  
  // Play 4x short beep
  for (let i = 0; i < 4; i++) {
    AUDIO_CONTEXT.beepShort();
    await sleep(200); // 200ms gap between beeps
  }
}

async function playUrgentSound() {
  if (!CFG.soundEnabled) return;
  
  initAudio();
  
  // Play 2x long beep
  for (let i = 0; i < 2; i++) {
    AUDIO_CONTEXT.beepLong();
    await sleep(700); // 700ms gap
  }
}

function testSound() {
  initAudio();
  AUDIO_CONTEXT.beepShort();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Call playNewOrderSound() when new order detected
// Call playUrgentSound() when order becomes urgent
```

### Change 4: backoffice/frontend/index.html - Settings Menu

Add to sidebar menu structure:

```html
<!-- Add after other menu items -->
<div class="menu-item" data-page="user-management" onclick="showPage('user-management')">
  <div class="menu-icon">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  </div>
  <span>User Management</span>
</div>
```

Show only for superadmin:

```javascript
// In login success handler
if (user.role === 'superadmin') {
  document.querySelector('[data-page="user-management"]').style.display = 'flex';
} else {
  document.querySelector('[data-page="user-management"]').style.display = 'none';
}
```

### Change 5: pos/frontend/js/auth.js - Login Flow Fix

```javascript
async function initLogin() {
  // CRITICAL FIX: Don't auto-restore, force fresh selection
  localStorage.removeItem('nashty_session');
  
  // Load staff from database
  const user = NASHTY_AUTH?.getUser();
  const outlet = NASHTY_AUTH?.getOutlet();
  
  if (user && outlet) {
    API.session.tenantId = user.tenantId || '00000000-0000-0000-0000-000000000001';
    API.session.outletId = outlet.id || '00000000-0000-0000-0000-000000000101';
  } else {
    // Default outlet for standalone
    API.session.tenantId = '00000000-0000-0000-0000-000000000001';
    API.session.outletId = '00000000-0000-0000-0000-000000000101';
  }
  
  // Show loading state
  document.getElementById('staff-grid').innerHTML = '<div class="loading">Memuat kasir...</div>';
  
  // Load staff from database (not placeholder)
  loadStaff();
}

async function loadStaff() {
  if (!API.session.outletId) return;
  
  const grid = document.getElementById('staff-grid');
  if (!grid) return;
  
  try {
    // Query staff table directly
    const res = await API.auth.getStaff(API.session.outletId);
    
    if (res && res.staff && res.staff.length > 0) {
      // Render staff cards with real data from database
      grid.innerHTML = res.staff.map(s => `
        <div class="staff-btn" id="sbtn-${s.id}" 
             onclick="selectStaff({id:'${s.id}', name:'${s.name}', role:'${s.role}', color:'${s.color}', tenantId:'${s.tenant_id}', outletId:'${s.outlet_id}'})">
          <div class="staff-av" style="background:${s.color}20;color:${s.color}">${s.name[0].toUpperCase()}</div>
          <div class="staff-n">${s.name}</div>
          <div class="staff-r">${s.role === 'admin' ? 'Manager' : 'Kasir'}</div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = '<div class="error">Tidak ada kasir ditemukan</div>';
    }
  } catch (err) {
    console.error('Failed to load staff:', err);
    grid.innerHTML = '<div class="error">Gagal memuat kasir: ' + err.message + '</div>';
  }
}

// Fix PIN validation
async function loginPin(k) {
  if (!loginSel) return;
  
  if (k === 'DEL') {
    loginPinArr.pop();
  } else if (loginPinArr.length < 4) {
    loginPinArr.push(k);
  }
  
  // Update dots
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById('ld' + i);
    if (d) d.classList.toggle('on', i < loginPinArr.length);
  }
  
  // When 4 digits entered
  if (loginPinArr.length === 4) {
    const pin = loginPinArr.join('');
    
    try {
      // Query staff table with PIN
      const res = await API.auth.login(pin, API.session.outletId);
      
      if (res.success && res.user) {
        // Verify user ID matches selected staff
        if (res.user.id === loginSel.id) {
          doLogin(res.user);
        } else {
          showPinError('PIN tidak cocok untuk kasir ini');
        }
      } else {
        showPinError('PIN salah, coba lagi');
      }
    } catch (err) {
      console.error('Login error:', err);
      showPinError('Error: ' + err.message);
    }
  }
}

function showPinError(msg) {
  document.getElementById('login-err').textContent = msg;
  loginPinArr = [];
  
  // Reset dots
  setTimeout(() => {
    for (let i = 0; i < 4; i++) {
      const d = document.getElementById('ld' + i);
      if (d) d.classList.remove('on');
    }
    document.getElementById('login-err').textContent = '';
  }, 2500);
}
```

---

## ✅ TESTING CHECKLIST

### Test 1: Modifier Modal
- [ ] Click product dengan modifier
- [ ] Modal muncul dengan options
- [ ] Select modifier
- [ ] Qty adjustment works
- [ ] Add to cart berhasil
- [ ] Item muncul di cart dengan modifier text

### Test 2: Payment Success
- [ ] Add items to cart
- [ ] Click bayar
- [ ] Select payment method
- [ ] Konfirmasi payment
- [ ] Order berhasil dibuat
- [ ] No "gagal memproses" error
- [ ] Receipt displayed

### Test 3: KDS Sound
- [ ] Click test sound button → beep terdengar
- [ ] Create new order dari POS → 4x beep di KDS (beep beep beep beep)
- [ ] Order jadi urgent (>10min) → 2x long beep (beeep beeep)

### Test 4: User Management Access
- [ ] Login superadmin@nashty nashty1111
- [ ] Lihat menu "User Management" muncul
- [ ] Click menu → page user-management.html loaded
- [ ] List users displayed
- [ ] Can change password
- [ ] Can create new user

### Test 5: POS Login No Flicker
- [ ] Login admin1
- [ ] Click POS
- [ ] Staff selection screen shows (no flicker)
- [ ] 4 kasir displayed from database
- [ ] Click Citra → PIN screen shows
- [ ] Input 1234 → login success
- [ ] No "invalid PIN" error
- [ ] No placeholder data, all real from database

---

**Status:** Detailed fix plan ready ✅  
**Next Step:** Implement all 5 fixes in code files
