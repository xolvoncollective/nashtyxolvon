/**
 * Shared Authentication Module for NASHTY OS Apps
 * Handles iframe communication and local persistence for session state
 */

window.NASHTY_AUTH = {
    authData: null,

    init: function() {
        // Try to load from local storage first to survive reloads
        this.loadFromStorage();
        
        // Listen for auth from parent launcher
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NASHTY_AUTH') {
                console.log('🔐 [Shared Auth] Received auth data from launcher', event.data);
                this.setAuthData(event.data);
            }
        });
    },

    setAuthData: function(data) {
        this.authData = {
            token: data.token,
            user: data.user,
            outlet: data.outlet,
            timestamp: Date.now()
        };
        
        // Persist to survive iframe reloads
        localStorage.setItem('nashty_shared_auth', JSON.stringify(this.authData));
        
        // Trigger generic custom event so apps know auth is ready
        window.dispatchEvent(new CustomEvent('nashty_auth_ready', { detail: this.authData }));
        
        // Call global callback if it exists (for legacy support)
        if (typeof window.onAuthReceived === 'function') {
            window.onAuthReceived(this.authData);
        }
    },

    loadFromStorage: function() {
        try {
            const saved = localStorage.getItem('nashty_shared_auth');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Basic expiry check (e.g. 12 hours)
                if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) {
                    this.authData = parsed;
                    console.log('🔐 [Shared Auth] Restored auth from local storage');
                    return true;
                } else {
                    console.log('🔐 [Shared Auth] Local auth expired, clearing');
                    this.clearAuth();
                }
            }
        } catch (e) {
            console.error('Failed to load shared auth', e);
        }
        return false;
    },

    hasValidAuth: function() {
        return this.authData !== null && !!this.authData.token;
    },

    getAuthData: function() {
        return this.authData || {};
    },

    getUser: function() {
        return this.authData ? this.authData.user : null;
    },

    getOutlet: function() {
        return this.authData ? this.authData.outlet : null;
    },

    getToken: function() {
        return this.authData ? this.authData.token : null;
    },

    clearAuth: function() {
        this.authData = null;
        localStorage.removeItem('nashty_shared_auth');
        console.log('🔐 [Shared Auth] Cleared auth data');
        
        // Inform parent launcher if possible
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'LOGOUT_REQUEST' }, '*');
        }
        
        // Broadcast to other tabs
        try {
            const authChannel = new BroadcastChannel('nashty_auth');
            authChannel.postMessage({ type: 'LOGOUT' });
            authChannel.close();
        } catch (e) {
            console.warn('Failed to broadcast logout', e);
        }
    }
};

// Initialize immediately
window.NASHTY_AUTH.init();
