import Database from 'better-sqlite3';
import { FinancialCalculationService } from '../FinancialCalculationService';
import fs from 'fs';
import path from 'path';

/**
 * Test suite for FinancialCalculationService
 * 
 * This test file is part of the financial-calculation-accuracy-fix bugfix spec.
 * It includes exploratory tests to demonstrate the bugs exist on unfixed code,
 * and will be updated to verify fixes work correctly.
 */

// In-memory test database
let testDb: Database.Database;

// Mock the database module to use our test database
jest.mock('../../db/database', () => {
  const actual = jest.requireActual('../../db/database');
  return {
    ...actual,
    get: (sql: string, params: any[] = []) => {
      try {
        const stmt = testDb.prepare(sql);
        return stmt.get(...params) || null;
      } catch (error) {
        console.error('Test get error:', error);
        throw error;
      }
    },
    query: (sql: string, params: any[] = []) => {
      try {
        const stmt = testDb.prepare(sql);
        return stmt.all(...params);
      } catch (error) {
        console.error('Test query error:', error);
        throw error;
      }
    },
    run: (sql: string, params: any[] = []) => {
      try {
        const stmt = testDb.prepare(sql);
        const info = stmt.run(...params);
        return { changes: info.changes };
      } catch (error) {
        console.error('Test run error:', error);
        throw error;
      }
    }
  };
});

/**
 * Helper: Initialize test database with schema
 */
function initTestDatabase() {
  testDb = new Database(':memory:');
  testDb.pragma('foreign_keys = ON');
  
  // Load and execute schema
  const schemaPath = path.join(__dirname, '../../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Split by semicolon and execute each statement
  const cleanSchema = schema.replace(/--.*$/gm, '');
  const statements = cleanSchema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    try {
      testDb.prepare(statement).run();
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        console.error('Error executing statement:', statement.substring(0, 100));
        throw error;
      }
    }
  }
}

/**
 * Helper: Clean all data from test database (keep schema)
 */
function cleanTestDatabase() {
  // Delete data in reverse order of dependencies
  const tables = [
    'order_item_modifiers',
    'order_items',
    'payments',
    'orders',
    'shifts',
    'product_modifiers',
    'modifier_options',
    'modifier_groups',
    'products',
    'categories',
    'users',
    'outlets',
    'payment_methods',
    'members',
    'activity_logs',
    'settings',
    'stations',
    'tenants',
    'cost_bahan',
    'cost_riwayat_harga',
    'cost_recipes',
    'crm_customers',
    'crm_rewards',
    'crm_point_transactions'
  ];
  
  for (const table of tables) {
    try {
      testDb.prepare(`DELETE FROM ${table}`).run();
    } catch (error) {
      // Table might not exist, ignore
    }
  }
}

/**
 * Helper: Create a test tenant
 */
function createTestTenant(id: string = 'tenant-test-1'): any {
  const tenant = {
    id,
    name: 'Test Tenant',
    slug: `test-tenant-${id}`,  // Make slug unique based on id
    plan: 'pro',
    status: 'active'
  };
  
  testDb.prepare(`
    INSERT INTO tenants (id, name, slug, plan, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(tenant.id, tenant.name, tenant.slug, tenant.plan, tenant.status);
  
  return tenant;
}

/**
 * Helper: Create a test outlet
 */
function createTestOutlet(tenantId: string, id: string = 'outlet-test-1'): any {
  const outlet = {
    id,
    tenant_id: tenantId,
    name: 'Test Outlet',
    slug: 'test-outlet',
    address: '123 Test Street',
    phone: '081234567890',
    status: 'active'
  };
  
  testDb.prepare(`
    INSERT INTO outlets (id, tenant_id, name, slug, address, phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(outlet.id, outlet.tenant_id, outlet.name, outlet.slug, outlet.address, outlet.phone, outlet.status);
  
  return outlet;
}

/**
 * Helper: Create a test user (cashier)
 */
function createTestUser(tenantId: string, outletId: string, id: string = 'user-test-1'): any {
  const user = {
    id,
    tenant_id: tenantId,
    outlet_id: outletId,
    name: 'Test Cashier',
    role: 'cashier',
    pin: '1234',
    email: `cashier-${id}@test.com`,
    status: 'active'
  };
  
  testDb.prepare(`
    INSERT INTO users (id, tenant_id, outlet_id, name, role, pin, email, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.tenant_id, user.outlet_id, user.name, user.role, user.pin, user.email, user.status);
  
  return user;
}

/**
 * Helper: Create a test shift
 */
function createTestShift(outletId: string, userId: string, id: string = 'shift-test-1'): any {
  const shift = {
    id,
    outlet_id: outletId,
    user_id: userId,
    start_cash: 100000,
    status: 'open'
  };
  
  testDb.prepare(`
    INSERT INTO shifts (id, outlet_id, user_id, start_cash, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(shift.id, shift.outlet_id, shift.user_id, shift.start_cash, shift.status);
  
  return shift;
}

/**
 * Helper: Create a test category
 */
function createTestCategory(tenantId: string, id: string = 'category-test-1', name: string = 'Test Category'): any {
  const category = {
    id,
    tenant_id: tenantId,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    status: 'active'
  };
  
  testDb.prepare(`
    INSERT INTO categories (id, tenant_id, name, slug, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(category.id, category.tenant_id, category.name, category.slug, category.status);
  
  return category;
}

/**
 * Helper: Create a test product
 */
function createTestProduct(
  tenantId: string,
  categoryId: string,
  options: {
    id?: string;
    name?: string;
    price?: number;
    cost?: number | null;
  } = {}
): any {
  const product = {
    id: options.id || `product-test-${Date.now()}`,
    tenant_id: tenantId,
    category_id: categoryId,
    name: options.name || 'Test Product',
    slug: (options.name || 'test-product').toLowerCase().replace(/\s+/g, '-'),
    price: options.price || 50000,
    cost: options.cost !== undefined ? options.cost : null,
    status: 'active'
  };
  
  if (product.cost !== null) {
    testDb.prepare(`
      INSERT INTO products (id, tenant_id, category_id, name, slug, price, cost, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(product.id, product.tenant_id, product.category_id, product.name, product.slug, product.price, product.cost, product.status);
  } else {
    testDb.prepare(`
      INSERT INTO products (id, tenant_id, category_id, name, slug, price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(product.id, product.tenant_id, product.category_id, product.name, product.slug, product.price, product.status);
  }
  
  return product;
}

/**
 * Helper: Create a test order
 */
function createTestOrder(
  tenantId: string,
  outletId: string,
  userId: string,
  options: {
    id?: string;
    shiftId?: string | null;
    orderNumber?: string;
    orderType?: string;
    subtotal?: number;
    discount?: number;
    tax?: number;
    serviceCharge?: number;
    total?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    orderStatus?: string;
    createdAt?: string;
  } = {}
): any {
  const order = {
    id: options.id || `order-test-${Date.now()}`,
    tenant_id: tenantId,
    outlet_id: outletId,
    shift_id: options.shiftId !== undefined ? options.shiftId : null,
    user_id: userId,
    order_number: options.orderNumber || `ORD-${Date.now()}`,
    order_type: options.orderType || 'dine-in',
    subtotal: options.subtotal || 0,
    discount: options.discount || 0,
    tax: options.tax || 0,
    service_charge: options.serviceCharge || 0,
    total: options.total || 0,
    payment_method: options.paymentMethod || 'cash',
    payment_status: options.paymentStatus || 'paid',
    order_status: options.orderStatus || 'completed',
    created_at: options.createdAt || new Date().toISOString()
  };
  
  testDb.prepare(`
    INSERT INTO orders (
      id, tenant_id, outlet_id, shift_id, user_id, order_number, order_type,
      subtotal, discount, tax, service_charge, total,
      payment_method, payment_status, order_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    order.id, order.tenant_id, order.outlet_id, order.shift_id, order.user_id,
    order.order_number, order.order_type, order.subtotal, order.discount,
    order.tax, order.service_charge, order.total, order.payment_method,
    order.payment_status, order.order_status, order.created_at
  );
  
  return order;
}

/**
 * Helper: Create a test order item
 */
function createTestOrderItem(
  orderId: string,
  productId: string,
  productName: string,
  options: {
    id?: string;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
  } = {}
): any {
  const orderItem = {
    id: options.id || `item-test-${Date.now()}-${Math.random()}`,
    order_id: orderId,
    product_id: productId,
    product_name: productName,
    quantity: options.quantity || 1,
    unit_price: options.unitPrice || 0,
    subtotal: options.subtotal || 0
  };
  
  testDb.prepare(`
    INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderItem.id, orderItem.order_id, orderItem.product_id, orderItem.product_name,
    orderItem.quantity, orderItem.unit_price, orderItem.subtotal
  );
  
  return orderItem;
}

/**
 * Helper: Create a test payment
 */
function createTestPayment(
  orderId: string,
  options: {
    id?: string;
    method?: string;
    amount?: number;
    changeAmount?: number;
  } = {}
): any {
  const payment = {
    id: options.id || `payment-test-${Date.now()}`,
    order_id: orderId,
    method: options.method || 'cash',
    amount: options.amount || 0,
    change_amount: options.changeAmount || 0
  };
  
  testDb.prepare(`
    INSERT INTO payments (id, order_id, method, amount, change_amount)
    VALUES (?, ?, ?, ?, ?)
  `).run(payment.id, payment.order_id, payment.method, payment.amount, payment.change_amount);
  
  return payment;
}

// Test Suite
describe('FinancialCalculationService - Test Infrastructure', () => {
  beforeAll(() => {
    initTestDatabase();
  });

  beforeEach(() => {
    cleanTestDatabase();
  });

  afterAll(() => {
    if (testDb) {
      testDb.close();
    }
  });

  describe('Test Infrastructure Setup', () => {
    it('should initialize test database successfully', () => {
      // Verify database is initialized
      expect(testDb).toBeDefined();
      
      // Verify we can query the database
      const result = testDb.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should create and retrieve test tenant', () => {
      const tenant = createTestTenant();
      
      const retrieved = testDb.prepare('SELECT * FROM tenants WHERE id = ?').get(tenant.id);
      expect(retrieved).toBeDefined();
      expect((retrieved as any).name).toBe('Test Tenant');
    });

    it('should create and retrieve test outlet', () => {
      const tenant = createTestTenant();
      const outlet = createTestOutlet(tenant.id);
      
      const retrieved = testDb.prepare('SELECT * FROM outlets WHERE id = ?').get(outlet.id);
      expect(retrieved).toBeDefined();
      expect((retrieved as any).name).toBe('Test Outlet');
    });

    it('should create and retrieve test user', () => {
      const tenant = createTestTenant();
      const outlet = createTestOutlet(tenant.id);
      const user = createTestUser(tenant.id, outlet.id);
      
      const retrieved = testDb.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      expect(retrieved).toBeDefined();
      expect((retrieved as any).name).toBe('Test Cashier');
    });

    it('should create and retrieve test product with cost', () => {
      const tenant = createTestTenant();
      const category = createTestCategory(tenant.id);
      const product = createTestProduct(tenant.id, category.id, {
        name: 'Coffee',
        price: 25000,
        cost: 15000
      });
      
      const retrieved = testDb.prepare('SELECT * FROM products WHERE id = ?').get(product.id);
      expect(retrieved).toBeDefined();
      expect((retrieved as any).price).toBe(25000);
      expect((retrieved as any).cost).toBe(15000);
    });

    it('should create and retrieve test product without cost (NULL)', () => {
      const tenant = createTestTenant();
      const category = createTestCategory(tenant.id);
      const product = createTestProduct(tenant.id, category.id, {
        name: 'New Product',
        price: 50000,
        cost: null
      });
      
      const retrieved = testDb.prepare('SELECT * FROM products WHERE id = ?').get(product.id);
      expect(retrieved).toBeDefined();
      expect((retrieved as any).price).toBe(50000);
      // SQLite stores NULL as 0 for numeric columns with DEFAULT 0, so we check for 0 or NULL
      expect((retrieved as any).cost === null || (retrieved as any).cost === 0).toBeTruthy();
    });

    it('should create and retrieve test order with all financial fields', () => {
      const tenant = createTestTenant();
      const outlet = createTestOutlet(tenant.id);
      const user = createTestUser(tenant.id, outlet.id);
      const shift = createTestShift(outlet.id, user.id);
      
      const order = createTestOrder(tenant.id, outlet.id, user.id, {
        shiftId: shift.id,
        subtotal: 1000,
        discount: 100,
        tax: 99,
        serviceCharge: 45,
        total: 1044,
        paymentStatus: 'paid',
        orderStatus: 'completed'
      });
      
      const retrieved = testDb.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
      expect(retrieved).toBeDefined();
      expect((retrieved as any).subtotal).toBe(1000);
      expect((retrieved as any).discount).toBe(100);
      expect((retrieved as any).tax).toBe(99);
      expect((retrieved as any).service_charge).toBe(45);
      expect((retrieved as any).total).toBe(1044);
      expect((retrieved as any).payment_status).toBe('paid');
    });

    it('should create order with items and payments', () => {
      const tenant = createTestTenant();
      const outlet = createTestOutlet(tenant.id);
      const user = createTestUser(tenant.id, outlet.id);
      const category = createTestCategory(tenant.id);
      const product = createTestProduct(tenant.id, category.id, { price: 25000 });
      
      const order = createTestOrder(tenant.id, outlet.id, user.id, {
        subtotal: 50000,
        total: 50000
      });
      
      createTestOrderItem(order.id, product.id, product.name, {
        quantity: 2,
        unitPrice: 25000,
        subtotal: 50000
      });
      
      createTestPayment(order.id, {
        amount: 50000
      });
      
      // Verify order items
      const items = testDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      expect(items.length).toBe(1);
      expect((items[0] as any).quantity).toBe(2);
      
      // Verify payments
      const payments = testDb.prepare('SELECT * FROM payments WHERE order_id = ?').all(order.id);
      expect(payments.length).toBe(1);
      expect((payments[0] as any).amount).toBe(50000);
    });

    it('should clean test database between tests', () => {
      // Create some data with unique identifiers
      const tenant1 = createTestTenant('tenant-clean-1');
      const tenant2 = createTestTenant('tenant-clean-2');
      
      let tenants = testDb.prepare('SELECT * FROM tenants WHERE id LIKE ?').all('tenant-clean-%');
      expect(tenants.length).toBe(2);
      
      // Clean
      cleanTestDatabase();
      
      // Verify data is gone
      tenants = testDb.prepare('SELECT * FROM tenants').all();
      expect(tenants.length).toBe(0);
    });
  });

  describe('Helper Functions - Complex Scenarios', () => {
    it('should create complete order flow with shift and multiple items', () => {
      // Setup
      const tenant = createTestTenant();
      const outlet = createTestOutlet(tenant.id);
      const user = createTestUser(tenant.id, outlet.id);
      const shift = createTestShift(outlet.id, user.id);
      const category = createTestCategory(tenant.id);
      
      // Create products
      const product1 = createTestProduct(tenant.id, category.id, {
        id: 'prod-1',
        name: 'Coffee',
        price: 25000,
        cost: 15000
      });
      
      const product2 = createTestProduct(tenant.id, category.id, {
        id: 'prod-2',
        name: 'Tea',
        price: 20000,
        cost: 10000
      });
      
      // Create order
      const order = createTestOrder(tenant.id, outlet.id, user.id, {
        shiftId: shift.id,
        subtotal: 45000,
        discount: 5000,
        tax: 4400,
        serviceCharge: 2000,
        total: 46400
      });
      
      // Create order items
      createTestOrderItem(order.id, product1.id, product1.name, {
        quantity: 1,
        unitPrice: 25000,
        subtotal: 25000
      });
      
      createTestOrderItem(order.id, product2.id, product2.name, {
        quantity: 1,
        unitPrice: 20000,
        subtotal: 20000
      });
      
      // Verify the complete order
      const retrievedOrder = testDb.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
      expect(retrievedOrder).toBeDefined();
      
      const items = testDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      expect(items.length).toBe(2);
      
      // Verify total subtotal from items
      const totalSubtotal = items.reduce((sum, item: any) => sum + item.subtotal, 0);
      expect(totalSubtotal).toBe(45000);
    });

    it('should create orders with different payment statuses', () => {
      const tenant = createTestTenant();
      const outlet = createTestOutlet(tenant.id);
      const user = createTestUser(tenant.id, outlet.id);
      
      createTestOrder(tenant.id, outlet.id, user.id, {
        id: 'order-paid',
        subtotal: 1000,
        total: 1000,
        paymentStatus: 'paid',
        orderStatus: 'completed'
      });
      
      createTestOrder(tenant.id, outlet.id, user.id, {
        id: 'order-pending',
        subtotal: 2000,
        total: 2000,
        paymentStatus: 'pending',
        orderStatus: 'pending'
      });
      
      createTestOrder(tenant.id, outlet.id, user.id, {
        id: 'order-cancelled',
        subtotal: 500,
        total: 500,
        paymentStatus: 'paid',
        orderStatus: 'cancelled'
      });
      
      const paidOrders = testDb.prepare(
        'SELECT * FROM orders WHERE payment_status = ? AND order_status != ?'
      ).all('paid', 'cancelled');
      
      expect(paidOrders.length).toBe(1);
      expect((paidOrders[0] as any).id).toBe('order-paid');
    });
  });

  describe('Bug Exploration: Missing COGS Handling', () => {
    /**
     * EXPLORATORY TEST 1.5: Missing COGS Bug
     * 
     * This test demonstrates the bug where products with NULL cost data 
     * produce false profit calculations instead of returning NULL.
     * 
     * Bug: COALESCE(p.cost, 0) treats missing cost as zero, creating 
     * misleading 100% profit margins.
     * 
     * Expected counterexample: Product with price=50000, cost=NULL, quantity=10
     * - Current buggy behavior: profit = 500,000 (treats cost as 0)
     * - Expected correct behavior: profit = NULL (cannot calculate)
     */
    it('EXPLORATION: should demonstrate false profit when cost is NULL (missing COGS bug)', () => {
      // Setup test data
      const tenant = createTestTenant('tenant-cogs-bug');
      const outlet = createTestOutlet(tenant.id, 'outlet-cogs-bug');
      const user = createTestUser(tenant.id, outlet.id, 'user-cogs-bug');
      const category = createTestCategory(tenant.id, 'category-cogs-bug', 'Test Category');
      
      // Create product WITHOUT cost data (NULL cost - not set yet)
      const productWithoutCost = createTestProduct(tenant.id, category.id, {
        id: 'product-no-cost',
        name: 'New Menu Item (No Cost)',
        price: 50000,
        cost: null  // This is the key: cost data is missing
      });
      
      // Create product WITH valid cost data (edge case - should still work)
      const productWithCost = createTestProduct(tenant.id, category.id, {
        id: 'product-with-cost',
        name: 'Established Menu Item',
        price: 50000,
        cost: 30000  // Valid cost data
      });
      
      // Create orders for both products
      const orderNoCost = createTestOrder(tenant.id, outlet.id, user.id, {
        id: 'order-no-cost',
        subtotal: 500000,
        total: 500000,
        paymentStatus: 'paid',
        orderStatus: 'completed'
      });
      
      const orderWithCost = createTestOrder(tenant.id, outlet.id, user.id, {
        id: 'order-with-cost',
        subtotal: 500000,
        total: 500000,
        paymentStatus: 'paid',
        orderStatus: 'completed'
      });
      
      // Create order items
      createTestOrderItem(orderNoCost.id, productWithoutCost.id, productWithoutCost.name, {
        quantity: 10,
        unitPrice: 50000,
        subtotal: 500000
      });
      
      createTestOrderItem(orderWithCost.id, productWithCost.id, productWithCost.name, {
        quantity: 10,
        unitPrice: 50000,
        subtotal: 500000
      });
      
      // Build where clause for product performance report
      const whereClause = `
        WHERE o.tenant_id = ? 
        AND o.payment_status = 'paid' 
        AND o.order_status != 'cancelled'
      `;
      
      // Call getProductPerformanceReport - this is where the bug manifests
      const performanceReport = FinancialCalculationService.getProductPerformanceReport(
        tenant.id,
        [whereClause, [tenant.id]],
        50
      ) as any[];
      
      // Find the products in the report
      const noCostProduct = performanceReport.find(p => p.product_id === 'product-no-cost');
      const withCostProduct = performanceReport.find(p => p.product_id === 'product-with-cost');
      
      // Verify both products exist in report
      expect(noCostProduct).toBeDefined();
      expect(withCostProduct).toBeDefined();
      
      // **BUG DEMONSTRATION 1: Product without cost shows FALSE profit**
      // Expected bug behavior: profit = 500,000 (treats cost as 0)
      // This is WRONG because we cannot calculate profit without cost data
      console.log('Product without cost - estimated_profit:', noCostProduct?.estimated_profit);
      console.log('Product without cost - cost field:', noCostProduct?.cost);
      
      expect(noCostProduct.estimated_profit).toBe(500000);  // Bug: shows full revenue as profit
      expect(noCostProduct.cost).toBe(0);  // Cost is stored as 0 (DEFAULT 0 in schema)
      // **This is the counterexample that proves the bug exists**
      // The schema has DEFAULT 0, so NULL becomes 0 in the database
      // Combined with COALESCE(p.cost, 0) in queries, missing cost data is treated as zero cost
      // Real profit calculation: should be NULL/N/A when cost data is not set, not 500,000
      
      // **EDGE CASE: Product with valid cost should calculate correctly**
      // Expected: profit = 500,000 - (30,000 * 10) = 200,000 (40% margin)
      console.log('Product with cost - estimated_profit:', withCostProduct?.estimated_profit);
      console.log('Product with cost - cost field:', withCostProduct?.cost);
      
      expect(withCostProduct.estimated_profit).toBe(200000);  // Correct: 40% margin
      expect(withCostProduct.cost).toBe(30000);
      
      // **BUG DEMONSTRATION 2: Menu Engineering report also affected**
      const menuEngineeringReport = FinancialCalculationService.getMenuEngineeringReport(
        tenant.id,
        [whereClause, [tenant.id]]
      ) as any;
      
      const noCostInMenu = menuEngineeringReport.products.find((p: any) => p.product_id === 'product-no-cost');
      const withCostInMenu = menuEngineeringReport.products.find((p: any) => p.product_id === 'product-with-cost');
      
      // Bug: profit_margin shows 50,000 (price - 0) instead of NULL
      console.log('Menu Engineering - Product without cost - profit_margin:', noCostInMenu?.profit_margin);
      expect(noCostInMenu.profit_margin).toBe(50000);  // Bug: false 100% margin
      
      // Edge case: Product with cost shows correct margin
      console.log('Menu Engineering - Product with cost - profit_margin:', withCostInMenu?.profit_margin);
      expect(withCostInMenu.profit_margin).toBe(20000);  // Correct: 40% margin (20k profit on 50k price)
      
      // **BUG DOCUMENTATION**
      // Counterexamples found:
      // 1. Product Performance Report: estimated_profit = 500,000 when should be NULL or "N/A"
      // 2. Menu Engineering Report: profit_margin = 50,000 when should be NULL or "N/A"
      // 
      // Root cause: TWO-PART BUG
      // Part 1: Schema has `cost REAL DEFAULT 0` which converts NULL to 0 on insert
      // Part 2: COALESCE(p.cost, 0) in SQL queries further treats missing cost as zero
      // 
      // Combined effect: Products without cost data (cost not set yet) are stored as 0,
      // then treated as zero cost, showing 100% profit margin and distorting reports
      //
      // Impact: Products without cost data appear highly profitable, distorting
      // menu engineering classification and business decisions
      //
      // Expected fix: 
      // - Remove DEFAULT 0 from schema (allow NULL)
      // - Use CASE WHEN p.cost IS NOT NULL THEN ... ELSE NULL END in queries
      // - This will propagate NULL through profit calculations
      // - Frontend should display NULL profits as "N/A" or "No Cost Data"
    });

    it('EXPLORATION: should demonstrate menu engineering classification affected by false profit margins', () => {
      // Setup
      const tenant = createTestTenant('tenant-menu-eng-bug');
      const outlet = createTestOutlet(tenant.id, 'outlet-menu-eng-bug');
      const user = createTestUser(tenant.id, outlet.id, 'user-menu-eng-bug');
      const category = createTestCategory(tenant.id, 'category-menu-eng-bug', 'Menu Category');
      
      // Create 4 products with different characteristics
      // 1. High sales, no cost data (should be "unknown", but likely classified as "star" due to bug)
      const popularNoCost = createTestProduct(tenant.id, category.id, {
        id: 'popular-no-cost',
        name: 'Popular Item (No Cost)',
        price: 100000,
        cost: null
      });
      
      // 2. High sales, high profit (true star)
      const trueStar = createTestProduct(tenant.id, category.id, {
        id: 'true-star',
        name: 'True Star Item',
        price: 100000,
        cost: 40000
      });
      
      // 3. Low sales, high profit (puzzle)
      const puzzle = createTestProduct(tenant.id, category.id, {
        id: 'puzzle-item',
        name: 'Puzzle Item',
        price: 100000,
        cost: 40000
      });
      
      // 4. Low sales, low profit (dog)
      const dog = createTestProduct(tenant.id, category.id, {
        id: 'dog-item',
        name: 'Dog Item',
        price: 100000,
        cost: 80000
      });
      
      // Create orders to establish sales patterns
      // Popular items: 100 units sold
      const orderPopularNoCost = createTestOrder(tenant.id, outlet.id, user.id, {
        id: 'order-popular-no-cost',
        subtotal: 10000000,
        total: 10000000,
        paymentStatus: 'paid',
        orderStatus: 'completed'
      });
      
      const orderTrueStar = createTestOrder(tenant.id, outlet.id, user.id, {
        id: 'order-true-star',
        subtotal: 10000000,
        total: 10000000,
        paymentStatus: 'paid',
        orderStatus: 'completed'
      });
      
      // Unpopular items: 10 units sold
      const orderPuzzle = createTestOrder(tenant.id, outlet.id, user.id, {
        id: 'order-puzzle',
        subtotal: 1000000,
        total: 1000000,
        paymentStatus: 'paid',
        orderStatus: 'completed'
      });
      
      const orderDog = createTestOrder(tenant.id, outlet.id, user.id, {
        id: 'order-dog',
        subtotal: 1000000,
        total: 1000000,
        paymentStatus: 'paid',
        orderStatus: 'completed'
      });
      
      // Create order items
      createTestOrderItem(orderPopularNoCost.id, popularNoCost.id, popularNoCost.name, {
        quantity: 100,
        unitPrice: 100000,
        subtotal: 10000000
      });
      
      createTestOrderItem(orderTrueStar.id, trueStar.id, trueStar.name, {
        quantity: 100,
        unitPrice: 100000,
        subtotal: 10000000
      });
      
      createTestOrderItem(orderPuzzle.id, puzzle.id, puzzle.name, {
        quantity: 10,
        unitPrice: 100000,
        subtotal: 1000000
      });
      
      createTestOrderItem(orderDog.id, dog.id, dog.name, {
        quantity: 10,
        unitPrice: 100000,
        subtotal: 1000000
      });
      
      // Get menu engineering report
      const whereClause = `
        WHERE o.tenant_id = ? 
        AND o.payment_status = 'paid' 
        AND o.order_status != 'cancelled'
      `;
      
      const menuReport = FinancialCalculationService.getMenuEngineeringReport(
        tenant.id,
        [whereClause, [tenant.id]]
      ) as any;
      
      // Find classifications
      const popularNoCostClass = menuReport.products.find((p: any) => p.product_id === 'popular-no-cost');
      const trueStarClass = menuReport.products.find((p: any) => p.product_id === 'true-star');
      const puzzleClass = menuReport.products.find((p: any) => p.product_id === 'puzzle-item');
      const dogClass = menuReport.products.find((p: any) => p.product_id === 'dog-item');
      
      // Log classifications for debugging
      console.log('Menu Engineering Classifications:');
      console.log('Popular No Cost:', popularNoCostClass?.classification, '- profit_margin:', popularNoCostClass?.profit_margin);
      console.log('True Star:', trueStarClass?.classification, '- profit_margin:', trueStarClass?.profit_margin);
      console.log('Puzzle:', puzzleClass?.classification, '- profit_margin:', puzzleClass?.profit_margin);
      console.log('Dog:', dogClass?.classification, '- profit_margin:', dogClass?.profit_margin);
      console.log('Average profit margin:', menuReport.averages.avgProfitMargin);
      
      // **BUG DEMONSTRATION: Product without cost affects classification**
      // Bug: popularNoCost has profit_margin = 100,000 (price - 0)
      // This inflates the average profit margin calculation
      expect(popularNoCostClass.profit_margin).toBe(100000);  // Bug: false margin
      
      // Because the average is inflated, it affects classification of ALL products
      // The average should be: (60000 + 60000 + 20000) / 3 = 46,666 (excluding NULL)
      // But the bug makes it: (100000 + 60000 + 60000 + 20000) / 4 = 60,000
      
      // This means products that should be "high profitability" become "low profitability"
      // affecting business decisions about menu optimization
      
      // **EXPECTED BEHAVIOR AFTER FIX:**
      // - popularNoCost should have classification = "unknown" or be excluded
      // - Average profit should be calculated only from products with cost data
      // - True star, puzzle, and dog classifications should be unaffected
      
      // For now, we document that the bug exists by showing the false classification
      expect(popularNoCostClass.classification).toBeDefined();  // Will be classified (incorrectly)
      expect(trueStarClass.classification).toBe('star');  // High popularity, high profit
      expect(puzzleClass.classification).toBe('puzzle');  // Low popularity, high profit
      expect(dogClass.classification).toBe('dog');  // Low popularity, low profit
      
      // Summary count should include the falsely classified product
      const totalClassified = menuReport.summary.stars + menuReport.summary.plowhorses + 
                             menuReport.summary.puzzles + menuReport.summary.dogs;
      expect(totalClassified).toBe(4);  // Bug: all 4 products classified including the one without cost
    });
  });
});
