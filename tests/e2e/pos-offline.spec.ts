// ==========================================
// E2E TEST: POS Offline Scenarios
// Date: 2026-06-22
// Purpose: Test offline mode functionality
// ==========================================

import { test, expect } from '@playwright/test';

test.describe('POS Offline Mode', () => {
  test.beforeEach(async ({ page, context }) => {
    // Navigate to POS
    await page.goto('http://localhost/pos/frontend/');
    
    // Wait for Service Worker registration
    await page.waitForTimeout(2000);
  });

  test('Service Worker registers successfully', async ({ page }) => {
    // Check Service Worker registration
    const swRegistered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration !== undefined;
    });
    
    expect(swRegistered).toBeTruthy();
  });

  test('IndexedDB initializes with 9 stores', async ({ page }) => {
    // Check IndexedDB
    const dbStores = await page.evaluate(async () => {
      const { openDB } = await import('https://cdn.jsdelivr.net/npm/idb@8/+esm');
      const db = await openDB('NashtyPOS', 1);
      const stores = Array.from(db.objectStoreNames);
      db.close();
      return stores;
    });
    
    expect(dbStores).toHaveLength(9);
    expect(dbStores).toContain('products');
    expect(dbStores).toContain('categories');
    expect(dbStores).toContain('offline_queue');
    expect(dbStores).toContain('favorites');
    expect(dbStores).toContain('recent_items');
    expect(dbStores).toContain('keyboard_shortcuts');
    expect(dbStores).toContain('settings');
    expect(dbStores).toContain('encryption_keys');
    expect(dbStores).toContain('sync_metadata');
  });

  test('Can login and load products offline', async ({ page, context }) => {
    // Login first
    await page.fill('#username-input', 'superadmin');
    await page.fill('#password-input', 'nashty@2024');
    await page.click('#login-button');
    
    // Wait for POS to load
    await page.waitForSelector('.menu-grid', { timeout: 10000 });
    
    // Go offline
    await context.setOffline(true);
    
    // Reload page
    await page.reload();
    
    // Check if products still visible (from cache/IndexedDB)
    await page.waitForSelector('.mcard', { timeout: 5000 });
    const productCount = await page.locator('.mcard').count();
    
    expect(productCount).toBeGreaterThan(0);
  });

  test('Can add product to cart offline', async ({ page, context }) => {
    // Login
    await page.fill('#username-input', 'superadmin');
    await page.fill('#password-input', 'nashty@2024');
    await page.click('#login-button');
    await page.waitForSelector('.menu-grid');
    
    // Go offline
    await context.setOffline(true);
    
    // Click first product
    await page.click('.mcard:first-child');
    
    // Wait for cart to update
    await page.waitForTimeout(500);
    
    // Check cart has items
    const cartItemCount = await page.locator('.ci').count();
    expect(cartItemCount).toBeGreaterThan(0);
  });

  test('Order queued when offline', async ({ page, context }) => {
    // Login
    await page.fill('#username-input', 'superadmin');
    await page.fill('#password-input', 'nashty@2024');
    await page.click('#login-button');
    await page.waitForSelector('.menu-grid');
    
    // Add product to cart
    await page.click('.mcard:first-child');
    await page.waitForTimeout(500);
    
    // Go offline
    await context.setOffline(true);
    
    // Try to complete order
    await page.click('.btn-pay');
    await page.waitForSelector('.pay-modal', { timeout: 5000 });
    
    // Select payment method
    await page.click('.pmb:first-child');
    
    // Confirm payment
    await page.click('.btn-cfm');
    
    // Check if order is queued
    const queuedOrders = await page.evaluate(async () => {
      const { openDB } = await import('https://cdn.jsdelivr.net/npm/idb@8/+esm');
      const db = await openDB('NashtyPOS', 1);
      const tx = db.transaction('offline_queue', 'readonly');
      const count = await tx.objectStore('offline_queue').count();
      db.close();
      return count;
    });
    
    expect(queuedOrders).toBeGreaterThan(0);
  });

  test('Offline indicator shows when offline', async ({ page, context }) => {
    // Login
    await page.fill('#username-input', 'superadmin');
    await page.fill('#password-input', 'nashty@2024');
    await page.click('#login-button');
    await page.waitForSelector('.menu-grid');
    
    // Check online indicator initially
    await expect(page.locator('.online-chip')).toHaveClass(/^(?!.*offline)/);
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    // Check offline indicator
    await expect(page.locator('.online-chip')).toHaveClass(/offline/);
  });

  test('Products search works offline', async ({ page, context }) => {
    // Login
    await page.fill('#username-input', 'superadmin');
    await page.fill('#password-input', 'nashty@2024');
    await page.click('#login-button');
    await page.waitForSelector('.menu-grid');
    
    // Cache products first
    await page.waitForTimeout(3000);
    
    // Go offline
    await context.setOffline(true);
    
    // Search for product
    await page.fill('.srch-box input', 'Espresso');
    await page.waitForTimeout(500);
    
    // Check filtered results
    const visibleProducts = await page.locator('.mcard:visible').count();
    expect(visibleProducts).toBeGreaterThan(0);
  });

  test('Cart operations respond within 50ms offline', async ({ page, context }) => {
    // Login
    await page.fill('#username-input', 'superadmin');
    await page.fill('#password-input', 'nashty@2024');
    await page.click('#login-button');
    await page.waitForSelector('.menu-grid');
    
    // Go offline
    await context.setOffline(true);
    
    // Measure cart operation time
    const startTime = Date.now();
    await page.click('.mcard:first-child');
    await page.waitForSelector('.ci');
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(50);
  });
});
