import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let num = 'ORD-';
  for (let i = 0; i < 6; i++) {
    num += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return num;
}

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
    const payload = await req.json();
    const { action } = payload;

    // ─── Create Order ─────────────────────────────────────────────────────────
    if (action === 'create') {
      const {
        tenantId, outletId, userId, shiftId,
        orderType, tableNumber, items,
        subtotal, tax, discount, total,
        paymentMethod, paymentStatus,
        customerName, customerPhone
      } = payload;

      if (!tenantId || !outletId || !userId) {
        return new Response(JSON.stringify({ success: false, error: 'Missing required fields: tenantId, outletId, userId' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!items || items.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Order must have at least one item' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const orderNumber = generateOrderNumber();

      // Normalize order type to DB constraint
      let validOrderType: 'dine-in' | 'takeaway' = 'dine-in';
      if (orderType === 'takeaway' || orderType === 'take' || orderType === 'delivery') {
        validOrderType = 'takeaway';
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          tenant_id: tenantId,
          outlet_id: outletId,
          user_id: userId,
          shift_id: shiftId || null,
          order_number: orderNumber,
          order_type: validOrderType,
          table_number: tableNumber || null,
          subtotal: subtotal || 0,
          tax: tax || 0,
          discount: discount || 0,
          total: total || 0,
          payment_method: paymentMethod || 'cash',
          payment_status: paymentStatus || 'paid',
          order_status: 'pending',
          kitchen_status: 'pending',
          customer_name: customerName || null,
          customer_phone: customerPhone || null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      if (items.length > 0) {
        const orderItems = items.map((item: any) => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.name || item.product_name,
          quantity: item.qty || item.quantity,
          unit_price: item.price || item.unit_price,
          subtotal: (item.price || item.unit_price) * (item.qty || item.quantity),
          notes: item.notes || '',
          modifier_options: item.modifiers || []
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      return new Response(JSON.stringify({ success: true, order, orderNumber }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Get Orders ────────────────────────────────────────────────────────────
    if (action === 'get-orders') {
      const { tenantId, outletId, status, limit = 20 } = payload;

      if (!tenantId) {
        return new Response(JSON.stringify({ error: 'tenantId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let q = supabase.from('orders')
        .select('*, order_items(*)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (outletId) q = q.eq('outlet_id', outletId);
      if (status) q = q.eq('order_status', status);

      const { data, error } = await q;
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, orders: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Update Order Status ───────────────────────────────────────────────────
    if (action === 'update-status') {
      const { orderId, orderStatus, kitchenStatus } = payload;

      if (!orderId) {
        return new Response(JSON.stringify({ error: 'orderId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const updates: Record<string, string> = {};
      if (orderStatus) updates.order_status = orderStatus;
      if (kitchenStatus) updates.kitchen_status = kitchenStatus;

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, order: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: create, get-orders, update-status' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Orders API error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
