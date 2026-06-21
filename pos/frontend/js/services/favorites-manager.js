/**
 * NASHTY OS - Favorites Manager
 * Manages favorite products for quick access
 */

class FavoritesManager {
  constructor(db, apiClient) {
    this.db = db;
    this.api = apiClient;
    this.maxFavorites = 50;
  }

  async addFavorite(userId, productId) {
    const count = await this.getFavoriteCount(userId);
    
    if (count >= this.maxFavorites) {
      throw new Error(`Maksimal ${this.maxFavorites} favorit diperbolehkan`);
    }

    const position = await this.getNextPosition(userId);

    const favorite = {
      userId,
      productId,
      position,
      createdAt: new Date().toISOString()
    };

    // Save locally
    const tx = this.db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    await store.put(favorite);

    // Sync to server if online
    if (navigator.onLine) {
      try {
        await this.api.post('/api/favorites', favorite);
      } catch (error) {
        console.error('Failed to sync favorite to server:', error);
      }
    }

    return favorite;
  }

  async removeFavorite(userId, productId) {
    const tx = this.db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    const index = store.index('userProduct');
    
    const cursor = await index.openCursor([userId, productId]);
    if (cursor) {
      await cursor.delete();
    }

    // Sync to server
    if (navigator.onLine) {
      try {
        await this.api.delete(`/api/favorites/${productId}`);
      } catch (error) {
        console.error('Failed to delete favorite from server:', error);
      }
    }
  }

  async getFavorites(userId) {
    const tx = this.db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const index = store.index('userId');
    
    const favorites = await index.getAll(userId);
    
    return favorites.sort((a, b) => a.position - b.position);
  }

  async reorderFavorites(userId, productIds) {
    const tx = this.db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    const index = store.index('userProduct');

    for (let i = 0; i < productIds.length; i++) {
      const cursor = await index.openCursor([userId, productIds[i]]);
      if (cursor) {
        const favorite = cursor.value;
        favorite.position = i;
        await cursor.update(favorite);
      }
    }

    if (navigator.onLine) {
      try {
        await this.api.put('/api/favorites/reorder', { productIds });
      } catch (error) {
        console.error('Failed to sync favorite order:', error);
      }
    }
  }

  async getFavoriteCount(userId) {
    const tx = this.db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const index = store.index('userId');
    return await index.count(userId);
  }

  async getNextPosition(userId) {
    const favorites = await this.getFavorites(userId);
    if (favorites.length === 0) return 0;
    return Math.max(...favorites.map(f => f.position)) + 1;
  }
}

window.FavoritesManager = new FavoritesManager(
  window.DatabaseSchema.db,
  window.API
);
console.log('✅ FavoritesManager loaded');
