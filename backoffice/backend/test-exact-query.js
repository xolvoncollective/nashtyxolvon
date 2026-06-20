const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_6XFZqLgu52yyoX4uZ0thZA_CMHQM1H7';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const sql = `
      SELECT c.*, 
        COUNT(DISTINCT p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      WHERE c.tenant_id = '337db3a3-ba68-4da9-824a-1ad261197f58' AND c.status = 'active'
      GROUP BY c.id
      ORDER BY c.display_order, c.name
  `;
  
  const { data, error } = await supabase.rpc('execute_sql', {
    query_text: sql,
    query_params: []
  });
  
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC data:', data);
  }
}
run();
