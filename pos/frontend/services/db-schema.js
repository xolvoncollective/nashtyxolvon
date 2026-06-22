/**
 * IndexedDB Schema Initialization
 * Defines all object stores for offline POS functionality
 */

import { openDB } from 'idb';

const DB_NAME = 'NashtyPOS';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB with all required object stores
 */
export async function initDB() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from v${oldVersion} to v${newVersion}`);

        // 1. Products store
        if (!db.objectStoreNames.contains('products')) {
          const productsStore = db.createObjectStore('products', { keyPath: 'id' });
          productsStore.createIndex('category_id', 'category_id');
          productsStore.createIndex('outlet_id', 'outlet_id');
          productsStore.createIndex('status', 'status');
          productsStore.createIndex('updated_at', 'updated_at');
          console.log('✓ Created products store');
        }

        // 2. Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoriesStore.createIndex('outlet_id', 'outlet_id');
          categoriesStore.createIndex('position', 'position');
          console.log('✓ Created categories store');
        }

        // 3. Offline Queue store
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queueStore = db.createObjectStore('offline_queue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          queueStore.createIndex('timestamp', 'timestamp');
          queueStore.createIndex('status', 'status');
          queueStore.createIndex('operation_type', 'operation_type');
          queueStore.createIndex('retry_count', 'retry_count');
          console.log('✓ Created offline_queue store');
        }

        // 4. Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
          const favoritesStore = db.createObjectStore('favorites', { keyPath: 'id' });
          favoritesStore.createIndex('user_id', 'user_id');
          favoritesStore.createIndex('product_id', 'product_id');
          favoritesStore.createIndex('position', 'position');
          console.log('✓ Created favorites store');
        }

        // 5. Recent Items store
        if (!db.objectStoreNames.contains('recent_items')) {
          const recentStore = db.createObjectStore('recent_items', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          recentStore.createIndex('user_id', 'user_id');
          recentStore.createIndex('product_id', 'product_id');
          recentStore.createIndex('last_used', 'last_used');
          recentStore.createIndex('use_count', 'use_count');
          console.log('✓ Created recent_items store');
        }

        // 6. Keyboard Shortcuts store
        if (!db.objectStoreNames.contains('keyboard_shortcuts')) {
          const shortcutsStore = db.createObjectStore('keyboard_shortcuts', { keyPath: 'key' });
          shortcutsStore.createIndex('user_id', 'user_id');
          shortcutsStore.createIndex('action', 'action');
          console.log('✓ Created keyboard_shortcuts store');
        }

        // 7. Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
          console.log('✓ Created settings store');
        }

        // 8. Encryption Keys store (sensitive)
        if (!db.objectStoreNames.contains('encryption_keys')) {
          const keysStore = db.createObjectStore('encryption_keys', { keyPath: 'id' });
          keysStore.createIndex('user_id', 'user_id');
          keysStore.createIndex('created_at', 'created_at');
          console.log('✓ Created encryption_keys store');
        }

        // 9. Sync Metadata store (track last sync times)
        if (!db.objectStoreNames.contains('sync_metadata')) {
          const syncStore = db.createObjectStore('sync_metadata', { keyPath: 'key' });
          console.log('✓ Created sync_metadata store');
        }

        console.log('✅ IndexedDB schema initialized successfully');
      },
      blocked() {
        console.warn('⚠️  DB upgrade blocked - close other tabs');
      },
      blocking() {
        console.warn('⚠️  Blocking DB upgrade in another tab');
      },
      terminated() {
        console.error('❌ DB connection terminated unexpectedly');
      }
    });

    return db;
  } catch (error) {
    console.error('❌ Failed to initialize IndexedDB:', error);
    throw error;
  }
}

/**
 * Get DB instance
 */
export async function getDB() {
  return await openDB(DB_NAME, DB_VERSION);
}

/**
 * Clear all data from a specific store
 */
export async function clearStore(storeName) {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.objectStore(storeName).clear();
  await tx.done;
  console.log(`✓ Cleared ${storeName} store`);
}

/**
 * Delete entire database (for testing/reset)
 */
export async function deleteDatabase() {
  try {
    await openDB.deleteDB(DB_NAME);
    console.log('✓ Database deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete database:', error);
    return false;
  }
}

/**
 * Get database size estimate
 */
export async function getDBSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
      quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2),
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
    };
  }
  return null;
}

/**
 * Export database stats
 */
export async function getDBStats() {
  const db = await getDB();
  const stores = Array.from(db.objectStoreNames);
  const stats = {};

  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readonly');
    const count = await tx.objectStore(storeName).count();
    stats[storeName] = count;
  }

  const sizeEstimate = await getDBSize();

  return {
    stores: stats,
    size: sizeEstimate,
    version: DB_VERSION,
    name: DB_NAME
  };
}

// Auto-initialize on import
let dbInitialized = false;
export async function ensureDBInitialized() {
  if (!dbInitialized) {
    await initDB();
    dbInitialized = true;
  }
}

// Initialize immediately
ensureDBInitialized().catch(err => {
  console.error('Failed to auto-initialize DB:', err);
});
