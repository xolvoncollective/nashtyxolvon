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
});
