import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let hasSupabaseConfig = true;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    hasSupabaseConfig = false;
  }
}

if (!hasSupabaseConfig) {
  console.warn('⚠️ Supabase environment variables are missing. Using local SQLite mode.');
}

// Create Supabase clients
const supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'dummy-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key';

// Client for public operations (available to frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

// Admin client for server-side operations (has elevated permissions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Direct PostgreSQL connection (for complex queries)
export const dbConfig = {
  host: process.env.SUPABASE_DB_HOST || 'db.mzucfndifneytbesirkx.supabase.co',
  port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || 'ZaidunkMarginpublishable',
  ssl: process.env.SUPABASE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

console.log('✅ Supabase client initialized successfully');

// Helper functions
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return false;
  }
}

export async function executeQuery(query: string, params: any[] = []) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      query_text: query,
      query_params: params 
    });

    if (error) {
      console.error('❌ Query execution failed:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error executing query:', error);
    throw error;
  }
}

// Auth helpers
export interface AdminSession {
  id: string;
  username: string;
  role: string;
  tenantId: string;
  createdAt: Date;
}

export async function validateAdminCredentials(username: string, password: string): Promise<AdminSession | null> {
  try {
    // Check all 5 admin users
    const adminUsers = [
      { id: 'admin-1', username: 'admin1', password: 'admin1' },
      { id: 'admin-2', username: 'admin2', password: 'admin2' },
      { id: 'admin-3', username: 'admin3', password: 'admin3' },
      { id: 'admin-4', username: 'admin4', password: 'admin4' },
      { id: 'admin-5', username: 'admin5', password: 'admin5' }
    ];
    
    // Also check environment variables if defined
    for (let i = 1; i <= 5; i++) {
      const envVar = process.env[`ADMIN_USER_${i}`];
      if (envVar) {
        const [envUsername, envPassword] = envVar.split(':');
        adminUsers.push({
          id: `admin-env-${i}`,
          username: envUsername,
          password: envPassword
        });
      }
    }
    
    // Find matching admin
    const admin = adminUsers.find(user => 
      user.username === username && user.password === password
    );
    
    if (admin) {
      // Create session data
      return {
        id: admin.id,
        username: admin.username,
        role: 'admin',
        tenantId: 'demo-tenant',
        createdAt: new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error validating admin credentials:', error);
    return null;
  }
}

export async function createAdminSessionToken(session: AdminSession): Promise<string> {
  const jwt = require('jsonwebtoken');
  const jwtSecret = process.env.JWT_SECRET || 'nashty-super-secret-key-2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  
  const token = jwt.sign(
    {
      id: session.id,
      username: session.username,
      role: session.role,
      tenantId: session.tenantId,
      createdAt: session.createdAt
    },
    jwtSecret,
    { expiresIn }
  );
  
  return token;
}

export async function validateAdminSessionToken(token: string): Promise<AdminSession | null> {
  try {
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'nashty-super-secret-key-2026';
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      tenantId: decoded.tenantId,
      createdAt: new Date(decoded.createdAt)
    };
  } catch (error) {
    console.error('❌ Error validating session token:', error);
    return null;
  }
}
