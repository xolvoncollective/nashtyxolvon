const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_6XFZqLgu52yyoX4uZ0thZA_CMHQM1H7';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('Testing RPC...');
  
  // Test direct query
  const { data: directData } = await supabase.from('categories').select('*');
  console.log('Direct query count:', directData?.length);
  console.log('Sample:', directData?.[0]);
  
  // Test RPC query
  const sql = `
      SELECT c.*
      FROM categories c
      WHERE c.tenant_id = 'demo-tenant'
  `;
  
  const { data: rpcData, error } = await supabase.rpc('execute_sql', {
    query_text: sql,
    query_params: []
  });
  
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC data type:', typeof rpcData);
    console.log('RPC data length:', Array.isArray(rpcData) ? rpcData.length : 'not array');
    console.log('RPC data:', rpcData);
  }
}
run();
