// Storage Helper Module
// Centralized localStorage access with consistent patterns

const Storage = {
  /**
   * Get value from localStorage with optional default
   * Supports backward compatibility with old key patterns
   */
  get(key, defaultValue = null) {
    try {
      // Try new namespaced key first
      let val = localStorage.getItem(`nashty_${key}`);
      
      // Fallback to legacy keys for backward compatibility
      if (!val) {
        const legacyKey = this._getLegacyKey(key);
        if (legacyKey) {
          val = localStorage.getItem(legacyKey);
          // Migrate to new key if found
          if (val) {
            localStorage.setItem(`nashty_${key}`, val);
          }
        }
      }
      
      return val ? JSON.parse(val) : defaultValue;
    } catch (e) {
      console.warn(`Storage.get failed for key: ${key}`, e);
      return defaultValue;
    }
  },

  /**
   * Set value in localStorage with automatic serialization
   */
  set(key, value) {
    try {
      localStorage.setItem(`nashty_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Storage.set failed for key: ${key}`, e);
      return false;
    }
  },

  /**
   * Remove value from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(`nashty_${key}`);
      // Also remove legacy key if exists
      const legacyKey = this._getLegacyKey(key);
      if (legacyKey) {
        localStorage.removeItem(legacyKey);
      }
      return true;
    } catch (e) {
      console.error(`Storage.remove failed for key: ${key}`, e);
      return false;
    }
  },

  /**
   * Clear all nashty-prefixed keys
   */
  clearAll() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nashty_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (e) {
      console.error('Storage.clearAll failed', e);
      return false;
    }
  },

  /**
   * Create scoped storage for specific modules
   * Example: const AuthStorage = Storage.scope('auth');
   */
  scope(prefix) {
    return {
      get: (key, defaultValue) => Storage.get(`${prefix}_${key}`, defaultValue),
      set: (key, value) => Storage.set(`${prefix}_${key}`, value),
      remove: (key) => Storage.remove(`${prefix}_${key}`),
      clear: () => {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(`nashty_${prefix}_`)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    };
  },

  /**
   * Get legacy key mapping for backward compatibility
   * @private
   */
  _getLegacyKey(key) {
    const legacyMap = {
      // Auth keys
      'auth_session': 'nashty_session',
      'auth_token': 'session_token',
      'auth_user': 'user_data',
      'auth_outlet_id': 'outlet_id',
      'auth_tenant_id': 'tenant_id',
      'auth_role': 'user_role',
      
      // QRIS
      'qris_static': 'nashty_qris_static',
      
      // POS keys
      'pos_cart': 'pos_cart',
      'pos_favorites': 'pos_favorites',
      'pos_recent': 'pos_recent_products',
      
      // CRM keys
      'crm_customers': 'crm_customers',
      'crm_filter_search': 'crm_filter_search',
      'crm_filter_tier': 'crm_filter_tier',
      
      // Cost keys
      'costs_data': 'costs_data',
      'cost_categories': 'cost_categories',
      
      // KDS keys
      'kds_settings': 'kds_settings',
      'kds_sound_enabled': 'kds_sound_enabled',
      'kds_auto_accept': 'kds_auto_accept'
    };
    
    return legacyMap[key] || null;
  }
};

// Module-specific scoped storage instances
const AuthStorage = Storage.scope('auth');
const POSStorage = Storage.scope('pos');
const CRMStorage = Storage.scope('crm');
const KDSStorage = Storage.scope('kds');
const CostStorage = Storage.scope('cost');

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.Storage = Storage;
  window.AuthStorage = AuthStorage;
  window.POSStorage = POSStorage;
  window.CRMStorage = CRMStorage;
  window.KDSStorage = KDSStorage;
  window.CostStorage = CostStorage;
}
