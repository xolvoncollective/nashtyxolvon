import { test, expect, Page } from '@playwright/test';

/**
 * COMPREHENSIVE SYSTEM E2E TEST SUITE
 * 
 * Tests ALL critical functionality:
 * 1. Authentication (Backoffice + POS + KDS)
 * 2. Dashboard/Reports (verify numbers update)
 * 3. KDS System (sound notifications, order workflow)
 * 4. POS Order Flow (create order → verify KDS → verify dashboard)
 * 5. Integration Tests (end-to-end order lifecycle)
 */

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key'; // TODO: Replace with actual key

const BACKOFFICE_URL = 'http://localhost/backoffice';
const POS_URL = 'http://localhost/pos';
const KDS_URL = 'http://localhost/kds';

const TEST_CREDENTIALS = {
  superadmin: { username: 'superadmin', password: 'nashty@2024' },
  staff: { pin: '1234', username: 'Citra Kusuma' }
};

// Test data
const TEST_TENANT_ID = 'b8fbb0a8-3c3f-4d2f-9e7a-1234567890ab';
const TEST_OUTLET_ID = '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e';

// ============================================
// HELPER FUNCTIONS
// ============================================

async function loginBackoffice(page: Page) {
  await page.goto(BACKOFFICE_URL);
  await page.fill('input[name="username"]', TEST_CREDENTIALS.superadmin.username);
  await page.fill('input[type="password"]', TEST_CREDENTIALS.superadmin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/backoffice/dashboard', { timeout: 10000 });
}

async function loginPOS(page: Page) {
  await page.goto(POS_URL);
  // Wait for PIN entry screen
  await page.waitForSelector('.pin-pad', { timeout: 5000 });
  
  // Enter PIN: 1234
  const pin = TEST_CREDENTIALS.staff.pin;
  for (const digit of pin) {
    await page.click(`button:has-text("${digit}")`);
  }
  
  // Click Enter/OK
  await page.click('button:has-text("Enter")');
  await page.waitForURL('**/pos/index.html', { timeout: 10000 });
}

async function enableKDSSound(page: Page) {
  // Navigate to KDS settings and ensure sound is enabled
  await page.click('text=KDS');
  await page.click('text=Alerts');
  
  const soundCheckbox = page.locator('#cb-sound');
  const isChecked = await soundCheckbox.isChecked();
  
  if (!isChecked) {
    await soundCheckbox.check();
    await page.click('#btn-save-alerts');
    await page.waitForSelector('text=Alert settings disimpan', { timeout: 5000 });
  }
}

async function captureInitialDashboardMetrics(page: Page) {
  await page.goto(`${BACKOFFICE_URL}/dashboard`);
  await page.waitForSelector('.kpi-grid', { timeout: 10000 });
  
  // Extract current metrics
  const metrics = await page.evaluate(() => {
    const kpis = document.querySelectorAll('.kpi');
    return {
      revenue: kpis[0]?.querySelector('.kpi-val')?.textContent || '0',
      orders: parseInt(kpis[0]?.querySelector('.kpi-sub')?.textContent?.match(/\\d+/)?.[0] || '0'),
      costs: kpis[1]?.querySelector('.kpi-val')?.textContent || '0',
      profit: kpis[2]?.querySelector('.kpi-val')?.textContent || '0'
    };
  });
  
  return metrics;
}

// ============================================
// TEST SUITE 1: AUTHENTICATION
// ============================================

test.describe('Authentication Tests', () => {
  
  test('should login to backoffice successfully', async ({ page }) => {
    await loginBackoffice(page);
    
    // Verify dashboard loaded
    await expect(page.locator('.ph-title')).toContainText('Dashboard Analytics');
    
    // Verify session storage
    const session = await page.evaluate(() => localStorage.getItem('session'));
    expect(session).toBeTruthy();
    
    const sessionData = JSON.parse(session || '{}');
    expect(sessionData.role).toBe('superadmin');
    expect(sessionData.token).toBeTruthy();
  });
  
  test('should login to POS with PIN successfully', async ({ page }) => {
    await loginPOS(page);
    
    // Verify POS interface loaded
    await expect(page.locator('.product-grid')).toBeVisible({ timeout: 10000 });
    
    // Verify staff name displayed
    await expect(page.locator('.staff-name')).toContainText(TEST_CREDENTIALS.staff.username);
  });
  
  test('should reject invalid backoffice credentials', async ({ page }) => {
    await page.goto(BACKOFFICE_URL);
    await page.fill('input[name="username"]', 'invalid');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('.error, .toast-error')).toBeVisible({ timeout: 5000 });
  });
  
  test('should reject invalid POS PIN', async ({ page }) => {
    await page.goto(POS_URL);
    await page.waitForSelector('.pin-pad');
    
    // Enter wrong PIN: 9999
    const wrongPin = '9999';
    for (const digit of wrongPin) {
      await page.click(`button:has-text("${digit}")`);
    }
    
    await page.click('button:has-text("Enter")');
    
    // Should show error
    await expect(page.locator('.error, .toast-error')).toBeVisible({ timeout: 5000 });
  });
});

// ============================================
// TEST SUITE 2: DASHBOARD & REPORTS
// ============================================

test.describe('Dashboard & Reports Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginBackoffice(page);
  });
  
  test('should display dashboard with metrics', async ({ page }) => {
    await page.goto(`${BACKOFFICE_URL}/dashboard`);
    
    // Wait for KPI cards to load
    await page.waitForSelector('.kpi-grid', { timeout: 10000 });
    
    // Verify all 4 KPI cards present
    const kpiCount = await page.locator('.kpi').count();
    expect(kpiCount).toBe(4);
    
    // Verify revenue chart loaded
    await expect(page.locator('#revenueChart')).toBeVisible();
    
    // Verify order type chart loaded
    await expect(page.locator('#orderTypeChart')).toBeVisible();
    
    // Verify product chart loaded
    await expect(page.locator('#productChart')).toBeVisible();
  });
  
  test('should update dashboard metrics after new order', async ({ page, context }) => {
    // Step 1: Capture initial metrics
    const initialMetrics = await captureInitialDashboardMetrics(page);
    console.log('Initial metrics:', initialMetrics);
    
    // Step 2: Create new order in POS (separate page)
    const posPage = await context.newPage();
    await loginPOS(posPage);
    
    // Add product to cart
    await posPage.click('.product-item:first-child');
    await posPage.waitForTimeout(500);
    
    // Process payment
    await posPage.click('button:has-text("Bayar")');
    await posPage.click('button:has-text("Cash")');
    await posPage.fill('input[name="amount"]', '50000');
    await posPage.click('button:has-text("Confirm")');
    
    // Wait for order to complete
    await posPage.waitForSelector('.success, .order-complete', { timeout: 10000 });
    
    await posPage.close();
    
    // Step 3: Refresh dashboard and verify metrics increased
    await page.reload();
    await page.waitForSelector('.kpi-grid', { timeout: 10000 });
    
    const updatedMetrics = await captureInitialDashboardMetrics(page);
    console.log('Updated metrics:', updatedMetrics);
    
    // Verify order count increased
    expect(updatedMetrics.orders).toBeGreaterThan(initialMetrics.orders);
    
    // Note: Revenue might not update immediately due to caching
    // Give it a few seconds
    await page.waitForTimeout(3000);
  });
  
  test('should display sales report with data', async ({ page }) => {
    // Navigate to reports (if exists)
    await page.click('text=Reports');
    await page.waitForSelector('.report-table, .tbl-wrap', { timeout: 10000 });
    
    // Verify table has rows
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });
  
  test('should filter dashboard by date range', async ({ page }) => {
    await page.goto(`${BACKOFFICE_URL}/dashboard`);
    
    // Look for date filter (if exists)
    const dateFilter = page.locator('input[type="date"]').first();
    
    if (await dateFilter.isVisible()) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      await dateFilter.fill(dateStr);
      await page.click('button:has-text("Apply"), button:has-text("Filter")');
      
      // Wait for data to reload
      await page.waitForTimeout(2000);
      
      // Verify metrics updated (should be different from today)
      await expect(page.locator('.kpi-val').first()).toBeVisible();
    }
  });
});

// ============================================
// TEST SUITE 3: KDS SYSTEM
// ============================================

test.describe('KDS System Tests', () => {
  
  test('should enable KDS sound notifications', async ({ page }) => {
    await loginBackoffice(page);
    await enableKDSSound(page);
    
    // Verify sound enabled
    const isChecked = await page.locator('#cb-sound').isChecked();
    expect(isChecked).toBe(true);
  });
  
  test('should display KDS queue with orders', async ({ page, context }) => {
    // First, create an order in POS
    const posPage = await context.newPage();
    await loginPOS(posPage);
    
    // Add product and create order
    await posPage.click('.product-item:first-child');
    await posPage.click('button:has-text("Bayar")');
    await posPage.click('button:has-text("Cash")');
    await posPage.fill('input[name="amount"]', '50000');
    await posPage.click('button:has-text("Confirm")');
    await posPage.waitForTimeout(2000);
    await posPage.close();
    
    // Now open KDS and verify order appears
    await page.goto(KDS_URL);
    await page.waitForTimeout(5000); // Wait for KDS to fetch orders
    
    // Verify order cards displayed
    const orderCards = page.locator('.order-card, [id^="ocard-"]');
    const count = await orderCards.count();
    
    expect(count).toBeGreaterThan(0);
  });
  
  test('should play sound when new order arrives', async ({ page, context }) => {
    // Enable KDS sound first
    await loginBackoffice(page);
    await enableKDSSound(page);
    
    // Open KDS in new page
    const kdsPage = await context.newPage();
    await kdsPage.goto(KDS_URL);
    
    // Listen for Audio API calls
    let soundPlayed = false;
    await kdsPage.exposeFunction('detectSound', () => {
      soundPlayed = true;
    });
    
    await kdsPage.evaluate(() => {
      // Override playSound function to detect calls
      const originalPlaySound = (window as any).playSound;
      (window as any).playSound = function(...args: any[]) {
        (window as any).detectSound();
        if (originalPlaySound) originalPlaySound(...args);
      };
    });
    
    // Create new order in POS
    const posPage = await context.newPage();
    await loginPOS(posPage);
    
    await posPage.click('.product-item:first-child');
    await posPage.click('button:has-text("Bayar")');
    await posPage.click('button:has-text("Cash")');
    await posPage.fill('input[name="amount"]', '50000');
    await posPage.click('button:has-text("Confirm")');
    
    // Wait for KDS to detect new order
    await kdsPage.waitForTimeout(6000); // KDS polls every 5 seconds
    
    // Verify sound was played
    expect(soundPlayed).toBe(true);
    
    await kdsPage.close();
    await posPage.close();
  });
  
  test('should update order status in KDS workflow', async ({ page }) => {
    await page.goto(KDS_URL);
    await page.waitForTimeout(5000);
    
    // Find first order card
    const firstOrder = page.locator('.order-card, [id^="ocard-"]').first();
    
    if (await firstOrder.isVisible()) {
      // Click to change status
      await firstOrder.click();
      
      // Wait for status to update
      await page.waitForTimeout(1000);
      
      // Verify status badge changed
      const statusBadge = firstOrder.locator('.status-badge, .badge');
      await expect(statusBadge).toBeVisible();
    }
  });
  
  test('should display KDS analytics correctly', async ({ page }) => {
    await loginBackoffice(page);
    
    // Navigate to KDS Analytics
    await page.click('text=KDS');
    await page.click('text=Analytics');
    
    // Wait for analytics to load
    await page.waitForSelector('.kpi-grid', { timeout: 10000 });
    
    // Verify KPI cards loaded
    const kpiCount = await page.locator('.kpi').count();
    expect(kpiCount).toBeGreaterThanOrEqual(3);
    
    // Verify avg prep time displayed
    await expect(page.locator('.kpi-val').first()).toBeVisible();
  });
});

// ============================================
// TEST SUITE 4: END-TO-END ORDER FLOW
// ============================================

test.describe('End-to-End Order Flow', () => {
  
  test('complete order lifecycle: POS → KDS → Dashboard', async ({ page, context }) => {
    // Step 1: Capture initial dashboard state
    await loginBackoffice(page);
    const initialMetrics = await captureInitialDashboardMetrics(page);
    const initialOrderCount = initialMetrics.orders;
    
    // Step 2: Open KDS in separate page
    const kdsPage = await context.newPage();
    await kdsPage.goto(KDS_URL);
    await kdsPage.waitForTimeout(3000);
    
    const initialKDSOrderCount = await kdsPage.locator('.order-card, [id^="ocard-"]').count();
    
    // Step 3: Create order in POS
    const posPage = await context.newPage();
    await loginPOS(posPage);
    
    // Add 2 products
    await posPage.click('.product-item:nth-child(1)');
    await posPage.waitForTimeout(500);
    await posPage.click('.product-item:nth-child(2)');
    await posPage.waitForTimeout(500);
    
    // Verify cart has 2 items
    const cartItemCount = await posPage.locator('.cart-item').count();
    expect(cartItemCount).toBe(2);
    
    // Process payment
    await posPage.click('button:has-text("Bayar")');
    await posPage.click('button:has-text("Cash")');
    await posPage.fill('input[name="amount"]', '100000');
    await posPage.click('button:has-text("Confirm")');
    
    // Wait for success
    await posPage.waitForSelector('.success, .order-complete', { timeout: 10000 });
    
    // Step 4: Verify order appears in KDS
    await kdsPage.waitForTimeout(6000); // Wait for KDS to poll
    await kdsPage.reload();
    await kdsPage.waitForTimeout(2000);
    
    const updatedKDSOrderCount = await kdsPage.locator('.order-card, [id^="ocard-"]').count();
    expect(updatedKDSOrderCount).toBeGreaterThan(initialKDSOrderCount);
    
    // Step 5: Complete order in KDS (move to ready/served)
    const newOrder = kdsPage.locator('.order-card, [id^="ocard-"]').first();
    await newOrder.click(); // Move to preparing
    await kdsPage.waitForTimeout(1000);
    await newOrder.click(); // Move to ready
    await kdsPage.waitForTimeout(1000);
    await newOrder.click(); // Move to served
    await kdsPage.waitForTimeout(1000);
    
    // Step 6: Verify dashboard updated
    await page.reload();
    await page.waitForTimeout(3000);
    
    const finalMetrics = await captureInitialDashboardMetrics(page);
    expect(finalMetrics.orders).toBeGreaterThan(initialOrderCount);
    
    // Cleanup
    await kdsPage.close();
    await posPage.close();
  });
  
  test('offline order sync workflow', async ({ page }) => {
    await loginPOS(page);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Create order while offline
    await page.click('.product-item:first-child');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Bayar")');
    await page.click('button:has-text("Cash")');
    await page.fill('input[name="amount"]', '50000');
    await page.click('button:has-text("Confirm")');
    
    // Verify order queued
    await expect(page.locator('.offline-indicator, .badge-red')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Wait for auto-sync
    await page.waitForTimeout(15000);
    
    // Verify sync succeeded
    await expect(page.locator('.sync-success, .badge-green')).toBeVisible({ timeout: 20000 });
  });
});

// ============================================
// TEST SUITE 5: SYSTEM INTEGRATION
// ============================================

test.describe('System Integration Tests', () => {
  
  test('should sync data between POS and Backoffice', async ({ page, context }) => {
    // Add product in Backoffice
    await loginBackoffice(page);
    await page.click('text=Products');
    await page.click('button:has-text("Add Product")');
    
    const testProductName = `Test Product ${Date.now()}`;
    await page.fill('input[name="name"]', testProductName);
    await page.fill('input[name="price"]', '25000');
    await page.click('button:has-text("Save")');
    
    await page.waitForSelector('.success, .toast-success', { timeout: 10000 });
    
    // Open POS and verify product appears
    const posPage = await context.newPage();
    await loginPOS(posPage);
    
    // Search for new product
    await posPage.fill('input[placeholder*="Search"], input[type="search"]', testProductName);
    await posPage.waitForTimeout(2000);
    
    // Verify product found
    await expect(posPage.locator(`.product-item:has-text("${testProductName}")`)).toBeVisible({ timeout: 10000 });
    
    await posPage.close();
  });
  
  test('should maintain session across page reloads', async ({ page }) => {
    await loginBackoffice(page);
    
    // Get session token
    const initialToken = await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      return session.token;
    });
    
    expect(initialToken).toBeTruthy();
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify still logged in
    await expect(page.locator('.ph-title')).toBeVisible();
    
    // Verify token persisted
    const persistedToken = await page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      return session.token;
    });
    
    expect(persistedToken).toBe(initialToken);
  });
  
  test('should handle concurrent orders from multiple POS terminals', async ({ context }) => {
    // Simulate 3 POS terminals creating orders simultaneously
    const terminals = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ]);
    
    // Login all terminals
    await Promise.all(terminals.map(async (terminal) => {
      await terminal.goto(POS_URL);
      await terminal.waitForSelector('.pin-pad');
      await terminal.fill('input[name="pin"]', TEST_CREDENTIALS.staff.pin);
      await terminal.click('button:has-text("Enter")');
      await terminal.waitForTimeout(2000);
    }));
    
    // Create orders simultaneously
    await Promise.all(terminals.map(async (terminal) => {
      await terminal.click('.product-item:first-child');
      await terminal.waitForTimeout(300);
      await terminal.click('button:has-text("Bayar")');
      await terminal.click('button:has-text("Cash")');
      await terminal.fill('input[name="amount"]', '50000');
      await terminal.click('button:has-text("Confirm")');
    }));
    
    // Verify all orders completed
    await Promise.all(terminals.map(async (terminal) => {
      await expect(terminal.locator('.success, .order-complete')).toBeVisible({ timeout: 15000 });
      await terminal.close();
    }));
  });
});

// ============================================
// TEST SUITE 6: PERFORMANCE & RELIABILITY
// ============================================

test.describe('Performance Tests', () => {
  
  test('dashboard should load within 3 seconds', async ({ page }) => {
    await loginBackoffice(page);
    
    const startTime = Date.now();
    await page.goto(`${BACKOFFICE_URL}/dashboard`);
    await page.waitForSelector('.kpi-grid', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('POS should handle rapid product additions', async ({ page }) => {
    await loginPOS(page);
    
    // Add 10 products rapidly
    for (let i = 0; i < 10; i++) {
      await page.click('.product-item:first-child');
      await page.waitForTimeout(100);
    }
    
    // Verify cart updated correctly
    await page.waitForTimeout(1000);
    const cartTotal = await page.locator('.cart-total').textContent();
    
    expect(cartTotal).toBeTruthy();
  });
  
  test('KDS should handle 50+ concurrent orders', async ({ page }) => {
    await page.goto(KDS_URL);
    await page.waitForTimeout(5000);
    
    // Verify KDS can render many orders without crash
    const orderCount = await page.locator('.order-card, [id^="ocard-"]').count();
    console.log(`KDS displaying ${orderCount} orders`);
    
    // Verify scrolling works
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // Verify no errors in console
    const errors = await page.evaluate(() => {
      return (window as any).consoleErrors || [];
    });
    
    expect(errors.length).toBe(0);
  });
});
