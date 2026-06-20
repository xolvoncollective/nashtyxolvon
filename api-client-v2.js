/**
 * NASHTY OS API Client v2.0 (Supabase Native)
 * With Main Admin Authentication and Supabase Support
 */

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
// The ANON_KEY is safe to expose in the frontend
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg';

// Setup supabase if loaded via CDN
const supabaseClient = typeof window !== 'undefined' && window.supabase 
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const API_BASE_URL = '/api';

const API = {
  supabase: supabaseClient,
  session: {
    admin: { id: 'admin', role: 'admin', tenantId: '00000000-0000-0000-0000-000000000001' },
    adminToken: 'dev-token',
    currentApp: null,
    token: 'dev-token',
    user: { id: 'admin', name: 'Admin Demo', role: 'admin', tenantId: '00000000-0000-0000-0000-000000000001', outletId: '00000000-0000-0000-0000-000000000002' },
    tenantId: '00000000-0000-0000-0000-000000000001',
    outletId: '00000000-0000-0000-0000-000000000002',
    shiftId: null
  },

  // Helper: Edge Function request
  async request(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (API.session.token) headers['Authorization'] = `Bearer ${API.session.token}`;
      else if (API.session.adminToken) headers['Authorization'] = `Bearer ${API.session.adminToken}`;

      // --- BACKOFFICE MIGRATION INTERCEPTOR ---
      if (endpoint.startsWith('/dashboard/kpi')) {
        return await API.dashboard.getKPI();
      }
      if (endpoint.startsWith('/dashboard/weekly-chart')) {
        return await API.request('/dashboard-api', { method: 'POST', body: JSON.stringify({ action: 'weekly-chart', tenantId: API.session.tenantId }) });
      }
      if (endpoint.startsWith('/settings')) {
        if (options.method === 'PUT') return await API.settings.update(JSON.parse(options.body).settings);
        return await API.settings.get();
      }
      if (endpoint.startsWith('/activity-logs')) {
        const { data } = await API.supabase.from('activity_logs').select('*').eq('tenant_id', API.session.tenantId).order('created_at', { ascending: false }).limit(20);
        return { success: true, logs: data || [] };
      }
      if (endpoint.startsWith('/costs')) {
        const idMatch = endpoint.match(/\/costs\/([^?]+)/);
        if (options.method === 'DELETE' && idMatch) {
          await API.supabase.from('nashtycosts').delete().eq('id', idMatch[1]);
          return { success: true };
        }
        if ((options.method === 'PUT' || options.method === 'POST') && options.body) {
          let body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          body.tenant_id = API.session.tenantId;
          body.outlet_id = API.session.outletId;
          if (idMatch) body.id = idMatch[1];
          await API.supabase.from('nashtycosts').upsert(body);
          return { success: true };
        }
        const { data } = await API.supabase.from('nashtycosts').select('*').eq('tenant_id', API.session.tenantId).order('created_at', { ascending: false });
        return { success: true, costs: data || [] };
      }
      if (endpoint.match(/\/products\/.*\/duplicate/)) {
        const idMatch = endpoint.match(/\/products\/([^/]+)\/duplicate/);
        const { data: p } = await API.supabase.from('products').select('*').eq('id', idMatch[1]).single();
        if (p) {
          delete p.id;
          p.name = p.name + ' (Copy)';
          await API.supabase.from('products').insert(p);
        }
        return { success: true };
      }
      if (endpoint.startsWith('/users/')) {
        const idMatch = endpoint.match(/\/users\/([^?]+)/);
        if (idMatch) {
           const { data } = await API.supabase.from('users').select('*').eq('id', idMatch[1]).single();
           return { success: true, user: data };
        }
      }
      // --- END INTERCEPTOR ---

      const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers, ...options });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  mainAuth: {
    async login(username, password) {
      const data = await API.request('/auth-login', {
        method: 'POST',
        body: JSON.stringify({ action: 'main-login', username, password, outletId: null })
      });
      if (data.success && data.token) {
        API.session.admin = data.user;
        API.session.adminToken = data.token;
        API.session.tenantId = data.user.tenantId;
        localStorage.setItem('nashty_main_session', JSON.stringify({
          admin: data.user, adminToken: data.token, tenantId: data.user.tenantId, timestamp: new Date().toISOString()
        }));
      }
      return data;
    },
    async validate(token) { return { success: true }; },
    logout() {},
    restoreSession() { return true; },
    async getAvailableApps() { return { apps: ['pos', 'kds', 'backoffice', 'cost', 'crm'] }; }
  },

  auth: {
    async getStaff(outletId = null) {
      let q = API.supabase.from('users').select('*').neq('role', 'admin');
      if (outletId) q = q.eq('outlet_id', outletId);
      const { data } = await q;
      return { success: true, staff: data };
    },
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
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }
      return data;
    },
    logout() {},
    restoreSession() { return true; }
  },

  users: {
    async getAll(filters = {}) {
      let q = API.supabase.from('users').select('*').eq('tenant_id', API.session.tenantId);
      if (filters.outletId) q = q.eq('outlet_id', filters.outletId);
      const { data } = await q;
      return { success: true, users: data };
    },
    async create(userData) {
      const { data, error } = await API.supabase.from('users').insert([{ tenant_id: API.session.tenantId, ...userData }]).select();
      if (error) throw error; return { success: true, user: data[0] };
    },
    async update(id, userData) {
      const { data, error } = await API.supabase.from('users').update(userData).eq('id', id).select();
      if (error) throw error; return { success: true, user: data[0] };
    },
    async updateStatus(id, status) {
      const { data, error } = await API.supabase.from('users').update({ status }).eq('id', id).select();
      if (error) throw error; return { success: true, user: data[0] };
    },
    async delete(id) {
      await API.supabase.from('users').delete().eq('id', id);
      return { success: true };
    }
  },

  menu: {
    async getOutletMenu(outletId) {
      if (!outletId) outletId = API.session.outletId;
      const { data: categories } = await API.supabase.from('categories').select('*').eq('tenant_id', API.session.tenantId);
      const { data: products } = await API.supabase.from('products').select('*').eq('tenant_id', API.session.tenantId);
      return { success: true, menu: { categories, products } };
    }
  },

  categories: {
    async getAll() {
      const { data, error } = await API.supabase.from('categories').select('*').eq('tenant_id', API.session.tenantId);
      return { success: !error, data: data || [] };
    },
    async getById(id) {
      const { data } = await API.supabase.from('categories').select('*').eq('id', id).single();
      return { success: true, data };
    },
    async create(data) {
      const { data: res, error } = await API.supabase.from('categories').insert([{ ...data, tenant_id: API.session.tenantId }]).select();
      if (error) throw error; return res[0];
    },
    async update(id, data) {
      const { data: res, error } = await API.supabase.from('categories').update(data).eq('id', id).select();
      if (error) throw error; return res[0];
    },
    async updateStatus(id, status) {
      await API.supabase.from('categories').update({ status }).eq('id', id); return { success: true };
    },
    async delete(id) {
      await API.supabase.from('categories').delete().eq('id', id); return { success: true };
    }
  },

  products: {
    async getAll(filters = {}) {
      let q = API.supabase.from('products').select('*').eq('tenant_id', API.session.tenantId);
      const { data, error } = await q;
      return { success: !error, data: data || [] };
    },
    async getById(id) {
      const { data } = await API.supabase.from('products').select('*').eq('id', id).single();
      return { success: true, data };
    },
    async create(data) {
      const { data: res, error } = await API.supabase.from('products').insert([{ ...data, tenant_id: API.session.tenantId }]).select();
      if (error) throw error; return res[0];
    },
    async update(id, data) {
      const { data: res, error } = await API.supabase.from('products').update(data).eq('id', id).select();
      if (error) throw error; return res[0];
    },
    async updateStatus(id, status) {
      await API.supabase.from('products').update({ status }).eq('id', id); return { success: true };
    },
    async delete(id) {
      await API.supabase.from('products').delete().eq('id', id); return { success: true };
    }
  },

  modifiers: {
    async getAll() {
      const { data } = await API.supabase.from('modifier_groups').select('*, modifier_options(*)').eq('tenant_id', API.session.tenantId);
      return { success: true, modifiers: data || [] };
    },
    async create(data) {
      const { data: res } = await API.supabase.from('modifier_groups').insert([{ ...data, tenant_id: API.session.tenantId }]).select();
      return { success: true, group: res[0] };
    },
    async update(id, data) {
      const { data: res } = await API.supabase.from('modifier_groups').update(data).eq('id', id).select();
      return { success: true, group: res[0] };
    },
    async delete(id) {
      await API.supabase.from('modifier_groups').delete().eq('id', id);
      return { success: true };
    },
    async createOption(groupId, data) {
      const { data: res } = await API.supabase.from('modifier_options').insert([{ ...data, group_id: groupId }]).select();
      return { success: true, option: res[0] };
    },
    async deleteOption(optionId) {
      await API.supabase.from('modifier_options').delete().eq('id', optionId);
      return { success: true };
    }
  },

  orders: {
    async create(orderData) {
      // Send to Edge Function or handle locally
      // For now, Edge function is better to handle complex transactions (inventory, items)
      return API.request('/orders-api', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'create', 
          tenantId: API.session.tenantId, 
          outletId: API.session.outletId, 
          userId: API.session.user.id, 
          shiftId: API.session.shiftId,
          ...orderData 
        })
      });
    },
    async getAll(filters = {}) {
      let q = API.supabase.from('orders').select('*, order_items(*)').eq('tenant_id', API.session.tenantId);
      if (API.session.outletId) q = q.eq('outlet_id', API.session.outletId);
      const { data } = await q;
      return { success: true, orders: data || [] };
    },
    async getById(id) {
      const { data } = await API.supabase.from('orders').select('*, order_items(*)').eq('id', id).single();
      return { success: true, order: data };
    },
    async updateStatus(id, status) {
      const { data } = await API.supabase.from('orders').update(status).eq('id', id).select();
      return { success: true, order: data[0] };
    }
  },

  shifts: {
    async start(startCash) {
      const { data } = await API.supabase.from('shifts').insert([{
        outlet_id: API.session.outletId, user_id: API.session.user.id, start_cash: startCash, status: 'open'
      }]).select();
      if (data && data[0]) {
        API.session.shiftId = data[0].id;
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }
      return { success: true, shift: data[0] };
    },
    async end(shiftId, endCash, notes = '') {
      const { data } = await API.supabase.from('shifts').update({
        end_cash: endCash, notes, status: 'closed', end_time: new Date().toISOString()
      }).eq('id', shiftId).select();
      API.session.shiftId = null;
      localStorage.setItem('nashty_session', JSON.stringify(API.session));
      return { success: true, shift: data[0] };
    },
    async getActive() {
      const { data } = await API.supabase.from('shifts')
        .select('*')
        .eq('user_id', API.session.user.id)
        .eq('status', 'open')
        .limit(1);
      if (data && data.length > 0) {
        API.session.shiftId = data[0].id;
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
        return { success: true, shift: data[0] };
      }
      return { success: true, shift: null };
    }
  },

  dashboard: {
    async getKPI(filters = {}) {
      return API.request('/dashboard-api', { method: 'POST', body: JSON.stringify({ action: 'kpi', tenantId: API.session.tenantId, outletId: API.session.outletId, ...filters }) });
    },
    async getRecentOrders(limit = 10) {
      return API.request('/dashboard-api', { method: 'POST', body: JSON.stringify({ action: 'recent-orders', tenantId: API.session.tenantId, outletId: API.session.outletId, limit }) });
    }
  },

  settings: {
    async get() {
      const { data } = await API.supabase.from('settings').select('*').eq('outlet_id', API.session.outletId).single();
      return { success: true, settings: data?.settings || {} };
    },
    async update(settingsObj) {
      const { data } = await API.supabase.from('settings').upsert({ outlet_id: API.session.outletId, settings: settingsObj }).select();
      return { success: true, settings: data[0] };
    }
  },

  kds: {
    async getAnalytics() {
      return { success: true, data: { avgTime: 0, totalOrders: 0 } }; // Dummy
    }
  },

  outlets: {
    async getAll() {
      const { data } = await API.supabase.from('outlets').select('*').eq('tenant_id', API.session.tenantId);
      return { success: true, outlets: data || [] };
    }
  },

  reports: {
    async getSales(filters = {}) {
      return API.request('/reports-api', { method: 'POST', body: JSON.stringify({ action: 'sales', tenantId: API.session.tenantId, ...filters }) });
    }
  },

  utils: {
    isAdminLoggedIn() { return !!API.session.adminToken; },
    isStaffLoggedIn() { return !!API.session.token; },
    getCurrentApp() { return API.session.currentApp; },
    setCurrentApp(app) { API.session.currentApp = app; },
    clearAllSessions() {
      localStorage.removeItem('nashty_main_session');
      localStorage.removeItem('nashty_session');
      API.session = { admin: null, adminToken: null, currentApp: null, token: null, user: null, tenantId: null, outletId: null, shiftId: null };
    }
  }
};

if (typeof window !== 'undefined') {
  API.mainAuth.restoreSession();
  API.auth.restoreSession();
}

if (typeof module !== 'undefined' && module.exports) module.exports = API;
window.API = API;
window.APIv2 = API;
