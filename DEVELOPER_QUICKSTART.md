# 🚀 NASHTY POS - Quick Start Guide untuk Developer

## Setup & Testing Offline Mode

### 1. Install Dependencies (Jika Belum)
```bash
# Workbox sudah di-load via CDN di sw.js
# idb library sudah included
# Tidak perlu npm install
```

### 2. Test Service Worker
1. Buka Chrome DevTools
2. Go to **Application** tab
3. **Service Workers** section
4. Verify `sw.js` registered dan status **activated**
5. Click "Update" untuk force update

### 3. Test IndexedDB
1. Chrome DevTools > **Application** > **IndexedDB**
2. Verify database `nashty-pos` exists
3. Check stores:
   - ✓ products
   - ✓ categories
   - ✓ offline_queue
   - ✓ favorites
   - ✓ recent_items
   - ✓ keyboard_shortcuts
   - ✓ settings
   - ✓ encryption_keys

### 4. Test Offline Order Flow
```javascript
// Di browser console setelah login:

// 1. Cek koneksi
console.log('Online:', navigator.onLine);

// 2. Buat pesanan (offline)
window.queueOfflineOrder({
  items: [{ productId: 'xxx', qty: 2, price: 50000 }],
  total: 100000,
  orderType: 'dine',
  tableNumber: 'T01'
});

// 3. Cek queue
window.getPendingOrdersCount();

// 4. Manual sync (saat online)
window.manualSync();
```

### 5. Test Encryption
```javascript
// Di console:
const userId = 'test-user-id';
const sessionToken = 'test-session-token';

// Derive key
await window.EncryptionService.deriveKey(userId, sessionToken);

// Test encrypt/decrypt
const encrypted = await window.EncryptionService.encrypt(userId, 'sensitive data');
console.log('Encrypted:', encrypted);

const decrypted = await window.EncryptionService.decrypt(userId, encrypted);
console.log('Decrypted:', decrypted); // Should be 'sensitive data'
```

---

## Testing Keyboard Shortcuts

### Navigation Shortcuts
```
Ctrl+P    → Open payment (requires items in cart)
Ctrl+S    → Save cart as draft
Ctrl+N    → Clear cart, new order
Ctrl+D    → Show saved drafts
Ctrl+H    → Show order history
Alt+F     → Focus product search
Escape    → Close current dialog
```

### Cart Shortcuts
```
↑ ↓       → Select cart items
Delete    → Remove selected item
+ -       → Increment/decrement quantity
Enter     → Open modifiers for selected item
Ctrl+A    → Select all items
```

### Quantity Entry
```
Type numbers: 5 → shows "Qty: 5" indicator
Then click product → adds 5 of that product
Timeout: 5 seconds (auto-clear)
Escape: Clear quantity buffer
Max: 999
```

### Function Keys
```
F1-F12          → Add assigned product
Shift+F1-F12    → Assign product to key
```

**Test**:
```javascript
// Assign product to F1
// (Shift+F1 will open assignment dialog in UI)

// Programmatically:
const db = await window.dbPromise;
const tx = db.transaction('keyboard_shortcuts', 'readwrite');
await tx.objectStore('keyboard_shortcuts').put({
  userId: 'current-user-id',
  keyCombo: 'F1',
  action: 'addProduct',
  productId: 'product-uuid-here',
  isCustom: false
});
await tx.done;

// Now pressing F1 will add that product
```

---

## Testing Favorites System

### Add Favorite (Manual Test)
1. Right-click produk di menu
2. Click "Add to Favorites"
3. Verify di IndexedDB > favorites store
4. Max 50 enforcement (try adding 51st)

### Programmatic Test
```javascript
// Add favorite
await window.FavoritesManager.addFavorite('product-uuid');

// Get favorites
const favs = await window.FavoritesManager.getFavorites();
console.log('Favorites:', favs);

// Remove favorite
await window.FavoritesManager.removeFavorite('product-uuid');

// Reorder
await window.FavoritesManager.reorderFavorites([
  { productId: 'uuid1', position: 0 },
  { productId: 'uuid2', position: 1 }
]);
```

### Test Offline Sync
```javascript
// 1. Go offline
// 2. Add/remove favorites
// 3. Check offline_queue store
const db = await window.dbPromise;
const tx = db.transaction('offline_queue', 'readonly');
const queue = await tx.objectStore('offline_queue').getAll();
console.log('Queued operations:', queue);

// 4. Go online
// 5. Verify auto-sync
```

---

## Testing Connection Monitor

### UI Elements
1. **Indicator di top bar**:
   - Online: Green dot + "Online"
   - Offline: Red dot + "Offline" + pending count badge

2. **Sync Status Modal**:
   - Click indicator → open modal
   - Shows connection status
   - Lists pending orders
   - Lists failed orders
   - Retry button (if failed orders exist)

### Programmatic Test
```javascript
// Check connection monitor
console.log('Connection Monitor:', window.connectionMonitor);

// Get status
const isOnline = window.connectionMonitor.isOnline;
console.log('Online:', isOnline);

// Get pending count
const count = await window.connectionMonitor.getPendingCount();
console.log('Pending orders:', count);

// Show modal
window.connectionMonitor.showSyncModal();
```

### Simulate Offline/Online
```javascript
// Dispatch events manually
window.dispatchEvent(new Event('offline'));
// Check UI updates

window.dispatchEvent(new Event('online'));
// Check UI updates + auto-sync
```

---

## Performance Testing

### Offline Operations Speed
```javascript
// Test cart operations
console.time('addToCart');
window.addProductToCart('product-uuid', 1);
console.timeEnd('addToCart'); // Should be <50ms

// Test product search
console.time('searchProducts');
const results = await window.CacheManager.searchCachedProducts('nasi');
console.timeEnd('searchProducts'); // Should be <100ms

// Test order save
console.time('saveOrder');
await window.queueOfflineOrder({ /* order data */ });
console.timeEnd('saveOrder'); // Should be <200ms
```

### Encryption Performance
```javascript
const testData = 'A'.repeat(10000); // 10KB data

console.time('encrypt');
const encrypted = await window.EncryptionService.encrypt('user-id', testData);
console.timeEnd('encrypt'); // Should be <10ms

console.time('decrypt');
const decrypted = await window.EncryptionService.decrypt('user-id', encrypted);
console.timeEnd('decrypt'); // Should be <10ms
```

### Sync Performance (100 Orders)
```javascript
// Queue 100 orders
for (let i = 0; i < 100; i++) {
  await window.queueOfflineOrder({
    id: `order-${i}`,
    items: [{ productId: 'xxx', qty: 1, price: 10000 }],
    total: 10000
  });
}

// Measure sync time
console.time('sync100orders');
await window.manualSync();
console.timeEnd('sync100orders'); // Should be <30 seconds
```

---

## Debugging Tips

### Check Service Worker Status
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW State:', reg?.active?.state);
  console.log('Waiting:', reg?.waiting);
  console.log('Installing:', reg?.installing);
});
```

### Check Cache Contents
```javascript
caches.keys().then(names => {
  console.log('Cache names:', names);
  
  caches.open('static-assets-v1').then(cache => {
    cache.keys().then(keys => {
      console.log('Cached files:', keys.map(r => r.url));
    });
  });
});
```

### Check IndexedDB Data
```javascript
const db = await window.dbPromise;

// List all products
const tx = db.transaction('products', 'readonly');
const products = await tx.objectStore('products').getAll();
console.log('Cached products:', products.length);

// List pending orders
const txQueue = db.transaction('offline_queue', 'readonly');
const pending = await txQueue.objectStore('offline_queue')
  .index('status').getAll('pending');
console.log('Pending orders:', pending);
```

### Check Encryption Keys
```javascript
const db = await window.dbPromise;
const tx = db.transaction('encryption_keys', 'readonly');
const keys = await tx.objectStore('encryption_keys').getAll();
console.log('Stored keys:', keys);
// Note: Keys are CryptoKey objects, non-extractable
```

### Monitor Network Requests
```javascript
// Log all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch:', args[0]);
  return originalFetch.apply(this, args);
};
```

---

## Common Issues & Solutions

### Issue: Service Worker tidak register
**Solution**:
1. Check console untuk errors
2. Verify HTTPS (localhost OK)
3. Check `sw.js` accessible
4. Clear site data dan reload

### Issue: IndexedDB error
**Solution**:
1. Check browser storage limits
2. Clear IndexedDB: DevTools > Application > Clear storage
3. Reload page

### Issue: Encryption failed
**Solution**:
1. Verify user logged in
2. Check encryption keys derived
3. Verify session token valid
4. Check console errors

### Issue: Offline queue tidak sync
**Solution**:
1. Verify online (check `navigator.onLine`)
2. Check pending orders: `window.getPendingOrdersCount()`
3. Trigger manual sync: `window.manualSync()`
4. Check console untuk errors

### Issue: Keyboard shortcuts tidak work
**Solution**:
1. Check initialization: `console.log(window.keyboardHandler)`
2. Verify not focused on input
3. Check console untuk key capture
4. Test with simple shortcut: `Alt+F`

---

## Browser DevTools Shortcuts

### Chrome DevTools
```
Ctrl+Shift+I    → Open DevTools
Ctrl+Shift+J    → Open Console
Ctrl+Shift+C    → Inspect element
F12             → Toggle DevTools
```

### Useful Tabs
- **Console**: Logs, errors, testing
- **Application**: SW, IndexedDB, Cache, Storage
- **Network**: API calls, offline simulation
- **Performance**: Performance profiling
- **Security**: HTTPS, certificates

---

## Testing Checklist ✓

### Basic Flow
- [ ] POS loads successfully
- [ ] Service Worker registers
- [ ] IndexedDB creates all stores
- [ ] User can login
- [ ] Products load from API
- [ ] Products cached to IndexedDB
- [ ] Can add products to cart
- [ ] Can create order online
- [ ] Connection indicator shows "Online"

### Offline Flow
- [ ] Disconnect internet (airplane mode)
- [ ] Connection indicator shows "Offline"
- [ ] Can still search products (cached)
- [ ] Can add products to cart
- [ ] Can create order (goes to queue)
- [ ] Pending badge shows count
- [ ] Reconnect internet
- [ ] Auto-sync triggers
- [ ] Orders sync to server
- [ ] Badge clears
- [ ] Success notification shows

### Keyboard Shortcuts
- [ ] Ctrl+P opens payment (with items)
- [ ] Alt+F focuses search
- [ ] Numbers show quantity indicator
- [ ] F1-F12 work (if assigned)
- [ ] Arrow keys select cart items
- [ ] Delete removes selected item

### Favorites
- [ ] Can add favorite
- [ ] Max 50 enforced
- [ ] Can remove favorite
- [ ] Recent items track
- [ ] Works offline

---

## Contact & Support

**Issues**: Check console first, then report dengan:
1. Browser version
2. Console errors
3. Steps to reproduce
4. Screenshots

**Documentation**: 
- `POS_ENHANCEMENT_STATUS.md` - Overall status
- `IMPLEMENTATION_PROGRESS.md` - Detailed progress
- `IMPLEMENTATION_CHECKLIST.md` - Actionable checklist

**Code**:
- Services: `pos/frontend/js/services/`
- Styles: `pos/frontend/css/`
- Main: `pos/frontend/index.html`

---

_Happy Testing! 🚀_
_Last Updated: ${new Date().toISOString()}_
