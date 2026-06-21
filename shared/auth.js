/**
 * NASHTY OS - Shared Authentication Handler v2.0
 * SIMPLIFIED - No auto-kick, no aggressive redirects
 * Handles JWT token from launcher or direct login
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
      OUTLET: 'nashty_outlet',
      SESSION: 'nashty_session' // For API.session data
    }
  };

  /**
   * Check if we have valid authentication
   */
  function hasValidAuth() {
    const token = localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.TOKEN);
    const session = localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.SESSION);
    return !!(token || session);
  }

  /**
   * Get stored authentication data
   */
  function getAuthData() {
    try {
      // Try to get from nashty_session first (API.session)
      const sessionStr = localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.SESSION);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.token) {
          return {
            token: session.token,
            user: session.user || JSON.parse(localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.USER) || 'null'),
            outlet: session.outletId ? { id: session.outletId } : JSON.parse(localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.OUTLET) || 'null')
          };
        }
      }

      // Fallback to individual keys
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
   * Redirect to the launcher (root page)
   */
  function redirectToLauncher() {
    console.warn('[NASHTY AUTH] Redirecting to launcher...');
    if (window.top !== window.self) {
      // Inside iframe - notify parent to handle navigation
      try {
        window.top.postMessage({ type: 'NASHTY_LOGOUT' }, '*');
      } catch (e) {
        // Cross-origin, just redirect the iframe
        window.location.href = '/';
      }
    } else {
      window.location.href = '/';
    }
  }

  /**
   * Clear authentication data
   */
  function clearAuthData() {
    localStorage.removeItem(NASHTY_AUTH.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(NASHTY_AUTH.STORAGE_KEYS.USER);
    localStorage.removeItem(NASHTY_AUTH.STORAGE_KEYS.OUTLET);
    localStorage.removeItem(NASHTY_AUTH.STORAGE_KEYS.SESSION);
    console.log('[NASHTY AUTH] Authentication data cleared');
    
    if (window.NASHTY_SSO_CHANNEL) {
      // Small timeout to prevent infinite loops if multiple tabs clear at the same time
      setTimeout(() => {
        window.NASHTY_SSO_CHANNEL.postMessage({ type: 'LOGOUT' });
      }, 100);
    }
    
    // Clear API session if available
    if (typeof window !== 'undefined' && window.API && window.API.session) {
      window.API.session.token = null;
      window.API.session.user = null;
    }
    
    // Optionally redirect
    redirectToLauncher();
  }

  /**
   * Listen for auth messages from parent launcher window
   */
  function initMessageListener() {
    window.addEventListener('message', function(event) {
      // Check if this is an auth message
      if (event.data && event.data.type === 'NASHTY_AUTH') {
        const { token, user, outlet, superToken } = event.data;

        // Support both regular token and superToken
        const authToken = token || superToken;
        
        if (!authToken || !user) {
          console.error('[NASHTY AUTH] Received incomplete auth data from launcher');
          return;
        }

        // Ensure outlet exists
        const authOutlet = outlet || { 
          id: user.outletId || user.outlet_id || 'default-outlet', 
          name: user.outletName || 'Main Outlet' 
        };

        console.log('[NASHTY AUTH] Received authentication data from launcher');
        
        // Store auth data
        if (storeAuthData(authToken, user, authOutlet)) {
          // Sync with API.session if available
          syncAuthWithAPI();
          
          // Dispatch custom event for app to handle
          window.dispatchEvent(new CustomEvent('nashty:auth-received', {
            detail: { token: authToken, user, outlet: authOutlet }
          }));
          
          // Reload or initialize app if needed
          if (typeof window.initializeApp === 'function') {
            console.log('[NASHTY AUTH] Calling initializeApp()');
            window.initializeApp();
          } else if (typeof window.onAuthReceived === 'function') {
            console.log('[NASHTY AUTH] Calling onAuthReceived()');
            window.onAuthReceived({ token: authToken, user, outlet: authOutlet });
          }
        }
      }
    });

    console.log('[NASHTY AUTH] Message listener initialized');
  }

  /**
   * Add Authorization header to fetch requests (SIMPLE VERSION)
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

      // Call original fetch WITHOUT 401 handling (no auto-kick)
      return originalFetch(url, options);
    };

    console.log('[NASHTY AUTH] Fetch interceptor installed');
  }

  /**
   * Sync authentication data with window.API.session if it exists
   */
  function syncAuthWithAPI() {
    if (typeof window.API !== 'undefined' && window.API.session) {
      const authData = getAuthData();
      if (authData.token && authData.user) {
        console.log('[NASHTY AUTH] Syncing auth data with API.session');
        window.API.session.token = authData.token;
        window.API.session.user = authData.user;
        window.API.session.tenantId = authData.user.tenant_id || authData.user.tenantId || '00000000-0000-0000-0000-000000000001';
        window.API.session.outletId = authData.outlet?.id || authData.outlet?.outlet_id || authData.user.outlet_id || '00000000-0000-0000-0000-000000000002';
      }
    }
  }

  /**
   * Initialize SSO (Single Sign-On) across tabs via BroadcastChannel
   */
  function initSSO() {
    try {
      const authChannel = new BroadcastChannel('nashty_sso_channel');
      authChannel.onmessage = function(event) {
        if (!event.data) return;
        
        if (event.data.type === 'SYNC_AUTH') {
          // Only sync if we don't have valid auth, to avoid overwrite loops
          if (!hasValidAuth() && event.data.session) {
            localStorage.setItem(NASHTY_AUTH.STORAGE_KEYS.SESSION, JSON.stringify(event.data.session));
            if (event.data.token) localStorage.setItem(NASHTY_AUTH.STORAGE_KEYS.TOKEN, event.data.token);
            syncAuthWithAPI();
          }
        } 
        else if (event.data.type === 'LOGOUT') {
          // If another tab logged out, we log out too
          if (hasValidAuth()) {
            console.warn('[NASHTY AUTH] Cross-tab logout triggered');
            clearAuthData();
          }
        }
      };
      
      // Store the channel so it can be used for broadcasting
      window.NASHTY_SSO_CHANNEL = authChannel;
      
      // If we already have auth, broadcast it to other tabs that might be waiting
      if (hasValidAuth()) {
        const sessionStr = localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.SESSION);
        const tokenStr = localStorage.getItem(NASHTY_AUTH.STORAGE_KEYS.TOKEN);
        if (sessionStr) {
           authChannel.postMessage({
             type: 'SYNC_AUTH',
             session: JSON.parse(sessionStr),
             token: tokenStr
           });
        }
      }
    } catch (e) {
      console.error('[NASHTY AUTH] SSO initialization failed', e);
    }
  }

  /**
   * Initialize authentication system
   */
  function init() {
    console.log('[NASHTY AUTH] Initializing NASHTY OS Authentication System');
    
    // Listen for auth tokens from parent window (Launcher)
    initMessageListener();
    
    // Initialize Cross-Tab SSO
    initSSO();
    
    // Intercept fetch to add Authorization header
    createAuthenticatedFetch();
    
    // URL Hijacking Mitigation: Ensure app is running inside an iframe or launcher
    if (window.location.pathname !== '/' && window.top === window.self) {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.warn('[NASHTY AUTH] URL Hijacking detected. Redirecting to Launcher.');
        redirectToLauncher();
        return;
      }
    }
    
    // Sync auth data with API object if it exists
    syncAuthWithAPI();
    
    // Check if we have valid auth
    if (!hasValidAuth()) {
      console.warn('[NASHTY AUTH] No valid authentication found');
      
      // DEV MODE: Auto-set demo credentials on localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('[NASHTY AUTH] DEV MODE — Using demo credentials');
        storeAuthData('dev-token', 
          { id: 'admin', name: 'Admin Demo', role: 'admin', tenantId: '00000000-0000-0000-0000-000000000001', outletId: '00000000-0000-0000-0000-000000000002' },
          { id: '00000000-0000-0000-0000-000000000002', name: 'Demo Outlet' }
        );
        syncAuthWithAPI();
      } else {
        // PRODUCTION: Just log warning, DON'T REDIRECT
        console.warn('[NASHTY AUTH] No auth found. User needs to login via app UI.');
        // Apps should show their own login screen if needed
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

  // Export API for use in modules
  window.NASHTY_AUTH = {
    hasValidAuth: hasValidAuth,
    getAuthData: getAuthData,
    getToken: function() {
      const authData = getAuthData();
      return authData.token;
    },
    getUser: function() {
      const authData = getAuthData();
      return authData.user;
    },
    getOutlet: function() {
      const authData = getAuthData();
      return authData.outlet;
    },
    clearAuth: clearAuthData,
    redirectToLauncher: redirectToLauncher,
    syncWithAPI: syncAuthWithAPI,
    storeAuth: storeAuthData
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
