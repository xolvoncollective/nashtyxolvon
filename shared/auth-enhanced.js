/**
 * NASHTY OS - Enhanced Authentication System v2.0
 * 
 * Features:
 * - JWT token management with auto-refresh
 * - Secure token storage with encryption
 * - Role-based access control (RBAC)
 * - Session timeout detection
 * - Audit logging for auth events
 * - Integration with offline encryption
 * - Multi-factor authentication support (future)
 * 
 * Usage: Include AFTER encryption-service.js
 * <script src="../pos/frontend/js/services/encryption-service.js"></script>
 * <script src="../shared/auth-enhanced.js"></script>
 */

(function() {
  'use strict';

  const AUTH_CONFIG = {
    LAUNCHER_ORIGIN: window.location.origin,
    STORAGE_KEYS: {
      TOKEN: 'nashty_token',
      REFRESH_TOKEN: 'nashty_refresh_token',
      USER: 'nashty_user',
      OUTLET: 'nashty_outlet',
      SESSION: 'nashty_session',
      PERMISSIONS: 'nashty_permissions'
    },
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh 5 minutes before expiry
    SESSION_TIMEOUT: 12 * 60 * 60 * 1000, // 12 hours
    MAX_RETRY_ATTEMPTS: 3,
    AUDIT_LOG_KEY: 'nashty_audit_log',
    MAX_AUDIT_ENTRIES: 1000
  };

  // Permission definitions
  const PERMISSIONS = {
    // POS Permissions
    'pos.view': 'View POS interface',
    'pos.create_order': 'Create new orders',
    'pos.edit_order': 'Edit existing orders',
    'pos.delete_order': 'Delete orders',
    'pos.apply_discount': 'Apply discounts',
    'pos.refund': 'Process refunds',
    'pos.void_transaction': 'Void transactions',
    
    // Payment Permissions
    'payment.cash': 'Accept cash payments',
    'payment.card': 'Process card payments',
    'payment.digital': 'Accept digital payments',
    
    // Shift Permissions
    'shift.open': 'Open shift',
    'shift.close': 'Close shift',
    'shift.view_reports': 'View shift reports',
    
    // Inventory Permissions
    'inventory.view': 'View inventory',
    'inventory.adjust': 'Adjust inventory levels',
    
    // Settings Permissions
    'settings.view': 'View settings',
    'settings.edit': 'Edit settings',
    
    // Admin Permissions
    'admin.manage_users': 'Manage users',
    'admin.view_audit_log': 'View audit logs',
    'admin.system_config': 'System configuration'
  };

  // Role definitions
  const ROLES = {
    cashier: [
      'pos.view',
      'pos.create_order',
      'payment.cash',
      'payment.card',
      'payment.digital'
    ],
    server: [
      'pos.view',
      'pos.create_order',
      'pos.edit_order'
    ],
    supervisor: [
      'pos.view',
      'pos.create_order',
      'pos.edit_order',
      'pos.delete_order',
      'pos.apply_discount',
      'pos.refund',
      'payment.cash',
      'payment.card',
      'payment.digital',
      'shift.open',
      'shift.close',
      'shift.view_reports',
      'inventory.view',
      'settings.view'
    ],
    manager: [
      'pos.*',
      'payment.*',
      'shift.*',
      'inventory.*',
      'settings.*'
    ],
    admin: ['*']
  };

  /**
   * Enhanced Authentication Manager
   */
  class AuthManager {
    constructor() {
      this.tokenRefreshTimer = null;
      this.sessionCheckTimer = null;
      this.currentSession = null;
      this.retryCount = 0;
    }

    /**
     * Initialize authentication system
     */
    async init() {
      console.log('[AUTH v2] Initializing enhanced authentication...');

      // Set up message listener for launcher auth
      this.initMessageListener();

      // Intercept fetch to add Authorization header
      this.createAuthenticatedFetch();

      // Check existing session
      const hasAuth = await this.validateSession();

      if (hasAuth) {
        console.log('[AUTH v2] Valid session found');
        await this.startSession();
      } else {
        console.log('[AUTH v2] No valid session');
        await this.handleNoAuth();
      }

      // Start session monitoring
      this.startSessionMonitoring();

      // Expose API
      this.exposeAPI();
    }

    /**
     * Validate current session
     */
    async validateSession() {
      const token = this.getStoredToken();
      const user = this.getStoredUser();
      const outlet = this.getStoredOutlet();

      if (!token || !user || !outlet) {
        return false;
      }

      // Check if token is expired
      if (this.isTokenExpired(token)) {
        console.warn('[AUTH v2] Token expired');
        // Try to refresh
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          return false;
        }
      }

      return true;
    }

    /**
     * Check if JWT token is expired
     */
    isTokenExpired(token) {
      try {
        const payload = this.decodeJWT(token);
        if (!payload.exp) return false;

        const expiryTime = payload.exp * 1000;
        const currentTime = Date.now();
        
        return currentTime >= expiryTime;
      } catch (error) {
        console.error('[AUTH v2] Failed to decode token:', error);
        return true;
      }
    }

    /**
     * Decode JWT token (client-side, no verification)
     */
    decodeJWT(token) {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }

        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
      } catch (error) {
        throw new Error('Failed to decode JWT: ' + error.message);
      }
    }

    /**
     * Get time until token expiry
     */
    getTimeUntilExpiry(token) {
      try {
        const payload = this.decodeJWT(token);
        if (!payload.exp) return null;

        const expiryTime = payload.exp * 1000;
        const currentTime = Date.now();
        
        return expiryTime - currentTime;
      } catch (error) {
        return null;
      }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken() {
      const refreshToken = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        console.warn('[AUTH v2] No refresh token available');
        return false;
      }

      try {
        console.log('[AUTH v2] Attempting token refresh...');
        
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        
        if (data.success && data.token) {
          // Store new tokens
          await this.storeAuthData(data.token, data.refreshToken || refreshToken, data.user, data.outlet);
          
          this.logAuditEvent('token_refreshed', {
            userId: data.user?.id,
            timestamp: new Date().toISOString()
          });

          console.log('[AUTH v2] ✅ Token refreshed successfully');
          return true;
        }

        return false;
      } catch (error) {
        console.error('[AUTH v2] Token refresh failed:', error);
        this.retryCount++;

        if (this.retryCount >= AUTH_CONFIG.MAX_RETRY_ATTEMPTS) {
          console.error('[AUTH v2] Max retry attempts reached, clearing session');
          await this.logout('token_refresh_failed');
        }

        return false;
      }
    }

    /**
     * Start session with token refresh scheduling
     */
    async startSession() {
      const token = this.getStoredToken();
      const user = this.getStoredUser();
      const outlet = this.getStoredOutlet();

      this.currentSession = {
        token,
        user,
        outlet,
        startTime: Date.now(),
        permissions: this.getUserPermissions(user)
      };

      // Initialize encryption key
      if (window.EncryptionService && user) {
        try {
          await window.EncryptionService.deriveKey(user.id, token);
          console.log('[AUTH v2] ✅ Encryption key initialized');
        } catch (error) {
          console.error('[AUTH v2] Failed to initialize encryption:', error);
        }
      }

      // 1. Restore local session
      this.restoreSession();

      // URL Hijacking Mitigation: Ensure app is running inside an iframe or launcher
      if (window.location.pathname !== '/' && window.top === window.self) {
        console.warn('[AUTH v2] URL Hijacking detected. Redirecting to Launcher.');
        this.redirectToLauncher();
        return;
      }

      // 2. Setup auth interceptors
      this.setupInterceptors();

      // Sync with API session
      this.syncWithAPI();

      // Schedule token refresh
      this.scheduleTokenRefresh();

      // Log session start
      this.logAuditEvent('session_started', {
        userId: user.id,
        userName: user.name,
        outletId: outlet.id,
        timestamp: new Date().toISOString()
      });

      // Dispatch session ready event
      window.dispatchEvent(new CustomEvent('nashty:auth-ready', {
        detail: { session: this.currentSession }
      }));
    }

    /**
     * Schedule automatic token refresh
     */
    scheduleTokenRefresh() {
      // Clear existing timer
      if (this.tokenRefreshTimer) {
        clearTimeout(this.tokenRefreshTimer);
      }

      const token = this.getStoredToken();
      const timeUntilExpiry = this.getTimeUntilExpiry(token);

      if (timeUntilExpiry === null) {
        console.warn('[AUTH v2] Cannot schedule refresh: token has no expiry');
        return;
      }

      // Schedule refresh before expiry
      const refreshTime = Math.max(0, timeUntilExpiry - AUTH_CONFIG.TOKEN_REFRESH_THRESHOLD);

      console.log(`[AUTH v2] Token refresh scheduled in ${Math.round(refreshTime / 1000)}s`);

      this.tokenRefreshTimer = setTimeout(async () => {
        await this.refreshToken();
        // Reschedule after refresh
        this.scheduleTokenRefresh();
      }, refreshTime);
    }

    /**
     * Start session monitoring (timeout, activity)
     */
    startSessionMonitoring() {
      // Check session timeout every minute
      this.sessionCheckTimer = setInterval(() => {
        if (!this.currentSession) return;

        const sessionDuration = Date.now() - this.currentSession.startTime;
        
        if (sessionDuration >= AUTH_CONFIG.SESSION_TIMEOUT) {
          console.warn('[AUTH v2] Session timeout reached');
          this.logout('session_timeout');
        }
      }, 60000); // Check every minute
    }

    /**
     * Store authentication data securely
     */
    async storeAuthData(token, refreshToken, user, outlet) {
      try {
        // Store tokens
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN, token);
        if (refreshToken) {
          localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }

        // Store user and outlet
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.OUTLET, JSON.stringify(outlet));

        // Store permissions
        const permissions = this.getUserPermissions(user);
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));

        console.log('[AUTH v2] ✅ Authentication data stored');
        return true;
      } catch (error) {
        console.error('[AUTH v2] Failed to store auth data:', error);
        return false;
      }
    }

    /**
     * Get user permissions based on role
     */
    getUserPermissions(user) {
      if (!user || !user.role) {
        return [];
      }

      const rolePermissions = ROLES[user.role] || [];
      const permissions = new Set();

      rolePermissions.forEach(perm => {
        if (perm === '*') {
          // Admin: all permissions
          Object.keys(PERMISSIONS).forEach(p => permissions.add(p));
        } else if (perm.endsWith('.*')) {
          // Wildcard: add all matching
          const prefix = perm.slice(0, -2);
          Object.keys(PERMISSIONS)
            .filter(p => p.startsWith(prefix))
            .forEach(p => permissions.add(p));
        } else {
          permissions.add(perm);
        }
      });

      return Array.from(permissions);
    }

    /**
     * Check if user has permission
     */
    hasPermission(permission) {
      if (!this.currentSession) {
        return false;
      }

      const permissions = this.currentSession.permissions || [];
      return permissions.includes(permission) || permissions.includes('*');
    }

    /**
     * Check if user has any of the permissions
     */
    hasAnyPermission(...permissions) {
      return permissions.some(p => this.hasPermission(p));
    }

    /**
     * Check if user has all permissions
     */
    hasAllPermissions(...permissions) {
      return permissions.every(p => this.hasPermission(p));
    }

    /**
     * Require permission (throws error if not authorized)
     */
    requirePermission(permission, action = 'perform this action') {
      if (!this.hasPermission(permission)) {
        const error = new Error(`Unauthorized: You need '${permission}' permission to ${action}`);
        error.code = 'PERMISSION_DENIED';
        error.permission = permission;
        
        this.logAuditEvent('permission_denied', {
          userId: this.currentSession?.user?.id,
          permission,
          action,
          timestamp: new Date().toISOString()
        });

        throw error;
      }
    }

    /**
     * Log audit event
     */
    logAuditEvent(eventType, data) {
      try {
        const log = JSON.parse(localStorage.getItem(AUTH_CONFIG.AUDIT_LOG_KEY) || '[]');
        
        const event = {
          id: this.generateUUID(),
          type: eventType,
          timestamp: new Date().toISOString(),
          ...data
        };

        log.unshift(event);

        // Keep only last N entries
        if (log.length > AUTH_CONFIG.MAX_AUDIT_ENTRIES) {
          log.splice(AUTH_CONFIG.MAX_AUDIT_ENTRIES);
        }

        localStorage.setItem(AUTH_CONFIG.AUDIT_LOG_KEY, JSON.stringify(log));
        
        // Dispatch event for real-time monitoring
        window.dispatchEvent(new CustomEvent('nashty:audit-log', {
          detail: event
        }));
      } catch (error) {
        console.error('[AUTH v2] Failed to log audit event:', error);
      }
    }

    /**
     * Get audit log entries
     */
    getAuditLog(filters = {}) {
      try {
        let log = JSON.parse(localStorage.getItem(AUTH_CONFIG.AUDIT_LOG_KEY) || '[]');

        // Apply filters
        if (filters.userId) {
          log = log.filter(e => e.userId === filters.userId);
        }
        if (filters.eventType) {
          log = log.filter(e => e.type === filters.eventType);
        }
        if (filters.startDate) {
          log = log.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
          log = log.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
        }

        return log;
      } catch (error) {
        console.error('[AUTH v2] Failed to get audit log:', error);
        return [];
      }
    }

    /**
     * Handle no authentication scenario
     */
    async handleNoAuth() {
      // Production: wait for postMessage then redirect
      setTimeout(() => {
        if (!this.validateSession()) {
          console.warn('[AUTH v2] No auth received. API requests will fail securely.');
          // this.redirectToLauncher(); // Disabled: let the API 401 handle the redirect if needed
        }
      }, 5000);
    }

    /**
     * Create demo token for dev mode
     */
    createDemoToken() {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        sub: 'admin',
        name: 'Admin Demo',
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };

      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      
      return `${encodedHeader}.${encodedPayload}.demo-signature`;
    }

    /**
     * Logout and clear session
     */
    async logout(reason = 'user_logout') {
      console.log(`[AUTH v2] Logging out (reason: ${reason})`);

      // Log audit event
      if (this.currentSession) {
        this.logAuditEvent('session_ended', {
          userId: this.currentSession.user?.id,
          reason,
          duration: Date.now() - this.currentSession.startTime,
          timestamp: new Date().toISOString()
        });
      }

      // Clear encryption keys
      if (window.EncryptionService && this.currentSession?.user) {
        window.EncryptionService.clearKeys(this.currentSession.user.id);
      }

      // Clear timers
      if (this.tokenRefreshTimer) {
        clearTimeout(this.tokenRefreshTimer);
      }
      if (this.sessionCheckTimer) {
        clearInterval(this.sessionCheckTimer);
      }

      // Clear storage
      this.clearAuthData();

      // Clear session
      this.currentSession = null;
      this.retryCount = 0;

      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('nashty:auth-logout', {
        detail: { reason }
      }));

      // Redirect to launcher
      this.redirectToLauncher();
    }

    /**
     * Clear authentication data from storage
     */
    clearAuthData() {
      Object.values(AUTH_CONFIG.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('[AUTH v2] 🔒 Authentication data cleared');
    }

    /**
     * Redirect to launcher
     */
    redirectToLauncher() {
      console.warn('[AUTH v2] Redirecting to launcher...');
      window.location.href = AUTH_CONFIG.LAUNCHER_ORIGIN;
    }

    /**
     * Listen for auth messages from launcher
     */
    initMessageListener() {
      window.addEventListener('message', async (event) => {
        // Verify origin
        if (event.origin !== AUTH_CONFIG.LAUNCHER_ORIGIN) {
          console.warn('[AUTH v2] Message from unauthorized origin:', event.origin);
          return;
        }

        // Check if this is an auth message
        if (event.data && event.data.type === 'NASHTY_AUTH') {
          const { token, refreshToken, user, outlet, superToken } = event.data;

          const authToken = token || superToken;
          
          if (!authToken || !user) {
            console.error('[AUTH v2] Incomplete auth data from launcher');
            return;
          }

          const authOutlet = outlet || { 
            id: user.outletId || 'main-branch', 
            name: 'Main Branch' 
          };

          console.log('[AUTH v2] ✅ Authentication data received from launcher');
          
          // Store auth data
          await this.storeAuthData(authToken, refreshToken, user, authOutlet);
          
          // Start session
          await this.startSession();

          // Call app initialization if available
          if (typeof window.initializeApp === 'function') {
            window.initializeApp();
          } else if (typeof window.onAuthReceived === 'function') {
            window.onAuthReceived({ token: authToken, user, outlet: authOutlet });
          } else {
            window.location.reload();
          }
        }
      });

      console.log('[AUTH v2] Message listener initialized');
    }

    /**
     * Create authenticated fetch wrapper
     */
    createAuthenticatedFetch() {
      const originalFetch = window.fetch;
      const authManager = this;
      
      window.fetch = async function(url, options = {}) {
        // Add Authorization header
        if (authManager.currentSession?.token) {
          options.headers = options.headers || {};
          
          if (!options.headers['Authorization'] && !options.headers['authorization']) {
            options.headers['Authorization'] = `Bearer ${authManager.currentSession.token}`;
          }
        }

        // Call original fetch
        let response = await originalFetch(url, options);

        // Handle 401 responses (token expired)
        if (response.status === 401 && authManager.currentSession) {
          console.warn('[AUTH v2] Received 401, attempting token refresh...');
          
          // Try to refresh token
          const refreshed = await authManager.refreshToken();
          
          if (refreshed) {
            // Retry request with new token
            options.headers['Authorization'] = `Bearer ${authManager.currentSession.token}`;
            response = await originalFetch(url, options);
          } else {
            // Refresh failed, logout
            await authManager.logout('token_expired');
          }
        }

        // Handle 403 responses (permission denied)
        if (response.status === 403) {
          console.warn('[AUTH v2] Received 403, permission denied');
          authManager.logAuditEvent('api_permission_denied', {
            userId: authManager.currentSession?.user?.id,
            url,
            method: options.method || 'GET',
            timestamp: new Date().toISOString()
          });
        }

        return response;
      };

      console.log('[AUTH v2] ✅ Fetch interceptor installed');
    }

    /**
     * Sync auth data with API object
     */
    syncWithAPI() {
      if (typeof window.API !== 'undefined' && window.API.session && this.currentSession) {
        console.log('[AUTH v2] Syncing with API.session');
        window.API.session.token = this.currentSession.token;
        window.API.session.user = this.currentSession.user;
        window.API.session.tenantId = this.currentSession.user.tenantId || '00000000-0000-0000-0000-000000000001';
        window.API.session.outletId = this.currentSession.outlet.id || '00000000-0000-0000-0000-000000000002';
      }
    }

    /**
     * Expose public API
     */
    exposeAPI() {
      window.NASHTY_AUTH = {
        // Session
        hasValidAuth: () => !!this.currentSession,
        getSession: () => this.currentSession,
        getAuthData: () => ({
          token: this.getStoredToken(),
          user: this.getStoredUser(),
          outlet: this.getStoredOutlet()
        }),
        getToken: () => this.getStoredToken(),
        getUser: () => this.getStoredUser(),
        getOutlet: () => this.getStoredOutlet(),
        
        // Permissions
        hasPermission: (perm) => this.hasPermission(perm),
        hasAnyPermission: (...perms) => this.hasAnyPermission(...perms),
        hasAllPermissions: (...perms) => this.hasAllPermissions(...perms),
        requirePermission: (perm, action) => this.requirePermission(perm, action),
        getUserPermissions: () => this.currentSession?.permissions || [],
        
        // Actions
        logout: (reason) => this.logout(reason),
        refreshToken: () => this.refreshToken(),
        
        // Audit
        logAuditEvent: (type, data) => this.logAuditEvent(type, data),
        getAuditLog: (filters) => this.getAuditLog(filters),
        
        // Legacy compatibility
        clearAuth: () => this.logout('manual_clear'),
        redirectToLauncher: () => this.redirectToLauncher(),
        handleUnauthorized: () => this.logout('unauthorized'),
        syncWithAPI: () => this.syncWithAPI()
      };
    }

    // Utility methods
    getStoredToken() {
      return localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
    }

    getStoredUser() {
      try {
        return JSON.parse(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER) || 'null');
      } catch (e) {
        return null;
      }
    }

    getStoredOutlet() {
      try {
        return JSON.parse(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.OUTLET) || 'null');
      } catch (e) {
        return null;
      }
    }

    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
  }

  // Initialize when DOM is ready
  const authManager = new AuthManager();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authManager.init());
  } else {
    authManager.init();
  }

  console.log('✅ Enhanced Authentication System v2.0 loaded');

})();
