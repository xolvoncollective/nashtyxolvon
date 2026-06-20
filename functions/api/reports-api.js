import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env }) {
  const supabaseUrl = env.SUPABASE_URL || '';
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, tenantId, outletId, dateFrom, dateTo } = await request.json();

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'tenantId required' }), { status: 400, headers: corsHeaders });
    }

    if (action === 'sales') {
      let q = supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid')
        .neq('order_status', 'cancelled');

      if (outletId) q = q.eq('outlet_id', outletId);
      if (dateFrom) q = q.gte('created_at', `${dateFrom}T00:00:00Z`);
      if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59Z`);

      const { data: orders, error } = await q;
      if (error) throw error;

      const dailyMap = {};
      
      orders.forEach(o => {
        const date = o.created_at.split('T')[0];
        if (!dailyMap[date]) {
          dailyMap[date] = { date, count: 0, revenue: 0 };
        }
        dailyMap[date].count++;
        dailyMap[date].revenue += (o.total || 0);
      });

      const reportData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

      return new Response(JSON.stringify({ success: true, data: reportData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
