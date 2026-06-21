/**
 * NASHTY OS API Client v3.0 - PURE SUPABASE
 * 100% Supabase (Edge Functions + Direct DB Access)
 * NO Railway Backend - Cloudflare Pages Compatible
 * Updated: 2024-06-21
 */

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg';

// Edge Functions URLs
const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Setup supabase client
const supabaseClient = typeof window !== 'undefined' && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const API = {
  supabase: supabaseClient,

  // ─── Session State ─────────────────────────────────────────────────────────
  session: {
    admin: null,
    adminToken: null,
    currentApp: null,
    token: null,
    refreshToken: null,
    tokenExpiry: null,
    user: null,
    tenantId: null,
    outletId: null,
    shiftId: null
  },

  // ─── Edge Function Request ────────────────────────────────────────────────
  async edgeRequest(functionName, body = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      };

      const token = API.session.token || API.session.adminToken;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${EDGE_FUNCTIONS_URL}/${functionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      return data;
    } catch (error) {
      console.error(`[Edge Function] ${functionName}:`, error);
      throw error;
    }
  },

  // ─── Main Auth (Admin/Manager Login) ──────────────────────────────────────
  mainAuth: {
    async login(username, password) {
      const data = await API.edgeRequest('auth-login', {
        action: 'main-login',
        username,
        password,
        outletId: null
      });

      if (data.success && data.token) {
        API.session.admin = data.user;
        API.session.adminToken = data.token;
        API.session.tenantId = data.user.tenantId;
        if (data.refreshToken) {
          API.session.refreshToken = data.refreshToken;
          API.session.tokenExpiry = Date.now() + (60 * 60 * 1000); // 1h
        }
        localStorage.setItem('nashty_main_session', JSON.stringify({
          admin: data.user,
          adminToken: data.token,
          refreshToken: data.refreshToken,
          tenantId: data.user.tenantId,
          timestamp: new Date().toISOString()
        }));
      }
      return data;
    },

    logout() {
      localStorage.removeItem('nashty_main_session');
      API.session.admin = null;
      API.session.adminToken = null;
    },

    restoreSession() {
      try {
        const saved = localStorage.getItem('nashty_main_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.adminToken) {
            API.session.admin = parsed.admin;
            API.session.adminToken = parsed.adminToken;
            API.session.tenantId = parsed.tenantId;
            if (parsed.refreshToken) API.session.refreshToken = parsed.refreshToken;
            return true;
          }
        }
      } catch (e) {}
      return false;
    },

    async getAvailableApps() {
      return { apps: ['pos', 'kds', 'backoffice', 'cost', 'crm'] };
    }
  },

  // ─── Staff Auth (PIN Login) ───────────────────────────────────────────────
  auth: {
    async getStaff(outletId = null) {
      let q = API.supabase.from('users').select('*').neq('role', 'admin');
      if (outletId) q = q.eq('outlet_id', outletId);
      const { data } = await q;
      return { success: true, staff: data || [] };
    },

    async login(pin, outletId = null) {
      const data = await API.edgeRequest('auth-login', {
        action: 'pin-login',
        pin,
        outletId
      });

      if (data.success && data.token) {
        API.session.token = data.token;
        API.session.user = data.user;
        API.session.tenantId = data.user.tenantId;
        API.session.outletId = data.user.outletId;
        if (data.refreshToken) {
          API.session.refreshToken = data.refreshToken;
          API.session.tokenExpiry = Date.now() + (12 * 60 * 60 * 1000); // 12h
        }
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }
      return data;
    },

    async logout() {
      localStorage.removeItem('nashty_session');
      API.session.token = null;
      API.session.refreshToken = null;
      API.session.user = null;
    },

    restoreSession() {
      try {
        const saved = localStorage.getItem('nashty_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.token) {
            Object.assign(API.session, parsed);
            return true;
          }
        }
      } catch (e) {}
      return false;
    }
  },

  // ─── Favorites API (Edge Function) ────────────────────────────────────────
  favorites: {
    async getAll(userId = null) {
      const uid = userId || API.session.user?.id;
      if (!uid) throw new Error('userId required');

      const response = await fetch(`${EDGE_FUNCTIONS_URL}/favorites-api?action=get&userId=${uid}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${API.session.token || API.session.adminToken}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    },

    async add(productId, position = 0) {
      const userId = API.session.user?.id;
      if (!userId) throw new Error('Not authenticated');

      return await API.edgeRequest('favorites-api', {
        action: 'add',
        userId,
        productId,
        position
      });
    },

    async remove(favoriteId) {
      const response = await fetch(`${EDGE_FUNCTIONS_URL}/favorites-api?action=remove&id=${favoriteId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${API.session.token || API.session.adminToken}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    },

    async reorder(favoritesArray) {
      const userId = API.session.user?.id;
      if (!userId) throw new Error('Not authenticated');

      return await API.edgeRequest('favorites-api', {
        action: 'reorder',
        userId,
        favorites: favoritesArray
      });
    }
  },

  // ─── Analytics API (Edge Function with Caching) ───────────────────────────
  analytics: {
    async getTopProducts(outletId = null, days = 7, limit = 20) {
      const oid = outletId || API.session.outletId;
      if (!oid) throw new Error('outletId required');

      const response = await fetch(`${EDGE_FUNCTIONS_URL}/analytics-api?outletId=${oid}&days=${days}&limit=${limit}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${API.session.token || API.session.adminToken}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    }
  },

  // ─── Settings API (Edge Function) ─────────────────────────────────────────
  outletSettings: {
    async get(outletId = null) {
      const oid = outletId || API.session.outletId;
      if (!oid) throw new Error('outletId required');

      const response = await fetch(`${EDGE_FUNCTIONS_URL}/settings-api?action=get&outletId=${oid}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${API.session.token || API.session.adminToken}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    },

    async update(settings, outletId = null) {
      const oid = outletId || API.session.outletId;
      if (!oid) throw new Error('outletId required');

      return await API.edgeRequest('settings-api', {
        action: 'update',
        outletId: oid,
        settings
      });
    },

    async uploadLogo(file, outletId = null) {
      const oid = outletId || API.session.outletId;
      if (!oid) throw new Error('outletId required');

      // Upload directly to Supabase Storage
      const fileName = `logos/${oid}/logo-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await API.supabase.storage
        .from('receipts')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = API.supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      return { success: true, url: urlData.publicUrl, fileName };
    },

    async uploadPromoImages(files, outletId = null) {
      const oid = outletId || API.session.outletId;
      if (!oid) throw new Error('outletId required');

      const timestamp = Date.now();
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileName = `promos/${oid}/promo-${timestamp}-${index}.${file.name.split('.').pop()}`;
        const { error } = await API.supabase.storage
          .from('promotions')
          .upload(fileName, file, { upsert: true });

        if (error) throw error;

        const { data: urlData } = API.supabase.storage
          .from('promotions')
          .getPublicUrl(fileName);

        return urlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      return { success: true, urls, count: urls.length };
    }
  },

  // ─── Dashboard API (Edge Function) ────────────────────────────────────────
  dashboard: {
    async getKPI(filters = {}) {
      return await API.edgeRequest('dashboard-api', {
        action: 'kpi',
        tenantId: API.session.tenantId,
        outletId: API.session.outletId,
        ...filters
      });
    },

    async getRecentOrders(limit = 10) {
      return await API.edgeRequest('dashboard-api', {
        action: 'recent-orders',
        tenantId: API.session.tenantId,
        outletId: API.session.outletId,
        limit
      });
    },

    async getWeeklyChart() {
      return await API.edgeRequest('dashboard-api', {
        action: 'weekly-chart',
        tenantId: API.session.tenantId,
        outletId: API.session.outletId
      });
    }
  },

  // ─── Orders API (Edge Function) ───────────────────────────────────────────
  orders: {
    async create(orderData) {
      return await API.edgeRequest('orders-api', {
        action: 'create',
        tenantId: API.session.tenantId,
        outletId: API.session.outletId,
        userId: API.session.user?.id,
        shiftId: API.session.shiftId,
        ...orderData
      });
    },

    async getAll(filters = {}) {
      return await API.edgeRequest('orders-api', {
        action: 'get-orders',
        tenantId: API.session.tenantId,
        outletId: API.session.outletId,
        ...filters
      });
    },

    async getById(id) {
      const { data } = await API.supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single();
      return { success: true, order: data };
    },

    async updateStatus(id, statusData) {
      return await API.edgeRequest('orders-api', {
        action: 'update-status',
        orderId: id,
        ...statusData
      });
    }
  },

  // ─── Reports API (Edge Function) ──────────────────────────────────────────
  reports: {
    async getSales(filters = {}) {
      return await API.edgeRequest('reports-api', {
        action: 'sales',
        tenantId: API.session.tenantId,
        outletId: API.session.outletId,
        ...filters
      });
    },

    async getTopProducts(filters = {}) {
      return await API.edgeRequest('reports-api', {
        action: 'top-products',
        tenantId: API.session.tenantId,
        outletId: API.session.outletId,
        ...filters
      });
    }
  },

  // ─── Direct Supabase Queries (for simple CRUD) ───────────────────────────
  users: {
    async getAll(filters = {}) {
      let q = API.supabase.from('users').select('*').eq('tenant_id', API.session.tenantId);
      if (filters.outletId) q = q.eq('outlet_id', filters.outletId);
      const { data } = await q;
      return { success: true, users: data || [] };
    },

    async create(userData) {
      const { data, error } = await API.supabase.from('users')
        .insert([{ tenant_id: API.session.tenantId, ...userData }]).select();
      if (error) throw error;
      return { success: true, user: data[0] };
    },

    async update(id, userData) {
      const { data, error } = await API.supabase.from('users')
        .update(userData).eq('id', id).select();
      if (error) throw error;
      return { success: true, user: data[0] };
    },

    async delete(id) {
      await API.supabase.from('users').delete().eq('id', id);
      return { success: true };
    }
  },

  categories: {
    async getAll() {
      const { data } = await API.supabase.from('categories')
        .select('*').eq('tenant_id', API.session.tenantId);
      return { success: true, data: data || [] };
    },

    async create(data) {
      const { data: res, error } = await API.supabase.from('categories')
        .insert([{ ...data, tenant_id: API.session.tenantId }]).select();
      if (error) throw error;
      return { success: true, data: res[0] };
    },

    async update(id, data) {
      const { data: res, error } = await API.supabase.from('categories')
        .update(data).eq('id', id).select();
      if (error) throw error;
      return { success: true, data: res[0] };
    },

    async delete(id) {
      await API.supabase.from('categories').delete().eq('id', id);
      return { success: true };
    }
  },

  modifiers: {
    async getAll() {
      const { data } = await API.supabase.from('modifier_groups')
        .select('*, options:modifier_options(*)')
        .eq('tenant_id', API.session.tenantId);
      return { success: true, modifiers: data || [] };
    }
  },

  products: {
    async getAll(filters = {}) {
      let q = API.supabase.from('products').select('*').eq('tenant_id', API.session.tenantId);
      const { data } = await q;
      return { success: true, data: data || [] };
    },

    async getById(id) {
      const { data } = await API.supabase.from('products').select('*').eq('id', id).single();
      return { success: true, data };
    },

    async create(data) {
      const { data: res, error } = await API.supabase.from('products')
        .insert([{ ...data, tenant_id: API.session.tenantId }]).select();
      if (error) throw error;
      return { success: true, data: res[0] };
    },

    async update(id, data) {
      const { data: res, error } = await API.supabase.from('products')
        .update(data).eq('id', id).select();
      if (error) throw error;
      return { success: true, data: res[0] };
    },

    async delete(id) {
      await API.supabase.from('products').delete().eq('id', id);
      return { success: true };
    }
  },

  shifts: {
    async start(startCash) {
      const { data } = await API.supabase.from('shifts').insert([{
        outlet_id: API.session.outletId,
        user_id: API.session.user?.id,
        start_cash: startCash,
        status: 'open'
      }]).select();
      if (data && data[0]) {
        API.session.shiftId = data[0].id;
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }
      return { success: true, shift: data?.[0] };
    },

    async end(shiftId, endCash, notes = '') {
      const { data } = await API.supabase.from('shifts').update({
        end_cash: endCash,
        notes,
        status: 'closed',
        end_time: new Date().toISOString()
      }).eq('id', shiftId).select();
      API.session.shiftId = null;
      localStorage.setItem('nashty_session', JSON.stringify(API.session));
      return { success: true, shift: data?.[0] };
    },

    async getActive() {
      const { data } = await API.supabase.from('shifts')
        .select('*')
        .eq('user_id', API.session.user?.id)
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

  outlets: {
    async getAll() {
      const { data } = await API.supabase.from('outlets')
        .select('*').eq('tenant_id', API.session.tenantId);
      return { success: true, outlets: data || [] };
    }
  },

  // ─── Legacy Support (backwards compatibility) ─────────────────────────────
  settings: {
    async get() { return await API.outletSettings.get(); },
    async update(settingsObj) { return await API.outletSettings.update(settingsObj); }
  },

  menu: {
    async getOutletMenu(outletId) {
      const oid = outletId || API.session.outletId;
      const { data: categories } = await API.supabase.from('categories')
        .select('*').eq('tenant_id', API.session.tenantId);
      const { data: products } = await API.supabase.from('products')
        .select('*').eq('tenant_id', API.session.tenantId);
      return { success: true, menu: { categories, products } };
    }
  },

  async request(endpoint, options = {}) {
    try {
      if (endpoint.startsWith('/dashboard/kpi') || endpoint.startsWith('/dashboard-api')) {
        return await API.dashboard.getKPI();
      }
      if (endpoint.startsWith('/dashboard/weekly-chart')) {
        return await API.dashboard.getWeeklyChart();
      }
      if (endpoint.startsWith('/auth-login')) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        return await API.edgeRequest('auth-login', body);
      }
      if (endpoint.startsWith('/settings')) {
        const logoMatch = endpoint.match(/\/settings\/([^/]+)\/logo/);
        if (logoMatch && options.method === 'POST') {
          const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          if (body.base64Data) {
            // Convert base64 to Blob for Supabase storage
            const res = await fetch(body.base64Data);
            const blob = await res.blob();
            const file = new File([blob], 'logo.png', { type: blob.type });
            return await API.outletSettings.uploadLogo(file, logoMatch[1]);
          }
        }
        if (options.method === 'PUT') return await API.settings.update(JSON.parse(options.body).settings);
        return await API.settings.get();
      }
      if (endpoint.startsWith('/activity-logs')) {
        const { data } = await API.supabase.from('activity_logs').select('*')
          .eq('tenant_id', API.session.tenantId).order('created_at', { ascending: false }).limit(20);
        return { success: true, logs: data || [] };
      }
      if (endpoint.startsWith('/costs')) {
        const idMatch = endpoint.match(/\/costs\/([^?]+)/);
        if (options.method === 'DELETE' && idMatch) {
          await API.supabase.from('costs').delete().eq('id', idMatch[1]);
          return { success: true };
        }
        if ((options.method === 'PUT' || options.method === 'POST') && options.body) {
          let body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          body.tenant_id = API.session.tenantId;
          body.outlet_id = API.session.outletId;
          if (idMatch) body.id = idMatch[1];
          await API.supabase.from('costs').upsert(body);
          return { success: true };
        }
        const { data } = await API.supabase.from('costs').select('*')
          .eq('tenant_id', API.session.tenantId).order('created_at', { ascending: false });
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
        if (options.method === 'PUT' && idMatch) {
          let body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          await API.supabase.from('users').update(body).eq('id', idMatch[1]);
          return { success: true };
        }
        if (idMatch) {
          const { data } = await API.supabase.from('users').select('*').eq('id', idMatch[1]).single();
          return { success: true, user: data };
        }
      }
      if (endpoint.startsWith('/shifts/')) {
        const idMatch = endpoint.match(/\/shifts\/([^/]+)\/summary/);
        if (idMatch) {
          // Mock summary for backward compatibility
          return { success: true, summary: { expectedCash: 0, actualCash: 0, difference: 0 } };
        }
      }
      throw new Error(`Endpoint not supported in Pure Supabase mode: ${endpoint}`);
    } catch (error) {
      console.error(`[API] ${endpoint}:`, error);
      throw error;
    }
  },

  // ─── Utils ────────────────────────────────────────────────────────────────
  utils: {
    isAdminLoggedIn() { return !!API.session.adminToken; },
    isStaffLoggedIn() { return !!API.session.token; },
    getCurrentApp() { return API.session.currentApp; },
    setCurrentApp(app) { API.session.currentApp = app; },
    clearAllSessions() {
      localStorage.removeItem('nashty_main_session');
      localStorage.removeItem('nashty_session');
      API.session = {
        admin: null, adminToken: null, currentApp: null,
        token: null, refreshToken: null, tokenExpiry: null,
        user: null, tenantId: null, outletId: null, shiftId: null
      };
    }
  }
};

// ─── Session Restore on Load ──────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  API.mainAuth.restoreSession();
  API.auth.restoreSession();
}

// ─── Export ───────────────────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') {
  window.API = API;
  window.APIv3 = API; // v3 = Pure Supabase
}
