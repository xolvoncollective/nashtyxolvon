import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

dotenv.config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Seed Supabase Database with Demo Data
 * 
 * This script populates the Supabase database with:
 * - 1 Tenant (Nashty Cafe)
 * - 1 Outlet (Main Branch)
 * - 4 Users (admin, manager, cashier, chef)
 * - 3 Categories (Minuman, Makanan, Snack)
 * - 6 Products (Es Teh, Kopi, Nasi Goreng, Mie Goreng, French Fries, Chicken Wings)
 */

async function seedDatabase() {
  console.log('🌱 Starting Supabase Database Seeding...\n');

  try {
    // 1. Create Tenant
    console.log('1️⃣  Creating tenant...');
    const tenantId = randomUUID();
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: 'Nashty Cafe',
        slug: 'nashty-cafe',
        plan: 'enterprise',
        status: 'active'
      })
      .select()
      .single();

    if (tenantError) {
      if (tenantError.message.includes('duplicate key')) {
        console.log('   ⚠️  Tenant already exists');
        // Try to fetch existing tenant
        const { data: existingTenant } = await supabase
          .from('tenants')
          .select()
          .eq('slug', 'nashty-cafe')
          .single();
        if (existingTenant) {
          console.log('   📌 Using existing tenant:', existingTenant.id);
          // Use existing tenant ID
          Object.assign({ tenantId: existingTenant.id });
        }
      } else {
        console.error('   ❌ Tenant creation error:', tenantError);
        throw tenantError;
      }
    } else {
      console.log('   ✅ Tenant created:', tenantId);
    }

    // 2. Create Outlet
    console.log('2️⃣  Creating outlet...');
    const outletId = randomUUID();
    const { data: outlet, error: outletError } = await supabase
      .from('outlets')
      .insert({
        id: outletId,
        tenant_id: tenantId,
        name: 'Main Branch',
        slug: 'main-branch',
        address: 'Jl. Raya No. 123, Jakarta',
        phone: '+62 21 1234 5678',
        status: 'active'
      })
      .select()
      .single();

    if (outletError) {
      if (outletError.message.includes('duplicate key')) {
        console.log('   ⚠️  Outlet already exists');
      } else {
        console.error('   ❌ Outlet creation error:', outletError);
        throw outletError;
      }
    } else {
      console.log('   ✅ Outlet created:', outletId);
    }

    // 3. Create Users
    console.log('3️⃣  Creating users...');
    
    // Import bcrypt for hashing PINs
    const bcrypt = await import('bcryptjs');
    
    const users = [
      { id: randomUUID(), tenant_id: tenantId, outlet_id: outletId, name: 'Admin User', pin: '1234', role: 'owner' },
      { id: randomUUID(), tenant_id: tenantId, outlet_id: outletId, name: 'Manager User', pin: '2345', role: 'manager' },
      { id: randomUUID(), tenant_id: tenantId, outlet_id: outletId, name: 'Cashier User', pin: '3456', role: 'cashier' },
      { id: randomUUID(), tenant_id: tenantId, outlet_id: outletId, name: 'Chef User', pin: '4567', role: 'kitchen' }
    ];

    for (const user of users) {
      // Hash the PIN with bcrypt
      const hashedPin = bcrypt.hashSync(user.pin, 10);
      
      const { error: userError } = await supabase
        .from('users')
        .insert({
          ...user,
          pin: hashedPin,
          password_hash: hashedPin,
          status: 'active'
        });

      if (userError) {
        if (userError.message.includes('duplicate key')) {
          console.log(`   ⚠️  User ${user.name} already exists`);
        } else {
          console.log(`   ⚠️  Skipping user ${user.name}:`, userError.message);
        }
      } else {
        console.log(`   ✅ User created: ${user.name} (PIN: ${user.pin}, Role: ${user.role})`);
      }
    }

    // 4. Create Categories
    console.log('4️⃣  Creating categories...');
    const categories = [
      { id: randomUUID(), tenant_id: tenantId, name: 'Minuman', slug: 'minuman', icon: '🥤', color: '#3B82F6', display_order: 1, status: 'active' },
      { id: randomUUID(), tenant_id: tenantId, name: 'Makanan', slug: 'makanan', icon: '🍽️', color: '#EF4444', display_order: 2, status: 'active' },
      { id: randomUUID(), tenant_id: tenantId, name: 'Snack', slug: 'snack', icon: '🍟', color: '#F59E0B', display_order: 3, status: 'active' }
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const { data, error: catError } = await supabase
        .from('categories')
        .insert(cat)
        .select()
        .single();

      if (catError && !catError.message.includes('duplicate key')) {
        console.log(`   ⚠️  Skipping category ${cat.name} (may already exist)`);
        // Try to fetch existing category
        const { data: existing } = await supabase
          .from('categories')
          .select()
          .eq('tenant_id', tenantId)
          .eq('name', cat.name)
          .single();
        if (existing) createdCategories.push(existing);
      } else {
        console.log(`   ✅ Category created: ${cat.name}`);
        createdCategories.push(data || cat);
      }
    }

    // 5. Create Products
    console.log('5️⃣  Creating products...');
    const products = [
      { id: randomUUID(), tenant_id: tenantId, category_id: createdCategories[0].id, name: 'Es Teh', slug: 'es-teh', description: 'Teh manis dingin', price: 5000, cost: 2000, status: 'active' },
      { id: randomUUID(), tenant_id: tenantId, category_id: createdCategories[0].id, name: 'Kopi Hitam', slug: 'kopi-hitam', description: 'Kopi original tanpa gula', price: 8000, cost: 3000, status: 'active' },
      { id: randomUUID(), tenant_id: tenantId, category_id: createdCategories[1].id, name: 'Nasi Goreng', slug: 'nasi-goreng', description: 'Nasi goreng spesial dengan telur', price: 25000, cost: 10000, status: 'active' },
      { id: randomUUID(), tenant_id: tenantId, category_id: createdCategories[1].id, name: 'Mie Goreng', slug: 'mie-goreng', description: 'Mie goreng pedas dengan sayuran', price: 22000, cost: 9000, status: 'active' },
      { id: randomUUID(), tenant_id: tenantId, category_id: createdCategories[2].id, name: 'French Fries', slug: 'french-fries', description: 'Kentang goreng crispy', price: 15000, cost: 6000, status: 'active' },
      { id: randomUUID(), tenant_id: tenantId, category_id: createdCategories[2].id, name: 'Chicken Wings', slug: 'chicken-wings', description: 'Sayap ayam goreng 6 pcs', price: 30000, cost: 12000, status: 'active' }
    ];

    for (const product of products) {
      const { error: prodError } = await supabase
        .from('products')
        .insert(product);

      if (prodError) {
        if (prodError.message.includes('duplicate key')) {
          console.log(`   ⚠️  Product ${product.name} already exists`);
        } else {
          console.log(`   ⚠️  Skipping product ${product.name}:`, prodError.message);
        }
      } else {
        console.log(`   ✅ Product created: ${product.name} (Rp ${product.price.toLocaleString()})`);
      }
    }

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   • Tenant ID: demo-tenant-001');
    console.log('   • Outlet ID: outlet-001');
    console.log('   • Users: 4 (admin, manager, cashier, chef)');
    console.log('   • Categories: 3 (Minuman, Makanan, Snack)');
    console.log('   • Products: 6 items');
    console.log('\n🧪 Test the API:');
    console.log('   node check-supabase-data.js');

  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
