// =============================================
// CATEGORIES PAGE
// =============================================
PAGES.categories = () => {
  const cats = window.CATEGORIES || [];
  return `
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Kategori Menu</div><div class="ph-sub">Kelola kategori yang tampil di POS</div></div>
 <button class="btn btn-primary" onclick="openCatModal()">${ico('plus')} Tambah Kategori</button>
 </div>
</div>
<div class="card">
 <div class="card-h">
 <div><div class="card-t">Semua Kategori</div><div class="card-sub">Klik Edit untuk mengelola kategori dan produknya</div></div>
 <span class="badge badge-blue">${cats.length} kategori</span>
 </div>
 <div class="tbl-wrap">
 <table>
 <thead><tr><th style="width:32px"></th><th>#</th><th>Nama Kategori</th><th>Deskripsi</th><th>Produk</th><th>Status</th><th>Aksi</th></tr></thead>
 <tbody>
 ${cats.length ? cats.map((c, i) => `
 <tr class="drag-row" id="cat-row-${c.id}">
 <td><span class="drag-handle">⠿</span></td>
 <td class="mono">${c.order || i + 1}</td>
 <td class="bold">${c.name}</td>
 <td style="color:var(--txt3)">${c.desc || '—'}</td>
 <td><span class="badge badge-gray" id="cat-prod-count-${c.id}">${c.products || 0} produk</span></td>
 <td><span class="badge ${c.active ? 'badge-green' : 'badge-red'}" id="cat-status-badge-${c.id}">${c.active ? 'Aktif' : 'Nonaktif'}</span></td>
 <td>
 <div style="display:flex;gap:6px">
 <button class="btn btn-sm" id="cat-edit-btn-${c.id}" onclick="openCatEditPanel('${c.id}','${encodeURIComponent(c.name)}','${encodeURIComponent(c.desc || '')}',${c.active})">${ico('edit')} Edit</button>
 <button class="btn btn-sm btn-danger" onclick="deleteCategory('${c.id}','${encodeURIComponent(c.name)}')">${ico('del')}</button>
 </div>
 </td>
 </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">Belum ada kategori</td></tr>'}
 </tbody>
 </table>
 </div>
</div>`;
};

// ── OPEN CATEGORY ADD MODAL ──────────────────────────────────────────────────
function openCatModal() {
  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal-overlay" id="mod-cat" onclick="if(event.target===this)this.remove()">
  <div class="modal" onclick="event.stopPropagation()">
  <div class="modal-h"><div class="modal-t">Tambah Kategori Baru</div><div class="modal-x" onclick="document.getElementById('mod-cat').remove()">✕</div></div>
  <div class="modal-b">
  <div class="fld"><label>Nama Kategori *</label><input id="cat-name-inp" placeholder="contoh: Main Course" autofocus></div>
  <div class="fld"><label>Deskripsi</label><textarea id="cat-desc-inp" placeholder="Opsional" rows="2"></textarea></div>
  </div>
  <div class="modal-foot">
  <button class="btn" onclick="document.getElementById('mod-cat').remove()">Batal</button>
  <button class="btn btn-primary" onclick="saveCategory()">Simpan Kategori</button>
  </div>
  </div>
  </div>`);
  setTimeout(() => document.getElementById('cat-name-inp') && document.getElementById('cat-name-inp').focus(), 80);
}

// ── SAVE NEW CATEGORY ────────────────────────────────────────────────────────
window.saveCategory = async function () {
  const name = document.getElementById('cat-name-inp').value.trim();
  const desc = document.getElementById('cat-desc-inp') ? document.getElementById('cat-desc-inp').value.trim() : '';
  if (!name) { toast('Nama kategori wajib diisi', 'err'); return; }
  try {
    const res = await API.categories.create({ name, description: desc });
    if (res.success) {
      toast('Kategori berhasil ditambahkan', 'ok');
      document.getElementById('mod-cat').remove();
      await reloadCatalog();
      nav('categories', document.querySelector('.sb-item[onclick*="categories"]'));
    } else {
      toast('Gagal: ' + (res.error || 'Unknown error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error menyimpan kategori: ' + err.message, 'err');
  }
};

// ── OPEN CATEGORY EDIT PANEL ─────────────────────────────────────────────────
window.openCatEditPanel = async function (catId, encodedName, encodedDesc, isActive) {
  const name = decodeURIComponent(encodedName);
  const desc = decodeURIComponent(encodedDesc);

  // Remove any existing panel
  const existing = document.getElementById('cat-edit-overlay');
  if (existing) existing.remove();

  // Show loading overlay
  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal-overlay" id="cat-edit-overlay" onclick="if(event.target===this)closeCatEditPanel()">
  <div class="modal" style="width:680px;max-height:88vh" onclick="event.stopPropagation()">
  <div class="modal-h">
    <div>
      <div class="modal-t">Edit Kategori</div>
      <div style="font-size:12px;color:var(--txt3);margin-top:2px">${name}</div>
    </div>
    <div class="modal-x" onclick="closeCatEditPanel()">✕</div>
  </div>
  <div class="modal-b" id="cat-edit-body">
    <div style="text-align:center;padding:30px;color:var(--txt3)">⏳ Memuat data...</div>
  </div>
  <div class="modal-foot" id="cat-edit-foot" style="gap:8px;justify-content:space-between">
    <div style="display:flex;gap:8px">
      <button class="btn btn-danger" onclick="deleteCategory('${catId}','${encodedName}',true)">${ico('del')} Hapus Kategori</button>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn" onclick="closeCatEditPanel()">Tutup</button>
      <button class="btn btn-primary" onclick="saveCatEdit('${catId}')">Simpan Perubahan</button>
    </div>
  </div>
  </div>
  </div>`);

  // Fetch products in this category
  try {
    const res = await API.categories.getProducts(catId);
    const products = res.products || [];
    const cat = res.category || { name, description: desc, status: isActive ? 'active' : 'inactive' };

    const catIsActive = cat.status === 'active';

    const bodyHtml = `
    <!-- Edit Info Section -->
    <div style="background:var(--sf2);border-radius:12px;padding:16px">
      <div style="font-size:12px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px">Informasi Kategori</div>
      <div class="form-grid form-2">
        <div class="fld">
          <label>Nama Kategori *</label>
          <input id="cat-edit-name" value="${cat.name || name}" placeholder="Nama kategori">
        </div>
        <div class="fld">
          <label>Status</label>
          <select id="cat-edit-status">
            <option value="active" ${catIsActive ? 'selected' : ''}>Aktif</option>
            <option value="inactive" ${!catIsActive ? 'selected' : ''}>Nonaktif</option>
          </select>
        </div>
      </div>
      <div class="fld" style="margin-top:12px">
        <label>Deskripsi</label>
        <textarea id="cat-edit-desc" rows="2" placeholder="Deskripsi opsional">${cat.description || desc}</textarea>
      </div>
    </div>

    <!-- Products Section -->
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--txt)">Produk dalam Kategori</div>
          <div style="font-size:12px;color:var(--txt3);margin-top:1px">${products.length} produk total</div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="openAddProductToCatModal('${catId}')">${ico('plus')} Tambah Produk</button>
      </div>
      <div class="tbl-wrap" style="border:1px solid var(--brd);border-radius:10px;overflow:hidden">
        <table>
          <thead><tr><th>Nama Produk</th><th>Harga</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody id="cat-products-tbody">
          ${products.length ? products.map(p => `
          <tr id="cat-prod-row-${p.id}">
            <td>
              <div class="bold">${p.name}</div>
              <div style="font-size:11px;color:var(--txt3)">${p.description || ''}</div>
            </td>
            <td class="mono">${fr(p.price)}</td>
            <td>
              <select onchange="changeProdStatusInCat('${p.id}',this.value,'${catId}')"
                style="padding:4px 8px;border-radius:6px;font-size:12px;font-family:var(--fn);background:var(--sf);color:var(--txt);border:1px solid var(--brd)">
                <option value="active" ${p.status === 'active' ? 'selected' : ''}>Aktif</option>
                <option value="inactive" ${p.status === 'inactive' ? 'selected' : ''}>Nonaktif</option>
                <option value="soldout" ${p.status === 'soldout' ? 'selected' : ''}>Habis (Sold)</option>
              </select>
            </td>
            <td>
              <div style="display:flex;gap:5px">
                <button class="btn btn-sm" onclick="openProdModal('${p.id}')" title="Edit produk">${ico('edit')}</button>
                <button class="btn btn-sm" onclick="removeProductFromCat('${p.id}','${encodeURIComponent(p.name)}','${catId}')" title="Lepaskan dari kategori" style="color:var(--ye)">⊘</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProdInCat('${p.id}','${encodeURIComponent(p.name)}','${catId}')" title="Hapus produk">${ico('del')}</button>
              </div>
            </td>
          </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:20px;color:#999">Belum ada produk dalam kategori ini</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;

    const body = document.getElementById('cat-edit-body');
    if (body) body.innerHTML = bodyHtml;
  } catch (err) {
    console.error(err);
    const body = document.getElementById('cat-edit-body');
    if (body) body.innerHTML = `<div style="color:var(--rd);padding:20px">Error memuat data: ${err.message}</div>`;
  }
};

window.closeCatEditPanel = function () {
  const el = document.getElementById('cat-edit-overlay');
  if (el) el.remove();
};

// ── SAVE CATEGORY EDIT ───────────────────────────────────────────────────────
window.saveCatEdit = async function (catId) {
  const nameEl = document.getElementById('cat-edit-name');
  const descEl = document.getElementById('cat-edit-desc');
  const statusEl = document.getElementById('cat-edit-status');

  if (!nameEl) return;
  const name = nameEl.value.trim();
  const desc = descEl ? descEl.value.trim() : '';
  const status = statusEl ? statusEl.value : 'active';

  if (!name) { toast('Nama kategori wajib diisi', 'err'); return; }

  try {
    // Update name/description
    const updateRes = await API.categories.update(catId, { name, description: desc });
    // Update status separately
    const statusRes = await API.categories.updateStatus(catId, status);

    if ((updateRes && updateRes.success !== false) || (statusRes && statusRes.success !== false)) {
      toast('Kategori berhasil diperbarui', 'ok');
      closeCatEditPanel();
      await reloadCatalog();
      nav('categories', document.querySelector('.sb-item[onclick*="categories"]'));
    } else {
      toast('Gagal memperbarui: ' + (updateRes.error || statusRes.error || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};

// ── DELETE CATEGORY ──────────────────────────────────────────────────────────
window.deleteCategory = async function (catId, encodedName, fromEditPanel = false) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Hapus kategori "${name}"?\n\nSemua produk di dalamnya akan dinonaktifkan.`)) return;
  try {
    const res = await API.categories.delete(catId);
    if (res.success) {
      toast(`Kategori "${name}" dihapus`, 'ok');
      if (fromEditPanel) closeCatEditPanel();
      await reloadCatalog();
      nav('categories', document.querySelector('.sb-item[onclick*="categories"]'));
    } else {
      toast('Gagal hapus: ' + (res.error || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};

// ── CHANGE PRODUCT STATUS FROM CATEGORY PANEL ────────────────────────────────
window.changeProdStatusInCat = async function (prodId, status, catId) {
  try {
    const res = await API.products.updateStatus(prodId, status);
    if (res && res.success !== false) {
      toast('Status produk diubah', 'ok');
      // Update local PRODUCTS cache
      if (window.PRODUCTS) {
        const p = window.PRODUCTS.find(p => p.id === prodId);
        if (p) { p.status = status; p.active = status === 'active'; }
      }
    } else {
      toast('Gagal ubah status: ' + (res.error || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};

// ── REMOVE PRODUCT FROM CATEGORY ─────────────────────────────────────────────
window.removeProductFromCat = async function (prodId, encodedName, catId) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Lepaskan "${name}" dari kategori ini?\n\nProduk tidak akan dihapus, hanya dipindahkan ke "tanpa kategori".`)) return;
  try {
    const res = await API.products.removeFromCategory(prodId);
    if (res && res.success !== false) {
      toast(`"${name}" dilepas dari kategori`, 'ok');
      // Remove row from DOM
      const row = document.getElementById(`cat-prod-row-${prodId}`);
      if (row) row.remove();
      await reloadCatalog();
    } else {
      toast('Gagal: ' + (res.error || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};

// ── DELETE PRODUCT FROM CATEGORY PANEL ───────────────────────────────────────
window.deleteProdInCat = async function (prodId, encodedName, catId) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Hapus produk "${name}"?\nProduk akan dinonaktifkan (soft delete).`)) return;
  try {
    const res = await API.products.delete(prodId);
    if (res && res.success !== false) {
      toast(`"${name}" dihapus`, 'ok');
      const row = document.getElementById(`cat-prod-row-${prodId}`);
      if (row) row.remove();
      await reloadCatalog();
    } else {
      toast('Gagal hapus: ' + (res.error || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};

// ── OPEN ADD PRODUCT TO CATEGORY MODAL ───────────────────────────────────────
window.openAddProductToCatModal = function (catId) {
  // Open full product creation modal pre-filled with this category
  openProdModal(null, catId);
};

// ── RELOAD CATALOG DATA (includes modifiers) ─────────────────────────────────
async function reloadCatalog() {
  try {
    const catRes = await API.categories.getAll();
    if (catRes.success) {
      window.CATEGORIES = catRes.data.map((c, i) => ({
        id: c.id,
        name: c.name,
        desc: c.description || '',
        order: c.display_order || i + 1,
        active: c.is_active === 1 || c.status === 'active',
        products: c.product_count || 0
      }));
    }
    const prodRes = await API.products.getAll({ status: 'all' });
    if (prodRes.success) {
      window.PRODUCTS = prodRes.data.map(p => ({
        id: p.id,
        name: p.name,
        cat: p.category_name,
        categoryId: p.category_id,
        price: p.price,
        desc: p.description || '',
        active: p.is_active === 1 || p.status === 'active',
        status: p.status || 'active',
        img: p.image_url || ''
      }));
    }
    const modRes = await API.modifiers.getAll();
    if (modRes.success) {
      window.MODIFIERS = modRes.modifiers.map(m => ({
        id: m.id,
        name: m.name,
        desc: m.description || '',
        type: m.type === 'single' ? 'single' : 'multi',
        required: m.required === 1 || m.required === true,
        min: m.min_select || 0,
        max: m.max_select || 1,
        order: m.display_order || 0,
        productCount: m.product_count || 0,
        items: (m.options || []).map(o => ({
          id: o.id,
          name: o.name,
          price: o.price_adjustment || 0
        }))
      }));
    }
  } catch (e) {
    console.error('Failed to reload catalog:', e);
  }
}


// =============================================
// PRODUCTS PAGE
// =============================================
PAGES.products = () => {
  const prods = window.PRODUCTS || [];
  const cats = window.CATEGORIES || [];
  return `
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Produk</div><div class="ph-sub">Kelola semua menu yang tersedia di POS</div></div>
 <button class="btn btn-primary" onclick="openProdModal()">${ico('plus')} Tambah Produk</button>
 </div>
</div>
<div class="sf-bar">
 <div class="search-wrap"><input class="search-inp" id="prod-search" placeholder="Cari nama produk..." oninput="filterProducts()"></div>
 <select class="filter-select" id="prod-filter-cat" onchange="filterProducts()"><option value="">Semua Kategori</option>${cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}</select>
 <select class="filter-select" id="prod-filter-status" onchange="filterProducts()"><option value="">Semua Status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option><option value="soldout">Habis</option></select>
</div>
<div class="card">
 <div class="tbl-wrap">
 <table>
 <thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Status</th><th>Aksi</th></tr></thead>
 <tbody id="prod-tbody">
 ${renderProductRows(prods)}
 </tbody>
 </table>
 </div>
 <div style="padding:12px 16px;border-top:1px solid var(--brd)">
 <div class="pagination">
 <span class="pg-info" id="prod-count-lbl">Menampilkan ${prods.length} produk</span>
 </div>
 </div>
</div>`;
};

function renderProductRows(prods) {
  if (!prods.length) return '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">Belum ada produk</td></tr>';
  return prods.map(p => `
  <tr id="prod-row-${p.id}">
  <td>
  <div style="display:flex;align-items:center;gap:10px">
  ${p.img ? `<div style="width:40px;height:40px;border-radius:6px;background:url(${p.img}) center/cover"></div>` : `<div style="width:40px;height:40px;border-radius:6px;background:var(--sf3);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--txt3)">IMG</div>`}
  <div>
  <div class="bold">${p.name}</div>
  <div style="font-size:11.5px;color:var(--txt3)">${p.desc || ''}</div>
  </div>
  </div>
  </td>
  <td><span class="badge badge-gray">${p.cat || '—'}</span></td>
  <td class="mono">${fr(p.price)}</td>
  <td>
    <select onchange="changeProductStatus('${p.id}', this.value)" style="padding:4px 8px;border-radius:6px;font-family:var(--fn);font-size:12px;background:var(--sf);color:var(--txt);border:1px solid var(--brd)">
      <option value="active" ${p.status === 'active' ? 'selected' : ''}>Aktif</option>
      <option value="inactive" ${p.status === 'inactive' ? 'selected' : ''}>Nonaktif</option>
      <option value="soldout" ${p.status === 'soldout' ? 'selected' : ''}>Habis (Sold)</option>
    </select>
  </td>
  <td>
  <div style="display:flex;gap:5px">
  <button class="btn btn-sm" onclick="openProdModal('${p.id}')">${ico('edit')} Edit</button>
  <button class="btn btn-sm" onclick="duplicateProd('${p.id}')">${ico('dup')}</button>
  <button class="btn btn-sm btn-danger" onclick="archiveProd('${p.id}','${encodeURIComponent(p.name)}')">${ico('del')}</button>
  </div>
  </td>
  </tr>`).join('');
}

window.filterProducts = function () {
  const search = (document.getElementById('prod-search') || {}).value || '';
  const catFilter = (document.getElementById('prod-filter-cat') || {}).value || '';
  const statusFilter = (document.getElementById('prod-filter-status') || {}).value || '';
  const prods = window.PRODUCTS || [];
  const filtered = prods.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.cat === catFilter;
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });
  const tbody = document.getElementById('prod-tbody');
  if (tbody) tbody.innerHTML = renderProductRows(filtered);
  const lbl = document.getElementById('prod-count-lbl');
  if (lbl) lbl.textContent = `Menampilkan ${filtered.length} produk`;
};

window.changeProductStatus = async function (id, status) {
  try {
    const res = await API.products.updateStatus(id, status);
    if (res && res.success !== false) {
      toast('Status produk berhasil diubah');
      const prod = window.PRODUCTS && window.PRODUCTS.find(p => p.id === id);
      if (prod) { prod.status = status; prod.active = status === 'active'; }
    } else {
      toast('Gagal mengubah status: ' + ((res && res.error) || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error saat mengubah status', 'err');
  }
};

window.duplicateProd = async function (id) {
  try {
    const res = await API.request(`/products/${id}/duplicate`, { method: 'POST', body: JSON.stringify({}) });
    if (res && res.success) {
      toast('Produk berhasil diduplikat', 'ok');
      await reloadCatalog();
      nav('products', document.querySelector('.sb-item[onclick*="products"]'));
    } else {
      toast('Gagal duplikat: ' + ((res && res.error) || 'Error'), 'err');
    }
  } catch (err) {
    toast('Error duplikat: ' + err.message, 'err');
  }
};

window.archiveProd = async function (id, encodedName) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Hapus produk "${name}"?\nProduk akan dinonaktifkan.`)) return;
  try {
    const res = await API.products.delete(id);
    if (res && res.success !== false) {
      toast(`"${name}" dihapus`);
      const row = document.getElementById(`prod-row-${id}`);
      if (row) row.remove();
      await reloadCatalog();
    } else {
      toast('Gagal hapus: ' + ((res && res.error) || 'Error'), 'err');
    }
  } catch (err) {
    toast('Error: ' + err.message, 'err');
  }
};


// =============================================
// PRODUCT ADD / EDIT MODAL
// =============================================
window.openProdModal = async function (prodId = null, defaultCatId = null) {
  // Remove existing
  const ex = document.getElementById('mod-prod');
  if (ex) ex.remove();

  const cats = window.CATEGORIES || [];
  let prod = null;

  if (prodId) {
    try {
      const r = await API.products.getById(prodId);
      if (r.success) prod = r.data;
    } catch (e) { console.error(e); }
  }

  const mods = window.MODIFIERS || [];
  const isEdit = !!prod;
  const title = isEdit ? `Edit Produk: ${prod.name}` : 'Tambah Produk Baru';

  // Build assigned modifier IDs set for easy lookup
  const assignedModIds = new Set(
    (isEdit && prod.modifiers ? prod.modifiers.map(m => m.id) : [])
  );

  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal-overlay" id="mod-prod" onclick="if(event.target===this)this.remove()">
  <div class="modal" style="width:640px" onclick="event.stopPropagation()">
  <div class="modal-h"><div class="modal-t">${title}</div><div class="modal-x" onclick="document.getElementById('mod-prod').remove()">✕</div></div>
  <div class="modal-b">
  <div class="form-grid form-2">
  <div class="fld"><label>Nama Produk *</label><input id="prod-name-inp" value="${isEdit ? prod.name : ''}" placeholder="Nama menu"></div>
  <div class="fld"><label>Kategori *</label><select id="prod-cat-inp">
    ${cats.map(c => `<option value="${c.id}" ${(isEdit ? prod.category_id === c.id : defaultCatId === c.id) ? 'selected' : ''}>${c.name}</option>`).join('')}
  </select></div>
  </div>
  <div class="form-grid form-2">
  <div class="fld"><label>Harga *</label><input id="prod-price-inp" type="number" value="${isEdit ? prod.price : ''}" placeholder="55000"></div>
  <div class="fld"><label>Status</label><select id="prod-status-inp">
    <option value="active" ${(!isEdit || prod.status === 'active') ? 'selected' : ''}>Aktif</option>
    <option value="inactive" ${(isEdit && prod.status === 'inactive') ? 'selected' : ''}>Nonaktif</option>
    <option value="soldout" ${(isEdit && prod.status === 'soldout') ? 'selected' : ''}>Habis (Sold)</option>
  </select></div>
  </div>
  <div class="fld"><label>Deskripsi</label><textarea id="prod-desc-inp" placeholder="Deskripsi singkat produk...">${isEdit ? (prod.description || '') : ''}</textarea></div>
  <div class="fld"><label>Foto Produk</label>
  <div class="upload-zone" onclick="toast('Upload foto - coming soon')">
  <div class="upload-zone-ico">📷</div>
  <div class="upload-zone-t">Klik untuk upload foto</div>
  <div class="upload-zone-s">JPG, PNG, WebP · Maks 2MB</div>
  </div>
  </div>

  <!-- MODIFIER GROUPS SECTION -->
  <div class="fld" id="prod-mod-section">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
  <label style="margin:0">Modifier Groups <span style="font-size:11px;color:var(--txt3);font-weight:400">(opsional)</span></label>
  <button type="button" class="btn btn-sm" onclick="toggleInlineModCreate()" id="btn-inline-mod-create" style="font-size:12px">${ico('plus')} Buat Group Baru</button>
  </div>

  <!-- Inline: create new modifier group -->
  <div id="inline-mod-create" style="display:none;background:var(--sf2);border-radius:10px;padding:14px;margin-bottom:10px;border:1.5px dashed var(--brd)">
  <div style="font-size:12px;font-weight:700;color:var(--txt2);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
    <span>✨ Buat Modifier Group Baru</span>
    <button type="button" onclick="toggleInlineModCreate()" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--txt3)">✕</button>
  </div>
  <div class="form-grid form-2" style="gap:8px">
  <div class="fld" style="margin:0"><input id="inline-mod-name" placeholder="Nama group (contoh: Level Pedas)" style="font-size:13px"></div>
  <div class="fld" style="margin:0"><select id="inline-mod-type" style="font-size:13px">
    <option value="single">Single Choice (Pilih 1)</option>
    <option value="multiple">Multiple Choice</option>
  </select></div>
  </div>
  <div class="form-grid form-2" style="gap:8px;margin-top:6px">
  <div class="fld" style="margin:0"><select id="inline-mod-req" style="font-size:13px">
    <option value="1">Wajib (Required)</option>
    <option value="0">Opsional</option>
  </select></div>
  <div class="fld" style="margin:0"><input id="inline-mod-items" placeholder="Items (pisah enter): Pedas Sedang..." style="font-size:12px"></div>
  </div>
  <button type="button" class="btn btn-primary" style="margin-top:8px;font-size:12px;padding:6px 14px" onclick="saveInlineModGroup()">Simpan &amp; Pilih Group Ini</button>
  </div>

  <!-- Existing modifier group checkboxes -->
  <div id="prod-mod-list" style="display:flex;flex-direction:column;gap:6px">
  ${mods.length === 0
    ? '<div style="font-size:12px;color:var(--txt3);padding:8px;text-align:center">Belum ada modifier group. Klik "Buat Group Baru" untuk membuat.</div>'
    : mods.map(m => `
  <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--sf2);border-radius:9px;cursor:pointer;border:1.5px solid ${assignedModIds.has(m.id) ? 'var(--pr)' : 'transparent'};transition:border-color .15s" id="mod-lbl-${m.id}">
  <input type="checkbox" name="prod-mod" value="${m.id}" ${assignedModIds.has(m.id) ? 'checked' : ''} onchange="updateModLabel('${m.id}', this.checked)">
  <div style="flex:1;min-width:0">
  <div style="font-size:13px;font-weight:600">${m.name}</div>
  ${m.items && m.items.length ? `<div style="font-size:11px;color:var(--txt3);margin-top:2px">${m.items.map(i => i.name).join(' · ')}</div>` : ''}
  </div>
  <div style="display:flex;gap:5px;flex-shrink:0">
  <span class="badge ${m.required ? 'badge-orange' : 'badge-gray'}" style="font-size:10px">${m.required ? 'Wajib' : 'Opsional'}</span>
  <span class="badge badge-blue" style="font-size:10px">${m.type === 'single' ? 'Pilih 1' : 'Multi'}</span>
  ${m.items && m.items.length ? `<span class="badge badge-gray" style="font-size:10px">${m.items.length} opsi</span>` : ''}
  </div>
  </label>`).join('')
  }
  </div>
  </div>

  </div>
  <div class="modal-foot">
  <button class="btn" onclick="document.getElementById('mod-prod').remove()">Batal</button>
  <button class="btn btn-primary" onclick="saveProduct('${isEdit ? prodId : ''}')">Simpan Produk</button>
  </div>
  </div>
  </div>`);
};

// Toggle inline modifier group creation panel
window.toggleInlineModCreate = function () {
  const el = document.getElementById('inline-mod-create');
  if (!el) return;
  const isShown = el.style.display !== 'none';
  el.style.display = isShown ? 'none' : 'block';
  const btn = document.getElementById('btn-inline-mod-create');
  if (btn) btn.textContent = isShown ? '+ Buat Group Baru' : '✕ Tutup';
  if (!isShown) {
    setTimeout(() => { const inp = document.getElementById('inline-mod-name'); if (inp) inp.focus(); }, 80);
  }
};

// Update modifier label styling when checkbox is toggled
window.updateModLabel = function (modId, checked) {
  const lbl = document.getElementById(`mod-lbl-${modId}`);
  if (lbl) lbl.style.borderColor = checked ? 'var(--pr)' : 'transparent';
};

// Save inline modifier group and auto-check it in product modal
window.saveInlineModGroup = async function () {
  const name = (document.getElementById('inline-mod-name') || {}).value || '';
  const type = (document.getElementById('inline-mod-type') || {}).value || 'single';
  const required = (document.getElementById('inline-mod-req') || {}).value === '1';
  const itemsRaw = (document.getElementById('inline-mod-items') || {}).value || '';

  if (!name.trim()) { toast('Nama group wajib diisi', 'err'); return; }

  const options = itemsRaw.split('\n').concat(itemsRaw.split(','))
    .map(l => l.trim()).filter(Boolean)
    .map(l => {
      const match = l.match(/^(.+?)\s*\(\+?(\d+)\)\s*$/);
      return match ? { name: match[1].trim(), priceAdjustment: parseInt(match[2]) } : { name: l, priceAdjustment: 0 };
    });

  try {
    const btn = document.querySelector('#inline-mod-create .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

    const res = await API.modifiers.create({ name: name.trim(), type, required, minSelect: 0, maxSelect: type === 'single' ? 1 : 10, options });
    if (res && res.success !== false) {
      const newMod = res.modifier;
      toast(`Group "${name}" dibuat!`, 'ok');

      // Add new checkbox to the list and auto-check it
      const list = document.getElementById('prod-mod-list');
      if (list) {
        const itemsText = (newMod.options || options).map(o => typeof o === 'string' ? o : o.name).join(' · ');
        const lbl = document.createElement('label');
        lbl.id = `mod-lbl-${newMod.id}`;
        lbl.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--sf2);border-radius:9px;cursor:pointer;border:1.5px solid var(--pr);transition:border-color .15s';
        lbl.innerHTML = `<input type="checkbox" name="prod-mod" value="${newMod.id}" checked onchange="updateModLabel('${newMod.id}', this.checked)">
        <div style="flex:1"><div style="font-size:13px;font-weight:600">${newMod.name}</div>
        ${itemsText ? `<div style="font-size:11px;color:var(--txt3);margin-top:2px">${itemsText}</div>` : ''}</div>
        <div style="display:flex;gap:5px"><span class="badge ${required ? 'badge-orange' : 'badge-gray'}" style="font-size:10px">${required ? 'Wajib' : 'Opsional'}</span><span class="badge badge-blue" style="font-size:10px">${type === 'single' ? 'Pilih 1' : 'Multi'}</span></div>`;
        // Remove empty state message if present
        const empty = list.querySelector('div');
        if (empty && empty.textContent.includes('Belum ada')) empty.remove();
        list.appendChild(lbl);
      }

      // Also update window.MODIFIERS cache
      if (window.MODIFIERS) {
        window.MODIFIERS.push({ id: newMod.id, name: newMod.name, type, required, min: 0, max: type === 'single' ? 1 : 10, productCount: 0, items: options });
      }

      // Hide inline form
      toggleInlineModCreate();
      document.getElementById('inline-mod-name').value = '';
      document.getElementById('inline-mod-items').value = '';
    } else {
      toast('Gagal: ' + ((res && res.error) || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};

window.saveProduct = async function (prodId = '') {
  const name = (document.getElementById('prod-name-inp') || {}).value || '';
  const price = (document.getElementById('prod-price-inp') || {}).value || '';
  const catId = (document.getElementById('prod-cat-inp') || {}).value || '';
  const desc = (document.getElementById('prod-desc-inp') || {}).value || '';
  const status = (document.getElementById('prod-status-inp') || {}).value || 'active';

  if (!name.trim() || !price) { toast('Nama dan Harga wajib diisi', 'err'); return; }

  // Collect modifier checkboxes
  const modBoxes = document.querySelectorAll('input[name="prod-mod"]:checked');
  const modifierGroupIds = Array.from(modBoxes).map(b => b.value);

  const payload = {
    name: name.trim(),
    price: parseInt(price),
    categoryId: catId || null,
    description: desc,
    hasModifiers: modifierGroupIds.length > 0,
    modifierGroupIds
  };

  try {
    let res;
    if (prodId) {
      // Update existing — status handled separately
      res = await API.products.update(prodId, payload);
      if (res && res.success !== false) {
        await API.products.updateStatus(prodId, status);
      }
    } else {
      res = await API.products.create(payload);
    }

    if (res && res.success !== false) {
      toast(prodId ? 'Produk diperbarui' : 'Produk berhasil disimpan', 'ok');
      document.getElementById('mod-prod').remove();
      await reloadCatalog();
      // Refresh whichever page is currently shown
      if (curPage === 'products') {
        nav('products', document.querySelector('.sb-item[onclick*="products"]'));
      } else if (curPage === 'categories') {
        nav('categories', document.querySelector('.sb-item[onclick*="categories"]'));
      }
    } else {
      toast('Gagal: ' + ((res && res.error) || 'Unknown error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};


// =============================================
// MODIFIERS PAGE
// =============================================
PAGES.modifiers = () => {
  const mods = window.MODIFIERS || [];
  return `
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Modifier Groups</div><div class="ph-sub">Opsi dan variasi add-on untuk produk</div></div>
 <button class="btn btn-primary" onclick="openModModal()">${ico('plus')} Tambah Group</button>
 </div>
</div>
${mods.length === 0
  ? `<div class="card" style="padding:40px;text-align:center;color:var(--txt3)">
      <div style="font-size:32px;margin-bottom:12px">⚙️</div>
      <div style="font-size:15px;font-weight:700;margin-bottom:6px">Belum ada Modifier Group</div>
      <div style="font-size:13px">Tambah group untuk pilihan seperti Level Pedas, Ukuran, dll.</div>
      <button class="btn btn-primary" onclick="openModModal()" style="margin-top:16px">${ico('plus')} Tambah Group Pertama</button>
    </div>`
  : `<div class="three-col">
 ${mods.map(m => `
 <div class="card" id="mod-card-${m.id}">
 <div class="card-h">
 <div>
 <div class="card-t">${m.name}</div>
 <div style="display:flex;gap:5px;margin-top:5px;flex-wrap:wrap">
 <span class="badge ${m.required ? 'badge-orange' : 'badge-gray'}">${m.required ? 'Wajib' : 'Opsional'}</span>
 <span class="badge badge-blue">${m.type === 'single' ? 'Pilih 1' : 'Multi-pilih'}</span>
 ${m.productCount > 0 ? `<span class="badge badge-purple" style="cursor:pointer" onclick="toggleModProds('${m.id}')">${m.productCount} produk ▾</span>` : '<span class="badge badge-gray" style="cursor:pointer" onclick="toggleModProds(\'' + m.id + '\')">0 produk</span>'}
 </div>
 </div>
 <div style="display:flex;gap:5px">
 <button class="btn btn-sm" onclick="openAssignProdModal('${m.id}','${encodeURIComponent(m.name)}')" title="Assign produk ke group ini" style="font-size:11px;padding:4px 8px">🔗 Assign</button>
 <button class="btn btn-icon btn-sm" onclick="editModModal('${m.id}','${encodeURIComponent(m.name)}','${encodeURIComponent(m.desc || '')}','${m.type}',${m.required},${m.min},${m.max})" title="Edit group">${ico('edit')}</button>
 <button class="btn btn-icon btn-sm btn-danger" onclick="deleteModGroup('${m.id}','${encodeURIComponent(m.name)}')" title="Hapus group">${ico('del')}</button>
 </div>
 </div>

 <!-- Assigned products panel (collapsed by default) -->
 <div id="mod-prods-${m.id}" style="display:none;border-top:1px solid var(--brd);padding:10px 0 4px">
 <div style="font-size:11px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;padding:0 4px">Produk yang menggunakan group ini</div>
 <div id="mod-prods-list-${m.id}" style="display:flex;flex-direction:column;gap:4px">
  <div style="font-size:12px;color:var(--txt3);padding:4px">Memuat...</div>
 </div>
 </div>

 <div class="card-b" style="display:flex;flex-direction:column;gap:6px">
 <div style="font-size:11px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Opsi</div>
 ${m.items && m.items.length ? m.items.map(it => `
 <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--sf2);border-radius:8px">
 <div>
 <span style="font-size:13px;font-weight:500">${it.name}</span>
 ${it.price > 0 ? `<span style="font-size:11px;color:var(--gn);margin-left:6px">+${fr(it.price)}</span>` : ''}
 </div>
 <button class="btn btn-sm btn-danger" onclick="deleteModOption('${it.id}','${encodeURIComponent(it.name)}','${m.id}')" title="Hapus item" style="padding:3px 8px;font-size:11px">✕</button>
 </div>`).join('') : '<div style="font-size:12px;color:var(--txt3);text-align:center;padding:8px">Belum ada opsi</div>'}
 <button class="btn btn-sm" style="width:100%;justify-content:center;margin-top:4px" onclick="openAddOptionModal('${m.id}','${encodeURIComponent(m.name)}')">${ico('plus')} Tambah Opsi</button>
 </div>
 </div>`).join('')}
</div>`}
`;
};

// ── CREATE MODIFIER GROUP MODAL ───────────────────────────────────────────────
function openModModal(editData = null) {
  const isEdit = !!editData;
  const id = editData ? editData.id : '';
  const modId = 'mod-modifier';
  const ex = document.getElementById(modId);
  if (ex) ex.remove();

  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal-overlay" id="${modId}" onclick="if(event.target===this)this.remove()">
  <div class="modal" onclick="event.stopPropagation()">
  <div class="modal-h"><div class="modal-t">${isEdit ? 'Edit Modifier Group' : 'Tambah Modifier Group'}</div><div class="modal-x" onclick="document.getElementById('${modId}').remove()">✕</div></div>
  <div class="modal-b">
  <div class="fld"><label>Nama Group *</label><input id="mod-name-inp" value="${isEdit ? editData.name : ''}" placeholder="contoh: Level Pedas" autofocus></div>
  <div class="fld"><label>Deskripsi</label><input id="mod-desc-inp" value="${isEdit ? editData.desc : ''}" placeholder="Opsional"></div>
  <div class="form-grid form-2">
  <div class="fld"><label>Tipe Pilihan</label><select id="mod-type-inp">
    <option value="single" ${(!isEdit || editData.type === 'single') ? 'selected' : ''}>Single Choice (Pilih 1)</option>
    <option value="multiple" ${(isEdit && editData.type === 'multi') ? 'selected' : ''}>Multiple Choice (Multi)</option>
  </select></div>
  <div class="fld"><label>Wajib Dipilih</label><select id="mod-req-inp">
    <option value="1" ${(!isEdit || editData.required) ? 'selected' : ''}>Ya (Required)</option>
    <option value="0" ${(isEdit && !editData.required) ? 'selected' : ''}>Tidak (Optional)</option>
  </select></div>
  </div>
  <div class="form-grid form-2">
  <div class="fld"><label>Min Pilihan</label><input id="mod-min-inp" type="number" value="${isEdit ? editData.min : 0}" min="0"></div>
  <div class="fld"><label>Max Pilihan</label><input id="mod-max-inp" type="number" value="${isEdit ? editData.max : 1}" min="1"></div>
  </div>
  ${!isEdit ? `<div class="fld"><label>Items (satu per baris)</label>
  <textarea id="mod-items-inp" placeholder="Original\nPedas Sedang\nPedas Extra" rows="4"></textarea>
  <div class="fld-hint">Pisahkan dengan enter. Tambah harga dengan format: Item (+5000)</div>
  </div>` : ''}
  </div>
  <div class="modal-foot">
  <button class="btn" onclick="document.getElementById('${modId}').remove()">Batal</button>
  <button class="btn btn-primary" onclick="saveModGroup('${id}')">${isEdit ? 'Simpan Perubahan' : 'Buat Group'}</button>
  </div>
  </div>
  </div>`);
  setTimeout(() => document.getElementById('mod-name-inp') && document.getElementById('mod-name-inp').focus(), 80);
}

// ── EDIT MODIFIER GROUP ───────────────────────────────────────────────────────
window.editModModal = function (id, encodedName, encodedDesc, type, required, min, max) {
  openModModal({
    id,
    name: decodeURIComponent(encodedName),
    desc: decodeURIComponent(encodedDesc),
    type,
    required: required === true || required === 'true',
    min: parseInt(min) || 0,
    max: parseInt(max) || 1
  });
};

// ── SAVE MODIFIER GROUP (create or update) ────────────────────────────────────
window.saveModGroup = async function (groupId = '') {
  const name = (document.getElementById('mod-name-inp') || {}).value || '';
  const desc = (document.getElementById('mod-desc-inp') || {}).value || '';
  const type = (document.getElementById('mod-type-inp') || {}).value || 'single';
  const required = (document.getElementById('mod-req-inp') || {}).value === '1';
  const min = parseInt((document.getElementById('mod-min-inp') || {}).value || '0');
  const max = parseInt((document.getElementById('mod-max-inp') || {}).value || '1');
  const itemsRaw = (document.getElementById('mod-items-inp') || {}).value || '';

  if (!name.trim()) { toast('Nama group wajib diisi', 'err'); return; }

  // Parse items from textarea (format: "Name" or "Name (+5000)")
  const options = itemsRaw.split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(l => {
      const match = l.match(/^(.+?)\s*\(\+?(\d+)\)\s*$/);
      return match
        ? { name: match[1].trim(), priceAdjustment: parseInt(match[2]) }
        : { name: l, priceAdjustment: 0 };
    });

  const payload = { name: name.trim(), description: desc, type, required, minSelect: min, maxSelect: max };
  if (!groupId) payload.options = options;

  try {
    let res;
    if (groupId) {
      res = await API.modifiers.update(groupId, payload);
    } else {
      res = await API.modifiers.create(payload);
    }

    if (res && res.success !== false) {
      toast(groupId ? 'Modifier group diperbarui' : 'Modifier group dibuat', 'ok');
      document.getElementById('mod-modifier').remove();
      await reloadCatalog();
      nav('modifiers', document.querySelector('.sb-item[onclick*="modifiers"]'));
    } else {
      toast('Gagal: ' + ((res && res.error) || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};

// ── DELETE MODIFIER GROUP ─────────────────────────────────────────────────────
window.deleteModGroup = async function (id, encodedName) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Hapus modifier group "${name}"?`)) return;
  try {
    const res = await API.modifiers.delete(id);
    if (res && res.success !== false) {
      toast(`"${name}" dihapus`, 'ok');
      // Remove card from DOM immediately for snappy UX
      const card = document.getElementById(`mod-card-${id}`);
      if (card) card.remove();
      await reloadCatalog();
    } else {
      toast('Gagal hapus: ' + ((res && res.error) || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};

// ── ADD OPTION TO GROUP MODAL ─────────────────────────────────────────────────
window.openAddOptionModal = function (groupId, encodedGroupName) {
  const groupName = decodeURIComponent(encodedGroupName);
  const ex = document.getElementById('mod-opt-modal');
  if (ex) ex.remove();

  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal-overlay" id="mod-opt-modal" onclick="if(event.target===this)this.remove()">
  <div class="modal" style="width:420px" onclick="event.stopPropagation()">
  <div class="modal-h"><div class="modal-t">Tambah Item ke "${groupName}"</div><div class="modal-x" onclick="document.getElementById('mod-opt-modal').remove()">✕</div></div>
  <div class="modal-b">
  <div class="fld"><label>Nama Item *</label><input id="opt-name-inp" placeholder="contoh: Pedas Extra" autofocus></div>
  <div class="fld"><label>Harga Tambahan (Rp)</label><input id="opt-price-inp" type="number" value="0" min="0" placeholder="0 = gratis"></div>
  </div>
  <div class="modal-foot">
  <button class="btn" onclick="document.getElementById('mod-opt-modal').remove()">Batal</button>
  <button class="btn btn-primary" onclick="saveModOption('${groupId}')">Tambah Item</button>
  </div>
  </div>
  </div>`);
  setTimeout(() => document.getElementById('opt-name-inp') && document.getElementById('opt-name-inp').focus(), 80);
};

// ── SAVE OPTION ───────────────────────────────────────────────────────────────
window.saveModOption = async function (groupId) {
  const name = (document.getElementById('opt-name-inp') || {}).value || '';
  const price = parseInt((document.getElementById('opt-price-inp') || {}).value || '0');

  if (!name.trim()) { toast('Nama item wajib diisi', 'err'); return; }

  try {
    const res = await API.modifiers.createOption(groupId, { name: name.trim(), priceAdjustment: price });
    if (res && res.success !== false) {
      toast(`Item "${name}" ditambahkan`, 'ok');
      document.getElementById('mod-opt-modal').remove();
      await reloadCatalog();
      nav('modifiers', document.querySelector('.sb-item[onclick*="modifiers"]'));
    } else {
      toast('Gagal: ' + ((res && res.error) || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};

// ── DELETE OPTION ─────────────────────────────────────────────────────────────
window.deleteModOption = async function (optionId, encodedName, groupId) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Hapus item "${name}"?`)) return;
  try {
    const res = await API.modifiers.deleteOption(optionId);
    if (res && res.success !== false) {
      toast(`Item "${name}" dihapus`, 'ok');
      await reloadCatalog();
      nav('modifiers', document.querySelector('.sb-item[onclick*="modifiers"]'));
    } else {
      toast('Gagal: ' + ((res && res.error) || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};



// ── TOGGLE ASSIGNED PRODUCTS PANEL ───────────────────────────────────────────
window.toggleModProds = async function (groupId) {
  const panel = document.getElementById(`mod-prods-${groupId}`);
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  if (isOpen) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'block';
  const listEl = document.getElementById(`mod-prods-list-${groupId}`);
  if (!listEl) return;

  try {
    const res = await API.modifiers.getProducts(groupId);
    const products = (res && res.products) || [];
    if (products.length === 0) {
      listEl.innerHTML = '<div style="font-size:12px;color:var(--txt3);padding:4px">Belum ada produk yang di-assign ke group ini. Klik "🔗 Assign" untuk menambahkan.</div>';
    } else {
      listEl.innerHTML = products.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:var(--sf2);border-radius:8px">
        <div>
          <div style="font-size:12px;font-weight:600">${p.name}</div>
          <div style="font-size:11px;color:var(--txt3)">${p.category_name || 'Tanpa Kategori'} · ${fr(p.price)}</div>
        </div>
        <div style="display:flex;gap:4px;align-items:center">
          <span class="badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}" style="font-size:10px">${p.status === 'active' ? 'Aktif' : p.status}</span>
          <button class="btn btn-sm btn-danger" onclick="unassignProductFromMod('${groupId}','${p.id}','${encodeURIComponent(p.name)}')" style="padding:3px 7px;font-size:11px" title="Lepas dari group">✕</button>
        </div>
      </div>`).join('');
    }
  } catch (err) {
    console.error(err);
    listEl.innerHTML = '<div style="font-size:12px;color:var(--rd);padding:4px">Gagal memuat produk.</div>';
  }
};

// ── UNASSIGN PRODUCT FROM MODIFIER GROUP ─────────────────────────────────────
window.unassignProductFromMod = async function (groupId, productId, encodedName) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Lepas "${name}" dari modifier group ini?`)) return;
  try {
    const res = await API.modifiers.unassignProduct(groupId, productId);
    if (res && res.success !== false) {
      toast(`"${name}" dilepas dari group`, 'ok');
      await reloadCatalog();
      const panel = document.getElementById(`mod-prods-${groupId}`);
      if (panel) panel.style.display = 'none';
      nav('modifiers', document.querySelector('.sb-item[onclick*="modifiers"]'));
    } else {
      toast('Gagal: ' + ((res && res.error) || 'Error'), 'err');
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
};

// ── ASSIGN PRODUCT TO MODIFIER GROUP MODAL ───────────────────────────────────
window.openAssignProdModal = async function (groupId, encodedGroupName) {
  const groupName = decodeURIComponent(encodedGroupName);
  const ex = document.getElementById('mod-assign-prod-modal');
  if (ex) ex.remove();

  // Fetch currently assigned products
  let assignedIds = new Set();
  try {
    const res = await API.modifiers.getProducts(groupId);
    if (res && res.products) assignedIds = new Set(res.products.map(p => p.id));
  } catch (e) { console.error(e); }

  const allProds = (window.PRODUCTS || []).filter(p => p.status !== 'inactive');

  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal-overlay" id="mod-assign-prod-modal" onclick="if(event.target===this)this.remove()">
  <div class="modal" style="width:560px" onclick="event.stopPropagation()">
  <div class="modal-h">
    <div>
      <div class="modal-t">Assign Produk ke "${groupName}"</div>
      <div style="font-size:12px;color:var(--txt3);margin-top:2px">Centang produk yang ingin menggunakan modifier group ini</div>
    </div>
    <div class="modal-x" onclick="document.getElementById('mod-assign-prod-modal').remove()">✕</div>
  </div>
  <div style="padding:12px 20px;border-bottom:1px solid var(--brd)">
    <input id="assign-prod-search" placeholder="Cari produk..." oninput="filterAssignProdList()" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--brd);background:var(--sf);color:var(--txt);font-family:var(--fn);font-size:13px">
  </div>
  <div class="modal-b" style="max-height:50vh;overflow-y:auto">
  <div id="assign-prod-list" style="display:flex;flex-direction:column;gap:6px">
  ${allProds.length === 0
    ? '<div style="text-align:center;color:var(--txt3);padding:20px">Belum ada produk aktif</div>'
    : allProds.map(p => `
  <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--sf2);border-radius:9px;cursor:pointer;border:1.5px solid ${assignedIds.has(p.id) ? 'var(--pr)' : 'transparent'};transition:border-color .15s" id="asgn-lbl-${p.id}" data-name="${p.name.toLowerCase()}" data-cat="${(p.cat || '').toLowerCase()}">
  <input type="checkbox" name="assign-prod" value="${p.id}" ${assignedIds.has(p.id) ? 'checked' : ''} onchange="updateAssignLabel('${p.id}', this.checked)">
  <div style="flex:1;min-width:0">
    <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
    <div style="font-size:11px;color:var(--txt3)">${p.cat || 'Tanpa Kategori'} · ${fr(p.price)}</div>
  </div>
  <span class="badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}" style="font-size:10px;flex-shrink:0">${p.status === 'active' ? 'Aktif' : p.status}</span>
  </label>`).join('')
  }
  </div>
  </div>
  <div class="modal-foot">
  <button class="btn" onclick="document.getElementById('mod-assign-prod-modal').remove()">Batal</button>
  <button class="btn btn-primary" onclick="saveAssignProds('${groupId}')">Simpan Assignments</button>
  </div>
  </div>
  </div>`);

  window._assignModalInitIds = new Set(assignedIds);
  window._assignModalGroupId = groupId;
  setTimeout(() => { const inp = document.getElementById('assign-prod-search'); if (inp) inp.focus(); }, 80);
};

window.filterAssignProdList = function () {
  const q = (document.getElementById('assign-prod-search') || {}).value || '';
  const lower = q.toLowerCase();
  const labels = document.querySelectorAll('#assign-prod-list label[data-name]');
  labels.forEach(lbl => {
    const name = lbl.dataset.name || '';
    const cat = lbl.dataset.cat || '';
    lbl.style.display = (!q || name.includes(lower) || cat.includes(lower)) ? '' : 'none';
  });
};

window.updateAssignLabel = function (prodId, checked) {
  const lbl = document.getElementById(`asgn-lbl-${prodId}`);
  if (lbl) lbl.style.borderColor = checked ? 'var(--pr)' : 'transparent';
};

window.saveAssignProds = async function (groupId) {
  const boxes = document.querySelectorAll('input[name="assign-prod"]');
  const newIds = new Set(Array.from(boxes).filter(b => b.checked).map(b => b.value));
  const oldIds = window._assignModalInitIds || new Set();

  const toAssign = [...newIds].filter(id => !oldIds.has(id));
  const toUnassign = [...oldIds].filter(id => !newIds.has(id));

  if (toAssign.length === 0 && toUnassign.length === 0) {
    toast('Tidak ada perubahan', 'ok');
    document.getElementById('mod-assign-prod-modal').remove();
    return;
  }

  const btn = document.querySelector('#mod-assign-prod-modal .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  try {
    await Promise.all([
      ...toAssign.map(pid => API.modifiers.assignProduct(groupId, pid)),
      ...toUnassign.map(pid => API.modifiers.unassignProduct(groupId, pid))
    ]);
    toast(`${toAssign.length} produk di-assign, ${toUnassign.length} dilepas`, 'ok');
    document.getElementById('mod-assign-prod-modal').remove();
    await reloadCatalog();
    nav('modifiers', document.querySelector('.sb-item[onclick*="modifiers"]'));
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Assignments'; }
  }
};


