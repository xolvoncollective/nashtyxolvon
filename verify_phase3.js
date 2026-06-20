const sqlite3 = require('better-sqlite3');
const db = sqlite3('data/nashtypos.db');

async function run() {
  db.prepare("DELETE FROM products WHERE id = 'prod-mod-1'").run();
  db.prepare("DELETE FROM modifier_groups WHERE id = 'mod-grp-1'").run();
  db.prepare("DELETE FROM modifier_options WHERE group_id = 'mod-grp-1'").run();
  db.prepare("DELETE FROM product_modifiers WHERE product_id = 'prod-mod-1'").run();
  db.prepare("DELETE FROM orders WHERE id = 'order-mod-1'").run();
  db.prepare("DELETE FROM order_items WHERE order_id = 'order-mod-1'").run();
  db.prepare("DELETE FROM order_item_modifiers WHERE order_item_id = 'item-mod-1'").run();
  db.prepare("DELETE FROM outlets WHERE id = 'demo-outlet-3'").run();

  db.prepare(`INSERT INTO outlets (id, tenant_id, name, slug, status) VALUES (?, ?, ?, ?, ?)`).run('demo-outlet-3', 'demo-tenant', 'Demo Outlet 3', 'demo-outlet-3', 'active');
  
  db.prepare(`INSERT INTO products (id, tenant_id, category_id, name, slug, price, status, has_modifiers) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('prod-mod-1', 'demo-tenant', '7376034e-470f-492c-9a55-11276b9f5414', 'Product With Modifiers', 'prod-mod-1', 10000, 'active', 1);
  db.prepare(`INSERT INTO modifier_groups (id, tenant_id, name, type, status) VALUES (?, ?, ?, ?, ?)`).run('mod-grp-1', 'demo-tenant', 'Toppings', 'multiple', 'active');
  db.prepare(`INSERT INTO modifier_options (id, group_id, name, price_adjustment, status) VALUES (?, ?, ?, ?, ?)`).run('mod-opt-1', 'mod-grp-1', 'Cheese', 2000, 'active');
  db.prepare(`INSERT INTO product_modifiers (product_id, modifier_group_id) VALUES (?, ?)`).run('prod-mod-1', 'mod-grp-1');

  // E1. Modifiers in POS
  const resE1 = await fetch('https://nashty-backoffice-backend-production.up.railway.app/api/menu/outlet/demo-outlet-3?tenantId=demo-tenant');
  const dataE1 = await resE1.json();
  const prodsE1 = dataE1.data.items || [];
  const prodMod = prodsE1.find(p => p.id === 'prod-mod-1');
  
  if (prodMod && prodMod.modifier_groups && prodMod.modifier_groups.length > 0) {
    console.log("E1 PASS: Modifiers appear in POS API");
  } else {
    console.log("E1 FAILED: Modifiers missing in POS API");
  }

  // E2. Modifiers in KDS
  db.prepare(`INSERT INTO orders (id, tenant_id, outlet_id, user_id, order_number, order_type, subtotal, total, order_status, kitchen_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
    .run('order-mod-1', 'demo-tenant', 'demo-outlet-3', 'admin', 'SNY-MOD-1', 'dine-in', 12000, 12000, 'confirmed', 'preparing');
  db.prepare(`INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, subtotal, kitchen_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('item-mod-1', 'order-mod-1', 'prod-mod-1', 'Product With Modifiers', 1, 10000, 12000, 'preparing');
  db.prepare(`INSERT INTO order_item_modifiers (id, order_item_id, modifier_group_id, modifier_group_name, modifier_option_id, modifier_option_name, price_adjustment) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('item-mod-opt-1', 'item-mod-1', 'mod-grp-1', 'Toppings', 'mod-opt-1', 'Cheese', 2000);

  const resE2 = await fetch('https://nashty-backoffice-backend-production.up.railway.app/api/orders?tenantId=demo-tenant&outletId=demo-outlet-3');
  const dataE2 = await resE2.json();
  const orderKds = (dataE2.orders || []).find(o => o.id === 'order-mod-1');
  
  if (orderKds && orderKds.items && orderKds.items[0].modifiers && orderKds.items[0].modifiers.length > 0) {
    console.log("E2 PASS: Modifiers appear in KDS API");
  } else {
    console.log("E2 FAILED: Modifiers missing in KDS API");
  }

  // Cleanup
  db.prepare("DELETE FROM products WHERE id = 'prod-mod-1'").run();
  db.prepare("DELETE FROM modifier_groups WHERE id = 'mod-grp-1'").run();
  db.prepare("DELETE FROM modifier_options WHERE group_id = 'mod-grp-1'").run();
  db.prepare("DELETE FROM product_modifiers WHERE product_id = 'prod-mod-1'").run();
  db.prepare("DELETE FROM orders WHERE id = 'order-mod-1'").run();
  db.prepare("DELETE FROM order_items WHERE order_id = 'order-mod-1'").run();
  db.prepare("DELETE FROM order_item_modifiers WHERE order_item_id = 'item-mod-1'").run();
  db.prepare("DELETE FROM outlets WHERE id = 'demo-outlet-3'").run();
}
run().catch(console.error);
