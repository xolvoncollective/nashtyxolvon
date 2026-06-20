/**
 * NASHTY KDS API Client (Supabase Native)
 * Centralized API communication layer for Kitchen Display System
 */

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg';

const supabase = typeof window !== 'undefined' && window.supabase 
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

const API = {
  supabase,
  session: {
    token: null,
    user: null,
    tenantId: null,
    outletId: null,
    shiftId: null
  },

  async request(endpoint, options = {}) {
    try {
      const headers = { 'Content-Type': 'application/json', ...options.headers };
      if (API.session.token) headers['Authorization'] = `Bearer ${API.session.token}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers, ...options });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  auth: {
    async login(pin, outletId = null) {
      const data = await API.request('/auth-login', {
        method: 'POST',
        body: JSON.stringify({ action: 'pin-login', pin, outletId })
      });
      if (data.success && data.user && data.token) {
        API.session.token = data.token;
        API.session.user = data.user;
        API.session.tenantId = data.user.tenantId;
        API.session.outletId = data.user.outletId;
        localStorage.setItem('nashty_kds_session', JSON.stringify(API.session));
      }
      return data;
    },
    logout() {
      API.session = { token: null, user: null, tenantId: null, outletId: null, shiftId: null };
      localStorage.removeItem('nashty_kds_session');
    },
    restoreSession() {
      const stored = localStorage.getItem('nashty_kds_session');
      if (stored) {
        try {
          API.session = JSON.parse(stored);
          return true;
        } catch (e) {}
      }
      return false;
    }
  },

  orders: {
    async getKDSQueue(outletId) {
      const { data, error } = await API.supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('tenant_id', API.session.tenantId || '00000000-0000-0000-0000-000000000001')
        .eq('outlet_id', outletId || API.session.outletId || '00000000-0000-0000-0000-000000000002')
        .in('order_status', ['pending', 'preparing']); // Legacy kitchen logic relied on order_status, but we might need kitchen_status specifically if it exists.
      
      if (error) {
        console.error('[KDS] Failed to get queue:', error);
        return { orders: [] };
      }
      
      // Adapt postgREST data to KDS expected format
      return { success: true, orders: data || [] };
    },

    async getAll(filters = {}) {
      if (!API.session.tenantId) return { orders: [] };
      let q = API.supabase.from('orders').select('*, order_items(*)').eq('tenant_id', API.session.tenantId);
      if (API.session.outletId) q = q.eq('outlet_id', API.session.outletId);
      const { data } = await q;
      return { success: true, orders: data || [] };
    },

    async updateKitchenStatus(orderId, status) {
      const { data, error } = await API.supabase
        .from('orders')
        .update({ order_status: status }) // Mapping kitchen_status to order_status as fallback
        .eq('id', orderId)
        .select();
        
      if (error) throw error;
      return { success: true, order: data[0] };
    },

    async getKitchenStats(outletId) {
      // Basic fallback since RPC requires edge function or DB setup
      return { success: true, stats: { avgTime: 0, completedOrders: 0 } };
    },

    async getConfig(outletId) {
      const { data } = await API.supabase.from('settings').select('settings').eq('outlet_id', outletId || API.session.outletId).single();
      if (data && data.settings) {
         return {
          config: {
            kdsWarnThreshold: data.settings.kds_warn_minutes || 10,
            kdsUrgentThreshold: data.settings.kds_urgent_minutes || 20,
            kdsSoundEnabled: data.settings.kds_sound_enabled !== false,
            kdsAutoSort: data.settings.kds_auto_sort !== false
          }
        };
      }
      return {
        config: { kdsWarnThreshold: 10, kdsUrgentThreshold: 20, kdsSoundEnabled: true, kdsAutoSort: true }
      };
    }
  },

  settings: {
    async get(outletId) {
      const { data } = await API.supabase.from('settings').select('settings').eq('outlet_id', outletId || API.session.outletId).single();
      return { success: true, settings: data?.settings || {} };
    }
  }
};

if (typeof window !== 'undefined') {
  API.auth.restoreSession();
  window.API = API;
}

if (typeof module !== 'undefined' && module.exports) module.exports = API;
console.log('[KDS API] Client initialized with Supabase native');
