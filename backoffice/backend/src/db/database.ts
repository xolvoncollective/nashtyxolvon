import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logSlowQuery } from '../middleware/logging';

const DB_PATH = process.env.DATABASE_PATH || '../../data/nashtypos.db';
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: any;

// Initialize database
export async function initDatabase() {
  try {
    // better-sqlite3 creates the file if it doesn't exist
    db = new Database(DB_PATH);
    console.log('✓ Connected to database');

    // Enable WAL mode for better concurrency (Requirement 8.8, 17.6)
    db.pragma('journal_mode = WAL');
    console.log('✓ WAL mode enabled');
    
    // Enable foreign keys (Requirement 8.7)
    db.pragma('foreign_keys = ON');
    
    // Load schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      // Split by semicolon and execute each statement
      const cleanSchema = schema.replace(/--.*$/gm, '');
      const statements = cleanSchema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        try {
          db.prepare(statement).run();
        } catch (error: any) {
          if (!error.message.includes('already exists')) {
            console.error('Error executing statement:', statement.substring(0, 100));
            throw error;
          }
        }
      }
    }
    
    // Create performance indexes
    createPerformanceIndexes();
    
    // Migrate soft deletes
    migrateSoftDeletes();
    
    console.log('✓ Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Create indexes for frequently queried columns
function createPerformanceIndexes() {
  try {
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_kitchen_status ON orders(kitchen_status, outlet_id, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_outlet_created ON orders(outlet_id, created_at DESC)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status, outlet_id)`).run();
    console.log('✓ Performance indexes created');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.error('Error creating indexes:', error);
    }
  }
}

// Migrate soft deletes for existing tables (Task 4)
function migrateSoftDeletes() {
  const tables = ['users', 'members', 'categories', 'products', 'modifier_groups', 'modifier_options', 'payment_methods', 'outlets', 'tenants', 'settings', 'orders', 'crm_customers', 'crm_rewards', 'crm_point_transactions', 'cost_bahan', 'cost_riwayat_harga', 'cost_recipes'];
  for (const table of tables) {
    try {
      const columnsInfo = db.pragma(`table_info(${table})`) as any[];
      const hasDeletedAt = columnsInfo.some(col => col.name === 'deleted_at');
      if (!hasDeletedAt) {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN deleted_at DATETIME DEFAULT NULL`).run();
        console.log(`✓ Added deleted_at to ${table}`);
      }
    } catch (error) {
      console.error(`Error migrating soft deletes for ${table}:`, error);
    }
  }
}

// Wrapper untuk execute query (Task 22.2 - Requirement 14.2)
// Logs queries that take longer than 100ms
export function query(sql: string, params: any[] = []) {
  const startTime = Date.now();
  try {
    const stmt = db.prepare(sql);
    const result = stmt.all(...params);
    const duration = Date.now() - startTime;
    logSlowQuery(sql, duration, params);
    return result;
  } catch (error) {
    console.error('Query error:', sql.substring(0, 100), error);
    throw error;
  }
}

// Get single result (Task 22.2 - Requirement 14.2)
export function get(sql: string, params: any[] = []) {
  const startTime = Date.now();
  try {
    const stmt = db.prepare(sql);
    const result = stmt.get(...params);
    const duration = Date.now() - startTime;
    logSlowQuery(sql, duration, params);
    return result || null;
  } catch (error) {
    console.error('Get error:', sql.substring(0, 100), error);
    throw error;
  }
}

// Execute without returning results (Task 22.2 - Requirement 14.2)
export function run(sql: string, params: any[] = []) {
  const startTime = Date.now();
  try {
    const stmt = db.prepare(sql);
    const info = stmt.run(...params);
    const duration = Date.now() - startTime;
    logSlowQuery(sql, duration, params);
    return { changes: info.changes };
  } catch (error) {
    console.error('Run error:', sql.substring(0, 100), error);
    throw error;
  }
}

// Transaction support
export function transaction<T extends (...args: any[]) => any>(fn: T): T {
  return db.transaction(fn) as T;
}

// Mock better-sqlite3 prepare syntax for compatibility with routes
export function prepare(sql: string) {
  const stmt = db.prepare(sql);
  return {
    run: (...params: any[]) => { const info = stmt.run(...params); return { changes: info.changes }; },
    get: (...params: any[]) => stmt.get(...params),
    all: (...params: any[]) => stmt.all(...params)
  };
}

// Stub for backward compatibility
export function saveDatabase() {}

export default { query, get, run, transaction, initDatabase, saveDatabase, prepare };
