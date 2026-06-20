/**
 * Integration Verification Script
 * Tests POS → KDS → Backoffice data flow
 * 
 * Run: node verify-integration.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backoffice/backend/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const OUTLET_ID = '00000000-0000-0000-0000-000000000002';

async function verifyIntegration() {
  console.log('🔍 NASHTY SYSTEM INTEGRATION VERIFICATION\n');

  // Test 1: Check recent orders
  console.log('📋 Test 1: Checking Recent Orders...');
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_number, order_status, payment_status, kitchen_status, total, created_at')
    .eq('tenant_id', TENANT_ID)
    .eq('outlet_id', OUTLET_ID)
    .order('created_at', { ascending: false })
    .limit(10);

  if (ordersError) {
    console.error('❌ Error fetching orders:', ordersError.message);
  } else {
    console.log(`✅ Found ${orders.length} recent orders`);
    orders.forEach((order, idx) => {
      console.log(`   ${idx + 1}. ${order.order_number} | Status: ${order.order_status} | Kitchen: ${order.kitchen_status} | Payment: ${order.payment_status} | Rp ${order.total.toLocaleString()}`);
    });
  }

  // Test 2: Check KDS queue (should show orders with kitchen_status = 'pending' or 'preparing')
  console.log('\n🍳 Test 2: Checking KDS Queue...');
  const { data: kdsOrders, error: kdsError } = await supabase
    .from('orders')
    .select('id, order_number, kitchen_status, order_type, table_number, created_at')
    .eq('tenant_id', TENANT_ID)
    .eq('outlet_id', OUTLET_ID)
    .in('kitchen_status', ['pending', 'preparing'])
    .neq('order_status', 'cancelled')
    .order('created_at', { ascending: true });

  if (kdsError) {
    console.error('❌ Error fetching KDS queue:', kdsError.message);
  } else {
    console.log(`✅ KDS Queue: ${kdsOrders.length} active orders`);
    if (kdsOrders.length === 0) {
      console.log('   ⚠️  No orders in KDS queue - this may be normal if all orders are completed');
    } else {
      kdsOrders.forEach((order, idx) => {
        const waitTime = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);
        console.log(`   ${idx + 1}. ${order.order_number} | ${order.order_type} | Table ${order.table_number || '-'} | Status: ${order.kitchen_status} | Wait: ${waitTime}m`);
      });
    }
  }

  // Test 3: Check open bills (should have kitchen_status = 'on_hold')
  console.log('\n💳 Test 3: Checking Open Bills...');
  const { data: openBills, error: openBillsError } = await supabase
    .from('orders')
    .select('id, order_number, order_status, kitchen_status, total, created_at')
    .eq('tenant_id', TENANT_ID)
    .eq('outlet_id', OUTLET_ID)
    .eq('order_status', 'open_bill')
    .order('created_at', { ascending: false });

  if (openBillsError) {
    console.error('❌ Error fetching open bills:', openBillsError.message);
  } else {
    console.log(`✅ Found ${openBills.length} open bills`);
    if (openBills.length === 0) {
      console.log('   ℹ️  No open bills - all orders are paid');
    } else {
      openBills.forEach((bill, idx) => {
        console.log(`   ${idx + 1}. ${bill.order_number} | Kitchen Status: ${bill.kitchen_status} | Rp ${bill.total.toLocaleString()}`);
        if (bill.kitchen_status !== 'on_hold') {
          console.log(`      ⚠️  WARNING: Open bill should have kitchen_status='on_hold', but has '${bill.kitchen_status}'`);
        }
      });
    }
  }

  // Test 4: Check order items kitchen_status
  console.log('\n🍽️  Test 4: Checking Order Items Status...');
  if (orders && orders.length > 0) {
    const latestOrderId = orders[0].id;
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('id, product_name, quantity, kitchen_status')
      .eq('order_id', latestOrderId);

    if (itemsError) {
      console.error('❌ Error fetching order items:', itemsError.message);
    } else {
      console.log(`✅ Latest order (${orders[0].order_number}) has ${items.length} items:`);
      items.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.product_name} x${item.quantity} | Status: ${item.kitchen_status}`);
      });

      // Verify items match parent order status
      const parentKitchenStatus = orders[0].kitchen_status;
      const mismatchedItems = items.filter(item => 
        (parentKitchenStatus === 'pending' && item.kitchen_status !== 'pending') ||
        (parentKitchenStatus === 'on_hold' && item.kitchen_status !== 'on_hold')
      );

      if (mismatchedItems.length > 0) {
        console.log(`   ⚠️  WARNING: ${mismatchedItems.length} items have mismatched status with parent order`);
        console.log(`      Parent order kitchen_status: ${parentKitchenStatus}`);
        mismatchedItems.forEach(item => {
          console.log(`      - ${item.product_name}: ${item.kitchen_status}`);
        });
      }
    }
  }

  // Test 5: Check activity logs
  console.log('\n📝 Test 5: Checking Activity Logs...');
  const { data: logs, error: logsError } = await supabase
    .from('activity_logs')
    .select('action, description, created_at')
    .eq('tenant_id', TENANT_ID)
    .in('action', ['order_created', 'order_paid', 'kitchen_completed', 'kitchen_late'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (logsError) {
    console.error('❌ Error fetching activity logs:', logsError.message);
  } else {
    console.log(`✅ Found ${logs.length} recent activity logs`);
    logs.forEach((log, idx) => {
      const time = new Date(log.created_at).toLocaleTimeString();
      console.log(`   ${idx + 1}. [${time}] ${log.action}: ${log.description}`);
    });
  }

  // Test 6: Check dashboard data
  console.log('\n📊 Test 6: Checking Dashboard Data...');
  
  // Today's revenue
  const { data: todayOrders, error: todayError } = await supabase
    .from('orders')
    .select('total, payment_status')
    .eq('tenant_id', TENANT_ID)
    .eq('outlet_id', OUTLET_ID)
    .gte('created_at', new Date().toISOString().split('T')[0])
    .neq('order_status', 'cancelled');

  if (todayError) {
    console.error('❌ Error fetching today\'s orders:', todayError.message);
  } else {
    const revenue = todayOrders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
    console.log(`✅ Today's Revenue: Rp ${revenue.toLocaleString()}`);
    console.log(`   Total Orders: ${todayOrders.length}`);
    console.log(`   Paid Orders: ${todayOrders.filter(o => o.payment_status === 'paid').length}`);
    console.log(`   Pending Payment: ${todayOrders.filter(o => o.payment_status === 'pending').length}`);
  }

  // Test 7: Check member integration
  console.log('\n👥 Test 7: Checking CRM Member Integration...');
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('name, phone, points, total_spent, visit_count, segment')
    .eq('tenant_id', TENANT_ID)
    .order('total_spent', { ascending: false })
    .limit(5);

  if (membersError) {
    console.error('❌ Error fetching members:', membersError.message);
  } else {
    console.log(`✅ Found ${members.length} top members`);
    members.forEach((member, idx) => {
      console.log(`   ${idx + 1}. ${member.name} (${member.phone}) | Segment: ${member.segment} | Points: ${member.points} | Spent: Rp ${member.total_spent.toLocaleString()} | Visits: ${member.visit_count}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ INTEGRATION VERIFICATION COMPLETE');
  console.log('='.repeat(60));
}

verifyIntegration()
  .then(() => {
    console.log('\n✅ All checks completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
