/**
 * NASHTY OS - Comprehensive API Test Script v2
 * Tests ALL Supabase Edge Functions and Direct DB Queries
 * FIXED: Uses SUPABASE_ANON_KEY for Authorization (Supabase gateway requirement)
 */

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM0MDUzNSwiZXhwIjoyMDk2OTE2NTM1fQ.blh08pJxW2CNkFjgVtWq_yTuEmTemFZaZuCKl-DM0M4';
const EDGE_URL = `${SUPABASE_URL}/functions/v1`;

const results = [];

function log(testName, status, details) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  results.push({ testName, status, details });
  console.log(`${icon} [${status}] ${testName}: ${details}`);
}

// Always use anon key for Authorization (Supabase gateway requires Supabase-signed JWT)
async function edgeFetch(funcName, body = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  };
  const res = await fetch(`${EDGE_URL}/${funcName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function edgeGet(funcName, queryString = '') {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  };
  const res = await fetch(`${EDGE_URL}/${funcName}${queryString}`, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function dbFetch(table, query = '') {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function testEdgeFunctions() {
  console.log('\n═══════════════════════════════════════════');
  console.log(' TESTING EDGE FUNCTIONS (anon key auth)');
  console.log('═══════════════════════════════════════════\n');

  // 1. AUTH-LOGIN: main-login
  try {
    const r = await edgeFetch('auth-login', { action: 'main-login', username: 'superadmin@nashty', password: 'nashty1111' });
    if (r.ok && r.data.success && r.data.token) {
      log('auth-login (main-login)', 'PASS', `Token: ${r.data.token.substring(0, 30)}..., user: ${r.data.user?.name}`);
    } else {
      log('auth-login (main-login)', 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data).substring(0, 150)}`);
    }
  } catch (e) { log('auth-login (main-login)', 'FAIL', e.message); }

  // 2. AUTH-LOGIN: invalid
  try {
    const r = await edgeFetch('auth-login', { action: 'main-login', username: 'fake', password: 'wrong' });
    log('auth-login (invalid)', r.status === 401 ? 'PASS' : 'WARN', `Status: ${r.status}`);
  } catch (e) { log('auth-login (invalid)', 'FAIL', e.message); }

  // 3. AUTH-LOGIN: pin-login
  try {
    const r = await edgeFetch('auth-login', { action: 'pin-login', pin: '1234' });
    if (r.ok && r.data.success) {
      log('auth-login (pin)', 'PASS', `User: ${r.data.user?.name}`);
    } else {
      log('auth-login (pin)', r.status === 401 ? 'WARN' : 'FAIL', `Status: ${r.status} - No user with PIN 1234`);
    }
  } catch (e) { log('auth-login (pin)', 'FAIL', e.message); }

  // 4. DASHBOARD-API: kpi
  try {
    const r = await edgeFetch('dashboard-api', { action: 'kpi', tenantId: '00000000-0000-0000-0000-000000000001' });
    log('dashboard-api (kpi)', r.ok ? 'PASS' : 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data).substring(0, 150)}`);
  } catch (e) { log('dashboard-api (kpi)', 'FAIL', e.message); }

  // 5. DASHBOARD-API: recent-orders
  try {
    const r = await edgeFetch('dashboard-api', { action: 'recent-orders', tenantId: '00000000-0000-0000-0000-000000000001', limit: 5 });
    log('dashboard-api (recent-orders)', r.ok ? 'PASS' : 'FAIL', `Status: ${r.status}`);
  } catch (e) { log('dashboard-api (recent-orders)', 'FAIL', e.message); }

  // 6. DASHBOARD-API: weekly-chart
  try {
    const r = await edgeFetch('dashboard-api', { action: 'weekly-chart', tenantId: '00000000-0000-0000-0000-000000000001' });
    log('dashboard-api (weekly-chart)', r.ok ? 'PASS' : 'FAIL', `Status: ${r.status}`);
  } catch (e) { log('dashboard-api (weekly-chart)', 'FAIL', e.message); }

  // 7. ORDERS-API: create
  try {
    const r = await edgeFetch('orders-api', {
      action: 'create',
      tenantId: '00000000-0000-0000-0000-000000000001',
      outletId: '00000000-0000-0000-0000-000000000002',
      items: [{ productId: 'test', name: 'Test Item', qty: 1, price: 10000 }],
      subtotal: 10000, total: 10000, paymentMethod: 'cash'
    });
    log('orders-api (create)', r.ok ? 'PASS' : 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data).substring(0, 150)}`);
  } catch (e) { log('orders-api (create)', 'FAIL', e.message); }

  // 8. ORDERS-API: get-orders
  try {
    const r = await edgeFetch('orders-api', { action: 'get-orders', tenantId: '00000000-0000-0000-0000-000000000001' });
    log('orders-api (get-orders)', r.ok ? 'PASS' : 'FAIL', `Status: ${r.status}, orders: ${r.data?.orders?.length ?? 'N/A'}`);
  } catch (e) { log('orders-api (get-orders)', 'FAIL', e.message); }

  // 9. REPORTS-API: sales
  try {
    const r = await edgeFetch('reports-api', { action: 'sales', tenantId: '00000000-0000-0000-0000-000000000001' });
    log('reports-api (sales)', r.ok ? 'PASS' : 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data).substring(0, 150)}`);
  } catch (e) { log('reports-api (sales)', 'FAIL', e.message); }

  // 10. REPORTS-API: top-products
  try {
    const r = await edgeFetch('reports-api', { action: 'top-products', tenantId: '00000000-0000-0000-0000-000000000001' });
    log('reports-api (top-products)', r.ok ? 'PASS' : 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data).substring(0, 150)}`);
  } catch (e) { log('reports-api (top-products)', 'FAIL', e.message); }

  // 11. FAVORITES-API (GET)
  try {
    const r = await edgeGet('favorites-api', '?action=get&userId=00000000-0000-0000-0000-000000000001');
    log('favorites-api (GET)', r.status < 500 ? 'PASS' : 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data).substring(0, 100)}`);
  } catch (e) { log('favorites-api (GET)', 'FAIL', e.message); }

  // 12. SETTINGS-API (GET)
  try {
    const r = await edgeGet('settings-api', '?action=get&outletId=00000000-0000-0000-0000-000000000002');
    log('settings-api (GET)', r.status < 500 ? 'PASS' : 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data).substring(0, 100)}`);
  } catch (e) { log('settings-api (GET)', 'FAIL', e.message); }

  // 13. ANALYTICS-API (GET)
  try {
    const r = await edgeGet('analytics-api', '?outletId=00000000-0000-0000-0000-000000000002&days=7&limit=10');
    log('analytics-api (GET)', r.status < 500 ? 'PASS' : 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data).substring(0, 100)}`);
  } catch (e) { log('analytics-api (GET)', 'FAIL', e.message); }
}

async function testDirectDB() {
  console.log('\n═══════════════════════════════════════════');
  console.log(' TESTING DIRECT DB (anon key - RLS check)');
  console.log('═══════════════════════════════════════════\n');

  const tables = ['users', 'products', 'categories', 'outlets', 'shifts', 'orders', 'order_items', 
                  'modifier_groups', 'modifier_options', 'product_modifiers', 'outlet_settings',
                  'activity_logs', 'favorites'];

  for (const table of tables) {
    try {
      const r = await dbFetch(table, '?select=*&limit=3');
      if (r.ok) {
        const count = Array.isArray(r.data) ? r.data.length : 'N/A';
        log(`DB:${table}`, 'PASS', `Rows: ${count}`);
      } else {
        log(`DB:${table}`, 'FAIL', `Status: ${r.status} - ${r.data?.message || JSON.stringify(r.data).substring(0, 100)}`);
      }
    } catch (e) { log(`DB:${table}`, 'FAIL', e.message); }
  }
}

async function testMenuQuery() {
  console.log('\n═══════════════════════════════════════════');
  console.log(' TESTING MENU QUERY (POS Critical Path)');
  console.log('═══════════════════════════════════════════\n');

  // Without is_active filter (fixed)
  const query = '?select=*,category:categories(id,name),modifier_groups:product_modifiers(modifier_group:modifier_groups(id,name,type,required,max_select,options:modifier_options(*)))&limit=5';
  
  try {
    const r = await dbFetch('products', query);
    if (r.ok) {
      const count = Array.isArray(r.data) ? r.data.length : 0;
      log('Menu Query (fixed, no is_active)', 'PASS', `Products: ${count}`);
      if (count > 0) {
        console.log('  Sample product:', JSON.stringify(r.data[0], null, 2).substring(0, 300));
      }
    } else {
      log('Menu Query (fixed)', 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data).substring(0, 200)}`);
    }
  } catch (e) { log('Menu Query (fixed)', 'FAIL', e.message); }
}

async function testShiftFlow() {
  console.log('\n═══════════════════════════════════════════');
  console.log(' TESTING SHIFT FLOW (Start -> End)');
  console.log('═══════════════════════════════════════════\n');

  // Get first user
  try {
    const userRes = await dbFetch('users', '?select=id,name,outlet_id&limit=1');
    if (!userRes.ok || !Array.isArray(userRes.data) || userRes.data.length === 0) {
      log('Shift Flow (get user)', 'FAIL', 'No users found');
      return;
    }
    const user = userRes.data[0];
    log('Shift Flow (get user)', 'PASS', `User: ${user.name}, outlet: ${user.outlet_id}`);

    // Start shift via direct DB insert
    const shiftBody = JSON.stringify({ outlet_id: user.outlet_id, user_id: user.id, start_cash: 500000, status: 'open' });
    const shiftRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: shiftBody
    });
    const shiftData = await shiftRes.json().catch(() => ({}));
    if (shiftRes.ok && Array.isArray(shiftData) && shiftData.length > 0) {
      log('Shift Flow (start)', 'PASS', `Shift ID: ${shiftData[0].id}`);
      
      // End shift
      const endRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts?id=eq.${shiftData[0].id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ status: 'closed', end_cash: 750000, end_time: new Date().toISOString() })
      });
      const endData = await endRes.json().catch(() => ({}));
      log('Shift Flow (end)', endRes.ok ? 'PASS' : 'FAIL', `Status: ${endRes.status}`);
    } else {
      log('Shift Flow (start)', 'FAIL', `Status: ${shiftRes.status}, ${JSON.stringify(shiftData).substring(0, 150)}`);
    }
  } catch (e) { log('Shift Flow', 'FAIL', e.message); }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  NASHTY OS - Full API Test Suite v2           ║');
  console.log('║  Using SUPABASE_ANON_KEY for gateway auth     ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  await testEdgeFunctions();
  await testDirectDB();
  await testMenuQuery();
  await testShiftFlow();

  // Summary
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║            TEST SUMMARY                       ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;

  console.log(`✅ PASS: ${pass}`);
  console.log(`❌ FAIL: ${fail}`);
  console.log(`⚠️  WARN: ${warn}`);
  console.log(`📊 TOTAL: ${results.length}\n`);

  if (fail > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ ${r.testName}: ${r.details}`);
    });
  }
  if (warn > 0) {
    console.log('\nWARNINGS:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  ⚠️  ${r.testName}: ${r.details}`);
    });
  }
}

main().catch(e => console.error('Fatal:', e));
