/**
 * NASHTY OS - Connection Monitor
 * Displays connection status and manages sync notifications
 */

class ConnectionMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.lastCheck = Date.now();
    this.checkInterval = 10000; // 10 seconds
    
    this.init();
  }

  init() {
    // Listen to browser events
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());
    
    // Periodic check when offline
    setInterval(() => {
      if (!this.isOnline) {
        this.checkConnectivity();
      }
    }, this.checkInterval);
    
    // Initial UI update
    this.updateIndicator();
    
    console.log('✅ ConnectionMonitor initialized');
  }

  onOnline() {
    console.log('🌐 Connection restored');
    this.isOnline = true;
    this.updateIndicator();
    this.showNotification('✅ Connected', 'Connection restored', 'success');
    
    // Trigger sync
    if (window.OfflineSyncManager) {
      setTimeout(() => window.OfflineSyncManager.syncOfflineOrders(), 1000);
    }
  }

  onOffline() {
    console.log('🔌 Connection lost');
    this.isOnline = false;
    this.updateIndicator();
    this.showNotification('⚠️ Offline', 'Working in offline mode', 'warning');
  }

  async checkConnectivity() {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok && !this.isOnline) {
        this.onOnline();
      }
    } catch (error) {
      // Still offline
    }
  }

  async updateIndicator() {
    const chip = document.getElementById('online-status-chip');
    const dot = document.getElementById('online-status-dot');
    const text = document.getElementById('online-status-text');
    
    if (!chip || !dot || !text) {
      // Create indicator if doesn't exist
      this.createIndicator();
      return;
    }
    
    const pendingCount = await this.getPendingCount();
    
    if (this.isOnline) {
      if (pendingCount > 0) {
        chip.className = 'online-chip syncing';
        dot.className = 'ondot syncing';
        text.textContent = `Syncing (${pendingCount})`;
      } else {
        chip.className = 'online-chip';
        dot.className = 'ondot';
        text.textContent = 'Online';
      }
    } else {
      chip.className = 'online-chip offline';
      dot.className = 'ondot offline';
      text.textContent = `Offline${pendingCount > 0 ? ` (${pendingCount})` : ''}`;
    }
  }

  createIndicator() {
    const topbar = document.querySelector('.topbar') || document.querySelector('header');
    if (!topbar) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'online-status-chip';
    indicator.className = 'online-chip';
    indicator.style.cssText = 'display:flex; align-items:center; gap:8px; padding:6px 12px; border-radius:20px; background:var(--sf2); cursor:pointer; transition:all 0.2s;';
    indicator.onclick = () => this.showModal();
    
    indicator.innerHTML = `
      <span id="online-status-dot" class="ondot" style="width:8px; height:8px; border-radius:50%; background:#10B981;"></span>
      <span id="online-status-text" style="font-size:13px; font-weight:500; color:var(--txt2);">Online</span>
    `;
    
    topbar.appendChild(indicator);
  }

  async showModal() {
    const pendingOrders = await this.getPendingOrders();
    const isOnline = this.isOnline;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; align-items:center; justify-content:center;';
    
    modal.innerHTML = `
      <div class="modal-content" style="background:var(--sf); padding:30px; border-radius:16px; max-width:500px; width:90%; max-height:80vh; overflow-y:auto; box-shadow:var(--sh2);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
          <h2 style="margin:0; font-size:24px; color:var(--txt);">
            ${isOnline ? '🌐 Online' : '🔌 Offline Mode'}
          </h2>
          <button onclick="this.closest('.modal').remove()" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--txt2);">×</button>
        </div>
        
        <div style="background:var(--sf2); padding:15px; border-radius:12px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:var(--txt2);">Status:</span>
            <strong style="color:${isOnline ? 'var(--gn)' : 'var(--ye)'};">${isOnline ? 'Connected' : 'Disconnected'}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--txt2);">Pending Orders:</span>
            <strong style="color:var(--txt);">${pendingOrders.length}</strong>
          </div>
        </div>
        
        ${pendingOrders.length > 0 ? `
          <h3 style="font-size:16px; margin:0 0 15px 0; color:var(--txt2);">Pending Orders:</h3>
          <div style="max-height:300px; overflow-y:auto;">
            ${pendingOrders.map((order, i) => `
              <div style="background:var(--sf2); padding:12px; border-radius:8px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-weight:600; color:var(--txt);">Order #${i + 1}</div>
                    <div style="font-size:12px; color:var(--txt3);">
                      ${new Date(order.timestamp).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div style="font-size:12px; padding:4px 8px; border-radius:6px; background:var(--yeL); color:var(--ye);">
                    ${order.retryCount > 0 ? `Retry ${order.retryCount}/3` : 'Pending'}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="text-align:center; padding:40px 20px; color:var(--txt3);">
            <div style="font-size:48px; margin-bottom:10px;">✅</div>
            <p style="margin:0;">No pending orders</p>
          </div>
        `}
        
        ${isOnline && pendingOrders.length > 0 ? `
          <button onclick="window.ConnectionMonitor.forceSyncNow(); this.closest('.modal').remove();" style="width:100%; margin-top:20px; padding:12px; background:var(--or); color:white; border:none; border-radius:8px; cursor:pointer; font-size:16px; font-weight:600;">
            🔄 Sync Now
          </button>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  async forceSyncNow() {
    if (window.OfflineSyncManager) {
      this.showNotification('🔄 Syncing...', 'Syncing offline orders', 'info');
      await window.OfflineSyncManager.syncOfflineOrders();
    }
  }

  async getPendingCount() {
    if (window.OfflineSyncManager) {
      return await window.OfflineSyncManager.getPendingCount().catch(() => 0);
    }
    return 0;
  }

  async getPendingOrders() {
    if (window.OfflineSyncManager) {
      return await window.OfflineSyncManager.getQueuedOrders().catch(() => []);
    }
    return [];
  }

  showNotification(title, message, type = 'info') {
    // Use toast if available
    if (typeof window.showToast === 'function') {
      window.showToast(`${title}: ${message}`, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
  }
}

window.ConnectionMonitor = new ConnectionMonitor();
console.log('✅ ConnectionMonitor loaded');
