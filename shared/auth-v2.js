/**
 * NASHTY OS - UNIFIED AUTH SERVICE
 * Clean authentication tanpa console errors berlebihan
 * Mendukung user management dan system access control
 */

class NashtyAuthService {
  constructor() {
    this.authData = null;
    this.sessionCheckInterval = null;
    this.allowedSystems = [];
    this.init();
  }

  init() {
    // Load from storage first (silent)
    this.loadFromStorage();
    
    // Listen for auth messages (silent unless error)
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NASHTY_AUTH') {
        this.setAuthData(event.data);
      }
    });

    // Listen for logout broadcasts
    try {
      const authChannel = new BroadcastChannel('nashty_auth');
      authChannel.onmessage = (event) => {
        if (event.data.type === 'LOGOUT') {
          this.handleLogout();
        }
      };
    } catch (e) {
      // BroadcastChannel not supported, ignore silently
    }

    // Start session validation (every 5 minutes)
    this.startSessionValidation();
  }

  setAuthData(data) {
    this.authData = {
      token: data.token,
      user: data.user,
      outlet: data.outlet,
      allowedSystems: data.allowedSystems || [],
      timestamp: Date.now()
    };
    
    this.allowedSystems = this.authData.allowedSystems;
    
    // Persist silently
    try {
      localStorage.setItem('nashty_auth', JSON.stringify(this.authData));
    } catch (e) {
      // Storage full, ignore
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('nashty_auth_ready', { 
      detail: this.authData 
    }));
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('nashty_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Check expiry (12 hours)
        if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) {
          this.authData = parsed;
          this.allowedSystems = parsed.allowedSystems || [];
          return true;
        } else {
          this.clearAuth();
        }
      }
    } catch (e) {
      // Parse error, clear silently
      this.clearAuth();
    }
    return false;
  }

  startSessionValidation() {
    // Validate session every 5 minutes
    this.sessionCheckInterval = setInterval(() => {
      if (this.hasValidAuth()) {
        this.validateSession();
      }
    }, 5 * 60 * 1000);
  }

  async validateSession() {
    try {
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        // Session invalid, logout silently
        this.handleLogout();
      }
    } catch (e) {
      // Network error, keep session for now
    }
  }

  hasValidAuth() {
    return this.authData !== null && !!this.authData.token;
  }

  hasSystemAccess(systemName) {
    if (!this.hasValidAuth()) return false;
    
    // Superadmin has access to all
    if (this.authData.user && this.authData.user.role === 'superadmin') {
      return true;
    }
    
    return this.allowedSystems.includes(systemName);
  }

  getAuthData() {
    return this.authData || {};
  }

  getUser() {
    return this.authData ? this.authData.user : null;
  }

  getOutlet() {
    return this.authData ? this.authData.outlet : null;
  }

  getToken() {
    return this.authData ? this.authData.token : null;
  }

  getAllowedSystems() {
    return this.allowedSystems;
  }

  clearAuth() {
    this.authData = null;
    this.allowedSystems = [];
    
    try {
      localStorage.removeItem('nashty_auth');
    } catch (e) {
      // Ignore
    }
  }

  handleLogout() {
    this.clearAuth();
    
    // Broadcast to other tabs
    try {
      const authChannel = new BroadcastChannel('nashty_auth');
      authChannel.postMessage({ type: 'LOGOUT' });
      authChannel.close();
    } catch (e) {
      // Ignore
    }

    // Redirect to login
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'LOGOUT_REQUEST' }, '*');
    } else {
      window.location.href = '/index.html';
    }
  }

  async login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.setAuthData({
          token: data.token,
          user: data.user,
          outlet: data.outlet,
          allowedSystems: data.allowedSystems || []
        });
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Login failed' 
        };
      }
    } catch (e) {
      return { 
        success: false, 
        error: 'Network error' 
      };
    }
  }

  async updatePassword(oldPassword, newPassword) {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();
      return data;
    } catch (e) {
      return { success: false, error: 'Network error' };
    }
  }
}

// Initialize global instance
window.NASHTY_AUTH = new NashtyAuthService();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NashtyAuthService;
}
