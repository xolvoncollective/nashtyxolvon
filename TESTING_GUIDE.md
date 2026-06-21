# POS Enhancement - Testing Guide

## Performance Testing (Task 32)

### Automated Performance Tests

Run these tests to validate all performance benchmarks:

```javascript
// pos/frontend/test/performance-tests.js

class PerformanceTests {
  constructor() {
    this.results = [];
  }

  async runAll() {
    console.log('🧪 Starting Performance Tests...\n');
    
    await this.testOfflineCartOperations();
    await this.testOfflineProductSearch();
    await this.testOfflineOrderSave();
    await this.testFavoritesLoad();
    await this.testFavoritesRender();
    await this.testReceiptGeneration();
    await this.testCustomerDisplayUpdate();
    await this.testBulkOrderSync();
    await this.testFavoritesScroll();
    
    this.printResults();
  }

  async testOfflineCartOperations() {
    console.log('Testing: Cart Operations (Offline)');
    const times = [];
    
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      // Simulate cart operation
      window.cart.addItem({
        id: `test-${i}`,
        name: 'Test Product',
        price: 25000,
        quantity: 1
      });
      const end = performance.now();
      times.push(end - start);
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    this.results.push({
      name: 'Cart Operations (Offline)',
      target: '< 50ms',
      actual: `${avg.toFixed(2)}ms`,
      pass: avg < 50
    });
  }

  async testOfflineProductSearch() {
    console.log('Testing: Product Search (Offline)');
    
    const start = performance.now();
    await window.cacheManager.searchProducts('nasi');
    const end = performance.now();
    
    const time = end - start;
    this.results.push({
      name: 'Product Search (Offline)',
      target: '< 100ms',
      actual: `${time.toFixed(2)}ms`,
      pass: time < 100
    });
  }

  async testOfflineOrderSave() {
    console.log('Testing: Order Save (Offline)');
    
    const order = {
      items: [
        { id: '1', name: 'Test', price: 25000, quantity: 2 }
      ],
      total: 50000
    };
    
    const start = performance.now();
    await window.offlineQueue.enqueue('create_order', order);
    const end = performance.now();
    
    const time = end - start;
    this.results.push({
      name: 'Order Save (Offline)',
      target: '< 200ms',
      actual: `${time.toFixed(2)}ms`,
      pass: time < 200
    });
  }

  async testFavoritesLoad() {
    console.log('Testing: Favorites Load (Server)');
    
    const start = performance.now();
    await window.favoritesManager.loadFromServer();
    const end = performance.now();
    
    const time = end - start;
    this.results.push({
      name: 'Favorites Load (Server)',
      target: '< 500ms',
      actual: `${time.toFixed(2)}ms`,
      pass: time < 500
    });
  }

  async testFavoritesRender() {
    console.log('Testing: Favorites Render');
    
    const start = performance.now();
    await window.quickAccessGrid.renderFavorites();
    const end = performance.now();
    
    const time = end - start;
    this.results.push({
      name: 'Favorites Render',
      target: '< 100ms',
      actual: `${time.toFixed(2)}ms`,
      pass: time < 100
    });
  }

  async testReceiptGeneration() {
    console.log('Testing: Receipt Generation');
    
    const order = {
      id: 'test-001',
      items: [
        { name: 'Nasi Goreng', quantity: 2, price: 25000 },
        { name: 'Es Teh', quantity: 3, price: 5000 }
      ],
      subtotal: 65000,
      tax: 6500,
      total: 71500,
      outlet_id: 'outlet-001'
    };
    
    const start = performance.now();
    await window.receiptGenerator.generate(order);
    const end = performance.now();
    
    const time = end - start;
    this.results.push({
      name: 'Receipt Generation',
      target: '< 300ms',
      actual: `${time.toFixed(2)}ms`,
      pass: time < 300
    });
  }

  async testCustomerDisplayUpdate() {
    console.log('Testing: Customer Display Update');
    
    const cart = {
      items: [
        { name: 'Test Product', quantity: 1, price: 25000 }
      ],
      subtotal: 25000,
      tax: 2500,
      total: 27500
    };
    
    const start = performance.now();
    window.customerDisplay.syncCart(cart);
    const end = performance.now();
    
    const time = end - start;
    this.results.push({
      name: 'Customer Display Update',
      target: '< 200ms',
      actual: `${time.toFixed(2)}ms`,
      pass: time < 200
    });
  }

  async testBulkOrderSync() {
    console.log('Testing: 100 Orders Sync');
    
    // Create 100 pending orders
    for (let i = 0; i < 100; i++) {
      await window.offlineQueue.enqueue('create_order', {
        id: `bulk-${i}`,
        items: [{ name: 'Test', price: 10000, quantity: 1 }],
        total: 10000
      });
    }
    
    const start = performance.now();
    await window.syncManager.syncAll();
    const end = performance.now();
    
    const time = end - start;
    this.results.push({
      name: '100 Orders Sync',
      target: '< 30s',
      actual: `${(time / 1000).toFixed(2)}s`,
      pass: time < 30000
    });
  }

  async testFavoritesScroll() {
    console.log('Testing: Favorites Scroll (60fps)');
    
    let frameCount = 0;
    let totalTime = 0;
    
    const measureFrame = () => {
      frameCount++;
      const start = performance.now();
      // Simulate scroll rendering
      window.quickAccessGrid.renderFavorites();
      const end = performance.now();
      totalTime += (end - start);
      
      if (frameCount < 60) {
        requestAnimationFrame(measureFrame);
      } else {
        const avgFrameTime = totalTime / frameCount;
        const fps = 1000 / avgFrameTime;
        this.results.push({
          name: 'Favorites Scroll',
          target: '60 fps',
          actual: `${fps.toFixed(1)} fps`,
          pass: fps >= 60
        });
      }
    };
    
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        measureFrame();
        setTimeout(resolve, 1100); // Wait for 60 frames
      });
    });
  }

  printResults() {
    console.log('\n📊 Performance Test Results:\n');
    console.table(this.results);
    
    const passed = this.results.filter(r => r.pass).length;
    const total = this.results.length;
    
    console.log(`\n✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('\n🎉 All performance tests passed!');
    } else {
      console.log('\n⚠️ Some tests failed. Review results above.');
    }
  }
}

// Run tests
const tests = new PerformanceTests();
tests.runAll();
```

### Manual Performance Testing

#### 1. Offline Cart Operations
1. Disconnect network
2. Add 10 items to cart rapidly
3. Each operation should feel instant (<50ms)

#### 2. Product Search
1. Go offline
2. Search for "nasi" in product search
3. Results should appear within 100ms

#### 3. Order Save
1. Create order with 5 items while offline
2. Order should save to queue within 200ms
3. Check offline queue indicator

#### 4. Receipt Generation
1. Complete an order
2. Generate receipt with all customizations
3. Should generate within 300ms

#### 5. Customer Display
1. Open customer display on second screen
2. Add items to cart
3. Display should update within 200ms

#### 6. Bulk Sync
1. Create 100 offline orders (use script above)
2. Go online
3. Sync should complete within 30 seconds

---

## End-to-End Testing (Task 33)

### Test Scenarios

#### Scenario 1: Complete Offline Workflow
**Steps**:
1. Start online, sync data
2. Go offline
3. Create 5 orders with various items
4. Check offline queue shows 5 pending
5. Go online
6. Verify all orders synced successfully
7. Check order history shows all 5 orders

**Expected**: All orders synced, no data loss

---

#### Scenario 2: Favorites Management
**Steps**:
1. Add 10 products to favorites
2. Drag-drop to reorder
3. Go offline
4. Add 5 more favorites
5. Remove 3 favorites
6. Go online
7. Verify sync completes
8. Refresh page, verify favorites persisted

**Expected**: All changes synced, correct order maintained

---

#### Scenario 3: Keyboard Shortcuts
**Steps**:
1. Test all navigation shortcuts (Ctrl+P/S/N/D/H, Alt+F, Esc)
2. Test cart shortcuts (arrows, delete, +/-, Enter, Ctrl+A)
3. Test quantity entry (type numbers, add product)
4. Assign products to F1-F12
5. Test F1-F12 quick add
6. Customize shortcuts in settings
7. Test new shortcuts work

**Expected**: All shortcuts work as expected

---

#### Scenario 4: Receipt Customization
**Steps**:
1. Upload logo in backoffice settings
2. Set header and footer text
3. Set font size to Large
4. Enable QR code with URL
5. Add social media links
6. Add 3 promotional messages
7. Save settings
8. Create test order
9. Generate receipt
10. Verify all customizations appear

**Expected**: Receipt contains all customizations

---

#### Scenario 5: Customer Display
**Steps**:
1. Connect second screen
2. Enable customer display
3. Add items to cart → display updates
4. Remove items → display updates
5. Clear cart → display shows "waiting"
6. Wait 30 seconds → enters idle mode
7. Add item → exits idle mode
8. Disconnect screen → display closes gracefully

**Expected**: Real-time sync, smooth transitions

---

### Browser Compatibility Testing

Test on:
- ✅ Chrome 100+ (all features)
- ✅ Edge 100+ (all features)
- ⚠️ Firefox 90+ (no Window Management API)
- ⚠️ Safari 15+ (no Window Management API)

For Firefox/Safari:
- Manual customer display trigger should appear
- All other features should work

---

### Load Testing

#### High Volume Test
1. Add 1000 products to catalog
2. Cache all products
3. Search for products
4. Add 50 items to cart
5. Verify performance remains acceptable

#### Concurrent Users
1. Open 5 POS tabs simultaneously
2. Each creates orders
3. Verify no conflicts
4. Check data consistency

#### Network Throttling
1. Set network to "Slow 3G"
2. Test product search
3. Test order creation
4. Test sync operations
5. Verify graceful degradation

---

### Error Handling Testing

#### Network Errors
1. Disconnect during order creation → should queue
2. Disconnect during sync → should retry
3. Reconnect → should auto-sync

#### Invalid Data
1. Try to add 1000 quantity → should cap at 999
2. Try to add 51st favorite → should show error
3. Upload 10MB logo → should reject

#### Edge Cases
1. Empty cart payment → should disable Ctrl+P
2. Offline favorites sync conflict → last-write-wins
3. Screen disconnect during customer display → should close gracefully

---

## Test Results Template

```markdown
## Test Run: [Date]

### Performance Tests
- [ ] Cart operations < 50ms
- [ ] Product search < 100ms
- [ ] Order save < 200ms
- [ ] Favorites load < 500ms
- [ ] Favorites render < 100ms
- [ ] Receipt generation < 300ms
- [ ] Customer display < 200ms
- [ ] 100 orders sync < 30s
- [ ] 60fps favorites scroll

### E2E Scenarios
- [ ] Complete offline workflow
- [ ] Favorites management
- [ ] All keyboard shortcuts
- [ ] Receipt customization
- [ ] Customer display

### Browser Compatibility
- [ ] Chrome 100+
- [ ] Edge 100+
- [ ] Firefox 90+
- [ ] Safari 15+

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual

### Summary
- Tests Passed: X/Y
- Tests Failed: X/Y
- Critical Issues: X
- Performance: Pass/Fail
```

---

## Automated Test Runner

Save this as `run-tests.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>POS Enhancement Test Runner</title>
  <script src="../pos/frontend/js/app.js" type="module"></script>
  <style>
    body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
    .pass { color: #10b981; }
    .fail { color: #ef4444; }
    button { padding: 10px 20px; margin: 10px; background: #f59e0b; border: none; color: #000; cursor: pointer; }
  </style>
</head>
<body>
  <h1>POS Enhancement Test Runner</h1>
  <button onclick="runPerformanceTests()">Run Performance Tests</button>
  <button onclick="runE2ETests()">Run E2E Tests</button>
  <div id="results"></div>
  <script src="performance-tests.js"></script>
</body>
</html>
```
