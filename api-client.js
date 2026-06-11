/**
 * NASHTY POS API Client
 * Centralized API communication layer
 * 
 * USAGE in HTML mockups:
 * <script src="api-client.js"></script>
 * 
 * Then use: API.auth.login(pin), API.products.getAll(), etc.
 */

const API_BASE = 'http://localhost:3001/api';

const API = {
  // Current session data
  session: {
    user: null,
    tenantId: null,
    outletId: null,
    shiftId: null
  },

  // Helper: Make HTTP request
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
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

  // ========== AUTH ==========
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

      if (data.success && data.user) {
        // Store session
        API.session.user = data.user;
        API.session.tenantId = data.user.tenantId;
        API.session.outletId = data.user.outletId;
        
        // Store in localStorage
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
      }

      return data;
    },

    logout() {
      API.session = {
        user: null,
        tenantId: null,
        outletId: null,
        shiftId: null
      };
      localStorage.removeItem('nashty_session');
    },

    // Restore session from localStorage
    restoreSession() {
      const stored = localStorage.getItem('nashty_session');
      if (stored) {
        try {
          API.session = JSON.parse(stored);
          return true;
        } catch (e) {
          console.error('Failed to restore session:', e);
        }
      }
      return false;
    }
  },

  // ========== CATEGORIES ==========
  categories: {
    async getAll() {
      if (!API.session.tenantId) throw new Error('No tenant ID in session');
      return API.request(`/categories?tenantId=${API.session.tenantId}`);
    },

    async getById(id) {
      return API.request(`/categories/${id}`);
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

      return API.request(`/products?${params}`);
    },

    async getById(id) {
      return API.request(`/products/${id}`);
    },

    async toggleFavorite(id) {
      return API.request(`/products/${id}/favorite`, {
        method: 'PATCH'
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
  }
};

// Auto-restore session on load
if (typeof window !== 'undefined') {
  API.auth.restoreSession();
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}
