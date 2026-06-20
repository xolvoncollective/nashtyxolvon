const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_6XFZqLgu52yyoX4uZ0thZA_CMHQM1H7';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: cData } = await supabase.from('categories').select('id, name, tenant_id');
  console.log('Categories:', cData);
  
  const { data: tData } = await supabase.from('tenants').select('id, name');
  console.log('Tenants:', tData);
  
  const { data: oData } = await supabase.from('outlets').select('id, name, tenant_id');
  console.log('Outlets:', oData);
}
run();
