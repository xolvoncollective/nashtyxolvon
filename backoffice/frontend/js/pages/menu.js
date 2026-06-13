// CATEGORIES 
PAGES.categories=()=>{
  const cats = window.CATEGORIES || [];
  return `
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Kategori Menu</div><div class="ph-sub">Kelola kategori yang tampil di POS</div></div>
 <button class="btn btn-primary" onclick="openCatModal()">'+ico('plus')+' Tambah Kategori</button>
 </div>
</div>
<div class="card">
 <div class="card-h">
 <div><div class="card-t">Semua Kategori</div><div class="card-sub">Drag untuk mengubah urutan</div></div>
 <span class="badge badge-blue">${cats.length} kategori</span>
 </div>
 <div class="tbl-wrap">
 <table>
 <thead><tr><th style="width:32px"></th><th>#</th><th>Nama Kategori</th><th>Deskripsi</th><th>Produk</th><th>Status</th><th>Aksi</th></tr></thead>
 <tbody>
 ${cats.length ? cats.map(c=>`
 <tr class="drag-row">
 <td><span class="drag-handle"></span></td>
 <td class="mono">${c.order}</td>
 <td class="bold">${c.name}</td>
 <td style="color:var(--txt3)">${c.desc||'—'}</td>
 <td><span class="badge badge-gray">${c.products} produk</span></td>
 <td><span class="badge ${c.active?'badge-green':'badge-red'}">${c.active?'Aktif':'Nonaktif'}</span></td>
 <td>
 <div style="display:flex;gap:6px">
 <button class="btn btn-sm" onclick="toast('Edit kategori: ${c.name}')">${ico('edit')} Edit</button>
 <button class="btn btn-sm btn-danger" onclick="confirm_act('Hapus kategori ${c.name}?',()=>${ico('del')})"></button>
 </div>
 </td>
 </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">Belum ada kategori</td></tr>'}
 </tbody>
 </table>
 </div>
</div>`;
};

function openCatModal(){
 document.body.insertAdjacentHTML('beforeend',`
 <div class="modal-overlay" id="mod-cat" onclick="if(event.target===this)this.remove()">
 <div class="modal" onclick="event.stopPropagation()">
 <div class="modal-h"><div class="modal-t">Tambah Kategori</div><div class="modal-x" onclick="document.getElementById('mod-cat').remove()"></div></div>
 <div class="modal-b">
 <div class="fld"><label>Nama Kategori *</label><input placeholder="contoh: Makanan Utama"></div>
 <div class="fld"><label>Deskripsi</label><textarea placeholder="Opsional"></textarea></div>
 <div class="form-grid form-2">
 <div class="fld"><label>Urutan</label><input type="number" value="${CATEGORIES.length+1}"></div>
 <div class="fld"><label>Status</label><select><option>Aktif</option><option>Nonaktif</option></select></div>
 </div>
 </div>
 <div class="modal-foot">
 <button class="btn" onclick="document.getElementById('mod-cat').remove()">Batal</button>
 <button class="btn btn-primary" onclick="document.getElementById('mod-cat').remove();toast('Kategori berhasil ditambahkan')">Simpan Kategori</button>
 </div>
 </div>
 </div>`);
}

// PRODUCTS 
PAGES.products=()=>{
  const prods = window.PRODUCTS || [];
  const cats = window.CATEGORIES || [];
  return `
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Produk</div><div class="ph-sub">Kelola semua menu yang tersedia di POS</div></div>
 <button class="btn btn-primary" onclick="openProdModal()">'+ico('plus')+' Tambah Produk</button>
 </div>
</div>
<div class="sf-bar">
 <div class="search-wrap"><input class="search-inp" placeholder="Cari nama produk..."></div>
 <select class="filter-select"><option>Semua Kategori</option>${cats.map(c=>`<option>${c.name}</option>`).join('')}</select>
 <select class="filter-select"><option>Semua Status</option><option>Aktif</option><option>Nonaktif</option></select>
</div>
<div class="card">
 <div class="tbl-wrap">
 <table>
 <thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Status</th><th>Outlet</th><th>Aksi</th></tr></thead>
 <tbody>
 ${prods.length ? prods.map(p=>`
 <tr>
 <td>
 <div style="display:flex;align-items:center;gap:10px">
 ${p.img ? `<div style="width:40px;height:40px;border-radius:6px;background:url(${p.img}) center/cover"></div>` : `<div style="width:40px;height:40px;border-radius:6px;background:var(--sf3);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--txt3)">No IMG</div>`}
 <div>
 <div class="bold">${p.name}</div>
 <div style="font-size:11.5px;color:var(--txt3)">${p.desc}</div>
 </div>
 </div>
 </td>
 <td><span class="badge badge-gray">${p.cat}</span></td>
 <td class="mono">${fr(p.price)}</td>
 <td><span class="badge ${p.active?'badge-green':'badge-red'}">${p.active?'Aktif':'Nonaktif'}</span></td>
 <td><span class="badge badge-blue">Global</span></td>
 <td>
 <div style="display:flex;gap:5px">
 <button class="btn btn-sm" onclick="openProdModal('${p.name}')">${ico('edit')} Edit</button>
 <button class="btn btn-sm" onclick="toast('${p.name} diduplikat')">${ico('dup')} Duplikat</button>
 <button class="btn btn-sm btn-danger" onclick="toast('${p.name} diarsipkan','err')">${ico('del')} Arsip</button>
 </div>
 </td>
 </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999">Belum ada produk</td></tr>'}
 </tbody>
 </table>
 </div>
 <div style="padding:12px 16px;border-top:1px solid var(--brd)">
 <div class="pagination">
 <span class="pg-info">Menampilkan ${prods.length} produk</span>
 </div>
 </div>
</div>`;
};

function openProdModal(name=''){
 document.body.insertAdjacentHTML('beforeend',`
 <div class="modal-overlay" id="mod-prod" onclick="if(event.target===this)this.remove()">
 <div class="modal" style="width:580px" onclick="event.stopPropagation()">
 <div class="modal-h"><div class="modal-t">${name?'Edit Produk: '+name:'Tambah Produk Baru'}</div><div class="modal-x" onclick="document.getElementById('mod-prod').remove()"></div></div>
 <div class="modal-b">
 <div class="form-grid form-2">
 <div class="fld"><label>Nama Produk *</label><input value="${name}" placeholder="Nama menu"></div>
 <div class="fld"><label>Kategori *</label><select>${CATEGORIES.map(c=>`<option>${c.name}</option>`).join('')}</select></div>
 </div>
 <div class="form-grid form-2">
 <div class="fld"><label>Harga *</label><input type="number" placeholder="55000"></div>
 <div class="fld"><label>Status</label><select><option>Aktif</option><option>Nonaktif</option></select></div>
 </div>
 <div class="fld"><label>Deskripsi</label><textarea placeholder="Deskripsi singkat produk..."></textarea></div>
 <div class="fld"><label>Foto Produk</label>
 <div class="upload-zone" onclick="toast('Upload foto')">
 <div class="upload-zone-ico"></div>
 <div class="upload-zone-t">Klik untuk upload foto</div>
 <div class="upload-zone-s">JPG, PNG, WebP · Maks 2MB</div>
 </div>
 </div>
 <div class="fld"><label>Modifier Groups</label>
 <div style="display:flex;flex-direction:column;gap:6px">
 ${MODIFIERS.map(m=>`
 <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--sf2);border-radius:8px;cursor:pointer">
 <input type="checkbox" ${m.id<=2?'checked':''}>
 <span style="font-size:13px;font-weight:600">${m.name}</span>
 <span class="badge badge-gray" style="margin-left:auto">${m.type==='single'?'Pilih 1':'Multi'}</span>
 </label>`).join('')}
 </div>
 </div>
 <div class="fld"><label>Outlet Availability</label>
 <div style="display:flex;flex-direction:column;gap:6px">
 ${OUTLETS.map(o=>`
 <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--sf2);border-radius:8px;cursor:pointer">
 <input type="checkbox" checked>
 <span style="font-size:13px;font-weight:600">${o.name}</span>
 <span style="font-size:11px;color:var(--txt3);margin-left:auto">${o.city}</span>
 </label>`).join('')}
 </div>
 </div>
 </div>
 <div class="modal-foot">
 <button class="btn" onclick="document.getElementById('mod-prod').remove()">Batal</button>
 <button class="btn btn-primary" onclick="document.getElementById('mod-prod').remove();toast('Produk berhasil disimpan')">Simpan Produk</button>
 </div>
 </div>
 </div>`);
}

// MODIFIERS 
PAGES.modifiers=()=>`
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Modifier Groups</div><div class="ph-sub">Opsi dan variasi add-on untuk produk</div></div>
 <button class="btn btn-primary" onclick="openModModal()">'+ico('plus')+' Tambah Group</button>
 </div>
</div>
<div class="three-col">
 ${MODIFIERS.map(m=>`
 <div class="card">
 <div class="card-h">
 <div>
 <div class="card-t">${m.name}</div>
 <div style="display:flex;gap:5px;margin-top:5px">
 <span class="badge ${m.required?'badge-orange':'badge-gray'}">${m.required?'Wajib':'Opsional'}</span>
 <span class="badge badge-blue">${m.type==='single'?'Pilih 1':'Multi-pilih'}</span>
 </div>
 </div>
 <div style="display:flex;gap:5px">
 <button class="btn btn-icon btn-sm" onclick="toast('Edit ${m.name}')">${ico('edit')}</button>
 <button class="btn btn-icon btn-sm btn-danger" onclick="confirm_act('Hapus group ${m.name}?',()=>toast('Group dihapus'))"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg></button>
 </div>
 </div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:6px">
 ${m.items.map(it=>`
 <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--sf2);border-radius:8px">
 <span style="font-size:13px;font-weight:500">${it}</span>
 <div style="display:flex;gap:4px">
 <button class="btn btn-sm" onclick="toast('Edit item')">'+ico('edit')+'</button>
 <button class="btn btn-sm btn-danger" onclick="toast('Item dihapus','err')">✕</button>
 </div>
 </div>`).join('')}
 <button class="btn btn-sm" style="width:100%;justify-content:center;margin-top:4px" onclick="toast('Tambah item ke ${m.name}')">${ico('plus')} Tambah Item</button>
 </div>
 </div>`).join('')}
</div>`;

function openModModal(){
 document.body.insertAdjacentHTML('beforeend',`
 <div class="modal-overlay" id="mod-modifier" onclick="if(event.target===this)this.remove()">
 <div class="modal" onclick="event.stopPropagation()">
 <div class="modal-h"><div class="modal-t">Tambah Modifier Group</div><div class="modal-x" onclick="document.getElementById('mod-modifier').remove()"></div></div>
 <div class="modal-b">
 <div class="fld"><label>Nama Group *</label><input placeholder="contoh: Level Pedas"></div>
 <div class="form-grid form-2">
 <div class="fld"><label>Tipe Pilihan</label><select><option>Single Choice</option><option>Multiple Choice</option></select></div>
 <div class="fld"><label>Wajib Dipilih</label><select><option>Ya (Required)</option><option>Tidak (Optional)</option></select></div>
 </div>
 <div class="form-grid form-2">
 <div class="fld"><label>Min Pilihan</label><input type="number" value="0"></div>
 <div class="fld"><label>Max Pilihan</label><input type="number" value="1"></div>
 </div>
 <div class="fld"><label>Items (satu per baris)</label><textarea placeholder="Original&#10;Pedas Sedang&#10;Pedas Extra" rows="4"></textarea></div>
 </div>
 <div class="modal-foot">
 <button class="btn" onclick="document.getElementById('mod-modifier').remove()">Batal</button>
 <button class="btn btn-primary" onclick="document.getElementById('mod-modifier').remove();toast('Modifier group dibuat')">Simpan</button>
 </div>
 </div>
 </div>`);
}
