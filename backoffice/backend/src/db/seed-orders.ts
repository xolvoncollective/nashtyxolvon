import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../../../data/nashtypos.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

console.log('Seeding dummy orders...');

// Delete existing orders
db.prepare('DELETE FROM order_items').run();
db.prepare('DELETE FROM orders').run();

const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const orders = [
  { id: 'ORD-001', date: now.toISOString(), status: 'completed', type: 'dine-in', subtotal: 100000, total: 110000, items: [{ name: 'Nasi Goreng Spesial', qty: 2, price: 50000 }] },
  { id: 'ORD-002', date: now.toISOString(), status: 'completed', type: 'takeaway', subtotal: 75000, total: 82500, items: [{ name: 'Ayam Bakar Madu', qty: 1, price: 55000 }, { name: 'Es Teh Manis', qty: 2, price: 10000 }] },
  { id: 'ORD-003', date: yesterday.toISOString(), status: 'completed', type: 'dine-in', subtotal: 150000, total: 165000, items: [{ name: 'Gado-Gado', qty: 3, price: 28000 }, { name: 'Jus Alpukat', qty: 2, price: 18000 }] }
];

for (const order of orders) {
  db.prepare(`
    INSERT INTO orders (id, tenant_id, outlet_id, user_id, order_number, customer_name, order_type, table_number, order_status, payment_status, subtotal, tax, total, created_at)
    VALUES (?, 'demo-tenant', 'demo-outlet', 'usr-1', ?, 'Guest', ?, 'T1', ?, 'paid', ?, ?, ?, ?)
  `).run(order.id, 'ORD-' + Date.now(), order.type, order.status, order.subtotal, order.total - order.subtotal, order.total, order.date);

  for (const item of order.items) {
    db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('ITEM-' + Math.random().toString(36).substring(7), order.id, 'prod-1', item.name, item.qty, item.price, item.qty * item.price);
  }
}

console.log('Done!');
