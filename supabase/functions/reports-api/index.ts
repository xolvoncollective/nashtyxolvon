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
    let action: string, tenantId: string, outletId: string, dateFrom: string, dateTo: string, groupBy: string, limit: number;

    if (req.method === 'POST') {
      const body = await req.json();
      action = body.action ?? 'sales';
      tenantId = body.tenantId;
      outletId = body.outletId ?? '';
      dateFrom = body.dateFrom ?? '';
      dateTo = body.dateTo ?? '';
      groupBy = body.groupBy ?? 'day';
      limit = parseInt(body.limit ?? '20', 10);
    } else {
      const url = new URL(req.url);
      action = url.searchParams.get('action') ?? 'sales';
      tenantId = url.searchParams.get('tenantId') ?? '';
      outletId = url.searchParams.get('outletId') ?? '';
      dateFrom = url.searchParams.get('dateFrom') ?? '';
      dateTo = url.searchParams.get('dateTo') ?? '';
      groupBy = url.searchParams.get('groupBy') ?? 'day';
      limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    }

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'tenantId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Sales Report ─────────────────────────────────────────────────────────
    if (action === 'sales') {
      let q = supabase
        .from('orders')
        .select('id, total, subtotal, discount, tax, payment_method, order_type, created_at, order_status')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid')
        .neq('order_status', 'cancelled')
        .order('created_at', { ascending: true });

      if (outletId) q = q.eq('outlet_id', outletId);
      if (dateFrom) q = q.gte('created_at', `${dateFrom}T00:00:00Z`);
      if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59Z`);

      const { data: orders, error } = await q;
      if (error) throw error;

      const allOrders = orders ?? [];

      // Group by day/week/month
      const grouped: Record<string, { date: string; count: number; revenue: number; discount: number }> = {};
      allOrders.forEach((o: any) => {
        const d = new Date(o.created_at);
        let key: string;
        if (groupBy === 'week') {
          const ws = new Date(d);
          ws.setDate(d.getDate() - d.getDay());
          key = ws.toISOString().split('T')[0];
        } else if (groupBy === 'month') {
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        } else {
          key = o.created_at.split('T')[0];
        }

        if (!grouped[key]) grouped[key] = { date: key, count: 0, revenue: 0, discount: 0 };
        grouped[key].count++;
        grouped[key].revenue += o.total || 0;
        grouped[key].discount += o.discount || 0;
      });

      const reportData = Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));

      const totalRevenue = allOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
      const totalDiscount = allOrders.reduce((s: number, o: any) => s + (o.discount || 0), 0);

      // By payment method
      const byPayment: Record<string, { count: number; revenue: number }> = {};
      allOrders.forEach((o: any) => {
        const m = o.payment_method || 'cash';
        if (!byPayment[m]) byPayment[m] = { count: 0, revenue: 0 };
        byPayment[m].count++;
        byPayment[m].revenue += o.total || 0;
      });

      return new Response(JSON.stringify({
        success: true,
        summary: {
          totalRevenue,
          totalOrders: allOrders.length,
          totalDiscount,
          averageOrderValue: allOrders.length > 0 ? totalRevenue / allOrders.length : 0
        },
        data: reportData,
        byPaymentMethod: Object.entries(byPayment).map(([method, d]) => ({ method, ...d }))
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── Top Products Report ──────────────────────────────────────────────────
    if (action === 'top-products') {
      let q = supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          quantity,
          subtotal,
          orders!inner(outlet_id, created_at, payment_status, order_status, tenant_id)
        `)
        .eq('orders.tenant_id', tenantId)
        .eq('orders.payment_status', 'paid')
        .neq('orders.order_status', 'cancelled');

      if (outletId) q = q.eq('orders.outlet_id', outletId);
      if (dateFrom) q = q.gte('orders.created_at', `${dateFrom}T00:00:00Z`);
      if (dateTo) q = q.lte('orders.created_at', `${dateTo}T23:59:59Z`);

      const { data: items, error } = await q;
      if (error) throw error;

      const productMap: Record<string, any> = {};
      (items ?? []).forEach((item: any) => {
        const pid = item.product_id;
        if (!productMap[pid]) {
          productMap[pid] = { productId: pid, name: item.product_name, quantity: 0, revenue: 0 };
        }
        productMap[pid].quantity += item.quantity || 0;
        productMap[pid].revenue += item.subtotal || 0;
      });

      const products = Object.values(productMap)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, limit);

      return new Response(JSON.stringify({ success: true, products }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: sales, top-products' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Reports API error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
