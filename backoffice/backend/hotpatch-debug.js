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
      IF query_params->>i = 'demo-tenant' THEN
        final_query := regexp_replace(final_query, '\\?', quote_literal('337db3a3-ba68-4da9-824a-1ad261197f58'), '');
      ELSIF query_params->>i = 'demo-outlet' THEN
        final_query := regexp_replace(final_query, '\\?', quote_literal('d4ee75ff-f866-4fbc-baa9-95bba9af52ed'), '');
      ELSE
        final_query := regexp_replace(final_query, '\\?', quote_literal(query_params->>i), '');
      END IF;
    END LOOP;
  END IF;

  -- DEBUG: Always raise an exception to see what Railway is sending
  RAISE EXCEPTION 'DEBUG QUERY: %', final_query;
END;
$$;
  `;
  
  const { error } = await supabase.rpc('execute_sql', { query_text: sql });
  if (error) {
    console.error('Error applying hotpatch:', error);
  } else {
    console.log('Hotpatch applied successfully!');
  }
}
run();
