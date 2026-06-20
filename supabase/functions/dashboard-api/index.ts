import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Support both GET (with query params) and POST (with body)
    let action: string, tenantId: string, outletId: string, limit: number;

    if (req.method === 'POST') {
      const body = await req.json();
      action = body.action;
      tenantId = body.tenantId;
      outletId = body.outletId;
      limit = parseInt(body.limit || '10', 10);
    } else {
      const url = new URL(req.url);
      action = url.searchParams.get('action') ?? 'kpi';
      tenantId = url.searchParams.get('tenantId') ?? '';
      outletId = url.searchParams.get('outletId') ?? '';
      limit = parseInt(url.searchParams.get('limit') ?? '10', 10);
    }

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'tenantId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── KPI Action ──────────────────────────────────────────────────────────
    if (action === 'kpi') {
      const todayString = new Date().toISOString().split('T')[0];
      const startOfDay = `${todayString}T00:00:00.000Z`;
      const startOfYesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0] + 'T00:00:00.000Z';

      let q = supabase.from('orders')
        .select('subtotal, discount, total, order_type, payment_method')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid')
        .neq('order_status', 'cancelled')
        .gte('created_at', startOfDay);

      if (outletId) q = q.eq('outlet_id', outletId);
      const { data: todayOrders, error } = await q;
      if (error) throw error;

      let yq = supabase.from('orders')
        .select('total')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid')
        .neq('order_status', 'cancelled')
        .gte('created_at', startOfYesterday)
        .lt('created_at', startOfDay);

      if (outletId) yq = yq.eq('outlet_id', outletId);
      const { data: yesterdayOrders } = await yq;

      const orders = todayOrders ?? [];
      const yOrders = yesterdayOrders ?? [];
      const grossRevenue = orders.reduce((s: number, o: any) => s + (o.subtotal || 0), 0);
      const totalDiscounts = orders.reduce((s: number, o: any) => s + (o.discount || 0), 0);
      const netRevenue = orders.reduce((s: number, o: any) => s + (o.total || 0), 0);
      const yesterdayRevenue = yOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
      const growth = yesterdayRevenue > 0 ? ((netRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

      // Payment method breakdown
      const byPayment: Record<string, { count: number; revenue: number }> = {};
      orders.forEach((o: any) => {
        const m = o.payment_method || 'cash';
        if (!byPayment[m]) byPayment[m] = { count: 0, revenue: 0 };
        byPayment[m].count++;
        byPayment[m].revenue += o.total || 0;
      });

      return new Response(JSON.stringify({
        success: true,
        data: {
          date: todayString,
          totalOrders: orders.length,
          grossRevenue,
          netRevenue,
          totalDiscounts,
          averageOrderValue: orders.length ? netRevenue / orders.length : 0,
          growth: Math.round(growth * 10) / 10,
          yesterday: { totalOrders: yOrders.length, revenue: yesterdayRevenue },
          salesByPayment: Object.entries(byPayment).map(([method, d]) => ({ method, ...d }))
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── Recent Orders Action ─────────────────────────────────────────────────
    if (action === 'recent-orders') {
      let q = supabase
        .from('orders')
        .select('id, order_number, order_type, total, payment_status, order_status, created_at, table_number, customer_name')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (outletId) q = q.eq('outlet_id', outletId);

      const { data, error } = await q;
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, orders: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Weekly Chart Action ──────────────────────────────────────────────────
    if (action === 'weekly-chart') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] + 'T00:00:00.000Z';

      let q = supabase
        .from('orders')
        .select('total, created_at')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid')
        .neq('order_status', 'cancelled')
        .gte('created_at', sevenDaysAgo);

      if (outletId) q = q.eq('outlet_id', outletId);
      const { data, error } = await q;
      if (error) throw error;

      const chartData = [0, 0, 0, 0, 0, 0, 0];
      const labels: string[] = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 86400000);
        labels.push(d.toLocaleDateString('id-ID', { weekday: 'short' }));
      }

      (data || []).forEach((o: any) => {
        const orderDate = new Date(o.created_at);
        const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / 86400000);
        if (diffDays < 7) {
          chartData[6 - diffDays] += o.total || 0;
        }
      });

      return new Response(JSON.stringify({ success: true, data: chartData, labels }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: kpi, recent-orders, weekly-chart' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Dashboard API error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
