/**
 * NASHTY OS - Offline Queue Manager
 * Manages pending operations when offline, with encryption support
 */

class OfflineQueue {
  constructor() {
    this.storeName = 'offline_queue';
    this.cleanupInterval = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  }

  /**
   * Enqueue an order with encryption for sensitive fields
   */
  async enqueue(order, userId) {
    try {
      // Encrypt sensitive fields before storing
      const encryptedOrder = await window.EncryptionService.encryptOrder(userId, order);
      
      const queueItem = {
        orderType: 'order',
        data: encryptedOrder,
        userId: userId,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString()
      };

      const db = await window.DatabaseSchema.getDatabase();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.add(queueItem);
        request.onsuccess = () => {
          console.log(`✅ Order enqueued (ID: ${request.result})`);
          this.notifyQueueUpdate();
          resolve(request.result);
        };
        request.onerror = () => {
          console.error('Failed to enqueue order:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Enqueue failed:', error);
      throw error;
    }
  }

  /**
   * Get all pending queue items sorted by timestamp (oldest first)
   */
  async getPending() {
    try {
      const db = await window.DatabaseSchema.getDatabase();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('status');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll('pending');
        request.onsuccess = () => {
          const items = request.result;
          // Sort by timestamp (oldest first)
          items.sort((a, b) => a.timestamp - b.timestamp);
          resolve(items);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get pending items:', error);
      return [];
    }
  }

  /**
   * Get count of pending items
   */
  async getPendingCount() {
    const pending = await this.getPending();
    return pending.length;
  }

  /**
   * Mark item as synced
   */
  async markSynced(localId, serverId = null) {
    try {
      const db = await window.DatabaseSchema.getDatabase();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const getRequest = store.get(localId);
        getRequest.onsuccess = () => {
          const item = getRequest.result;
          if (item) {
            item.status = 'synced';
            item.syncedAt = new Date().toISOString();
            item.serverId = serverId;
            
            const putRequest = store.put(item);
            putRequest.onsuccess = () => {
              console.log(`✅ Item ${localId} marked as synced`);
              this.notifyQueueUpdate();
              resolve();
            };
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            reject(new Error('Item not found'));
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error('Failed to mark as synced:', error);
      throw error;
    }
  }

  /**
   * Mark item as failed with retry count
   */
  async markFailed(localId, error) {
    try {
      const db = await window.DatabaseSchema.getDatabase();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const getRequest = store.get(localId);
        getRequest.onsuccess = () => {
          const item = getRequest.result;
          if (item) {
            item.status = 'failed';
            item.retryCount = (item.retryCount || 0) + 1;
            item.lastError = error;
            item.lastErrorAt = new Date().toISOString();
            
            const putRequest = store.put(item);
            putRequest.onsuccess = () => {
              console.warn(`⚠️ Item ${localId} marked as failed (retry ${item.retryCount})`);
              this.notifyQueueUpdate();
              resolve();
            };
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            reject(new Error('Item not found'));
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error('Failed to mark as failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup old synced items (older than 7 days)
   */
  async cleanup() {
    try {
      const db = await window.DatabaseSchema.getDatabase();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const index = store.index('status');
      
      return new Promise((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.only('synced'));
        let deletedCount = 0;
        const cutoffTime = Date.now() - this.cleanupInterval;
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const item = cursor.value;
            const syncedTime = new Date(item.syncedAt).getTime();
            
            if (syncedTime < cutoffTime) {
              cursor.delete();
              deletedCount++;
            }
            cursor.continue();
          } else {
            if (deletedCount > 0) {
              console.log(`🧹 Cleaned up ${deletedCount} old synced items`);
            }
            resolve(deletedCount);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Get all queue items for visualization
   */
  async getAll() {
    try {
      const db = await window.DatabaseSchema.getDatabase();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const items = request.result;
          items.sort((a, b) => b.timestamp - a.timestamp); // Newest first for display
          resolve(items);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get all items:', error);
      return [];
    }
  }

  /**
   * Delete a specific queue item
   */
  async delete(localId) {
    try {
      const db = await window.DatabaseSchema.getDatabase();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(localId);
        request.onsuccess = () => {
          console.log(`🗑️ Deleted queue item ${localId}`);
          this.notifyQueueUpdate();
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  }

  /**
   * Notify UI about queue updates
   */
  notifyQueueUpdate() {
    window.dispatchEvent(new CustomEvent('offlineQueueUpdate', {
      detail: { timestamp: Date.now() }
    }));
  }

  /**
   * Create queue visualization UI component
   */
  createQueueVisualization() {
    const container = document.createElement('div');
    container.id = 'offline-queue-modal';
    container.className = 'ov';
    container.style.cssText = 'display:none;';
    
    container.innerHTML = `
      <div class="mo" style="width:600px;max-height:80vh;overflow:auto;">
        <div class="mo-h">
          <div class="mo-t">📦 Antrian Offline</div>
          <div class="mo-x" onclick="document.getElementById('offline-queue-modal').style.display='none'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
        </div>
        <div class="mo-b" id="queue-list-container">
          <p style="text-align:center;color:var(--txt3);padding:40px 0;">Memuat antrian...</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    return container;
  }

  /**
   * Show queue visualization modal
   */
  async showQueue() {
    let modal = document.getElementById('offline-queue-modal');
    if (!modal) {
      modal = this.createQueueVisualization();
    }
    
    modal.style.display = 'flex';
    await this.refreshQueueDisplay();
  }

  /**
   * Refresh queue display
   */
  async refreshQueueDisplay() {
    const container = document.getElementById('queue-list-container');
    if (!container) return;
    
    const items = await this.getAll();
    
    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 0;">
          <div style="font-size:48px;margin-bottom:15px;">✅</div>
          <p style="color:var(--txt3);">Tidak ada item dalam antrian</p>
        </div>
      `;
      return;
    }
    
    const statusColors = {
      pending: '#ff9800',
      synced: '#4CAF50',
      failed: '#f44336'
    };
    
    const statusLabels = {
      pending: 'Menunggu',
      synced: 'Tersinkron',
      failed: 'Gagal'
    };
    
    container.innerHTML = `
      <div style="margin-bottom:15px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:var(--txt3);">Total: ${items.length} item</span>
        <button onclick="window.OfflineQueue.cleanup()" style="padding:6px 12px;border-radius:6px;border:1px solid var(--brd2);background:var(--sf2);color:var(--txt2);font-size:12px;cursor:pointer;">
          🧹 Bersihkan Tersinkron
        </button>
      </div>
      ${items.map(item => `
        <div style="background:var(--sf2);padding:12px;border-radius:8px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div>
              <span style="background:${statusColors[item.status]};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">
                ${statusLabels[item.status]}
              </span>
              ${item.retryCount > 0 ? `<span style="color:var(--txt3);font-size:11px;margin-left:6px;">Retry: ${item.retryCount}</span>` : ''}
            </div>
            <span style="font-size:11px;color:var(--txt3);">${new Date(item.timestamp).toLocaleString('id-ID')}</span>
          </div>
          <div style="font-size:12px;color:var(--txt2);">
            Order ID: ${item.localId} • User: ${item.userId}
          </div>
          ${item.lastError ? `<div style="font-size:11px;color:var(--rd);margin-top:4px;">Error: ${item.lastError}</div>` : ''}
        </div>
      `).join('')}
    `;
  }
}

// Initialize and export
window.OfflineQueue = new OfflineQueue();

// Auto-cleanup on load
window.OfflineQueue.cleanup();

// Refresh queue display when updated
window.addEventListener('offlineQueueUpdate', () => {
  if (document.getElementById('offline-queue-modal')?.style.display === 'flex') {
    window.OfflineQueue.refreshQueueDisplay();
  }
});

console.log('✅ OfflineQueue module loaded');
