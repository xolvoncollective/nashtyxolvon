/**
 * NASHTY OS - Thermal Printer Manager
 * Supports Android Tablet + Moka/Generic Thermal Printer via:
 * 1. Browser Print API (window.print) with 80mm thermal CSS - works on ALL Android tablets
 * 2. Web Bluetooth (future) - for Bluetooth thermal printers
 *
 * HOW IT WORKS ON ANDROID:
 * - Open Chrome on Android tablet
 * - When user clicks Print → browser opens print dialog
 * - User selects "Moka Print" or any installed printer driver (via Share/Print menu)
 * - For Moka Printer specifically: install Moka Print app → it appears as a virtual printer
 *   in Android print system → Chrome can print to it automatically
 */

class ThermalPrinterManager {
  constructor() {
    this.BRAND_NAME = localStorage.getItem('nashty_brand_name') || 'NASHTY';
    this.OUTLET_NAME = localStorage.getItem('nashty_outlet_name') || '';
  }

  /**
   * Main print entry point - generates 80mm thermal receipt and triggers browser print
   * On Android, this opens the system print dialog where Moka or any BT printer appears
   */
  async printReceipt(receiptData) {
    const html = this._buildReceiptHTML(receiptData);
    this._triggerPrint(html);
  }

  /**
   * Build fully thermal-optimized 80mm receipt HTML
   * Designed for 80mm paper width (576px effective print width)
   * Uses monospace font for alignment - standard for all thermal printers
   */
  _buildReceiptHTML(d) {
    const { items = [], total = 0, subtotal = 0, discount = 0, tax = 0, serviceCharge = 0,
            orderNumber = '', cashierName = 'Kasir', tableNumber = '', orderType = 'dine-in',
            paymentMethod = '', paidAmount = 0, changeAmount = 0, createdAt = new Date() } = d;

    const brandName = this.BRAND_NAME;
    const outletName = this.OUTLET_NAME;
    const logoSrc = localStorage.getItem('nashty_brand_logo') || '';
    const qrisSrc = (paymentMethod === 'qris' || paymentMethod === 'QRIS')
      ? (localStorage.getItem('nashty_qris_static') || '') : '';

    const now = new Date(createdAt);
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const fr = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
    const padLine = (left, right, width = 32) => {
      const space = width - left.length - right.length;
      return left + ' '.repeat(Math.max(1, space)) + right;
    };

    const itemsHTML = items.map(item => {
      const name = (item.name || item.n || '').substring(0, 22);
      const qty = item.quantity || item.qty || 1;
      const price = item.unitPrice || item.p || 0;
      const subtotal = qty * price;
      const mods = item.modifiers || item.mods || [];
      const modStr = Array.isArray(mods)
        ? mods.map(m => typeof m === 'string' ? m : m.optionName || m.n || '').filter(Boolean).join(', ')
        : '';
      return `
        <div class="item-row">
          <div class="item-name">${qty}x ${name}</div>
          ${modStr ? `<div class="item-mod">${modStr}</div>` : ''}
          <div class="item-price">${fr(subtotal)}</div>
        </div>`;
    }).join('');

    const payLabel = { cash: 'Tunai', qris: 'QRIS', bca: 'BCA', debit: 'Debit',
      transfer: 'Transfer', gofood: 'GoFood', grabfood: 'GrabFood', shopee: 'ShopeeFood' };
    const methodLabel = payLabel[paymentMethod] || paymentMethod || '-';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Struk #${orderNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    
    /* ─── SCREEN PREVIEW (before printing) ─── */
    body {
      background: #f1f5f9;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      padding: 20px;
      font-family: 'Courier New', Courier, monospace;
    }
    .receipt-wrapper {
      background: #fff;
      width: 320px;
      padding: 20px 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      border-radius: 8px;
    }
    .print-btn {
      display: block;
      width: 320px;
      margin: 0 auto 16px;
      padding: 16px;
      background: #E4540C;
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      font-family: sans-serif;
      text-align: center;
      touch-action: manipulation;
    }
    .print-btn:active { background: #c44309; }
    
    /* ─── ACTUAL PRINT STYLES (80mm paper) ─── */
    @media print {
      body {
        background: transparent !important;
        display: block !important;
        padding: 0 !important;
      }
      .print-btn { display: none !important; }
      .receipt-wrapper {
        width: 100% !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 4px 4px !important;
      }
      @page {
        size: 80mm auto;
        margin: 0;
      }
    }
    
    /* ─── RECEIPT CONTENT ─── */
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #333; margin: 6px 0; }
    .divider-solid { border-top: 1px solid #333; margin: 6px 0; }
    .brand { font-size: 16px; font-weight: 900; text-align: center; letter-spacing: 1px; }
    .outlet { font-size: 11px; text-align: center; color: #555; margin-top: 2px; }
    .logo-img { display: block; margin: 0 auto 8px; max-width: 120px; max-height: 60px; }
    .meta { font-size: 10.5px; margin: 2px 0; }
    .item-row { margin: 4px 0; }
    .item-name { font-size: 11px; font-weight: 700; }
    .item-mod { font-size: 10px; color: #666; padding-left: 6px; }
    .item-price { font-size: 11px; text-align: right; }
    .sum-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
    .sum-total { display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; margin: 4px 0; border-top: 2px solid #000; padding-top: 4px; }
    .footer-txt { font-size: 10px; text-align: center; color: #555; margin-top: 4px; }
    .order-no { font-size: 20px; font-weight: 900; text-align: center; margin: 6px 0; letter-spacing: 2px; }
    .type-badge { display: inline-block; font-size: 10px; font-weight: 700; border: 1px solid #333; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; }
    .qris-img { display: block; margin: 8px auto; max-width: 140px; border: 1px solid #eee; border-radius: 4px; }
  </style>
</head>
<body>
  <!-- Large touch-friendly print button for tablet -->
  <button class="print-btn" onclick="window.print()">
    🖨 Cetak Struk
  </button>
  
  <div class="receipt-wrapper">
    ${logoSrc ? `<img class="logo-img" src="${logoSrc}" alt="Logo">` : ''}
    <div class="brand">${brandName}</div>
    ${outletName ? `<div class="outlet">${outletName}</div>` : ''}
    
    <div class="divider"></div>
    
    <div class="meta center">
      <span class="type-badge">${orderType === 'dine-in' || orderType === 'dine' ? 'Dine In' : orderType === 'takeaway' || orderType === 'take' ? 'Take Away' : orderType.toUpperCase()}</span>
      ${tableNumber ? ` &nbsp; Meja: <strong>${tableNumber}</strong>` : ''}
    </div>
    <div class="order-no">#${orderNumber}</div>
    <div class="meta center">${dateStr} · ${timeStr}</div>
    <div class="meta center">Kasir: ${cashierName}</div>
    
    <div class="divider"></div>
    
    ${itemsHTML}
    
    <div class="divider"></div>
    
    <div class="sum-row"><span>Subtotal</span><span>${fr(subtotal)}</span></div>
    ${discount > 0 ? `<div class="sum-row"><span>Diskon</span><span>- ${fr(discount)}</span></div>` : ''}
    ${tax > 0 ? `<div class="sum-row"><span>Pajak (11%)</span><span>${fr(tax)}</span></div>` : ''}
    ${serviceCharge > 0 ? `<div class="sum-row"><span>Service (5%)</span><span>${fr(serviceCharge)}</span></div>` : ''}
    
    <div class="sum-total"><span>TOTAL</span><span>${fr(total)}</span></div>
    
    <div class="sum-row"><span>Metode: ${methodLabel}</span><span>${fr(paidAmount)}</span></div>
    ${changeAmount > 0 ? `<div class="sum-row bold"><span>Kembalian</span><span>${fr(changeAmount)}</span></div>` : ''}
    
    ${qrisSrc ? `
    <div class="divider"></div>
    <div class="center meta">Scan QRIS untuk pembayaran:</div>
    <img class="qris-img" src="${qrisSrc}" alt="QRIS">
    ` : ''}
    
    <div class="divider"></div>
    <div class="footer-txt">Terima kasih atas kunjungan Anda!</div>
    <div class="footer-txt">IT AIN'T TASTY IF IT AIN'T NASHTY</div>
    <div style="height: 20px;"></div><!-- paper feed -->
  </div>
  
  <script>
    // Auto-print on load (for direct print flow)
    // Comment this out if you want the user to preview first
    // window.onload = () => window.print();
  </script>
</body>
</html>`;
  }

  /**
   * Opens receipt in new tab/window and triggers print
   * On Android Chrome: opens print dialog, shows installed printers including Moka
   */
  _triggerPrint(html) {
    const printWin = window.open('', '_blank', 'width=400,height=600');
    if (!printWin) {
      // Popup blocked - fallback: create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute;width:0;height:0;top:-9999px;left:-9999px;border:0';
      document.body.appendChild(iframe);
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
      iframe.contentWindow.onload = () => {
        iframe.contentWindow.print();
        setTimeout(() => iframe.remove(), 2000);
      };
      return;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }

  /**
   * Quick print from order history item
   */
  async printFromHistory(histItem, cashierName) {
    const receiptData = {
      orderNumber: histItem.no || histItem.order_number,
      items: histItem.items || [],
      subtotal: histItem.sub || histItem.subtotal || 0,
      discount: histItem.disc || histItem.discount || 0,
      tax: histItem.tax || 0,
      serviceCharge: histItem.svc || histItem.service_charge || 0,
      total: histItem.total || 0,
      paymentMethod: histItem.method || histItem.payment_method || '',
      paidAmount: histItem.total || 0,
      changeAmount: 0,
      cashierName: cashierName || histItem.cashier || 'Kasir',
      tableNumber: histItem.table || histItem.table_number || '',
      orderType: histItem.type || histItem.order_type || 'dine-in',
      createdAt: histItem.created_at || new Date()
    };
    await this.printReceipt(receiptData);
  }

  /**
   * Bluetooth printer detection (future enhancement)
   * Currently not supported on all Android versions
   */
  async connectBluetooth() {
    if (!navigator.bluetooth) {
      toast('Web Bluetooth tidak didukung browser ini. Gunakan Chrome 85+ di Android', 'err');
      return null;
    }
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }] // Generic Serial BT
      });
      toast('Printer Bluetooth terhubung: ' + device.name, 'ok');
      return device;
    } catch (e) {
      toast('Bluetooth: ' + e.message, 'err');
      return null;
    }
  }
}

// Initialize global instance
window.ThermalPrinter = new ThermalPrinterManager();

// Legacy compat
window.printer = {
  printReceipt: (data) => window.ThermalPrinter.printReceipt(data),
  printFromHistory: (h, c) => window.ThermalPrinter.printFromHistory(h, c)
};

console.log('✅ ThermalPrinterManager loaded (80mm thermal + Android + Moka compatible)');
