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

async function verifyData() {
  console.log('🔍 Verifying Supabase Data...\n');

  try {
    // Check Tenants
    console.log('1️⃣  Checking Tenants...');
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*');
    
    if (tenantError) {
      console.error('   ❌ Error:', tenantError.message);
    } else {
      console.log(`   ✅ Found ${tenants.length} tenant(s)`);
      tenants.forEach(t => console.log(`      - ${t.name} (${t.id})`));
    }

    // Check Outlets
    console.log('\n2️⃣  Checking Outlets...');
    const { data: outlets, error: outletError } = await supabase
      .from('outlets')
      .select('*');
    
    if (outletError) {
      console.error('   ❌ Error:', outletError.message);
    } else {
      console.log(`   ✅ Found ${outlets.length} outlet(s)`);
      outlets.forEach(o => console.log(`      - ${o.name} (${o.id})`));
    }

    // Check Users
    console.log('\n3️⃣  Checking Users...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, role, status');
    
    if (userError) {
      console.error('   ❌ Error:', userError.message);
    } else {
      console.log(`   ✅ Found ${users.length} user(s)`);
      users.forEach(u => console.log(`      - ${u.name} (${u.role})`));
    }

    // Check Categories
    console.log('\n4️⃣  Checking Categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    if (catError) {
      console.error('   ❌ Error:', catError.message);
    } else {
      console.log(`   ✅ Found ${categories.length} category(ies)`);
      categories.forEach(c => console.log(`      - ${c.name} ${c.icon}`));
    }

    // Check Products
    console.log('\n5️⃣  Checking Products...');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*');
    
    if (prodError) {
      console.error('   ❌ Error:', prodError.message);
    } else {
      console.log(`   ✅ Found ${products.length} product(s)`);
      products.forEach(p => console.log(`      - ${p.name} (Rp ${p.price.toLocaleString()})`));
    }

    console.log('\n✅ Verification completed!\n');

  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message);
    console.error(error);
  }
}

verifyData();
