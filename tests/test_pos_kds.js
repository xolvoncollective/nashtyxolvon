const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to POS...');
    await page.goto('https://nashty-backoffice-backend-production.up.railway.app/pos/frontend/index.html');
    await page.waitForTimeout(1000);

    console.log('Logging in...');
    await page.click('.nk:has-text("1")');
    await page.click('.nk:has-text("2")');
    await page.click('.nk:has-text("3")');
    await page.click('.nk:has-text("4")');
    await page.waitForTimeout(1000);

    console.log('Adding item...');
    await page.click('.m-c');
    await page.waitForTimeout(500);

    await page.click('#btn-add');
    await page.waitForTimeout(500);

    console.log('Checkout...');
    await page.click('.btn-pay');
    await page.waitForTimeout(500);

    console.log('Paying exact cash...');
    await page.click('.nk.sp'); // UANG PAS
    await page.waitForTimeout(500);

    console.log('Confirming...');
    await page.click('#btn-cfm');
    await page.waitForTimeout(1500);

    const stitl = await page.textContent('.stitl').catch(()=>null);
    console.log('POS Success Text:', stitl);
    
    // Now verify KDS
    console.log('Checking KDS API...');
    const kdsRes = await fetch('https://nashty-backoffice-backend-production.up.railway.app/api/orders/kitchen/queue?tenantId=demo-tenant');
    const kdsData = await kdsRes.json();
    
    const hasPending = kdsData.orders.some(o => o.kitchen_status === 'pending');
    console.log('KDS API has pending orders:', hasPending);
    
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
