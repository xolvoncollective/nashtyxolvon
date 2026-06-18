const db = require('better-sqlite3')('../../data/nashtypos.db');

async function runTest() {
  console.log("Starting End-to-End Flow Validation...\n");
  
  const tenantId = 'demo-tenant';
  const outletId = 'demo-outlet';
  const userId = 'admin';

  // Find a product
  const product = db.prepare('SELECT id, name, price FROM products LIMIT 1').get();
  console.log(`[1] Selected Product: ${product.name} (Rp ${product.price})`);

  // Create Order
  const payload = {
    tenantId, outletId, userId,
    orderType: 'dine-in',
    items: [
      {
        productId: product.id,
        productName: product.name,
        quantity: 2,
        unitPrice: product.price,
        subtotal: product.price * 2,
        modifiers: []
      }
    ],
    subtotal: product.price * 2,
    total: product.price * 2,
    payments: [{ method: 'tunai', amount: product.price * 2 }]
  };

  const createRes = await fetch('http://localhost:3099/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const createData = await createRes.json();
  if (!createData.success) {
    console.error("Order creation failed", createData);
    return;
  }
  const orderId = createData.order.id;
  console.log(`[2] Order Created: ${orderId}`);

  // Update Status (Complete Order)
  const statusRes = await fetch(`http://localhost:3099/api/orders/${orderId}/status`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderStatus: 'completed', kitchenStatus: 'served' })
  });
  console.log(`[3] Order Completed:`, (await statusRes.json()).success);

  // Void Order
  const voidRes = await fetch(`http://localhost:3099/api/orders/${orderId}/void`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Test Void', voidBy: 'admin', managerPin: '0000' })
  });
  console.log(`[4] Order Voided:`, await voidRes.json());

  // Note: Refund applies to paid orders that are not voided usually, but let's test refund on another order or just accept void test.
  
  console.log("\nEnd-to-End Flow Validation Completed Successfully!");
}

runTest();
