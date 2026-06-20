/**
 * NASHTY OS - Cache Manager
 * Synchronizes products, categories, and settings between Supabase and IndexedDB
 */

class CacheManager {
  constructor() {
    this.db = null;
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.maxProducts = 10000;
    this.syncTimer = null;
    this.isSyncing = false;
  }

  /**
   * Initialize cache manager with database instance
   */
  async init(dbSchema) {
    this.db = await dbSchema.init();
    console.log('CacheManager: Initialized');
  }

  /**
   * Start periodic synchronization
   */
  async startSync() {
    // Initial sync
    await this.syncAll();

    // Periodic sync
    this.syncTimer = setInterval(async () => {
      if (navigator.onLine && !this.isSyncing) {
        console.log('CacheManager: Running periodic sync');
        await this.syncAll();
      }
    }, this.syncInterval);

    console.log('CacheManager: Periodic sync started (every 5 minutes)');
  }

  /**
   * Stop periodic synchronization
   */
  stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('CacheManager: Periodic sync stopped');
    }
  }

  /**
   * Synchronize all data
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log('CacheManager: Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    try {
      console.log('CacheManager: Starting full sync...');
      await Promise.all([
        this.syncProducts(),
        this.syncCategories(),
        this.syncSettings()
      ]);
      console.log('CacheManager: Full sync complete');
    } catch (error) {
      console.error('CacheManager: Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync products from API to IndexedDB
   */
  async syncProducts() {
    try {
      const outletId = this.getCurrentOutletId();
      if (!outletId) {
        console.warn('CacheManager: No outlet ID, skipping product sync');
        return;
      }

      const lastSync = await this.getLastSyncTime('products');
      console.log('CacheManager: Syncing products (last sync:', new Date(lastSync).toISOString(), ')');

      // Fetch products from API
      const response = await window.API.menu.getOutletMenu(outletId);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch products from API');
      }

      const products = response.data.items || [];
      console.log('CacheManager: Fetched', products.length, 'products from API');

      // Update IndexedDB
      const tx = this.db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');

      for (const product of products) {
        const productData = {
          id: product.id,
          outletId: outletId,
          categoryId: product.category_id,
          name: product.name,
          description: product.description || '',
          price: product.price,
          image: product.image || null,
          isActive: product.is_active !== 0 && product.status !== 'sold_out',
          stock: product.stock || null,
          sku: product.sku || null,
          modifiers: product.modifier_groups || [],
          createdAt: product.created_at || new Date().toISOString(),
          updatedAt: product.updated_at || new Date().toISOString()
        };

        await store.put(productData);
      }

      // Check product count and enforce limit
      const count = await store.count();
      console.log('CacheManager: Total products in cache:', count);

      if (count > this.maxProducts) {
        const toRemove = count - this.maxProducts;
        console.log('CacheManager: Pruning', toRemove, 'old products');
        await this.pruneOldProducts(toRemove);
      }

      await this.setLastSyncTime('products', Date.now());
      console.log('CacheManager: Product sync complete');
    } catch (error) {
      console.error('CacheManager: Product sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync categories from API to IndexedDB
   */
  async syncCategories() {
    try {
      const outletId = this.getCurrentOutletId();
      if (!outletId) {
        console.warn('CacheManager: No outlet ID, skipping category sync');
        return;
      }

      console.log('CacheManager: Syncing categories');

      // Fetch categories from API
      const response = await window.API.menu.getOutletMenu(outletId);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch categories from API');
      }

      const categories = response.data.categories || [];
      console.log('CacheManager: Fetched', categories.length, 'categories from API');

      // Update IndexedDB
      const tx = this.db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');

      for (const category of categories) {
        const categoryData = {
          id: category.id,
          outletId: outletId,
          name: category.name,
          icon: category.icon || null,
          sortOrder: category.sort_order || 0,
          createdAt: category.created_at || new Date().toISOString()
        };

        await store.put(categoryData);
      }

      console.log('CacheManager: Category sync complete');
    } catch (error) {
      console.error('CacheManager: Category sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync settings from API to IndexedDB
   */
  async syncSettings() {
    try {
      const outletId = this.getCurrentOutletId();
      if (!outletId) {
        console.warn('CacheManager: No outlet ID, skipping settings sync');
        return;
      }

      console.log('CacheManager: Syncing settings');

      // For now, store basic settings
      // In production, this would fetch from API
      const defaultSettings = {
        receiptLogo: null,
        receiptHeader: '',
        receiptFooter: 'Terima kasih atas kunjungan Anda',
        receiptFontSize: 'medium',
        qrFeedbackEnabled: false,
        qrFeedbackUrl: ''
      };

      const tx = this.db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');

      for (const [key, value] of Object.entries(defaultSettings)) {
        const settingData = {
          outletId: outletId,
          key: key,
          value: value,
          updatedAt: new Date().toISOString()
        };

        // Check if exists
        const index = store.index('outletKey');
        const existing = await index.get([outletId, key]);
        
        if (!existing) {
          await store.put(settingData);
        }
      }

      console.log('CacheManager: Settings sync complete');
    } catch (error) {
      console.error('CacheManager: Settings sync failed:', error);
      throw error;
    }
  }

  /**
   * Prune old products to enforce cache size limit
   */
  async pruneOldProducts(countToRemove) {
    try {
      const tx = this.db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      const index = store.index('updatedAt');

      // Get oldest products
      const oldProducts = [];
      let cursor = await index.openCursor();
      
      while (cursor && oldProducts.length < countToRemove) {
        oldProducts.push(cursor.value);
        cursor = await cursor.continue();
      }

      // Delete them
      for (const product of oldProducts) {
        await store.delete(product.id);
      }

      console.log('CacheManager: Pruned', oldProducts.length, 'old products');
    } catch (error) {
      console.error('CacheManager: Failed to prune products:', error);
    }
  }

  /**
   * Get cached product by ID
   */
  async getCachedProduct(productId) {
    const tx = this.db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    return await store.get(productId);
  }

  /**
   * Search cached products
   */
  async searchCachedProducts(query) {
    const tx = this.db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    
    // Get all products (in production, consider cursor-based pagination)
    const allProducts = await store.getAll();
    
    // Filter by query
    const lowerQuery = query.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.description && p.description.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get all cached categories
   */
  async getCachedCategories() {
    const tx = this.db.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');
    return await store.getAll();
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId) {
    const tx = this.db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const index = store.index('categoryId');
    return await index.getAll(categoryId);
  }

  /**
   * Get setting value
   */
  async getSetting(key) {
    const outletId = this.getCurrentOutletId();
    const tx = this.db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const index = store.index('outletKey');
    const setting = await index.get([outletId, key]);
    return setting ? setting.value : null;
  }

  // ── Helper Methods ──

  getCurrentOutletId() {
    return window.API?.session?.outletId || 
           sessionStorage.getItem('currentOutletId');
  }

  async getLastSyncTime(storeName) {
    const key = `lastSync_${storeName}`;
    const timestamp = localStorage.getItem(key);
    return timestamp ? parseInt(timestamp, 10) : 0;
  }

  async setLastSyncTime(storeName, timestamp) {
    const key = `lastSync_${storeName}`;
    localStorage.setItem(key, timestamp.toString());
  }
}

// Export singleton instance
window.CacheManager = new CacheManager();
