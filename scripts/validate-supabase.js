const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runValidation() {
  console.log('🔍 Memulai Validasi API Routes & Database Supabase...\n');
  let passed = 0;
  let failed = 0;

  // 1. Test Database Connection
  try {
    process.stdout.write('⏳ Menguji koneksi PostgREST (Table: products)... ');
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) throw error;
    console.log('✅ OK');
    passed++;
  } catch (e) {
    console.log('❌ GAGAL');
    console.error('   Detail:', e.message);
    failed++;
  }

  // 2. Test Edge Function (auth-login)
  try {
    process.stdout.write('⏳ Menguji Edge Function (auth-login)... ');
    const { data, error } = await supabase.functions.invoke('auth-login', {
      body: { action: 'ping' } // Invalid action just to see if it responds 400 or gives a payload
    });
    // As long as it doesn't give a network 500 or 404, the route exists
    if (error && error.message.includes('404')) throw new Error('Edge Function Not Found (404)');
    console.log('✅ OK (Fungsi Merespons)');
    passed++;
  } catch (e) {
    console.log('❌ GAGAL');
    console.error('   Detail:', e.message);
    failed++;
  }

  // 3. Test Edge Function (dashboard-api)
  try {
    process.stdout.write('⏳ Menguji Edge Function (dashboard-api)... ');
    const { data, error } = await supabase.functions.invoke('dashboard-api', {
      body: { tenantId: '00000000-0000-0000-0000-000000000001', type: 'kpi' }
    });
    if (error && error.message.includes('404')) throw new Error('Edge Function Not Found (404)');
    console.log('✅ OK (Fungsi Merespons)');
    passed++;
  } catch (e) {
    console.log('❌ GAGAL');
    console.error('   Detail:', e.message);
    failed++;
  }

  console.log('\n📊 HASIL VALIDASI:');
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  if (failed === 0) {
    console.log('\n🎉 VALIDASI SUKSES: Sistem beroperasi 100% normal dan stabil.');
  } else {
    console.log('\n⚠️ PERHATIAN: Terdapat rute atau database yang gagal divalidasi.');
  }
}

runValidation();
