import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { supabaseAdmin } from './src/supabase/supabase-client';

// Load environment variables
dotenv.config();

async function runMigrationViaAPI() {
  try {
    console.log('🔄 Running Supabase migration via REST API...\n');

    // Read migration file
    const migrationPath = join(__dirname, '../../Production-Ready/Database/supabase-migration.sql');
    console.log('📄 Reading migration file:', migrationPath);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📊 Migration file size:', (migrationSQL.length / 1024).toFixed(2), 'KB');
    console.log('');

    // Split SQL into individual statements for better error handling
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Execute statements one by one
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      // Show progress for large operations
      if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE (?:TABLE|INDEX|TRIGGER|FUNCTION|TYPE|POLICY)\s+(?:IF NOT EXISTS\s+)?([^\s(]+)/i);
        if (match) {
          process.stdout.write(`\r[${i + 1}/${statements.length}] Creating ${match[1]}...`);
        }
      }

      try {
        // Use Supabase's query function
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          query: statement + ';'
        });

        if (error) {
          // Some errors are expected (e.g., "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate')) {
            // Skip these errors
          } else {
            errorCount++;
            errors.push(`Statement ${i + 1}: ${error.message}`);
          }
        } else {
          successCount++;
        }
      } catch (err: any) {
        errorCount++;
        errors.push(`Statement ${i + 1}: ${err.message}`);
      }
    }

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('═'.repeat(60));
    console.log(`✅ Successful: ${successCount} statements`);
    console.log(`❌ Failed: ${errorCount} statements`);
    console.log('');

    if (errors.length > 0 && errors.length < 10) {
      console.log('⚠️  Errors encountered:');
      errors.forEach(err => console.log(`   - ${err}`));
      console.log('');
    }

    // Verify tables were created
    console.log('🧪 Verifying tables...');
    const tables = [
      'tenants', 'outlets', 'users', 'categories', 'products',
      'orders', 'shifts', 'nashtycosts'
    ];

    let verifiedCount = 0;
    for (const table of tables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`   ✅ ${table}: ${count ?? 0} rows`);
          verifiedCount++;
        } else {
          console.log(`   ❌ ${table}: ${error.message}`);
        }
      } catch (err: any) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

    console.log('');
    console.log('═'.repeat(60));
    
    if (verifiedCount === tables.length) {
      console.log('✅ Migration completed successfully!');
      console.log('All core tables are ready to use.');
    } else {
      console.log('⚠️  Migration partially completed.');
      console.log(`${verifiedCount}/${tables.length} core tables verified.`);
      console.log('');
      console.log('💡 Tip: Run migration manually via Supabase Dashboard:');
      console.log('   1. Go to SQL Editor');
      console.log('   2. Copy-paste supabase-migration.sql');
      console.log('   3. Click Run');
    }
    
    console.log('═'.repeat(60));
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

runMigrationViaAPI();
