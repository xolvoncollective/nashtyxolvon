let nashtyCosts = [];
PAGES.costs = async () => {
  try {
    const params = 'tenantId=' + API.session.tenantId + (API.session.outletId ? '&outletId=' + API.session.outletId : '');
    const res = await API.request('/costs?' + params);
    nashtyCosts = res.costs || [];
  } catch (e) {
    console.error(e);
    nashtyCosts = [];
  }

  // Calculate sum
  const totalExpense = nashtyCosts.reduce((sum, c) => sum + c.amount, 0);

  const rowsHtml = nashtyCosts.length === 0 
    ? '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--txt3)">Belum ada catatan pengeluaran</td></tr>'
    : nashtyCosts.map(c => `
      <tr>
        <td class="bold">${c.category.toUpperCase()}</td>
        <td>${c.outlet_name || 'Semua Outlet'}</td>
        <td class="mono bold">${fr(c.amount)}</td>
        <td>${c.description || '—'}</td>
        <td>${new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm" onclick="openCostModal('${c.id}')">${ico('edit')} Edit</button>
            <button class="btn btn-sm" style="background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.2)" onclick="deleteCost('${c.id}')">${ico('close')} Hapus</button>
          </div>
        </td>
      </tr>
    `).join('');

  return `
<div class="ph">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div><div class="ph-title">Nashtycost</div><div class="ph-sub">Manajemen biaya pengeluaran operasional outlet</div></div>
    <button class="btn btn-primary" onclick="openCostModal()">${ico('plus')} Catat Pengeluaran</button>
  </div>
</div>

<div class="kpi-grid" style="margin-bottom:22px">
  <div class="kpi" style="--kc:#EF4444">
    <div class="kpi-lbl">Total Pengeluaran</div>
    <div class="kpi-val">${frS(totalExpense)}</div>
    <div class="kpi-sub">Dari filter saat ini</div>
  </div>
</div>

<div class="card">
  <div class="card-h">
    <div class="card-t">Daftar Pengeluaran</div>
  </div>
  <div class="tbl-wrap">
    <table>
      <thead>
        <tr>
          <th>Kategori</th>
          <th>Outlet</th>
          <th>Jumlah (Rp)</th>
          <th>Keterangan</th>
          <th>Tanggal</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</div>`;
};

window.openCostModal = function(id = null) {
  const c = id ? nashtyCosts.find(x => x.id === id) : null;
  
  // Fetch active outlets to populate dropdown
  let outletOptions = '<option value="">Semua Outlet</option>';
  if (window.businessOutlets && window.businessOutlets.length > 0) {
    businessOutlets.forEach(o => {
      outletOptions += `<option value="${o.id}" ${c?.outlet_id === o.id ? 'selected' : ''}>${o.name}</option>`;
    });
  } else if (API.session.outletId) {
    outletOptions += `<option value="${API.session.outletId}" selected>Outlet Saat Ini</option>`;
  }

  const categories = ['bahan-baku', 'operasional', 'gaji', 'utilitas', 'sewa', 'lainnya'];
  let catOptions = '';
  categories.forEach(cat => {
    catOptions += `<option value="${cat}" ${c?.category === cat ? 'selected' : ''}>${cat.toUpperCase()}</option>`;
  });

  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal" id="mod-cost">
    <div class="modal-box" style="max-width:400px">
      <div class="modal-head">
        <div class="modal-t">${id ? 'Edit' : 'Catat'} Pengeluaran</div>
        <button class="btn-icon" onclick="document.getElementById('mod-cost').remove()">${ico('close')}</button>
      </div>
      <div class="modal-body" style="display:flex;flex-direction:column;gap:12px">
        <div class="fld"><label>Jumlah Pengeluaran (Rp)</label><input type="number" id="c-amount" value="${c?.amount || ''}" placeholder="Contoh: 150000"></div>
        <div class="fld">
          <label>Kategori</label>
          <select id="c-category" style="width:100%;background:var(--sf2);border:1px solid var(--brd2);border-radius:10px;padding:9px 12px;color:var(--txt)">
            ${catOptions}
          </select>
        </div>
        <div class="fld">
          <label>Outlet</label>
          <select id="c-outlet" style="width:100%;background:var(--sf2);border:1px solid var(--brd2);border-radius:10px;padding:9px 12px;color:var(--txt)">
            ${outletOptions}
          </select>
        </div>
        <div class="fld"><label>Keterangan / Deskripsi</label><input type="text" id="c-desc" value="${c?.description || ''}" placeholder="Keterangan pengeluaran"></div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="document.getElementById('mod-cost').remove()">Batal</button>
        <button class="btn btn-primary" onclick="saveCost('${id || ''}')">Simpan</button>
      </div>
    </div>
  </div>`);
};

window.saveCost = async function(id) {
  const amount = parseFloat(document.getElementById('c-amount').value);
  const category = document.getElementById('c-category').value;
  const outletId = document.getElementById('c-outlet').value;
  const description = document.getElementById('c-desc').value.trim();

  if (isNaN(amount) || amount <= 0) return toast('Jumlah pengeluaran harus positif', 'err');
  if (!category) return toast('Kategori wajib dipilih', 'err');

  try {
    const payload = {
      tenantId: API.session.tenantId || 'demo-tenant',
      outletId: outletId || null,
      amount,
      category,
      description
    };

    if (id) {
      await API.request('/costs/' + id, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      toast('Biaya berhasil diperbarui', 'ok');
    } else {
      await API.request('/costs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      toast('Biaya berhasil dicatat', 'ok');
    }
    document.getElementById('mod-cost').remove();
    nav(curPage, document.querySelector('.sb-item.act'));
  } catch (e) {
    toast('Error: ' + e.message, 'err');
  }
};

window.deleteCost = async function(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus catatan pengeluaran ini?')) return;
  try {
    await API.request('/costs/' + id, { method: 'DELETE' });
    toast('Catatan pengeluaran dihapus', 'ok');
    nav(curPage, document.querySelector('.sb-item.act'));
  } catch (e) {
    toast('Error: ' + e.message, 'err');
  }
};
