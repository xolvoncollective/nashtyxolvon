/**
 * NASHTY OS - Service Worker Update Manager
 * Handles SW update detection and notification
 */

class SWUpdateManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.modalInjected = false;
  }

  /**
   * Register Service Worker and listen for updates
   */
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('SWUpdateManager: Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/pos/frontend/sw.js', {
        scope: '/pos/frontend/',
        updateViaCache: 'none'
      });

      console.log('SWUpdateManager: Service Worker registered');

      // Check for updates every 5 minutes
      setInterval(() => {
        if (this.registration) {
          console.log('SWUpdateManager: Checking for updates...');
          this.registration.update();
        }
      }, 5 * 60 * 1000);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdate(this.registration.installing);
      });

      // Check immediately
      await this.registration.update();

      return this.registration;
    } catch (error) {
      console.error('SWUpdateManager: Registration failed:', error);
      return null;
    }
  }

  /**
   * Handle SW update detection
   */
  handleUpdate(worker) {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        this.updateAvailable = true;
        this.notifyUpdateAvailable();
      }
    });
  }

  /**
   * Notify user of available update
   */
  async notifyUpdateAvailable() {
    // Check if it's safe to update
    const canUpdate = !this.hasPendingOrders() && !this.hasActiveCart();
    
    if (canUpdate) {
      this.showUpdateModal();
    } else {
      // Defer update - re-check in 30 minutes
      console.log('SWUpdateManager: Update deferred - pending orders or active cart');
      setTimeout(() => this.notifyUpdateAvailable(), 30 * 60 * 1000);
    }
  }

  /**
   * Check if there are pending offline orders
   */
  hasPendingOrders() {
    return window.OfflineSyncManager?.getQueuedOrders?.().then(q => q.length > 0) || false;
  }

  /**
   * Check if there's an active cart
   */
  hasActiveCart() {
    // Check if cart has items
    return window.CART && window.CART.length > 0;
  }

  /**
   * Show update notification modal
   */
  showUpdateModal() {
    if (this.modalInjected) {
      // Just show existing modal
      const modal = document.getElementById('sw-update-modal');
      if (modal) {
        modal.style.display = 'flex';
        return;
      }
    }

    // Inject modal HTML
    this.injectModal();
    this.modalInjected = true;

    // Show modal
    const modal = document.getElementById('sw-update-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  /**
   * Inject modal HTML into DOM
   */
  injectModal() {
    const modalHTML = `
      <div id="sw-update-modal" style="
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: none;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      ">
        <div style="
          background: var(--sf);
          border: 1px solid var(--brd2);
          border-radius: 20px;
          padding: 32px;
          max-width: 420px;
          width: 90%;
          box-shadow: var(--sh2);
          animation: slideUp 0.3s ease;
        ">
          <div style="
            width: 56px;
            height: 56px;
            border-radius: 14px;
            background: linear-gradient(135deg, var(--bl), #2563EB);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
          ">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </div>
          
          <div style="
            font-size: 20px;
            font-weight: 900;
            color: var(--txt);
            text-align: center;
            margin-bottom: 12px;
            letter-spacing: -0.02em;
          ">Update Tersedia</div>
          
          <div style="
            font-size: 14px;
            color: var(--txt2);
            text-align: center;
            line-height: 1.6;
            margin-bottom: 24px;
          ">
            Versi baru POS telah tersedia. Update sekarang untuk mendapatkan fitur terbaru dan perbaikan bug.
          </div>
          
          <div style="display: flex; gap: 10px;">
            <button onclick="window.SWUpdateManager.dismissUpdate()" style="
              flex: 1;
              padding: 12px;
              border-radius: 12px;
              border: 1px solid var(--brd);
              background: transparent;
              color: var(--txt2);
              font-size: 14px;
              font-weight: 700;
              cursor: pointer;
              font-family: var(--fn);
              transition: all 0.12s;
            " onmouseover="this.style.background='var(--sf2)'" onmouseout="this.style.background='transparent'">
              Nanti
            </button>
            
            <button onclick="window.SWUpdateManager.activateUpdate()" style="
              flex: 1;
              padding: 12px;
              border-radius: 12px;
              border: none;
              background: var(--bl);
              color: #fff;
              font-size: 14px;
              font-weight: 800;
              cursor: pointer;
              font-family: var(--fn);
              transition: all 0.12s;
              box-shadow: 0 3px 14px rgba(59, 130, 246, 0.3);
            " onmouseover="this.style.background='#2563EB'" onmouseout="this.style.background='var(--bl)'">
              Update Sekarang
            </button>
          </div>
        </div>
      </div>
      
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Dismiss update notification
   */
  dismissUpdate() {
    const modal = document.getElementById('sw-update-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    
    // Re-check in 1 hour
    setTimeout(() => this.notifyUpdateAvailable(), 60 * 60 * 1000);
  }

  /**
   * Activate update and reload
   */
  activateUpdate() {
    if (this.registration?.waiting) {
      // Tell the service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page when SW is activated
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }
}

// Initialize and export
window.SWUpdateManager = new SWUpdateManager();

// Auto-register on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.SWUpdateManager.register();
  });
} else {
  window.SWUpdateManager.register();
}
