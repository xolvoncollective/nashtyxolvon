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



const safeJsonParse = (value, fallback) => {

  try {

    const parsed = JSON.parse(value);

    return parsed == null ? fallback : parsed;

  } catch (_) {

    return fallback;

  }

};



const slugifyText = (value = '') => value

  .toString()

  .toLowerCase()

  .trim()

  .replace(/[^a-z0-9]+/g, '-')

  .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;



const createLocalId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;



const getScopedStorageKey = (baseKey) => {

  const tenantId = (typeof API !== 'undefined' && API.session && API.session.tenantId) ? API.session.tenantId : 'global';

  return `${baseKey}:${tenantId}`;

};



const getStoredCollection = (baseKey) => {

  if (typeof localStorage === 'undefined') return [];

  const scopedValue = safeJsonParse(localStorage.getItem(getScopedStorageKey(baseKey)), null);

  if (Array.isArray(scopedValue)) return scopedValue;

  const legacyValue = safeJsonParse(localStorage.getItem(baseKey), []);

  return Array.isArray(legacyValue) ? legacyValue : [];

};



const setStoredCollection = (baseKey, collection) => {

  if (typeof localStorage === 'undefined') return;

  const serialized = JSON.stringify(collection);

  localStorage.setItem(getScopedStorageKey(baseKey), serialized);

  localStorage.setItem(baseKey, serialized);

};



const API = {

  supabase: supabaseClient,



  // ÔöÇÔöÇÔöÇ Session State ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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



  // ÔöÇÔöÇÔöÇ Edge Function Request ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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

      

      // Global 401 Handler - DISABLED FOR LOGIN SAFETY

      // Only handle 401 if we're actually logged in and it's not a login attempt

      if (response.status === 401 && functionName !== 'auth-login' && data.code !== 'UNAUTHORIZED_LEGACY_JWT') {

          console.warn('[API] 401 Unauthorized detected from', functionName);

          // DON'T auto-logout during login flows or staff selection

          // Only logout if we're truly authenticated and session expired

          const hasValidAuth = typeof window.NASHTY_AUTH !== 'undefined' && window.NASHTY_AUTH.hasValidAuth && window.NASHTY_AUTH.hasValidAuth();

          if (hasValidAuth) {

            console.warn('[API] Clearing expired session');

            if (typeof window.NASHTY_AUTH !== 'undefined') window.NASHTY_AUTH.clearAuth();

          }

          throw new Error(data.error || 'Sesi telah kedaluwarsa. Silakan login kembali.');

      }

      

      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

      return data;

    } catch (error) {

      console.error(`[Edge Function] ${functionName}:`, error);

      throw error;

    }

  },



  // ÔöÇÔöÇÔöÇ Main Auth (Admin/Manager Login) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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



  // ÔöÇÔöÇÔöÇ Staff Auth (PIN Login) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  auth: {

    async getStaff(outletId = null) {
      try {
        // FIXED: Query 'staff' table (not 'users')
        let q = API.supabase
          .from('staff')
          .select('id, name, role, tenant_id, outlet_id, pin, color')
          .eq('is_active', true);
        
        if (outletId) q = q.eq('outlet_id', outletId);
        
        const { data, error } = await q;
        
        if (error) {
          console.error('[getStaff] Database error:', error);
          return { success: false, staff: [], error: error.message };
        }
        
        console.log(`[getStaff] Found ${(data || []).length} staff for outlet:`, outletId);
        return { success: true, staff: data || [] };
      } catch (err) {
        console.error('[getStaff] Exception:', err);
        return { success: false, staff: [], error: err.message };
      }
    },



    async login(pin, outletId = null) {
      try {
        if (!pin) {
          return { success: false, error: 'PIN diperlukan' };
        }
        
        if (!outletId) {
          return { success: false, error: 'Outlet harus dipilih terlebih dahulu' };
        }

        console.log(`[POS Login] Attempting PIN login for outlet: ${outletId}`);
        
        // FIXED: Query 'staff' table (not 'users')
        const { data, error } = await API.supabase
          .from('staff')
          .select('id, name, role, tenant_id, outlet_id, pin, color')
          .eq('pin', pin)
          .eq('outlet_id', outletId)
          .eq('is_active', true)
          .single();
        
        if (error || !data) {
          console.error('[POS Login] Failed:', error?.message || 'Staff not found');
          return { 
            success: false, 
            error: 'PIN salah atau tidak valid untuk outlet ini' 
          };
        }
        
        console.log(`[POS Login] Success: ${data.name} (${data.id})`);
        
        // Generate simple token for POS session
        const token = `pos_${data.id}_${Date.now()}`;
        
        // Set session
        API.session.token = token;
        API.session.user = {
          id: data.id,
          name: data.name,
          role: data.role,
          tenantId: data.tenant_id,
          outletId: data.outlet_id
        };
        API.session.tenantId = data.tenant_id;
        API.session.outletId = data.outlet_id;
        API.session.tokenExpiry = Date.now() + (12 * 60 * 60 * 1000); // 12h
        
        // Store in localStorage
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
        
        return { 
          success: true, 
          token: token,
          user: API.session.user
        };
      } catch (err) {
        console.error('[POS Login] Exception:', err);
        return { 
          success: false, 
          error: err.message || 'Login gagal' 
        };
      }
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



  // ÔöÇÔöÇÔöÇ Favorites API (Edge Function) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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



  // ÔöÇÔöÇÔöÇ Analytics API (Edge Function with Caching) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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



  // ÔöÇÔöÇÔöÇ Settings API (Edge Function) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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

    },



    async getQris(outletId = null) {

      const oid = outletId || API.session.outletId;

      if (!oid) throw new Error('outletId required');



      const { data, error } = await API.supabase

        .from('outlets')

        .select('qris_static_url')

        .eq('id', oid)

        .single();



      if (error) throw error;

      return { success: true, qris_static_url: data?.qris_static_url || null };

    },



    async uploadQris(file, outletId = null) {

      const oid = outletId || API.session.outletId;

      if (!oid) throw new Error('outletId required');

      const ext = (file.name.split('.').pop() || 'png').toLowerCase();

      const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

      if (!allowedExts.includes(ext)) throw new Error('Format QRIS harus JPG, JPEG, PNG, atau WebP');



      const filePath = `qris/${oid}-${Date.now()}.${ext}`;

      const { error: uploadError } = await API.supabase.storage

        .from('outlet-assets')

        .upload(filePath, file, { contentType: file.type || `image/${ext}`, upsert: true });

      if (uploadError) throw uploadError;



      const { data: urlData } = API.supabase.storage

        .from('outlet-assets')

        .getPublicUrl(filePath);



      const qrisUrl = urlData.publicUrl;

      const { data, error } = await API.supabase

        .from('outlets')

        .update({ qris_static_url: qrisUrl })

        .eq('id', oid)

        .select()

        .single();



      if (error) throw error;

      return { success: true, qris_static_url: data?.qris_static_url || qrisUrl };

    },



    async removeQris(outletId = null) {

      const oid = outletId || API.session.outletId;

      if (!oid) throw new Error('outletId required');



      const { error } = await API.supabase

        .from('outlets')

        .update({ qris_static_url: null })

        .eq('id', oid);



      if (error) throw error;

      return { success: true };

    }

  },



  // ÔöÇÔöÇÔöÇ Dashboard API (Edge Function) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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



  // ÔöÇÔöÇÔöÇ Orders API (Edge Function) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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

    

    async getKDSQueue() {

      return await API.edgeRequest('orders-api', {

        action: 'get-kds-queue',

        tenantId: API.session.tenantId,

        outletId: API.session.outletId

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



  // ÔöÇÔöÇÔöÇ Reports API (Edge Function) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  reports: {

    _getDateRange(filters = {}) {

      const today = new Date().toISOString().split('T')[0];

      const dateFrom = filters.dateFrom || today;

      const dateTo = filters.dateTo || dateFrom;

      return {

        dateFrom,

        dateTo,

        fromIso: `${dateFrom}T00:00:00.000Z`,

        toIso: `${dateTo}T23:59:59.999Z`

      };

    },



    async _getOrdersForRange(filters = {}) {

      const { fromIso, toIso } = this._getDateRange(filters);

      const outletId = filters.outletId || API.session.outletId;

      let q = API.supabase

        .from('orders')

        .select('*')

        .eq('tenant_id', API.session.tenantId)

        .gte('created_at', fromIso)

        .lte('created_at', toIso)

        .order('created_at', { ascending: false });



      if (outletId) q = q.eq('outlet_id', outletId);



      const { data, error } = await q;

      if (error) throw error;

      return data || [];

    },



    async _getOrderItems(orderIds = []) {

      if (!orderIds.length) return [];

      const { data, error } = await API.supabase

        .from('order_items')

        .select('*')

        .in('order_id', orderIds);

      if (error) throw error;

      return data || [];

    },



    async getSales(filters = {}) {

      const orders = await this._getOrdersForRange(filters);

      const paidOrders = orders.filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelled');

      const summary = paidOrders.reduce((acc, order) => {

        acc.gross_sales += Number(order.subtotal || 0);

        acc.net_sales += Number(order.total || 0) - Number(order.tax || 0) - Number(order.service_charge || 0);

        acc.total_orders += 1;

        acc.total_discount += Number(order.discount || 0);

        acc.total_tax += Number(order.tax || 0);

        acc.total_sc += Number(order.service_charge || 0);

        return acc;

      }, {

        gross_sales: 0,

        net_sales: 0,

        total_orders: 0,

        total_discount: 0,

        total_tax: 0,

        total_sc: 0

      });



      const dailySalesMap = new Map();

      const byOrderTypeMap = new Map();

      paidOrders.forEach(order => {

        const dateKey = (order.created_at || '').split('T')[0] || order.created_at;

        if (!dailySalesMap.has(dateKey)) {

          dailySalesMap.set(dateKey, { date: dateKey, order_count: 0, total_sales: 0, gross_sales: 0 });

        }

        const dayEntry = dailySalesMap.get(dateKey);

        dayEntry.order_count += 1;

        dayEntry.total_sales += Number(order.total || 0);

        dayEntry.gross_sales += Number(order.subtotal || 0);



        const orderType = order.order_type || 'other';

        if (!byOrderTypeMap.has(orderType)) {

          byOrderTypeMap.set(orderType, { order_type: orderType, order_count: 0, total_sales: 0 });

        }

        const typeEntry = byOrderTypeMap.get(orderType);

        typeEntry.order_count += 1;

        typeEntry.total_sales += Number(order.total || 0);

      });



      return {

        success: true,

        data: {

          summary,

          dailySales: Array.from(dailySalesMap.values()).sort((a, b) => a.date.localeCompare(b.date)),

          byOrderType: Array.from(byOrderTypeMap.values()).sort((a, b) => b.total_sales - a.total_sales)

        }

      };

    },



    async getTopProducts(filters = {}) {

      return await API.edgeRequest('reports-api', {

        action: 'top-products',

        tenantId: API.session.tenantId,

        outletId: API.session.outletId,

        ...filters

      });

    },



    async getProducts(filters = {}) {

      const orders = await this._getOrdersForRange(filters);

      const paidOrders = orders.filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelled');

      const orderIds = paidOrders.map(o => o.id);

      const items = await this._getOrderItems(orderIds);



      const productMap = new Map();

      items.forEach(item => {

        const productId = item.product_id || 'unknown';

        if (!productMap.has(productId)) {

          productMap.set(productId, {

            id: productId,

            name: item.product_name || 'Produk',

            qty: 0,

            revenue: 0,

            orders: new Set()

          });

        }

        const entry = productMap.get(productId);

        entry.qty += Number(item.quantity || 0);

        entry.revenue += Number(item.subtotal || 0);

        entry.orders.add(item.order_id);

      });



      const products = Array.from(productMap.values())

        .map(item => ({

          id: item.id,

          name: item.name,

          total_qty: item.qty,

          total_revenue: item.revenue,

          total_orders: item.orders.size

        }))

        .sort((a, b) => b.total_revenue - a.total_revenue);



      return { success: true, data: { products } };

    },



    async getCashiers(filters = {}) {

      const orders = await this._getOrdersForRange(filters);

      const paidOrders = orders.filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelled');

      const userIds = [...new Set(paidOrders.map(o => o.user_id).filter(Boolean))];

      let usersMap = new Map();

      if (userIds.length) {

        const { data: users, error } = await API.supabase.from('users').select('id, name').in('id', userIds);

        if (error) throw error;

        usersMap = new Map((users || []).map(user => [user.id, user]));

      }



      const cashierMap = new Map();

      paidOrders.forEach(order => {

        const userId = order.user_id || 'unknown';

        if (!cashierMap.has(userId)) {

          cashierMap.set(userId, {

            user_id: userId,

            cashier_name: usersMap.get(userId)?.name || order.user_name || 'Unknown',

            total_orders: 0,

            total_sales: 0

          });

        }

        const entry = cashierMap.get(userId);

        entry.total_orders += 1;

        entry.total_sales += Number(order.total || 0);

      });



      const cashiers = Array.from(cashierMap.values())

        .map(item => ({

          ...item,

          avg_order_value: item.total_orders ? item.total_sales / item.total_orders : 0

        }))

        .sort((a, b) => b.total_sales - a.total_sales);



      return { success: true, data: { cashiers } };

    },



    async getMenuEngineering(filters = {}) {

      const orders = await this._getOrdersForRange(filters);

      const paidOrders = orders.filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelled');

      const orderIds = paidOrders.map(o => o.id);

      const items = await this._getOrderItems(orderIds);

      const productIds = [...new Set(items.map(item => item.product_id).filter(Boolean))];



      let productLookup = new Map();

      let categoryLookup = new Map();

      if (productIds.length) {

        const { data: products, error } = await API.supabase

          .from('products')

          .select('id, name, category_id, price, cost, production_time')

          .in('id', productIds);

        if (error) throw error;

        productLookup = new Map((products || []).map(product => [product.id, product]));



        const categoryIds = [...new Set((products || []).map(product => product.category_id).filter(Boolean))];

        if (categoryIds.length) {

          const { data: categories, error: categoryError } = await API.supabase

            .from('categories')

            .select('id, name')

            .in('id', categoryIds);

          if (categoryError) throw categoryError;

          categoryLookup = new Map((categories || []).map(category => [category.id, category]));

        }

      }



      const itemMap = new Map();

      items.forEach(item => {

        const product = productLookup.get(item.product_id) || {};

        const key = item.product_id || createLocalId('product');

        if (!itemMap.has(key)) {

          itemMap.set(key, {

            product_id: item.product_id,

            product_name: item.product_name || product.name || 'Produk',

            category_name: categoryLookup.get(product.category_id)?.name || 'Uncategorized',

            avg_price: Number(product.price || item.unit_price || 0),

            unit_cost: Number(product.cost || 0),

            production_time: Number(product.production_time || 10),

            total_qty: 0,

            total_revenue: 0,

            total_profit: 0

          });

        }

        const entry = itemMap.get(key);

        const qty = Number(item.quantity || 0);

        const revenue = Number(item.subtotal || 0);

        const profit = revenue - (Number(product.cost || 0) * qty);

        entry.total_qty += qty;

        entry.total_revenue += revenue;

        entry.total_profit += profit;

      });



      const products = Array.from(itemMap.values()).map(product => ({

        ...product,

        profit_margin: product.avg_price - product.unit_cost

      }));



      const avgQty = products.length ? products.reduce((sum, item) => sum + item.total_qty, 0) / products.length : 0;

      const avgProfitMargin = products.length ? products.reduce((sum, item) => sum + item.profit_margin, 0) / products.length : 0;



      const classifiedProducts = products.map(product => {

        const popular = product.total_qty >= avgQty;

        const profitable = product.profit_margin >= avgProfitMargin;

        const classification = profitable && popular

          ? 'star'

          : (!profitable && popular)

            ? 'plowhorse'

            : (profitable && !popular)

              ? 'puzzle'

              : 'dog';

        return { ...product, classification };

      });



      const summary = classifiedProducts.reduce((acc, item) => {

        if (item.classification === 'star') acc.stars += 1;

        if (item.classification === 'plowhorse') acc.plowhorses += 1;

        if (item.classification === 'puzzle') acc.puzzles += 1;

        if (item.classification === 'dog') acc.dogs += 1;

        return acc;

      }, { stars: 0, plowhorses: 0, puzzles: 0, dogs: 0 });



      return {

        success: true,

        data: {

          products: classifiedProducts,

          averages: { avgQty, avgProfitMargin },

          summary

        }

      };

    }

  },



  // ÔöÇÔöÇÔöÇ Direct Supabase Queries (for simple CRUD) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  users: {

    async getAll(filters = {}) {

      let q = API.supabase.from('users').select('*').eq('tenant_id', API.session.tenantId);

      if (filters.role) q = q.eq('role', filters.role);

      if (filters.outletId) q = q.eq('outlet_id', filters.outletId);

      q = q.order('name', { ascending: true });

      const { data, error } = await q;

      if (error) throw error;



      const outletIds = [...new Set((data || []).map(user => user.outlet_id).filter(Boolean))];

      let outletMap = new Map();

      if (outletIds.length) {

        const { data: outlets } = await API.supabase.from('outlets').select('id, name').in('id', outletIds);

        outletMap = new Map((outlets || []).map(outlet => [outlet.id, outlet.name]));

      }



      const users = (data || []).map(user => ({

        ...user,

        outlet_name: user.outlet_id ? (outletMap.get(user.outlet_id) || 'Outlet') : 'Semua Outlet'

      }));



      return { success: true, users, data: users };

    },



    async create(userData) {

      const payload = {

        tenant_id: API.session.tenantId,

        name: userData.name,

        phone: userData.phone || null,

        email: userData.email || null,

        role: userData.role || 'cashier',

        outlet_id: userData.outletId ?? userData.outlet_id ?? null,

        pin: userData.pin || null,

        status: userData.status || 'active'

      };

      const { data, error } = await API.supabase.from('users')

        .insert([payload]).select();

      if (error) throw error;

      return { success: true, user: data[0], data: data[0] };

    },



    async update(id, userData) {

      const payload = {

        ...userData,

        outlet_id: userData.outletId ?? userData.outlet_id ?? undefined

      };

      delete payload.outletId;

      if (payload.pin === '') delete payload.pin;

      const { data, error } = await API.supabase.from('users')

        .update(payload).eq('id', id).select();

      if (error) throw error;

      return { success: true, user: data[0], data: data[0] };

    },



    async updateStatus(id, status) {

      return await API.users.update(id, { status });

    },



    async delete(id) {

      await API.supabase.from('users').delete().eq('id', id);

      return { success: true };

    }

  },



  categories: {

    async getAll(filters = {}) {

      let q = API.supabase.from('categories')

        .select('*')

        .eq('tenant_id', API.session.tenantId)

        .order('name', { ascending: true });

      if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);

      const { data, error } = await q;

      if (error) throw error;

      const categories = data || [];

      return { success: true, categories, data: categories };

    },



    async create(data) {

      const payload = {

        tenant_id: API.session.tenantId,

        name: data.name,

        description: data.description || null,

        slug: slugifyText(data.name),

        status: data.status || 'active'

      };

      const { data: res, error } = await API.supabase.from('categories')

        .insert([payload]).select();

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

    },



    async updateStatus(id, status) {

      return await API.categories.update(id, { status });

    },



    async getProducts(id) {

      const { data, error } = await API.supabase.from('products')

        .select('*')

        .eq('tenant_id', API.session.tenantId)

        .eq('category_id', id)

        .order('name', { ascending: true });

      if (error) throw error;

      const products = data || [];

      return { success: true, products, data: products };

    }

  },



  modifiers: {

    async getAll() {

      const { data, error } = await API.supabase.from('modifier_groups')

        .select('*, options:modifier_options(*)')

        .eq('tenant_id', API.session.tenantId)

        .order('name', { ascending: true });

      if (error) throw error;

      const modifiers = (data || []).map(group => ({

        ...group,

        options: (group.options || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))

      }));

      return { success: true, modifiers, data: modifiers };

    },



    async create(payload) {

      const groupPayload = {

        tenant_id: API.session.tenantId,

        name: payload.name,

        description: payload.description || null,

        type: payload.type || 'single',

        required: payload.required ? 1 : 0,

        min_select: payload.minSelect ?? payload.min_select ?? 0,

        max_select: payload.maxSelect ?? payload.max_select ?? 1,

        status: payload.status || 'active'

      };

      const { data, error } = await API.supabase.from('modifier_groups')

        .insert([groupPayload]).select().single();

      if (error) throw error;



      if (Array.isArray(payload.options) && payload.options.length) {

        const optionRows = payload.options.map((option, index) => ({

          group_id: data.id,

          name: option.name,

          price_adjustment: Number(option.priceAdjustment ?? option.price_adjustment ?? 0),

          display_order: index

        }));

        const { error: optionError } = await API.supabase.from('modifier_options').insert(optionRows);

        if (optionError) throw optionError;

      }



      return await API.modifiers.getAll();

    },



    async update(id, payload) {

      const groupPayload = {

        name: payload.name,

        description: payload.description || null,

        type: payload.type || 'single',

        required: payload.required ? 1 : 0,

        min_select: payload.minSelect ?? payload.min_select ?? 0,

        max_select: payload.maxSelect ?? payload.max_select ?? 1,

        status: payload.status || 'active'

      };

      const { error } = await API.supabase.from('modifier_groups').update(groupPayload).eq('id', id);

      if (error) throw error;



      if (Array.isArray(payload.options)) {

        await API.supabase.from('modifier_options').delete().eq('group_id', id);

        if (payload.options.length) {

          const optionRows = payload.options.map((option, index) => ({

            group_id: id,

            name: option.name,

            price_adjustment: Number(option.priceAdjustment ?? option.price_adjustment ?? 0),

            display_order: index

          }));

          const { error: optionError } = await API.supabase.from('modifier_options').insert(optionRows);

          if (optionError) throw optionError;

        }

      }



      return await API.modifiers.getAll();

    },



    async delete(id) {

      const { error } = await API.supabase.from('modifier_groups').delete().eq('id', id);

      if (error) throw error;

      return { success: true };

    },



    async createOption(groupId, option) {

      const { data, error } = await API.supabase.from('modifier_options')

        .insert([{

          group_id: groupId,

          name: option.name,

          price_adjustment: Number(option.priceAdjustment ?? option.price_adjustment ?? 0)

        }])

        .select()

        .single();

      if (error) throw error;

      return { success: true, option: data, data };

    },



    async deleteOption(optionId) {

      const { error } = await API.supabase.from('modifier_options').delete().eq('id', optionId);

      if (error) throw error;

      return { success: true };

    },



    async getProducts(groupId) {

      const { data, error } = await API.supabase

        .from('product_modifiers')

        .select('product_id')

        .eq('modifier_group_id', groupId);

      if (error) throw error;

      const productIds = (data || []).map(row => row.product_id);

      if (!productIds.length) return { success: true, products: [], data: [] };

      const { data: products, error: productError } = await API.supabase

        .from('products')

        .select('*')

        .in('id', productIds);

      if (productError) throw productError;

      return { success: true, products: products || [], data: products || [] };

    },



    async assignProduct(groupId, productId) {

      const { error } = await API.supabase.from('product_modifiers')

        .upsert([{ product_id: productId, modifier_group_id: groupId }], { onConflict: 'product_id,modifier_group_id' });

      if (error) throw error;

      return { success: true };

    },



    async unassignProduct(groupId, productId) {

      const { error } = await API.supabase.from('product_modifiers')

        .delete()

        .eq('modifier_group_id', groupId)

        .eq('product_id', productId);

      if (error) throw error;

      return { success: true };

    }

  },



  products: {

    async getAll(filters = {}) {

      let q = API.supabase.from('products').select('*').eq('tenant_id', API.session.tenantId);

      if (filters.categoryId) q = q.eq('category_id', filters.categoryId);

      if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);

      q = q.order('name', { ascending: true });

      const { data, error } = await q;

      if (error) throw error;

      const products = data || [];

      return { success: true, products, data: products };

    },



    async getById(id) {

      const { data, error } = await API.supabase

        .from('products')

        .select(`

          *,

          modifiers:product_modifiers(

            modifier_group:modifier_groups(

              id,

              name

            )

          )

        `)

        .eq('id', id)

        .single();

      if (error) throw error;

      const product = {

        ...data,

        modifiers: (data?.modifiers || []).map(item => item.modifier_group).filter(Boolean)

      };

      return { success: true, data: product };

    },



    async uploadImage(file, productId = null) {

      const ext = (file.name.split('.').pop() || 'png').toLowerCase();

      const filePath = `products/${API.session.outletId || 'shared'}/${productId || 'new'}-${Date.now()}.${ext}`;

      const { error } = await API.supabase.storage

        .from('outlet-assets')

        .upload(filePath, file, { contentType: file.type || `image/${ext}`, upsert: true });

      if (error) throw error;

      const { data } = API.supabase.storage.from('outlet-assets').getPublicUrl(filePath);

      return { success: true, url: data.publicUrl, filePath };

    },



    async create(data) {

      const payload = {

        tenant_id: API.session.tenantId,

        category_id: data.categoryId ?? data.category_id,

        name: data.name,

        slug: slugifyText(data.name),

        description: data.description || null,

        price: Number(data.price || 0),

        cost: Number(data.cost || data.unit_cost || 0),

        image_url: data.imageUrl ?? data.image_url ?? null,

        has_modifiers: data.hasModifiers ? 1 : 0,

        production_time: Number(data.production_time || 10),

        status: data.status || 'active'

      };

      const { data: res, error } = await API.supabase.from('products')

        .insert([payload]).select();

      if (error) throw error;



      const product = res[0];

      if (Array.isArray(data.modifierGroupIds) && data.modifierGroupIds.length) {

        const rows = data.modifierGroupIds.map((groupId, index) => ({

          product_id: product.id,

          modifier_group_id: groupId,

          display_order: index

        }));

        const { error: modError } = await API.supabase.from('product_modifiers').insert(rows);

        if (modError) throw modError;

      }



      return { success: true, data: product };

    },



    async update(id, data) {

      const payload = {

        category_id: data.categoryId ?? data.category_id,

        name: data.name,

        description: data.description,

        price: data.price != null ? Number(data.price) : undefined,

        cost: data.cost != null ? Number(data.cost) : (data.unit_cost != null ? Number(data.unit_cost) : undefined),

        image_url: data.imageUrl ?? data.image_url,

        has_modifiers: data.hasModifiers != null ? (data.hasModifiers ? 1 : 0) : undefined,

        production_time: data.production_time != null ? Number(data.production_time) : undefined,

        status: data.status

      };

      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const { data: res, error } = await API.supabase.from('products')

        .update(payload).eq('id', id).select();

      if (error) throw error;



      if (Array.isArray(data.modifierGroupIds)) {

        await API.supabase.from('product_modifiers').delete().eq('product_id', id);

        if (data.modifierGroupIds.length) {

          const rows = data.modifierGroupIds.map((groupId, index) => ({

            product_id: id,

            modifier_group_id: groupId,

            display_order: index

          }));

          const { error: modError } = await API.supabase.from('product_modifiers').insert(rows);

          if (modError) throw modError;

        }

      }



      return { success: true, data: res[0] };

    },



    async delete(id) {

      await API.supabase.from('products').delete().eq('id', id);

      return { success: true };

    },



    async updateStatus(id, status) {

      return await API.products.update(id, { status });

    },



    async removeFromCategory(id) {

      return await API.products.update(id, { category_id: null });

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

      const { data, error } = await API.supabase.from('outlets')

        .select('*')

        .eq('tenant_id', API.session.tenantId)

        .order('name', { ascending: true });

      if (error) throw error;



      const outlets = data || [];

      const outletIds = outlets.map(outlet => outlet.id);

      let orders = [];

      let users = [];

      if (outletIds.length) {

        const today = new Date().toISOString().split('T')[0];

        const [{ data: ordersData }, { data: usersData }] = await Promise.all([

          API.supabase.from('orders')

            .select('outlet_id, total, payment_status, created_at')

            .in('outlet_id', outletIds)

            .gte('created_at', `${today}T00:00:00.000Z`)

            .lte('created_at', `${today}T23:59:59.999Z`),

          API.supabase.from('users')

            .select('outlet_id, status')

            .eq('tenant_id', API.session.tenantId)

            .in('outlet_id', outletIds)

        ]);

        orders = ordersData || [];

        users = usersData || [];

      }



      const enriched = outlets.map(outlet => {

        const outletOrders = orders.filter(order => order.outlet_id === outlet.id && order.payment_status === 'paid');

        const outletUsers = users.filter(user => user.outlet_id === outlet.id && user.status === 'active');

        return {

          ...outlet,

          today_orders: outletOrders.length,

          today_revenue: outletOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),

          staff_count: outletUsers.length

        };

      });



      return { success: true, outlets: enriched, data: enriched };

    },



    async create(outletData) {

      const payload = {

        tenant_id: API.session.tenantId,

        name: outletData.name,

        address: outletData.address || null,

        phone: outletData.phone || null,

        status: outletData.status || 'active'

      };

      const { data, error } = await API.supabase.from('outlets').insert([payload]).select();

      if (error) throw error;

      return { success: true, outlet: data[0], data: data[0] };

    },



    async update(id, outletData) {

      const { data, error } = await API.supabase.from('outlets').update(outletData).eq('id', id).select();

      if (error) throw error;

      return { success: true, outlet: data[0], data: data[0] };

    }

  },



  crm: {

    async getCustomers(filters = {}) {

      let customers = [];

      try {

        const { data, error } = await API.supabase

          .from('members')

          .select('*')

          .eq('tenant_id', API.session.tenantId)

          .order('created_at', { ascending: false });

        if (!error) {

          customers = data || [];

        }

      } catch (_) {}



      if (!customers.length) {

        customers = getStoredCollection('nashty_customers')

          .filter(customer => !customer.tenant_id || customer.tenant_id === API.session.tenantId);

      }



      if (filters.search) {

        const needle = filters.search.toLowerCase();

        customers = customers.filter(customer =>

          (customer.name || '').toLowerCase().includes(needle) ||

          (customer.phone || '').includes(filters.search) ||

          (customer.email || '').toLowerCase().includes(needle)

        );

      }



      return { success: true, customers, data: customers };

    },



    async createCustomer(customer) {

      const payload = {

        id: customer.id || createLocalId('cust'),

        tenant_id: API.session.tenantId,

        name: customer.name,

        phone: customer.phone || null,

        email: customer.email || null,

        points: Number(customer.points || 0),

        total_spent: Number(customer.total_spent || 0),

        visit_count: Number(customer.visit_count || 0),

        created_at: customer.created_at || new Date().toISOString()

      };



      try {

        const { data, error } = await API.supabase.from('members').insert([payload]).select().single();

        if (!error) return { success: true, customer: data, data };

      } catch (_) {}



      const customers = getStoredCollection('nashty_customers');

      customers.unshift(payload);

      setStoredCollection('nashty_customers', customers);

      return { success: true, customer: payload, data: payload };

    },



    async deleteCustomer(id) {

      try {

        const { error } = await API.supabase.from('members').delete().eq('id', id);

        if (!error) return { success: true };

      } catch (_) {}



      const customers = getStoredCollection('nashty_customers').filter(customer => customer.id !== id);

      setStoredCollection('nashty_customers', customers);

      return { success: true };

    },



    async getRewards() {

      const rewards = getStoredCollection('nashty_rewards')

        .filter(reward => !reward.tenant_id || reward.tenant_id === API.session.tenantId)

        .sort((a, b) => Number(a.points_required || 0) - Number(b.points_required || 0));

      return { success: true, rewards, data: rewards };

    },



    async createReward(reward) {

      const payload = {

        id: reward.id || createLocalId('rw'),

        tenant_id: API.session.tenantId,

        title: reward.title,

        points_required: Number(reward.points_required || 0),

        description: reward.description || '',

        created_at: reward.created_at || new Date().toISOString()

      };

      const rewards = getStoredCollection('nashty_rewards');

      rewards.unshift(payload);

      setStoredCollection('nashty_rewards', rewards);

      return { success: true, reward: payload, data: payload };

    },



    async deleteReward(id) {

      const rewards = getStoredCollection('nashty_rewards').filter(reward => reward.id !== id);

      setStoredCollection('nashty_rewards', rewards);

      return { success: true };

    },



    async getTransactions() {

      const transactions = getStoredCollection('nashty_point_txs')

        .filter(transaction => !transaction.tenant_id || transaction.tenant_id === API.session.tenantId)

        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return { success: true, transactions, data: transactions };

    }

  },


  // ======================== KDS Methods ========================
  // Moved below to avoid duplicate - see line ~2941


  // ÔöÇÔöÇÔöÇ Legacy Support (backwards compatibility) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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



  kds: {

    async updateCategoryProductionTime(categoryId, timeMinutes) {

      const { data: products, error: productError } = await API.supabase

        .from('products')

        .select('id')

        .eq('tenant_id', API.session.tenantId)

        .eq('category_id', categoryId);

      if (productError) throw productError;



      const productIds = (products || []).map(product => product.id);

      if (!productIds.length) return { success: true, updated: 0 };



      const { error } = await API.supabase

        .from('products')

        .update({ production_time: Number(timeMinutes) })

        .in('id', productIds);

      if (error) throw error;



      return { success: true, updated: productIds.length };

    },



    async getAnalytics() {

      const today = new Date().toISOString().split('T')[0];

      let q = API.supabase

        .from('orders')

        .select('id, created_at, completed_at, order_status, outlet_id')

        .eq('tenant_id', API.session.tenantId)

        .gte('created_at', `${today}T00:00:00.000Z`)

        .lte('created_at', `${today}T23:59:59.999Z`);

      if (API.session.outletId) q = q.eq('outlet_id', API.session.outletId);

      const { data: orders, error } = await q;

      if (error) throw error;



      const allOrders = orders || [];

      const completedOrders = allOrders.filter(order => order.order_status === 'completed');

      const orderIds = completedOrders.map(order => order.id);

      const items = await API.reports._getOrderItems(orderIds);



      const productIds = [...new Set(items.map(item => item.product_id).filter(Boolean))];

      let productLookup = new Map();

      if (productIds.length) {

        const { data: products } = await API.supabase

          .from('products')

          .select('id, name, production_time')

          .in('id', productIds);

        productLookup = new Map((products || []).map(product => [product.id, product]));

      }



      let totalPrepSeconds = 0;

      completedOrders.forEach(order => {

        if (!order.completed_at || !order.created_at) return;

        const duration = Math.max(0, (new Date(order.completed_at) - new Date(order.created_at)) / 1000);

        totalPrepSeconds += duration;

      });

      const avgPrepTimeSeconds = completedOrders.length ? Math.round(totalPrepSeconds / completedOrders.length) : 0;



      const itemStats = new Map();

      let totalItemsCount = 0;

      let overSlaItemsCount = 0;

      items.forEach(item => {

        const order = completedOrders.find(entry => entry.id === item.order_id);

        if (!order) return;

        const product = productLookup.get(item.product_id) || {};

        const qty = Number(item.quantity || 0);

        const prepMinutes = order.completed_at && order.created_at

          ? Math.max(0, (new Date(order.completed_at) - new Date(order.created_at)) / 60000)

          : Number(product.production_time || 10);

        const target = Number(product.production_time || 10);

        totalItemsCount += qty;

        if (prepMinutes > target) overSlaItemsCount += qty;



        const key = item.product_id || item.product_name;

        if (!itemStats.has(key)) {

          itemStats.set(key, {

            id: item.product_id,

            name: item.product_name || product.name || 'Produk',

            production_time: target,

            total_prep_minutes: 0,

            orders_count: 0

          });

        }

        const entry = itemStats.get(key);

        entry.total_prep_minutes += prepMinutes;

        entry.orders_count += qty;

      });



      const rankedProducts = Array.from(itemStats.values()).map(item => ({

        ...item,

        avg_prep_minutes: item.orders_count ? item.total_prep_minutes / item.orders_count : 0

      }));



      return {

        success: true,

        data: {

          avgPrepTimeSeconds,

          completedOrders: completedOrders.length,

          totalOrders: allOrders.length,

          overSlaItemsCount,

          totalItemsCount,

          fastestProducts: [...rankedProducts].sort((a, b) => a.avg_prep_minutes - b.avg_prep_minutes).slice(0, 5),

          slowestProducts: [...rankedProducts].sort((a, b) => b.avg_prep_minutes - a.avg_prep_minutes).slice(0, 5)

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



      // QRIS endpoints

      if (endpoint.startsWith('/outlets/') && endpoint.includes('/qris')) {

        const qrisMatch = endpoint.match(/\/outlets\/([^/]+)\/qris(?:\/upload)?/);

        if (qrisMatch) {

          const outletId = qrisMatch[1];

          if (method === 'POST') {

            const res = await fetch(body.imageBase64);

            const blob = await res.blob();

            const file = new File([blob], body.fileName || 'qris.png', { type: blob.type || 'image/png' });

            return await API.outletSettings.uploadQris(file, outletId);

          }

          if (method === 'DELETE') {

            return await API.outletSettings.removeQris(outletId);

          }

          return await API.outletSettings.getQris(outletId);

        }

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

        const idMatch = endpoint.match(/\/outlets\/([^?/]+)/);

        if (idMatch) {

          if (method === 'PUT') return await API.outlets.update(idMatch[1], body);

        }

        if (method === 'POST') return await API.outlets.create(body);

        return await API.outlets.getAll();

      }



      // Activity logs endpoints

      if (endpoint.startsWith('/activity-logs')) {

        const urlObj = new URL('http://dummy' + endpoint);

        let q = API.supabase.from('activity_logs')

          .select('*')

          .eq('tenant_id', API.session.tenantId)

          .order('created_at', { ascending: false })

          .limit(parseInt(urlObj.searchParams.get('limit') || '200', 10));



        const action = urlObj.searchParams.get('action');

        const entityType = urlObj.searchParams.get('entityType') || urlObj.searchParams.get('module');

        const search = urlObj.searchParams.get('search');

        const dateFrom = urlObj.searchParams.get('dateFrom');

        const dateTo = urlObj.searchParams.get('dateTo');

        if (action && action !== 'all') q = q.eq('action', action);

        if (entityType && entityType !== 'all' && entityType !== 'Semua Module') q = q.eq('entity_type', entityType);

        if (dateFrom) q = q.gte('created_at', `${dateFrom}T00:00:00.000Z`);

        if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59.999Z`);



        const { data, error } = await q;

        if (error) throw error;

        let logs = data || [];

        if (search) {

          const needle = search.toLowerCase();

          logs = logs.filter(log =>

            (log.description || '').toLowerCase().includes(needle) ||

            (log.user_name || '').toLowerCase().includes(needle) ||

            (log.user_id || '').toLowerCase().includes(needle)

          );

        }

        return { success: true, logs, pagination: { total: logs.length } };

      }



      // Costs endpoints

      if (endpoint.startsWith('/costs')) {

        let costs = getStoredCollection('nashty_costs');

        if (method === 'POST') {

          const cost = {

            id: body.id || createLocalId('cost'),

            tenantId: body.tenantId || API.session.tenantId,

            outletId: body.outletId || API.session.outletId || null,

            category: body.category,

            amount: Number(body.amount || 0),

            description: body.description || '',

            created_at: body.created_at || new Date().toISOString()

          };

          costs.unshift(cost);

          setStoredCollection('nashty_costs', costs);

          return { success: true, cost, costs };

        }

        if (method === 'DELETE') {

          const idMatch = endpoint.match(/\/costs\/([^?]+)/);

          if (idMatch) {

            costs = costs.filter(c => c.id !== idMatch[1]);

            setStoredCollection('nashty_costs', costs);

          }

          return { success: true };

        }

        if (method === 'PUT') {

          const idMatch = endpoint.match(/\/costs\/([^?]+)/);

          if (idMatch) {

            const index = costs.findIndex(c => c.id === idMatch[1]);

            if (index !== -1) {

              costs[index] = { ...costs[index], ...body, id: idMatch[1] };

              setStoredCollection('nashty_costs', costs);

              return { success: true, cost: costs[index] };

            }

          }

          return { success: false, error: 'Cost not found' };

        }

        

        // Filter for GET

        const urlObj = new URL('http://dummy' + endpoint);

        const tenantId = urlObj.searchParams.get('tenantId') || API.session.tenantId;

        const outletId = urlObj.searchParams.get('outletId');

        const category = urlObj.searchParams.get('category');

        const dateFrom = urlObj.searchParams.get('dateFrom');

        const dateTo = urlObj.searchParams.get('dateTo');

        if (tenantId) costs = costs.filter(c => !c.tenantId || c.tenantId === tenantId);

        if (outletId) costs = costs.filter(c => c.outletId === outletId);

        if (category) costs = costs.filter(c => c.category === category);

        if (dateFrom) costs = costs.filter(c => (c.created_at || '').slice(0, 10) >= dateFrom);

        if (dateTo) costs = costs.filter(c => (c.created_at || '').slice(0, 10) <= dateTo);

        

        return { success: true, costs };

      }



      // CRM endpoints

      if (endpoint.startsWith('/customers')) {

        const idMatch = endpoint.match(/\/customers\/([^?]+)/);

        const urlObj = new URL('http://dummy' + endpoint);

        if (method === 'POST') return await API.crm.createCustomer(body);

        if (method === 'DELETE' && idMatch) return await API.crm.deleteCustomer(idMatch[1]);

        return await API.crm.getCustomers({ search: urlObj.searchParams.get('search') || '' });

      }



      if (endpoint.startsWith('/rewards')) {

        const idMatch = endpoint.match(/\/rewards\/([^?]+)/);

        if (method === 'POST') return await API.crm.createReward(body);

        if (method === 'DELETE' && idMatch) return await API.crm.deleteReward(idMatch[1]);

        return await API.crm.getRewards();

      }



      if (endpoint.startsWith('/point-transactions')) {

        return await API.crm.getTransactions();

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



  // ÔöÇÔöÇÔöÇ Utils ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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



// ÔöÇÔöÇÔöÇ Session Restore on Load ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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



// ÔöÇÔöÇÔöÇ Export ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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

