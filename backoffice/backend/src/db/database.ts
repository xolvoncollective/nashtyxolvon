import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logSlowQuery } from '../middleware/logging';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration - read lazily to allow Railway env vars to be injected
let supabase: SupabaseClient;

function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabase;
}

// Initialize database
export async function initDatabase() {
  try {
    console.log('🔌 Connecting to Supabase...');
    
    const { data, error } = await getSupabaseClient()
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

// Helper to inline parameters safely
function formatSql(sql: string, params: any[]): string {
  if (!params || params.length === 0) return sql;
  let finalSql = sql;
  for (const param of params) {
    let formattedParam = '';
    if (param === null || param === undefined) {
      formattedParam = 'NULL';
    } else if (typeof param === 'number' || typeof param === 'boolean') {
      formattedParam = param.toString();
    } else {
      formattedParam = `'${String(param).replace(/'/g, "''")}'`;
    }
    finalSql = finalSql.replace('?', formattedParam);
  }
  return finalSql;
}

// Convert SQL query to Supabase query
export async function query(sql: string, params: any[] = []): Promise<any[]> {
  const startTime = Date.now();
  try {
    const finalSql = formatSql(sql, params);
    const { data, error } = await getSupabaseClient().rpc('execute_sql', { 
      query_text: finalSql, 
      query_params: [] 
    });
    
    if (error) throw error;
    
    const duration = Date.now() - startTime;
    logSlowQuery(sql, duration, params);
    return data || [];
  } catch (error) {
    console.error('Query error:', sql.substring(0, 100), error);
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
    const finalSql = formatSql(sql, params);
    const { data, error } = await getSupabaseClient().rpc('execute_sql', { 
      query_text: finalSql, 
      query_params: [] 
    });
    
    if (error) throw error;
    
    const duration = Date.now() - startTime;
    logSlowQuery(sql, duration, params);
    
    return { changes: Array.isArray(data) ? data.length : 1 };
  } catch (error) {
    console.error('Run error:', sql.substring(0, 100), error);
    throw error;
  }
}

// Fallback SQL executor (parses simple queries)
async function executeSqlFallback(sql: string, params: any[]): Promise<any[]> {
  const selectMatch = sql.match(/FROM\s+(\w+)/i);
  
  if (selectMatch) {
    const table = selectMatch[1];
    const { data, error } = await getSupabaseClient().from(table).select('*');
    if (error) throw error;
    return data || [];
  }
  
  throw new Error('SQL query parsing not implemented for this query type.');
}

// Transaction support
export function transaction<T extends (...args: any[]) => any>(fn: T): T {
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
export { getSupabaseClient as supabase };

export default { query, get, run, transaction, initDatabase, saveDatabase, prepare, supabase: getSupabaseClient };
