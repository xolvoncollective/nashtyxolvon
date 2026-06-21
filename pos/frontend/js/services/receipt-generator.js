/**
 * NASHTY OS - Receipt Template Generator
 * Generates customized receipts with all outlet settings
 */

export class ReceiptTemplateGenerator {
  constructor() {
    this.settings = null;
  }

  /**
   * Generate receipt HTML
   */
  async generate(order, options = {}) {
    const startTime = performance.now();
    
    // Load outlet settings
    await this.loadSettings(order.outlet_id);
    
    // Generate HTML
    const html = this.buildReceiptHTML(order, options);
    
    const duration = performance.now() - startTime;
    console.log(`Receipt generated in ${duration.toFixed(2)}ms`);
    
    if (duration > 300) {
      console.warn('Receipt generation exceeded 300ms target');
    }
    
    return html;
  }

  /**
   * Load outlet settings
   */
  /**
   * Load outlet settings
   */
  async loadSettings(outletId) {
    try {
      // Try to load from API first
      const response = await fetch(`${window.NashtyAPI.config.functionsUrl}/settings-api?outlet_id=${outletId}`, {
        headers: {
          'Authorization': `Bearer ${await window.NashtyAPI.auth.getAccessToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.settings = data.settings || this.getDefaultSettings();
      } else {
        // Fallback to defaults
        this.settings = this.getDefaultSettings();
      }

      // Cache in IndexedDB for offline use
      const db = await window.dbPromise;
      const tx = db.transaction('settings', 'readwrite');
      await tx.objectStore('settings').put({
        outlet_id: outletId,
        key: 'receipt_settings',
        value: this.settings,
        updated_at: Date.now()
      });
      await tx.done;
    } catch (error) {
      console.error('Failed to load settings from API, using cached:', error);
      
      // Fallback to IndexedDB cache
      try {
        const db = await window.dbPromise;
        const tx = db.transaction('settings', 'readonly');
        const cached = await tx.objectStore('settings').get([outletId, 'receipt_settings']);
        await tx.done;
        
        this.settings = cached?.value || this.getDefaultSettings();
      } catch {
        this.settings = this.getDefaultSettings();
      }
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      receipt_logo_url: null,
      receipt_header_text: 'Terima kasih atas kunjungan Anda',
      receipt_footer_text: 'Silakan datang kembali',
      receipt_font_size: 'medium',
      receipt_qr_enabled: false,
      receipt_qr_url: null,
      receipt_social_facebook: null,
      receipt_social_instagram: null,
      receipt_social_twitter: null,
      receipt_social_tiktok: null,
      receipt_promo_messages: []
    };
  }

  /**
   * Build receipt HTML
   */
  buildReceiptHTML(order, options) {
    const {
      logo_url,
      receipt_header,
      receipt_footer,
      font_size = 'medium',
      qr_enabled,
      qr_url,
      social_facebook,
      social_instagram,
      social_twitter,
      social_tiktok,
      promo_messages
    } = this.settings;
    
    const fontSize = this.getFontSize(font_size);
    const customerDisplayNote = options.customerDisplayActive ? 
      '<div class="display-note">Order verified on customer display</div>' : '';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${order.order_number}</title>
  <style>
    @media print {
      @page { margin: 0; }
      body { margin: 0; padding: 10mm; }
    }
    
    body {
      font-family: 'Courier New', monospace;
      font-size: ${fontSize}pt;
      max-width: 80mm;
      margin: 0 auto;
      padding: 5mm;
      line-height: 1.4;
    }
    
    .receipt-header {
      text-align: center;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #000;
    }
    
    .logo {
      max-width: 200px;
      height: auto;
      margin: 0 auto 10px;
      display: block;
    }
    
    .header-text {
      white-space: pre-line;
      margin: 10px 0;
    }
    
    .order-info {
      margin: 10px 0;
      font-size: ${fontSize * 0.9}pt;
    }
    
    .order-items {
      margin: 15px 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 10px 0;
    }
    
    .item {
      margin: 5px 0;
    }
    
    .item-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
    }
    
    .item-modifiers {
      font-size: ${fontSize * 0.85}pt;
      padding-left: 10px;
      color: #666;
    }
    
    .totals {
      margin: 10px 0;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }
    
    .grand-total {
      font-weight: bold;
      font-size: ${fontSize * 1.2}pt;
      border-top: 1px solid #000;
      margin-top: 5px;
      padding-top: 5px;
    }
    
    .promo-message {
      background: #f0f0f0;
      padding: 10px;
      margin: 15px 0;
      text-align: center;
      font-weight: bold;
      border: 2px solid #000;
    }
    
    .social-links {
      text-align: center;
      margin: 15px 0;
      font-size: ${fontSize * 0.9}pt;
    }
    
    .social-link {
      display: block;
      margin: 3px 0;
    }
    
    .qr-section {
      text-align: center;
      margin: 15px 0;
    }
    
    .qr-code {
      width: 100px;
      height: 100px;
      margin: 10px auto;
    }
    
    .qr-label {
      font-size: ${fontSize * 0.9}pt;
      margin-top: 5px;
    }
    
    .footer-text {
      text-align: center;
      white-space: pre-line;
      margin: 15px 0;
      padding-top: 10px;
      border-top: 1px dashed #000;
    }
    
    .display-note {
      text-align: center;
      font-size: ${fontSize * 0.8}pt;
      color: #666;
      margin: 10px 0;
      font-style: italic;
    }
    
    .powered-by {
      text-align: center;
      font-size: ${fontSize * 0.7}pt;
      color: #999;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="receipt-header">
    ${logo_url ? `<img src="${logo_url}" class="logo" alt="Logo">` : ''}
    ${receipt_header ? `<div class="header-text">${this.escapeHTML(receipt_header)}</div>` : ''}
  </div>
  
  <div class="order-info">
    <div><strong>Order #:</strong> ${order.order_number}</div>
    <div><strong>Date:</strong> ${this.formatDateTime(order.created_at)}</div>
    <div><strong>Type:</strong> ${this.formatOrderType(order.order_type)}</div>
    ${order.table_number ? `<div><strong>Table:</strong> ${order.table_number}</div>` : ''}
    ${order.customer_name ? `<div><strong>Customer:</strong> ${order.customer_name}</div>` : ''}
    <div><strong>Cashier:</strong> ${order.cashier_name || 'N/A'}</div>
  </div>
  
  <div class="order-items">
    ${order.items.map(item => this.renderItem(item, fontSize)).join('')}
  </div>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${this.formatCurrency(order.subtotal)}</span>
    </div>
    ${order.discount > 0 ? `
    <div class="total-row">
      <span>Discount:</span>
      <span>-${this.formatCurrency(order.discount)}</span>
    </div>
    ` : ''}
    ${order.tax > 0 ? `
    <div class="total-row">
      <span>Tax:</span>
      <span>${this.formatCurrency(order.tax)}</span>
    </div>
    ` : ''}
    ${order.service_charge > 0 ? `
    <div class="total-row">
      <span>Service Charge:</span>
      <span>${this.formatCurrency(order.service_charge)}</span>
    </div>
    ` : ''}
    <div class="total-row grand-total">
      <span>TOTAL:</span>
      <span>${this.formatCurrency(order.total)}</span>
    </div>
    ${order.payment_method ? `
    <div class="total-row">
      <span>Payment:</span>
      <span>${order.payment_method}</span>
    </div>
    ` : ''}
  </div>
  
  ${this.renderPromoMessage(promo_messages)}
  ${this.renderSocialLinks({ social_facebook, social_instagram, social_twitter, social_tiktok })}
  ${this.renderQRCode(qr_enabled, qr_url)}
  ${customerDisplayNote}
  
  ${receipt_footer ? `<div class="footer-text">${this.escapeHTML(receipt_footer)}</div>` : ''}
  
  <div class="powered-by">Powered by NASHTY OS</div>
</body>
</html>
    `;
  }

  /**
   * Render order item
   */
  renderItem(item, fontSize) {
    const modifiers = item.modifiers && item.modifiers.length > 0 ?
      `<div class="item-modifiers">${item.modifiers.map(m => 
        `+ ${m.modifier_option_name}${m.price_adjustment > 0 ? ` (+${this.formatCurrency(m.price_adjustment)})` : ''}`
      ).join('<br>')}</div>` : '';
    
    return `
      <div class="item">
        <div class="item-header">
          <span>${item.quantity}x ${item.product_name}</span>
          <span>${this.formatCurrency(item.subtotal)}</span>
        </div>
        ${modifiers}
        ${item.notes ? `<div class="item-modifiers">Note: ${this.escapeHTML(item.notes)}</div>` : ''}
      </div>
    `;
  }

  /**
   * Render promotional message
   */
  renderPromoMessage(messages) {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return '';
    }
    
    // Random selection
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    return `
      <div class="promo-message">
        ${this.escapeHTML(message)}
      </div>
    `;
  }

  /**
   * Render social links
   */
  renderSocialLinks(social) {
    const links = [];
    
    if (social.social_facebook) {
      links.push(`<div class="social-link">📘 ${social.social_facebook}</div>`);
    }
    if (social.social_instagram) {
      links.push(`<div class="social-link">📷 ${social.social_instagram}</div>`);
    }
    if (social.social_twitter) {
      links.push(`<div class="social-link">🐦 ${social.social_twitter}</div>`);
    }
    if (social.social_tiktok) {
      links.push(`<div class="social-link">🎵 ${social.social_tiktok}</div>`);
    }
    
    if (links.length === 0) return '';
    
    return `
      <div class="social-links">
        <div><strong>Follow Us:</strong></div>
        ${links.join('')}
      </div>
    `;
  }

  /**
   * Render QR code
   */
  renderQRCode(enabled, url) {
    if (!enabled || !url) return '';
    
    // Generate QR code using qrcode.js library
    const qrDataURL = this.generateQRCode(url);
    
    return `
      <div class="qr-section">
        <img src="${qrDataURL}" class="qr-code" alt="QR Code">
        <div class="qr-label">Scan for Feedback</div>
      </div>
    `;
  }

  /**
   * Generate QR code (using qrcode.js)
   */
  generateQRCode(url) {
    // This would use qrcode.js library
    // For now, return placeholder
    try {
      if (typeof QRCode !== 'undefined') {
        const qr = new QRCode(document.createElement('div'), {
          text: url,
          width: 100,
          height: 100
        });
        return qr.toDataURL();
      }
    } catch (error) {
      console.error('QR code generation error:', error);
    }
    return '';
  }

  /**
   * Get font size in points
   */
  getFontSize(size) {
    const sizes = {
      small: 10,
      medium: 12,
      large: 14
    };
    return sizes[size] || 12;
  }

  /**
   * Format currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date time
   */
  formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  /**
   * Format order type
   */
  formatOrderType(type) {
    const types = {
      'dine-in': 'Dine In',
      'takeaway': 'Takeaway',
      'gofood': 'GoFood',
      'grabfood': 'GrabFood',
      'shopeefood': 'ShopeeFood'
    };
    return types[type] || type;
  }

  /**
   * Escape HTML
   */
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  /**
   * Print receipt
   */
  async print(order, options = {}) {
    const html = await this.generate(order, options);
    
    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for images to load
    await new Promise(resolve => {
      printWindow.onload = resolve;
      setTimeout(resolve, 1000);
    });
    
    // Print
    printWindow.print();
    printWindow.close();
  }
}
