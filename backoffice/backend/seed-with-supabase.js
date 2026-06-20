require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const tenantId = '337db3a3-ba68-4da9-824a-1ad261197f58';
  const outletId = 'main-branch';

  try {
    // Insert Tenant
    await supabase.from('tenants').upsert({
      id: tenantId,
      name: 'Demo Tenant',
      slug: 'demo-tenant',
      status: 'active'
    });

    // Insert Outlet
    await supabase.from('outlets').upsert({
      id: outletId,
      tenant_id: tenantId,
      name: 'Nashty Pusat',
      slug: 'nashty-pusat',
      status: 'active'
    });

    console.log('Categories created');
    const cats = [
      { id: randomUUID(), name: 'Nashty Chicken', icon: '🍗', color: '#E4540C', order: 1 },
      { id: randomUUID(), name: 'Nashty Ricebox', icon: '🍱', color: '#EF4444', order: 2 },
      { id: randomUUID(), name: 'Minuman', icon: '🥤', color: '#3B82F6', order: 3 },
      { id: randomUUID(), name: 'Snack & Sides', icon: '🍟', color: '#F59E0B', order: 4 },
    ];
    
    for (const c of cats) {
      await supabase.from('categories').upsert({
        id: c.id, tenant_id: tenantId, name: c.name, 
        slug: c.name.toLowerCase().replace(/\s+/g, '-'), 
        icon: c.icon, color: c.color, display_order: c.order, status: 'active'
      });
    }

    console.log('Products created');
    const products = [
      { id: randomUUID(), cat_id: cats[0].id, name: 'Ayam Nashty Hot 1 Pc', price: 25000 },
      { id: randomUUID(), cat_id: cats[0].id, name: 'Nashty Wings 6pcs', price: 35000 },
      { id: randomUUID(), cat_id: cats[1].id, name: 'Ricebox Nashty Ori', price: 28000 },
      { id: randomUUID(), cat_id: cats[2].id, name: 'Es Teh Nashty', price: 8000 },
      { id: randomUUID(), cat_id: cats[3].id, name: 'French Fries Large', price: 18000 },
    ];
    
    for (const p of products) {
      await supabase.from('products').upsert({
        id: p.id, tenant_id: tenantId, category_id: p.cat_id, 
        name: p.name, slug: p.name.toLowerCase().replace(/\s+/g, '-'), 
        price: p.price, cost: 0, has_modifiers: 0, production_time: 10, status: 'active'
      });
    }

    console.log('Seed completed successfully!');
  } catch (e) {
    console.error('Seed error:', e);
  }
}

run();
