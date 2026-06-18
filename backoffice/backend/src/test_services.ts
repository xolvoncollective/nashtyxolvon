import { OrderService } from './services/OrderService';
import { MemberService } from './services/MemberService';
import { ProductService } from './services/ProductService';
import { CostService } from './services/CostService';
import db from './db/database';
import bcrypt from 'bcryptjs';

async function run() {
  await db.initDatabase();

  console.log('--- DB SETUP ---');
  // Initialize some data to ensure test works
  const tenantId = 'tenant-test';
  const hashedPin = await bcrypt.hash('1234', 10);
  db.run("INSERT OR IGNORE INTO tenants (id, name, slug) VALUES (?, 'Test', 'test')", [tenantId]);
  db.run("INSERT OR IGNORE INTO outlets (id, tenant_id, name, slug) VALUES ('outlet-1', ?, 'Outlet 1', 'outlet-1')", [tenantId]);
  db.run("DELETE FROM users WHERE id = 'user-1'");
  db.run("INSERT INTO users (id, tenant_id, outlet_id, name, role, pin) VALUES ('user-1', ?, 'outlet-1', 'Admin', 'owner', ?)", [tenantId, hashedPin]);
  db.run("INSERT OR IGNORE INTO categories (id, tenant_id, name, slug) VALUES ('cat-1', ?, 'Cat 1', 'cat-1')", [tenantId]);
  db.run("DELETE FROM products WHERE id = 'prod-1'");
  db.run("INSERT INTO products (id, tenant_id, category_id, name, slug, price, stock_tracking, stock_qty) VALUES ('prod-1', ?, 'cat-1', 'Test Product', 'test-product', 50000, 1, 100)", [tenantId]);

  console.log('--- WAVE 1: Order -> CRM Points ---');
  const orderData = {
    tenantId,
    outletId: 'outlet-1',
    userId: 'user-1',
    orderType: 'dine-in',
    customerName: 'Budi Test',
    customerPhone: '08123456789',
    items: [{ productId: 'prod-1', productName: 'Test Product', quantity: 1, unitPrice: 50000, subtotal: 50000 }],
    subtotal: 50000, total: 50000, paymentMethod: 'cash',
    payments: [{ method: 'cash', amount: 50000 }]
  };
  
  const order = OrderService.createOrder(orderData) as any;
  console.log('Order created:', order.id);

  // Complete the order
  OrderService.updateOrderStatus(order.id, 'completed');
  const pts = db.query("SELECT * FROM crm_point_transactions WHERE tenant_id = ?", [tenantId]);
  console.log('CRM Point Transactions after complete:', pts);

  console.log('--- WAVE 2 & 3: Void / Refund ---');
  // Check stock before void
  let prod = db.get("SELECT stock_qty FROM products WHERE id = 'prod-1'");
  console.log('Stock before void:', prod.stock_qty);

  await OrderService.voidOrder(order.id, 'Test Void', 'user-1', '1234');
  prod = db.get("SELECT stock_qty FROM products WHERE id = 'prod-1'");
  console.log('Stock after void:', prod.stock_qty);

  // Re-create an order for refund test
  const order2 = OrderService.createOrder(orderData) as any;
  OrderService.updateOrderStatus(order2.id, 'completed');
  
  OrderService.refundOrder(order2.id, 'Test Refund', 50000, 'user-1');
  const pts2 = db.query("SELECT * FROM crm_point_transactions WHERE tenant_id = ?", [tenantId]);
  console.log('CRM Point Transactions after refund:', pts2);

  console.log('--- WAVE 4 & 5: Cost Sync ---');
  const recipeId = CostService.addRecipe({ tenantId, nama: 'Test Product', hpp_total: 15000 });
  console.log('Added recipe:', recipeId);
  prod = db.get("SELECT cost FROM products WHERE id = 'prod-1'");
  console.log('Product cost after add:', prod.cost);

  CostService.updateRecipe(recipeId, tenantId, { hpp_total: 20000 });
  prod = db.get("SELECT cost FROM products WHERE id = 'prod-1'");
  console.log('Product cost after update:', prod.cost);

  console.log('Validation complete.');
}

run().catch(console.error);
