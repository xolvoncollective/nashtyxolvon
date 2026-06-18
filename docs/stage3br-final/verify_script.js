const fs = require('fs');
const db = require('better-sqlite3')('../../data/nashtypos.db');

async function runVerification() {
  console.log("=== STAGE 3B-R FINAL VERIFICATION SCRIPT ===\n");

  const tenantId = 'demo-tenant';
  const outletId = 'demo-outlet';
  const userId = 'admin';
  const customerPhone = '081234567890';
  let orderId = '';
  let customerId = '';
  let productId = '';

  // Phase 4 - Database Integrity Check First
  console.log("--- PHASE 4: Database Integrity ---");
  const fkCheck = db.prepare('PRAGMA foreign_key_check').all();
  console.log("Foreign Key Check:", fkCheck.length === 0 ? 'PASSED (No violations)' : 'FAILED', fkCheck);
  const integrityCheck = db.prepare('PRAGMA integrity_check').all();
  console.log("Integrity Check:", integrityCheck[0].integrity_check === 'ok' ? 'PASSED' : 'FAILED', integrityCheck);
  console.log("");

  // Select a product for testing
  let product = db.prepare('SELECT id, name, price, stock_qty FROM products LIMIT 1').get();
  db.prepare('UPDATE products SET stock_tracking = 1, stock_qty = 100 WHERE id = ?').run(product.id);
  product = db.prepare('SELECT id, name, price, stock_qty FROM products WHERE id = ?').get(product.id);
  productId = product.id;
  const initialStock = product.stock_qty || 0;
  console.log(`[Flow D] Initial Stock for ${product.name}: ${initialStock}`);

  // Flow A: Shift Management
  console.log("\n--- FLOW A: Shift Management ---");
  console.log("Before Shift Count:", db.prepare('SELECT COUNT(*) as c FROM shifts').get().c);
  const shiftRes = await fetch('http://localhost:3099/api/shifts/start', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId, outletId, userId, startCash: 100000 })
  });
  const shiftData = await shiftRes.json();
  // It might fail if shift already open, that's fine, it means shift exists.
  console.log("Shift API Response:", shiftData.success || shiftData.error);
  console.log("After Shift Count:", db.prepare('SELECT COUNT(*) as c FROM shifts').get().c);

  // Flow B & C & D: Order Lifecycle, CRM, Inventory
  console.log("\n--- FLOW B/C/D: Order Creation & Completion ---");
  
  // Before Customer Points
  let cBefore = db.prepare('SELECT points FROM crm_customers WHERE phone = ?').get(customerPhone);
  const pointsBefore = cBefore ? cBefore.points : 0;
  console.log(`[Flow C] Customer points before: ${pointsBefore}`);

  const payload = {
    tenantId, outletId, userId,
    orderType: 'dine-in',
    customerName: 'Test Customer',
    customerPhone: customerPhone,
    items: [{ productId: product.id, productName: product.name, quantity: 2, unitPrice: product.price, subtotal: product.price * 2, modifiers: [] }],
    subtotal: product.price * 2,
    total: product.price * 2,
    payments: [{ method: 'tunai', amount: product.price * 2 }]
  };

  const createRes = await fetch('http://localhost:3099/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const createData = await createRes.json();
  if (createData.success) {
    orderId = createData.order.id;
    console.log(`Order Created: ${orderId}`);
    
    const stockAfterOrder = db.prepare('SELECT stock_qty FROM products WHERE id = ?').get(productId).stock_qty;
    console.log(`[Flow D] Stock after order (should be -2): ${stockAfterOrder}`);

    // Complete order
    await fetch(`http://localhost:3099/api/orders/${orderId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus: 'completed', kitchenStatus: 'served' })
    });
    console.log("Order Status set to completed/served");

    // After Customer Points
    let cAfter = db.prepare('SELECT points FROM crm_customers WHERE phone = ?').get(customerPhone);
    console.log(`[Flow C] Customer points after (should be +${Math.floor(payload.total/1000)}): ${cAfter ? cAfter.points : 0}`);
  } else {
    console.log("Order creation failed:", createData);
    return;
  }

  // Flow F: Refund Reversal
  console.log("\n--- FLOW F: Refund Reversal ---");
  const refundRes = await fetch(`http://localhost:3099/api/orders/${orderId}/refund`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Test Refund', refundAmount: payload.total, refundBy: 'admin' })
  });
  const refundData = await refundRes.json();
  console.log("Refund Response:", refundData.success);
  
  let cAfterRefund = db.prepare('SELECT points FROM crm_customers WHERE phone = ?').get(customerPhone);
  console.log(`[Flow C/F] Customer points after refund (should revert): ${cAfterRefund ? cAfterRefund.points : 'N/A'}`);

  // Flow E: Void Restoration
  console.log("\n--- FLOW E: Void Restoration ---");
  // Create another order to void
  const createRes2 = await fetch('http://localhost:3099/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const orderId2 = (await createRes2.json()).order.id;
  
  const stockBeforeVoid = db.prepare('SELECT stock_qty FROM products WHERE id = ?').get(productId).stock_qty;
  console.log(`[Flow E] Stock before void: ${stockBeforeVoid}`);
  
  const voidRes = await fetch(`http://localhost:3099/api/orders/${orderId2}/void`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Test Void', voidBy: 'admin', managerPin: '0000' })
  });
  console.log("Void Response:", (await voidRes.json()).success);
  
  const stockAfterVoid = db.prepare('SELECT stock_qty FROM products WHERE id = ?').get(productId).stock_qty;
  console.log(`[Flow E] Stock after void (should be +2): ${stockAfterVoid}`);
  
  console.log("\n=== VERIFICATION COMPLETE ===");
}

runVerification().catch(console.error);
