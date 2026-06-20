const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://nashty-backoffice-backend-production.up.railway.app/backoffice', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.localStorage.setItem('session', JSON.stringify({
      token: 'demo-token',
      tenantId: 'demo-tenant',
      user: { name: 'Admin', role: 'owner' }
    }));
  });
  await page.goto('https://nashty-backoffice-backend-production.up.railway.app/backoffice', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // A1. Profile button clicking
  console.log("--- A1: Testing Profile Button ---");
  const btn = await page.$('.user-menu') || await page.$('.ph-title');
  if (btn) {
    try {
      await btn.click();
      await page.waitForTimeout(500);
      const isVisible = await page.$('.dropdown-menu') || await page.$('.user-dropdown');
      if (isVisible) console.log("A1 PASS: Dropdown opened on click");
      else console.log("A1 FAILED: Dropdown did not appear");
    } catch(e) { console.log("A1 FAILED: Error clicking: ", e.message); }
  } else {
    console.log("A1 FAILED: Cannot find profile button in DOM");
  }

  // B2. Chart
  console.log("--- B2: Chart Rendering ---");
  const chartBars = await page.$$eval('.bar', els => els.length);
  if (chartBars > 0) console.log(`B2 PASS: Found ${chartBars} chart bars rendering.`);
  else console.log("B2 FAILED: Chart bars missing or not rendering.");

  await browser.close();
}
run().catch(console.error);
