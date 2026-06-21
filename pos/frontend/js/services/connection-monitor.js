/**
 * NASHTY OS - Connection Monitor
 * Detects network status and displays indicators
 */

class ConnectionMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.checkInterval = null;
    this.indicator = null;
    this.listeners = [];
  }

  /**
   * Initialize connection monitoring
   */
  init() {
    // Listen to online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Create UI indicator
    this.createIndicator();
    
    // Update initial state
    this.updateIndicator();
    
    // Start periodic check if offline
    if (!this.isOnline) {
      this.startPeriodicCheck();
    }
    
    console.log('✅ ConnectionMonitor initialized');
  }

  /**
   * Handle online event
   */
  handleOnline() {
    console.log('🌐 Connection restored');
    this.isOnline = true;
    this.stopPeriodicCheck();
    this.updateIndicator();
    this.notifyListeners('online');
    
    // Trigger sync
    if (window.SyncManager) {
      window.SyncManager.triggerSync();
    }
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('📵 Connection lost');
    this.isOnline = false;
    this.updateIndicator();
    this.startPeriodicCheck();
    this.notifyListeners('offline');
  }

  /**
   * Start periodic connectivity check (every 10 seconds)
   */
  startPeriodicCheck() {
    if (this.checkInterval) return;
    
    this.checkInterval = setInterval(async () => {
      const online = await this.checkConnectivity();
      if (online && !this.isOnline) {
        // Manually trigger online event
        this.handleOnline();
      }
    }, 10000); // 10 seconds
    
    console.log('⏱️ Periodic connectivity check started');
  }

  /**
   * Stop periodic check
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏹️ Periodic connectivity check stopped');
    }
  }

  /**
   * Check actual connectivity by pinging server
   */
  async checkConnectivity() {
    try {
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache',
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create connection status indicator in navigation bar
   */
  createIndicator() {
    const nav = document.querySelector('.tnav') || document.querySelector('nav');
    if (!nav) {
      console.warn('Navigation bar not found, indicator not created');
      return;
    }
    
    this.indicator = document.createElement('div');
    this.indicator.id = 'connection-indicator';
    this.indicator.style.cssText = `
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    this.indicator.onclick = () => this.showSyncModal();
    nav.appendChild(this.indicator);
  }

  /**
   * Update indicator appearance based on connection status
   */
  async updateIndicator() {
    if (!this.indicator) return;
    
    const pendingCount = window.OfflineQueue ? await window.OfflineQueue.getPendingCount() : 0;
    
    if (this.isOnline) {
      this.indicator.style.background = '#e8f5e9';
      this.indicator.style.color = '#2e7d32';
      this.indicator.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <span>Online</span>
      `;
    } else {
      this.indicator.style.background = '#ffebee';
      this.indicator.style.color = '#c62828';
      this.indicator.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <span>Offline</span>
        ${pendingCount > 0 ? `<span style="background:#c62828;color:white;padding:2px 6px;border-radius:10px;font-size:10px;margin-left:4px;">${pendingCount}</span>` : ''}
      `;
    }
  }

  /**
   * Show sync status modal
   */
  async showSyncModal() {
    const modal = document.getElementById('sync-status-modal') || this.createSyncModal();
    modal.style.display = 'flex';
    await this.updateSyncModalContent();
  }

  /**
   * Create sync status modal
   */
  createSyncModal() {
    const modal = document.createElement('div');
    modal.id = 'sync-status-modal';
    modal.className = 'ov';
    modal.style.cssText = 'display:none;';
    
    modal.innerHTML = `
      <div class="mo" style="width:500px;">
        <div class="mo-h">
          <div class="mo-t">🔄 Status Sinkronisasi</div>
          <div class="mo-x" onclick="document.getElementById('sync-status-modal').style.display='none'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
        </div>
        <div class="mo-b" id="sync-modal-content">
          <p style="text-align:center;color:var(--txt3);padding:20px;">Memuat status...</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }

  /**
   * Update sync modal content
   */
  async updateSyncModalContent() {
    const container = document.getElementById('sync-modal-content');
    if (!container) return;
    
    const pendingCount = window.OfflineQueue ? await window.OfflineQueue.getPendingCount() : 0;
    const pending = window.OfflineQueue ? await window.OfflineQueue.getPending() : [];
    
    const statusIcon = this.isOnline ? '🌐' : '📵';
    const statusColor = this.isOnline ? '#4CAF50' : '#f44336';
    const statusText = this.isOnline ? 'Terhubung' : 'Tidak Terhubung';
    
    container.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:48px;margin-bottom:10px;">${statusIcon}</div>
        <div style="font-size:18px;font-weight:700;color:${statusColor};margin-bottom:5px;">${statusText}</div>
        <div style="font-size:13px;color:var(--txt3);">
          ${this.isOnline ? 'Semua data akan otomatis tersinkron' : 'Order akan disimpan dan tersinkron saat online'}
        </div>
      </div>
      
      <div style="background:var(--sf2);padding:15px;border-radius:8px;margin-bottom:15px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:var(--txt3);font-size:13px;">Antrian Pending:</span>
          <span style="font-size:16px;font-weight:700;color:${pendingCount > 0 ? '#ff9800' : '#4CAF50'};">${pendingCount}</span>
        </div>
        ${pendingCount > 0 ? `
          <button onclick="window.OfflineQueue.showQueue()" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--brd2);background:white;color:var(--txt);font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;">
            📦 Lihat Detail Antrian
          </button>
        ` : ''}
      </div>
      
      ${pending.length > 0 ? `
        <div style="max-height:200px;overflow-y:auto;">
          <div style="font-size:12px;font-weight:600;color:var(--txt2);margin-bottom:8px;">Order Pending Terbaru:</div>
          ${pending.slice(0, 5).map(item => `
            <div style="background:var(--sf2);padding:8px;border-radius:6px;margin-bottom:6px;font-size:12px;">
              <div style="color:var(--txt);">Order #${item.localId}</div>
              <div style="color:var(--txt3);font-size:11px;">${new Date(item.timestamp).toLocaleString('id-ID')}</div>
            </div>
          `).join('')}
          ${pending.length > 5 ? `<div style="text-align:center;color:var(--txt3);font-size:11px;margin-top:8px;">+${pending.length - 5} order lagi</div>` : ''}
        </div>
      ` : ''}
      
      ${this.isOnline && pendingCount > 0 ? `
        <button onclick="window.SyncManager?.triggerSync()" style="width:100%;padding:12px;border-radius:8px;border:none;background:var(--or);color:white;font-size:14px;font-weight:700;cursor:pointer;margin-top:15px;">
          🔄 Sinkronkan Sekarang
        </button>
      ` : ''}
    `;
  }

  /**
   * Add listener for connection changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      lastCheck: Date.now()
    };
  }
}

// Initialize and export
window.ConnectionMonitor = new ConnectionMonitor();

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ConnectionMonitor.init();
  });
} else {
  window.ConnectionMonitor.init();
}

// Expose to window
if (typeof window !== 'undefined') {
  window.ConnectionMonitor = ConnectionMonitor;
}

// Update indicator when queue changes
window.addEventListener('offlineQueueUpdate', () => {
  if (window.ConnectionMonitor && window.ConnectionMonitor.updateIndicator) {
    window.ConnectionMonitor.updateIndicator();
  }
});

console.log('✅ ConnectionMonitor module loaded');
