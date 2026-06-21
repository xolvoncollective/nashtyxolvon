/**
 * NASHTY OS - Recent Items Tracker
 * Tracks recently ordered products per cashier
 */

class RecentItemsTracker {
  constructor(db) {
    this.db = db;
    this.maxRecent = 20;
  }

  async trackUsage(userId, productId) {
    const tx = this.db.transaction('recent_items', 'readwrite');
    const store = tx.objectStore('recent_items');
    const index = store.index('userProduct');
    
    const cursor = await index.openCursor([userId, productId]);
    
    if (cursor) {
      const existing = cursor.value;
      existing.lastUsedAt = new Date().toISOString();
      existing.usageCount += 1;
      await cursor.update(existing);
    } else {
      const recentItem = {
        userId,
        productId,
        lastUsedAt: new Date().toISOString(),
        usageCount: 1
      };
      await store.put(recentItem);
    }

    await this.pruneRecentItems(userId);
  }

  async getRecentItems(userId) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const tx = this.db.transaction('recent_items', 'readonly');
    const store = tx.objectStore('recent_items');
    const index = store.index('userId');
    
    const allItems = await index.getAll(userId);

    return allItems
      .filter(item => item.lastUsedAt >= cutoff)
      .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
      .slice(0, this.maxRecent);
  }

  async pruneRecentItems(userId) {
    const tx = this.db.transaction('recent_items', 'readwrite');
    const store = tx.objectStore('recent_items');
    const index = store.index('userId');
    
    const allItems = await index.getAll(userId);
    
    if (allItems.length > this.maxRecent) {
      allItems.sort((a, b) => new Date(a.lastUsedAt) - new Date(b.lastUsedAt));
      
      const toDelete = allItems.slice(0, allItems.length - this.maxRecent);
      for (const item of toDelete) {
        await store.delete(item.id);
      }
    }
  }
}

window.RecentItemsTracker = new RecentItemsTracker(window.DatabaseSchema.db);
console.log('✅ RecentItemsTracker loaded');
