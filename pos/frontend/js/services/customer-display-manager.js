/**
 * NASHTY OS - Customer Display Manager
 * Manages secondary display for customers
 */

class CustomerDisplayManager {
  constructor() {
    this.customerWindow = null;
    this.idleTimeout = null;
    this.idleDelay = 30 * 1000; // 30 seconds
  }

  async detectScreens() {
    if ('getScreenDetails' in window) {
      try {
        const permission = await navigator.permissions.query({ name: 'window-management' });
        if (permission.state === 'granted') {
          const screenDetails = await window.getScreenDetails();
          return screenDetails.screens;
        }
      } catch (error) {
        console.warn('Window Management API not available:', error);
      }
    }

    return [{
      isPrimary: true,
      width: screen.width,
      height: screen.height
    }];
  }

  async openCustomerDisplay() {
    const screens = await this.detectScreens();
    
    if (screens.length < 2) {
      const useManual = confirm('Monitor kedua tidak terdeteksi. Buka di window baru?');
      if (!useManual) return false;
    }

    const secondaryScreen = screens.length > 1 ? screens[1] : screens[0];
    const left = secondaryScreen.availLeft || 0;
    const top = secondaryScreen.availTop || 0;
    const width = secondaryScreen.availWidth || 1024;
    const height = secondaryScreen.availHeight || 768;

    this.customerWindow = window.open(
      '/customer-display.html',
      'CustomerDisplay',
      `left=${left},top=${top},width=${width},height=${height},fullscreen=yes`
    );

    if (!this.customerWindow) {
      alert('Gagal membuka customer display. Periksa popup blocker.');
      return false;
    }

    this.customerWindow.addEventListener('load', () => {
      this.initializeCustomerDisplay();
    });

    return true;
  }

  initializeCustomerDisplay() {
    if (!this.customerWindow) return;

    const settings = window.outletSettings || {};
    const doc = this.customerWindow.document;
    doc.body.style.backgroundColor = settings.displayBackgroundColor || '#ffffff';
    doc.body.style.color = settings.displayTextColor || '#000000';

    this.showIdleScreen();
  }

  syncCartToDisplay(cart) {
    if (!this.customerWindow) return;

    this.resetIdleTimer();

    if (cart.items.length === 0) {
      this.showIdleScreen();
      return;
    }

    const doc = this.customerWindow.document;
    const container = doc.getElementById('display-content');
    
    if (!container) return;

    const itemsHtml = cart.items.map(item => `
      <div class="display-item">
        <div class="item-name">${item.name}</div>
        <div class="item-details">
          <span>${item.quantity}x</span>
          <span>Rp ${item.price.toLocaleString()}</span>
          <span>Rp ${(item.price * item.quantity).toLocaleString()}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="cart-view">
        <div class="items-list">${itemsHtml}</div>
        <div class="cart-totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>Rp ${cart.subtotal.toLocaleString()}</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>Rp ${cart.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;
  }

  showIdleScreen() {
    if (!this.customerWindow) return;

    const doc = this.customerWindow.document;
    const container = doc.getElementById('display-content');
    
    if (!container) return;

    container.innerHTML = `
      <div class="idle-screen">
        <img src="/logo.png" class="idle-logo" />
        <div class="idle-tagline">Selamat Datang!</div>
      </div>
    `;
  }

  resetIdleTimer() {
    if (this.idleTimeout) clearTimeout(this.idleTimeout);
    this.idleTimeout = setTimeout(() => this.showIdleScreen(), this.idleDelay);
  }

  closeCustomerDisplay() {
    if (this.customerWindow) {
      this.customerWindow.close();
      this.customerWindow = null;
    }
    if (this.idleTimeout) clearTimeout(this.idleTimeout);
  }

  isOpen() {
    return this.customerWindow && !this.customerWindow.closed;
  }
}

window.CustomerDisplayManager = new CustomerDisplayManager();
console.log('✅ CustomerDisplayManager loaded');
