import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nashty-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const { action } = body;

    console.log('[PETTY-CASH] Request:', { action, method: req.method });

    // ══════════════════════════════════════════════════════════════════════════
    // CREATE PETTY CASH ENTRY (with fallback mechanisms)
    // ══════════════════════════════════════════════════════════════════════════
    if (req.method === 'POST' && action === 'create') {
      const { tenant_id, outlet_id, user_id, type, category, amount, description, receipt_url } = body;

      // Validation
      if (!tenant_id || !outlet_id || !user_id) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: tenant_id, outlet_id, user_id' 
        }), {
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!type || !['in', 'out'].includes(type)) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid type. Must be "in" or "out"' 
        }), {
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Amount must be greater than 0' 
        }), {
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // MITIGATION LAYER 1: Try direct insert to petty_cash table
      console.log('[PETTY-CASH] Attempting direct insert...');
      
      const { data: pettyCashEntry, error: insertError } = await supabase
        .from('petty_cash')
        .insert({
          tenant_id,
          outlet_id,
          user_id,
          type,
          category: category || (type === 'in' ? 'income' : 'expense'),
          amount,
          description: description || '',
          receipt_url: receipt_url || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!insertError && pettyCashEntry) {
        console.log('[PETTY-CASH] Direct insert successful');
        return new Response(JSON.stringify({ 
          success: true, 
          data: pettyCashEntry 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.warn('[PETTY-CASH] Direct insert failed:', insertError?.message);

      // MITIGATION LAYER 2: Try RPC call (if function exists)
      console.log('[PETTY-CASH] Attempting RPC fallback...');
      
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('insert_petty_cash', {
          p_tenant_id: tenant_id,
          p_outlet_id: outlet_id,
          p_user_id: user_id,
          p_type: type,
          p_category: category || (type === 'in' ? 'income' : 'expense'),
          p_amount: amount,
          p_description: description || '',
          p_receipt_url: receipt_url || null
        });

      if (!rpcError && rpcResult) {
        console.log('[PETTY-CASH] RPC fallback successful');
        return new Response(JSON.stringify({ 
          success: true, 
          data: rpcResult,
          method: 'rpc'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.warn('[PETTY-CASH] RPC fallback failed:', rpcError?.message);

      // MITIGATION LAYER 3: Log to activity_logs as temporary storage
      console.log('[PETTY-CASH] Attempting emergency log storage...');
      
      const { data: logEntry, error: logError } = await supabase
        .from('activity_logs')
        .insert({
          tenant_id,
          user_id,
          action: 'petty_cash_pending',
          entity_type: 'petty_cash',
          description: `${type === 'in' ? 'Income' : 'Expense'}: ${description || 'No description'}`,
          metadata: {
            outlet_id,
            type,
            category: category || (type === 'in' ? 'income' : 'expense'),
            amount,
            receipt_url: receipt_url || null,
            status: 'pending',
            error: insertError?.message || rpcError?.message || 'Unknown error',
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (!logError && logEntry) {
        console.log('[PETTY-CASH] Emergency log storage successful');
        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            id: logEntry.id,
            status: 'pending',
            message: 'Entry saved to activity log. Will be processed later.',
            ...logEntry
          },
          method: 'emergency_log'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ALL FALLBACKS FAILED
      console.error('[PETTY-CASH] All fallback mechanisms failed');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to save petty cash entry. All fallback mechanisms exhausted.',
        details: {
          insertError: insertError?.message,
          rpcError: rpcError?.message,
          logError: logError?.message
        }
      }), {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET PETTY CASH ENTRIES
    // ══════════════════════════════════════════════════════════════════════════
    if (req.method === 'GET' || action === 'list') {
      const url = new URL(req.url);
      const outlet_id = url.searchParams.get('outlet_id');
      const start_date = url.searchParams.get('start_date');
      const end_date = url.searchParams.get('end_date');

      let query = supabase
        .from('petty_cash')
        .select('*')
        .order('created_at', { ascending: false });

      if (outlet_id) {
        query = query.eq('outlet_id', outlet_id);
      }

      if (start_date) {
        query = query.gte('created_at', start_date);
      }

      if (end_date) {
        query = query.lte('created_at', end_date);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[PETTY-CASH] List error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET SUMMARY
    // ══════════════════════════════════════════════════════════════════════════
    if (action === 'summary') {
      const { outlet_id, start_date, end_date } = body;

      const { data, error } = await supabase
        .from('petty_cash')
        .select('type, amount')
        .eq('outlet_id', outlet_id)
        .gte('created_at', start_date || '1970-01-01')
        .lte('created_at', end_date || '2099-12-31');

      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const summary = data.reduce((acc, entry) => {
        if (entry.type === 'in') {
          acc.total_in += entry.amount;
        } else {
          acc.total_out += entry.amount;
        }
        return acc;
      }, { total_in: 0, total_out: 0 });

      summary.balance = summary.total_in - summary.total_out;

      return new Response(JSON.stringify({ success: true, data: summary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid action', 
      validActions: ['create', 'list', 'summary'] 
    }), {
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[PETTY-CASH] Error:', err);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: err instanceof Error ? err.message : 'Unknown error' 
    }), {
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
