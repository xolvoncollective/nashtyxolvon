/**
 * NASHTY OS - Recent Items Tracker
 * Tracks recently ordered products per cashier
 */

class RecentItemsTracker {
  constructor() {
    this.maxItems = 20;
    this.userId = null;
    this.recentItems = [];
  }

  async init(userId) {
    this.userId = userId;
    await this.loadRecentItems();
  }

  async loadRecentItems() {
    if (!window.DatabaseSchema) return;

    const db = await window.DatabaseSchema.getDatabase();
    const tx = db.transaction('recent_items', 'readonly');
    const store = tx.objectStore('recent_items');
    const index = store.index('userId');
    
    const items = await index.getAll(this.userId);
    
    // Sort by lastUsedAt desc, limit to 20
    this.recentItems = items
      .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
      .slice(0, this.maxItems);

    console.log(`✅ Loaded ${this.recentItems.length} recent items`);
  }

  async trackItem(productId) {
    if (!this.userId || !window.DatabaseSchema) return;

    try {
      const db = await window.DatabaseSchema.getDatabase();
      const tx = db.transaction('recent_items', 'readwrite');
      const store = tx.objectStore('recent_items');
      const index = store.index('userProduct');
      
      // Check if exists
      const existing = await index.get([this.userId, productId]);
      
      if (existing) {
        // Update
        existing.lastUsedAt = new Date().toISOString();
        existing.usageCount += 1;
        await store.put(existing);
      } else {
        // Add new
        await store.add({
          userId: this.userId,
          productId,
          lastUsedAt: new Date().toISOString(),
          usageCount: 1
        });
      }

      // Reload
      await this.loadRecentItems();

      // Cleanup old items (keep only 20)
      await this.cleanupOldItems();

    } catch (error) {
      console.error('Failed to track recent item:', error);
    }
  }

  async cleanupOldItems() {
    if (!window.DatabaseSchema) return;

    const db = await window.DatabaseSchema.getDatabase();
    const tx = db.transaction('recent_items', 'readwrite');
    const store = tx.objectStore('recent_items');
    const index = store.index('userId');
    
    const all = await index.getAll(this.userId);
    
    if (all.length > this.maxItems) {
      // Sort by lastUsedAt
      const sorted = all.sort((a, b) => 
        new Date(b.lastUsedAt) - new Date(a.lastUsedAt)
      );
      
      // Delete items beyond limit
      for (let i = this.maxItems; i < sorted.length; i++) {
        await store.delete(sorted[i].id);
      }
    }
  }

  async getRecentItems() {
    const items = [];
    
    for (const item of this.recentItems) {
      const product = await window.DatabaseSchema.getProduct(item.productId);
      if (product) {
        items.push({
          product,
          lastUsedAt: item.lastUsedAt,
          count: item.usageCount
        });
      }
    }

    // Filter last 24 hours first
    const now = Date.now();
    const day24 = 24 * 60 * 60 * 1000;
    
    const recent24h = items.filter(item => 
      (now - new Date(item.lastUsedAt).getTime()) < day24
    );

    const older = items.filter(item => 
      (now - new Date(item.lastUsedAt).getTime()) >= day24
    );

    return [...recent24h, ...older];
  }
}

window.RecentItemsTracker = new RecentItemsTracker();
console.log('✅ RecentItemsTracker loaded');
