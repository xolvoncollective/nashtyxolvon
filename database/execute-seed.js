#!/usr/bin/env node
/**
 * Nashty OS - Automatic Seed Executor
 * Executes all seed files to Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM0MDUzNSwiZXhwIjoyMDk2OTE2NTM1fQ.blh08pJxW2CNkFjgVtWq_yTuEmTemFZaZuCKl-DM0M4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Seed files in order
const seedFiles = [
  'SEED_MASTER_REALISTIC.sql',
  'SEED_PART2_PRODUCTS.sql',
  'SEED_PART2B_BEVERAGES.sql',
  'SEED_PART2C_EXTRAS.sql',
  'SEED_PART3_MEMBERS_COSTS.sql',
  'SEED_PART4_ORDERS.sql'
];

async function executeSQLFile(filePath) {
  console.log(`\n📄 Reading: ${path.basename(filePath)}`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`⚡ Executing SQL (${(sql.length / 1024).toFixed(1)} KB)...`);
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Error in ${path.basename(filePath)}:`, error.message);
      return false;
    }
    
    console.log(`✅ ${path.basename(filePath)} executed successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Exception in ${path.basename(filePath)}:`, err.message);
    return false;
  }
}

async function executeSeed() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         NASHTY OS - AUTOMATIC SEED EXECUTOR           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n🎯 Target: ${SUPABASE_URL}`);
  console.log(`📦 Files: ${seedFiles.length}`);
  
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < seedFiles.length; i++) {
    const fileName = seedFiles[i];
    const filePath = path.join(__dirname, fileName);
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[${i + 1}/${seedFiles.length}] ${fileName}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      failCount++;
      continue;
    }
    
    const success = await executeSQLFile(filePath);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log('\n⚠️  Continuing with next file...');
    }
    
    // Small delay between files
    if (i < seedFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                   EXECUTION COMPLETE                   ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Success: ${successCount}/${seedFiles.length}`);
  console.log(`   ❌ Failed:  ${failCount}/${seedFiles.length}`);
  console.log(`   ⏱️  Time:    ${duration}s`);
  
  if (failCount > 0) {
    console.log('\n⚠️  Some files failed. Check errors above.');
    process.exit(1);
  }
  
  console.log('\n🎉 All seed data executed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Login to backoffice: cashier.citra / nashty@2024');
  console.log('   2. Login to POS with PIN: 1234, 2345, 3456, 4567, 5678');
  console.log('   3. Check database for 3000-5000 orders over 90 days');
  console.log('   4. Verify 300 members and 95 products');
  
  process.exit(0);
}

// Execute
executeSeed().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
