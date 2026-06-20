const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_6XFZqLgu52yyoX4uZ0thZA_CMHQM1H7';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('Connecting to Supabase...');
  
  const tenantId = 'demo-tenant';
  const outletId = 'd4ee75ff-f866-4fbc-baa9-95bba9af52ed';
  
  try {
     // Tenants
     await supabase.from('tenants').upsert({ id: tenantId, name: 'Demo Tenant', slug: 'demo-tenant', status: 'active' }, { onConflict: 'id' });
     console.log('Tenant OK');
     
     // Outlets
     await supabase.from('outlets').upsert({ id: outletId, tenant_id: tenantId, name: 'Nashty Pusat', slug: 'nashty-pusat', status: 'active' }, { onConflict: 'id' });
     console.log('Outlet OK');

     // Staff
     const users = [
       { id: 'admin-1', name: 'Admin 1', pin: '1234', role: 'admin' },
       { id: randomUUID(), name: 'Citra Kasir', pin: '2345', role: 'kasir' },
       { id: randomUUID(), name: 'Budi Chef', pin: '3456', role: 'kitchen' }
     ];
     
     for (const u of users) {
       const hash = bcrypt.hashSync(u.pin, 10);
       await supabase.from('users').upsert({
         id: u.id, tenant_id: tenantId, outlet_id: outletId, name: u.name, pin: hash, password_hash: hash, role: u.role, status: 'active'
       }, { onConflict: 'id' });
     }
     console.log('Users OK');
     
     // Categories
     const cats = [
       { id: randomUUID(), name: 'Nashty Chicken', icon: '🍗', color: '#E4540C', order: 1 },
       { id: randomUUID(), name: 'Nashty Ricebox', icon: '🍱', color: '#EF4444', order: 2 },
       { id: randomUUID(), name: 'Minuman', icon: '🥤', color: '#3B82F6', order: 3 },
       { id: randomUUID(), name: 'Snack & Sides', icon: '🍟', color: '#F59E0B', order: 4 },
     ];
     
     for (const c of cats) {
       await supabase.from('categories').upsert({
         id: c.id, tenant_id: tenantId, name: c.name, slug: c.name.toLowerCase().replace(/\s+/g, '-'), icon: c.icon, color: c.color, display_order: c.order, status: 'active'
       }, { onConflict: 'id' });
     }
     console.log('Categories OK');
     
     // Products
     const products = [
       { id: randomUUID(), cat_id: cats[0].id, name: 'Ayam Nashty Hot 1 Pc', price: 25000 },
       { id: randomUUID(), cat_id: cats[0].id, name: 'Nashty Wings 6pcs', price: 35000 },
       { id: randomUUID(), cat_id: cats[1].id, name: 'Ricebox Nashty Ori', price: 28000 },
       { id: randomUUID(), cat_id: cats[2].id, name: 'Es Teh Nashty', price: 8000 },
       { id: randomUUID(), cat_id: cats[3].id, name: 'French Fries Large', price: 18000 },
     ];
     
     for (const p of products) {
       await supabase.from('products').upsert({
         id: p.id, tenant_id: tenantId, category_id: p.cat_id, name: p.name, slug: p.name.toLowerCase().replace(/\s+/g, '-'), price: p.price, cost: 0, has_modifiers: false, production_time: 10, status: 'active'
       }, { onConflict: 'id' });
     }
     console.log('Products OK');

     console.log('Seed completed successfully via REST!');
  } catch(e) {
     console.error('Seed error:', e);
  }
}
run();
