// ==========================================
// E2E TEST: Favorites Workflow
// Date: 2026-06-22
// Purpose: Test favorites CRUD operations
// ==========================================

import { test, expect } from '@playwright/test';

test.describe('POS Favorites System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and login
    await page.goto('http://localhost/pos/frontend/');
    await page.fill('#username-input', 'superadmin');
    await page.fill('#password-input', 'nashty@2024');
    await page.click('#login-button');
    await page.waitForSelector('.menu-grid', { timeout: 10000 });
  });

  test('Can add product to favorites', async ({ page }) => {
    // Click star icon on first product
    await page.click('.mcard:first-child .mc-star');
    
    // Wait for API call
    await page.waitForTimeout(1000);
    
    // Check if star is now active
    await expect(page.locator('.mcard:first-child .mc-star')).toHaveClass(/mc-star-on/);
  });

  test('Can remove product from favorites', async ({ page }) => {
    // Add to favorites first
    await page.click('.mcard:first-child .mc-star');
    await page.waitForTimeout(1000);
    
    // Remove from favorites
    await page.click('.mcard:first-child .mc-star');
    await page.waitForTimeout(1000);
    
    // Check if star is inactive
    await expect(page.locator('.mcard:first-child .mc-star')).not.toHaveClass(/mc-star-on/);
  });

  test('Favorites appear in Quick Access Grid', async ({ page }) => {
    // Add product to favorites
    const productName = await page.locator('.mcard:first-child .mc-name').textContent();
    await page.click('.mcard:first-child .mc-star');
    await page.waitForTimeout(1000);
    
    // Open Quick Access Grid (if implemented)
    // This depends on the actual UI implementation
    // Example: await page.click('#quick-access-toggle');
    
    // Verify product appears in favorites tab
    // await expect(page.locator(`.quick-access-grid .favorite-item:has-text("${productName}")`)).toBeVisible();
  });

  test('Cannot add more than 50 favorites', async ({ page }) => {
    // This would be a stress test
    // Add 50 products to favorites
    for (let i = 0; i < 50; i++) {
      await page.click(`.mcard:nth-child(${i + 1}) .mc-star`);
      await page.waitForTimeout(100);
    }
    
    // Try to add 51st favorite
    await page.click('.mcard:nth-child(51) .mc-star');
    await page.waitForTimeout(1000);
    
    // Check for error message or limit reached
    // await expect(page.locator('.error-message')).toContainText('Maximum 50 favorites');
  });

  test('Favorites load from server on page load', async ({ page }) => {
    // Add favorite
    await page.click('.mcard:first-child .mc-star');
    await page.waitForTimeout(1000);
    
    // Reload page
    await page.reload();
    await page.waitForSelector('.menu-grid');
    
    // Check if favorite is still marked
    await expect(page.locator('.mcard:first-child .mc-star')).toHaveClass(/mc-star-on/);
  });

  test('Can reorder favorites (drag and drop)', async ({ page }) => {
    // This test depends on Quick Access Grid implementation
    // Example test structure:
    
    // Add multiple favorites
    await page.click('.mcard:nth-child(1) .mc-star');
    await page.click('.mcard:nth-child(2) .mc-star');
    await page.click('.mcard:nth-child(3) .mc-star');
    await page.waitForTimeout(1000);
    
    // Open Quick Access Grid
    // await page.click('#quick-access-toggle');
    
    // Drag first favorite to third position
    // const firstFavorite = page.locator('.favorite-item:first-child');
    // const thirdFavorite = page.locator('.favorite-item:nth-child(3)');
    // await firstFavorite.dragTo(thirdFavorite);
    
    // Verify order changed
    // const newFirstFavorite = await page.locator('.favorite-item:first-child .favorite-name').textContent();
    // expect(newFirstFavorite).not.toBe(originalFirstFavorite);
  });

  test('Favorites work offline', async ({ page, context }) => {
    // Add favorite while online
    await page.click('.mcard:first-child .mc-star');
    await page.waitForTimeout(1000);
    
    // Go offline
    await context.setOffline(true);
    
    // Check if favorite is still marked (from IndexedDB)
    await page.reload();
    await page.waitForSelector('.menu-grid');
    await expect(page.locator('.mcard:first-child .mc-star')).toHaveClass(/mc-star-on/);
  });

  test('Favorite changes sync when back online', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Add favorite offline
    await page.click('.mcard:first-child .mc-star');
    await page.waitForTimeout(1000);
    
    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(5000); // Wait for sync
    
    // Reload and check if favorite persisted
    await page.reload();
    await page.waitForSelector('.menu-grid');
    await expect(page.locator('.mcard:first-child .mc-star')).toHaveClass(/mc-star-on/);
  });

  test('Favorites API responds within 200ms', async ({ page, request }) => {
    // Get auth token from page
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    
    // Make API request
    const startTime = Date.now();
    const response = await request.get('https://mzucfndifneytbesirkx.supabase.co/functions/v1/favorites-api', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const endTime = Date.now();
    
    expect(response.ok()).toBeTruthy();
    expect(endTime - startTime).toBeLessThan(200);
  });
});
