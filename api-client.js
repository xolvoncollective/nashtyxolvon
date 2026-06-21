/**
 * NASHTY OS API Client v3.1 - PURE SUPABASE (FIXED)
 * 100% Supabase (Edge Functions + Direct DB Access)
 * NO Railway Backend - Cloudflare Pages Compatible
 * Fixed: Dead code removed, all endpoints working, no 404s
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
      // IMPORTANT: Always use SUPABASE_ANON_KEY for Authorization header
      // to pass the Supabase gateway. Custom user token is sent via x-nashty-token.
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      };

      // Pass user token via custom header (not Authorization, which Supabase gateway validates)
      const userToken = API.session.token || API.session.adminToken;
      if (userToken) {
        headers['x-nashty-token'] = userToken;
      }

      const response = await fetch(`${EDGE_FUNCTIONS_URL}/${functionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      // Global 401 Handler - only for explicit auth failures from our Edge Functions
      if (response.status === 401 && functionName !== 'auth-login' && data.code !== 'UNAUTHORIZED_LEGACY_JWT') {
          console.warn('[API] 401 Unauthorized detected. Forcing logout.');
          if (typeof window.NASHTY_AUTH !== 'undefined') window.NASHTY_AUTH.clearAuth();
          if (API.auth && typeof API.auth.logout === 'function') API.auth.logout();
          throw new Error('Sesi telah kedaluwarsa. Silakan login kembali.');
      }
      
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
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
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
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
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
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
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
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
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
      const data = await API.edgeRequest('orders-api', {
        action: 'start-shift',
        outletId: API.session.outletId,
        userId: API.session.user?.id,
        startCash: startCash
      });
      if (data.success && data.shift) {
        API.session.shiftId = data.shift.id;
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }
      return data;
    },

    async end(shiftId, endCash, notes = '') {
      const data = await API.edgeRequest('orders-api', {
        action: 'end-shift',
        shiftId,
        endCash,
        notes
      });
      if (data.success) {
        API.session.shiftId = null;
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }
      return data;
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
      
      // Get products with modifier groups
      const { data: products } = await API.supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          modifier_groups:product_modifiers(
            modifier_group:modifier_groups(
              id,
              name,
              type,
              required,
              max_select,
              options:modifier_options(*)
            )
          )
        `)
        .eq('tenant_id', API.session.tenantId);

      // Transform products to include modifier_groups array
      const transformedProducts = (products || []).map(p => ({
        ...p,
        modifier_groups: (p.modifier_groups || []).map(pm => ({
          ...pm.modifier_group,
          options: pm.modifier_group?.options || []
        })).filter(g => g && g.id)
      }));

      return { 
        success: true, 
        data: { 
          categories: categories || [], 
          items: transformedProducts 
        } 
      };
    }
  },

  async request(endpoint, options = {}) {
    try {
      const method = options.method || 'GET';
      const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : null;

      // Dashboard endpoints
      if (endpoint.startsWith('/dashboard/kpi')) {
        return await API.dashboard.getKPI(body || {});
      }
      if (endpoint.startsWith('/dashboard/weekly-chart')) {
        return await API.dashboard.getWeeklyChart();
      }
      if (endpoint.startsWith('/dashboard/recent-orders')) {
        return await API.dashboard.getRecentOrders(body?.limit || 10);
      }

      // Auth endpoints
      if (endpoint.startsWith('/auth-login') || endpoint.startsWith('/auth/login')) {
        return await API.edgeRequest('auth-login', body);
      }
      if (endpoint.startsWith('/auth/staff')) {
        const urlObj = new URL('http://dummy' + endpoint);
        return await API.auth.getStaff(urlObj.searchParams.get('outletId'));
      }

      // Favorites endpoints
      if (endpoint.startsWith('/favorites')) {
        if (method === 'POST') {
          return await API.favorites.add(body.productId, body.position || 0);
        }
        if (method === 'DELETE') {
          const idMatch = endpoint.match(/\/favorites\/([^?]+)/);
          if (idMatch) return await API.favorites.remove(idMatch[1]);
        }
        if (method === 'PUT' && endpoint.includes('/reorder')) {
          return await API.favorites.reorder(body.favorites);
        }
        const urlObj = new URL('http://dummy' + endpoint);
        return await API.favorites.getAll(urlObj.searchParams.get('userId'));
      }

      // Analytics endpoints
      if (endpoint.startsWith('/analytics/top-products')) {
        const urlObj = new URL('http://dummy' + endpoint);
        return await API.analytics.getTopProducts(
          urlObj.searchParams.get('outletId'),
          parseInt(urlObj.searchParams.get('days')) || 7,
          parseInt(urlObj.searchParams.get('limit')) || 20
        );
      }

      // Products endpoints
      if (endpoint.startsWith('/products')) {
        if (endpoint.includes('/duplicate')) {
          const idMatch = endpoint.match(/\/products\/([^/]+)\/duplicate/);
          if (idMatch) {
            const { data: p } = await API.supabase.from('products').select('*').eq('id', idMatch[1]).single();
            if (p) {
              delete p.id;
              p.name = p.name + ' (Copy)';
              const { data } = await API.supabase.from('products').insert(p).select();
              return { success: true, data: data[0] };
            }
          }
          return { success: false, error: 'Product not found' };
        }
        
        const idMatch = endpoint.match(/\/products\/([^?/]+)/);
        if (idMatch && idMatch[1] !== 'search') {
          if (method === 'PUT') {
            return await API.products.update(idMatch[1], body);
          }
          if (method === 'DELETE') {
            return await API.products.delete(idMatch[1]);
          }
          return await API.products.getById(idMatch[1]);
        }
        
        if (method === 'POST') {
          return await API.products.create(body);
        }
        
        return await API.products.getAll();
      }

      // Categories endpoints
      if (endpoint.startsWith('/categories')) {
        const idMatch = endpoint.match(/\/categories\/([^?]+)/);
        if (idMatch) {
          if (method === 'PUT') return await API.categories.update(idMatch[1], body);
          if (method === 'DELETE') return await API.categories.delete(idMatch[1]);
        }
        if (method === 'POST') return await API.categories.create(body);
        return await API.categories.getAll();
      }

      // Orders endpoints
      if (endpoint.startsWith('/orders')) {
        const idMatch = endpoint.match(/\/orders\/([^?/]+)/);
        if (idMatch) {
          if (endpoint.includes('/status')) {
            return await API.orders.updateStatus(idMatch[1], body);
          }
          return await API.orders.getById(idMatch[1]);
        }
        if (method === 'POST') {
          return await API.orders.create(body);
        }
        return await API.orders.getAll(body || {});
      }

      // Reports endpoints
      if (endpoint.startsWith('/reports/sales')) {
        return await API.reports.getSales(body || {});
      }
      if (endpoint.startsWith('/reports/top-products')) {
        return await API.reports.getTopProducts(body || {});
      }

      // Settings endpoints
      if (endpoint.startsWith('/settings')) {
        const logoMatch = endpoint.match(/\/settings\/([^/]+)\/logo/);
        if (logoMatch && method === 'POST') {
          if (body.base64Data) {
            const res = await fetch(body.base64Data);
            const blob = await res.blob();
            const file = new File([blob], 'logo.png', { type: blob.type });
            return await API.outletSettings.uploadLogo(file, logoMatch[1]);
          }
        }
        if (method === 'PUT') {
          return await API.outletSettings.update(body.settings || body);
        }
        return await API.outletSettings.get();
      }

      // Shifts endpoints
      if (endpoint.startsWith('/shifts')) {
        const summaryMatch = endpoint.match(/\/shifts\/([^/]+)\/summary/);
        if (summaryMatch) {
          // Get shift summary
          const { data: shift } = await API.supabase
            .from('shifts')
            .select('*, orders(total)')
            .eq('id', summaryMatch[1])
            .single();
          
          if (shift) {
            const totalSales = (shift.orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
            return { 
              success: true, 
              summary: {
                total_orders: shift.orders?.length || 0,
                gross_sales: totalSales,
                net_sales: totalSales,
                total_collected: totalSales,
                start_cash: shift.start_cash || 0,
                expected_cash: (shift.start_cash || 0) + totalSales
              }
            };
          }
        }
      }

      // Users endpoints
      if (endpoint.startsWith('/users')) {
        const idMatch = endpoint.match(/\/users\/([^?]+)/);
        if (idMatch) {
          if (method === 'PUT') return await API.users.update(idMatch[1], body);
          if (method === 'DELETE') return await API.users.delete(idMatch[1]);
          const { data } = await API.supabase.from('users').select('*').eq('id', idMatch[1]).single();
          return { success: true, user: data };
        }
        if (method === 'POST') return await API.users.create(body);
        return await API.users.getAll(body || {});
      }

      // Outlets endpoints
      if (endpoint.startsWith('/outlets')) {
        return await API.outlets.getAll();
      }

      // Activity logs endpoints
      if (endpoint.startsWith('/activity-logs')) {
        const { data } = await API.supabase.from('activity_logs')
          .select('*')
          .eq('tenant_id', API.session.tenantId)
          .order('created_at', { ascending: false })
          .limit(50);
        return { success: true, logs: data || [] };
      }

      // Costs endpoints (Local Storage Mock)
      if (endpoint.startsWith('/costs')) {
        let costs = JSON.parse(localStorage.getItem('nashty_costs') || '[]');
        if (method === 'POST') {
          body.id = 'cost_' + Date.now();
          body.created_at = new Date().toISOString();
          costs.push(body);
          localStorage.setItem('nashty_costs', JSON.stringify(costs));
          return { success: true, costs };
        }
        if (method === 'DELETE') {
          const idMatch = endpoint.match(/\/costs\/([^?]+)/);
          if (idMatch) {
            costs = costs.filter(c => c.id !== idMatch[1]);
            localStorage.setItem('nashty_costs', JSON.stringify(costs));
          }
          return { success: true };
        }
        if (method === 'PUT') {
          const idMatch = endpoint.match(/\/costs\/([^?]+)/);
          if (idMatch) {
            const index = costs.findIndex(c => c.id === idMatch[1]);
            if (index !== -1) {
              costs[index] = { ...costs[index], ...body, id: idMatch[1] };
              localStorage.setItem('nashty_costs', JSON.stringify(costs));
              return { success: true, cost: costs[index] };
            }
          }
          return { success: false, error: 'Cost not found' };
        }
        
        // Filter for GET
        const urlObj = new URL('http://dummy' + endpoint);
        const category = urlObj.searchParams.get('category');
        if (category) costs = costs.filter(c => c.category === category);
        
        return { success: true, costs };
      }

      // Health check
      if (endpoint.startsWith('/health')) {
        return { status: 'ok', message: 'Pure Supabase API Client v3.1', timestamp: new Date().toISOString() };
      }

      // If endpoint not matched, return 404
      console.warn(`[API] Unhandled endpoint: ${method} ${endpoint}`);
      throw new Error(`Endpoint not implemented: ${endpoint}`);

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
  // First restore from localStorage
  API.mainAuth.restoreSession();
  API.auth.restoreSession();
  
  // Then sync with NASHTY_AUTH if available
  if (typeof window.NASHTY_AUTH !== 'undefined' && window.NASHTY_AUTH.hasValidAuth()) {
    const authData = window.NASHTY_AUTH.getAuthData();
    if (authData.token && authData.user) {
      // Sync to API.session
      API.session.token = authData.token;
      API.session.user = authData.user;
      API.session.tenantId = authData.user.tenant_id || authData.user.tenantId || API.session.tenantId;
      API.session.outletId = authData.outlet?.id || authData.outlet?.outlet_id || authData.user.outlet_id || API.session.outletId;
      console.log('[API] Synced auth from NASHTY_AUTH:', authData.user.name);
    }
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) module.exports = API;
if (typeof window !== 'undefined') {
  window.API = API;
  window.APIv3 = API; // v3 = Pure Supabase

  // Global Fetch Interceptor for Legacy POS code calling /api/ endpoints
  const originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    const urlStr = url.toString();
    if (urlStr.includes('/api/')) {
      const endpoint = urlStr.substring(urlStr.indexOf('/api/') + 4);
      try {
        const data = await API.request(endpoint, options);
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    return originalFetch(url, options);
  };
}
