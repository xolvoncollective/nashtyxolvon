/**
 * NASHTY KDS API Client
 * Centralized API communication layer for Kitchen Display System
 * 
 * Auto-refreshes orders every 5 seconds
 * Handles kitchen status updates
 */

const API_BASE = 'https://nashty-backoffice-backend-production.up.railway.app/api';

const API = {
  // Current session data
  session: {
    token: null,
    user: null,
    tenantId: null,
    outletId: null,
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

  // ========== AUTH ==========
  auth: {
    async login(pin, outletId = null) {
      const data = await API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ pin, outletId })
      });

      if (data.success && data.user && data.token) {
        // Store session with token
        API.session.token = data.token;
        API.session.user = data.user;
        API.session.tenantId = data.user.tenantId;
        API.session.outletId = data.user.outletId;
        
        // Store in localStorage
        localStorage.setItem('nashty_kds_session', JSON.stringify(API.session));
        console.log('[KDS] Session stored:', API.session);
      }

      return data;
    },

    logout() {
      API.session = {
        token: null,
        user: null,
        tenantId: null,
        outletId: null,
        shiftId: null
      };
      localStorage.removeItem('nashty_kds_session');
    },

    // Restore session from localStorage
    restoreSession() {
      const stored = localStorage.getItem('nashty_kds_session');
      if (stored) {
        try {
          API.session = JSON.parse(stored);
          console.log('[KDS] Session restored:', API.session);
          return true;
        } catch (e) {
          console.error('[KDS] Failed to restore session:', e);
        }
      }
      return false;
    }
  },

  // ========== ORDERS (KDS Specific) ==========
  orders: {
    // Get KDS queue (all pending/preparing orders)
    async getKDSQueue(outletId) {
      const params = new URLSearchParams({
        tenantId: API.session.tenantId || 'demo-tenant',
        outletId: outletId || API.session.outletId || 'demo-outlet'
      });

      const response = await API.request(`/orders/kitchen/queue?${params}`);
      return response;
    },

    // Get all orders with filters
    async getAll(filters = {}) {
      if (!API.session.tenantId) {
        console.warn('[KDS] No tenantId in session');
        return { orders: [] };
      }
      
      const params = new URLSearchParams({
        tenantId: API.session.tenantId,
        outletId: API.session.outletId || 'demo-outlet',
        ...filters
      });

      return API.request(`/orders?${params}`);
    },

    // Update kitchen status
    async updateKitchenStatus(orderId, status) {
      const validStatuses = ['pending', 'preparing', 'ready', 'served'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid kitchen status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }

      return API.request(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ kitchenStatus: status })
      });
    },

    // Get kitchen statistics
    async getKitchenStats(outletId) {
      const params = new URLSearchParams({
        outletId: outletId || API.session.outletId
      });

      return API.request(`/orders/kitchen/stats?${params}`);
    },

    async getConfig(outletId) {
      try {
        const response = await API.request(`/settings/${outletId || API.session.outletId}`);
        return {
          config: {
            kdsWarnThreshold: response.settings?.kds_warn_minutes || 10,
            kdsUrgentThreshold: response.settings?.kds_urgent_minutes || 20,
            kdsSoundEnabled: response.settings?.kds_sound_enabled !== false,
            kdsAutoSort: response.settings?.kds_auto_sort !== false
          }
        };
      } catch (error) {
        console.error('[KDS] Failed to fetch config:', error);
        // Return defaults
        return {
          config: {
            kdsWarnThreshold: 10,
            kdsUrgentThreshold: 20,
            kdsSoundEnabled: true,
            kdsAutoSort: true
          }
        };
      }
    }
  },

  // ========== SETTINGS ==========
  settings: {
    async get(outletId) {
      return API.request(`/settings/${outletId || API.session.outletId}`);
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

// Expose API globally for app.js guard clause
window.API = API;

console.log('[KDS API] Client initialized');
