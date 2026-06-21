const supabase = require('@supabase/supabase-js');

const SUPABASE_URL = "https://mzucfndifneytbesirkx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg";
// Use service role to bypass or we can test with anon key to see if it fails.
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM0MDUzNSwiZXhwIjoyMDk2OTE2NTM1fQ.blh08pJxW2CNkFjgVtWq_yTuEmTemFZaZuCKl-DM0M4";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anonClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("Testing products query with ANON KEY (simulating POS user without JWT)...");
  
  const { data, error } = await anonClient
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          modifier_groups:product_modifiers(
            modifier_group:modifier_groups(
              id,
              name,
              type,
              required,
              max_select,
              options:modifier_options(*)
            )
          )
        `)
        .eq('tenant_id', '00000000-0000-0000-0000-000000000001')
        .eq('is_active', true);
        
  console.log("ANON RESULT:", { data: data ? data.length : null, error });
}

test();
