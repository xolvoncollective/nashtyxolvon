const { Client } = require('pg');
const client = new Client({
  host: 'db.mzucfndifneytbesirkx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'ZaidunkMarginpublishable',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
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
  IF jsonb_array_length(query_params) > 0 THEN
    FOR i IN 0..jsonb_array_length(query_params) - 1 LOOP
      -- Replace the FIRST occurrence of ? with the quoted literal.
      final_query := regexp_replace(final_query, '\\?', quote_literal(query_params->>i), '');
    END LOOP;
  END IF;

  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || final_query || ') t'
  INTO result;
  
  RETURN result;
END;
$$;
  `;
  await client.query(sql);
  console.log('RPC updated!');
  await client.end();
}

run().catch(console.error);
