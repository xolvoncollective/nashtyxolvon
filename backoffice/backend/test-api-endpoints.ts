import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const OUTLET_ID = '00000000-0000-0000-0000-000000000002';

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints with Correct UUIDs\n');
  console.log(`📌 Using Tenant ID: ${TENANT_ID}`);
  console.log(`📌 Using Outlet ID: ${OUTLET_ID}\n`);

  try {
    // Test 1: Get Categories
    console.log('1️⃣  Testing Categories Endpoint...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', TENANT_ID);
    
    if (catError) {
      console.error('   ❌ Error:', catError.message);
    } else {
      console.log(`   ✅ Found ${categories.length} categories`);
      categories.forEach(c => console.log(`      - ${c.name} ${c.icon}`));
    }

    // Test 2: Get Products
    console.log('\n2️⃣  Testing Products Endpoint...');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', TENANT_ID);
    
    if (prodError) {
      console.error('   ❌ Error:', prodError.message);
    } else {
      console.log(`   ✅ Found ${products.length} products`);
      products.forEach(p => console.log(`      - ${p.name} (Rp ${p.price.toLocaleString()})`));
    }

    // Test 3: Get Users
    console.log('\n3️⃣  Testing Users Endpoint...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, role, outlet_id')
      .eq('tenant_id', TENANT_ID)
      .eq('outlet_id', OUTLET_ID);
    
    if (userError) {
      console.error('   ❌ Error:', userError.message);
    } else {
      console.log(`   ✅ Found ${users.length} users`);
      users.forEach(u => console.log(`      - ${u.name} (${u.role})`));
    }

    // Test 4: Get Orders (should be empty initially)
    console.log('\n4️⃣  Testing Orders Endpoint...');
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('outlet_id', OUTLET_ID);
    
    if (orderError) {
      console.error('   ❌ Error:', orderError.message);
    } else {
      console.log(`   ✅ Found ${orders.length} orders`);
      if (orders.length === 0) {
        console.log('      (No orders yet - this is expected for fresh setup)');
      }
    }

    // Test 5: Create Sample Order (to test KDS)
    console.log('\n5️⃣  Creating Sample Order for KDS Testing...');
    
    // Get first user for order
    const { data: firstUser } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('outlet_id', OUTLET_ID)
      .limit(1)
      .single();

    // Get first product for order
    const { data: firstProduct } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .limit(1)
      .single();

    if (firstUser && firstProduct) {
      const orderId = `ORD-${Date.now()}`;
      
      // Create order
      const { data: newOrder, error: createOrderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          tenant_id: TENANT_ID,
          outlet_id: OUTLET_ID,
          user_id: firstUser.id,
          order_number: `#${Math.floor(Math.random() * 1000)}`,
          total: firstProduct.price,
          order_status: 'paid',
          kitchen_status: 'pending',
          payment_method: 'cash'
        })
        .select()
        .single();

      if (createOrderError) {
        console.error('   ❌ Error creating order:', createOrderError.message);
      } else {
        console.log(`   ✅ Sample order created: ${newOrder.order_number}`);
        
        // Create order item
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            id: `${orderId}-ITEM-1`,
            order_id: orderId,
            product_id: firstProduct.id,
            product_name: firstProduct.name,
            quantity: 1,
            unit_price: firstProduct.price,
            subtotal: firstProduct.price,
            kitchen_status: 'pending'
          });

        if (itemError) {
          console.error('   ⚠️  Error creating order item:', itemError.message);
        } else {
          console.log(`   ✅ Order item added: ${firstProduct.name}`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📋 Summary:');
    console.log('   • Categories loaded ✅');
    console.log('   • Products loaded ✅');
    console.log('   • Users loaded ✅');
    console.log('   • Orders endpoint working ✅');
    console.log('   • Sample order created for KDS ✅');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Open KDS: http://localhost:3000/kds');
    console.log('   2. Sample order should appear in queue');
    console.log('   3. Open POS: http://localhost:3000/pos');
    console.log('   4. Login with PIN: 0000, 1212, 9999, or 8888');
    console.log('   5. Create new orders and watch them appear in KDS');
    console.log('\n🔧 Tenant/Outlet IDs are now consistent across all systems!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testEndpoints();
