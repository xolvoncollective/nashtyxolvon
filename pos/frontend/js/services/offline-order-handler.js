/**
 * Offline Order Handler
 * Integrates offline capabilities into POS order creation flow
 */

class OfflineOrderHandler {
  constructor(db, cacheManager, offlineQueue, connectionMonitor) {
    this.db = db;
    this.cacheManager = cacheManager;
    this.offlineQueue = offlineQueue;
    this.connectionMonitor = connectionMonitor;
  }

  /**
   * Check if we're currently offline
   */
  isOffline() {
    return !navigator.onLine;
  }

  /**
   * Create order (handles both online and offline)
   */
  async createOrder(orderData) {
    const startTime = performance.now();

    try {
      if (this.isOffline()) {
        // Offline mode - queue order
        const order = await this.createOfflineOrder(orderData);
        const duration = performance.now() - startTime;
        
        console.log(`Order created offline in ${duration.toFixed(2)}ms`);
        
        // Show offline indicator
        this.showOfflineBanner();
        
        return {
          success: true,
          offline: true,
          order,
          localId: order.localId,
          message: 'Order saved locally. Will sync when online.'
        };
      } else {
        // Online mode - send to server
        const order = await this.createOnlineOrder(orderData);
        const duration = performance.now() - startTime;
        
        console.log(`Order created online in ${duration.toFixed(2)}ms`);
        
        return {
          success: true,
          offline: false,
          order,
          message: 'Order created successfully.'
        };
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * Create order in offline mode
   */
  async createOfflineOrder(orderData) {
    // Enrich order with metadata
    const order = {
      ...orderData,
      localId: null, // Will be assigned by queue
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      offline: true,
      synced: false
    };

    // Get current user
    const userId = this.getCurrentUserId();
    const outletId = this.getCurrentOutletId();

    // Queue order with encryption
    const localId = await this.offlineQueue.enqueue(userId, outletId, order);
    
    order.localId = localId;

    // Update UI
    await this.connectionMonitor.updateUI();

    return order;
  }

  /**
   * Create order in online mode
   */
  async createOnlineOrder(orderData) {
    // Send to server via API
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getSessionToken()}`
      },
      body: JSON.stringify({
        ...orderData,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Search products (with offline fallback)
   */
  async searchProducts(query) {
    const startTime = performance.now();

    try {
      if (this.isOffline()) {
        // Search in cached data
        const results = await this.cacheManager.searchCachedProducts(query);
        const duration = performance.now() - startTime;
        
        console.log(`Product search (offline) completed in ${duration.toFixed(2)}ms`);
        
        return results;
      } else {
        // Search via API (will also update cache)
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${this.getSessionToken()}`
          }
        });

        if (!response.ok) {
          // Fallback to cache on error
          return await this.cacheManager.searchCachedProducts(query);
        }

        const results = await response.json();
        const duration = performance.now() - startTime;
        
        console.log(`Product search (online) completed in ${duration.toFixed(2)}ms`);
        
        return results;
      }
    } catch (error) {
      console.error('Search failed, falling back to cache:', error);
      return await this.cacheManager.searchCachedProducts(query);
    }
  }

  /**
   * Get product details (with offline fallback)
   */
  async getProduct(productId) {
    try {
      if (this.isOffline()) {
        return await this.cacheManager.getCachedProduct(productId);
      } else {
        // Try API first
        const response = await fetch(`/api/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${this.getSessionToken()}`
          }
        });

        if (!response.ok) {
          // Fallback to cache
          return await this.cacheManager.getCachedProduct(productId);
        }

        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get product, falling back to cache:', error);
      return await this.cacheManager.getCachedProduct(productId);
    }
  }

  /**
   * Add product to cart (fast offline operation)
   */
  async addToCart(cart, productId, quantity = 1) {
    const startTime = performance.now();

    // Get product details
    const product = await this.getProduct(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    // Add to cart
    const cartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
      subtotal: product.price * quantity
    };

    cart.items.push(cartItem);
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);

    const duration = performance.now() - startTime;
    console.log(`Add to cart completed in ${duration.toFixed(2)}ms`);

    return cart;
  }

  /**
   * Show offline mode banner
   */
  showOfflineBanner() {
    let banner = document.getElementById('offline-banner');
    
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.className = 'offline-banner';
      banner.innerHTML = `
        <div class="offline-banner-content">
          <span class="offline-icon">⚠️</span>
          <span class="offline-text">You are working offline. Orders will be synced when connection is restored.</span>
          <button class="offline-banner-close">&times;</button>
        </div>
      `;
      
      document.body.insertAdjacentElement('afterbegin', banner);

      banner.querySelector('.offline-banner-close').addEventListener('click', () => {
        banner.remove();
      });
    }

    banner.style.display = 'block';
  }

  /**
   * Hide offline mode banner
   */
  hideOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    return window.sessionStorage.getItem('userId') || window.localStorage.getItem('userId');
  }

  /**
   * Get current outlet ID
   */
  getCurrentOutletId() {
    return window.sessionStorage.getItem('currentOutletId') || window.localStorage.getItem('currentOutletId');
  }

  /**
   * Get session token
   */
  getSessionToken() {
    return window.sessionStorage.getItem('sessionToken') || window.localStorage.getItem('sessionToken');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    this.connectionMonitor.showNotification(message, type);
  }
}

// Expose to window
if (typeof window !== 'undefined') {
  window.OfflineOrderHandler = OfflineOrderHandler;
}
