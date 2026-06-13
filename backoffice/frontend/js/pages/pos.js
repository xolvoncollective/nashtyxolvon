// POS GENERAL 
PAGES['pos-general']=()=>`
<div class="ph"><div class="ph-title">Pengaturan Umum POS</div><div class="ph-sub">Konfigurasi dasar POS Terminal</div></div>
<div class="two-equal">
 <div class="card">
 <div class="card-h"><div class="card-t">Informasi Brand</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
 <div class="fld"><label>Nama Brand</label><input value="Nashty Hot Chicken"></div>
 <div class="fld"><label>Format Nomor Invoice</label><input value="NST-{YYYYMMDD}-{NNNN}"><div class="fld-hint">Contoh: NST-20260602-0001</div></div>
 </div>
 </div>
 <div class="card">
 <div class="card-h"><div class="card-t">Pajak & Service</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
 <div class="fld"><label>Pajak (%)</label><input type="number" value="11"><div class="fld-hint">PPN sesuai regulasi</div></div>
 <div class="fld"><label>Service Charge (%)</label><input type="number" value="5"></div>
 <div class="fld"><label>Aturan Pembulatan</label><select><option>Pembulatan ke atas (nearest 100)</option><option>Tanpa pembulatan</option></select></div>
 </div>
 </div>
</div>
<div style="margin-top:18px;display:flex;justify-content:flex-end;gap:8px">
 <button class="btn">Reset</button>
 <button class="btn btn-primary" onclick="toast('Pengaturan disimpan')">Simpan Perubahan</button>
</div>`;

// POS PAYMENT METHODS 
PAGES['pos-payment']=()=>`
<div class="ph"><div class="ph-title">Metode Pembayaran</div><div class="ph-sub">Aktifkan atau nonaktifkan metode yang tersedia di POS</div></div>
<div class="card">
 <div class="card-h"><div class="card-t">Metode Aktif di POS</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
 ${[['Tunai','Uang fisik — konfirmasi kembalian otomatis','#22C55E',true],
 ['Transfer','Transfer bank manual — tanpa numpad','#06B6D4',true],
 ['QRIS','QR code terpadu','#3B82F6',true],
 ['BCA','Virtual Account BCA','#1E40AF',true],
 ['Debit','Kartu debit EDC','#A855F7',true],
 ['GoFood','Order dari GoFood — numpad terkunci','#E3175B',true],
 ['GrabFood','Order dari GrabFood — numpad terkunci','#00B14F',true],
 ['ShopeeFood','Order dari ShopeeFood — numpad terkunci','#EE4D2D',true]].map(([n,d,c,on])=>`
 <div class="toggle-row">
 <div style="display:flex;align-items:center;gap:10px">
 <div style="width:36px;height:36px;border-radius:9px;background:${c}18;display:flex;align-items:center;justify-content:center">
 <span style="width:10px;height:10px;border-radius:50%;background:${c};display:block"></span>
 </div>
 <div class="toggle-info"><div class="tl">${n}</div><div class="ts">${d}</div></div>
 </div>
 <label class="toggle">
 <input type="checkbox" ${on?'checked':''} onchange="toast('${n} '+(this.checked?'diaktifkan':'dinonaktifkan'))">
 <div class="toggle-track"></div>
 <div class="toggle-thumb"></div>
 </label>
 </div>`).join('')}
 </div>
</div>`;

// POS RECEIPT 
PAGES['pos-receipt']=()=>`
<div class="ph"><div class="ph-title">Pengaturan Struk</div><div class="ph-sub">Konfigurasi tampilan struk thermal</div></div>
<div class="two-col">
 <div style="display:flex;flex-direction:column;gap:18px">
 <div class="card">
 <div class="card-h"><div class="card-t">Informasi Outlet di Struk</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:12px">
 <div class="fld"><label>Nama Restoran</label><input value="Nashty Hot Chicken"></div>
 <div class="form-grid form-2">
 <div class="fld"><label>Kota</label><input value="Surabaya"></div>
 <div class="fld"><label>Telepon</label><input value="031-8123456"></div>
 </div>
 <div class="fld"><label>Alamat</label><textarea>Galaxy Mall Lt. 3, Surabaya</textarea></div>
 <div class="fld"><label>Footer Pesan</label><textarea>IT AIN'T TASTY IF IT AIN'T NASHTY&#10;IG: @nashtychicken | WA: 081234567890</textarea></div>
 </div>
 </div>
 <div class="card">
 <div class="card-h"><div class="card-t">Cetak & Logo</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:12px">
 <div class="fld"><label>Jumlah Salinan</label><select><option>1</option><option selected>2</option><option>3</option></select></div>
 <div class="fld"><label>Logo Struk</label>
 <div class="upload-zone" onclick="toast('Upload logo')">
 <div class="upload-zone-ico"></div>
 <div class="upload-zone-t">Upload logo untuk struk</div>
 <div class="upload-zone-s">PNG transparan · Maks 1MB</div>
 </div>
 </div>
 <div style="display:flex;flex-direction:column;gap:8px">
 ${[['QR Loyalty Program',true],['QR Google Review',true],['QR WhatsApp',false]].map(([l,on])=>`
 <div class="toggle-row">
 <div class="toggle-info"><div class="tl">${l}</div></div>
 <label class="toggle"><input type="checkbox" ${on?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
 </div>`).join('')}
 </div>
 </div>
 </div>
 </div>
 <div class="card" style="position:sticky;top:0">
 <div class="card-h"><div class="card-t">Preview Struk</div></div>
 <div class="card-b">
 <div style="background:#fff;border-radius:8px;padding:16px;font-family:var(--mo);font-size:11px;border:1px solid var(--brd);max-width:240px;margin:0 auto;line-height:1.7;color:#000">
 <div style="text-align:center;font-size:14px;font-weight:700;margin-bottom:4px"> NASHTY HOT CHICKEN</div>
 <div style="text-align:center;font-size:10px;color:#666">Galaxy Mall Lt. 3, Surabaya</div>
 <div style="text-align:center;font-size:10px;color:#666">031-8123456</div>
 <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
 <div style="display:flex;justify-content:space-between"><span>No Order</span><span>SNY-0188</span></div>
 <div style="display:flex;justify-content:space-between"><span>Kasir</span><span>Citra</span></div>
 <div style="display:flex;justify-content:space-between"><span>Tipe</span><span>Dine In · T03</span></div>
 <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
 <div style="display:flex;justify-content:space-between"><span>Ayam Bakar Madu</span><span>55.000</span></div>
 <div style="font-size:10px;color:#666;padding-left:8px">Pedas Extra · +Extra Sambal</div>
 <div style="display:flex;justify-content:space-between"><span>Kopi Susu Aren</span><span>22.000</span></div>
 <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
 <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>77.000</span></div>
 <div style="display:flex;justify-content:space-between"><span>Pajak 11%</span><span>8.470</span></div>
 <div style="display:flex;justify-content:space-between"><span>Service 5%</span><span>3.850</span></div>
 <div style="border-top:1px solid #000;margin:4px 0"></div>
 <div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px"><span>TOTAL</span><span>89.320</span></div>
 <div style="border-top:1px dashed #ccc;margin:8px 0"></div>
 <div style="text-align:center;font-size:9.5px;color:#666">IT AIN'T TASTY IF IT AIN'T NASHTY</div>
 <div style="text-align:center;font-size:9px;color:#666">@nashtychicken</div>
 </div>
 </div>
 </div>
</div>
<div style="margin-top:18px;display:flex;justify-content:flex-end;gap:8px">
 <button class="btn">Reset</button>
 <button class="btn btn-primary" onclick="toast('Pengaturan struk disimpan')">Simpan</button>
</div>`;
