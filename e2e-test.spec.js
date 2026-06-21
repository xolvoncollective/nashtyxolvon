const { test, expect } = require('@playwright/test');

test.describe('End-to-End Deep Testing', () => {
  test.setTimeout(60000); // 60 seconds timeout

  test('Superadmin Login, Add Product, QRIS Checkout, and Print', async ({ page }) => {
    // 1. Open the Launcher / Gateway
    await page.goto('https://nashtyxolvon2.pages.dev/');

    // Check if we need to login
    const pinInput = page.locator('input[placeholder="PIN 6-digit"]');
    if (await pinInput.isVisible()) {
      await page.fill('input[type="email"]', 'superadmin@nashty');
      await page.fill('input[placeholder="PIN 6-digit"]', 'nashty1111');
      await page.click('button:has-text("Login to Launcher")');
    }

    // Wait for Launcher to load
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10000 });

    // 2. Click POS System
    await page.click('text=POS System');
    
    // Switch to POS iframe
    const posFrame = page.frameLocator('iframe');
    
    // Wait for POS to load (check for "Mulai Shift" or directly the product list)
    // If Shift modal is visible, click Mulai Shift
    const shiftBtn = posFrame.locator('button:has-text("Mulai Shift")');
    if (await shiftBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await shiftBtn.click();
    }

    // 3. Add first product to cart
    // Wait for product cards to load
    const firstProduct = posFrame.locator('.mc').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 15000 });
    await firstProduct.click();

    // 4. Click Checkout/Bayar
    const bayarBtn = posFrame.locator('#btn-pay');
    await bayarBtn.click();

    // 5. Select QRIS
    const qrisBtn = posFrame.locator('#pmb-qris');
    await qrisBtn.click();

    // The manual payment modal for QRIS should appear
    const suksesBtn = posFrame.locator('button:has-text("Sukses")');
    await suksesBtn.waitFor({ state: 'visible' });
    await suksesBtn.click(); // Confirm payment success

    // Wait for main success modal
    const successTitle = posFrame.locator('text=Pembayaran Berhasil!');
    await successTitle.waitFor({ state: 'visible', timeout: 5000 });

    // 6. Verify Print Button exists
    const printBtn = posFrame.locator('button:has-text("Cetak Struk")');
    await expect(printBtn).toBeVisible();

    console.log('✅ E2E Test Passed: Login -> POS -> Add to Cart -> QRIS Payment -> Print Modal shown');
  });
});
