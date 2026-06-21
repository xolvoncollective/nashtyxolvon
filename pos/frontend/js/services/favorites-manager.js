/**
 * NASHTY OS - Favorites Manager
 * Manages user favorite products with offline support
 */

class FavoritesManager {
  constructor() {
    this.favorites = [];
    this.maxFavorites = 50;
    this.userId = null;
  }

  async init(userId) {
    this.userId = userId;
    await this.loadFavorites();
  }

  async loadFavorites() {
    try {
      if (navigator.onLine) {
        await this.loadFromServer();
      } else {
        await this.loadFromCache();
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      await this.loadFromCache();
    }
  }

  async loadFromServer() {
    try {
      const { data, error } = await window.API.supabase
        .from('pos_favorites')
        .select('*, products(*)')
        .eq('user_id', this.userId)
        .order('position', { ascending: true });

      if (error) {
        console.warn('Failed to load favorites from Supabase (table might not exist):', error.message);
        throw error;
      }
      
      this.favorites = data || [];
    } catch (e) {
      throw e;
    }

    // Cache to IndexedDB
    await this.cacheToIndexedDB();

    console.log(`✅ Loaded ${this.favorites.length} favorites from server`);
  }

  async loadFromCache() {
    if (!window.DatabaseSchema) return;

    const db = await window.DatabaseSchema.getDatabase();
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const index = store.index('userId');
    
    const cached = await index.getAll(this.userId);
    
    // Get product details from cache
    const favoritesWithProducts = [];
    for (const fav of cached) {
      const product = await window.DatabaseSchema.getProduct(fav.productId);
      if (product) {
        favoritesWithProducts.push({
          id: fav.id,
          product_id: fav.productId,
          position: fav.position,
          products: product
        });
      }
    }

    this.favorites = favoritesWithProducts.sort((a, b) => a.position - b.position);
    console.log(`✅ Loaded ${this.favorites.length} favorites from cache`);
  }

  async cacheToIndexedDB() {
    if (!window.DatabaseSchema) return;

    const db = await window.DatabaseSchema.getDatabase();
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');

    // Clear existing
    const index = store.index('userId');
    const existing = await index.getAllKeys(this.userId);
    for (const key of existing) {
      await store.delete(key);
    }

    // Add current favorites
    for (const fav of this.favorites) {
      await store.add({
        userId: this.userId,
        productId: fav.product_id,
        position: fav.position,
        createdAt: new Date().toISOString()
      });
    }
  }

  async addFavorite(productId) {
    if (this.favorites.length >= this.maxFavorites) {
      throw new Error(`Maximum ${this.maxFavorites} favorites reached`);
    }

    if (this.isFavorite(productId)) {
      throw new Error('Product already in favorites');
    }

    try {
      if (navigator.onLine) {
        await this.addFavoriteOnline(productId);
      } else {
        await this.addFavoriteOffline(productId);
      }
    } catch (error) {
      console.error('Failed to add favorite:', error);
      await this.addFavoriteOffline(productId);
    }
  }

  async addFavoriteOnline(productId) {
    const token = sessionStorage.getItem('token');
    const apiBase = window.API_BASE || '';

    const response = await fetch(`${apiBase}/api/favorites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        productId
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    
    // Get product details
    const product = await window.OfflineOrderHandler.getProduct(productId);
    
    this.favorites.push({
      id: data.favorite.id,
      product_id: productId,
      position: data.favorite.position,
      products: product
    });

    await this.cacheToIndexedDB();
    console.log(`✅ Added favorite: ${product.name}`);
  }

  async addFavoriteOffline(productId) {
    const product = await window.DatabaseSchema.getProduct(productId);
    if (!product) throw new Error('Product not found in cache');

    const position = this.favorites.length > 0 
      ? Math.max(...this.favorites.map(f => f.position)) + 1 
      : 1;

    const tempId = 'fav_' + Date.now();
    
    this.favorites.push({
      id: tempId,
      product_id: productId,
      position,
      products: product,
      _offline: true
    });

    await this.cacheToIndexedDB();

    // Queue for sync
    if (window.OfflineSyncManager) {
      await window.DatabaseSchema.addToQueue({
        timestamp: Date.now(),
        status: 'pending',
        orderType: 'favorite_add',
        data: JSON.stringify({ userId: this.userId, productId }),
        retryCount: 0,
        userId: this.userId,
        outletId: sessionStorage.getItem('currentOutletId')
      });
    }

    console.log(`📴 Added favorite offline: ${product.name}`);
  }

  async removeFavorite(favoriteId) {
    const favorite = this.favorites.find(f => f.id === favoriteId);
    if (!favorite) return;

    try {
      if (navigator.onLine && !favorite._offline) {
        await this.removeFavoriteOnline(favoriteId);
      } else {
        await this.removeFavoriteOffline(favoriteId);
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      await this.removeFavoriteOffline(favoriteId);
    }
  }

  async removeFavoriteOnline(favoriteId) {
    const token = sessionStorage.getItem('token');
    const apiBase = window.API_BASE || '';

    const response = await fetch(`${apiBase}/api/favorites/${favoriteId}?userId=${this.userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    this.favorites = this.favorites.filter(f => f.id !== favoriteId);
    await this.cacheToIndexedDB();
    console.log(`✅ Removed favorite`);
  }

  async removeFavoriteOffline(favoriteId) {
    this.favorites = this.favorites.filter(f => f.id !== favoriteId);
    await this.cacheToIndexedDB();

    // Queue for sync
    if (window.OfflineSyncManager) {
      await window.DatabaseSchema.addToQueue({
        timestamp: Date.now(),
        status: 'pending',
        orderType: 'favorite_remove',
        data: JSON.stringify({ userId: this.userId, favoriteId }),
        retryCount: 0,
        userId: this.userId,
        outletId: sessionStorage.getItem('currentOutletId')
      });
    }

    console.log(`📴 Removed favorite offline`);
  }

  async reorderFavorites(newOrder) {
    // newOrder is array of { id, position }
    const reordered = [];
    for (const item of newOrder) {
      const fav = this.favorites.find(f => f.id === item.id);
      if (fav) {
        fav.position = item.position;
        reordered.push(fav);
      }
    }

    this.favorites = reordered.sort((a, b) => a.position - b.position);
    await this.cacheToIndexedDB();

    try {
      if (navigator.onLine) {
        await this.reorderOnline(newOrder);
      }
    } catch (error) {
      console.error('Failed to sync reorder:', error);
    }
  }

  async reorderOnline(newOrder) {
    const token = sessionStorage.getItem('token');
    const apiBase = window.API_BASE || '';

    await fetch(`${apiBase}/api/favorites/reorder`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        favorites: newOrder
      })
    });

    console.log(`✅ Favorites reordered`);
  }

  isFavorite(productId) {
    return this.favorites.some(f => f.product_id === productId);
  }

  getFavorites() {
    return this.favorites;
  }

  getCount() {
    return this.favorites.length;
  }
}

window.FavoritesManager = new FavoritesManager();
console.log('✅ FavoritesManager loaded');
