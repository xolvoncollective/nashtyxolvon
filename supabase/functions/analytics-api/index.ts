import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nashty-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Simple in-memory cache (6 hour TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

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
    const url = new URL(req.url);
    const outletId = url.searchParams.get('outletId');
    const days = parseInt(url.searchParams.get('days') ?? '7', 10);
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);

    if (!outletId) {
      return new Response(JSON.stringify({ error: 'outletId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check cache
    const cacheKey = `top-products-${outletId}-${days}-${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get order items from last N days
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        product_name,
        quantity,
        unit_price,
        orders!inner(
          outlet_id,
          created_at,
          order_status,
          tenant_id
        )
      `)
      .eq('orders.outlet_id', outletId)
      .eq('orders.order_status', 'completed')
      .gte('orders.created_at', fromDate.toISOString())
      .lte('orders.created_at', now.toISOString());

    if (error) throw error;

    // Aggregate by product
    const aggregated = new Map<string, any>();
    (orderItems ?? []).forEach((item: any) => {
      const existing = aggregated.get(item.product_id);
      if (existing) {
        existing.salesCount += item.quantity || 0;
        existing.revenue += (item.unit_price || 0) * (item.quantity || 0);
      } else {
        aggregated.set(item.product_id, {
          productId: item.product_id,
          name: item.product_name || 'Unknown Product',
          salesCount: item.quantity || 0,
          revenue: (item.unit_price || 0) * (item.quantity || 0)
        });
      }
    });

    // Get previous period for trend calculation
    const previousFromDate = new Date(fromDate.getTime() - days * 24 * 60 * 60 * 1000);
    const { data: previousItems } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        orders!inner(outlet_id, created_at, order_status)
      `)
      .eq('orders.outlet_id', outletId)
      .eq('orders.order_status', 'completed')
      .gte('orders.created_at', previousFromDate.toISOString())
      .lt('orders.created_at', fromDate.toISOString());

    // Aggregate previous period
    const previousAggregated = new Map<string, number>();
    (previousItems ?? []).forEach((item: any) => {
      const count = previousAggregated.get(item.product_id) || 0;
      previousAggregated.set(item.product_id, count + (item.quantity || 0));
    });

    // Calculate trends
    const products = Array.from(aggregated.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(p => {
        const previousCount = previousAggregated.get(p.productId) || 0;
        const currentCount = p.salesCount;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercentage = 0;
        
        if (previousCount > 0) {
          trendPercentage = Math.round(((currentCount - previousCount) / previousCount) * 100);
          if (trendPercentage > 10) trend = 'up';
          else if (trendPercentage < -10) trend = 'down';
        } else if (currentCount > 0) {
          trend = 'up';
          trendPercentage = 100;
        }
        
        return {
          ...p,
          trend,
          trendPercentage
        };
      });

    const response = {
      success: true,
      period: {
        days,
        from: fromDate.toISOString(),
        to: now.toISOString()
      },
      products,
      totalSales: products.reduce((sum, p) => sum + p.salesCount, 0),
      totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0)
    };

    // Store in cache
    cache.set(cacheKey, { data: response, timestamp: Date.now() });

    // Also store in DB cache for persistence
    await supabase.from('analytics_cache').upsert({
      cache_key: cacheKey,
      outlet_id: outletId,
      data: response,
      expires_at: new Date(Date.now() + CACHE_TTL).toISOString()
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Analytics API error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
