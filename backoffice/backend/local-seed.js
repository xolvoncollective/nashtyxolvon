const { Client } = require('pg');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: 'db.mzucfndifneytbesirkx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'ZaidunkMarginpublishable',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to DB');
  
  const tenantId = 'demo-tenant';
  const outletId = 'd4ee75ff-f866-4fbc-baa9-95bba9af52ed'; // Nashty Pusat
  
  try {
     // Tenants
     await client.query(`INSERT INTO tenants (id, name, slug, status) VALUES ($1, 'Demo Tenant', 'demo-tenant', 'active') ON CONFLICT (id) DO NOTHING`, [tenantId]);
     
     // Outlets
     await client.query(`INSERT INTO outlets (id, tenant_id, name, slug, status) VALUES ($1, $2, 'Nashty Pusat', 'nashty-pusat', 'active') ON CONFLICT (id) DO NOTHING`, [outletId, tenantId]);

     // Staff
     const users = [
       { id: 'admin-1', name: 'Admin 1', pin: '1234', role: 'admin' }, // Match what login uses
       { id: randomUUID(), name: 'Citra Kasir', pin: '2345', role: 'kasir' },
       { id: randomUUID(), name: 'Budi Chef', pin: '3456', role: 'kitchen' }
     ];
     
     for (const u of users) {
       const hash = bcrypt.hashSync(u.pin, 10);
       await client.query(`INSERT INTO users (id, tenant_id, outlet_id, name, pin, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') ON CONFLICT (id) DO UPDATE SET pin = EXCLUDED.pin, password_hash = EXCLUDED.password_hash`, 
         [u.id, tenantId, outletId, u.name, hash, hash, u.role]);
     }
     console.log('Users created');
     
     // Categories
     const cats = [
       { id: randomUUID(), name: 'Nashty Chicken', icon: '🍗', color: '#E4540C', order: 1 },
       { id: randomUUID(), name: 'Nashty Ricebox', icon: '🍱', color: '#EF4444', order: 2 },
       { id: randomUUID(), name: 'Minuman', icon: '🥤', color: '#3B82F6', order: 3 },
       { id: randomUUID(), name: 'Snack & Sides', icon: '🍟', color: '#F59E0B', order: 4 },
     ];
     
     for (const c of cats) {
       await client.query(`INSERT INTO categories (id, tenant_id, name, slug, icon, color, display_order, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') ON CONFLICT (id) DO NOTHING`,
         [c.id, tenantId, c.name, c.name.toLowerCase().replace(/\s+/g, '-'), c.icon, c.color, c.order]);
     }
     console.log('Categories created');
     
     // Products
     const products = [
       { id: randomUUID(), cat_id: cats[0].id, name: 'Ayam Nashty Hot 1 Pc', price: 25000 },
       { id: randomUUID(), cat_id: cats[0].id, name: 'Nashty Wings 6pcs', price: 35000 },
       { id: randomUUID(), cat_id: cats[1].id, name: 'Ricebox Nashty Ori', price: 28000 },
       { id: randomUUID(), cat_id: cats[2].id, name: 'Es Teh Nashty', price: 8000 },
       { id: randomUUID(), cat_id: cats[3].id, name: 'French Fries Large', price: 18000 },
     ];
     
     for (const p of products) {
       await client.query(`INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, has_modifiers, production_time, status) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 10, 'active') ON CONFLICT (id) DO NOTHING`,
         [p.id, tenantId, p.cat_id, p.name, p.name.toLowerCase().replace(/\s+/g, '-'), p.price]);
     }
     console.log('Products created');

     console.log('Seed completed successfully!');
  } catch(e) {
     console.error('Seed error:', e);
  } finally {
     await client.end();
  }
}
run();
