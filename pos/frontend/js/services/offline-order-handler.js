/**
 * NASHTY OS - Offline Order Handler
 * Wraps order creation with offline queue support
 */

class OfflineOrderHandler {
  constructor() {
    this.processing = false;
  }

  /**
   * Create order - online or offline
   */
  async createOrder(orderData) {
    if (this.processing) {
      throw new Error('Order already being processed');
    }

    this.processing = true;

    try {
      if (navigator.onLine) {
        // Try online first
        return await this.createOnlineOrder(orderData);
      } else {
        // Offline - queue it
        return await this.createOfflineOrder(orderData);
      }
    } catch (error) {
      // If online fails, fallback to offline
      if (navigator.onLine) {
        console.warn('Online order failed, falling back to offline queue:', error);
        return await this.createOfflineOrder(orderData);
      }
      throw error;
    } finally {
      this.processing = false;
    }
  }

  async createOnlineOrder(orderData) {
    const token = sessionStorage.getItem('token');
    const apiBase = window.API_BASE || 'http://localhost:3099';

    const response = await fetch(`${apiBase}/api/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Order created online:', result.order?.order_number);
    
    return {
      success: true,
      order: result.order,
      offline: false
    };
  }

  async createOfflineOrder(orderData) {
    if (!window.OfflineSyncManager) {
      throw new Error('Offline sync manager not available');
    }

    const result = await window.OfflineSyncManager.queueOrder(orderData);
    
    // Generate temporary order number for receipt
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-4);
    const tempOrderNumber = `OFFLINE-${dateStr}-${timestamp}`;

    console.log(`📴 Order queued offline: ${tempOrderNumber}`);
    
    // Show offline notification
    this.showOfflineNotification(tempOrderNumber);

    return {
      success: true,
      order: {
        id: result.tempId,
        order_number: tempOrderNumber,
        ...orderData,
        created_at: new Date().toISOString(),
        offline: true
      },
      offline: true
    };
  }

  showOfflineNotification(orderNumber) {
    if (typeof window.showToast === 'function') {
      window.showToast(
        `📴 Order ${orderNumber} disimpan offline. Akan disinkronisasi saat online.`,
        'warning'
      );
    }
  }

  /**
   * Search products - online or offline
   */
  async searchProducts(query) {
    if (!query) return [];

    try {
      if (navigator.onLine) {
        // Try online first
        return await this.searchProductsOnline(query);
      } else {
        // Offline - search cache
        return await this.searchProductsOffline(query);
      }
    } catch (error) {
      // Fallback to offline if online fails
      if (navigator.onLine) {
        console.warn('Online search failed, trying offline:', error);
        return await this.searchProductsOffline(query);
      }
      return [];
    }
  }

  async searchProductsOnline(query) {
    const token = sessionStorage.getItem('token');
    const outletId = sessionStorage.getItem('currentOutletId');
    const apiBase = window.API_BASE || 'http://localhost:3099';

    const response = await fetch(
      `${apiBase}/api/products?outletId=${outletId}&search=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return data.products || data.data || [];
  }

  async searchProductsOffline(query) {
    if (!window.DatabaseSchema) {
      return [];
    }

    const startTime = Date.now();
    const results = await window.DatabaseSchema.searchProducts(query);
    const duration = Date.now() - startTime;
    
    console.log(`🔍 Offline search: "${query}" → ${results.length} results (${duration}ms)`);
    
    return results;
  }

  /**
   * Get product by ID - online or offline
   */
  async getProduct(productId) {
    try {
      if (navigator.onLine) {
        return await this.getProductOnline(productId);
      } else {
        return await this.getProductOffline(productId);
      }
    } catch (error) {
      if (navigator.onLine) {
        return await this.getProductOffline(productId);
      }
      throw error;
    }
  }

  async getProductOnline(productId) {
    const token = sessionStorage.getItem('token');
    const apiBase = window.API_BASE || 'http://localhost:3099';

    const response = await fetch(`${apiBase}/api/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return data.product || data.data;
  }

  async getProductOffline(productId) {
    if (!window.DatabaseSchema) {
      throw new Error('Database not available');
    }

    return await window.DatabaseSchema.getProduct(productId);
  }
}

// Initialize and export
window.OfflineOrderHandler = new OfflineOrderHandler();
console.log('✅ OfflineOrderHandler loaded');
