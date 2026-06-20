/**
 * NASHTY OS - Offline Infrastructure Initialization
 * Initializes all offline-first components on app load
 */

(async function initializeOfflineInfrastructure() {
  console.log('═══════════════════════════════════════════════════');
  console.log('NASHTY POS - Initializing Offline Infrastructure');
  console.log('═══════════════════════════════════════════════════');

  try {
    // 1. Initialize Database Schema
    if (window.DBSchema) {
      console.log('1. Initializing IndexedDB Schema...');
      await window.DBSchema.init();
      console.log('✓ IndexedDB initialized with all stores');
    } else {
      console.error('✗ DBSchema not loaded');
    }

    // 2. Initialize Encryption Service  (will be set up on login)
    if (window.EncryptionService) {
      console.log('2. Encryption Service ready');
      console.log('✓ AES-256-GCM encryption available');
    } else {
      console.error('✗ EncryptionService not loaded');
    }

    // 3. Initialize Cache Manager
    if (window.CacheManager && window.DBSchema) {
      console.log('3. Initializing Cache Manager...');
      await window.CacheManager.init(window.DBSchema);
      console.log('✓ Cache Manager initialized');
      
      // Start periodic sync (5 minutes)
      await window.CacheManager.startSync();
      console.log('✓ Periodic sync started (every 5 minutes)');
    } else {
      console.error('✗ CacheManager not loaded');
    }

    // 4. Initialize Offline Sync Manager
    if (window.OfflineSyncManager) {
      console.log('4. Initializing Offline Sync Manager...');
      await window.OfflineSyncManager.init();
      console.log('✓ Offline Sync Manager initialized');
    } else {
      console.error('✗ OfflineSyncManager not loaded');
    }

    // 5. Register Service Worker (handled by sw-update-manager.js)
    if (window.SWUpdateManager) {
      console.log('5. Service Worker registration (handled by SWUpdateManager)');
      console.log('✓ SW Update Manager active');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('✓ Offline Infrastructure Initialized Successfully');
    console.log('═══════════════════════════════════════════════════');

    // Test encryption (optional, can be removed in production)
    if (window.EncryptionService && window.API?.session?.userId) {
      const testSessionToken = 'test-session-token-' + Date.now();
      const testPassed = await window.EncryptionService.test(
        window.API.session.userId,
        testSessionToken
      );
      if (testPassed) {
        console.log('✓ Encryption test passed');
      } else {
        console.warn('⚠ Encryption test failed');
      }
    }

  } catch (error) {
    console.error('═══════════════════════════════════════════════════');
    console.error('✗ Offline Infrastructure Initialization Failed');
    console.error(error);
    console.error('═══════════════════════════════════════════════════');
  }
})();

/**
 * Setup encryption keys when user logs in
 */
window.addEventListener('userLoggedIn', async (event) => {
  const { userId, sessionToken } = event.detail;
  
  if (window.EncryptionService && userId && sessionToken) {
    try {
      console.log('Setting up encryption keys for user:', userId);
      await window.EncryptionService.deriveKey(userId, sessionToken);
      console.log('✓ Encryption keys derived');
    } catch (error) {
      console.error('Failed to derive encryption keys:', error);
    }
  }
});

/**
 * Clear encryption keys when user logs out
 */
window.addEventListener('userLoggedOut', (event) => {
  const { userId } = event.detail;
  
  if (window.EncryptionService) {
    console.log('Clearing encryption keys for user:', userId);
    window.EncryptionService.clearKeys(userId);
    console.log('✓ Encryption keys cleared');
  }
});

/**
 * Helper function: Queue order for offline sync
 */
window.queueOfflineOrder = async function(orderData) {
  if (!window.OfflineSyncManager) {
    throw new Error('OfflineSyncManager not initialized');
  }
  
  try {
    const result = await window.OfflineSyncManager.queueOrder(orderData);
    console.log('Order queued for offline sync:', result);
    return result;
  } catch (error) {
    console.error('Failed to queue order:', error);
    throw error;
  }
};

/**
 * Helper function: Get pending orders count
 */
window.getPendingOrdersCount = async function() {
  if (!window.OfflineSyncManager) {
    return 0;
  }
  
  try {
    const queued = await window.OfflineSyncManager.getQueuedOrders();
    return queued.length;
  } catch (error) {
    console.error('Failed to get pending orders count:', error);
    return 0;
  }
};

/**
 * Helper function: Manual sync trigger
 */
window.manualSync = async function() {
  if (navigator.onLine && window.OfflineSyncManager) {
    console.log('Manual sync triggered...');
    await window.OfflineSyncManager.syncOfflineOrders();
    
    if (window.CacheManager) {
      await window.CacheManager.syncAll();
    }
    
    console.log('✓ Manual sync complete');
    if (typeof window.toast === 'function') {
      window.toast('Sinkronisasi berhasil!', 'success');
    }
  } else {
    console.warn('Cannot sync: offline or sync manager not available');
    if (typeof window.toast === 'function') {
      window.toast('Tidak dapat sync: offline', 'err');
    }
  }
};

console.log('Offline initialization script loaded');
