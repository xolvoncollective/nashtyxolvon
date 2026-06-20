const sqlite3 = require('better-sqlite3');
const db = sqlite3('data/nashtypos.db');

// Check chart endpoint directly via API
async function checkChart() {
  const res1 = await fetch('https://nashty-backoffice-backend-production.up.railway.app/api/dashboard/weekly-chart?tenantId=demo-tenant');
  const data1 = await res1.json();
  const currentTotal = data1.data[data1.data.length - 1].revenue || 0;
  console.log("Current Chart Revenue for Today:", currentTotal);

  console.log("Inserting a dummy order...");
  db.prepare(`
    INSERT INTO orders (id, tenant_id, outlet_id, user_id, order_number, order_type, payment_method, payment_status, order_status, subtotal, discount, tax, service_charge, total, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
  `).run('dummy-order-123', 'demo-tenant', 'demo-outlet', 'admin', 'SNY-9999', 'dine-in', 'cash', 'paid', 'completed', 100000, 0, 0, 0, 100000);

  const res2 = await fetch('https://nashty-backoffice-backend-production.up.railway.app/api/dashboard/weekly-chart?tenantId=demo-tenant');
  const data2 = await res2.json();
  const newTotal = data2.data[data2.data.length - 1].revenue || 0;
  console.log("New Chart Revenue for Today:", newTotal);

  if (newTotal > currentTotal) {
    console.log("B2 PASS: Chart increases when order is completed");
  } else {
    console.log("B2 FAILED: Chart did NOT increase");
  }

  // Cleanup
  db.prepare(`DELETE FROM orders WHERE id = 'dummy-order-123'`).run();
}
checkChart().catch(console.error);
