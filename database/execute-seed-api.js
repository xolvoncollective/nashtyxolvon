/**
 * Nashty OS - Execute Seed via Supabase REST API
 * Uses service role key to execute SQL
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM0MDUzNSwiZXhwIjoyMDk2OTE2NTM1fQ.blh08pJxW2CNkFjgVtWq_yTuEmTemFZaZuCKl-DM0M4';

const seedFiles = [
  'SEED_MASTER_REALISTIC.sql',
  'SEED_PART2_PRODUCTS.sql',
  'SEED_PART2B_BEVERAGES.sql',
  'SEED_PART2C_EXTRAS.sql',
  'SEED_PART3_MEMBERS_COSTS.sql'
];

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'mzucfndifneytbesirkx.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/execute_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode });
        } else {
          reject({
            success: false,
            status: res.statusCode,
            error: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function executeSeed() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         NASHTY OS - AUTOMATIC SEED EXECUTOR           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n🎯 Target: ${SUPABASE_URL}`);
  console.log(`📦 Files: ${seedFiles.length}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < seedFiles.length; i++) {
    const fileName = seedFiles[i];
    const filePath = path.join(__dirname, fileName);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${i + 1}/${seedFiles.length}] ${fileName}`);
    console.log('='.repeat(60));
    
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        failCount++;
        continue;
      }
      
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`📄 Read ${(sql.length / 1024).toFixed(1)} KB`);
      console.log(`⚡ Executing via REST API...`);
      
      const result = await executeSQL(sql);
      console.log(`✅ ${fileName} executed (status ${result.status})`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Failed: ${fileName}`);
      console.error(`   Error: ${error.error || error.message || JSON.stringify(error)}`);
      failCount++;
    }
    
    // Small delay
    if (i < seedFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                   EXECUTION COMPLETE                   ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Success: ${successCount}/${seedFiles.length}`);
  console.log(`   ❌ Failed:  ${failCount}/${seedFiles.length}`);
  
  if (failCount > 0) {
    console.log('\n⚠️  Some files failed. You may need to run them manually.');
  } else {
    console.log('\n🎉 All seed data executed!');
  }
}

executeSeed().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
