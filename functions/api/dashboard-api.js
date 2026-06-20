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
    const { action, tenantId, outletId, dateFrom, dateTo, limit } = await request.json();

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'tenantId required' }), { status: 400, headers: corsHeaders });
    }

    if (action === 'kpi') {
      let q = supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid')
        .neq('order_status', 'cancelled');

      if (outletId) q = q.eq('outlet_id', outletId);
      
      const { data: allOrders, error } = await q;
      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = allOrders.filter(o => o.created_at.startsWith(today));
      
      const grossRevenue = todayOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
      const totalDiscounts = todayOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
      const netRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      
      let costQ = supabase.from('nashtycosts').select('amount').eq('tenant_id', tenantId);
      if (outletId) costQ = costQ.eq('outlet_id', outletId);
      const { data: costs } = await costQ;
      
      const totalCosts = (costs || []).reduce((sum, c) => sum + (c.amount || 0), 0);

      return new Response(JSON.stringify({
        success: true,
        data: {
          date: today,
          totalOrders: todayOrders.length,
          grossRevenue,
          netRevenue,
          totalDiscounts,
          averageOrderValue: todayOrders.length ? (netRevenue / todayOrders.length) : 0,
          totalCosts,
          grossProfit: netRevenue - totalCosts,
          yesterday: { total_sales: 0 },
          growth: 0,
          topProducts: [],
          salesByType: []
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'recent-orders') {
      let q = supabase
        .from('orders')
        .select('*, users!orders_user_id_fkey(name)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit || 10);
        
      if (outletId) q = q.eq('outlet_id', outletId);

      const { data, error } = await q;
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, orders: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'weekly-chart') {
      let q = supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid')
        .neq('order_status', 'cancelled');
        
      if (outletId) q = q.eq('outlet_id', outletId);
      const { data, error } = await q;
      if (error) throw error;
      
      const chartData = [0, 0, 0, 0, 0, 0, 0];
      const today = new Date();
      data.forEach(o => {
         const orderDate = new Date(o.created_at);
         const diffTime = Math.abs(today - orderDate);
         const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
         if (diffDays < 7) {
             const dayIndex = 6 - diffDays;
             chartData[dayIndex] += (o.total || 0);
         }
      });

      return new Response(JSON.stringify({ success: true, data: chartData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
