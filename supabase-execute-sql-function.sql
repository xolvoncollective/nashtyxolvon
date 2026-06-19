-- PostgreSQL function to execute dynamic SQL queries
-- This enables backward compatibility with SQLite-style query() calls

CREATE OR REPLACE FUNCTION public.execute_sql(
  query_text TEXT,
  query_params JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  param_value TEXT;
  final_query TEXT;
  i INT;
BEGIN
  -- Replace ? placeholders with $1, $2, etc for PostgreSQL
  final_query := query_text;
  
  -- PostgreSQL uses $1, $2 instead of ? for parameters
  -- If using ?, convert to $N format
  FOR i IN 0..(jsonb_array_length(query_params) - 1) LOOP
    param_value := query_params->>i;
    final_query := replace(final_query, '?', '$' || (i + 1)::text);
  END LOOP;
  
  -- Execute the query and return results as JSONB
  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || final_query || ') t'
  INTO result
  USING query_params;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error executing query: %', SQLERRM;
    RETURN '[]'::jsonb;
END;
$$;

-- Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT, JSONB) TO anon;
