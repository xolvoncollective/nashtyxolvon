/**
 * NASHTY OS - Enhanced Offline Sync Manager
 * Integrates encryption and new IndexedDB schema
 */

class OfflineSyncManager {
  constructor() {
    this.syncInProgress = false;
    
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
    
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncOfflineOrders();
      }
    }, 30000);
    
    console.log('✅ OfflineSyncManager initialized');
  }

  async queueOrder(orderData) {
    try {
      const userId = sessionStorage.getItem('userId');
      const outletId = sessionStorage.getItem('currentOutletId');
      
      // Generate offline ID
      const tempId = 'off_' + crypto.randomUUID();
      const timestamp = Date.now();
      
      // Encrypt sensitive fields if encryption service available
      let dataToStore = orderData;
      if (window.EncryptionService && userId) {
        dataToStore = await window.EncryptionService.encryptOrder(userId, orderData);
      }

      const queueItem = {
        timestamp,
        status: 'pending',
        orderType: 'order',
        data: JSON.stringify(dataToStore),
        retryCount: 0,
        lastError: null,
        userId,
        outletId
      };

      const localId = await window.DatabaseSchema.addToQueue(queueItem);
      console.log(`✅ Order queued offline (ID: ${localId})`);
      
      await this.updateUIStatus();
      return { localId, tempId };
    } catch (error) {
      console.error('Failed to queue order:', error);
      throw error;
    }
  }

  async getQueuedOrders() {
    return await window.DatabaseSchema.getPendingQueue();
  }

  async getPendingCount() {
    const pending = await this.getQueuedOrders();
    return pending.length;
  }

  async removeOrder(localId) {
    const db = await window.DatabaseSchema.getDatabase();
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    await store.delete(localId);
    await this.updateUIStatus();
    console.log(`🗑️ Order ${localId} removed from queue`);
  }

  async incrementRetry(localId) {
    const db = await window.DatabaseSchema.getDatabase();
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const item = await store.get(localId);
    if (item) {
      item.retryCount += 1;
      await store.put(item);
    }
  }

  handleNetworkChange(isOnline) {
    console.log(`🌐 Network: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    this.updateUIStatus();
    if (isOnline) {
      setTimeout(() => this.syncOfflineOrders(), 2000);
    }
  }

  async syncOfflineOrders() {
    if (this.syncInProgress || !navigator.onLine) return;
    
    const queued = await this.getQueuedOrders();
    if (queued.length === 0) return;
    
    this.syncInProgress = true;
    console.log(`🔄 Syncing ${queued.length} offline orders...`);
    
    let successCount = 0;
    let failCount = 0;

    for (const item of queued) {
      try {
        let orderData = JSON.parse(item.data);
        
        // Decrypt if encrypted
        if (orderData._encrypted && window.EncryptionService && item.userId) {
          orderData = await window.EncryptionService.decryptOrder(item.userId, orderData);
        }

        // Remove temp fields before sending
        delete orderData.id;
        delete orderData.order_number;

        // Send to server
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${window.API_BASE || 'http://localhost:3099'}/api/orders`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });

        if (response.ok) {
          await this.removeOrder(item.localId);
          successCount++;
          console.log(`✅ Order ${item.localId} synced successfully`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Failed to sync order ${item.localId}:`, error);
        await this.incrementRetry(item.localId);
        failCount++;
        
        if (item.retryCount >= 3) {
          console.error(`⚠️ Order ${item.localId} failed after 3 retries`);
        }
      }
    }

    this.syncInProgress = false;
    await this.updateUIStatus();
    
    if (successCount > 0) {
      this.showToast(`✅ ${successCount} order${successCount > 1 ? 's' : ''} synced`);
    }
    
    if (failCount > 0) {
      this.showToast(`⚠️ ${failCount} order${failCount > 1 ? 's' : ''} failed to sync`, 'error');
    }
  }

  async updateUIStatus() {
    const chip = document.getElementById('online-status-chip');
    const dot = document.getElementById('online-status-dot');
    const text = document.getElementById('online-status-text');
    
    if (!chip || !dot || !text) return;
    
    const isOnline = navigator.onLine;
    const pendingCount = await this.getPendingCount().catch(() => 0);
    
    if (isOnline) {
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

  showToast(message, type = 'success') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {
      console.log(`[Toast] ${message}`);
    }
  }
}

window.OfflineSyncManager = new OfflineSyncManager();
console.log('✅ OfflineSyncManager loaded');
