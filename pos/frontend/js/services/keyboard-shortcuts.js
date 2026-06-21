/**
 * NASHTY OS - Keyboard Shortcut Handler
 * Global keyboard shortcut system with customization
 */

class KeyboardShortcutHandler {
  constructor() {
    this.shortcuts = new Map();
    this.customShortcuts = new Map();
    this.systemShortcuts = ['F5', 'Ctrl+R', 'Ctrl+Shift+R', 'F12']; // Cannot be overridden
    this.isEnabled = true;
    this.referenceOverlayShown = false;
    this.f1PressCount = 0;
    this.f1Timer = null;
  }

  /**
   * Initialize keyboard shortcut handler
   */
  async init() {
    // Load custom shortcuts from IndexedDB
    await this.loadCustomShortcuts();
    
    // Register default shortcuts
    this.registerDefaultShortcuts();
    
    // Setup global event listener
    this.setupEventListener();
    
    console.log('✅ KeyboardShortcutHandler initialized');
  }

  /**
   * Setup global keydown event listener
   */
  setupEventListener() {
    document.addEventListener('keydown', (event) => {
      if (!this.isEnabled) return;
      
      // Build key combination string
      const keyCombo = this.buildKeyCombo(event);
      
      // Check for F1 double press (reference overlay)
      if (event.key === 'F1') {
        this.handleF1Press(event);
        return;
      }
      
      // Check if shortcut exists
      const shortcut = this.shortcuts.get(keyCombo) || this.customShortcuts.get(keyCombo);
      
      if (shortcut) {
        // Prevent default browser behavior
        event.preventDefault();
        event.stopPropagation();
        
        // Execute shortcut action
        this.executeShortcut(shortcut, event);
      }
    });
    
    console.log('✅ Global keyboard listener attached');
  }

  /**
   * Build key combination string from event
   */
  buildKeyCombo(event) {
    const parts = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    
    // Get main key
    let key = event.key;
    
    // Normalize key names
    if (key === ' ') key = 'Space';
    else if (key.length === 1) key = key.toUpperCase();
    else if (key.startsWith('Arrow')) key = key; // ArrowUp, ArrowDown, etc.
    else if (key === 'Escape') key = 'Escape';
    else if (key === 'Enter') key = 'Enter';
    else if (key === 'Delete') key = 'Delete';
    else if (key.startsWith('F') && /F\d+/.test(key)) key = key; // F1-F12
    else if (key === '+' || key === '=') key = 'Plus';
    else if (key === '-' || key === '_') key = 'Minus';
    
    parts.push(key);
    
    return parts.join('+');
  }

  /**
   * Register default shortcuts
   */
  registerDefaultShortcuts() {
    // Navigation shortcuts
    this.register('Ctrl+P', {
      action: 'openPayment',
      description: 'Buka dialog pembayaran',
      category: 'Navigation',
      handler: () => window.showPaymentDialog?.()
    });
    
    this.register('Ctrl+S', {
      action: 'saveCart',
      description: 'Simpan cart sebagai draft',
      category: 'Navigation',
      handler: () => window.saveDraft?.()
    });
    
    this.register('Ctrl+N', {
      action: 'newOrder',
      description: 'Mulai order baru (clear cart)',
      category: 'Navigation',
      handler: () => window.clearCart?.()
    });
    
    this.register('Ctrl+D', {
      action: 'showDrafts',
      description: 'Tampilkan daftar draft',
      category: 'Navigation',
      handler: () => window.showDraftsModal?.()
    });
    
    this.register('Ctrl+H', {
      action: 'showHistory',
      description: 'Buka riwayat order',
      category: 'Navigation',
      handler: () => window.switchTab?.('history')
    });
    
    this.register('Alt+F', {
      action: 'focusSearch',
      description: 'Fokus ke search product',
      category: 'Navigation',
      handler: () => document.getElementById('product-search')?.focus()
    });
    
    this.register('Escape', {
      action: 'closeDialog',
      description: 'Tutup dialog/modal',
      category: 'Navigation',
      handler: () => this.closeActiveDialog()
    });
    
    // Cart shortcuts
    this.register('ArrowUp', {
      action: 'cartSelectUp',
      description: 'Pilih item cart di atas',
      category: 'Cart',
      handler: () => window.cartSelectPrevious?.()
    });
    
    this.register('ArrowDown', {
      action: 'cartSelectDown',
      description: 'Pilih item cart di bawah',
      category: 'Cart',
      handler: () => window.cartSelectNext?.()
    });
    
    this.register('Delete', {
      action: 'deleteCartItem',
      description: 'Hapus item cart terpilih',
      category: 'Cart',
      handler: () => window.deleteSelectedCartItem?.()
    });
    
    this.register('Plus', {
      action: 'increaseQuantity',
      description: 'Tambah quantity +1',
      category: 'Cart',
      handler: () => window.adjustSelectedQuantity?.(1)
    });
    
    this.register('Minus', {
      action: 'decreaseQuantity',
      description: 'Kurangi quantity -1',
      category: 'Cart',
      handler: () => window.adjustSelectedQuantity?.(-1)
    });
    
    this.register('Enter', {
      action: 'openModifiers',
      description: 'Buka modifier item terpilih',
      category: 'Cart',
      handler: () => window.openModifiersForSelected?.()
    });
    
    this.register('Ctrl+A', {
      action: 'selectAll',
      description: 'Pilih semua item cart',
      category: 'Cart',
      handler: () => window.selectAllCartItems?.()
    });
    
    // Function keys for products (F1-F12)
    for (let i = 1; i <= 12; i++) {
      this.register(`F${i}`, {
        action: `addProduct${i}`,
        description: `Tambah product shortcut ${i}`,
        category: 'Product Shortcuts',
        handler: () => window.addProductByShortcut?.(i)
      });
      
      this.register(`Shift+F${i}`, {
        action: `assignProduct${i}`,
        description: `Atur product untuk F${i}`,
        category: 'Product Shortcuts',
        handler: () => window.showProductAssignmentDialog?.(i)
      });
    }
    
    console.log(`✅ ${this.shortcuts.size} default shortcuts registered`);
  }

  /**
   * Register a shortcut
   */
  register(keyCombo, config) {
    // Check if system shortcut
    if (this.systemShortcuts.includes(keyCombo)) {
      console.warn(`Cannot override system shortcut: ${keyCombo}`);
      return false;
    }
    
    // Check for conflicts
    if (this.shortcuts.has(keyCombo)) {
      console.warn(`Shortcut conflict: ${keyCombo} already registered`);
      return false;
    }
    
    this.shortcuts.set(keyCombo, {
      keyCombo,
      ...config,
      createdAt: new Date().toISOString()
    });
    
    return true;
  }

  /**
   * Execute shortcut handler
   */
  executeShortcut(shortcut, event) {
    try {
      console.log(`⌨️ Executing shortcut: ${shortcut.keyCombo} (${shortcut.action})`);
      
      if (typeof shortcut.handler === 'function') {
        shortcut.handler(event);
      }
      
      // Log for audit trail
      this.logShortcutUsage(shortcut);
    } catch (error) {
      console.error(`Failed to execute shortcut ${shortcut.keyCombo}:`, error);
    }
  }

  /**
   * Log shortcut usage for audit
   */
  logShortcutUsage(shortcut) {
    const userId = window.currentUser?.id || 'unknown';
    const log = {
      userId,
      action: shortcut.action,
      keyCombo: shortcut.keyCombo,
      timestamp: new Date().toISOString()
    };
    
    // Store in localStorage (simple implementation)
    const logs = JSON.parse(localStorage.getItem('shortcut_logs') || '[]');
    logs.push(log);
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('shortcut_logs', JSON.stringify(logs));
  }

  /**
   * Handle F1 double press for reference overlay
   */
  handleF1Press(event) {
    event.preventDefault();
    
    this.f1PressCount++;
    
    if (this.f1Timer) {
      clearTimeout(this.f1Timer);
    }
    
    this.f1Timer = setTimeout(() => {
      this.f1PressCount = 0;
    }, 500);
    
    if (this.f1PressCount === 2) {
      this.showReferenceOverlay();
      this.f1PressCount = 0;
    }
  }

  /**
   * Show keyboard shortcuts reference overlay
   */
  showReferenceOverlay() {
    if (this.referenceOverlayShown) {
      document.getElementById('keyboard-reference-overlay')?.remove();
      this.referenceOverlayShown = false;
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'keyboard-reference-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    `;
    
    overlay.onclick = () => {
      overlay.remove();
      this.referenceOverlayShown = false;
    };
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 30px;
      max-width: 900px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;
    content.onclick = (e) => e.stopPropagation();
    
    // Group shortcuts by category
    const categories = {};
    this.shortcuts.forEach(shortcut => {
      const cat = shortcut.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(shortcut);
    });
    
    let html = `
      <div style="text-align:center;margin-bottom:30px;">
        <h2 style="margin:0 0 10px 0;font-size:24px;color:#333;">⌨️ Keyboard Shortcuts</h2>
        <p style="margin:0;color:#666;font-size:14px;">Tekan F1 dua kali untuk menampilkan/menyembunyikan</p>
      </div>
    `;
    
    Object.keys(categories).sort().forEach(category => {
      html += `
        <div style="margin-bottom:25px;">
          <h3 style="font-size:16px;color:#333;margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid #f0f0f0;">${category}</h3>
          <div style="display:grid;grid-template-columns:1fr;gap:8px;">
            ${categories[category].map(s => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8f8f8;border-radius:6px;">
                <span style="font-size:13px;color:#666;">${s.description}</span>
                <kbd style="background:white;border:1px solid #ddd;padding:4px 8px;border-radius:4px;font-size:11px;font-family:monospace;color:#333;font-weight:600;">${s.keyCombo}</kbd>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    
    html += `
      <div style="text-align:center;margin-top:20px;">
        <button onclick="this.closest('#keyboard-reference-overlay').remove()" style="padding:10px 24px;border:none;background:#4CAF50;color:white;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
          Tutup (ESC)
        </button>
      </div>
    `;
    
    content.innerHTML = html;
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    this.referenceOverlayShown = true;
  }

  /**
   * Close active dialog/modal
   */
  closeActiveDialog() {
    // Try to find and close visible modals
    const modals = document.querySelectorAll('.ov, .modal');
    for (const modal of modals) {
      if (modal.style.display !== 'none' && modal.style.display !== '') {
        modal.style.display = 'none';
        return;
      }
    }
  }

  /**
   * Load custom shortcuts from IndexedDB
   */
  async loadCustomShortcuts() {
    try {
      const userId = window.currentUser?.id;
      if (!userId) return;
      
      const db = await window.DatabaseSchema.getDatabase();
      const tx = db.transaction('keyboard_shortcuts', 'readonly');
      const store = tx.objectStore('keyboard_shortcuts');
      const index = store.index('userId');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(userId);
        request.onsuccess = () => {
          const customs = request.result;
          customs.forEach(custom => {
            this.customShortcuts.set(custom.keyCombo, custom);
          });
          console.log(`✅ Loaded ${customs.length} custom shortcuts`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to load custom shortcuts:', error);
    }
  }

  /**
   * Save custom shortcut to IndexedDB
   */
  async saveCustomShortcut(keyCombo, action, description) {
    const userId = window.currentUser?.id;
    if (!userId) throw new Error('No user logged in');
    
    // Check for conflicts
    if (this.systemShortcuts.includes(keyCombo)) {
      throw new Error('Cannot override system shortcut');
    }
    
    const db = await window.DatabaseSchema.getDatabase();
    const tx = db.transaction('keyboard_shortcuts', 'readwrite');
    const store = tx.objectStore('keyboard_shortcuts');
    
    const custom = {
      userId,
      keyCombo,
      action,
      description,
      createdAt: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(custom);
      request.onsuccess = () => {
        this.customShortcuts.set(keyCombo, custom);
        console.log(`✅ Custom shortcut saved: ${keyCombo}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all shortcuts
   */
  getAllShortcuts() {
    const all = [];
    this.shortcuts.forEach(s => all.push(s));
    this.customShortcuts.forEach(s => all.push({...s, isCustom: true}));
    return all;
  }

  /**
   * Enable/disable shortcuts
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`⌨️ Keyboard shortcuts ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Initialize and export
window.KeyboardShortcutHandler = new KeyboardShortcutHandler();

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.KeyboardShortcutHandler.init();
  });
} else {
  window.KeyboardShortcutHandler.init();
}

console.log('✅ KeyboardShortcutHandler module loaded');
