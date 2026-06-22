/**
 * NASHTY OS - Customer Display Manager
 * Manages secondary display for customers
 */

class CustomerDisplayManager {
  constructor() {
    this.customerWindow = null;
    this.idleTimeout = null;
    this.idleDelay = 30 * 1000; // 30 seconds
    this.isEnabled = false;
    this.promoImages = [];
    this.currentSlide = 0;
    this.slideshowInterval = null;
  }

  /**
   * Initialize and detect available screens
   */
  async initialize() {
    const screens = await this.detectScreens();
    
    if (screens.length > 1) {
      // Multiple screens detected
      const enable = confirm(
        `🖥️ Monitor kedua terdeteksi!\n\nApakah Anda ingin mengaktifkan Customer Display?\n\n` +
        `Monitor 1 (POS): ${screens[0].width}x${screens[0].height}\n` +
        `Monitor 2 (Customer): ${screens[1].width}x${screens[1].height}`
      );
      
      if (enable) {
        await this.enable();
      }
    }
    
    return screens;
  }

  /**
   * Detect available screens using Window Management API
   */
  async detectScreens() {
    if ('getScreenDetails' in window) {
      try {
        const permission = await navigator.permissions.query({ name: 'window-management' });
        
        if (permission.state === 'prompt') {
          // Request permission
          try {
            const screenDetails = await window.getScreenDetails();
            return screenDetails.screens;
          } catch (error) {
            console.warn('Permission denied for Window Management API:', error);
          }
        } else if (permission.state === 'granted') {
          const screenDetails = await window.getScreenDetails();
          return screenDetails.screens;
        }
      } catch (error) {
        console.warn('Window Management API not available:', error);
      }
    }

    // Fallback: return primary screen only
    return [{
      isPrimary: true,
      width: screen.width,
      height: screen.height,
      availLeft: 0,
      availTop: 0,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight
    }];
  }

  /**
   * Enable customer display
   */
  async enable() {
    const screens = await this.detectScreens();
    
    if (screens.length < 2) {
      const useManual = confirm(
        '⚠️ Monitor kedua tidak terdeteksi.\n\n' +
        'Apakah Anda ingin membuka Customer Display di window baru?'
      );
      if (!useManual) return false;
    }

    // Use second screen if available, otherwise primary
    const targetScreen = screens.length > 1 ? screens[1] : screens[0];
    const left = targetScreen.availLeft || 0;
    const top = targetScreen.availTop || 0;
    const width = targetScreen.availWidth || 1024;
    const height = targetScreen.availHeight || 768;

    // Open customer display window
    this.customerWindow = window.open(
      'customer-display.html',
      'CustomerDisplay',
      `left=${left},top=${top},width=${width},height=${height}`
    );

    if (!this.customerWindow) {
      alert('❌ Gagal membuka customer display.\n\nSilakan periksa popup blocker di browser Anda.');
      return false;
    }

    // Wait for window to load
    this.customerWindow.addEventListener('load', () => {
      this.initializeDisplay();
    });

    // Monitor window close
    const checkClosed = setInterval(() => {
      if (this.customerWindow && this.customerWindow.closed) {
        clearInterval(checkClosed);
        this.disable();
        console.log('Customer display window closed');
      }
    }, 1000);

    this.isEnabled = true;
    
    // Try to enter fullscreen after user interaction
    setTimeout(() => {
      if (this.customerWindow && !this.customerWindow.closed) {
        this.customerWindow.postMessage({ type: 'REQUEST_FULLSCREEN' }, '*');
      }
    }, 500);

    console.log('✅ Customer display enabled');
    return true;
  }

  /**
   * Initialize display with settings and branding
   */
  initializeDisplay() {
    if (!this.customerWindow || this.customerWindow.closed) return;

    // Load and apply settings
    const settings = JSON.parse(localStorage.getItem('displaySettings') || '{}');
    this.customerWindow.postMessage({ 
      type: 'SETTINGS_UPDATE', 
      settings 
    }, '*');

    // Load promo images from Supabase Storage
    this.loadPromoImages();

    // Start with idle view
    this.customerWindow.postMessage({ 
      type: 'SHOW_IDLE' 
    }, '*');

    console.log('Customer display initialized');
  }

  /**
   * Load promotional images from Supabase Storage
   */
  async loadPromoImages() {
    try {
      // TODO: Replace with actual Supabase Storage call
      // For now, use placeholder images
      this.promoImages = [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'
      ];
      
      // Send to customer display
      if (this.customerWindow && !this.customerWindow.closed) {
        this.customerWindow.postMessage({
          type: 'PROMO_IMAGES',
          images: this.promoImages
        }, '*');
      }
    } catch (error) {
      console.error('Failed to load promo images:', error);
    }
  }

  /**
   * Sync cart to customer display
   */
  syncCart(cart) {
    if (!this.isEnabled || !this.customerWindow || this.customerWindow.closed) {
      return;
    }

    // Clear idle timeout
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }

    // Send cart update
    this.customerWindow.postMessage({
      type: 'CART_UPDATE',
      cart: {
        items: cart.items || [],
        subtotal: cart.subtotal || 0,
        tax: cart.tax || 0,
        grandTotal: cart.total || cart.grandTotal || 0
      }
    }, '*');

    // Reset idle timer if cart has items
    if (cart.items && cart.items.length > 0) {
      this.idleTimeout = setTimeout(() => {
        this.enterIdleMode();
      }, this.idleDelay);
    } else {
      // Empty cart, show idle immediately
      this.enterIdleMode();
    }
  }

  /**
   * Enter idle mode (slideshow)
   */
  enterIdleMode() {
    if (!this.isEnabled || !this.customerWindow || this.customerWindow.closed) {
      return;
    }

    this.customerWindow.postMessage({
      type: 'SHOW_IDLE'
    }, '*');

    console.log('Customer display entered idle mode');
  }

  /**
   * Exit idle mode
   */
  exitIdleMode() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  /**
   * Update branding and colors
   */
  updateBranding(settings) {
    if (!this.isEnabled || !this.customerWindow || this.customerWindow.closed) {
      return;
    }

    this.customerWindow.postMessage({
      type: 'SETTINGS_UPDATE',
      settings
    }, '*');

    // Save to localStorage
    localStorage.setItem('displaySettings', JSON.stringify(settings));
  }

  /**
   * Disable customer display
   */
  disable() {
    if (this.customerWindow && !this.customerWindow.closed) {
      this.customerWindow.close();
    }
    
    this.customerWindow = null;
    this.isEnabled = false;
    
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
    
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
      this.slideshowInterval = null;
    }

    console.log('Customer display disabled');
  }

  /**
   * Check if customer display is open
   */
  isOpen() {
    return this.isEnabled && this.customerWindow && !this.customerWindow.closed;
  }

  /**
   * Toggle customer display on/off
   */
  async toggle() {
    if (this.isOpen()) {
      this.disable();
      return false;
    } else {
      return await this.enable();
    }
  }
}

window.CustomerDisplayManager = new CustomerDisplayManager();
console.log('✅ CustomerDisplayManager loaded');
