/**
 * NASHTY OS - POS IndexedDB Schema
 * Complete database initialization for offline-first architecture
 */

const DB_NAME = 'nashty-pos-db';
const DB_VERSION = 1;

class DatabaseSchema {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Initialize IndexedDB with complete schema
   */
  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('DatabaseSchema: Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('DatabaseSchema: Database initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('DatabaseSchema: Upgrading database schema...');

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('categoryId', 'categoryId', { unique: false });
          productStore.createIndex('outletId', 'outletId', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          console.log('DatabaseSchema: Created products store');
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoryStore.createIndex('outletId', 'outletId', { unique: false });
          categoryStore.createIndex('name', 'name', { unique: false });
          console.log('DatabaseSchema: Created categories store');
        }

        // Offline queue store
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queueStore = db.createObjectStore('offline_queue', { 
            keyPath: 'localId', 
            autoIncrement: true 
          });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('orderType', 'orderType', { unique: false });
          queueStore.createIndex('userId', 'userId', { unique: false });
          console.log('DatabaseSchema: Created offline_queue store');
        }

        // Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
          const favStore = db.createObjectStore('favorites', { 
            keyPath: 'id',
            autoIncrement: true
          });
          favStore.createIndex('userId', 'userId', { unique: false });
          favStore.createIndex('productId', 'productId', { unique: false });
          favStore.createIndex('userProduct', ['userId', 'productId'], { unique: true });
          favStore.createIndex('position', 'position', { unique: false });
          favStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('DatabaseSchema: Created favorites store');
        }

        // Recent items store
        if (!db.objectStoreNames.contains('recent_items')) {
          const recentStore = db.createObjectStore('recent_items', { 
            keyPath: 'id',
            autoIncrement: true
          });
          recentStore.createIndex('userId', 'userId', { unique: false });
          recentStore.createIndex('productId', 'productId', { unique: false });
          recentStore.createIndex('userProduct', ['userId', 'productId'], { unique: true });
          recentStore.createIndex('lastUsedAt', 'lastUsedAt', { unique: false });
          recentStore.createIndex('usageCount', 'usageCount', { unique: false });
          console.log('DatabaseSchema: Created recent_items store');
        }

        // Keyboard shortcuts store
        if (!db.objectStoreNames.contains('keyboard_shortcuts')) {
          const shortcutStore = db.createObjectStore('keyboard_shortcuts', { 
            keyPath: 'id',
            autoIncrement: true
          });
          shortcutStore.createIndex('userId', 'userId', { unique: false });
          shortcutStore.createIndex('keyCombo', 'keyCombo', { unique: false });
          shortcutStore.createIndex('userKey', ['userId', 'keyCombo'], { unique: true });
          shortcutStore.createIndex('action', 'action', { unique: false });
          console.log('DatabaseSchema: Created keyboard_shortcuts store');
        }

        // Settings store (outlet-level settings)
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { 
            keyPath: 'id',
            autoIncrement: true
          });
          settingsStore.createIndex('outletId', 'outletId', { unique: false });
          settingsStore.createIndex('key', 'key', { unique: false });
          settingsStore.createIndex('outletKey', ['outletId', 'key'], { unique: true });
          console.log('DatabaseSchema: Created settings store');
        }

        // Encryption keys store (session-based, cleared on logout)
        if (!db.objectStoreNames.contains('encryption_keys')) {
          const keyStore = db.createObjectStore('encryption_keys', { keyPath: 'userId' });
          console.log('DatabaseSchema: Created encryption_keys store');
        }

        console.log('DatabaseSchema: Schema upgrade complete');
      };
    });

    return this.initPromise;
  }

  /**
   * Get a transaction for specified stores
   */
  getTransaction(storeNames, mode = 'readonly') {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.transaction(storeNames, mode);
  }

  /**
   * Get object store
   */
  getStore(storeName, mode = 'readonly') {
    const tx = this.getTransaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll() {
    const storeNames = [
      'products', 'categories', 'offline_queue', 
      'favorites', 'recent_items', 'keyboard_shortcuts', 
      'settings', 'encryption_keys'
    ];

    const tx = this.getTransaction(storeNames, 'readwrite');
    
    for (const storeName of storeNames) {
      const store = tx.objectStore(storeName);
      await store.clear();
    }

    await tx.complete;
    console.log('DatabaseSchema: All stores cleared');
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('DatabaseSchema: Database connection closed');
    }
  }
}

// Export singleton instance
window.DBSchema = new DatabaseSchema();
