import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let num = 'ORD-';
  for (let i = 0; i < 6; i++) {
    num += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return num;
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env }) {
  const supabaseUrl = env.SUPABASE_URL || '';
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload = await request.json();
    const { action } = payload;

    if (action === 'create') {
      const { 
        tenantId, outletId, userId, shiftId,
        orderType, tableNumber, items,
        subtotal, tax, discount, total,
        paymentMethod, paymentStatus,
        customerName, customerPhone
      } = payload;

      if (!tenantId || !outletId || !userId) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
      }

      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          tenant_id: tenantId,
          outlet_id: outletId,
          user_id: userId,
          shift_id: shiftId,
          order_number: orderNumber,
          order_type: orderType || 'dine_in',
          table_number: tableNumber,
          subtotal: subtotal || 0,
          tax: tax || 0,
          discount: discount || 0,
          total: total || 0,
          payment_method: paymentMethod || 'cash',
          payment_status: paymentStatus || 'paid',
          order_status: 'pending',
          kitchen_status: 'pending',
          customer_name: customerName,
          customer_phone: customerPhone
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      if (items && items.length > 0) {
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.name,
          quantity: item.qty,
          unit_price: item.price,
          subtotal: item.price * item.qty,
          notes: item.notes || ''
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      return new Response(JSON.stringify({ success: true, order }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
