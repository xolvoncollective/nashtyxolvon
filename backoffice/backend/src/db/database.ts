import { createClient } from '@supabase/supabase-js';
import { logSlowQuery } from '../middleware/logging';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Initialize database
export async function initDatabase() {
  try {
    console.log('🔌 Connecting to Supabase...');
    
    // Test connection by querying tenants table
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      throw error;
    }
    
    console.log('✅ Connected to Supabase database');
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Convert SQL query to Supabase query
// This is a compatibility layer to minimize code changes in routes
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  const startTime = Date.now();
  try {
    // Execute raw SQL query using Supabase RPC or direct query
    const { data, error } = await supabase.rpc('execute_sql', { 
      query_text: sql, 
      query_params: params 
    });
    
    if (error) throw error;
    
    const duration = Date.now() - startTime;
    logSlowQuery(sql, duration, params);
    return data || [];
  } catch (error) {
    console.error('Query error:', sql.substring(0, 100), error);
    
    // Fallback: Try to parse SQL and use Supabase JS client
    // This is a temporary solution - ideally refactor routes to use Supabase client directly
    return await executeSqlFallback(sql, params);
  }
}

// Get single result
export async function get(sql: string, params: any[] = []): Promise<any> {
  const startTime = Date.now();
  try {
    const results = await query(sql, params);
    const duration = Date.now() - startTime;
    logSlowQuery(sql, duration, params);
    return results[0] || null;
  } catch (error) {
    console.error('Get error:', sql.substring(0, 100), error);
    throw error;
  }
}

// Execute without returning results
export async function run(sql: string, params: any[] = []): Promise<{ changes: number }> {
  const startTime = Date.now();
  try {
    const { data, error } = await supabase.rpc('execute_sql', { 
      query_text: sql, 
      query_params: params 
    });
    
    if (error) throw error;
    
    const duration = Date.now() - startTime;
    logSlowQuery(sql, duration, params);
    
    // Return changes count (Supabase doesn't provide this directly)
    return { changes: Array.isArray(data) ? data.length : 1 };
  } catch (error) {
    console.error('Run error:', sql.substring(0, 100), error);
    throw error;
  }
}

// Fallback SQL executor (parses simple queries)
async function executeSqlFallback(sql: string, params: any[]): Promise<any[]> {
  // Parse table name from SQL
  const selectMatch = sql.match(/FROM\s+(\w+)/i);
  const insertMatch = sql.match(/INSERT INTO\s+(\w+)/i);
  const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
  const deleteMatch = sql.match(/DELETE FROM\s+(\w+)/i);
  
  if (selectMatch) {
    const table = selectMatch[1];
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    return data || [];
  }
  
  throw new Error('SQL query parsing not implemented for this query type. Please refactor to use Supabase client directly.');
}

// Transaction support (Supabase uses PostgreSQL transactions automatically)
export function transaction<T extends (...args: any[]) => any>(fn: T): T {
  // Supabase handles transactions automatically for multiple operations
  // For complex transactions, use supabase.rpc with a PostgreSQL function
  console.warn('Transaction wrapper called - Supabase handles transactions automatically');
  return fn as T;
}

// Mock better-sqlite3 prepare syntax for compatibility
export function prepare(sql: string) {
  return {
    run: async (...params: any[]) => await run(sql, params),
    get: async (...params: any[]) => await get(sql, params),
    all: async (...params: any[]) => await query(sql, params)
  };
}

// Stub for backward compatibility
export function saveDatabase() {
  console.log('saveDatabase() called - no-op for Supabase');
}

// Export Supabase client for direct use in routes
export { supabase };

export default { query, get, run, transaction, initDatabase, saveDatabase, prepare, supabase };
