import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('\n🧪 Testing Supabase Connection...\n');
console.log('Configuration:');
console.log('  URL:', supabaseUrl);
console.log('  Has Service Key:', !!supabaseKey);
console.log('');

async function testSupabaseClient() {
  console.log('1️⃣ Testing Supabase Client (JS SDK)...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test query
    const { data, error, count } = await supabase
      .from('tenants')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.log('   ❌ Client test failed:', error.message);
      return false;
    }
    
    console.log('   ✅ Supabase client connected');
    console.log(`   ✅ Found ${count} tenants`);
    if (data && data.length > 0) {
      console.log('   ✅ Sample tenant:', data[0].name);
    }
    return true;
  } catch (error: any) {
    console.log('   ❌ Error:', error.message);
    return false;
  }
}

async function testDirectConnection() {
  console.log('\n2️⃣ Testing Direct PostgreSQL Connection...');
  
  const client = new Client({
    host: process.env.SUPABASE_DB_HOST,
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
    database: process.env.SUPABASE_DB_NAME,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('   ✅ PostgreSQL client connected');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('   ✅ PostgreSQL version:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    // Count tables
    const tables = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`   ✅ Found ${tables.rows[0].count} tables in public schema`);
    
    await client.end();
    return true;
  } catch (error: any) {
    console.log('   ❌ Error:', error.message);
    if (client) await client.end();
    return false;
  }
}

async function testTables() {
  console.log('\n3️⃣ Testing Database Tables...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const tables = [
    'tenants',
    'outlets', 
    'users',
    'categories',
    'products',
    'orders',
    'shifts',
    'nashtycosts'
  ];
  
  let allPass = true;
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ Table '${table}': ${error.message}`);
        allPass = false;
      } else {
        console.log(`   ✅ Table '${table}': ${count} rows`);
      }
    } catch (error: any) {
      console.log(`   ❌ Table '${table}': ${error.message}`);
      allPass = false;
    }
  }
  
  return allPass;
}

async function runTests() {
  let allPass = true;
  
  allPass = await testSupabaseClient() && allPass;
  allPass = await testDirectConnection() && allPass;
  allPass = await testTables() && allPass;
  
  console.log('\n' + '='.repeat(50));
  if (allPass) {
    console.log('✅ All tests passed! Supabase is ready to use.');
  } else {
    console.log('❌ Some tests failed. Check configuration above.');
  }
  console.log('='.repeat(50) + '\n');
  
  process.exit(allPass ? 0 : 1);
}

runTests();
