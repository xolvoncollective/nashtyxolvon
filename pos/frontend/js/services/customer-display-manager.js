/**
 * NASHTY OS - Customer Display Manager
 * Manages secondary screen for customer-facing order display
 */

export class CustomerDisplayManager {
  constructor() {
    this.displayWindow = null;
    this.isActive = false;
    this.idleTimeout = null;
    this.idleThreshold = 30000; // 30 seconds
    this.lastActivity = Date.now();
  }

  /**
   * Initialize customer display
   */
  async init() {
    // Check for multiple screens
    if ('getScreenDetails' in window) {
      try {
        const screens = await window.getScreenDetails();
        if (screens.screens.length > 1) {
          this.showEnablePrompt();
        }
      } catch (error) {
        console.log('Screen detection not supported or permission denied');
      }
    } else {
      // Fallback - manual trigger
      this.addManualTrigger();
    }
  }

  /**
   * Show enable prompt
   */
  showEnablePrompt() {
    const notification = document.createElement('div');
    notification.className = 'screen-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <h3>🖥️ Multiple Screens Detected</h3>
        <p>Enable customer display on second screen?</p>
        <button onclick="window.customerDisplay.enable()" class="btn-primary">Enable</button>
        <button onclick="this.closest('.screen-notification').remove()" class="btn-secondary">Not Now</button>
      </div>
    `;
    document.body.appendChild(notification);
  }

  /**
   * Add manual trigger button
   */
  addManualTrigger() {
    const trigger = document.createElement('button');
    trigger.id = 'customer-display-trigger';
    trigger.className = 'customer-display-trigger';
    trigger.innerHTML = '🖥️';
    trigger.title = 'Open Customer Display';
    trigger.onclick = () => this.enable();
    document.body.appendChild(trigger);
  }

  /**
   * Enable customer display
   */
  async enable() {
    if (this.displayWindow && !this.displayWindow.closed) {
      this.displayWindow.focus();
      return;
    }

    try {
      // Get second screen if available
      let targetScreen = null;
      if ('getScreenDetails' in window) {
        const screens = await window.getScreenDetails();
        if (screens.screens.length > 1) {
          // Use second screen
          targetScreen = screens.screens[1];
        }
      }

      // Window features
      const features = targetScreen 
        ? `left=${targetScreen.left},top=${targetScreen.top},width=${targetScreen.width},height=${targetScreen.height},fullscreen=yes`
        : 'width=1024,height=768,fullscreen=yes';

      // Open display window
      this.displayWindow = window.open(
        '/pos/frontend/customer-display.html',
        'customerDisplay',
        features
      );

      if (this.displayWindow) {
        this.isActive = true;
        this.displayWindow.onload = () => {
          this.syncCart();
          this.startIdleDetection();
        };

        // Handle window close
        this.displayWindow.onbeforeunload = () => {
          this.isActive = false;
          this.stopIdleDetection();
        };

        // Monitor for screen disconnect
        this.monitorScreens();
      }
    } catch (error) {
      console.error('Failed to open customer display:', error);
      alert('Failed to open customer display. Please check permissions.');
    }
  }

  /**
   * Disable customer display
   */
  disable() {
    if (this.displayWindow && !this.displayWindow.closed) {
      this.displayWindow.close();
    }
    this.isActive = false;
    this.stopIdleDetection();
  }

  /**
   * Sync cart to display
   */
  syncCart() {
    if (!this.isActive || !this.displayWindow || this.displayWindow.closed) {
      return;
    }

    const cart = window.cart || { items: [], subtotal: 0, tax: 0, total: 0 };
    
    this.displayWindow.postMessage({
      type: 'UPDATE_CART',
      cart: {
        items: cart.items,
        subtotal: cart.subtotal,
        tax: cart.tax,
        total: cart.total
      }
    }, '*');

    this.resetIdleTimer();
  }

  /**
   * Start idle detection
   */
  startIdleDetection() {
    this.resetIdleTimer();
  }

  /**
   * Reset idle timer
   */
  resetIdleTimer() {
    this.lastActivity = Date.now();
    
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      this.enterIdleMode();
    }, this.idleThreshold);
  }

  /**
   * Stop idle detection
   */
  stopIdleDetection() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  /**
   * Enter idle mode
   */
  enterIdleMode() {
    if (!this.isActive || !this.displayWindow || this.displayWindow.closed) {
      return;
    }

    this.displayWindow.postMessage({
      type: 'ENTER_IDLE',
      outletId: window.currentOutlet?.id
    }, '*');
  }

  /**
   * Exit idle mode
   */
  exitIdleMode() {
    if (!this.isActive || !this.displayWindow || this.displayWindow.closed) {
      return;
    }

    this.displayWindow.postMessage({
      type: 'EXIT_IDLE'
    }, '*');

    this.resetIdleTimer();
  }

  /**
   * Monitor screens for disconnect
   */
  async monitorScreens() {
    if (!('getScreenDetails' in window)) return;

    try {
      const screens = await window.getScreenDetails();
      screens.addEventListener('screenschange', () => {
        this.handleScreensChange();
      });
    } catch (error) {
      console.error('Screen monitoring error:', error);
    }
  }

  /**
   * Handle screens change
   */
  async handleScreensChange() {
    if (!('getScreenDetails' in window)) return;

    try {
      const screens = await window.getScreenDetails();
      if (screens.screens.length < 2 && this.isActive) {
        this.disable();
        alert('Second screen disconnected. Customer display closed.');
      }
    } catch (error) {
      console.error('Screen change handling error:', error);
    }
  }

  /**
   * Update display settings
   */
  updateSettings(settings) {
    if (!this.isActive || !this.displayWindow || this.displayWindow.closed) {
      return;
    }

    this.displayWindow.postMessage({
      type: 'UPDATE_SETTINGS',
      settings
    }, '*');
  }
}
