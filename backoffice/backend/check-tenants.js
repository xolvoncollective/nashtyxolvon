const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkTenants() {
  console.log('🔍 Checking Supabase Tenants...\n');

  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*');

    if (error) throw error;

    console.log(`Found ${data.length} tenant(s):\n`);
    data.forEach((tenant, i) => {
      console.log(`${i + 1}. ${tenant.name} (${tenant.slug})`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Plan: ${tenant.plan}`);
      console.log(`   Status: ${tenant.status}`);
      console.log('');
    });

    if (data.length > 0) {
      const tenantId = data[0].id;
      console.log(`📊 Checking data for tenant: ${tenantId}\n`);

      // Check categories
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenantId);
      console.log(`   Categories: ${categories?.length || 0}`);

      // Check products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId);
      console.log(`   Products: ${products?.length || 0}`);

      // Check users
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId);
      console.log(`   Users: ${users?.length || 0}`);
      if (users && users.length > 0) {
        console.log('\n   User Details:');
        users.forEach(u => {
          console.log(`   - ${u.name} (${u.role}), PIN: ${u.pin}`);
        });
      }

      // Check outlets
      const { data: outlets } = await supabase
        .from('outlets')
        .select('*')
        .eq('tenant_id', tenantId);
      console.log(`\n   Outlets: ${outlets?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTenants();
