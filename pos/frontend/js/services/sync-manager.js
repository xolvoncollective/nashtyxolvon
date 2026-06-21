/**
 * NASHTY OS - Sync Manager
 * Processes offline queue when connectivity restored
 */

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.maxRetries = 3;
    this.syncResults = { success: 0, failed: 0 };
  }

  /**
   * Initialize sync manager
   */
  init() {
    // Listen for online events
    window.addEventListener('online', () => {
      setTimeout(() => this.triggerSync(), 1000); // Wait 1s after online
    });
    
    console.log('✅ SyncManager initialized');
  }

  /**
   * Trigger sync process
   */
  async triggerSync() {
    if (this.isSyncing) {
      console.log('⏭️ Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('📵 Offline - sync deferred');
      return;
    }

    this.isSyncing = true;
    this.syncResults = { success: 0, failed: 0 };
    const startTime = Date.now();

    try {
      console.log('🔄 Starting sync...');
      
      const pending = await window.OfflineQueue.getPending();
      
      if (pending.length === 0) {
        console.log('✅ No pending items to sync');
        this.isSyncing = false;
        return;
      }

      console.log(`📦 Syncing ${pending.length} pending items...`);
      
      // Show progress notification
      this.showSyncProgress(pending.length);

      // Process items in chronological order (oldest first)
      for (const item of pending) {
        await this.syncItem(item);
        this.updateSyncProgress();
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Sync completed in ${duration}ms - Success: ${this.syncResults.success}, Failed: ${this.syncResults.failed}`);
      
      // Show results notification
      this.showSyncResults();
      
      // Cleanup old synced items
      await window.OfflineQueue.cleanup();

    } catch (error) {
      console.error('❌ Sync process failed:', error);
    } finally {
      this.isSyncing = false;
      this.hideSyncProgress();
    }
  }

  /**
   * Sync individual item with retry logic
   */
  async syncItem(item) {
    const userId = item.userId;
    const maxRetries = this.maxRetries;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Decrypt order data
        const decryptedOrder = await window.EncryptionService.decryptOrder(userId, item.data);
        
        // Send to server
        const response = await this.sendToServer(decryptedOrder);
        
        if (response.success) {
          // Mark as synced
          await window.OfflineQueue.markSynced(item.localId, response.orderId);
          this.syncResults.success++;
          console.log(`✅ Synced item ${item.localId} (attempt ${attempt})`);
          return;
        } else {
          throw new Error(response.error || 'Unknown error');
        }
      } catch (error) {
        console.warn(`⚠️ Sync attempt ${attempt}/${maxRetries} failed for item ${item.localId}:`, error.message);
        
        if (attempt === maxRetries) {
          // Final failure - mark as failed
          await window.OfflineQueue.markFailed(item.localId, error.message);
          this.syncResults.failed++;
          console.error(`❌ Item ${item.localId} failed after ${maxRetries} attempts`);
        } else {
          // Wait before retry (exponential backoff)
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }
  }

  /**
   * Send order to server
   */
  async sendToServer(order) {
    const token = localStorage.getItem('nashty_token') || sessionStorage.getItem('token');
    
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(order)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Show sync progress notification
   */
  showSyncProgress(total) {
    let notification = document.getElementById('sync-progress-notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'sync-progress-notification';
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        min-width: 280px;
      `;
      document.body.appendChild(notification);
    }

    notification.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="spinner" style="width:20px;height:20px;border:3px solid #f3f3f3;border-top:3px solid #4CAF50;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <div>
          <div style="font-size:14px;font-weight:600;color:#333;margin-bottom:4px;">Menyinkronkan...</div>
          <div style="font-size:12px;color:#666;">
            <span id="sync-progress-text">0 dari ${total}</span>
          </div>
        </div>
      </div>
    `;

    // Add spinner animation
    if (!document.getElementById('sync-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'sync-spinner-style';
      style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    notification.dataset.total = total;
    notification.dataset.current = 0;
  }

  /**
   * Update sync progress
   */
  updateSyncProgress() {
    const notification = document.getElementById('sync-progress-notification');
    if (!notification) return;

    const current = parseInt(notification.dataset.current || 0) + 1;
    const total = parseInt(notification.dataset.total || 0);
    
    notification.dataset.current = current;
    
    const progressText = document.getElementById('sync-progress-text');
    if (progressText) {
      progressText.textContent = `${current} dari ${total}`;
    }
  }

  /**
   * Hide sync progress notification
   */
  hideSyncProgress() {
    const notification = document.getElementById('sync-progress-notification');
    if (notification) {
      setTimeout(() => notification.remove(), 500);
    }
  }

  /**
   * Show sync results notification
   */
  showSyncResults() {
    const { success, failed } = this.syncResults;
    
    if (typeof window.toast === 'function') {
      if (failed === 0) {
        window.toast(`✅ ${success} order berhasil disinkronkan`, 'success');
      } else {
        window.toast(`⚠️ ${success} berhasil, ${failed} gagal disinkronkan`, 'warning');
      }
    } else {
      // Fallback notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${failed === 0 ? '#4CAF50' : '#ff9800'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 14px;
        font-weight: 600;
      `;
      notification.textContent = failed === 0 
        ? `✅ ${success} order berhasil disinkronkan`
        : `⚠️ ${success} berhasil, ${failed} gagal`;
      
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      lastResults: this.syncResults
    };
  }
}

// Initialize and export
window.SyncManager = new SyncManager();
window.SyncManager.init();

console.log('✅ SyncManager module loaded');
