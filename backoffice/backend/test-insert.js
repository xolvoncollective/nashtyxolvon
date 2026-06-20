const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_6XFZqLgu52yyoX4uZ0thZA_CMHQM1H7';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabase.from('tenants').insert({ id: 'demo-tenant', name: 'Demo Tenant', slug: 'demo', status: 'active' });
  console.log('Error:', error);
}
run();
