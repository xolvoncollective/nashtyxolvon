const sqlite3 = require('better-sqlite3');
const db = sqlite3('data/nashtypos.db');

const query = `
  SELECT 
    DATE(o.created_at, 'localtime') as date,
    COUNT(*) as order_count,
    COALESCE(SUM(o.total), 0) as revenue
  FROM orders o
  WHERE o.tenant_id = 'demo-tenant' AND o.payment_status = 'paid' AND o.order_status != 'cancelled'
    AND DATE(o.created_at, 'localtime') >= DATE('now', '-6 days', 'localtime')
    AND DATE(o.created_at, 'localtime') <= DATE('now', 'localtime')
  GROUP BY DATE(o.created_at, 'localtime')
  ORDER BY date ASC
`;

console.log("Current DB result:", db.prepare(query).all());

db.prepare(`
    INSERT INTO orders (id, tenant_id, outlet_id, user_id, order_number, order_type, payment_method, payment_status, order_status, subtotal, discount, tax, service_charge, total, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
  `).run('dummy-order-124', 'demo-tenant', 'demo-outlet', 'admin', 'SNY-9998', 'dine-in', 'cash', 'paid', 'completed', 100000, 0, 0, 0, 100000);

console.log("New DB result:", db.prepare(query).all());

db.prepare("DELETE FROM orders WHERE id = 'dummy-order-124'").run();
