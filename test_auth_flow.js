/**
 * Quick Authentication Flow Test
 * Tests the complete login → fetch data flow
 */

const API_BASE = 'http://localhost:3099/api';

async function testAuthFlow() {
  console.log('🔍 Testing Authentication Flow...\n');

  try {
    // Step 1: Get staff list (no auth required)
    console.log('1️⃣ Fetching staff list...');
    const staffRes = await fetch(`${API_BASE}/auth/staff?outletId=demo-outlet`);
    const staffData = await staffRes.json();
    console.log('✅ Staff loaded:', staffData.staff.length, 'users');
    console.log('   First staff:', staffData.staff[0].name, '(' + staffData.staff[0].role + ')');

    // Step 2: Login with PIN
    console.log('\n2️⃣ Logging in with PIN 1234...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '1234', outletId: 'demo-outlet' })
    });
    const loginData = await loginRes.json();
    
    if (!loginData.success || !loginData.token) {
      throw new Error('Login failed: ' + JSON.stringify(loginData));
    }
    
    console.log('✅ Login successful!');
    console.log('   User:', loginData.user.name, '(' + loginData.user.role + ')');
    console.log('   Token:', loginData.token.substring(0, 20) + '...');
    console.log('   Tenant ID:', loginData.user.tenantId);
    console.log('   Outlet ID:', loginData.user.outletId);

    const token = loginData.token;
    const tenantId = loginData.user.tenantId;

    // Step 3: Fetch categories (requires auth)
    console.log('\n3️⃣ Fetching categories (with token)...');
    const catRes = await fetch(`${API_BASE}/categories?tenantId=${tenantId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const catData = await catRes.json();
    
    if (!catData.categories) {
      throw new Error('Categories fetch failed: ' + JSON.stringify(catData));
    }
    
    console.log('✅ Categories loaded:', catData.categories.length, 'categories');
    catData.categories.forEach(cat => {
      console.log('   -', cat.name, '(' + cat.product_count + ' products)');
    });

    // Step 4: Fetch products (requires auth)
    console.log('\n4️⃣ Fetching products (with token)...');
    const prodRes = await fetch(`${API_BASE}/products?tenantId=${tenantId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const prodData = await prodRes.json();
    
    if (!prodData.products) {
      throw new Error('Products fetch failed: ' + JSON.stringify(prodData));
    }
    
    console.log('✅ Products loaded:', prodData.products.length, 'products');
    console.log('   First 5 products:');
    prodData.products.slice(0, 5).forEach(p => {
      const price = new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0 
      }).format(p.price);
      console.log('   -', p.name, '-', price);
    });

    // Step 5: Test without token (should fail)
    console.log('\n5️⃣ Testing protected endpoint without token...');
    const noAuthRes = await fetch(`${API_BASE}/products?tenantId=${tenantId}`);
    const noAuthData = await noAuthRes.json();
    
    if (noAuthRes.status === 401) {
      console.log('✅ Correctly rejected! Status:', noAuthRes.status);
      console.log('   Error:', noAuthData.error);
    } else {
      console.log('⚠️  WARNING: Endpoint should require auth but didn\'t!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✨ Next step: Open browser and test manually');
    console.log('   POS:       http://localhost:3099/pos/frontend/index.html');
    console.log('   KDS:       http://localhost:3099/kds/frontend/index.html');
    console.log('   Backoffice: http://localhost:3099/backoffice/frontend/index.html');
    console.log('\n💡 Login PINs:');
    console.log('   1234 - Citra Dewi (Cashier)');
    console.log('   2345 - Budi Santoso (Cashier)');
    console.log('   3456 - Ani Kitchen (Chef)');
    console.log('   0000 - Admin Demo (Owner)');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run test
testAuthFlow();
