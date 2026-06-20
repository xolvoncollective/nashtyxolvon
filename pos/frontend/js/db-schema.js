/**
 * NASHTY OS - IndexedDB Schema
 * Complete database schema for offline POS operations
 */

const DB_NAME = 'nashty-pos-db';
const DB_VERSION = 2;

class DatabaseSchema {
  constructor() {
    this.db = null;
    this.initPromise = this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        console.log(`IndexedDB upgrading from version ${oldVersion} to ${DB_VERSION}`);

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('categoryId', 'categoryId', { unique: false });
          productStore.createIndex('outletId', 'outletId', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          console.log('Created products store');
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoryStore.createIndex('outletId', 'outletId', { unique: false });
          categoryStore.createIndex('name', 'name', { unique: false });
          console.log('Created categories store');
        }

        // Offline queue store
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queueStore = db.createObjectStore('offline_queue', { keyPath: 'localId', autoIncrement: true });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('orderType', 'orderType', { unique: false });
          queueStore.createIndex('userId', 'userId', { unique: false });
          console.log('Created offline_queue store');
        }

        // Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
          const favStore = db.createObjectStore('favorites', { keyPath: 'id', autoIncrement: true });
          favStore.createIndex('userId', 'userId', { unique: false });
          favStore.createIndex('userProduct', ['userId', 'productId'], { unique: true });
          favStore.createIndex('position', 'position', { unique: false });
          favStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('Created favorites store');
        }

        // Recent items store
        if (!db.objectStoreNames.contains('recent_items')) {
          const recentStore = db.createObjectStore('recent_items', { keyPath: 'id', autoIncrement: true });
          recentStore.createIndex('userId', 'userId', { unique: false });
          recentStore.createIndex('userProduct', ['userId', 'productId'], { unique: true });
          recentStore.createIndex('lastUsedAt', 'lastUsedAt', { unique: false });
          recentStore.createIndex('usageCount', 'usageCount', { unique: false });
          console.log('Created recent_items store');
        }

        // Keyboard shortcuts store
        if (!db.objectStoreNames.contains('keyboard_shortcuts')) {
          const shortcutStore = db.createObjectStore('keyboard_shortcuts', { keyPath: 'id', autoIncrement: true });
          shortcutStore.createIndex('userId', 'userId', { unique: false });
          shortcutStore.createIndex('userKey', ['userId', 'keyCombo'], { unique: true });
          shortcutStore.createIndex('action', 'action', { unique: false });
          console.log('Created keyboard_shortcuts store');
        }

        // Settings store (outlet-level settings)
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'id', autoIncrement: true });
          settingsStore.createIndex('outletKey', ['outletId', 'key'], { unique: true });
          settingsStore.createIndex('outletId', 'outletId', { unique: false });
          console.log('Created settings store');
        }

        // Encryption keys store (session-based)
        if (!db.objectStoreNames.contains('encryption_keys')) {
          const keyStore = db.createObjectStore('encryption_keys', { keyPath: 'userId' });
          keyStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('Created encryption_keys store');
        }

        console.log('✅ All IndexedDB stores created successfully');
      };
    });
  }

  async getDatabase() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  // Helper to get object store
  async getStore(storeName, mode = 'readonly') {
    const db = await this.getDatabase();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Product operations
  async addProduct(product) {
    const store = await this.getStore('products', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(product);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProduct(productId) {
    const store = await this.getStore('products');
    return new Promise((resolve, reject) => {
      const request = store.get(productId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProducts() {
    const store = await this.getStore('products');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async searchProducts(query) {
    const products = await this.getAllProducts();
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.sku && p.sku.toLowerCase().includes(lowerQuery))
    );
  }

  async deleteProduct(productId) {
    const store = await this.getStore('products', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(productId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Offline queue operations
  async addToQueue(item) {
    const store = await this.getStore('offline_queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingQueue() {
    const store = await this.getStore('offline_queue');
    const index = store.index('status');
    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Settings operations
  async getSetting(outletId, key) {
    const store = await this.getStore('settings');
    const index = store.index('outletKey');
    return new Promise((resolve, reject) => {
      const request = index.get([outletId, key]);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async setSetting(outletId, key, value) {
    const store = await this.getStore('settings', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ outletId, key, value, updatedAt: new Date().toISOString() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Initialize and export
window.DatabaseSchema = new DatabaseSchema();
console.log('✅ DatabaseSchema module loaded');
