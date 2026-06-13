class ThermalPrinter {
  constructor() {
    this.device = null;
    this.encoder = new TextEncoder();
  }

  async connect() {
    try {
      this.device = await navigator.usb.requestDevice({
        filters: [{ classCode: 7 }] // Printer class
      });
      await this.device.open();
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }
      await this.device.claimInterface(0);
      toast('Printer terhubung', 'success');
      return true;
    } catch (err) {
      console.error(err);
      toast('Gagal menghubungkan printer: ' + err.message, 'err');
      return false;
    }
  }

  async print(data) {
    if (!this.device) {
      toast('Printer belum terhubung', 'err');
      return;
    }
    try {
      const endpointNumber = this.device.configuration.interfaces[0].alternate.endpoints.find(e => e.direction === 'out').endpointNumber;
      await this.device.transferOut(endpointNumber, data);
    } catch (err) {
      console.error('Print error:', err);
      toast('Gagal mencetak', 'err');
    }
  }

  getPrintData(receipt) {
    const ESC = '\\x1B';
    const GS = '\\x1D';
    
    let text = "";
    // Init
    text += ESC + "@";
    
    // Header
    text += ESC + "a" + "\\x01"; // Center align
    text += "NASHTY HOT CHICKEN\\n";
    text += "Jl. Lotus Tim. RT.004/RW.019, Bekasi\\n";
    text += "081211739055\\n";
    text += "--------------------------------\\n";
    
    // Meta
    text += ESC + "a" + "\\x00"; // Left align
    text += `Receipt: ${receipt.no}\\n`;
    text += `Tanggal: ${receipt.date}\\n`;
    text += `Kasir: ${receipt.cashier}\\n`;
    text += "--------------------------------\\n";
    
    // Items
    for (const item of receipt.items) {
      text += `${item.name}\\n`;
      text += `${item.qty}x @${item.price}   ${item.total}\\n`;
      if (item.modifiers) {
        text += `  + ${item.modifiers}\\n`;
      }
    }
    text += "--------------------------------\\n";
    
    // Total
    text += `Subtotal:      ${receipt.subtotal}\\n`;
    text += `Tax:           ${receipt.tax}\\n`;
    text += `Total:         ${receipt.total}\\n`;
    text += `Metode:        ${receipt.method}\\n`;
    
    // Footer
    text += ESC + "a" + "\\x01"; // Center align
    text += "--------------------------------\\n";
    text += "IT AIN'T TASTY IF IT AIN'T NASHTY\\n";
    
    // Cut paper
    text += GS + "V" + "\\x41" + "\\x03";
    
    return this.encoder.encode(text);
  }

  async printReceipt(receipt) {
    if(!this.device) await this.connect();
    if(this.device) {
       const data = this.getPrintData(receipt);
       await this.print(data);
    }
  }
}

window.printer = new ThermalPrinter();
