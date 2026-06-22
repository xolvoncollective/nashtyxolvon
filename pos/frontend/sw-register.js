/**
 * Service Worker Registration Module
 * Handles SW registration, updates, and error handling
 */

import { Workbox } from 'workbox-window';

class ServiceWorkerManager {
  constructor() {
    this.wb = null;
    this.registration = null;
    this.updateAvailable = false;
  }

  /**
   * Register Service Worker
   */
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported in this browser');
      return false;
    }

    try {
      this.wb = new Workbox('/sw.js');

      // Listen for waiting SW
      this.wb.addEventListener('waiting', (event) => {
        console.log('New Service Worker waiting...');
        this.updateAvailable = true;
        this.showUpdateNotification();
      });

      // Listen for activated SW
      this.wb.addEventListener('activated', (event) => {
        console.log('Service Worker activated');
        if (!event.isUpdate) {
          console.log('First SW activation - showing welcome');
        }
      });

      // Listen for controlling SW
      this.wb.addEventListener('controlling', (event) => {
        console.log('Service Worker now controlling page');
        // Reload page to use new SW
        window.location.reload();
      });

      // Register SW
      this.registration = await this.wb.register();
      console.log('✅ Service Worker registered successfully');

      // Check for updates periodically (every 1 hour)
      setInterval(() => {
        this.registration.update();
      }, 60 * 60 * 1000);

      return true;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Show update notification UI
   */
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.id = 'sw-update-notification';
    notification.className = 'sw-update-notification';
    notification.innerHTML = `
      <div class="sw-update-content">
        <span class="sw-update-icon">🔄</span>
        <span class="sw-update-text">Update tersedia! Reload untuk update aplikasi.</span>
        <button class="sw-update-btn" id="sw-update-reload">Reload</button>
        <button class="sw-update-dismiss" id="sw-update-dismiss">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Add styles if not exist
    if (!document.getElementById('sw-update-styles')) {
      const styles = document.createElement('style');
      styles.id = 'sw-update-styles';
      styles.textContent = `
        .sw-update-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999999;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 16px 20px;
          max-width: 400px;
          animation: slideInRight 0.3s ease-out;
        }
        .sw-update-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sw-update-icon {
          font-size: 24px;
        }
        .sw-update-text {
          flex: 1;
          font-size: 14px;
          color: #333;
        }
        .sw-update-btn {
          background: #E4540C;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        }
        .sw-update-btn:hover {
          background: #c74808;
        }
        .sw-update-dismiss {
          background: transparent;
          border: none;
          font-size: 20px;
          color: #999;
          cursor: pointer;
          padding: 0 4px;
        }
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    // Handle reload button
    document.getElementById('sw-update-reload').addEventListener('click', () => {
      this.skipWaiting();
    });

    // Handle dismiss button
    document.getElementById('sw-update-dismiss').addEventListener('click', () => {
      notification.remove();
    });
  }

  /**
   * Skip waiting and activate new SW
   */
  skipWaiting() {
    if (this.wb) {
      this.wb.addEventListener('controlling', () => {
        window.location.reload();
      });
      this.wb.messageSkipWaiting();
    }
  }

  /**
   * Unregister Service Worker (for testing)
   */
  async unregister() {
    if (this.registration) {
      await this.registration.unregister();
      console.log('Service Worker unregistered');
    }
  }
}

// Export singleton instance
export const swManager = new ServiceWorkerManager();

// Auto-register on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    swManager.register();
  });
} else {
  swManager.register();
}
