const http = require('http');

const endpoints = [
  '/api/health',
  '/api/auth/outlets',
  '/api/categories?tenantId=demo-tenant',
  '/api/products?tenantId=demo-tenant'
];

async function run() {
  for (const ep of endpoints) {
    try {
      const res = await fetch(`https://nashty-backoffice-backend-production.up.railway.app${ep}`);
      const text = await res.text();
      console.log(`\n=== GET ${ep} ===`);
      console.log(`Status: ${res.status}`);
      console.log(`Response: ${text.substring(0, 200)}`);
    } catch (e) {
      console.log(`\n=== GET ${ep} ===`);
      console.log(`Error: ${e.message}`);
    }
  }
}

run();
