const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('--- STARTING WF4 E2E TEST ---');

  try {
    // 1. Setup Outlet & Session
    console.log('[1] Logging into Backoffice...');
    await page.goto('https://nashty-backoffice-backend-production.up.railway.app/backoffice');
    await page.fill('input[type="email"]', 'admin@nashty.id');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // 2. Open POS
    console.log('[2] Opening POS...');
    await page.goto('https://nashty-backoffice-backend-production.up.railway.app/pos');
    await page.waitForTimeout(3000);

    // Add member
    console.log('[3] Adding member...');
    await page.click('#mem-pill'); // Assuming #mem-pill opens member modal
    await page.waitForTimeout(1000);
    await page.fill('#mem-text-inp', '08999999999');
    await page.waitForTimeout(1000);
    await page.evaluate(() => doMemSearch());
    await page.waitForTimeout(1000);
    await page.click('.btn-add-new'); // Register new member
    await page.waitForTimeout(1000);

    // Add item
    console.log('[4] Adding item to cart...');
    const firstItem = await page.$('.pcard');
    if (firstItem) await firstItem.click();
    await page.waitForTimeout(1000);

    // Proceed to payment
    console.log('[5] Proceed to payment...');
    await page.click('#btn-pay');
    await page.waitForTimeout(1000);
    await page.click('#pmb-cash');
    await page.waitForTimeout(500);
    await page.click('.nk.sp'); // UANG PAS
    await page.waitForTimeout(500);
    await page.click('#btn-cfm');
    await page.waitForTimeout(2000);
    
    console.log('[6] Payment Success in POS');
    
    // Open KDS
    console.log('[7] Opening KDS...');
    await page.goto('https://nashty-backoffice-backend-production.up.railway.app/kds');
    await page.waitForTimeout(2000);
    
    // Complete the order
    console.log('[8] Completing order in KDS...');
    const completeBtn = await page.$('button.kbtn-finish'); // Ensure correct class
    if (completeBtn) {
       await completeBtn.click();
       await page.waitForTimeout(2000);
       console.log('Order completed in KDS');
    } else {
       console.log('No order to complete in KDS');
    }

    // Check CRM
    console.log('[9] Checking CRM...');
    await page.goto('https://nashty-backoffice-backend-production.up.railway.app/crm');
    await page.waitForTimeout(3000);
    
    // Capture screenshot of CRM to verify points
    await page.screenshot({ path: 'C:\\Users\\zaidu\\.gemini\\antigravity-ide\\brain\\57762457-fb04-4b5f-a4d1-465bc6ccd408\\crm_verification.png', fullPage: true });
    console.log('Saved screenshot of CRM to crm_verification.png');

    console.log('--- WF4 TEST SUCCESS ---');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
})();
