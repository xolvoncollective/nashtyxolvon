import { test, expect, request } from '@playwright/test';

test.describe('POS to KDS End-to-End Flow', () => {
  test('should create an order in POS and verify it appears in KDS queue', async ({ page }) => {
    // 1. Navigate to POS
    await page.goto('/pos/');

    // Wait for POS to load
    await expect(page.locator('.logo-n')).toContainText('NASHTY OS');

    // 2.5 Select first non-favorite category to ensure products are visible
    const firstCategory = page.locator('.cbt:not([data-cat="fav"])').first();
    await firstCategory.waitFor();
    await firstCategory.click();

    // 3. Add an item to cart
    // We'll just click the first available product card
    const firstProduct = page.locator('.mcard:not(.sold)').first();
    await firstProduct.waitFor();
    await firstProduct.click();

    // If there are modifiers, a modal might pop up. If it does, we click "Tambah ke Pesanan"
    const saveModifierBtn = page.getByRole('button', { name: /Tambah ke Pesanan/i });
    if (await saveModifierBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveModifierBtn.click();
    }

    // 4. Proceed to Checkout
    const bayarBtn = page.locator('#btn-pay');
    await expect(bayarBtn).toBeVisible();
    await bayarBtn.click();

    // 5. Select Payment Method (Uang Pas)
    const uangPasBtn = page.locator('.nk.sp', { hasText: 'UANG PAS' });
    await expect(uangPasBtn).toBeVisible();
    await uangPasBtn.click();

    // Capture the order creation request and response
    const [response] = await Promise.all([
      page.waitForResponse(async r => {
        if (r.url().includes('/api/orders') && r.request().method() === 'POST') {
          console.log('Request Payload:', r.request().postData());
          return true;
        }
        return false;
      }),
      page.locator('#btn-cfm').click()
    ]);
    const responseData = await response.json();
    console.log('Order API Response:', responseData);
    expect(responseData.success).toBeTruthy();
    const orderNumber = responseData.order?.order_number;
    expect(orderNumber).toBeDefined();

    // Wait for Payment Success Screen
    await expect(page.locator('.stitl')).toHaveText('Pembayaran Berhasil!', { timeout: 10000 });
    
    // Close success modal
    await page.getByRole('button', { name: '+ Order Baru' }).click();

    // 6. Verify in KDS API
    const apiContext = await request.newContext();
    const kdsResponse = await apiContext.get('/api/orders/kitchen/queue?tenantId=demo-tenant&outletId=demo-outlet');
    expect(kdsResponse.ok()).toBeTruthy();
    
    const kdsData = await kdsResponse.json();
    expect(kdsData.success).toBeTruthy();

    // Find our order in the KDS queue
    const orderInKitchen = kdsData.orders.find((o: any) => o.order_number === orderNumber);
    expect(orderInKitchen).toBeDefined();
    expect(orderInKitchen.kitchen_status).toBe('pending');
  });
});
