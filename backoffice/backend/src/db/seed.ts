import db, { initDatabase } from './database';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

async function runSeed() {
  // Initialize database first
  await initDatabase();

const tenantId = 'demo-tenant';
const outletId = 'demo-outlet';

// Clear existing data (for development)
console.log('Clearing existing data...');
db.run(`DELETE FROM order_item_modifiers`);
db.run(`DELETE FROM order_items`);
db.run(`DELETE FROM orders`);
db.run(`DELETE FROM shifts`);
db.run(`DELETE FROM product_modifiers`);
db.run(`DELETE FROM modifier_options`);
db.run(`DELETE FROM modifier_groups`);
db.run(`DELETE FROM products`);
db.run(`DELETE FROM categories`);
db.run(`DELETE FROM payment_methods`);
db.run(`DELETE FROM users`);
db.run(`DELETE FROM outlets`);
db.run(`DELETE FROM tenants`);

// Seed Tenant
console.log('Seeding tenant...');
db.run(`
  INSERT INTO tenants (id, name, slug, plan, status)
  VALUES (?, ?, ?, ?, ?)
`, [tenantId, 'Demo Restaurant', 'demo', 'pro', 'active']);

// Seed Outlet
console.log('Seeding outlet...');
db.run(`
  INSERT INTO outlets (id, tenant_id, name, slug, address, phone, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`, [
  outletId,
  tenantId,
  'Galaxy Mall',
  'galaxy-mall',
  'Jl. Galaxy Mall No. 123, Jakarta',
  '021-12345678',
  'active'
]);

// Seed Users
console.log('Seeding users...');
const users = [
  { id: 'admin', name: 'Admin Demo', email: 'admin@nashty.demo', role: 'owner', pin: '0000' },
  { id: 'citra', name: 'Citra Dewi', email: 'citra@nashty.demo', role: 'cashier', pin: '1234' },
  { id: 'budi', name: 'Budi Santoso', email: 'budi@nashty.demo', role: 'cashier', pin: '2345' },
  { id: 'ani', name: 'Ani Kitchen', email: 'ani@nashty.demo', role: 'kitchen', pin: '3456' },
];

const userSql = `
  INSERT INTO users (id, tenant_id, outlet_id, email, name, role, pin, password_hash, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

users.forEach(user => {
  const hashedPin = bcrypt.hashSync(user.pin, 10);
  db.run(userSql, [
    user.id,
    tenantId,
    outletId,
    user.email,
    user.name,
    user.role,
    hashedPin,
    hashedPin,
    'active'
  ]);
});

// Seed Categories
console.log('Seeding categories...');
const categories = [
  { name: 'Makanan', slug: 'makanan', desc: 'Menu makanan utama', icon: '🍽️', color: '#E4540C' },
  { name: 'Minuman', slug: 'minuman', desc: 'Minuman panas dan dingin', icon: '🥤', color: '#3B82F6' },
  { name: 'Camilan', slug: 'camilan', desc: 'Snack dan gorengan', icon: '🍟', color: '#F59E0B' },
  { name: 'Dessert', slug: 'dessert', desc: 'Penutup dan minuman manis', icon: '🍰', color: '#A855F7' },
  { name: 'Add On', slug: 'addon', desc: 'Tambahan berbayar', icon: '➕', color: '#22C55E' },
];

const catSql = `
  INSERT INTO categories (id, tenant_id, name, slug, description, icon, color, display_order, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const categoryIds: Record<string, string> = {};
categories.forEach((cat, idx) => {
  const id = crypto.randomUUID();
  categoryIds[cat.slug] = id;
  db.run(catSql, [
    id,
    tenantId,
    cat.name,
    cat.slug,
    cat.desc,
    cat.icon,
    cat.color,
    idx,
    'active'
  ]);
});

// Seed Products
console.log('Seeding products...');
const products = [
  { name: 'Ayam Bakar Madu', cat: 'makanan', desc: 'Bumbu kacang & lalapan', price: 55000, cost: 25000, time: 15 },
  { name: 'Nasi Goreng Spesial', cat: 'makanan', desc: 'Telur mata sapi & kerupuk', price: 35000, cost: 15000, time: 12 },
  { name: 'Rawon Spesial', cat: 'makanan', desc: 'Kluwek hitam, sapi empuk', price: 42000, cost: 20000, time: 20 },
  { name: 'Sop Buntut', cat: 'makanan', desc: 'Kuah bening, buntut empuk', price: 65000, cost: 30000, time: 25 },
  { name: 'Ayam Geprek', cat: 'makanan', desc: 'Crispy + sambal bawang', price: 38000, cost: 18000, time: 10 },
  { name: 'Sate Ayam 10pcs', cat: 'makanan', desc: 'Bumbu kacang atau kecap', price: 45000, cost: 20000, time: 15 },
  { name: 'Gado-Gado', cat: 'makanan', desc: 'Sayur segar bumbu kacang', price: 28000, cost: 12000, time: 8 },
  
  { name: 'Kopi Susu Aren', cat: 'minuman', desc: 'Cold brew + oat milk', price: 22000, cost: 8000, time: 5 },
  { name: 'Es Teh Manis', cat: 'minuman', desc: 'Teh tubruk segar', price: 8000, cost: 2000, time: 3 },
  { name: 'Lemon Tea', cat: 'minuman', desc: 'Segar asam manis', price: 12000, cost: 4000, time: 4 },
  { name: 'Jus Alpukat', cat: 'minuman', desc: 'Alpukat segar murni', price: 18000, cost: 7000, time: 5 },
  
  { name: 'French Fries', cat: 'camilan', desc: 'Crispy + saus spesial', price: 22000, cost: 8000, time: 7 },
  { name: 'Onion Rings', cat: 'camilan', desc: 'Bawang bombay crispy', price: 20000, cost: 7000, time: 7 },
  
  { name: 'Es Krim Cokelat', cat: 'dessert', desc: 'Double scoop premium', price: 18000, cost: 6000, time: 2 },
  { name: 'Puding Karamel', cat: 'dessert', desc: 'Lembut manis', price: 15000, cost: 5000, time: 2 },
  
  { name: 'Nasi Putih', cat: 'addon', desc: 'Nasi putih per porsi', price: 6000, cost: 2000, time: 2 },
  { name: 'Extra Sambal', cat: 'addon', desc: 'Sambal pedas extra', price: 3000, cost: 1000, time: 1 },
  { name: 'Lalapan', cat: 'addon', desc: 'Sayuran segar', price: 4000, cost: 2000, time: 2 },
];

const prodSql = `
  INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, 
    production_time, has_modifiers, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

products.forEach(prod => {
  const slug = prod.name.toLowerCase().replace(/\s+/g, '-');
  db.run(prodSql, [
    crypto.randomUUID(),
    tenantId,
    categoryIds[prod.cat],
    prod.name,
    slug,
    prod.desc,
    prod.price,
    prod.cost,
    prod.time,
    0,
    'active'
  ]);
});

  console.log('✓ Seed completed successfully!');
  console.log(`
  Demo Credentials:
  -----------------
  PIN: 1234 - Citra Dewi (Cashier)
  PIN: 2345 - Budi Santoso (Cashier)
  PIN: 0000 - Admin Demo (Owner)
  `);

  process.exit(0);
}

runSeed().catch(console.error);
