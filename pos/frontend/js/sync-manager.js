/**
 * NASHTY OS - POS Offline Sync Manager (Enhanced)
 * Integrates with encryption service and new IndexedDB schema
 */

class OfflineSyncManager {
  constructor() {
    this.db = null;
    this.encryptionService = null;
    this.initPromise = null;
    
    // Bind network events
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
    
    // Periodic sync check every 30 seconds
    setInterval(() => {
      if (navigator.onLine) {
        this.syncOfflineOrders();
      }
    }, 30000);
  }

  /**
   * Initialize with database schema and encryption service
   */
  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Wait for DBSchema and EncryptionService to be available
        if (window.DBSchema) {
          this.db = await window.DBSchema.init();
          console.log('OfflineSyncManager: Database initialized');
        }

        if (window.EncryptionService) {
          this.encryptionService = window.EncryptionService;
          console.log('OfflineSyncManager: Encryption service connected');
        }

        await this.updateUIStatus();
        
        // Automatically attempt to sync if online on load
        if (navigator.onLine) {
          this.syncOfflineOrders();
        }
      } catch (error) {
        console.error('OfflineSyncManager: Initialization failed:', error);
      }
    })();

    return this.initPromise;
  }

  // Initialize IndexedDB
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (e) => {
        console.error('OfflineSyncManager: Database error:', e.target.error);
        reject(e.target.error);
      };
      
      request.onsuccess = (e) => {
        this.db = e.target.result;
        console.log('OfflineSyncManager: Database initialized successfully');
        this.updateUIStatus();
        resolve(this.db);
        // Automatically attempt to sync if online on load
        if (navigator.onLine) {
          this.syncOfflineOrders();
        }
      };
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('offline_orders')) {
          db.createObjectStore('offline_orders', { keyPath: 'id' });
          console.log('OfflineSyncManager: Created offline_orders object store');
        }
      };
    });
  }

  // Helper to get object store
  async getStore(mode = 'readonly') {
    await this.initPromise;
    const transaction = this.db.transaction('offline_orders', mode);
    return transaction.objectStore('offline_orders');
  }

  // Save order to IndexedDB queue
  async queueOrder(orderData) {
    const store = await this.getStore('readwrite');
    
    // Generate an offline order ID and temporary order number
    const tempId = 'off_' + crypto.randomUUID();
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-4);
    const tempOrderNumber = `OFFLINE-${dateStr}-${timestamp}`;
    
    const offlineOrder = {
      id: tempId,
      order_number: tempOrderNumber,
      payload: {
        ...orderData,
        id: tempId,
        order_number: tempOrderNumber,
        created_at: new Date().toISOString()
      },
      queued_at: new Date().toISOString(),
      attempts: 0
    };

    return new Promise((resolve, reject) => {
      const request = store.add(offlineOrder);
      
      request.onsuccess = () => {
        console.log('OfflineSyncManager: Order queued successfully:', tempOrderNumber);
        this.updateUIStatus();
        resolve(offlineOrder);
      };
      
      request.onerror = (e) => {
        console.error('OfflineSyncManager: Failed to queue order:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  // Get all queued orders
  async getQueuedOrders() {
    const store = await this.getStore('readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Delete an order from the queue
  async removeOrder(id) {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('OfflineSyncManager: Order removed from queue:', id);
        this.updateUIStatus();
        resolve();
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Update attempts count for failed syncs
  async incrementAttempts(id) {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const order = getReq.result;
        if (order) {
          order.attempts += 1;
          const putReq = store.put(order);
          putReq.onsuccess = () => resolve();
          putReq.onerror = (e) => reject(e.target.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = (e) => reject(e.target.error);
    });
  }

  // Network status event handler
  handleNetworkChange(isOnline) {
    console.log(`OfflineSyncManager: Connection status changed to ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    this.updateUIStatus();
    if (isOnline) {
      this.syncOfflineOrders();
    }
  }

  // Sync queued orders to the server
  async syncOfflineOrders() {
    if (!navigator.onLine) return;
    
    const queued = await this.getQueuedOrders();
    if (queued.length === 0) return;
    
    console.log(`OfflineSyncManager: Found ${queued.length} orders to sync...`);
    
    // We import and use global API client from window.API
    if (!window.API) {
      console.error('OfflineSyncManager: window.API is not loaded yet');
      return;
    }

    for (const order of queued) {
      try {
        console.log(`OfflineSyncManager: Syncing order ${order.order_number}...`);
        
        // Remove temporary ID and number before sending to server so the server generates clean values
        const cleanPayload = { ...order.payload };
        delete cleanPayload.id;
        delete cleanPayload.order_number;

        // Post order to backend
        const result = await window.API.orders.create(cleanPayload);
        
        if (result.success || result.order) {
          console.log(`OfflineSyncManager: Successfully synced order ${order.order_number}`);
          await this.removeOrder(order.id);
          
          // Trigger print if possible or update cashier notification
          if (typeof window.showToast === 'function') {
            window.showToast(`Order ${order.order_number} berhasil disinkronisasi ke server!`);
          }
        }
      } catch (err) {
        console.error(`OfflineSyncManager: Failed to sync order ${order.order_number}:`, err);
        await this.incrementAttempts(order.id);
      }
    }
  }

  // Update indicator chip in topbar
  async updateUIStatus() {
    const chip = document.getElementById('online-status-chip');
    const dot = document.getElementById('online-status-dot');
    const text = document.getElementById('online-status-text');
    
    if (!chip || !dot || !text) return;
    
    const isOnline = navigator.onLine;
    const queued = await this.getQueuedOrders().catch(() => []);
    
    if (isOnline) {
      if (queued.length > 0) {
        chip.className = 'online-chip offline'; // yellow/warning state when unsynced orders remain
        dot.className = 'ondot offline';
        text.textContent = `Syncing (${queued.length} pending)`;
      } else {
        chip.className = 'online-chip';
        dot.className = 'ondot';
        text.textContent = 'Online';
      }
    } else {
      chip.className = 'online-chip offline';
      dot.className = 'ondot offline';
      text.textContent = `Offline (${queued.length} unsynced)`;
    }
  }
}

// Instantiate and expose globally
window.OfflineSyncManager = new OfflineSyncManager();
