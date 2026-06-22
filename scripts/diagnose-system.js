/**
 * SYSTEM DIAGNOSIS TOOL
 * Checks all API endpoints, Edge Functions, and identifies issues
 */

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg';

console.log('='.repeat(80));
console.log('NASHTY OS SYSTEM DIAGNOSIS');
console.log('='.repeat(80));

async function testEdgeFunction(functionName, payload) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  console.log(`\nTesting: ${functionName}`);
  console.log(`URL: ${url}`);
  console.log(`Payload:`, JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runDiagnosis() {
  console.log('\n' + '-'.repeat(80));
  console.log('1. TESTING AUTH-LOGIN EDGE FUNCTION');
  console.log('-'.repeat(80));
  
  // Test 1: Backoffice login without outlet
  await testEdgeFunction('auth-login', {
    action: 'main-login',
    username: 'superadmin',
    password: 'nashty@2024',
    outletId: null
  });
  
  console.log('\n' + '-'.repeat(80));
  console.log('2. TESTING AUTH-LOGIN WITH OUTLET SELECTION');
  console.log('-'.repeat(80));
  
  // Test 2: Backoffice login with outlet
  await testEdgeFunction('auth-login', {
    action: 'main-login',
    username: 'superadmin',
    password: 'nashty@2024',
    outletId: '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e' // Galaxy Mall
  });
  
  console.log('\n' + '-'.repeat(80));
  console.log('3. TESTING PIN LOGIN');
  console.log('-'.repeat(80));
  
  // Test 3: POS PIN login
  await testEdgeFunction('auth-login', {
    action: 'pin-login',
    pin: '1111',
    outletId: '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e' // Galaxy Mall
  });
  
  console.log('\n' + '-'.repeat(80));
  console.log('4. TESTING ORDERS-API EDGE FUNCTION');
  console.log('-'.repeat(80));
  
  // Test 4: Get orders (should fail without auth token)
  await testEdgeFunction('orders-api', {
    action: 'get-orders',
    outletId: '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e',
    limit: 10
  });
  
  console.log('\n' + '-'.repeat(80));
  console.log('5. TESTING ANALYTICS-API EDGE FUNCTION');
  console.log('-'.repeat(80));
  
  // Test 5: Get analytics
  await testEdgeFunction('analytics-api', {
    action: 'get-analytics',
    outletId: '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSIS COMPLETE');
  console.log('='.repeat(80));
  console.log('\nNEXT STEPS:');
  console.log('1. Check if Edge Functions are deployed');
  console.log('2. Check database schema matches Edge Function queries');
  console.log('3. Verify environment variables in Supabase');
  console.log('4. Check CORS configuration');
  console.log('5. Review seed data for correct user credentials');
}

runDiagnosis().catch(console.error);
