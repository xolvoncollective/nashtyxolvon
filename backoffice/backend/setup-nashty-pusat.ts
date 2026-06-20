import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

dotenv.config();

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
 * Setup Nashty Pusat - Clean Database & Create Fresh Data
 * 
 * Requirements:
 * - Single outlet: Nashty Pusat
 * - 4 POS Users with PINs:
 *   - 0000: Superadmin
 *   - 1212: Manager
 *   - 9999: Owner
 *   - 8888: Kasir
 */
async function setupNashtyPusat() {
  console.log('🚀 Setting up Nashty Pusat...\n');

  try {
    // ===== STEP 1: DELETE ALL EXISTING DATA =====
    console.log('🗑️  Step 1: Cleaning existing data...');
    
    // Delete in reverse order to respect foreign keys
    const tables = [
      'order_item_modifiers',
      'order_items', 
      'orders',
      'shifts',
      'product_modifiers',
      'modifier_options',
      'modifier_groups',
      'products',
      'categories',
      'payment_methods',
      'users',
      'outlets',
      'tenants'
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error && !error.message.includes('violates foreign key')) {
        console.log(`   ⚠️  Warning deleting ${table}:`, error.message);
      } else {
        console.log(`   ✅ Cleared ${table}`);
      }
    }

    console.log('');

    // ===== STEP 2: CREATE TENANT =====
    console.log('🏢 Step 2: Creating tenant...');
    
    // Use consistent UUID (not random) for demo tenant
    const tenantId = '00000000-0000-0000-0000-000000000001';
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: 'Nashty Restaurant',
        slug: 'nashty-pusat',
        plan: 'enterprise',
        status: 'active'
      });

    if (tenantError && !tenantError.message.includes('duplicate')) {
      console.error('   ❌ Tenant creation error:', tenantError);
    } else {
      console.log('   ✅ Tenant created: Nashty Restaurant');
    }

    console.log('');

    // ===== STEP 3: CREATE OUTLET =====
    console.log('🏪 Step 3: Creating outlet...');
    
    // Use consistent UUID (not random) for demo outlet
    const outletId = '00000000-0000-0000-0000-000000000002';
    const { error: outletError } = await supabase
      .from('outlets')
      .insert({
        id: outletId,
        tenant_id: tenantId,
        name: 'Nashty Pusat',
        slug: 'nashty-pusat',
        address: 'Jl. Pusat No. 1, Jakarta',
        phone: '+62 21 1234 5678',
        status: 'active'
      });

    if (outletError && !outletError.message.includes('duplicate')) {
      console.error('   ❌ Outlet creation error:', outletError);
    } else {
      console.log('   ✅ Outlet created: Nashty Pusat');
    }

    console.log('');

    // ===== STEP 4: CREATE USERS WITH SPECIFIC PINS =====
    console.log('👥 Step 4: Creating users...');
    
    const users = [
      { 
        id: randomUUID(),
        name: 'Superadmin', 
        email: 'superadmin@nashty.id',
        pin: '0000', 
        role: 'owner',
        description: 'Full system access'
      },
      { 
        id: randomUUID(),
        name: 'Manager', 
        email: 'manager@nashty.id',
        pin: '1212', 
        role: 'manager',
        description: 'Store management'
      },
      { 
        id: randomUUID(),
        name: 'Owner', 
        email: 'owner@nashty.id',
        pin: '9999', 
        role: 'owner',
        description: 'Business owner'
      },
      { 
        id: randomUUID(),
        name: 'Kasir', 
        email: 'kasir@nashty.id',
        pin: '8888', 
        role: 'cashier',
        description: 'POS operator'
      }
    ];

    for (const user of users) {
      // Hash the PIN with bcrypt
      const hashedPin = bcrypt.hashSync(user.pin, 10);
      
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          tenant_id: tenantId,
          outlet_id: outletId,
          name: user.name,
          email: user.email,
          pin: hashedPin,
          password_hash: hashedPin,
          role: user.role,
          status: 'active'
        });

      if (userError && !userError.message.includes('duplicate')) {
        console.error(`   ❌ Failed to create ${user.name}:`, userError.message);
      } else {
        console.log(`   ✅ Created ${user.name} - PIN: ${user.pin} (${user.role}) - ${user.description}`);
      }
    }

    console.log('');

    // ===== STEP 5: CREATE CATEGORIES =====
    console.log('📂 Step 5: Creating categories...');
    
    const categories = [
      { id: randomUUID(), name: 'Makanan', slug: 'makanan', icon: '🍽️', color: '#EF4444' },
      { id: randomUUID(), name: 'Minuman', slug: 'minuman', icon: '🥤', color: '#3B82F6' },
      { id: randomUUID(), name: 'Snack', slug: 'snack', icon: '🍟', color: '#F59E0B' },
      { id: randomUUID(), name: 'Dessert', slug: 'dessert', icon: '🍰', color: '#A855F7' }
    ];
    
    const createdCategories: any[] = [];

    for (let idx = 0; idx < categories.length; idx++) {
      const cat = categories[idx];
      const { data, error: catError } = await supabase
        .from('categories')
        .insert({
          id: cat.id,
          tenant_id: tenantId,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          display_order: idx,
          status: 'active'
        })
        .select()
        .single();

      if (catError && !catError.message.includes('duplicate')) {
        console.log(`   ⚠️  Skipping ${cat.name}`);
      } else {
        console.log(`   ✅ Category: ${cat.name}`);
        createdCategories.push(data || cat);
      }
    }

    console.log('');

    // ===== STEP 6: CREATE SAMPLE PRODUCTS =====
    console.log('📦 Step 6: Creating sample products...');
    
    const products = [
      { name: 'Nasi Goreng', categoryIdx: 0, price: 25000, cost: 10000 },
      { name: 'Ayam Bakar', categoryIdx: 0, price: 35000, cost: 15000 },
      { name: 'Es Teh Manis', categoryIdx: 1, price: 8000, cost: 2000 },
      { name: 'Kopi Susu', categoryIdx: 1, price: 15000, cost: 5000 },
      { name: 'French Fries', categoryIdx: 2, price: 18000, cost: 7000 },
      { name: 'Es Krim Cokelat', categoryIdx: 3, price: 20000, cost: 8000 }
    ];

    for (const prod of products) {
      const slug = prod.name.toLowerCase().replace(/\s+/g, '-');
      const categoryId = createdCategories[prod.categoryIdx]?.id;
      
      if (!categoryId) {
        console.log(`   ⚠️  Skipping ${prod.name} - no category`);
        continue;
      }
      
      const { error: prodError } = await supabase
        .from('products')
        .insert({
          id: randomUUID(),
          tenant_id: tenantId,
          category_id: categoryId,
          name: prod.name,
          slug: slug,
          description: prod.name,
          price: prod.price,
          cost: prod.cost,
          production_time: 10,
          status: 'active'
        });

      if (prodError && !prodError.message.includes('duplicate')) {
        console.log(`   ⚠️  Skipping ${prod.name}`);
      } else {
        console.log(`   ✅ Product: ${prod.name} - Rp ${prod.price.toLocaleString()}`);
      }
    }

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SETUP COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('🏪 Outlet: Nashty Pusat');
    console.log('');
    console.log('🔑 POS User PINs:');
    console.log('   • 0000 - Superadmin (Owner)');
    console.log('   • 1212 - Manager');
    console.log('   • 9999 - Owner');
    console.log('   • 8888 - Kasir (Cashier)');
    console.log('');
    console.log('📊 Database Content:');
    console.log('   • 1 Tenant: Nashty Restaurant');
    console.log('   • 1 Outlet: Nashty Pusat');
    console.log('   • 4 Users (POS Staff)');
    console.log('   • 4 Categories');
    console.log('   • 6 Sample Products');
    console.log('');
    console.log('🧪 Test the system:');
    console.log('   1. Open: https://nashtyxolvon2.pages.dev');
    console.log('   2. Login: admin1/admin1');
    console.log('   3. Select outlet: Nashty Pusat');
    console.log('   4. Open POS and use PIN: 0000, 1212, 9999, or 8888');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupNashtyPusat();
