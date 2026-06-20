/**
 * NASHTY OS - Cache Manager
 * Synchronizes data between Supabase and IndexedDB
 */

class CacheManager {
  constructor() {
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.maxProducts = 10000;
    this.syncTimer = null;
    this.isSyncing = false;
  }

  async startSync() {
    console.log('🔄 CacheManager: Starting periodic sync...');
    await this.syncAll();
    this.syncTimer = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncAll();
      }
    }, this.syncInterval);
    console.log('✅ CacheManager: Periodic sync started (every 5 minutes)');
  }

  stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('🛑 CacheManager: Periodic sync stopped');
    }
  }

  async syncAll() {
    if (this.isSyncing) {
      console.log('⏭️  CacheManager: Sync already in progress, skipping...');
      return;
    }
    this.isSyncing = true;
    const startTime = Date.now();
    console.log('🔄 CacheManager: Starting sync...');
    try {
      await Promise.all([
        this.syncProducts(),
        this.syncCategories(),
        this.syncSettings()
      ]);
      const duration = Date.now() - startTime;
      console.log(`✅ CacheManager: Sync completed in ${duration}ms`);
    } catch (error) {
      console.error('❌ CacheManager: Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncProducts() {
    try {
      const outletId = sessionStorage.getItem('currentOutletId');
      if (!outletId) {
        console.warn('CacheManager: No outlet ID, skipping product sync');
        return;
      }
      const lastSync = await this.getLastSyncTime('products');
      console.log(`🔄 Syncing products (last sync: ${new Date(lastSync).toISOString()})...`);
      const url = `${window.API_BASE || 'http://localhost:3099'}/api/products?outletId=${outletId}&updatedAfter=${lastSync}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const products = data.products || data.data || [];
      console.log(`📦 Received ${products.length} products to cache`);
      for (const product of products) {
        await window.DatabaseSchema.addProduct(product);
      }
      const allProducts = await window.DatabaseSchema.getAllProducts();
      if (allProducts.length > this.maxProducts) {
        await this.pruneOldProducts(allProducts.length - this.maxProducts);
      }
      await this.setLastSyncTime('products', Date.now());
      console.log(`✅ Products synced successfully (${products.length} products)`);
    } catch (error) {
      console.error('❌ Product sync failed:', error);
    }
  }

  async syncCategories() {
    try {
      const outletId = sessionStorage.getItem('currentOutletId');
      if (!outletId) return;
      console.log('🔄 Syncing categories...');
      const url = `${window.API_BASE || 'http://localhost:3099'}/api/categories?outletId=${outletId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const categories = data.categories || data.data || [];
      const db = await window.DatabaseSchema.getDatabase();
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      for (const category of categories) {
        await store.put(category);
      }
      await tx.complete;
      console.log(`✅ Categories synced (${categories.length} categories)`);
    } catch (error) {
      console.error('❌ Category sync failed:', error);
    }
  }

  async syncSettings() {
    try {
      const outletId = sessionStorage.getItem('currentOutletId');
      if (!outletId) return;
      console.log('🔄 Syncing settings...');
      const url = `${window.API_BASE || 'http://localhost:3099'}/api/settings?outletId=${outletId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const settings = await response.json();
      for (const [key, value] of Object.entries(settings)) {
        await window.DatabaseSchema.setSetting(outletId, key, value);
      }
      console.log('✅ Settings synced');
    } catch (error) {
      console.error('❌ Settings sync failed:', error);
    }
  }

  async pruneOldProducts(countToRemove) {
    console.log(`🧹 Pruning ${countToRemove} old products...`);
    const products = await window.DatabaseSchema.getAllProducts();
    const sorted = products.sort((a, b) => 
      new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0)
    );
    for (let i = 0; i < countToRemove && i < sorted.length; i++) {
      await window.DatabaseSchema.deleteProduct(sorted[i].id);
    }
    console.log(`✅ Pruned ${countToRemove} products`);
  }

  getLastSyncTime(storeName) {
    const key = `lastSync_${storeName}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
  }

  setLastSyncTime(storeName, timestamp) {
    const key = `lastSync_${storeName}`;
    localStorage.setItem(key, timestamp.toString());
  }
}

window.CacheManager = new CacheManager();
console.log('✅ CacheManager module loaded');
