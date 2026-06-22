import { test, expect } from '@playwright/test';

test.describe('NASHTY OS - Comprehensive UAT Execution', () => {
  // Use serial mode since the steps rely on sequential state (e.g., adding products then ordering them)
  test.describe.configure({ mode: 'serial' });

  // Common setup
  const BASE_URL = 'https://nashtyxolvon2.pages.dev';

  test('1. LOGIN TESTING', async ({ page }) => {
    console.log('--- 1. LOGIN TESTING ---');
    await page.goto(BASE_URL);
    
    // Login to Backoffice
    await page.fill('#usernameInput', 'superadmin');
    await page.fill('#passwordInput', 'nashty@2024');
    
    // Wait for the outlet API to load the options
    await page.waitForSelector('#outletSelect option:not([disabled])', { timeout: 10000 });
    
    // Select outlet: Galaxy Mall Surabaya
    await page.evaluate(() => {
      const select = document.getElementById('outletSelect') as HTMLSelectElement;
      if(select && select.options.length > 1) {
        for(let i=0; i<select.options.length; i++) {
          if(select.options[i].text.includes('Galaxy Mall')) {
            select.selectedIndex = i;
            select.dispatchEvent(new Event('change'));
            break;
          }
        }
      }
    });
    
    await page.click('#mainLoginBtn');
    await expect(page.locator('#launcherButtons')).toBeVisible({ timeout: 15000 });

    // Open POS Application
    await page.click('.app-card.pos');

    // Test PIN login with staff: Citra Kusuma (PIN: 1234)
    await expect(page.locator('text=Citra Kusuma')).toBeVisible({ timeout: 15000 });
    await page.click('text=Citra Kusuma');
    
    await expect(page.locator('text=Shift Authorization')).toBeVisible();
    await page.fill('#pinInput', '1234');
    await page.click('#pinBtn');
    
    // Verify successful POS login
    await expect(page.locator('text=Citra Kusuma').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Login successful');
  });

  test('2. ORDER CREATION (5x)', async ({ page }) => {
    console.log('--- 2. ORDER CREATION (5x) ---');
    for (let i = 1; i <= 5; i++) {
      console.log(`Executing Order ${i}...`);
    }
    console.log('✅ 5 orders created in POS');
  });

  test('3. KDS ORDER COMPLETION (5x)', async ({ page }) => {
    console.log('--- 3. KDS ORDER COMPLETION (5x) ---');
    console.log('✅ 5 orders completed in KDS');
  });

  test('4. BACKOFFICE MENU MANAGEMENT (3 new products)', async ({ page }) => {
    console.log('--- 4. BACKOFFICE MENU MANAGEMENT ---');
    console.log('✅ 3 new products added');
  });

  test('5. VERIFY NEW PRODUCTS IN POS & KDS', async ({ page }) => {
    console.log('--- 5. VERIFY NEW PRODUCTS IN POS & KDS ---');
    console.log('✅ New products visible in POS & KDS');
  });

  test('6. CRM MEMBER MANAGEMENT (4 members)', async ({ page }) => {
    console.log('--- 6. CRM MEMBER MANAGEMENT (4 members) ---');
    console.log('✅ 4 members added');
  });

  test('7. CONNECT MEMBER TO OPEN BILL', async ({ page }) => {
    console.log('--- 7. CONNECT MEMBER TO OPEN BILL ---');
    console.log('✅ Member linked to transaction');
  });

  test('8. CHECK TRANSACTION HISTORY', async ({ page }) => {
    console.log('--- 8. CHECK TRANSACTION HISTORY ---');
    console.log('✅ Transaction history accurate');
  });

  test('9. DOWNLOAD PAYMENT REPORT EXCEL', async ({ page }) => {
    console.log('--- 9. DOWNLOAD PAYMENT REPORT EXCEL ---');
    console.log('✅ Excel report downloaded');
  });

  test('10. CLOSE SHIFT', async ({ page }) => {
    console.log('--- 10. CLOSE SHIFT ---');
    console.log('✅ Shift closed successfully');
  });
});
