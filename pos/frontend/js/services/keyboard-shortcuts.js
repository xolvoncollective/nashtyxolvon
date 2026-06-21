/**
 * NASHTY OS - Keyboard Shortcut Handler
 * Manages keyboard shortcuts and executes actions
 */

class KeyboardShortcutHandler {
  constructor(db, stateManager) {
    this.db = db;
    this.stateManager = stateManager;
    this.shortcuts = new Map();
    this.systemShortcuts = new Set(['F5', 'Ctrl+R', 'Ctrl+W', 'Alt+F4']);
    this.quantityBuffer = '';
    this.quantityTimeout = null;
    this.selectedCartIndex = -1;
  }

  async initialize(userId) {
    await this.loadShortcuts(userId);
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    if (this.shortcuts.size === 0) {
      await this.loadDefaultShortcuts(userId);
    }
  }

  async loadShortcuts(userId) {
    const tx = this.db.transaction('keyboard_shortcuts', 'readonly');
    const store = tx.objectStore('keyboard_shortcuts');
    const index = store.index('userId');
    
    const shortcuts = await index.getAll(userId);

    this.shortcuts.clear();
    shortcuts.forEach(shortcut => {
      this.shortcuts.set(shortcut.keyCombo, {
        action: shortcut.action,
        productId: shortcut.productId,
        isCustom: shortcut.isCustom
      });
    });
  }

  async loadDefaultShortcuts(userId) {
    const defaults = [
      { keyCombo: 'Ctrl+P', action: 'openPayment' },
      { keyCombo: 'Ctrl+S', action: 'saveDraft' },
      { keyCombo: 'Escape', action: 'closeDialog' },
      { keyCombo: 'Alt+F', action: 'focusSearch' },
      { keyCombo: 'Ctrl+D', action: 'openDrafts' },
      { keyCombo: 'Ctrl+N', action: 'newOrder' },
      { keyCombo: 'Ctrl+H', action: 'openHistory' },
      { keyCombo: 'Delete', action: 'deleteCartItem' },
      { keyCombo: 'Enter', action: 'editCartItem' },
      { keyCombo: '+', action: 'incrementQuantity' },
      { keyCombo: '-', action: 'decrementQuantity' },
      { keyCombo: 'ArrowUp', action: 'selectPreviousCartItem' },
      { keyCombo: 'ArrowDown', action: 'selectNextCartItem' },
      { keyCombo: 'Ctrl+A', action: 'selectAllCartItems' }
    ];

    const tx = this.db.transaction('keyboard_shortcuts', 'readwrite');
    const store = tx.objectStore('keyboard_shortcuts');

    for (const shortcut of defaults) {
      await store.put({
        userId,
        keyCombo: shortcut.keyCombo,
        action: shortcut.action,
        productId: null,
        isCustom: false
      });
    }

    await this.loadShortcuts(userId);
  }

  handleKeyDown(event) {
    const keyCombo = this.getKeyCombo(event);

    // Handle number keys for quantity
    if (!event.ctrlKey && !event.altKey && /^[0-9]$/.test(event.key)) {
      this.handleQuantityKey(event.key);
      return;
    }

    if (this.quantityBuffer && !/^[0-9]$/.test(event.key)) {
      const isFunctionKey = /^F([1-9]|1[0-2])$/.test(event.key);
      if (!isFunctionKey) {
        this.clearQuantityBuffer();
      }
    }

    const shortcut = this.shortcuts.get(keyCombo);
    
    if (shortcut) {
      event.preventDefault();
      this.executeAction(shortcut, event);
    }
  }

  getKeyCombo(event) {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    
    const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    parts.push(key);
    
    return parts.join('+');
  }

  executeAction(shortcut, event) {
    const quantity = this.consumeQuantity();

    switch (shortcut.action) {
      case 'openPayment':
        if (window.hasItemsInCart?.()) window.openPaymentDialog?.();
        break;
      case 'saveDraft':
        if (window.hasItemsInCart?.()) window.saveDraft?.();
        break;
      case 'closeDialog':
        window.closeCurrentDialog?.();
        break;
      case 'focusSearch':
        document.getElementById('product-search')?.focus();
        break;
      case 'openDrafts':
        window.openDraftsList?.();
        break;
      case 'newOrder':
        if (window.hasItemsInCart?.() && confirm('Clear cart dan mulai order baru?')) {
          window.clearCart?.();
        }
        break;
      case 'openHistory':
        window.openOrderHistory?.();
        break;
      case 'addProduct':
        if (shortcut.productId) {
          window.addProductToCart?.(shortcut.productId, quantity || 1);
        }
        break;
    }
  }

  handleQuantityKey(digit) {
    this.quantityBuffer += digit;
    
    if (parseInt(this.quantityBuffer, 10) > 999) {
      this.quantityBuffer = '999';
      this.showWarning('Maksimal kuantitas 999');
    }

    this.showQuantityIndicator(this.quantityBuffer);

    if (this.quantityTimeout) clearTimeout(this.quantityTimeout);
    this.quantityTimeout = setTimeout(() => this.clearQuantityBuffer(), 5000);
  }

  consumeQuantity() {
    const quantity = parseInt(this.quantityBuffer, 10) || 0;
    this.clearQuantityBuffer();
    return quantity;
  }

  clearQuantityBuffer() {
    this.quantityBuffer = '';
    this.hideQuantityIndicator();
    if (this.quantityTimeout) {
      clearTimeout(this.quantityTimeout);
      this.quantityTimeout = null;
    }
  }

  showQuantityIndicator(quantity) {
    let indicator = document.getElementById('quantity-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'quantity-indicator';
      indicator.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#4CAF50;color:white;padding:15px 30px;border-radius:8px;font-size:32px;font-weight:bold;z-index:10000;box-shadow:0 4px 8px rgba(0,0,0,0.2);';
      document.body.appendChild(indicator);
    }
    indicator.textContent = quantity;
    indicator.style.display = 'block';
  }

  hideQuantityIndicator() {
    const indicator = document.getElementById('quantity-indicator');
    if (indicator) indicator.style.display = 'none';
  }

  showWarning(message) {
    if (window.toast) window.toast(message, 'warn');
  }
}

// Initialize
window.KeyboardShortcutHandler = KeyboardShortcutHandler;
console.log('✅ KeyboardShortcutHandler loaded');
