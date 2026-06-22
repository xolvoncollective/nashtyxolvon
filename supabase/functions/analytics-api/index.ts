// ==========================================
// ANALYTICS API - Supabase Edge Function
// Date: 2026-06-22
// Purpose: Top products analytics for auto-suggest
// ==========================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user's outlet_id from staff table
    const { data: staff } = await supabaseClient
      .from('staff')
      .select('outlet_id, outlets(tenant_id)')
      .eq('user_id', user.id)
      .single()

    if (!staff) {
      return new Response(
        JSON.stringify({ error: 'Staff record not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const outletId = staff.outlet_id
    const tenantId = staff.outlets?.tenant_id

    const url = new URL(req.url)
    const method = req.method

    // ===== GET /analytics-api/top-products - Get top 20 products =====
    if (method === 'GET' && url.pathname === '/analytics-api/top-products') {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Try to get outlet-specific analytics first
      const { data: outletOrders, count: outletOrderCount } = await supabaseClient
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('outlet_id', outletId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('order_status', 'paid')

      // If outlet has < 100 transactions, fallback to tenant-level
      const useTenantLevel = (outletOrderCount || 0) < 100

      let topProducts

      if (useTenantLevel && tenantId) {
        // Tenant-level aggregation
        const { data, error } = await supabaseClient.rpc('get_top_products_tenant', {
          p_tenant_id: tenantId,
          p_days: 7,
          p_limit: 20,
        })

        if (error) {
          // Fallback to direct query if RPC not available
          const { data: items } = await supabaseClient
            .from('order_items')
            .select(`
              product_id,
              quantity,
              products (
                id,
                name,
                price,
                image_url,
                category_id
              ),
              orders!inner (
                outlet_id,
                order_status,
                created_at,
                outlets!inner (
                  tenant_id
                )
              )
            `)
            .eq('orders.outlets.tenant_id', tenantId)
            .eq('orders.order_status', 'paid')
            .gte('orders.created_at', sevenDaysAgo.toISOString())

          // Aggregate in memory
          const productStats = new Map()
          
          items?.forEach((item) => {
            const productId = item.product_id
            if (!productStats.has(productId)) {
              productStats.set(productId, {
                product_id: productId,
                product: item.products,
                total_sold: 0,
                order_count: 0,
              })
            }
            const stats = productStats.get(productId)
            stats.total_sold += item.quantity
            stats.order_count += 1
          })

          topProducts = Array.from(productStats.values())
            .sort((a, b) => b.total_sold - a.total_sold)
            .slice(0, 20)
        } else {
          topProducts = data
        }
      } else {
        // Outlet-specific aggregation
        const { data: items } = await supabaseClient
          .from('order_items')
          .select(`
            product_id,
            quantity,
            products (
              id,
              name,
              price,
              image_url,
              category_id
            ),
            orders!inner (
              outlet_id,
              order_status,
              created_at
            )
          `)
          .eq('orders.outlet_id', outletId)
          .eq('orders.order_status', 'paid')
          .gte('orders.created_at', sevenDaysAgo.toISOString())

        // Aggregate in memory
        const productStats = new Map()
        
        items?.forEach((item) => {
          const productId = item.product_id
          if (!productStats.has(productId)) {
            productStats.set(productId, {
              product_id: productId,
              product: item.products,
              total_sold: 0,
              order_count: 0,
            })
          }
          const stats = productStats.get(productId)
          stats.total_sold += item.quantity
          stats.order_count += 1
        })

        topProducts = Array.from(productStats.values())
          .sort((a, b) => b.total_sold - a.total_sold)
          .slice(0, 20)
      }

      // Add trending indicators (simplified - compare to previous 7 days)
      const enrichedProducts = topProducts.map((product, index) => ({
        ...product,
        rank: index + 1,
        trend: index < 5 ? 'up' : index < 15 ? 'stable' : 'down', // Simplified trending
        data_source: useTenantLevel ? 'tenant' : 'outlet',
      }))

      return new Response(
        JSON.stringify({
          products: enrichedProducts,
          metadata: {
            outlet_id: outletId,
            tenant_id: tenantId,
            data_source: useTenantLevel ? 'tenant' : 'outlet',
            days: 7,
            outlet_transaction_count: outletOrderCount || 0,
            cached_at: new Date().toISOString(),
            cache_ttl: 21600, // 6 hours in seconds
          },
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=21600', // Cache for 6 hours
          },
        }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
