/**
 * NASHTY OS API Client v2.0
 * With Main Admin Authentication and Supabase Support
 * 
 * USAGE:
 * <script src="api-client-v2.js"></script>
 * 
 * Features:
 * - Main admin authentication (admin/admin)
 * - 12-hour session persistence
 * - Supabase cloud ready
 * - Auto-session restore
 * - Fallback to SQLite if Supabase unavailable
 */

const API_BASE = 'https://nashty-backoffice-backend-production.up.railway.app/api';

const API = {
  // Current session data (HARDCODED FOR DEV)
  session: {
    admin: { id: 'admin', role: 'admin', tenantId: 'demo-tenant' },
    adminToken: 'dev-token',
    currentApp: null,
    
    token: 'dev-token',
    user: { id: 'admin', name: 'Admin Demo', role: 'admin', tenantId: 'demo-tenant', outletId: 'demo-outlet' },
    tenantId: 'demo-tenant',
    outletId: 'demo-outlet',
    shiftId: null
  },

  // Helper: Make HTTP request
  async request(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Add Authorization header if token exists
      if (API.session.token) {
        headers['Authorization'] = `Bearer ${API.session.token}`;
      }
      
      // Add Admin token if exists
      if (API.session.adminToken && endpoint.startsWith('/main/')) {
        headers['Authorization'] = `Bearer ${API.session.adminToken}`;
      }

      // Inject current user ID for activity log tracking
      if (API.session.user && API.session.user.id) {
        headers['X-User-Id'] = API.session.user.id;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers,
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  // ========== MAIN AUTH ==========
  mainAuth: {
    async login(username, password) {
      const data = await API.request('/main/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (data.success && data.token) {
        // Store main admin session
        API.session.admin = data.user;
        API.session.adminToken = data.token;
        API.session.tenantId = data.user.tenantId;
        
        // Store in localStorage
        const mainSession = {
          admin: data.user,
          adminToken: data.token,
          tenantId: data.user.tenantId,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('nashty_main_session', JSON.stringify(mainSession));
      }

      return data;
    },

    async validate(token) {
      return API.request('/main/auth/validate', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
    },

    logout() {
      // DEV OVERRIDE
    },

    // Restore main session from localStorage
    restoreSession() {
      // DEV OVERRIDE
      return true;
    },

    // Get available apps
    async getAvailableApps() {
      return API.request('/main/auth/apps');
    }
  },

  // ========== STAFF AUTH ==========
  auth: {
    async getStaff(outletId = null) {
      const query = outletId ? `?outletId=${outletId}` : '';
      return API.request(`/auth/staff${query}`);
    },

    async login(pin, outletId = null) {
      const data = await API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ pin, outletId })
      });

      if (data.success && data.user && data.token) {
        // Store session
        API.session.token = data.token;
        API.session.user = data.user;
        API.session.tenantId = data.user.tenantId;
        API.session.outletId = data.user.outletId;
        
        // Store in localStorage
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }
      return data;
    },
    logout() {
      // DEV OVERRIDE: Prevent logout
      console.log('Logout prevented in dev mode');
    },

    // Restore staff session from localStorage
    restoreSession() {
      // DEV OVERRIDE: Always pretend we have a valid session
      return true;
    }
  },

  // ========== USERS ==========
  users: {
    async getAll(filters = {}) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      const params = new URLSearchParams({ tenantId: API.session.tenantId, ...filters });
      return API.request(`/users?${params}`);
    },
    async create(userData) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      return API.request('/users', {
        method: 'POST',
        body: JSON.stringify({ tenantId: API.session.tenantId, ...userData })
      });
    },
    async update(id, userData) {
      return API.request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
    },
    async updateStatus(id, status) {
      return API.request(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    async delete(id) {
      return API.request(`/users/${id}`, { method: 'DELETE' });
    }
  },

  // ========== MENU ==========
  menu: {
    async getOutletMenu(outletId) {
      if (!outletId) outletId = API.session.outletId;
      if (!outletId) throw new Error('No outlet ID provided or in session');
      return API.request(`/menu/outlet/${outletId}`);
    }
  },

  // ========== CATEGORIES ==========
  categories: {
    async getAll() {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      const response = await API.request(`/categories?tenantId=${API.session.tenantId}`);
      // Normalize response format
      return {
        success: true,
        data: response.categories || []
      };
    },

    async getById(id) {
      const response = await API.request(`/categories/${id}`);
      return {
        success: true,
        data: response.category
      };
    },

    async create(data) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      return API.request('/categories', {
        method: 'POST',
        body: JSON.stringify({ ...data, tenantId: API.session.tenantId })
      });
    },

    async update(id, data) {
      return API.request(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async updateStatus(id, status) {
      return API.request(`/categories/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    async getProducts(id) {
      return API.request(`/categories/${id}/products`);
    },

    async delete(id) {
      return API.request(`/categories/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // ========== PRODUCTS ==========
  products: {
    async getAll(filters = {}) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      
      const params = new URLSearchParams({
        tenantId: API.session.tenantId,
        ...filters
      });

      const response = await API.request(`/products?${params}`);
      // Normalize response format
      return {
        success: true,
        data: response.products || []
      };
    },

    async getById(id) {
      const response = await API.request(`/products/${id}`);
      return {
        success: true,
        data: response.product
      };
    },

    async toggleFavorite(id) {
      return API.request(`/products/${id}/favorite`, {
        method: 'PATCH'
      });
    },

    async create(data) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      return API.request('/products', {
        method: 'POST',
        body: JSON.stringify({ ...data, tenantId: API.session.tenantId })
      });
    },

    async update(id, data) {
      return API.request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async updateStatus(id, status) {
      return API.request(`/products/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    async removeFromCategory(id) {
      // Unlink product from its category by setting category_id via update
      return API.request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ categoryId: null })
      });
    },

    async delete(id) {
      return API.request(`/products/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // ========== MODIFIERS ==========
  modifiers: {
    async getAll() {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      return API.request(`/modifiers?tenantId=${API.session.tenantId}`);
    },

    async getById(id) {
      return API.request(`/modifiers/${id}`);
    },

    async create(data) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      return API.request('/modifiers', {
        method: 'POST',
        body: JSON.stringify({ ...data, tenantId: API.session.tenantId })
      });
    },

    async update(id, data) {
      return API.request(`/modifiers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async delete(id) {
      return API.request(`/modifiers/${id}`, {
        method: 'DELETE'
      });
    },

    async createOption(groupId, data) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      return API.request(`/modifiers/${groupId}/options`, {
        method: 'POST',
        body: JSON.stringify({ ...data, tenantId: API.session.tenantId })
      });
    },

    async deleteOption(optionId) {
      return API.request(`/modifiers/options/${optionId}`, {
        method: 'DELETE'
      });
    },

    async getProducts(groupId) {
      return API.request(`/modifiers/${groupId}/products`);
    },

    async assignProduct(groupId, productId) {
      return API.request(`/modifiers/${groupId}/assign-product`, {
        method: 'POST',
        body: JSON.stringify({ productId })
      });
    },

    async unassignProduct(groupId, productId) {
      return API.request(`/modifiers/${groupId}/unassign-product/${productId}`, {
        method: 'DELETE'
      });
    }
  },

  // ========== ORDERS ==========
  orders: {
    async create(orderData) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      if (!API.session.outletId) throw new Error('No outlet ID in session');
      if (!API.session.user) throw new Error('No user in session');

      const payload = {
        tenantId: API.session.tenantId,
        outletId: API.session.outletId,
        userId: API.session.user.id,
        shiftId: API.session.shiftId,
        ...orderData
      };

      return API.request('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async getAll(filters = {}) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      
      const params = new URLSearchParams({
        tenantId: API.session.tenantId,
        outletId: API.session.outletId,
        ...filters
      });

      return API.request(`/orders?${params}`);
    },

    async getById(id) {
      return API.request(`/orders/${id}`);
    },

    async updateStatus(id, status) {
      return API.request(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(status)
      });
    },

    async void(id, reason, voidBy, managerPin) {
      return API.request(`/orders/${id}/void`, {
        method: 'PUT',
        body: JSON.stringify({ reason, voidBy, managerPin })
      });
    },

    async getConfig(outletId) {
      return API.request(`/orders/config/${outletId}`);
    }
  },

  // ========== SHIFTS ==========
  shifts: {
    async start(startCash) {
      if (!API.session.outletId) throw new Error('No outlet ID in session');
      if (!API.session.user) throw new Error('No user in session');

      const data = await API.request('/shifts/start', {
        method: 'POST',
        body: JSON.stringify({
          outletId: API.session.outletId,
          userId: API.session.user.id,
          startCash
        })
      });

      if (data.success && data.shift) {
        API.session.shiftId = data.shift.id;
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }

      return data;
    },

    async end(shiftId, endCash, notes = '') {
      const data = await API.request(`/shifts/${shiftId}/end`, {
        method: 'POST',
        body: JSON.stringify({ endCash, notes })
      });

      if (data.success) {
        API.session.shiftId = null;
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }

      return data;
    },

    async getActive() {
      if (!API.session.user) throw new Error('No user in session');
      
      const data = await API.request(`/shifts/active?userId=${API.session.user.id}`);
      
      if (data.shift) {
        API.session.shiftId = data.shift.id;
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }

      return data;
    },

    async getHistory(filters = {}) {
      const params = new URLSearchParams({
        outletId: API.session.outletId,
        ...filters
      });

      return API.request(`/shifts?${params}`);
    }
  },

  // ========== DASHBOARD ==========
  dashboard: {
    async getKPI(filters = {}) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      
      const params = new URLSearchParams({
        tenantId: API.session.tenantId,
        outletId: API.session.outletId,
        ...filters
      });

      return API.request(`/dashboard/kpi?${params}`);
    },

    async getRecentOrders(limit = 10) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      
      const params = new URLSearchParams({
        tenantId: API.session.tenantId,
        outletId: API.session.outletId,
        limit
      });

      return API.request(`/dashboard/recent-orders?${params}`);
    }
  },
  
  // ========== SETTINGS ==========
  settings: {
    async get() {
      if (!API.session.outletId) throw new Error('No outlet ID in session');
      return API.request(`/settings/${API.session.outletId}`);
    },
    async update(settingsObj) {
      if (!API.session.outletId) throw new Error('No outlet ID in session');
      return API.request(`/settings/${API.session.outletId}`, {
        method: 'PUT',
        body: JSON.stringify({ settings: settingsObj })
      });
    }
  },

  // ========== KDS ==========
  kds: {
    async getAnalytics() {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      return API.request(`/kds/analytics?tenantId=${API.session.tenantId}&outletId=${API.session.outletId}`);
    },
    async updateCategoryProductionTime(categoryId, timeMinutes) {
      return API.request(`/kds/production-time/category/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify({ timeMinutes })
      });
    }
  },
  // ========== OUTLETS ==========
  outlets: {
    async getAll() {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      return API.request(`/outlets?tenantId=${API.session.tenantId}`);
    },
    async create(data) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      return API.request('/outlets', {
        method: 'POST',
        body: JSON.stringify({ tenantId: API.session.tenantId, ...data })
      });
    },
    async update(id, data) {
      return API.request(`/outlets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  // ========== REPORTS ==========
  reports: {
    async getSales(filters = {}) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      const params = new URLSearchParams({ tenantId: API.session.tenantId, ...filters });
      return API.request(`/reports/sales?${params}`);
    },
    async getProducts(filters = {}) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      const params = new URLSearchParams({ tenantId: API.session.tenantId, ...filters });
      return API.request(`/reports/products?${params}`);
    },
    async getCashiers(filters = {}) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      const params = new URLSearchParams({ tenantId: API.session.tenantId, ...filters });
      return API.request(`/reports/cashiers?${params}`);
    },
    async getMenuEngineering(filters = {}) {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      const params = new URLSearchParams({ tenantId: API.session.tenantId, ...filters });
      return API.request(`/reports/menu-engineering?${params}`);
    }
  },

  // ========== UTILITIES ==========
  utils: {
    // Check if main admin is logged in
    isAdminLoggedIn() {
      return !!API.session.adminToken;
    },
    
    // Check if staff is logged in
    isStaffLoggedIn() {
      return !!API.session.token;
    },
    
    // Get current app
    getCurrentApp() {
      return API.session.currentApp;
    },
    
    // Set current app
    setCurrentApp(app) {
      API.session.currentApp = app;
    },
    
    // Clear all sessions (full logout)
    clearAllSessions() {
      localStorage.removeItem('nashty_main_session');
      localStorage.removeItem('nashty_session');
      API.session = {
        admin: null,
        adminToken: null,
        currentApp: null,
        token: null,
        user: null,
        tenantId: null,
        outletId: null,
        shiftId: null
      };
    }
  }
};

// Auto-restore sessions on load
if (typeof window !== 'undefined') {
  // Try to restore main session first
  const mainSessionRestored = API.mainAuth.restoreSession();
  
  if (!mainSessionRestored) {
    // If no main session, try to restore staff session
    API.auth.restoreSession();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}

// Global namespace
window.API = API;
window.APIv2 = API;
