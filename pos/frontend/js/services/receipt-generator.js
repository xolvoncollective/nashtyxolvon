/**
 * NASHTY OS - Receipt Generator
 * Generates customizable receipts with branding
 */

class ReceiptGenerator {
  constructor() {
    this.canvas = document.createElement('canvas');
  }

  async generateReceipt(order, outletSettings) {
    const template = this.buildTemplate(order, outletSettings);
    return template;
  }

  buildTemplate(order, settings) {
    const fontSize = this.getFontSize(settings.receiptFontSize || 'medium');
    const logoHtml = settings.receiptLogo ? 
      `<img src="${settings.receiptLogo}" style="max-width:200px;display:block;margin:0 auto 10px;" />` : '';
    
    const headerHtml = settings.receiptHeader ? 
      `<div style="text-align:center;white-space:pre-line;margin:10px 0;">${this.escapeHtml(settings.receiptHeader)}</div>` : '';

    const itemsHtml = order.items.map(item => `
      <div style="display:flex;justify-content:space-between;margin:5px 0;">
        <span>${this.escapeHtml(item.name)} x${item.quantity}</span>
        <span>${this.formatCurrency(item.price * item.quantity)}</span>
      </div>
    `).join('');

    const qrCodeHtml = settings.receiptQrFeedback ? 
      `<div style="text-align:center;margin:15px 0;">
        <img src="${this.generateQrCodeUrl(settings.receiptQrFeedback)}" style="width:100px;height:100px;" />
        <div style="font-size:10px;">Scan untuk Feedback</div>
      </div>` : '';

    const promoHtml = settings.receiptPromos?.length > 0 ?
      `<div style="background:#f0f0f0;padding:10px;margin:10px 0;border:1px dashed #333;font-weight:bold;text-align:center;">
        ${this.selectRandomPromo(settings.receiptPromos)}
      </div>` : '';

    const footerHtml = settings.receiptFooter ?
      `<div style="text-align:center;white-space:pre-line;margin:10px 0;font-size:${fontSize-2}pt;">
        ${this.escapeHtml(settings.receiptFooter)}
      </div>` : '';

    return `
      <div style="width:300px;font-family:monospace;font-size:${fontSize}pt;padding:10px;">
        ${logoHtml}
        ${headerHtml}
        
        <div style="text-align:center;margin:10px 0;font-weight:bold;">
          ${this.escapeHtml(order.outletName)}
        </div>

        <hr style="border:0;border-top:1px dashed #333;margin:10px 0;" />

        <div style="text-align:center;font-size:${fontSize-2}pt;margin:5px 0;">
          <div>Order #${order.orderNumber}</div>
          <div>${this.formatDateTime(order.createdAt)}</div>
          <div>Kasir: ${this.escapeHtml(order.cashierName)}</div>
        </div>

        <hr style="border:0;border-top:1px dashed #333;margin:10px 0;" />

        ${itemsHtml}

        <hr style="border:0;border-top:1px dashed #333;margin:10px 0;" />

        <div style="font-weight:bold;">
          <div style="display:flex;justify-content:space-between;margin:5px 0;">
            <span>Subtotal:</span>
            <span>${this.formatCurrency(order.subtotal)}</span>
          </div>
          ${order.tax > 0 ? `
          <div style="display:flex;justify-content:space-between;margin:5px 0;">
            <span>Pajak:</span>
            <span>${this.formatCurrency(order.tax)}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;margin:10px 0;font-size:${fontSize+2}pt;border-top:2px solid #333;padding-top:5px;">
            <span>TOTAL:</span>
            <span>${this.formatCurrency(order.total)}</span>
          </div>
        </div>

        ${promoHtml}
        ${qrCodeHtml}
        ${footerHtml}

        <div style="text-align:center;margin-top:15px;font-size:${fontSize-2}pt;">
          Terima kasih atas kunjungan Anda!
        </div>
      </div>
    `;
  }

  getFontSize(size) {
    switch (size) {
      case 'small': return 10;
      case 'large': return 14;
      default: return 12;
    }
  }

  selectRandomPromo(promos) {
    const index = Math.floor(Math.random() * promos.length);
    return this.escapeHtml(promos[index]);
  }

  generateQrCodeUrl(url) {
    // Placeholder - would use QRCode library
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}`;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDateTime(isoString) {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async printReceipt(receiptHtml) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          @media print {
            @page { margin: 0; }
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>${receiptHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

window.ReceiptGenerator = new ReceiptGenerator();
console.log('✅ ReceiptGenerator loaded');
