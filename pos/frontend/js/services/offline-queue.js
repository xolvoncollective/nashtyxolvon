/**
 * Offline Queue Service
 * Manages pending operations when offline and their lifecycle
 */

export class OfflineQueue {
  constructor(db, encryptionService) {
    this.db = db;
    this.encryption = encryptionService;
  }

  /**
   * Add order to offline queue
   */
  async enqueue(userId, outletId, order) {
    // Encrypt sensitive fields
    const encryptedOrder = await this.encryption.encryptOrder(userId, order);

    const queueItem = {
      timestamp: Date.now(),
      status: 'pending',
      orderType: 'order',
      data: JSON.stringify(encryptedOrder),
      retryCount: 0,
      lastError: null,
      userId,
      outletId
    };

    const tx = this.db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const localId = await store.add(queueItem);
    await tx.done;

    return localId;
  }

  /**
   * Enqueue favorite change
   */
  async enqueueFavorite(userId, outletId, favoriteData) {
    const queueItem = {
      timestamp: Date.now(),
      status: 'pending',
      orderType: 'favorite',
      data: JSON.stringify(favoriteData),
      retryCount: 0,
      lastError: null,
      userId,
      outletId
    };

    const tx = this.db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const localId = await store.add(queueItem);
    await tx.done;

    return localId;
  }

  /**
   * Get all pending items
   */
  async getPending() {
    const tx = this.db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');
    const index = store.index('status');
    
    const items = await index.getAll('pending');
    await tx.done;

    // Sort by timestamp (oldest first)
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get pending count
   */
  async getPendingCount() {
    const tx = this.db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');
    const index = store.index('status');
    
    const count = await index.count('pending');
    await tx.done;

    return count;
  }

  /**
   * Mark item as synced
   */
  async markSynced(localId) {
    const tx = this.db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    
    const item = await store.get(localId);
    if (item) {
      item.status = 'synced';
      await store.put(item);
    }
    
    await tx.done;
  }

  /**
   * Mark item as failed
   */
  async markFailed(localId, error) {
    const tx = this.db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    
    const item = await store.get(localId);
    if (item) {
      item.status = 'failed';
      item.lastError = error.message || String(error);
      item.retryCount += 1;
      await store.put(item);
    }
    
    await tx.done;
  }

  /**
   * Delete synced items older than 7 days
   */
  async cleanupSynced() {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const tx = this.db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const index = store.index('timestamp');
    
    const oldItems = await index.getAll(IDBKeyRange.upperBound(cutoffTime));
    
    for (const item of oldItems) {
      if (item.status === 'synced') {
        await store.delete(item.localId);
      }
    }
    
    await tx.done;
  }

  /**
   * Get failed items
   */
  async getFailed() {
    const tx = this.db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');
    const index = store.index('status');
    
    const items = await index.getAll('failed');
    await tx.done;

    return items;
  }

  /**
   * Retry failed item
   */
  async retryFailed(localId) {
    const tx = this.db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    
    const item = await store.get(localId);
    if (item && item.status === 'failed') {
      item.status = 'pending';
      item.lastError = null;
      await store.put(item);
    }
    
    await tx.done;
  }
}
