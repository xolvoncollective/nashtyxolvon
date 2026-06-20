/**
 * NASHTY OS - Shared Authentication Handler
 * Handles JWT token reception from parent launcher window via postMessage
 * 
 * Usage: Include this script in POS, KDS, and Backoffice HTML files
 * <script src="../shared/auth.js"></script>
 */

(function() {
  'use strict';

  const NASHTY_AUTH = {
    LAUNCHER_ORIGIN: window.location.origin,
    STORAGE_KEYS: {
      TOKEN: 'nashty_token',
      USER: 'nashty_user',
      OUTLET: 'nashty_outlet'
    }
  };

  /**
   * Check if we have valid authentication
   */
  function hasValidAuth() {
    const token = localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.TOKEN);
    const user = localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.USER);
    const outlet = localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.OUTLET);
    return !!(token && user && outlet);
  }

  /**
   * Get stored authentication data
   */
  function getAuthData() {
    try {
      return {
        token: localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.TOKEN),
        user: JSON.parse(localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.USER) || 'null'),
        outlet: JSON.parse(localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.OUTLET) || 'null')
      };
    } catch (error) {
      console.error('[NASHTY AUTH] Failed to parse stored auth data:', error);
      return { token: null, user: null, outlet: null };
    }
  }

  /**
   * Store authentication data
   */
  function storeAuthData(token, user, outlet) {
    try {
      localStorage.setItem(NASHTY_AUTH.STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(NASHTY_AUTH.STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(NASHTY_AUTH.STORAGE_KEYS.OUTLET, JSON.stringify(outlet));
      console.log('[NASHTY AUTH] Authentication data stored successfully');
      return true;
    } catch (error) {
      console.error('[NASHTY AUTH] Failed to store auth data:', error);
      return false;
    }
  }

  /**
   * Clear authentication data
   */
  function clearAuthData() {
    localStorage.removeItem(NASHTY_AUTH.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(NASHTY_AUTH.STORAGE_KEYS.USER);
    localStorage.removeItem(NASHTY_AUTH.STORAGE_KEYS.OUTLET);
    console.log('[NASHTY AUTH] Authentication data cleared');
  }

  /**
   * Redirect to launcher if not authenticated
   */
  function redirectToLauncher() {
    console.warn('[NASHTY AUTH] No valid authentication, redirecting to launcher...');
    window.location.href = NASHTY_AUTH.LAUNCHER_ORIGIN;
  }

  /**
   * Handle 401/403 responses by redirecting to launcher
   */
  function handleUnauthorized() {
    console.warn('[NASHTY AUTH] Unauthorized access detected, clearing auth and redirecting...');
    clearAuthData();
    redirectToLauncher();
  }

  /**
   * Listen for auth messages from parent launcher window
   */
  function initMessageListener() {
    window.addEventListener('message', function(event) {
      // Verify origin for security
      if (event.origin !== NASHTY_AUTH.LAUNCHER_ORIGIN) {
        console.warn('[NASHTY AUTH] Received message from unauthorized origin:', event.origin);
        return;
      }

      // Check if this is an auth message
      if (event.data && event.data.type === 'NASHTY_AUTH') {
        const { token, user, outlet } = event.data;

        if (!token || !user || !outlet) {
          console.error('[NASHTY AUTH] Received incomplete auth data from launcher');
          return;
        }

        console.log('[NASHTY AUTH] Received authentication data from launcher');
        
        // Store auth data
        if (storeAuthData(token, user, outlet)) {
          // Sync with API.session if available
          syncAuthWithAPI();
          
          // Dispatch custom event for app to handle
          window.dispatchEvent(new CustomEvent('nashty:auth-received', {
            detail: { token, user, outlet }
          }));
          
          // Reload or initialize app if needed
          if (typeof window.initializeApp === 'function') {
            console.log('[NASHTY AUTH] Calling initializeApp()');
            window.initializeApp();
          } else if (typeof window.onAuthReceived === 'function') {
            console.log('[NASHTY AUTH] Calling onAuthReceived()');
            window.onAuthReceived({ token, user, outlet });
          } else {
            // If no initialization function, just reload the page
            console.log('[NASHTY AUTH] No init function found, reloading page...');
            window.location.reload();
          }
        }
      }
    });

    console.log('[NASHTY AUTH] Message listener initialized');
  }

  /**
   * Add Authorization header to fetch requests
   */
  function createAuthenticatedFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options = {}) {
      const authData = getAuthData();
      
      if (authData.token) {
        options.headers = options.headers || {};
        
        // Add Authorization header if not already present
        if (!options.headers['Authorization'] && !options.headers['authorization']) {
          options.headers['Authorization'] = `Bearer ${authData.token}`;
        }
      }

      // Call original fetch and handle 401/403 responses
      return originalFetch(url, options).then(response => {
        if (response.status === 401 || response.status === 403) {
          console.warn('[NASHTY AUTH] Received ' + response.status + ' response, token may be expired');
          handleUnauthorized();
        }
        return response;
      });
    };

    console.log('[NASHTY AUTH] Fetch interceptor installed');
  }

  /**
   * Initialize authentication system
   */
  function init() {
    console.log('[NASHTY AUTH] Initializing authentication system...');
    
    // Set up message listener
    initMessageListener();
    
    // Intercept fetch to add Authorization header
    createAuthenticatedFetch();
    
    // Sync auth data with API object if it exists
    syncAuthWithAPI();
    
    // Check if we have valid auth
    if (!hasValidAuth()) {
      console.warn('[NASHTY AUTH] No valid authentication found');
      
      // DEV MODE: Skip redirect on localhost, auto-set demo credentials
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('[NASHTY AUTH] DEV MODE — Skipping auth redirect, using demo credentials');
        storeAuthData('dev-token', 
          { id: 'admin', name: 'Admin Demo', role: 'admin', tenantId: 'demo-tenant', outletId: 'demo-outlet' },
          { id: 'demo-outlet', name: 'Demo Outlet' }
        );
        syncAuthWithAPI();
      } else {
        // Production: wait for postMessage then redirect
        setTimeout(function() {
          if (!hasValidAuth()) {
            console.warn('[NASHTY AUTH] Still no auth after waiting, redirecting to launcher');
            redirectToLauncher();
          }
        }, 2000);
      }
    } else {
      console.log('[NASHTY AUTH] Valid authentication found');
      const authData = getAuthData();
      console.log('[NASHTY AUTH] User:', authData.user?.name || authData.user?.username);
      console.log('[NASHTY AUTH] Outlet:', authData.outlet?.name);
      
      // Sync with API object if available
      syncAuthWithAPI();
    }
  }

  /**
   * Sync authentication data with window.API.session if it exists
   */
  function syncAuthWithAPI() {
    if (typeof window.API !== 'undefined' && window.API.session) {
      const authData = getAuthData();
      if (authData.token && authData.user && authData.outlet) {
        console.log('[NASHTY AUTH] Syncing auth data with API.session');
        window.API.session.token = authData.token;
        window.API.session.user = authData.user;
        window.API.session.tenantId = authData.user.tenant_id || authData.user.tenantId || 'demo-tenant';
        window.API.session.outletId = authData.outlet.id || authData.outlet.outlet_id || 'demo-outlet';
      }
    }
  }

  // Export API for use in modules
  window.NASHTY_AUTH = {
    hasValidAuth: hasValidAuth,
    getAuthData: getAuthData,
    getToken: function() {
      return localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.TOKEN);
    },
    getUser: function() {
      try {
        return JSON.parse(localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.USER) || 'null');
      } catch (e) {
        return null;
      }
    },
    getOutlet: function() {
      try {
        return JSON.parse(localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.OUTLET) || 'null');
      } catch (e) {
        return null;
      }
    },
    clearAuth: clearAuthData,
    redirectToLauncher: redirectToLauncher,
    handleUnauthorized: handleUnauthorized,
    syncWithAPI: syncAuthWithAPI
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
