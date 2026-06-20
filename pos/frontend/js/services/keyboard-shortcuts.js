/**
 * NASHTY OS - Keyboard Shortcuts Handler
 * Manages keyboard shortcuts for POS operations
 */

export class KeyboardShortcutHandler {
  constructor() {
    this.shortcuts = new Map();
    this.defaultShortcuts = this.getDefaultShortcuts();
    this.quantityBuffer = '';
    this.quantityTimeout = null;
    this.userPreferences = null;
    this.systemShortcuts = ['F5', 'Ctrl+R', 'Ctrl+W', 'Ctrl+T', 'Ctrl+Q'];
  }

  /**
   * Initialize keyboard shortcuts
   */
  async init(userId) {
    // Load user preferences from IndexedDB
    await this.loadUserPreferences(userId);
    
    // Register default shortcuts
    this.registerDefaultShortcuts();
    
    // Register custom shortcuts
    this.registerCustomShortcuts();
    
    // Add global event listener
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    console.log('Keyboard shortcuts initialized');
  }

  /**
   * Get default shortcuts
   */
  getDefaultShortcuts() {
    return {
      // Navigation
      'Ctrl+P': { action: 'openPayment', description: 'Open payment dialog' },
      'Ctrl+S': { action: 'saveDraft', description: 'Save cart as draft' },
      'Ctrl+N': { action: 'newOrder', description: 'Clear cart, start new order' },
      'Ctrl+D': { action: 'showDrafts', description: 'Show saved drafts' },
      'Ctrl+H': { action: 'showHistory', description: 'Show order history' },
      'Alt+F': { action: 'focusSearch', description: 'Focus product search' },
      'Escape': { action: 'cancelDialog', description: 'Close dialog/cancel' },
      
      // Cart manipulation
      'ArrowUp': { action: 'selectPreviousItem', description: 'Select previous cart item' },
      'ArrowDown': { action: 'selectNextItem', description: 'Select next cart item' },
      'Delete': { action: 'removeSelectedItem', description: 'Remove selected item' },
      'Plus': { action: 'incrementQuantity', description: 'Increase quantity by 1' },
      'Minus': { action: 'decrementQuantity', description: 'Decrease quantity by 1' },
      'Enter': { action: 'openModifiers', description: 'Open modifiers for selected item' },
      'Ctrl+A': { action: 'selectAllItems', description: 'Select all cart items' },
      
      // Function keys (F1-F12) - product shortcuts
      'F1': { action: 'addProduct', description: 'Add assigned product', productSlot: 1 },
      'F2': { action: 'addProduct', description: 'Add assigned product', productSlot: 2 },
      'F3': { action: 'addProduct', description: 'Add assigned product', productSlot: 3 },
      'F4': { action: 'addProduct', description: 'Add assigned product', productSlot: 4 },
      'F5': { action: 'addProduct', description: 'Add assigned product', productSlot: 5 },
      'F6': { action: 'addProduct', description: 'Add assigned product', productSlot: 6 },
      'F7': { action: 'addProduct', description: 'Add assigned product', productSlot: 7 },
      'F8': { action: 'addProduct', description: 'Add assigned product', productSlot: 8 },
      'F9': { action: 'addProduct', description: 'Add assigned product', productSlot: 9 },
      'F10': { action: 'addProduct', description: 'Add assigned product', productSlot: 10 },
      'F11': { action: 'addProduct', description: 'Add assigned product', productSlot: 11 },
      'F12': { action: 'addProduct', description: 'Add assigned product', productSlot: 12 },
      
      // Shift+Function keys - assign products
      'Shift+F1': { action: 'assignProduct', description: 'Assign product to F1', productSlot: 1 },
      'Shift+F2': { action: 'assignProduct', description: 'Assign product to F2', productSlot: 2 },
      'Shift+F3': { action: 'assignProduct', description: 'Assign product to F3', productSlot: 3 },
      'Shift+F4': { action: 'assignProduct', description: 'Assign product to F4', productSlot: 4 },
      'Shift+F5': { action: 'assignProduct', description: 'Assign product to F5', productSlot: 5 },
      'Shift+F6': { action: 'assignProduct', description: 'Assign product to F6', productSlot: 6 },
      'Shift+F7': { action: 'assignProduct', description: 'Assign product to F7', productSlot: 7 },
      'Shift+F8': { action: 'assignProduct', description: 'Assign product to F8', productSlot: 8 },
      'Shift+F9': { action: 'assignProduct', description: 'Assign product to F9', productSlot: 9 },
      'Shift+F10': { action: 'assignProduct', description: 'Assign product to F10', productSlot: 10 },
      'Shift+F11': { action: 'assignProduct', description: 'Assign product to F11', productSlot: 11 },
      'Shift+F12': { action: 'assignProduct', description: 'Assign product to F12', productSlot: 12 }
    };
  }

  /**
   * Handle keydown events
   */
  handleKeyDown(e) {
    // Get key combination
    const keyCombo = this.getKeyCombo(e);
    
    // Check if it's a number key (0-9)
    if (/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
      // Check if focused on input
      if (this.isInputFocused()) return;
      
      this.handleQuantityInput(e.key);
      e.preventDefault();
      return;
    }
    
    // Check if shortcut exists
    const shortcut = this.shortcuts.get(keyCombo);
    if (!shortcut) return;
    
    // Prevent default for registered shortcuts
    e.preventDefault();
    
    // Execute action
    this.executeAction(shortcut, e);
    
    // Log usage
    this.logShortcutUsage(keyCombo, shortcut.action);
  }

  /**
   * Get key combination string
   */
  getKeyCombo(e) {
    const parts = [];
    
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    
    let key = e.key;
    
    // Normalize key names
    if (key === ' ') key = 'Space';
    if (key === '+') key = 'Plus';
    if (key === '-') key = 'Minus';
    
    parts.push(key);
    
    return parts.join('+');
  }

  /**
   * Execute shortcut action
   */
  async executeAction(shortcut, event) {
    const { action, productSlot } = shortcut;
    
    try {
      switch (action) {
        case 'openPayment':
          await this.openPaymentDialog();
          break;
        case 'saveDraft':
          await this.saveDraft();
          break;
        case 'newOrder':
          await this.newOrder();
          break;
        case 'showDrafts':
          await this.showDrafts();
          break;
        case 'showHistory':
          await this.showHistory();
          break;
        case 'focusSearch':
          this.focusSearch();
          break;
        case 'cancelDialog':
          this.cancelDialog();
          break;
        case 'selectPreviousItem':
          this.selectPreviousItem();
          break;
        case 'selectNextItem':
          this.selectNextItem();
          break;
        case 'removeSelectedItem':
          await this.removeSelectedItem();
          break;
        case 'incrementQuantity':
          this.incrementQuantity();
          break;
        case 'decrementQuantity':
          this.decrementQuantity();
          break;
        case 'openModifiers':
          this.openModifiers();
          break;
        case 'selectAllItems':
          this.selectAllItems();
          break;
        case 'addProduct':
          await this.addProductFromSlot(productSlot);
          break;
        case 'assignProduct':
          await this.assignProductToSlot(productSlot);
          break;
      }
    } catch (error) {
      console.error('Shortcut execution error:', error);
      window.showToast?.('Shortcut execution failed', 'error');
    }
  }

  /**
   * Handle quantity input
   */
  handleQuantityInput(digit) {
    this.quantityBuffer += digit;
    
    // Cap at 999
    if (parseInt(this.quantityBuffer) > 999) {
      this.quantityBuffer = '999';
      window.showToast?.('Maximum quantity is 999', 'warning');
    }
    
    // Show quantity indicator
    this.showQuantityIndicator(this.quantityBuffer);
    
    // Clear timeout
    if (this.quantityTimeout) {
      clearTimeout(this.quantityTimeout);
    }
    
    // Set timeout to clear after 5 seconds
    this.quantityTimeout = setTimeout(() => {
      this.clearQuantityBuffer();
    }, 5000);
  }

  /**
   * Get and consume quantity buffer
   */
  getQuantity() {
    const qty = parseInt(this.quantityBuffer) || 1;
    this.clearQuantityBuffer();
    return qty;
  }

  /**
   * Clear quantity buffer
   */
  clearQuantityBuffer() {
    this.quantityBuffer = '';
    this.hideQuantityIndicator();
    if (this.quantityTimeout) {
      clearTimeout(this.quantityTimeout);
      this.quantityTimeout = null;
    }
  }

  /**
   * Show quantity indicator
   */
  showQuantityIndicator(quantity) {
    let indicator = document.getElementById('quantity-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'quantity-indicator';
      indicator.className = 'quantity-indicator';
      document.body.appendChild(indicator);
    }
    indicator.textContent = `Qty: ${quantity}`;
    indicator.style.display = 'block';
  }

  /**
   * Hide quantity indicator
   */
  hideQuantityIndicator() {
    const indicator = document.getElementById('quantity-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  /**
   * Check if input is focused
   */
  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    );
  }

  /**
   * Register default shortcuts
   */
  registerDefaultShortcuts() {
    for (const [keyCombo, config] of Object.entries(this.defaultShortcuts)) {
      this.shortcuts.set(keyCombo, config);
    }
  }

  /**
   * Register custom shortcuts
   */
  registerCustomShortcuts() {
    if (!this.userPreferences) return;
    
    for (const pref of this.userPreferences) {
      if (pref.isCustom) {
        this.shortcuts.set(pref.keyCombo, {
          action: pref.action,
          description: pref.description || '',
          productId: pref.productId
        });
      }
    }
  }

  /**
   * Load user preferences from IndexedDB
   */
  async loadUserPreferences(userId) {
    const db = await window.dbPromise;
    const tx = db.transaction('keyboard_shortcuts', 'readonly');
    const store = tx.objectStore('keyboard_shortcuts');
    const index = store.index('userId');
    
    this.userPreferences = await index.getAll(userId);
    await tx.done;
  }

  /**
   * Show shortcuts reference overlay
   */
  showShortcutsReference() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-content">
        <h2>Keyboard Shortcuts Reference</h2>
        <div class="shortcuts-grid">
          ${this.generateShortcutsHTML()}
        </div>
        <button onclick="this.closest('.shortcuts-modal').remove()">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Generate shortcuts HTML
   */
  generateShortcutsHTML() {
    const groups = {
      'Navigation': ['openPayment', 'saveDraft', 'newOrder', 'showDrafts', 'showHistory', 'focusSearch', 'cancelDialog'],
      'Cart': ['selectPreviousItem', 'selectNextItem', 'removeSelectedItem', 'incrementQuantity', 'decrementQuantity', 'openModifiers', 'selectAllItems'],
      'Products': ['addProduct', 'assignProduct']
    };
    
    let html = '';
    for (const [groupName, actions] of Object.entries(groups)) {
      html += `<div class="shortcut-group"><h3>${groupName}</h3>`;
      for (const [keyCombo, config] of this.shortcuts) {
        if (actions.includes(config.action)) {
          html += `<div class="shortcut-item">
            <span class="key">${keyCombo}</span>
            <span class="desc">${config.description}</span>
          </div>`;
        }
      }
      html += '</div>';
    }
    return html;
  }

  /**
   * Log shortcut usage
   */
  async logShortcutUsage(keyCombo, action) {
    // Log to activity logs
    console.log(`Shortcut used: ${keyCombo} -> ${action}`);
  }

  // Action implementations
  async openPaymentDialog() {
    if (!window.cart || window.cart.items.length === 0) {
      window.showToast?.('Cart is empty', 'warning');
      return;
    }
    window.openPaymentModal?.();
  }

  async saveDraft() {
    if (!window.cart || window.cart.items.length === 0) {
      window.showToast?.('Cart is empty', 'warning');
      return;
    }
    window.saveDraft?.();
  }

  async newOrder() {
    if (window.cart && window.cart.items.length > 0) {
      const confirmed = confirm('Clear current cart and start new order?');
      if (!confirmed) return;
    }
    window.clearCart?.();
  }

  async showDrafts() {
    window.showDraftsModal?.();
  }

  async showHistory() {
    window.location.href = '/pos/frontend/history.html';
  }

  focusSearch() {
    const searchInput = document.getElementById('search-product');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  cancelDialog() {
    const modal = document.querySelector('.modal:not(.hidden)');
    if (modal) {
      window.closeModal?.(modal.id);
    }
  }

  selectPreviousItem() {
    window.cart?.selectPreviousItem?.();
  }

  selectNextItem() {
    window.cart?.selectNextItem?.();
  }

  async removeSelectedItem() {
    const selectedItem = window.cart?.getSelectedItem?.();
    if (!selectedItem) {
      window.showToast?.('No item selected', 'warning');
      return;
    }
    
    const confirmed = confirm(`Remove ${selectedItem.name}?`);
    if (confirmed) {
      window.cart?.removeItem?.(selectedItem.id);
    }
  }

  incrementQuantity() {
    window.cart?.incrementSelectedQuantity?.();
  }

  decrementQuantity() {
    window.cart?.decrementSelectedQuantity?.();
  }

  openModifiers() {
    const selectedItem = window.cart?.getSelectedItem?.();
    if (selectedItem) {
      window.openModifiersModal?.(selectedItem);
    }
  }

  selectAllItems() {
    window.cart?.selectAllItems?.();
  }

  async addProductFromSlot(slot) {
    const productId = await this.getProductFromSlot(slot);
    if (!productId) {
      window.showToast?.(`No product assigned to F${slot}. Press Shift+F${slot} to assign.`, 'info');
      return;
    }
    
    const quantity = this.getQuantity();
    window.addProductToCart?.(productId, quantity);
  }

  async assignProductToSlot(slot) {
    window.showProductAssignmentModal?.(slot);
  }

  async getProductFromSlot(slot) {
    const db = await window.dbPromise;
    const tx = db.transaction('keyboard_shortcuts', 'readonly');
    const store = tx.objectStore('keyboard_shortcuts');
    
    const userId = window.currentUser?.id;
    const key = `F${slot}`;
    
    const shortcut = await store.get([userId, key]);
    await tx.done;
    
    return shortcut?.productId || null;
  }
}
