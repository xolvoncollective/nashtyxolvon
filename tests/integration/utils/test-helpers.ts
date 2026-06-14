import jwt from 'jsonwebtoken';
import { get as dbGet, run as dbRun } from '../../../backoffice/backend/src/db/database';

export const JWT_SECRET = process.env.JWT_SECRET || 'nashty-super-secret-key-2026';

// Helper to generate a valid test token
export const generateTestToken = (
  userId = 'test-user-id',
  role = 'admin',
  outletId: string | null = 'test-outlet-id',
  expiresIn = '1h'
) => {
  const payload = {
    userId,
    role,
    outletId,
    iat: Math.floor(Date.now() / 1000)
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Helper to generate an expired token
export const generateExpiredToken = (
  userId = 'test-user-id',
  role = 'admin',
  outletId: string | null = 'test-outlet-id'
) => {
  const payload = {
    userId,
    role,
    outletId,
    iat: Math.floor(Date.now() / 1000) - 3600 // issued 1 hour ago
  };
  // Technically we can just sign it with expiresIn: '-1s' but jwt.sign might complain.
  // We'll sign it then it will be expired if we set exp explicitly.
  const expiredPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) - 10
  };
  return jwt.sign(expiredPayload, JWT_SECRET);
};

// Helper to seed the database with required test data (if not using mock)
export const seedTestData = () => {
  // First, we need a tenant because it's referenced by outlets and users
  dbRun(`
    INSERT OR IGNORE INTO tenants (id, name, slug, plan, status)
    VALUES ('demo-tenant', 'Demo Tenant', 'demo-tenant', 'starter', 'active')
  `);

  dbRun(`
    INSERT OR IGNORE INTO outlets (id, tenant_id, name, slug, address, phone) 
    VALUES ('test-outlet-id', 'demo-tenant', 'Test Outlet', 'test-outlet', 'Jakarta', '08123456789')
  `);
  
  dbRun(`
    INSERT OR IGNORE INTO categories (id, tenant_id, name, slug)
    VALUES ('test-category-id', 'demo-tenant', 'Test Category', 'test-category')
  `);

  dbRun(`
    INSERT OR IGNORE INTO products (id, tenant_id, category_id, name, slug, price, stock_tracking, stock_qty)
    VALUES ('test-product-id', 'demo-tenant', 'test-category-id', 'Test Product', 'test-product', 10000, 1, 100)
  `);

  // Hash pin 1234 for manager validation
  const bcrypt = require('bcryptjs');
  const pinHash = bcrypt.hashSync('1234', 10);

  dbRun(`
    INSERT OR IGNORE INTO users (id, tenant_id, outlet_id, name, role, pin, password_hash, status)
    VALUES ('test-user-id', 'demo-tenant', 'test-outlet-id', 'Test Admin', 'owner', ?, 'mock-hash', 'active')
  `, [pinHash]);
};
