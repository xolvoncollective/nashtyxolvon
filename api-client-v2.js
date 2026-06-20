/**
 * NASHTY OS API Client v2.1
 * Supabase Native + Railway Backend Integration
 * Updated: 2026-06-21 with favorites, analytics, settings, token refresh
 */

const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
// ANON_KEY is safe to expose in the frontend
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDA1MzUsImV4cCI6MjA5NjkxNjUzNX0.fUynF1mfZCyy48aFkwz3_G52-4hd4EE-b5gpG7k0mpg';

// Railway Backend API (Express) - DELETED
// const RAILWAY_API_URL = 'https://nashty-backend-production.up.railway.app';

// Supabase Edge Functions base URL
const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Setup supabase client if loaded via CDN
const supabaseClient = typeof window !== 'undefined' && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const API = {
  supabase: supabaseClient,

  // ─── Session State ─────────────────────────────────────────────────────────
  session: {
    admin: { id: 'admin', role: 'admin', tenantId: '00000000-0000-0000-0000-000000000001' },
    adminToken: 'dev-token',
    currentApp: null,
    token: 'dev-token',
    refreshToken: null,
    tokenExpiry: null,
    user: { id: 'admin', name: 'Admin Demo', role: 'admin', tenantId: '00000000-0000-0000-0000-000000000001', outletId: '00000000-0000-0000-0000-000000000002' },
    tenantId: '00000000-0000-0000-0000-000000000001',
    outletId: '00000000-0000-0000-0000-000000000002',
    shiftId: null
  },

  // ─── Token Management ──────────────────────────────────────────────────────
  _isTokenExpired() {
    if (!API.session.tokenExpiry) return false;
    return Date.now() >= API.session.tokenExpiry - 60000; // 1 min buffer
  },

  async _refreshTokenIfNeeded() {
    if (!API.session.refreshToken || !API._isTokenExpired()) return;
    try {
      const result = await API.auth.refreshToken(API.session.refreshToken);
      if (result.success) {
        API.session.token = result.token;
        API.session.refreshToken = result.refreshToken;
        API.session.tokenExpiry = Date.now() + (60 * 60 * 1000); // 1h default
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }
    } catch (e) {
      console.warn('[API] Token refresh failed:', e.message);
    }
  },

  // ─── Edge Function Request (Pure Supabase) ─────────────────────────
  async edgeRequest(functionName, options = {}) {
    await API._refreshTokenIfNeeded();
    
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      ...(options.headers || {})
    };

    const token = API.session.token || API.session.adminToken;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${EDGE_FUNCTIONS_URL}/${functionName}`, {
        method: 'POST',
        ...options,
        headers
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      return data;
    } catch (error) {
      console.error(`[Edge Function] ${functionName}:`, error);
      throw error;
    }
  },

  // ─── Legacy request() - kept for backward compatibility ───────────────────
  async request(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (API.session.token) headers['Authorization'] = `Bearer ${API.session.token}`;
      else if (API.session.adminToken) headers['Authorization'] = `Bearer ${API.session.adminToken}`;

      // ── Interceptor: Route to correct backend ──────────────────────────────
      if (endpoint.startsWith('/dashboard/kpi') || endpoint.startsWith('/dashboard-api')) {
        return await API.dashboard.getKPI();
      }
      if (endpoint.startsWith('/dashboard/weekly-chart')) {
        return await API.dashboard.getWeeklyChart();
      }
      if (endpoint.startsWith('/settings')) {
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
        const { data } = await API.supabase.from('nashtycosts').select('*')
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
        if (idMatch) {
          const { data } = await API.supabase.from('users').select('*').eq('id', idMatch[1]).single();
          return { success: true, user: data };
        }
      }
      if (endpoint.startsWith('/orders-api')) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        return await API.edgeRequest('orders-api', { body: JSON.stringify(body) });
      }
      if (endpoint.startsWith('/auth-login')) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        return await API.edgeRequest('auth-login', { body: JSON.stringify(body) });
      }
      if (endpoint.startsWith('/reports-api')) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        return await API.edgeRequest('reports-api', { body: JSON.stringify(body) });
      }
      // ── End Interceptor ────────────────────────────────────────────────────

      const response = await fetch(`${endpoint}`, { headers, ...options });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (error) {
      console.error(`[API] ${endpoint}:`, error);
      throw error;
    }
  },

  // ─── Auth Methods ──────────────────────────────────────────────────────────
  mainAuth: {
    async login(username, password) {
      const data = await API.edgeRequest('auth-login', {
        body: JSON.stringify({ action: 'main-login', username, password, outletId: null })
      });
      if (data.success && data.token) {
        API.session.admin = data.user;
        API.session.adminToken = data.token;
        API.session.tenantId = data.user.tenantId;
        if (data.refreshToken) API.session.refreshToken = data.refreshToken;
        API.session.tokenExpiry = Date.now() + (60 * 60 * 1000);
        localStorage.setItem('nashty_main_session', JSON.stringify({
          admin: data.user, adminToken: data.token,
          refreshToken: data.refreshToken,
          tenantId: data.user.tenantId, timestamp: new Date().toISOString()
        }));
      }
      return data;
    },
    async validate(token) { return { success: true }; },
    logout() {
      localStorage.removeItem('nashty_main_session');
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
      const data = await API.edgeRequest('auth-login', {
        body: JSON.stringify({ action: 'pin-login', pin, outletId })
      });
      if (data.success && data.user && data.token) {
        API.session.token = data.token;
        API.session.user = data.user;
        API.session.tenantId = data.user.tenantId;
        API.session.outletId = data.user.outletId;
        if (data.refreshToken) API.session.refreshToken = data.refreshToken;
        API.session.tokenExpiry = Date.now() + (12 * 60 * 60 * 1000); // 12h for PIN login
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }
      return data;
    },
    async refreshToken(refreshToken) {
      // In Pure Supabase without custom edge function for refresh, we just rely on existing token expiry.
      // Wait, if we use GoTrue, it handles refresh. Since we use custom JWT, edge function doesn't have refresh endpoint yet.
      // We will clear the session if expired.
      return { success: false, error: 'Token refresh not implemented in edge functions yet' };
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

  // ─── Favorites API (Pure Supabase) ──────────────────────────────────────
  favorites: {
    async getAll(userId = null) {
      const uid = userId || API.session.user?.id;
      if (!uid) throw new Error('userId required');
      const { data, error } = await API.supabase.from('favorites')
        .select('*, product:products(*)').eq('user_id', uid).order('position');
      if (error) throw error;
      return { success: true, favorites: data };
    },
    async add(productId, position = 0) {
      const userId = API.session.user?.id;
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await API.supabase.from('favorites')
        .upsert([{ user_id: userId, product_id: productId, position }]).select();
      if (error) throw error;
      return { success: true, favorite: data[0] };
    },
    async remove(favoriteId) {
      const { error } = await API.supabase.from('favorites').delete().eq('id', favoriteId);
      if (error) throw error;
      return { success: true };
    },
    async reorder(favoritesArray) {
      const userId = API.session.user?.id;
      if (!userId) throw new Error('Not authenticated');
      const payload = favoritesArray.map(f => ({ id: f.id, user_id: userId, product_id: f.productId, position: f.position }));
      const { error } = await API.supabase.from('favorites').upsert(payload);
      if (error) throw error;
      return { success: true };
    }
  },

  // ─── Analytics API (Pure Supabase) ──────────────────────────────────────
  analytics: {
    async getTopProducts(outletId = null, days = 7, limit = 20) {
      const oid = outletId || API.session.outletId;
      return await API.edgeRequest('reports-api', {
        body: JSON.stringify({ action: 'top-products', tenantId: API.session.tenantId, outletId: oid, days, limit })
      });
    }
  },

  // ─── Outlet Settings API (Pure Supabase) ─────────────────────────────────
  outletSettings: {
    async get(outletId = null) {
      const oid = outletId || API.session.outletId;
      const { data, error } = await API.supabase.from('outlet_settings').select('*').eq('outlet_id', oid);
      if (error) throw error;
      const settings = {};
      data?.forEach(row => settings[row.key] = row.value);
      return { success: true, settings };
    },
    async update(settingsObj, outletId = null) {
      const oid = outletId || API.session.outletId;
      const payload = Object.keys(settingsObj).map(key => ({
        outlet_id: oid, key, value: settingsObj[key], updated_at: new Date().toISOString()
      }));
      const { error } = await API.supabase.from('outlet_settings').upsert(payload, { onConflict: 'outlet_id, key' });
      if (error) throw error;
      return { success: true };
    },
    async uploadLogo(file, outletId = null) {
      const oid = outletId || API.session.outletId;
      const fileExt = file.name.split('.').pop();
      const fileName = `${oid}-logo-${Date.now()}.${fileExt}`;
      const { error } = await API.supabase.storage.from('receipts').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = API.supabase.storage.from('receipts').getPublicUrl(fileName);
      await API.outletSettings.update({ logo_url: publicUrl }, oid);
      return { success: true, url: publicUrl };
    },
    async uploadPromoImages(files, outletId = null) {
      const oid = outletId || API.session.outletId;
      const urls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${oid}-promo-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
        const { error } = await API.supabase.storage.from('promotions').upload(fileName, file);
        if (!error) {
          const { data: { publicUrl } } = API.supabase.storage.from('promotions').getPublicUrl(fileName);
          urls.push(publicUrl);
        }
      }
      return { success: true, urls };
    }
  },

  // ─── Dashboard API ─────────────────────────────────────────────────────────
  dashboard: {
    async getKPI(filters = {}) {
      return await API.edgeRequest('dashboard-api', {
        body: JSON.stringify({ action: 'kpi', tenantId: API.session.tenantId, outletId: API.session.outletId, ...filters })
      });
    },
    async getRecentOrders(limit = 10) {
      return await API.edgeRequest('dashboard-api', {
        body: JSON.stringify({ action: 'recent-orders', tenantId: API.session.tenantId, outletId: API.session.outletId, limit })
      });
    },
    async getWeeklyChart() {
      return await API.edgeRequest('dashboard-api', {
        body: JSON.stringify({ action: 'weekly-chart', tenantId: API.session.tenantId, outletId: API.session.outletId })
      });
    }
  },

  // ─── Orders API ────────────────────────────────────────────────────────────
  orders: {
    async create(orderData) {
      return await API.edgeRequest('orders-api', {
        body: JSON.stringify({
          action: 'create',
          tenantId: API.session.tenantId,
          outletId: API.session.outletId,
          userId: API.session.user?.id,
          shiftId: API.session.shiftId,
          ...orderData
        })
      });
    },
    async getAll(filters = {}) {
      let q = API.supabase.from('orders').select('*, order_items(*)')
        .eq('tenant_id', API.session.tenantId);
      if (API.session.outletId) q = q.eq('outlet_id', API.session.outletId);
      const { data } = await q;
      return { success: true, orders: data || [] };
    },
    async getById(id) {
      const { data } = await API.supabase.from('orders').select('*, order_items(*)').eq('id', id).single();
      return { success: true, order: data };
    },
    async updateStatus(id, statusData) {
      const { data } = await API.supabase.from('orders').update(statusData).eq('id', id).select();
      return { success: true, order: data?.[0] };
    }
  },

  // ─── Users API ─────────────────────────────────────────────────────────────
  users: {
    async getAll(filters = {}) {
      let q = API.supabase.from('users').select('*').eq('tenant_id', API.session.tenantId);
      if (filters.outletId) q = q.eq('outlet_id', filters.outletId);
      const { data } = await q;
      return { success: true, users: data };
    },
    async create(userData) {
      const { data, error } = await API.supabase.from('users')
        .insert([{ tenant_id: API.session.tenantId, ...userData }]).select();
      if (error) throw error;
      return { success: true, user: data[0] };
    },
    async update(id, userData) {
      const { data, error } = await API.supabase.from('users').update(userData).eq('id', id).select();
      if (error) throw error;
      return { success: true, user: data[0] };
    },
    async updateStatus(id, status) {
      const { data, error } = await API.supabase.from('users').update({ status }).eq('id', id).select();
      if (error) throw error;
      return { success: true, user: data[0] };
    },
    async delete(id) {
      await API.supabase.from('users').delete().eq('id', id);
      return { success: true };
    }
  },

  // ─── Menu API ──────────────────────────────────────────────────────────────
  menu: {
    async getOutletMenu(outletId) {
      if (!outletId) outletId = API.session.outletId;
      const { data: categories } = await API.supabase.from('categories').select('*').eq('tenant_id', API.session.tenantId);
      const { data: products } = await API.supabase.from('products').select('*').eq('tenant_id', API.session.tenantId);
      return { success: true, menu: { categories, products } };
    }
  },

  // ─── Categories API ────────────────────────────────────────────────────────
  categories: {
    async getAll() {
      const { data, error } = await API.supabase.from('categories').select('*').eq('tenant_id', API.session.tenantId);
      return { success: !error, data: data || [] };
    },
    async create(data) {
      const { data: res, error } = await API.supabase.from('categories')
        .insert([{ ...data, tenant_id: API.session.tenantId }]).select();
      if (error) throw error;
      return { success: true, data: res[0] };
    },
    async update(id, data) {
      const { data: res, error } = await API.supabase.from('categories').update(data).eq('id', id).select();
      if (error) throw error;
      return { success: true, data: res[0] };
    },
    async delete(id) {
      await API.supabase.from('categories').delete().eq('id', id);
      return { success: true };
    }
  },

  // ─── Products API ──────────────────────────────────────────────────────────
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
      const { data: res, error } = await API.supabase.from('products')
        .insert([{ ...data, tenant_id: API.session.tenantId }]).select();
      if (error) throw error;
      return { success: true, data: res[0] };
    },
    async update(id, data) {
      const { data: res, error } = await API.supabase.from('products').update(data).eq('id', id).select();
      if (error) throw error;
      return { success: true, data: res[0] };
    },
    async delete(id) {
      await API.supabase.from('products').delete().eq('id', id);
      return { success: true };
    }
  },

  // ─── Modifiers API ─────────────────────────────────────────────────────────
  modifiers: {
    async getAll() {
      const { data } = await API.supabase.from('modifier_groups')
        .select('*, modifier_options(*)').eq('tenant_id', API.session.tenantId);
      return { success: true, modifiers: data || [] };
    },
    async create(data) {
      const { data: res } = await API.supabase.from('modifier_groups')
        .insert([{ ...data, tenant_id: API.session.tenantId }]).select();
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
      const { data: res } = await API.supabase.from('modifier_options')
        .insert([{ ...data, group_id: groupId }]).select();
      return { success: true, option: res[0] };
    },
    async deleteOption(optionId) {
      await API.supabase.from('modifier_options').delete().eq('id', optionId);
      return { success: true };
    }
  },

  // ─── Shifts API ────────────────────────────────────────────────────────────
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
        end_cash: endCash, notes, status: 'closed', end_time: new Date().toISOString()
      }).eq('id', shiftId).select();
      API.session.shiftId = null;
      localStorage.setItem('nashty_session', JSON.stringify(API.session));
      return { success: true, shift: data?.[0] };
    },
    async getActive() {
      const { data } = await API.supabase.from('shifts')
        .select('*').eq('user_id', API.session.user?.id).eq('status', 'open').limit(1);
      if (data && data.length > 0) {
        API.session.shiftId = data[0].id;
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
        return { success: true, shift: data[0] };
      }
      return { success: true, shift: null };
    }
  },

  // ─── Legacy Settings (for backward compat) ────────────────────────────────
  settings: {
    async get() {
      try {
        return await API.outletSettings.get();
      } catch {
        const { data } = await API.supabase.from('settings').select('*')
          .eq('outlet_id', API.session.outletId).single();
        return { success: true, settings: data?.settings || {} };
      }
    },
    async update(settingsObj) {
      try {
        return await API.outletSettings.update(settingsObj);
      } catch {
        const { data } = await API.supabase.from('settings').upsert({
          outlet_id: API.session.outletId, settings: settingsObj
        }).select();
        return { success: true, settings: data?.[0] };
      }
    }
  },

  // ─── KDS API ──────────────────────────────────────────────────────────────
  kds: {
    async getAnalytics() {
      return { success: true, data: { avgTime: 0, totalOrders: 0 } };
    }
  },

  // ─── Outlets API ──────────────────────────────────────────────────────────
  outlets: {
    async getAll() {
      const { data } = await API.supabase.from('outlets').select('*')
        .eq('tenant_id', API.session.tenantId);
      return { success: true, outlets: data || [] };
    }
  },

  // ─── Reports API ──────────────────────────────────────────────────────────
  reports: {
    async getSales(filters = {}) {
      return await API.edgeRequest('reports-api', {
        body: JSON.stringify({
          action: 'sales',
          tenantId: API.session.tenantId,
          outletId: API.session.outletId,
          ...filters
        })
      });
    },
    async getTopProducts(filters = {}) {
      return await API.edgeRequest('reports-api', {
        body: JSON.stringify({
          action: 'top-products',
          tenantId: API.session.tenantId,
          outletId: API.session.outletId,
          ...filters
        })
      });
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
  window.APIv2 = API;
}
