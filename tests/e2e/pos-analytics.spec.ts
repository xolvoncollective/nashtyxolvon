// ==========================================
// E2E TEST: Analytics API
// Date: 2026-06-22
// Purpose: Test analytics endpoint
// ==========================================

import { test, expect } from '@playwright/test';

test.describe('Analytics API', () => {
  let authToken: string;

  test.beforeAll(async ({ browser }) => {
    // Get auth token
    const page = await browser.newPage();
    await page.goto('http://localhost/pos/frontend/');
    await page.fill('#username-input', 'superadmin');
    await page.fill('#password-input', 'nashty@2024');
    await page.click('#login-button');
    await page.waitForSelector('.menu-grid', { timeout: 10000 });
    
    authToken = await page.evaluate(() => localStorage.getItem('auth_token') || '');
    await page.close();
  });

  test('Analytics API returns top products', async ({ request }) => {
    const response = await request.get(
      'https://mzucfndifneytbesirkx.supabase.co/functions/v1/analytics-api/top-products',
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('products');
    expect(data).toHaveProperty('metadata');
    expect(Array.isArray(data.products)).toBeTruthy();
  });

  test('Analytics returns max 20 products', async ({ request }) => {
    const response = await request.get(
      'https://mzucfndifneytbesirkx.supabase.co/functions/v1/analytics-api/top-products',
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const data = await response.json();
    expect(data.products.length).toBeLessThanOrEqual(20);
  });

  test('Analytics includes trending indicators', async ({ request }) => {
    const response = await request.get(
      'https://mzucfndifneytbesirkx.supabase.co/functions/v1/analytics-api/top-products',
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const data = await response.json();
    
    if (data.products.length > 0) {
      const product = data.products[0];
      expect(product).toHaveProperty('trend');
      expect(['up', 'stable', 'down']).toContain(product.trend);
      expect(product).toHaveProperty('rank');
      expect(product).toHaveProperty('total_sold');
    }
  });

  test('Analytics has 6-hour cache header', async ({ request }) => {
    const response = await request.get(
      'https://mzucfndifneytbesirkx.supabase.co/functions/v1/analytics-api/top-products',
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toContain('21600'); // 6 hours in seconds
  });

  test('Analytics responds within 500ms', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(
      'https://mzucfndifneytbesirkx.supabase.co/functions/v1/analytics-api/top-products',
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    const endTime = Date.now();

    expect(response.ok()).toBeTruthy();
    expect(endTime - startTime).toBeLessThan(500);
  });

  test('Analytics includes data source metadata', async ({ request }) => {
    const response = await request.get(
      'https://mzucfndifneytbesirkx.supabase.co/functions/v1/analytics-api/top-products',
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const data = await response.json();
    expect(data.metadata).toHaveProperty('data_source');
    expect(['outlet', 'tenant']).toContain(data.metadata.data_source);
    expect(data.metadata).toHaveProperty('days');
    expect(data.metadata.days).toBe(7);
  });

  test('Analytics requires authentication', async ({ request }) => {
    const response = await request.get(
      'https://mzucfndifneytbesirkx.supabase.co/functions/v1/analytics-api/top-products'
    );

    expect(response.status()).toBe(401);
  });

  test('Analytics handles empty data gracefully', async ({ request }) => {
    // This test assumes a scenario where there might be no orders
    const response = await request.get(
      'https://mzucfndifneytbesirkx.supabase.co/functions/v1/analytics-api/top-products',
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const data = await response.json();
    expect(Array.isArray(data.products)).toBeTruthy();
    // Should return empty array, not error
  });
});
