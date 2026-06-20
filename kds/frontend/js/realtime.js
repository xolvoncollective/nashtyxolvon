// ═══════════════════════════════════════════════════════
// SUPABASE REALTIME FOR KDS
// ═══════════════════════════════════════════════════════

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg';

let supabaseClient = null;
let ordersChannel = null;
let isRealtimeConnected = false;

// Sound notification
const notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiP1/LJeC0GJHbH8NuQQQoVXrTp66hVFApGn+DyvmwhBjiP1/LJeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQoVXrPp7KlWFApGn+DyvmwhBjiP1/LIeC0GI3bH79uQQQo=');

// Initialize Supabase Realtime
function initSupabaseRealtime() {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[KDS Realtime] Supabase client initialized');
    
    subscribeToOrders();
    updateRealtimeStatus('connecting');
  } catch (error) {
    console.error('[KDS Realtime] Failed to initialize:', error);
    updateRealtimeStatus('error');
    // Fallback to polling
    startPolling();
  }
}

// Subscribe to orders table changes
function subscribeToOrders() {
  ordersChannel = supabaseClient
    .channel('kds-orders')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: 'status=in.(pending,preparing)'
      },
      (payload) => {
        console.log('[KDS Realtime] New order:', payload.new);
        handleNewOrder(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: 'status=in.(pending,preparing,ready,completed)'
      },
      (payload) => {
        console.log('[KDS Realtime] Order updated:', payload.new);
        handleOrderUpdate(payload.old, payload.new);
      }
    )
    .subscribe((status) => {
      console.log('[KDS Realtime] Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        isRealtimeConnected = true;
        updateRealtimeStatus('connected');
        // Stop polling when realtime is active
        if (fetchInterval) {
          clearInterval(fetchInterval);
          fetchInterval = null;
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        isRealtimeConnected = false;
        updateRealtimeStatus('error');
        // Fallback to polling
        startPolling();
      }
    });
}

// Handle new order
function handleNewOrder(order) {
  // Play sound
  playNotificationSound();
  
  // Flash screen briefly
  if (CFG.flashEnabled) {
    flashScreen();
  }
  
  // Fetch full order details and add to grid
  fetchAndAddOrder(order.id);
}

// Handle order update
function handleOrderUpdate(oldOrder, newOrder) {
  if (oldOrder.status !== newOrder.status) {
    console.log(`[KDS Realtime] Order ${newOrder.order_number} status: ${oldOrder.status} → ${newOrder.status}`);
    
    // Remove from KDS if completed
    if (newOrder.status === 'completed' || newOrder.status === 'cancelled') {
      removeOrderFromGrid(newOrder.id);
    } else {
      // Update existing order card
      updateOrderCard(newOrder);
    }
  }
}

// Fetch full order details
async function fetchAndAddOrder(orderId) {
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          quantity,
          notes
        )
      `)
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    
    if (data && (data.status === 'pending' || data.status === 'preparing')) {
      // Transform to KDS format
      const kdsOrder = {
        id: data.id,
        no: data.order_number || '#0000',
        table: data.table_number || data.order_type,
        type: data.order_type || 'dine',
        status: data.status === 'pending' ? 'new' : 'prep',
        items: data.order_items.map(item => ({
          name: item.product_name,
          qty: item.quantity,
          notes: item.notes
        })),
        time: new Date(data.created_at),
        note: data.notes || ''
      };
      
      // Add to STATE if not exists
      if (!STATE.orders.find(o => o.id === kdsOrder.id)) {
        STATE.orders.unshift(kdsOrder);
        renderOrders();
      }
    }
  } catch (error) {
    console.error('[KDS Realtime] Failed to fetch order:', error);
  }
}

// Remove order from grid
function removeOrderFromGrid(orderId) {
  STATE.orders = STATE.orders.filter(o => o.id !== orderId);
  renderOrders();
}

// Update order card
function updateOrderCard(order) {
  const existingOrder = STATE.orders.find(o => o.id === order.id);
  if (existingOrder) {
    existingOrder.status = order.status === 'preparing' ? 'prep' : 
                           order.status === 'ready' ? 'done' : 'new';
    renderOrders();
  }
}

// Play notification sound
function playNotificationSound() {
  if (CFG.soundEnabled) {
    try {
      notificationSound.currentTime = 0;
      notificationSound.play().catch(e => console.warn('[KDS] Sound play failed:', e));
    } catch (error) {
      console.warn('[KDS] Sound notification failed:', error);
    }
  }
}

// Test sound
function playTestSound() {
  notificationSound.currentTime = 0;
  notificationSound.play().catch(e => {
    alert('Please interact with the page first to enable sound notifications');
  });
}

// Flash screen
function flashScreen() {
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(228, 84, 12, 0.15);
    z-index: 9999;
    pointer-events: none;
    animation: flashFade 0.4s ease-out;
  `;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 400);
}

// Update realtime status indicator
function updateRealtimeStatus(status) {
  const statusEl = document.getElementById('realtime-status');
  const dot = statusEl.querySelector('.live-dot');
  const txt = statusEl.querySelector('.live-txt');
  
  if (status === 'connected') {
    dot.style.background = '#22C55E';
    txt.textContent = 'Live';
    statusEl.style.background = 'rgba(34, 197, 94, 0.15)';
    statusEl.style.borderColor = 'rgba(34, 197, 94, 0.25)';
  } else if (status === 'connecting') {
    dot.style.background = '#F59E0B';
    txt.textContent = 'Connecting...';
    statusEl.style.background = 'rgba(245, 158, 11, 0.15)';
    statusEl.style.borderColor = 'rgba(245, 158, 11, 0.25)';
  } else {
    dot.style.background = '#EF4444';
    txt.textContent = 'Polling';
    statusEl.style.background = 'rgba(239, 68, 68, 0.15)';
    statusEl.style.borderColor = 'rgba(239, 68, 68, 0.25)';
  }
}

// Fallback polling
function startPolling() {
  if (fetchInterval) return; // Already polling
  
  console.log('[KDS] Starting fallback polling mode');
  fetchOrders(); // Initial fetch
  fetchInterval = setInterval(fetchOrders, 5000); // Every 5 seconds
}

// Cleanup
window.addEventListener('beforeunload', () => {
  if (ordersChannel) {
    supabaseClient.removeChannel(ordersChannel);
  }
  if (fetchInterval) {
    clearInterval(fetchInterval);
  }
});

// Add CSS for flash animation
const style = document.createElement('style');
style.textContent = `
@keyframes flashFade {
  0% { opacity: 0; }
  20% { opacity: 1; }
  100% { opacity: 0; }
}
`;
document.head.appendChild(style);

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  console.log('[KDS Realtime] Initializing...');
  setTimeout(() => {
    if (typeof supabase !== 'undefined') {
      initSupabaseRealtime();
    } else {
      console.error('[KDS Realtime] Supabase library not loaded, using polling');
      updateRealtimeStatus('error');
      startPolling();
    }
  }, 1000);
});
