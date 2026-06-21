/**
 * Android Printer Integration for Moka POS
 * Uses Android WebView JavaScript Interface for native printer communication
 * Falls back to Web Print API if native interface not available
 */

class AndroidPrinter {
  constructor() {
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this.hasMokaInterface = typeof Android !== 'undefined' && typeof Android.print === 'function';
    
    console.log('AndroidPrinter initialized:', {
      isAndroid: this.isAndroid,
      hasMokaInterface: this.hasMokaInterface,
      userAgent: navigator.userAgent
    });
  }
  
  /**
   * Check if Android native printer is available
   */
  isAvailable() {
    return this.isAndroid && this.hasMokaInterface;
  }
  
  /**
   * Print receipt via Moka Android interface or web fallback
   * @param {Object} receiptData - Receipt data object
   * @returns {Promise<Object>} Result with success status
   */
  async print(receiptData) {
    console.log('Print request received:', receiptData);
    
    if (!this.isAvailable()) {
      console.warn('Android printer interface not available, using web fallback');
      return this.printWebFallback(receiptData);
    }
    
    try {
      // Format receipt for Moka printer ESC/POS commands
      const formattedReceipt = this.formatReceiptForMoka(receiptData);
      
      console.log('Sending to Moka printer...');
      
      // Call Android native print method
      Android.print(formattedReceipt);
      
      console.log('✓ Receipt sent to Moka printer successfully');
      return { success: true, method: 'moka' };
    } catch (error) {
      console.error('Moka print error:', error);
      
      // Fallback to web print
      console.log('Falling back to web print...');
      return this.printWebFallback(receiptData);
    }
  }
  
  /**
   * Format receipt data for Moka printer with ESC/POS commands
   * Format: [C] = Center, [L] = Left, [R] = Right, [B] = Bold, [IMG] = Image
   */
  formatReceiptForMoka(data) {
    const lines = [];
    
    // Header with logo
    if (data.logo) {
      lines.push(`[IMG]${data.logo}`);
      lines.push('');
    }
    
    lines.push('[C][B]' + (data.outletName || 'NASHTY RESTAURANT'));
    if (data.outletAddress) {
      lines.push('[C]' + data.outletAddress);
    }
    if (data.outletPhone) {
      lines.push('[C]' + data.outletPhone);
    }
    lines.push('[L]' + '='.repeat(32));
    lines.push('');
    
    // Order information
    lines.push('[L]No Order: [R]' + (data.orderNumber || '-'));
    lines.push('[L]Tanggal: [R]' + (data.date || new Date().toLocaleString('id-ID')));
    lines.push('[L]Kasir: [R]' + (data.cashierName || '-'));
    if (data.tableName) {
      lines.push('[L]Meja: [R]' + data.tableName);
    }
    lines.push('[L]' + '='.repeat(32));
    lines.push('');
    
    // Items
    data.items.forEach((item, idx) => {
      lines.push(`[L]${idx + 1}. ${item.name}`);
      lines.push(`[L]   ${item.quantity} x ${this.formatCurrency(item.price)} = [R]${this.formatCurrency(item.total)}`);
      
      // Modifiers
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
          lines.push(`[L]   + ${mod.name} ${mod.price > 0 ? '(+' + this.formatCurrency(mod.price) + ')' : ''}`);
        });
      }
      
      // Notes
      if (item.notes) {
        lines.push(`[L]   Note: ${item.notes}`);
      }
      
      lines.push('');
    });
    
    lines.push('[L]' + '='.repeat(32));
    
    // Totals
    lines.push(`[L]Subtotal: [R]${this.formatCurrency(data.subtotal || 0)}`);
    
    if (data.discount && data.discount > 0) {
      lines.push(`[L]Diskon: [R]-${this.formatCurrency(data.discount)}`);
    }
    
    if (data.tax && data.tax > 0) {
      lines.push(`[L]Pajak (${data.taxRate || 10}%): [R]${this.formatCurrency(data.tax)}`);
    }
    
    if (data.serviceCharge && data.serviceCharge > 0) {
      lines.push(`[L]Service: [R]${this.formatCurrency(data.serviceCharge)}`);
    }
    
    lines.push('[L]' + '='.repeat(32));
    lines.push(`[L][B]TOTAL: [R][B]${this.formatCurrency(data.total || 0)}`);
    lines.push('[L]' + '='.repeat(32));
    lines.push('');
    
    // Payment information
    lines.push(`[L]Metode: [R]${data.paymentMethod || 'CASH'}`);
    
    if (data.paymentMethod && (data.paymentMethod === 'CASH' || data.paymentMethod === 'Tunai')) {
      lines.push(`[L]Tunai: [R]${this.formatCurrency(data.paid || data.total)}`);
      const change = (data.paid || data.total) - data.total;
      lines.push(`[L]Kembalian: [R]${this.formatCurrency(change > 0 ? change : 0)}`);
    }
    
    lines.push('');
    
    // Footer
    if (data.header) {
      lines.push('[C]' + data.header);
      lines.push('');
    }
    
    if (data.footer) {
      lines.push('[C]' + data.footer);
      lines.push('');
    }
    
    // Social media
    if (data.socialMedia) {
      if (data.socialMedia.instagram) lines.push('[C]IG: @' + data.socialMedia.instagram);
      if (data.socialMedia.facebook) lines.push('[C]FB: ' + data.socialMedia.facebook);
    }
    
    lines.push('[C][B]Terima Kasih!');
    lines.push('[C]Selamat Menikmati');
    lines.push('');
    lines.push('[C]' + new Date().toLocaleString('id-ID'));
    lines.push('');
    
    // Cut paper command
    lines.push('[CUT]');
    
    return lines.join('\n');
  }
  
  /**
   * Web print fallback using standard browser print API
   */
  async printWebFallback(receiptData) {
    try {
      const html = this.generateHTMLReceipt(receiptData);
      
      // Create hidden iframe for printing
      let printFrame = document.getElementById('print-frame');
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'print-frame';
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);
      }
      
      const doc = printFrame.contentDocument || printFrame.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Print
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      
      console.log('✓ Web print initiated');
      return { success: true, method: 'web' };
    } catch (error) {
      console.error('Web print error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Generate HTML for thermal receipt (58mm paper)
   */
  generateHTMLReceipt(data) {
    const itemsHtml = data.items.map((item, idx) => `
      <div class="item">
        <div>${idx + 1}. ${item.name}</div>
        <div class="item-detail">
          <span>${item.quantity} x ${this.formatCurrency(item.price)}</span>
          <span>${this.formatCurrency(item.total)}</span>
        </div>
        ${item.modifiers && item.modifiers.length > 0 ? item.modifiers.map(mod => `
          <div class="modifier">+ ${mod.name}</div>
        `).join('') : ''}
        ${item.notes ? `<div class="notes">Note: ${item.notes}</div>` : ''}
      </div>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${data.orderNumber || ''}</title>
        <style>
          @page { 
            size: 58mm auto; 
            margin: 0; 
          }
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none; }
          }
          body { 
            font-family: 'Courier New', 'Consolas', monospace; 
            font-size: 11px; 
            line-height: 1.3;
            width: 58mm; 
            margin: 0 auto; 
            padding: 3mm;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 14px; }
          .line { 
            border-top: 1px dashed #000; 
            margin: 4px 0; 
          }
          .item { margin: 3px 0; }
          .item-detail { 
            display: flex; 
            justify-content: space-between; 
            padding-left: 10px;
            font-size: 10px;
          }
          .modifier { 
            padding-left: 15px; 
            font-size: 10px; 
            color: #333;
          }
          .notes { 
            padding-left: 15px; 
            font-size: 9px; 
            font-style: italic; 
            color: #666;
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 2px 0;
          }
          .total-row.bold {
            font-weight: bold;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="center bold large">${data.outletName || 'NASHTY'}</div>
        ${data.outletAddress ? `<div class="center">${data.outletAddress}</div>` : ''}
        ${data.outletPhone ? `<div class="center">${data.outletPhone}</div>` : ''}
        <div class="line"></div>
        
        <div>No: ${data.orderNumber || '-'}</div>
        <div>Tanggal: ${data.date || new Date().toLocaleString('id-ID')}</div>
        <div>Kasir: ${data.cashierName || '-'}</div>
        ${data.tableName ? `<div>Meja: ${data.tableName}</div>` : ''}
        <div class="line"></div>
        
        ${itemsHtml}
        
        <div class="line"></div>
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${this.formatCurrency(data.subtotal || 0)}</span>
        </div>
        ${data.discount > 0 ? `
        <div class="total-row">
          <span>Diskon:</span>
          <span>-${this.formatCurrency(data.discount)}</span>
        </div>
        ` : ''}
        ${data.tax > 0 ? `
        <div class="total-row">
          <span>Pajak:</span>
          <span>${this.formatCurrency(data.tax)}</span>
        </div>
        ` : ''}
        ${data.serviceCharge > 0 ? `
        <div class="total-row">
          <span>Service:</span>
          <span>${this.formatCurrency(data.serviceCharge)}</span>
        </div>
        ` : ''}
        <div class="line"></div>
        <div class="total-row bold">
          <span>TOTAL:</span>
          <span>${this.formatCurrency(data.total || 0)}</span>
        </div>
        <div class="line"></div>
        
        <div>Pembayaran: ${data.paymentMethod || 'CASH'}</div>
        ${data.paymentMethod === 'CASH' || data.paymentMethod === 'Tunai' ? `
        <div>Tunai: ${this.formatCurrency(data.paid || data.total)}</div>
        <div>Kembalian: ${this.formatCurrency(Math.max(0, (data.paid || data.total) - data.total))}</div>
        ` : ''}
        
        ${data.footer ? `
        <div class="line"></div>
        <div class="center">${data.footer}</div>
        ` : ''}
        
        <div class="center bold" style="margin-top: 8px;">Terima Kasih!</div>
        <div class="center">Selamat Menikmati</div>
        <div class="center" style="font-size: 9px; margin-top: 5px;">${new Date().toLocaleString('id-ID')}</div>
      </body>
      </html>
    `;
  }
  
  /**
   * Format currency to IDR
   */
  formatCurrency(amount) {
    return 'Rp ' + (amount || 0).toLocaleString('id-ID');
  }
  
  /**
   * Test printer with sample receipt
   */
  async testPrint() {
    console.log('Running printer test...');
    
    const testReceipt = {
      outletName: 'TEST PRINT',
      outletAddress: 'Test Restaurant Address',
      outletPhone: '0812-3456-7890',
      orderNumber: 'TEST-' + Date.now(),
      date: new Date().toLocaleString('id-ID'),
      cashierName: 'Test Cashier',
      tableName: 'Test Table',
      items: [
        { 
          name: 'Nasi Goreng Special', 
          quantity: 2, 
          price: 25000, 
          total: 50000,
          modifiers: [
            { name: 'Extra Pedas', price: 0 }
          ],
          notes: 'Jangan pakai kecap'
        },
        { 
          name: 'Es Teh Manis', 
          quantity: 2, 
          price: 5000, 
          total: 10000 
        }
      ],
      subtotal: 60000,
      tax: 6000,
      taxRate: 10,
      serviceCharge: 0,
      discount: 0,
      total: 66000,
      paymentMethod: 'CASH',
      paid: 70000,
      footer: 'Kunjungi kami lagi!'
    };
    
    const result = await this.print(testReceipt);
    console.log('Test print result:', result);
    return result;
  }
}

// Initialize global printer instance
if (typeof window !== 'undefined') {
  window.androidPrinter = new AndroidPrinter();
  console.log('✓ AndroidPrinter available globally as window.androidPrinter');
  console.log('  - Native printer available:', window.androidPrinter.isAvailable());
  console.log('  - Use window.androidPrinter.testPrint() to test');
}
