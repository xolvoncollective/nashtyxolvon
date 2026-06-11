import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/nashtypos.db';
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: SqlJsDatabase;
let SQL: any;

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
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Load schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
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
    
    // Save database to file
    saveDatabase();
    
    console.log('✓ Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Save database to file
export function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (error) {
    console.error('Error saving database:', error);
  }
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
    
    saveDatabase();
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
    saveDatabase();
    return { changes: db.getRowsModified() };
  } catch (error) {
    console.error('Run error:', sql.substring(0, 100), error);
    throw error;
  }
}

// Transaction support
export function transaction(fn: () => void) {
  try {
    db.run('BEGIN TRANSACTION');
    fn();
    db.run('COMMIT');
    saveDatabase();
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
}

export default { query, get, run, transaction, initDatabase, saveDatabase };
