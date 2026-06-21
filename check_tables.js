const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mzucfndifneytbesirkx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM0MDUzNSwiZXhwIjoyMDk2OTE2NTM1fQ.blh08pJxW2CNkFjgVtWq_yTuEmTemFZaZuCKl-DM0M4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['costs', 'customers', 'rewards', 'point_transactions'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`[FAIL] ${table}:`, error.message);
    } else {
      console.log(`[PASS] ${table}: exists`);
    }
  }
}
checkTables();
