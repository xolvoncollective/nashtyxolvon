/**
 * Nashty POS - Offline Sync Manager
 * Menggunakan IndexedDB untuk menyimpan transaksi yang gagal akibat jaringan terputus.
 */

const SyncManager = (function () {
  const DB_NAME = 'nashty-pos-db';
  const STORE_NAME = 'offline_orders';
  const DB_VERSION = 1;
  let db = null;

  // Initialize IndexedDB
  function init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          // Buat object store dengan keyPath 'id'
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        console.log('[SyncManager] IndexedDB siap.');
        resolve(db);
        
        // Coba sinkronisasi jika ada antrean dan kita online
        if (navigator.onLine) {
          syncOrders();
        }
      };

      request.onerror = (event) => {
        console.error('[SyncManager] Gagal membuka IndexedDB', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Simpan pesanan ke antrean lokal
  function saveOrder(orderPayload) {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('IndexedDB belum siap.'));
        return;
      }

      // Generate ID unik untuk pesanan offline menggunakan UUID
      const uuid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString();
      const offlineId = 'off-' + uuid;
      const entry = {
        id: offlineId,
        payload: orderPayload,
        timestamp: new Date().toISOString()
      };

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(entry);

      request.onsuccess = () => {
        console.log('[SyncManager] Pesanan disimpan ke antrean offline:', offlineId);
        updateUI();
        resolve(offlineId);
      };

      request.onerror = (event) => {
        console.error('[SyncManager] Gagal menyimpan pesanan:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Ambil semua pesanan dari antrean
  function getOrders() {
    return new Promise((resolve, reject) => {
      if (!db) return resolve([]);

      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result || []);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // Hapus pesanan dari antrean (setelah berhasil disinkronkan)
  function removeOrder(id) {
    return new Promise((resolve, reject) => {
      if (!db) return resolve();

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  let isSyncing = false;

  // Proses sinkronisasi pesanan ke backend
  async function syncOrders() {
    if (isSyncing || !navigator.onLine) return;
    
    try {
      isSyncing = true;
      const orders = await getOrders();
      
      if (orders.length === 0) {
        isSyncing = false;
        updateUI();
        return;
      }

      console.log(`[SyncManager] Memulai sinkronisasi ${orders.length} pesanan...`);
      let successCount = 0;

      for (const entry of orders) {
        try {
          // Kirim ke backend (memanfaatkan API.orders.create yang sudah ada)
          const res = await API.orders.create(entry.payload);
          
          if (res.success || res.order) {
            // Jika berhasil masuk, hapus dari antrean lokal
            await removeOrder(entry.id);
            successCount++;
          } else {
            // Jika success false tapi tidak throw (jarang terjadi di API v2)
            console.warn(`[SyncManager] Gagal sinkronisasi pesanan ${entry.id}:`, res.error);
            await removeOrder(entry.id); // Hapus agar tidak memblokir antrean
          }
        } catch (err) {
          const errMsg = (err.message || '').toLowerCase();
          if (errMsg.includes('fetch') || errMsg.includes('network') || !navigator.onLine) {
            console.error(`[SyncManager] Network error saat sinkronisasi pesanan ${entry.id}:`, err);
            // Berhenti sinkronisasi jika kena error jaringan agar tidak berulang kali gagal
            break;
          } else {
            // Error server (misal: 400 Bad Request, validasi gagal, dll)
            // Hapus dari antrean agar tidak memblokir pesanan lain selamanya
            console.error(`[SyncManager] Pesanan ${entry.id} ditolak server, menghapus dari antrean:`, err);
            await removeOrder(entry.id);
          }
        }
      }

      if (successCount > 0) {
        toast(`${successCount} pesanan luring berhasil disinkronkan ke server.`, 'ok');
      }
    } catch (err) {
      console.error('[SyncManager] Error saat menjalankan sinkronisasi:', err);
    } finally {
      isSyncing = false;
      updateUI();
    }
  }

  // Update elemen UI (jika ada) untuk menunjukkan status offline dan jumlah antrean
  async function updateUI() {
    const indicator = document.getElementById('offline-indicator');
    const onlineIndicator = document.getElementById('online-indicator');

    if (navigator.onLine) {
      if (onlineIndicator) onlineIndicator.style.display = 'flex';
      if (!indicator) return;

      const orders = await getOrders();
      if (orders.length > 0) {
        indicator.style.display = 'flex';
        indicator.className = 'status-indicator sync';
        indicator.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Menyinkronkan ${orders.length} pesanan...`;
      } else {
        indicator.style.display = 'none';
      }
    } else {
      if (onlineIndicator) onlineIndicator.style.display = 'none';
      if (!indicator) return;

      const orders = await getOrders();
      indicator.style.display = 'flex';
      indicator.className = 'status-indicator offline';
      indicator.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.58 10.58a2 2 0 0 0 2.83 2.83"/><path d="M15.54 15.54a5 5 0 0 0-7.07-7.07"/><path d="M20.49 20.49a9 9 0 0 0-12.73-12.73"/><line x1="2" y1="2" x2="22" y2="22"/></svg> OFFLINE (${orders.length} antrean)`;
    }
  }

  return {
    init,
    saveOrder,
    getOrders,
    syncOrders,
    updateUI
  };
})();
