/**
 * Quick UAT Test - Verifies Critical Fixes
 * Tests: PIN auth + Service Worker + Business flow
 */

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg';
const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

console.log('\n🧪 NASHTY OS - Quick UAT Test\n');

async function testPINAuthentication() {
  console.log('━━━ Test 1: PIN Authentication (CRITICAL FIX) ━━━');
  
  const testCases = [
    { name: 'Superadmin', pin: '0000', expected: true },
    { name: 'Manager', pin: '1212', expected: true },
    { name: 'Kasir', pin: '8888', expected: true },
    { name: 'Owner', pin: '9999', expected: true },
    { name: 'Kasir', pin: '1234', expected: false } // Wrong PIN
  ];

  for (const test of testCases) {
    try {
      const response = await fetch(`${EDGE_FUNCTIONS_URL}/auth-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          type: 'pin',
          name: test.name,
          pin: test.pin
        })
      });

      const data = await response.json();
      
      if (test.expected) {
        if (response.ok && data.token) {
          console.log(`✓ ${test.name} with PIN ${test.pin}: SUCCESS`);
        } else {
          console.log(`✗ ${test.name} with PIN ${test.pin}: FAILED (should work)`);
        }
      } else {
        if (!response.ok) {
          console.log(`✓ ${test.name} with wrong PIN ${test.pin}: Correctly rejected`);
        } else {
          console.log(`✗ ${test.name} with wrong PIN ${test.pin}: SECURITY ISSUE (should fail)`);
        }
      }
    } catch (error) {
      console.log(`✗ ${test.name}: Network error - ${error.message}`);
    }
  }
}

async function testServiceWorkerMIME() {
  console.log('\n━━━ Test 2: Service Worker MIME Type (CRITICAL FIX) ━━━');
  
  const swURLs = [
    'https://nashtyxolvon2.pages.dev/sw.js',
    'https://nashtyxolvon2.pages.dev/pos/frontend/sw.js'
  ];

  for (const url of swURLs) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('javascript')) {
        console.log(`✓ ${url}: Correct MIME type (${contentType})`);
      } else {
        console.log(`✗ ${url}: Wrong MIME type (${contentType})`);
      }
    } catch (error) {
      console.log(`✗ ${url}: Cannot fetch - ${error.message}`);
    }
  }
}

async function testDatabaseAccess() {
  console.log('\n━━━ Test 3: Database Access ━━━');
  
  const tables = ['users', 'products', 'categories', 'orders'];
  
  for (const table of tables) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?limit=1`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (response.ok) {
        console.log(`✓ Table '${table}': Accessible`);
      } else {
        console.log(`✗ Table '${table}': HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`✗ Table '${table}': ${error.message}`);
    }
  }
}

async function runTests() {
  console.time('Total test time');
  
  await testPINAuthentication();
  await testServiceWorkerMIME();
  await testDatabaseAccess();
  
  console.timeEnd('Total test time');
  console.log('\n✅ Quick UAT test complete!\n');
}

runTests().catch(console.error);
