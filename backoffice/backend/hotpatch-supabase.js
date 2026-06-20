const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_6XFZqLgu52yyoX4uZ0thZA_CMHQM1H7';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const sql = `
CREATE OR REPLACE FUNCTION execute_sql(query_text text, query_params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  final_query text;
  i integer;
BEGIN
  final_query := query_text;
  
  -- HOT-PATCH: Replace dummy IDs with actual UUIDs
  final_query := replace(final_query, 'demo-tenant', '337db3a3-ba68-4da9-824a-1ad261197f58');
  final_query := replace(final_query, 'demo-outlet', 'd4ee75ff-f866-4fbc-baa9-95bba9af52ed');

  IF jsonb_array_length(query_params) > 0 THEN
    FOR i IN 0..jsonb_array_length(query_params) - 1 LOOP
      -- Hot-patch params as well
      IF query_params->>i = 'demo-tenant' THEN
        final_query := regexp_replace(final_query, '\\?', quote_literal('337db3a3-ba68-4da9-824a-1ad261197f58'), '');
      ELSIF query_params->>i = 'demo-outlet' THEN
        final_query := regexp_replace(final_query, '\\?', quote_literal('d4ee75ff-f866-4fbc-baa9-95bba9af52ed'), '');
      ELSE
        final_query := regexp_replace(final_query, '\\?', quote_literal(query_params->>i), '');
      END IF;
    END LOOP;
  END IF;

  -- HOT-PATCH: Handle INSERT statements which do not return rows directly
  IF final_query ILIKE 'INSERT%' OR final_query ILIKE 'UPDATE%' OR final_query ILIKE 'DELETE%' THEN
    -- Try to append RETURNING * if it does not have it
    IF final_query NOT ILIKE '%RETURNING *%' THEN
      final_query := final_query || ' RETURNING *';
    END IF;
  END IF;

  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || final_query || ') t'
  INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Provide a more descriptive error JSON
  RAISE EXCEPTION 'execute_sql failed: % | query: %', SQLERRM, final_query;
END;
$$;
  `;
  
  // Since we can't create functions easily via RPC if it throws, we can execute the creation via the existing exec_sql from migrations?
  // Wait, does exec_sql exist? Let's check migrate-via-api.ts. Yes, it uses `exec_sql`.
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.error('Error applying hotpatch:', error);
  } else {
    console.log('Hotpatch applied successfully!');
  }
}
run();
