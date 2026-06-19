import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

// Load environment variables
dotenv.config();

const client = new Client({
  host: process.env.SUPABASE_DB_HOST || 'db.mzucfndifneytbesirkx.supabase.co',
  port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔄 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read migration file
    const migrationPath = join(__dirname, '../../Production-Ready/Database/supabase-migration.sql');
    console.log('📄 Reading migration file:', migrationPath);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Running migration...\n');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!');
    
    // Test query to verify
    console.log('\n🧪 Testing connection with sample query...');
    const result = await client.query('SELECT COUNT(*) as count FROM tenants');
    console.log(`✅ Found ${result.rows[0].count} tenants in database\n`);
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
