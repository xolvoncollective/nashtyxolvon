/**
 * Local API Testing Script
 * Tests all major API endpoints in development mode
 * 
 * USAGE: node test-api-local.js
 * 
 * REQUIREMENTS:
 * - Server must be running on http://localhost:3099
 * - NODE_ENV=development (auth bypass enabled)
 */

const API_BASE = 'http://localhost:3099/api';

// Helper function for colored console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test counter
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

async function test(name, testFn) {
  testsRun++;
  try {
    await testFn();
    testsPassed++;
    log(`✅ ${name}`, 'green');
  } catch (error) {
    testsFailed++;
    log(`❌ ${name}`, 'red');
    log(`   Error: ${error.message}`, 'red');
  }
}

async function runTests() {
  log('\n╔═══════════════════════════════════════════════════╗', 'cyan');
  log('║  NASHTY OS - Local API Testing Suite             ║', 'cyan');
  log('╚═══════════════════════════════════════════════════╝\n', 'cyan');
  
  // Test 1: Health Check
  await test('Health Check', async () => {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (data.status !== 'healthy') {
      throw new Error(`Expected status 'healthy', got '${data.status}'`);
    }
    
    if (data.database !== 'connected') {
      throw new Error(`Database not connected: ${data.database}`);
    }
    
    log(`   Response time: ${data.responseTime}`, 'cyan');
  });
  
  // Test 2: Get Menu (No Auth Required in Dev Mode)
  await test('Get Menu for Outlet', async () => {
    const response = await fetch(`${API_BASE}/menu/outlet/demo-outlet`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }
    
    if (!data.data || !data.data.items) {
      throw new Error('Menu data missing');
    }
    
    log(`   Found ${data.data.items.length} items`, 'cyan');
    log(`   Found ${data.data.categories.length} categories`, 'cyan');
  });
  
  // Test 3: Get Products
  await test('Get Products', async () => {
    const response = await fetch(`${API_BASE}/products?tenantId=demo-tenant`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }
    
    if (!data.data) {
      throw new Error('Products data missing');
    }
    
    log(`   Found ${data.data.length} products`, 'cyan');
  });
  
  // Test 4: Get Categories
  await test('Get Categories', async () => {
    const response = await fetch(`${API_BASE}/categories?tenantId=demo-tenant`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }
    
    if (!data.data) {
      throw new Error('Categories data missing');
    }
    
    log(`   Found ${data.data.length} categories`, 'cyan');
  });
  
  // Test 5: Get KDS Order Queue
  await test('Get KDS Order Queue', async () => {
    const response = await fetch(`${API_BASE}/orders/kitchen/queue?tenantId=demo-tenant`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }
    
    if (!data.orders) {
      throw new Error('Orders data missing');
    }
    
    log(`   Found ${data.orders.length} orders in queue`, 'cyan');
  });
  
  // Test 6: Create Menu Item (Testing POST with validation)
  let createdItemId = null;
  await test('Create Menu Item', async () => {
    // First, get a valid category
    const categoriesResponse = await fetch(`${API_BASE}/categories?tenantId=demo-tenant`);
    const categoriesData = await categoriesResponse.json();
    
    if (!categoriesData.data || categoriesData.data.length === 0) {
      throw new Error('No categories found for testing');
    }
    
    const categoryId = categoriesData.data[0].id;
    
    const newItem = {
      tenantId: 'demo-tenant',
      outletId: 'demo-outlet',
      categoryId: categoryId,
      name: 'API Test Item ' + Date.now(),
      price: 15000,
      description: 'Created by test script',
      status: 'active'
    };
    
    const response = await fetch(`${API_BASE}/menu/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newItem)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create item');
    }
    
    if (!data.item || !data.item_id) {
      throw new Error('Created item data missing');
    }
    
    createdItemId = data.item_id;
    log(`   Created item ID: ${createdItemId}`, 'cyan');
  });
  
  // Test 7: Update Menu Item
  await test('Update Menu Item', async () => {
    if (!createdItemId) {
      throw new Error('No item ID from create test');
    }
    
    const updates = {
      name: 'Updated API Test Item',
      price: 20000
    };
    
    const response = await fetch(`${API_BASE}/menu/items/${createdItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update item');
    }
    
    if (data.item.name !== updates.name) {
      throw new Error(`Name not updated: expected "${updates.name}", got "${data.item.name}"`);
    }
    
    log(`   Updated name: ${data.item.name}`, 'cyan');
    log(`   Updated price: Rp ${data.item.price.toLocaleString()}`, 'cyan');
  });
  
  // Test 8: Mark Item as Sold Out
  await test('Mark Item as Sold Out', async () => {
    if (!createdItemId) {
      throw new Error('No item ID from create test');
    }
    
    const response = await fetch(`${API_BASE}/menu/items/${createdItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'soldout' })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update status');
    }
    
    if (data.item.status !== 'soldout') {
      throw new Error(`Status not updated: expected "soldout", got "${data.item.status}"`);
    }
    
    log(`   Status: ${data.item.status}`, 'cyan');
  });
  
  // Test 9: Reactivate Item
  await test('Reactivate Item', async () => {
    if (!createdItemId) {
      throw new Error('No item ID from create test');
    }
    
    const response = await fetch(`${API_BASE}/menu/items/${createdItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'active' })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to reactivate');
    }
    
    if (data.item.status !== 'active') {
      throw new Error(`Status not updated: expected "active", got "${data.item.status}"`);
    }
    
    log(`   Status: ${data.item.status}`, 'cyan');
  });
  
  // Test 10: Verify Cache Invalidation
  await test('Verify Cache Invalidation', async () => {
    if (!createdItemId) {
      throw new Error('No item ID from create test');
    }
    
    // Fetch menu again to verify item appears
    const response = await fetch(`${API_BASE}/menu/outlet/demo-outlet`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch menu');
    }
    
    const foundItem = data.data.items.find(item => item.id === createdItemId);
    
    if (!foundItem) {
      throw new Error('Created item not found in menu (cache not invalidated?)');
    }
    
    log(`   Item found in menu: "${foundItem.name}"`, 'cyan');
  });
  
  // Summary
  log('\n╔═══════════════════════════════════════════════════╗', 'cyan');
  log('║  Test Summary                                     ║', 'cyan');
  log('╚═══════════════════════════════════════════════════╝', 'cyan');
  log(`Total Tests: ${testsRun}`, 'cyan');
  log(`Passed: ${testsPassed}`, 'green');
  if (testsFailed > 0) {
    log(`Failed: ${testsFailed}`, 'red');
  }
  
  log('\n═══════════════════════════════════════════════════\n');
  
  if (testsFailed === 0) {
    log('🎉 All tests passed! API is working correctly in development mode.', 'green');
    process.exit(0);
  } else {
    log('❌ Some tests failed. Please check the errors above.', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  log(error.stack, 'red');
  process.exit(1);
});
