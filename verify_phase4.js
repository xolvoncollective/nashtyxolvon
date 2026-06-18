const sqlite3 = require('better-sqlite3');
const db = sqlite3('data/nashtypos.db');

async function run() {
  console.log("--- F1: General settings not saved ---");
  const resF1Get = await fetch('http://localhost:3099/api/settings/demo-outlet?tenantId=demo-tenant');
  const dataF1Get = await resF1Get.json();
  const initFooter = dataF1Get.data?.receipt_footer || '';
  
  const putBodyF1 = { settings: { receipt_footer: 'Tested Footer' }, tenantId: 'demo-tenant' };
  const resF1Put = await fetch('http://localhost:3099/api/settings/demo-outlet', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(putBodyF1)
  });
  
  const resF1Get2 = await fetch('http://localhost:3099/api/settings/demo-outlet?tenantId=demo-tenant');
  const dataF1Get2 = await resF1Get2.json();
  if (dataF1Get2.settings?.receipt_footer === 'Tested Footer') {
    console.log("F1 PASS: General settings saved");
  } else {
    console.log("F1 FAILED: General settings not saved");
  }

  console.log("--- F2: Payment methods not saved ---");
  const putBodyF2 = { 
    settings: { test: 1 }, 
    tenantId: 'demo-tenant',
    paymentMethods: [{ name: 'Test PM', type: 'qris', icon: 'qr_code', status: 'active', display_order: 1 }]
  };
  const resF2Put = await fetch('http://localhost:3099/api/settings/demo-outlet', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(putBodyF2)
  });
  
  const resF2Get = await fetch('http://localhost:3099/api/settings/demo-outlet?tenantId=demo-tenant');
  const dataF2Get = await resF2Get.json();
  const pmExists = dataF2Get.paymentMethods?.find(pm => pm.name === 'Test PM');
  
  if (pmExists) {
    console.log("F2 PASS: Payment methods saved");
  } else {
    console.log("F2 FAILED: Payment methods not saved");
  }

  console.log("--- G1: POS device pairing doesn't persist ---");
  // Check if devices table exists
  const hasDevices = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='devices'").get();
  if (hasDevices) {
    console.log("G1 PASS: Devices table exists");
  } else {
    console.log("G1 FAILED: Devices table missing");
  }

  console.log("--- M1: Profile data doesn't persist ---");
  const resM1Get = await fetch('http://localhost:3099/api/auth/me', {
    headers: { 'Authorization': 'Bearer test-token' } // We might need a real token or mock auth
  });
  console.log("M1 GET Status:", resM1Get.status);
}

run().catch(console.error);
