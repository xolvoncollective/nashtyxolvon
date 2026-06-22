import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nashty-token',
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
        const orderItems = items.map((item: any) => {
          // Frontend sends: productName, quantity, unitPrice, productId
          const productName = item.productName || item.product_name || item.name || 'Unknown Product';
          const qty = item.quantity || item.qty || 1;
          const price = item.unitPrice || item.unit_price || item.price || 0;
          const productId = item.productId || item.product_id;
          
          console.log('Mapping order item:', { 
            received: item, 
            mapped: { productName, qty, price, productId }
          });
          
          return {
            order_id: order.id,
            product_id: productId,
            product_name: productName,
            quantity: qty,
            unit_price: price,
            subtotal: price * qty,
            notes: item.notes || ''
          };
        });

        console.log('Inserting order items:', orderItems);

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Order items insert error:', itemsError);
          throw itemsError;
        }
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

    // ─── Get KDS Queue ─────────────────────────────────────────────────────────
    if (action === 'get-kds-queue') {
      const { tenantId, outletId } = payload;

      if (!tenantId) {
        return new Response(JSON.stringify({ error: 'tenantId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Fetch orders with kitchen_status = 'pending' or 'preparing'
      let q = supabase.from('orders')
        .select(`
          id,
          order_number,
          order_type,
          table_number,
          created_at,
          kitchen_status,
          user_id,
          order_items (
            id,
            product_name,
            quantity,
            notes,
            modifiers
          )
        `)
        .eq('tenant_id', tenantId)
        .in('kitchen_status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (outletId) q = q.eq('outlet_id', outletId);

      const { data, error } = await q;
      if (error) throw error;

      // Fetch staff names separately to avoid foreign key issues
      const userIds = [...new Set((data || []).map((o: any) => o.user_id).filter(Boolean))];
      let staffMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('id, full_name')
          .in('id', userIds);
        
        if (staffData) {
          staffData.forEach((s: any) => {
            staffMap[s.id] = s.full_name;
          });
        }
      }

      // Transform data for KDS frontend
      const orders = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        order_type: order.order_type,
        table_number: order.table_number,
        created_at: order.created_at,
        kitchen_status: order.kitchen_status,
        cashier_name: staffMap[order.user_id] || 'System',
        items: order.order_items || []
      }));

      return new Response(JSON.stringify({ success: true, orders }), {
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

      const updates: Record<string, any> = {};
      if (orderStatus) updates.order_status = orderStatus;
      if (kitchenStatus) updates.kitchen_status = kitchenStatus;

      // ✅ FIX Bug #5: Set completed_at when order reaches completion states
      const completionStates = ['ready', 'completed'];
      const isKitchenComplete = kitchenStatus && completionStates.includes(kitchenStatus);
      const isOrderComplete = orderStatus === 'completed';
      
      if (isKitchenComplete || isOrderComplete) {
        updates.completed_at = new Date().toISOString();
      }

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

    // ─── Shift Management ──────────────────────────────────────────────────────
    if (action === 'start-shift') {
      const { outletId, userId, startCash } = payload;
      
      if (!outletId || !userId) {
        return new Response(JSON.stringify({ error: 'outletId and userId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabase.from('shifts').insert([{
        outlet_id: outletId,
        user_id: userId,
        start_cash: startCash,
        status: 'open'
      }]).select();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, shift: data?.[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'end-shift') {
      const { shiftId, endCash, notes } = payload;
      
      if (!shiftId) {
        return new Response(JSON.stringify({ error: 'shiftId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabase.from('shifts').update({
        end_cash: endCash,
        notes: notes || '',
        status: 'closed',
        end_time: new Date().toISOString()
      }).eq('id', shiftId).select();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, shift: data?.[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: create, get-orders, get-kds-queue, update-status, start-shift, end-shift' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Orders API error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
