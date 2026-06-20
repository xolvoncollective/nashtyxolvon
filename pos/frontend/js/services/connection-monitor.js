/**
 * Connection Monitor Service
 * Detects and reports network connectivity status
 */

export class ConnectionMonitor {
  constructor(offlineQueue) {
    this.offlineQueue = offlineQueue;
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.checkInterval = null;
    this.indicator = null;
    this.badge = null;
    this.modal = null;
  }

  /**
   * Initialize connection monitor
   */
  async init() {
    // Listen to online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Create UI elements
    this.createIndicator();
    this.createModal();

    // Update initial state
    await this.updateUI();
  }

  /**
   * Create connection status indicator
   */
  createIndicator() {
    const nav = document.querySelector('.pos-header') || document.querySelector('nav');
    if (!nav) return;

    const indicatorHTML = `
      <div id="connection-indicator" class="connection-indicator">
        <span class="indicator-icon"></span>
        <span class="indicator-text"></span>
        <span id="pending-badge" class="pending-badge"></span>
      </div>
    `;

    nav.insertAdjacentHTML('beforeend', indicatorHTML);
    this.indicator = document.getElementById('connection-indicator');
    this.badge = document.getElementById('pending-badge');

    // Click to open modal
    this.indicator.addEventListener('click', () => this.openModal());
  }

  /**
   * Create sync status modal
   */
  createModal() {
    const modalHTML = `
      <div id="sync-status-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Sync Status</h2>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="connection-status">
              <span class="status-label">Connection:</span>
              <span id="modal-connection-status"></span>
            </div>
            <div class="pending-orders">
              <h3>Pending Orders (<span id="pending-count">0</span>)</h3>
              <ul id="pending-orders-list"></ul>
            </div>
            <div class="failed-orders">
              <h3>Failed Orders (<span id="failed-count">0</span>)</h3>
              <ul id="failed-orders-list"></ul>
            </div>
          </div>
          <div class="modal-footer">
            <button id="retry-sync-btn" class="btn-primary">Retry Sync</button>
            <button class="close-modal btn-secondary">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('sync-status-modal');

    // Close modal handlers
    this.modal.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    // Retry sync handler
    document.getElementById('retry-sync-btn').addEventListener('click', () => {
      window.syncManager?.syncNow();
      this.closeModal();
    });
  }

  /**
   * Handle online event
   */
  async handleOnline() {
    this.isOnline = true;
    console.log('Connection restored');
    
    // Stop periodic checks
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    await this.updateUI();

    // Notify sync manager
    if (window.syncManager) {
      window.syncManager.syncNow();
    }

    // Show notification
    this.showNotification('Connection restored. Syncing pending orders...', 'success');
  }

  /**
   * Handle offline event
   */
  async handleOffline() {
    this.isOnline = false;
    console.log('Connection lost');
    
    await this.updateUI();

    // Start periodic connectivity check (every 10 seconds)
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 10000);

    // Show notification
    this.showNotification('You are offline. Orders will be queued locally.', 'warning');
  }

  /**
   * Check connectivity (ping server)
   */
  async checkConnectivity() {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok && !this.isOnline) {
        // Connection restored
        this.handleOnline();
      }
    } catch (error) {
      // Still offline
    }
  }

  /**
   * Update UI based on connection status
   */
  async updateUI() {
    if (!this.indicator) return;

    const pendingCount = await this.offlineQueue.getPendingCount();

    if (this.isOnline) {
      this.indicator.classList.remove('offline');
      this.indicator.classList.add('online');
      this.indicator.querySelector('.indicator-text').textContent = 'Online';
      
      if (pendingCount > 0) {
        this.badge.textContent = pendingCount;
        this.badge.style.display = 'inline-block';
        this.badge.classList.add('syncing');
      } else {
        this.badge.style.display = 'none';
      }
    } else {
      this.indicator.classList.remove('online');
      this.indicator.classList.add('offline');
      this.indicator.querySelector('.indicator-text').textContent = 'Offline';
      
      if (pendingCount > 0) {
        this.badge.textContent = pendingCount;
        this.badge.style.display = 'inline-block';
        this.badge.classList.remove('syncing');
      } else {
        this.badge.style.display = 'none';
      }
    }
  }

  /**
   * Open sync status modal
   */
  async openModal() {
    const pending = await this.offlineQueue.getPending();
    const failed = await this.offlineQueue.getFailed();

    // Update connection status
    const statusEl = document.getElementById('modal-connection-status');
    statusEl.textContent = this.isOnline ? 'Online' : 'Offline';
    statusEl.className = this.isOnline ? 'status-online' : 'status-offline';

    // Update pending count
    document.getElementById('pending-count').textContent = pending.length;

    // Update pending orders list
    const pendingList = document.getElementById('pending-orders-list');
    pendingList.innerHTML = pending.length === 0 
      ? '<li class="empty">No pending orders</li>'
      : pending.map(item => {
          const data = JSON.parse(item.data);
          const timestamp = new Date(item.timestamp).toLocaleString();
          return `
            <li>
              <div class="order-info">
                <span class="order-type">${item.orderType}</span>
                <span class="order-time">${timestamp}</span>
              </div>
            </li>
          `;
        }).join('');

    // Update failed count
    document.getElementById('failed-count').textContent = failed.length;

    // Update failed orders list
    const failedList = document.getElementById('failed-orders-list');
    failedList.innerHTML = failed.length === 0
      ? '<li class="empty">No failed orders</li>'
      : failed.map(item => {
          const timestamp = new Date(item.timestamp).toLocaleString();
          return `
            <li>
              <div class="order-info">
                <span class="order-type">${item.orderType}</span>
                <span class="order-time">${timestamp}</span>
                <span class="order-error">${item.lastError}</span>
                <span class="retry-count">Retries: ${item.retryCount}</span>
              </div>
            </li>
          `;
        }).join('');

    this.modal.style.display = 'flex';
  }

  /**
   * Close modal
   */
  closeModal() {
    this.modal.style.display = 'none';
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Add connection status listener
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      pendingCount: this.offlineQueue.getPendingCount()
    };
  }
}
