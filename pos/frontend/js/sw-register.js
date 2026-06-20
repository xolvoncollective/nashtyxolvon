/**
 * NASHTY OS - Service Worker Registration
 * Manages SW lifecycle and update notifications
 */

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
  }

  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('✅ Service Worker registered successfully');

      // Check for updates every 5 minutes
      setInterval(() => {
        this.registration.update();
      }, 5 * 60 * 1000);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdate(this.registration.installing);
      });

      // Check for update immediately
      await this.registration.update();

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  handleUpdate(worker) {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        this.updateAvailable = true;
        this.notifyUpdateAvailable();
      }
    });
  }

  notifyUpdateAvailable() {
    // Check if safe to update (no pending orders or active cart)
    const canUpdate = !this.hasPendingOrders() && !this.hasActiveCart();
    
    if (canUpdate) {
      this.showUpdatePrompt();
    } else {
      // Defer update - re-check in 30 minutes
      console.log('⏰ SW update deferred (pending orders or active cart)');
      setTimeout(() => this.notifyUpdateAvailable(), 30 * 60 * 1000);
    }
  }

  hasPendingOrders() {
    return window.OfflineSyncManager?.getPendingCount?.() > 0 || false;
  }

  hasActiveCart() {
    return window.stateManager?.hasItemsInCart?.() || false;
  }

  showUpdatePrompt() {
    const modal = document.getElementById('sw-update-modal');
    if (modal) {
      modal.style.display = 'flex';
    } else {
      // Create modal if doesn't exist
      this.createUpdateModal();
    }
  }

  createUpdateModal() {
    const modal = document.createElement('div');
    modal.id = 'sw-update-modal';
    modal.className = 'modal';
    modal.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10000; align-items:center; justify-content:center;';
    
    modal.innerHTML = `
      <div class="modal-content" style="background:white; padding:30px; border-radius:12px; max-width:400px; text-align:center; box-shadow:0 8px 32px rgba(0,0,0,0.2);">
        <div style="font-size:48px; margin-bottom:20px;">🔄</div>
        <h2 style="margin:0 0 15px 0; color:#333;">Update Tersedia</h2>
        <p style="margin:0 0 25px 0; color:#666;">Versi baru POS sudah tersedia. Reload untuk mendapatkan fitur terbaru dan perbaikan bug.</p>
        <div style="display:flex; gap:10px; justify-content:center;">
          <button onclick="window.SWManager.activateUpdate()" style="flex:1; padding:12px 24px; background:#4CAF50; color:white; border:none; border-radius:6px; cursor:pointer; font-size:16px; font-weight:500;">
            Reload Sekarang
          </button>
          <button onclick="window.SWManager.dismissUpdate()" style="flex:1; padding:12px 24px; background:#f5f5f5; color:#333; border:none; border-radius:6px; cursor:pointer; font-size:16px;">
            Nanti Saja
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  async activateUpdate() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  dismissUpdate() {
    const modal = document.getElementById('sw-update-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    // Show again in 1 hour
    setTimeout(() => this.showUpdatePrompt(), 60 * 60 * 1000);
  }
}

// Initialize and export
window.SWManager = new ServiceWorkerManager();

// Auto-register on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.SWManager.register();
  });
} else {
  window.SWManager.register();
}

console.log('✅ ServiceWorkerManager module loaded');
