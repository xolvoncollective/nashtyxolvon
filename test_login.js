const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg';

async function test() {
  const res = await fetch('https://mzucfndifneytbesirkx.supabase.co/functions/v1/auth-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      action: 'main-login',
      username: 'superadmin',
      password: 'nashty@2024',
      outletId: '71cb7d46-a33c-4a8f-bd9a-db4c57fa7d8e'
    })
  });
  const data = await res.json();
  console.log(data);
}
test();
