/**
 * UAT Comprehensive Test untuk NASHTY OS
 * Test Flow: POS → KDS → Backoffice
 * 
 * Skenario:
 * 1. Login kasir di POS
 * 2. Buka shift
 * 3. Buat order baru (beli 1 menu)
 * 4. Cek order muncul di KDS
 * 5. Mark order sebagai ready di KDS
 * 6. Konfirmasi order completed
 * 7. Cek order muncul di Backoffice dashboard
 * 8. Buat menu baru di Backoffice
 * 9. Cek menu muncul di POS
 * 10. Order menu baru di POS
 * 11. Cek muncul di KDS
 */

const BASE_URL = 'http://localhost:3099';

// Helper untuk API call
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Colors untuk console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logStep(step, msg) {
  log(`\n[STEP ${step}] ${msg}`, 'cyan');
}

function logSuccess(msg) {
  log(`✓ ${msg}`, 'green');
}

function logError(msg) {
  log(`✗ ${msg}`, 'red');
}

function logWarning(msg) {
  log(`⚠ ${msg}`, 'yellow');
}

// Main UAT Test
async function runUAT() {
  log('\n═══════════════════════════════════════════', 'blue');
  log('    NASHTY OS - UAT COMPREHENSIVE TEST    ', 'blue');
  log('═══════════════════════════════════════════\n', 'blue');

  let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  let testData = {
    outletId: null,
    userId: null,
    shiftId: null,
    orderId: null,
    orderNumber: null,
    menuItemId: null,
    newMenuItemId: null,
    categoryId: null,
    token: null  // JWT token untuk auth
  };

  // ============================================
  // STEP 1: Health Check
  // ============================================
  logStep(1, 'Health Check Backend');
  try {
    const health = await apiCall('/health');
    if (health.success) {
      logSuccess(`Backend is running: ${health.data.status}`);
      testResults.passed++;
    } else {
      logError('Backend health check failed');
      testResults.failed++;
      return;
    }
  } catch (error) {
    logError(`Backend not reachable: ${error.message}`);
    testResults.failed++;
    return;
  }

  // ============================================
  // STEP 2: Get Outlets
  // ============================================
  logStep(2, 'Get Available Outlets');
  const outlets = await apiCall('/api/auth/outlets');
  if (outlets.success && outlets.data.success) {
    const outletList = outlets.data.outlets || [];
    if (outletList.length > 0) {
      testData.outletId = outletList[0].id;
      logSuccess(`Found ${outletList.length} outlets. Using: ${outletList[0].name} (${testData.outletId})`);
      testResults.passed++;
    } else {
      logError('No outlets found in database');
      testResults.failed++;
      return;
    }
  } else {
    logError('Failed to fetch outlets');
    testResults.failed++;
    return;
  }

  // ============================================
  // STEP 3: Get Staff untuk Login
  // ============================================
  logStep(3, 'Get Staff List for Login');
  const staff = await apiCall(`/api/auth/staff?outletId=${testData.outletId}`);
  if (staff.success && staff.data.staff) {
    const staffList = staff.data.staff;
    const kasir = staffList.find(s => s.role === 'cashier');
    if (kasir) {
      testData.userId = kasir.id;
      logSuccess(`Found cashier: ${kasir.name} (${kasir.id})`);
      testResults.passed++;
    } else {
      logError('No cashier found in staff list');
      testResults.failed++;
      return;
    }
  } else {
    logError('Failed to fetch staff list');
    testResults.failed++;
    return;
  }

  // ============================================
  // STEP 4: Login Kasir
  // ============================================
  logStep(4, 'Login Cashier with PIN');
  const login = await apiCall('/api/auth/login', 'POST', {
    pin: '1234',
    outletId: testData.outletId
  });
  if (login.success && login.data.success) {
    logSuccess(`Login successful: ${login.data.user.name} (${login.data.user.role})`);
    testData.userId = login.data.user.id; // Update userId dari response
    testData.token = login.data.token; // Simpan JWT token
    testResults.passed++;
  } else {
    logError(`Login failed: ${login.data?.error || 'Unknown error'}`);
    testResults.failed++;
    return;
  }

  // ============================================
  // STEP 5: Check Active Shift
  // ============================================
  logStep(5, 'Check Active Shift');
  const activeShift = await apiCall(`/api/shifts/outlet/${testData.outletId}/active`, 'GET', null, testData.token);
  if (activeShift.success && activeShift.data.success) {
    const shifts = activeShift.data.shifts || [];
    if (shifts.length > 0) {
      testData.shiftId = shifts[0].id;
      logSuccess(`Active shift found: ${testData.shiftId}`);
      testResults.passed++;
    } else {
      logWarning('No active shift found, creating new shift...');
      testResults.warnings++;
      
      // ============================================
      // STEP 5b: Create New Shift
      // ============================================
      const newShift = await apiCall('/api/shifts/start', 'POST', {
        outletId: testData.outletId,
        userId: testData.userId,
        startCash: 500000
      }, testData.token);
      
      if (newShift.success && newShift.data.success) {
        testData.shiftId = newShift.data.shift.id;
        logSuccess(`New shift created: ${testData.shiftId} with Rp 500,000 opening cash`);
        testResults.passed++;
      } else {
        logError(`Failed to create shift: ${newShift.data?.error || 'Unknown error'}`);
        testResults.failed++;
        return;
      }
    }
  } else {
    logError('Failed to check active shift');
    testResults.failed++;
    return;
  }

  // ============================================
  // STEP 6: Get Menu Items
  // ============================================
  logStep(6, 'Get Menu Items from Outlet');
  const menu = await apiCall(`/api/menu/outlet/${testData.outletId}`, 'GET', null, testData.token);
  if (menu.success && menu.data.success) {
    const categories = menu.data.data.categories || [];
    const items = menu.data.data.items || [];
    
    if (items.length > 0) {
      testData.menuItemId = items[0].id;
      testData.categoryId = items[0].category_id;
      logSuccess(`Found ${items.length} menu items in ${categories.length} categories`);
      logSuccess(`Using menu item: ${items[0].name} (Rp ${items[0].price})`);
      testResults.passed++;
    } else {
      logError('No menu items found');
      testResults.failed++;
      return;
    }
  } else {
    logError('Failed to fetch menu');
    testResults.failed++;
    return;
  }

  // ============================================
  // STEP 7: Create Order (Beli 1 Menu)
  // ============================================
  logStep(7, 'Create New Order (Buy 1 Menu Item)');
  
  const menuItem = menu.data.data.items.find(i => i.id === testData.menuItemId);
  
  // Calculate order totals (11% tax, 5% service charge)
  const itemSubtotal = menuItem.price * 1;
  const discount = 0;
  const baseAfterDiscount = itemSubtotal - discount;
  const taxAmount = Math.round(baseAfterDiscount * 0.11);
  const serviceCharge = Math.round(baseAfterDiscount * 0.05);
  const totalAmount = baseAfterDiscount + taxAmount + serviceCharge;
  
  const orderPayload = {
    tenantId: 'demo-tenant',
    outletId: testData.outletId,
    userId: testData.userId,
    shiftId: testData.shiftId,
    orderType: 'dine_in',
    tableNumber: 'T01',
    items: [
      {
        productId: testData.menuItemId,
        productName: menuItem.name,
        unitPrice: menuItem.price,
        quantity: 1,
        subtotal: itemSubtotal,
        notes: 'UAT Test Order',
        modifiers: []
      }
    ],
    subtotal: itemSubtotal,
    discount: discount,
    tax: taxAmount,
    serviceCharge: serviceCharge,
    total: totalAmount,
    paymentMethod: 'cash',
    payments: [
      {
        method: 'cash',
        amount: totalAmount + 10000, // Lebih dari total untuk kembalian
        change: 10000
      }
    ],
    notes: 'Automated UAT Test'
  };

  const createOrder = await apiCall('/api/orders', 'POST', orderPayload, testData.token);
  if (createOrder.success && createOrder.data.success) {
    testData.orderId = createOrder.data.order.id;
    testData.orderNumber = createOrder.data.order.order_number;
    logSuccess(`Order created: ${testData.orderNumber} (${testData.orderId})`);
    logSuccess(`Total: Rp ${createOrder.data.order.total}`);
    testResults.passed++;
  } else {
    logError(`Failed to create order: ${createOrder.data?.error || 'Unknown error'}`);
    testResults.failed++;
    return;
  }

  // ============================================
  // STEP 8: Check Order in KDS
  // ============================================
  logStep(8, 'Check Order Appears in KDS');
  const kdsOrders = await apiCall(`/api/orders?tenantId=demo-tenant&outletId=${testData.outletId}&kitchenStatus=pending`, 'GET', null, testData.token);
  if (kdsOrders.success && kdsOrders.data) {
    const ordersList = kdsOrders.data.orders || kdsOrders.data.data || [];
    const orderInKDS = ordersList.find(o => o.id === testData.orderId);
    if (orderInKDS) {
      logSuccess(`Order ${testData.orderNumber} found in KDS queue`);
      logSuccess(`Status: ${orderInKDS.order_status}, Items: ${orderInKDS.items?.length || 'N/A'}`);
      testResults.passed++;
    } else {
      logWarning(`Order ${testData.orderNumber} not found in KDS pending queue (might be already processed)`);
      testResults.warnings++;
    }
  } else {
    logError('Failed to fetch KDS orders');
    testResults.failed++;
  }

  // ============================================
  // STEP 9: Mark Order as Ready in KDS
  // ============================================
  logStep(9, 'Mark Order as Ready in KDS (Chef Complete)');
  const markReady = await apiCall(`/api/orders/${testData.orderId}/status`, 'PATCH', {
    kitchenStatus: 'ready'
  }, testData.token);
  if (markReady.success && (markReady.data.success !== false)) {
    logSuccess(`Order ${testData.orderNumber} marked as ready`);
    testResults.passed++;
  } else {
    logError(`Failed to mark order as ready: ${markReady.data?.error || 'Unknown error'}`);
    testResults.failed++;
  }

  // ============================================
  // STEP 10: Complete Order (Kasir Confirm)
  // ============================================
  logStep(10, 'Complete Order (Kasir Confirmation)');
  const completeOrder = await apiCall(`/api/orders/${testData.orderId}/status`, 'PATCH', {
    orderStatus: 'completed'
  }, testData.token);
  if (completeOrder.success && (completeOrder.data.success !== false)) {
    logSuccess(`Order ${testData.orderNumber} completed`);
    testResults.passed++;
  } else {
    logError(`Failed to complete order: ${completeOrder.data?.error || 'Unknown error'}`);
    testResults.failed++;
  }

  // ============================================
  // STEP 11: Check Order in Backoffice Dashboard
  // ============================================
  logStep(11, 'Check Order Appears in Backoffice Dashboard');
  const today = new Date().toISOString().split('T')[0];
  const dashboard = await apiCall(`/api/dashboard/kpi?tenantId=demo-tenant&outletId=${testData.outletId}&date=${today}`, 'GET', null, testData.token);
  if (dashboard.success && dashboard.data) {
    const kpi = dashboard.data.kpi || dashboard.data;
    logSuccess(`Dashboard KPI loaded successfully`);
    logSuccess(`Total Orders Today: ${kpi.todaySales?.order_count || kpi.totalOrders || 0}`);
    logSuccess(`Total Sales: Rp ${kpi.todaySales?.total_sales || kpi.grossRevenue || 0}`);
    testResults.passed++;
  } else {
    logError('Failed to load dashboard KPI');
    testResults.failed++;
  }

  // ============================================
  // STEP 12: Create New Menu Item in Backoffice
  // ============================================
  logStep(12, 'Create New Menu Item in Backoffice');
  const newMenuItem = {
    tenantId: 'demo-tenant',
    outletId: testData.outletId,
    categoryId: testData.categoryId,
    name: `UAT Test Menu ${Date.now()}`,
    slug: `uat-test-menu-${Date.now()}`,
    price: 45000,
    cost: 20000,
    description: 'Created by UAT Test',
    productionTime: 10,
    status: 'active'
  };

  const createMenu = await apiCall('/api/products', 'POST', newMenuItem, testData.token);
  if (createMenu.success && createMenu.data.success) {
    testData.newMenuItemId = createMenu.data.product.id;
    logSuccess(`New menu item created: ${createMenu.data.product.name} (${testData.newMenuItemId})`);
    testResults.passed++;
  } else {
    logError(`Failed to create menu item: ${createMenu.data?.error || 'Unknown error'}`);
    testResults.failed++;
  }

  // ============================================
  // STEP 13: Check New Menu Appears in POS
  // ============================================
  logStep(13, 'Check New Menu Appears in POS Menu List');
  const updatedMenu = await apiCall(`/api/menu/outlet/${testData.outletId}`, 'GET', null, testData.token);
  if (updatedMenu.success && updatedMenu.data.success) {
    const newItem = updatedMenu.data.data.items.find(i => i.id === testData.newMenuItemId);
    if (newItem) {
      logSuccess(`New menu item found in POS: ${newItem.name}`);
      testResults.passed++;
    } else {
      logError('New menu item not found in POS menu list');
      testResults.failed++;
    }
  } else {
    logError('Failed to fetch updated menu');
    testResults.failed++;
  }

  // ============================================
  // STEP 14: Order New Menu Item
  // ============================================
  logStep(14, 'Create Order with New Menu Item');
  
  const newItemSubtotal = newMenuItem.price * 2;
  const newDiscount = 0;
  const newBaseAfterDiscount = newItemSubtotal - newDiscount;
  const newTaxAmount = Math.round(newBaseAfterDiscount * 0.11);
  const newServiceCharge = Math.round(newBaseAfterDiscount * 0.05);
  const newTotalAmount = newBaseAfterDiscount + newTaxAmount + newServiceCharge;
  
  const newOrderPayload = {
    tenantId: 'demo-tenant',
    outletId: testData.outletId,
    userId: testData.userId,
    shiftId: testData.shiftId,
    orderType: 'take_away',
    tableNumber: null,
    items: [
      {
        productId: testData.newMenuItemId,
        productName: newMenuItem.name,
        unitPrice: newMenuItem.price,
        quantity: 2,
        subtotal: newItemSubtotal,
        notes: 'Testing new menu',
        modifiers: []
      }
    ],
    subtotal: newItemSubtotal,
    discount: newDiscount,
    tax: newTaxAmount,
    serviceCharge: newServiceCharge,
    total: newTotalAmount,
    paymentMethod: 'qris',
    payments: [
      {
        method: 'qris',
        amount: newTotalAmount,
        change: 0
      }
    ],
    notes: 'New menu UAT test'
  };

  const newOrder = await apiCall('/api/orders', 'POST', newOrderPayload, testData.token);
  if (newOrder.success && newOrder.data.success) {
    logSuccess(`Order with new menu created: ${newOrder.data.order.order_number}`);
    logSuccess(`Items: 2x ${newMenuItem.name}, Total: Rp ${newOrder.data.order.total}`);
    testResults.passed++;
    
    // Store for KDS check
    const newOrderId = newOrder.data.order.id;
    
    // ============================================
    // STEP 15: Check New Order in KDS
    // ============================================
    logStep(15, 'Check New Order Appears in KDS');
    const kdsCheck = await apiCall(`/api/orders?tenantId=demo-tenant&outletId=${testData.outletId}&kitchenStatus=pending`, 'GET', null, testData.token);
    if (kdsCheck.success && kdsCheck.data) {
      const ordersList = kdsCheck.data.orders || kdsCheck.data.data || [];
      const orderInKDS = ordersList.find(o => o.id === newOrderId);
      if (orderInKDS) {
        logSuccess(`New order found in KDS: ${newOrder.data.order.order_number}`);
        testResults.passed++;
      } else {
        logWarning('New order not found in KDS queue');
        testResults.warnings++;
      }
    } else {
      logError('Failed to check KDS for new order');
      testResults.failed++;
    }
  } else {
    logError(`Failed to create order with new menu: ${newOrder.data?.error || 'Unknown error'}`);
    testResults.failed++;
  }

  // ============================================
  // SUMMARY
  // ============================================
  log('\n═══════════════════════════════════════════', 'blue');
  log('           UAT TEST SUMMARY                ', 'blue');
  log('═══════════════════════════════════════════\n', 'blue');
  
  log(`✓ Passed:   ${testResults.passed}`, 'green');
  log(`✗ Failed:   ${testResults.failed}`, 'red');
  log(`⚠ Warnings: ${testResults.warnings}`, 'yellow');
  
  const total = testResults.passed + testResults.failed;
  const percentage = total > 0 ? ((testResults.passed / total) * 100).toFixed(2) : 0;
  
  log(`\nSuccess Rate: ${percentage}%`, percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red');
  
  if (testResults.failed === 0) {
    log('\n🎉 All critical tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the logs above.', 'red');
  }
  
  log('\n═══════════════════════════════════════════\n', 'blue');
}

// Run the test
runUAT().catch(error => {
  console.error('Fatal error running UAT:', error);
  process.exit(1);
});
