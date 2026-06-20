/**
 * Sync Manager Service
 * Processes offline queue when connectivity restored
 */

export class SyncManager {
  constructor(db, offlineQueue, encryptionService, apiClient, connectionMonitor) {
    this.db = db;
    this.offlineQueue = offlineQueue;
    this.encryption = encryptionService;
    this.apiClient = apiClient;
    this.connectionMonitor = connectionMonitor;
    this.isSyncing = false;
    this.maxRetries = 3;
  }

  /**
   * Initialize sync manager
   */
  init() {
    // Listen for connection restore
    this.connectionMonitor.addListener(async (status) => {
      if (status.isOnline && !this.isSyncing) {
        await this.syncNow();
      }
    });

    // Cleanup old synced items daily
    setInterval(() => {
      this.offlineQueue.cleanupSynced();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Trigger sync immediately
   */
  async syncNow() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('Cannot sync while offline');
      return;
    }

    this.isSyncing = true;

    try {
      const pending = await this.offlineQueue.getPending();
      
      if (pending.length === 0) {
        console.log('No pending items to sync');
        return;
      }

      console.log(`Starting sync of ${pending.length} items...`);

      let successCount = 0;
      let failCount = 0;

      // Process in chronological order (oldest first)
      for (const item of pending) {
        try {
          await this.syncItem(item);
          successCount++;
        } catch (error) {
          console.error('Failed to sync item:', error);
          
          if (item.retryCount >= this.maxRetries) {
            await this.offlineQueue.markFailed(item.localId, error);
            failCount++;
          } else {
            // Will retry later
            await this.offlineQueue.markFailed(item.localId, error);
          }
        }
      }

      // Show notification
      this.showSyncResults(successCount, failCount);

      // Update UI
      await this.connectionMonitor.updateUI();

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync single item
   */
  async syncItem(item) {
    const data = JSON.parse(item.data);

    if (item.orderType === 'order') {
      return await this.syncOrder(item, data);
    } else if (item.orderType === 'favorite') {
      return await this.syncFavorite(item, data);
    } else {
      throw new Error(`Unknown order type: ${item.orderType}`);
    }
  }

  /**
   * Sync order to server
   */
  async syncOrder(item, encryptedOrder) {
    // Decrypt order
    const order = await this.encryption.decryptOrder(item.userId, encryptedOrder);

    // Send to server
    try {
      const response = await this.apiClient.post('/orders', order);

      // Mark as synced
      await this.offlineQueue.markSynced(item.localId);

      return response;
    } catch (error) {
      // Check for conflict (409)
      if (error.response?.status === 409) {
        // Apply conflict resolution (last-write-wins)
        const serverOrder = error.response.data;
        
        if (order.timestamp > serverOrder.timestamp) {
          // Local order is newer, force update
          const response = await this.apiClient.put(`/orders/${serverOrder.id}`, order);
          await this.offlineQueue.markSynced(item.localId);
          return response;
        } else {
          // Server order is newer, discard local
          await this.offlineQueue.markSynced(item.localId);
          return serverOrder;
        }
      }

      throw error;
    }
  }

  /**
   * Sync favorite to server
   */
  async syncFavorite(item, favoriteData) {
    const { action, userId, productId, position } = favoriteData;

    try {
      if (action === 'add') {
        await this.apiClient.post('/favorites', { userId, productId, position });
      } else if (action === 'remove') {
        await this.apiClient.delete(`/favorites/${userId}/${productId}`);
      } else if (action === 'reorder') {
        await this.apiClient.put('/favorites/reorder', { userId, favorites: favoriteData.favorites });
      }

      await this.offlineQueue.markSynced(item.localId);
    } catch (error) {
      // Check if product was deleted
      if (error.response?.status === 404) {
        // Product deleted, mark as synced (discard)
        await this.offlineQueue.markSynced(item.localId);
        
        // Remove from local favorites
        const tx = this.db.transaction('favorites', 'readwrite');
        await tx.objectStore('favorites').delete([userId, productId]);
        await tx.done;

        console.log(`Removed invalid favorite: product ${productId} not found`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Show sync results notification
   */
  showSyncResults(successCount, failCount) {
    let message = '';
    let type = 'success';

    if (failCount === 0) {
      message = `Successfully synced ${successCount} items`;
      type = 'success';
    } else if (successCount === 0) {
      message = `Failed to sync ${failCount} items`;
      type = 'error';
    } else {
      message = `Synced ${successCount} items, ${failCount} failed`;
      type = 'warning';
    }

    this.connectionMonitor.showNotification(message, type);
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const pending = await this.offlineQueue.getPending();
    const failed = await this.offlineQueue.getFailed();

    return {
      isSyncing: this.isSyncing,
      pendingCount: pending.length,
      failedCount: failed.length,
      items: {
        pending,
        failed
      }
    };
  }
}
