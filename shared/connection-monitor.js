/**
 * ============================================================================
 * CONNECTION MONITOR - Nashty System
 * ============================================================================
 * Purpose: Monitor internet connection and show visual feedback
 * Usage: Import in all apps (POS, KDS, Backoffice, etc.)
 * ============================================================================
 */

const ConnectionMonitor = {
  isOnline: navigator.onLine,
  indicator: null,
  failedRequests: [],
  
  /**
   * Initialize connection monitoring
   */
  init() {
    this.createIndicator();
    this.attachListeners();
    this.checkInitialStatus();
    
    console.log('🔌 Connection Monitor initialized');
  },
  
  /**
   * Create visual indicator
   */
  createIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'connection-status';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #FCA5A5 0%, #F87171 100%);
      color: #7F1D1D;
      padding: 10px 20px;
      text-align: center;
      font-weight: 700;
      font-size: 13px;
      display: none;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      border-bottom: 2px solid #DC2626;
      animation: slideDown 0.3s ease-out;
    `;
    
    indicator.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span id="connection-message">⚠️ Tidak ada koneksi internet. Mode offline aktif.</span>
      </div>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(-100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(indicator);
    this.indicator = indicator;
  },
  
  /**
   * Attach event listeners
   */
  attachListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Listen for failed API requests
    if (window.API) {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args);
          return response;
        } catch (error) {
          this.handleFailedRequest(args[0], error);
          throw error;
        }
      };
    }
  },
  
  /**
   * Check initial connection status
   */
  checkInitialStatus() {
    if (!navigator.onLine) {
      this.handleOffline();
    }
  },
  
  /**
   * Handle online event
   */
  handleOnline() {
    console.log('✅ Connection restored');
    this.isOnline = true;
    
    // Update indicator
    if (this.indicator) {
      const messageEl = this.indicator.querySelector('#connection-message');
      this.indicator.style.background = 'linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%)';
      this.indicator.style.color = '#14532D';
      this.indicator.style.borderBottomColor = '#16A34A';
      messageEl.textContent = '✅ Koneksi internet kembali normal';
      this.indicator.style.display = 'block';
      
      // Hide after 3 seconds
      setTimeout(() => {
        this.indicator.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
          this.indicator.style.display = 'none';
          this.indicator.style.animation = 'slideDown 0.3s ease-out';
        }, 300);
      }, 3000);
    }
    
    // Show toast
    if (typeof toast === 'function') {
      toast('✅ Koneksi kembali normal', 'ok');
    }
    
    // Retry failed requests
    this.retryFailedRequests();
  },
  
  /**
   * Handle offline event
   */
  handleOffline() {
    console.warn('⚠️ Connection lost');
    this.isOnline = false;
    
    // Show indicator
    if (this.indicator) {
      const messageEl = this.indicator.querySelector('#connection-message');
      this.indicator.style.background = 'linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)';
      this.indicator.style.color = '#7F1D1D';
      this.indicator.style.borderBottomColor = '#DC2626';
      messageEl.textContent = '⚠️ Tidak ada koneksi internet. Mode offline aktif.';
      this.indicator.style.display = 'block';
    }
    
    // Show toast
    if (typeof toast === 'function') {
      toast('⚠️ Koneksi internet terputus', 'warn');
    }
  },
  
  /**
   * Handle failed request
   */
  handleFailedRequest(url, error) {
    if (!this.isOnline) {
      // Queue for retry when back online
      this.failedRequests.push({
        url,
        error,
        timestamp: Date.now()
      });
      
      console.log(`📝 Request queued for retry: ${url}`);
    }
  },
  
  /**
   * Retry failed requests
   */
  async retryFailedRequests() {
    if (this.failedRequests.length === 0) return;
    
    console.log(`🔄 Retrying ${this.failedRequests.length} failed requests...`);
    
    const requests = [...this.failedRequests];
    this.failedRequests = [];
    
    for (const request of requests) {
      try {
        // Only retry if less than 5 minutes old
        if (Date.now() - request.timestamp < 5 * 60 * 1000) {
          console.log(`Retrying: ${request.url}`);
          await fetch(request.url);
        }
      } catch (error) {
        console.error(`Retry failed for ${request.url}:`, error);
        // Re-queue if still offline
        if (!navigator.onLine) {
          this.failedRequests.push(request);
        }
      }
    }
  },
  
  /**
   * Check connection status manually
   */
  async checkConnection() {
    try {
      const response = await fetch('/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ConnectionMonitor.init());
} else {
  ConnectionMonitor.init();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConnectionMonitor;
}

// Make globally available
if (typeof window !== 'undefined') {
  window.ConnectionMonitor = ConnectionMonitor;
}
