// ============================================
// NASHTY OS - EXPORT TO CSV EDGE FUNCTION
// Export audit logs dan transaksi ke CSV
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nashty-token',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { type, dateFrom, dateTo, tenantId, outletId } = await req.json()

    let csvContent = ''
    let filename = ''

    // ============================================
    // EXPORT TRANSAKSI
    // ============================================
    if (type === 'transactions') {
      let query = supabaseClient
        .from('orders')
        .select(`
          id,
          order_number,
          order_type,
          order_status,
          table_number,
          customer_name,
          customer_phone,
          subtotal,
          discount,
          tax,
          service_charge,
          total,
          payment_method,
          cashier_name,
          created_at,
          tenant_id,
          outlet_id
        `)
        .order('created_at', { ascending: false })

      if (tenantId) query = query.eq('tenant_id', tenantId)
      if (outletId) query = query.eq('outlet_id', outletId)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      const { data: orders, error } = await query.limit(5000)

      if (error) throw error

      // CSV Header
      csvContent = 'Order Number,Date,Time,Type,Status,Table,Customer,Phone,Subtotal,Discount,Tax,Service,Total,Payment Method,Cashier,Tenant ID,Outlet ID\n'

      // CSV Rows
      orders?.forEach((order) => {
        const date = new Date(order.created_at)
        const dateStr = date.toISOString().split('T')[0]
        const timeStr = date.toISOString().split('T')[1].substring(0, 8)

        csvContent += [
          order.order_number,
          dateStr,
          timeStr,
          order.order_type || '-',
          order.order_status || '-',
          order.table_number || '-',
          order.customer_name || '-',
          order.customer_phone || '-',
          order.subtotal || 0,
          order.discount || 0,
          order.tax || 0,
          order.service_charge || 0,
          order.total || 0,
          order.payment_method || '-',
          order.cashier_name || '-',
          order.tenant_id || '-',
          order.outlet_id || '-',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',') + '\n'
      })

      filename = `transactions_${dateFrom || 'all'}_${dateTo || 'now'}.csv`
    }

    // ============================================
    // EXPORT AUDIT LOG
    // ============================================
    else if (type === 'audit_log') {
      let query = supabaseClient
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (tenantId) query = query.eq('tenant_id', tenantId)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      const { data: logs, error } = await query.limit(10000)

      if (error) throw error

      // CSV Header
      csvContent = 'ID,Timestamp,User,Action,Entity Type,Entity ID,IP Address,User Agent,Changes,Tenant ID\n'

      // CSV Rows
      logs?.forEach((log) => {
        csvContent += [
          log.id,
          log.created_at,
          log.user_id || '-',
          log.action || '-',
          log.entity_type || '-',
          log.entity_id || '-',
          log.ip_address || '-',
          log.user_agent || '-',
          JSON.stringify(log.changes || {}),
          log.tenant_id || '-',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',') + '\n'
      })

      filename = `audit_log_${dateFrom || 'all'}_${dateTo || 'now'}.csv`
    }

    // ============================================
    // EXPORT ORDER ITEMS (DETAIL TRANSAKSI)
    // ============================================
    else if (type === 'order_items') {
      let query = supabaseClient
        .from('order_items')
        .select(`
          *,
          orders!inner(order_number, created_at, tenant_id, outlet_id)
        `)
        .order('created_at', { ascending: false })

      if (tenantId) query = query.eq('orders.tenant_id', tenantId)
      if (outletId) query = query.eq('orders.outlet_id', outletId)
      if (dateFrom) query = query.gte('orders.created_at', dateFrom)
      if (dateTo) query = query.lte('orders.created_at', dateTo)

      const { data: items, error } = await query.limit(10000)

      if (error) throw error

      // CSV Header
      csvContent = 'Order Number,Date,Product Name,Quantity,Unit Price,Subtotal,Notes,Status,Tenant ID,Outlet ID\n'

      // CSV Rows
      items?.forEach((item) => {
        const date = new Date(item.orders.created_at)
        const dateStr = date.toISOString().split('T')[0]

        csvContent += [
          item.orders.order_number,
          dateStr,
          item.product_name || '-',
          item.quantity || 0,
          item.unit_price || 0,
          item.subtotal || 0,
          item.notes || '-',
          item.item_status || '-',
          item.orders.tenant_id || '-',
          item.orders.outlet_id || '-',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',') + '\n'
      })

      filename = `order_items_${dateFrom || 'all'}_${dateTo || 'now'}.csv`
    }

    // ============================================
    // EXPORT MENU
    // ============================================
    else if (type === 'menu') {
      let query = supabaseClient
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (tenantId) query = query.eq('tenant_id', tenantId)

      const { data: menu, error } = await query.limit(5000)

      if (error) throw error

      // CSV Header
      csvContent = 'ID,Name,Category,Price,Description,Status,SKU,Created At,Tenant ID\n'

      // CSV Rows
      menu?.forEach((item) => {
        csvContent += [
          item.id,
          item.name || '-',
          item.category_name || '-',
          item.price || 0,
          item.description || '-',
          item.status || '-',
          item.sku || '-',
          item.created_at || '-',
          item.tenant_id || '-',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',') + '\n'
      })

      filename = `menu_${new Date().toISOString().split('T')[0]}.csv`
    }

    // ============================================
    // RETURN CSV FILE
    // ============================================
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
