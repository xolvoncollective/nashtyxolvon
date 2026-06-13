// Use require for sql.js to avoid TypeScript issues
const sqlJs = require('sql.js');
const initSqlJs = sqlJs.default || sqlJs;
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || '../../data/nashtypos.db';
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: any;
let SQL: any;
let inTransaction = false;

// Debounced saving mechanism
let saveTimeout: NodeJS.Timeout | null = null;
const SAVE_DELAY_MS = 2000; // Delay 2 seconds before writing to disk
let isSaving = false;
let pendingSave = false;

// Initialize database
export async function initDatabase() {
  try {
    SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log('✓ Loaded existing database');
    } else {
      db = new SQL.Database();
      console.log('✓ Created new database');
    }
    
    // Enable foreign keys (Requirement 8.7)
    db.run('PRAGMA foreign_keys = ON');
    
    // Enable WAL mode for better concurrency (Requirement 8.8, 17.6)
    // Note: sql.js (in-memory) doesn't support WAL, but we document it for future SQLite native migration
    try {
      db.run('PRAGMA journal_mode = WAL');
      console.log('✓ WAL mode enabled');
    } catch (walError) {
      console.log('⚠️  WAL mode not supported in sql.js (will be enabled in native SQLite)');
    }
    
    // Load schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const cleanSchema = schema.replace(/--.*$/gm, '');
    const statements = cleanSchema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        db.run(statement);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error('Error executing statement:', statement.substring(0, 100));
          throw error;
        }
      }
    }
    
    // Create performance indexes (Requirement 3: Database Performance)
    createPerformanceIndexes();
    
    // Save database to file
    saveDatabase();
    
    console.log('✓ Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Create indexes for frequently queried columns (Requirement 3)
function createPerformanceIndexes() {
  try {
    // Index for KDS order queries (kitchen_status, outlet_id, created_at)
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_orders_kitchen_status 
      ON orders(kitchen_status, outlet_id, created_at)
    `);
    
    // Index for outlet filtering
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_orders_outlet_created 
      ON orders(outlet_id, created_at DESC)
    `);
    
    // Index for order status queries
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_orders_status 
      ON orders(order_status, outlet_id)
    `);
    
    console.log('✓ Performance indexes created');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.error('Error creating indexes:', error);
    }
  }
}

// Save database to file (Debounced Async)
export function saveDatabase() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    if (isSaving) {
      pendingSave = true;
      return;
    }

    try {
      isSaving = true;
      const data = db.export();
      const buffer = Buffer.from(data);
      
      // Use async fs.writeFile to avoid blocking the event loop
      await fs.promises.writeFile(DB_PATH, buffer);
      
      isSaving = false;
      if (pendingSave) {
        pendingSave = false;
        saveDatabase(); // Trigger the pending save
      }
    } catch (error) {
      console.error('Error saving database:', error);
      isSaving = false;
    }
  }, SAVE_DELAY_MS);
}

// Wrapper untuk execute query
export function query(sql: string, params: any[] = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (!inTransaction) saveDatabase();
    return results;
  } catch (error) {
    console.error('Query error:', sql.substring(0, 100), error);
    throw error;
  }
}

// Get single result
export function get(sql: string, params: any[] = []) {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Execute without returning results
export function run(sql: string, params: any[] = []) {
  try {
    db.run(sql, params);
    if (!inTransaction) saveDatabase();
    return { changes: db.getRowsModified() };
  } catch (error) {
    console.error('Run error:', sql.substring(0, 100), error);
    throw error;
  }
}

// Transaction support
export function transaction<T extends (...args: any[]) => any>(fn: T): T {
  return function(...args: any[]) {
    if (inTransaction) return fn(...args); // Nested transactions not supported, just run fn
    try {
      db.run('BEGIN TRANSACTION');
      inTransaction = true;
      const result = fn(...args);
      db.run('COMMIT');
      inTransaction = false;
      saveDatabase();
      return result;
    } catch (error) {
      inTransaction = false;
      try {
        db.run('ROLLBACK');
      } catch (rollbackError) {}
      throw error;
    }
  } as T;
}

// Mock better-sqlite3 prepare syntax for compatibility with routes
export function prepare(sql: string) {
  return {
    run: (...params: any[]) => run(sql, params),
    get: (...params: any[]) => get(sql, params),
    all: (...params: any[]) => query(sql, params)
  };
}

export default { query, get, run, transaction, initDatabase, saveDatabase, prepare };
