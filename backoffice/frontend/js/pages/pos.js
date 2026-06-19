// POS GENERAL 
PAGES['pos-general'] = async () => {
  let settings = { brandName: 'Nashty Hot Chicken', invoiceFormat: 'NST-{YYYYMMDD}-{NNNN}', taxRate: 11, serviceCharge: 5, rounding: 'up' };
  try {
    const res = await API.request('/settings/' + API.session.outletId);
    if (res.success && res.settings) {
      Object.assign(settings, res.settings);
    }
  } catch (e) {}

  window.savePosGeneral = async () => {
    const s = {
      brandName: document.getElementById('brandName').value,
      invoiceFormat: document.getElementById('invoiceFormat').value,
      taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
      serviceCharge: parseFloat(document.getElementById('serviceCharge').value) || 0,
      rounding: document.getElementById('rounding').value
    };
    try {
      await API.request('/settings/' + API.session.outletId, { method: 'PUT', body: JSON.stringify({ settings: s }) });
      toast('Pengaturan disimpan', 'ok');
    } catch (e) {
      toast('Gagal menyimpan: ' + (e.message || 'Unknown error'), 'err');
    }
  };

  return `
<div class="ph"><div class="ph-title">Pengaturan Umum POS</div><div class="ph-sub">Konfigurasi dasar POS Terminal</div></div>
<div class="two-equal">
 <div class="card">
 <div class="card-h"><div class="card-t">Informasi Brand</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
 <div class="fld"><label>Nama Brand</label><input id="brandName" value="${settings.brandName || ''}"></div>
 <div class="fld"><label>Format Nomor Invoice</label><input id="invoiceFormat" value="${settings.invoiceFormat || ''}"><div class="fld-hint">Contoh: NST-20260602-0001</div></div>
 </div>
 </div>
 <div class="card">
 <div class="card-h"><div class="card-t">Pajak & Service</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
 <div class="fld"><label>Pajak (%)</label><input type="number" id="taxRate" value="${settings.taxRate !== undefined ? settings.taxRate : 11}"><div class="fld-hint">PPN sesuai regulasi</div></div>
 <div class="fld"><label>Service Charge (%)</label><input type="number" id="serviceCharge" value="${settings.serviceCharge !== undefined ? settings.serviceCharge : 5}"></div>
 <div class="fld"><label>Aturan Pembulatan</label><select id="rounding"><option value="up" ${settings.rounding==='up'?'selected':''}>Pembulatan ke atas (nearest 100)</option><option value="none" ${settings.rounding==='none'?'selected':''}>Tanpa pembulatan</option></select></div>
 </div>
 </div>
</div>
<div style="margin-top:18px;display:flex;justify-content:flex-end;gap:8px">
 <button class="btn" onclick="PAGES['pos-general']().then(h=>document.getElementById('page-area').innerHTML=h)">Reset</button>
 <button class="btn btn-primary" onclick="savePosGeneral()">Simpan Perubahan</button>
</div>`;
};

// POS PAYMENT METHODS 
PAGES['pos-payment'] = async () => {
  let settings = { paymentMethods: {} };
  try {
    const res = await API.request('/settings/' + API.session.outletId);
    if (res.success && res.settings) {
      if (typeof res.settings.paymentMethods === 'string') {
        settings.paymentMethods = JSON.parse(res.settings.paymentMethods);
      } else if (res.settings.paymentMethods) {
        settings.paymentMethods = res.settings.paymentMethods;
      }
    }
  } catch (e) {}

  const defaultMethods = [
    ['Tunai','Uang fisik — konfirmasi kembalian otomatis','#22C55E',true],
    ['Transfer','Transfer bank manual — tanpa numpad','#06B6D4',true],
    ['QRIS','QR code terpadu','#3B82F6',true],
    ['BCA','Virtual Account BCA','#1E40AF',true],
    ['Debit','Kartu debit EDC','#A855F7',true],
    ['GoFood','Order dari GoFood — numpad terkunci','#E3175B',true],
    ['GrabFood','Order dari GrabFood — numpad terkunci','#00B14F',true],
    ['ShopeeFood','Order dari ShopeeFood — numpad terkunci','#EE4D2D',true]
  ];

  window.togglePayment = async (name, checked) => {
    settings.paymentMethods[name] = checked;
    try {
      await API.request('/settings/' + API.session.outletId, { method: 'PUT', body: JSON.stringify({ settings: { paymentMethods: JSON.stringify(settings.paymentMethods) } }) });
      toast(name + ' ' + (checked ? 'diaktifkan' : 'dinonaktifkan'), 'ok');
    } catch (e) {
      toast('Gagal menyimpan: ' + (e.message || 'Unknown error'), 'err');
    }
  };

  return `
<div class="ph"><div class="ph-title">Metode Pembayaran</div><div class="ph-sub">Aktifkan atau nonaktifkan metode yang tersedia di POS</div></div>
<div class="card">
 <div class="card-h"><div class="card-t">Metode Aktif di POS</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
 ${defaultMethods.map(([n,d,c,def])=>{
   const on = settings.paymentMethods[n] !== undefined ? settings.paymentMethods[n] : def;
   return `
 <div class="toggle-row">
 <div style="display:flex;align-items:center;gap:10px">
 <div style="width:36px;height:36px;border-radius:9px;background:${c}18;display:flex;align-items:center;justify-content:center">
 <span style="width:10px;height:10px;border-radius:50%;background:${c};display:block"></span>
 </div>
 <div class="toggle-info"><div class="tl">${n}</div><div class="ts">${d}</div></div>
 </div>
 <label class="toggle">
 <input type="checkbox" ${on?'checked':''} onchange="togglePayment('${n}', this.checked)">
 <div class="toggle-track"></div>
 <div class="toggle-thumb"></div>
 </label>
 </div>`;
 }).join('')}
 </div>
</div>`;
};

// POS RECEIPT 
PAGES['pos-receipt'] = async () => {
  let settings = { 
    receiptName: 'Nashty Hot Chicken', 
    receiptCity: 'Surabaya', 
    receiptPhone: '031-8123456', 
    receiptAddress: 'Galaxy Mall Lt. 3, Surabaya', 
    receiptFooter: "IT AIN'T TASTY IF IT AIN'T NASHTY\\nIG: @nashtychicken | WA: 081234567890",
    receiptCopies: '2',
    receiptLoyalty: true,
    receiptReview: true,
    receiptWa: false
  };
  try {
    const res = await API.request('/settings/' + API.session.outletId);
    if (res.success && res.settings) {
      Object.assign(settings, res.settings);
    }
  } catch (e) {}

  window.savePosReceipt = async () => {
    const s = {
      receiptName: document.getElementById('receiptName').value,
      receiptCity: document.getElementById('receiptCity').value,
      receiptPhone: document.getElementById('receiptPhone').value,
      receiptAddress: document.getElementById('receiptAddress').value,
      receiptFooter: document.getElementById('receiptFooter').value,
      receiptCopies: document.getElementById('receiptCopies').value,
      receiptLoyalty: document.getElementById('receiptLoyalty').checked,
      receiptReview: document.getElementById('receiptReview').checked,
      receiptWa: document.getElementById('receiptWa').checked
    };
    try {
      await API.request('/settings/' + API.session.outletId, { method: 'PUT', body: JSON.stringify({ settings: s }) });
      toast('Pengaturan struk disimpan', 'ok');
      PAGES['pos-receipt']().then(h=>document.getElementById('page-area').innerHTML=h);
    } catch (e) {
      toast('Gagal menyimpan: ' + (e.message || 'Unknown error'), 'err');
    }
  };

  return `
<div class="ph"><div class="ph-title">Pengaturan Struk</div><div class="ph-sub">Konfigurasi tampilan struk thermal</div></div>
<div class="two-col">
 <div style="display:flex;flex-direction:column;gap:18px">
 <div class="card">
 <div class="card-h"><div class="card-t">Informasi Outlet di Struk</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:12px">
 <div class="fld"><label>Nama Restoran</label><input id="receiptName" value="${settings.receiptName || ''}"></div>
 <div class="form-grid form-2">
 <div class="fld"><label>Kota</label><input id="receiptCity" value="${settings.receiptCity || ''}"></div>
 <div class="fld"><label>Telepon</label><input id="receiptPhone" value="${settings.receiptPhone || ''}"></div>
 </div>
 <div class="fld"><label>Alamat</label><textarea id="receiptAddress">${settings.receiptAddress || ''}</textarea></div>
 <div class="fld"><label>Footer Pesan</label><textarea id="receiptFooter" style="height:60px">${settings.receiptFooter || ''}</textarea></div>
 </div>
 </div>
 <div class="card">
 <div class="card-h"><div class="card-t">Cetak & Logo</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:12px">
 <div class="fld"><label>Jumlah Salinan</label><select id="receiptCopies"><option ${settings.receiptCopies==='1'?'selected':''}>1</option><option ${settings.receiptCopies==='2'?'selected':''}>2</option><option ${settings.receiptCopies==='3'?'selected':''}>3</option></select></div>
 <div class="fld"><label>Logo Struk</label>
 <div class="upload-zone" onclick="toast('Upload logo')">
 <div class="upload-zone-ico"></div>
 <div class="upload-zone-t">Upload logo untuk struk</div>
 <div class="upload-zone-s">PNG transparan · Maks 1MB</div>
 </div>
 </div>
 <div style="display:flex;flex-direction:column;gap:8px">
 <div class="toggle-row">
 <div class="toggle-info"><div class="tl">QR Loyalty Program</div></div>
 <label class="toggle"><input id="receiptLoyalty" type="checkbox" ${settings.receiptLoyalty?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
 </div>
 <div class="toggle-row">
 <div class="toggle-info"><div class="tl">QR Google Review</div></div>
 <label class="toggle"><input id="receiptReview" type="checkbox" ${settings.receiptReview?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
 </div>
 <div class="toggle-row">
 <div class="toggle-info"><div class="tl">QR WhatsApp</div></div>
 <label class="toggle"><input id="receiptWa" type="checkbox" ${settings.receiptWa?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
 </div>
 </div>
 </div>
 </div>
 </div>
 <div class="card" style="position:sticky;top:0">
 <div class="card-h"><div class="card-t">Preview Struk</div></div>
 <div class="card-b">
 <div style="background:#fff;border-radius:8px;padding:16px;font-family:var(--mo);font-size:11px;border:1px solid var(--brd);max-width:240px;margin:0 auto;line-height:1.7;color:#000">
 <div style="text-align:center;font-size:14px;font-weight:700;margin-bottom:4px"> ${settings.receiptName ? settings.receiptName.toUpperCase() : 'NASHTY HOT CHICKEN'}</div>
 <div style="text-align:center;font-size:10px;color:#666">${settings.receiptAddress || ''}</div>
 <div style="text-align:center;font-size:10px;color:#666">${settings.receiptPhone || ''}</div>
 <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
 <div style="display:flex;justify-content:space-between"><span>No Order</span><span>SNY-0188</span></div>
 <div style="display:flex;justify-content:space-between"><span>Kasir</span><span>Citra</span></div>
 <div style="display:flex;justify-content:space-between"><span>Tipe</span><span>Dine In · T03</span></div>
 <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
 <div style="display:flex;justify-content:space-between"><span>Ayam Bakar Madu</span><span>55.000</span></div>
 <div style="font-size:10px;color:#666;padding-left:8px">Pedas Extra · +Extra Sambal</div>
 <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
 <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>55.000</span></div>
 <div style="border-top:1px solid #000;margin:4px 0"></div>
 <div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px"><span>TOTAL</span><span>55.000</span></div>
 <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
 <div style="text-align:center;font-size:9.5px;color:#666;white-space:pre-wrap">${settings.receiptFooter || ''}</div>
 </div>
 </div>
 </div>
</div>
<div style="margin-top:18px;display:flex;justify-content:flex-end;gap:8px">
 <button class="btn" onclick="PAGES['pos-receipt']().then(h=>document.getElementById('page-area').innerHTML=h)">Reset</button>
 <button class="btn btn-primary" onclick="savePosReceipt()">Simpan</button>
</div>`;
};
