// KDS WORKFLOW 
PAGES['kds-workflow'] = async () => {
  let settings = {};
  try {
    const res = await API.settings.get();
    settings = res.settings || {};
  } catch(e) { console.error(e); }

  const defaultWorkflow = [
    { id: 'pending', name: 'New Order', color: '#3B82F6' },
    { id: 'preparing', name: 'Preparing', color: '#F59E0B' },
    { id: 'ready', name: 'Ready', color: '#22C55E' },
    { id: 'served', name: 'Completed', color: '#6B7280' }
  ];

  let workflow = defaultWorkflow;
  if (settings.kds_workflow) {
    try { workflow = typeof settings.kds_workflow === 'string' ? JSON.parse(settings.kds_workflow) : settings.kds_workflow; } catch(e) {}
  }

  window.saveKdsWorkflow = async function() {
    const btn = document.getElementById('btn-save-workflow');
    btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      const inputs = document.querySelectorAll('.wf-input');
      const colors = document.querySelectorAll('.wf-color');
      const newWf = workflow.map((w, i) => ({
        id: w.id,
        name: inputs[i].value,
        color: colors[i].value
      }));
      await API.settings.update({ kds_workflow: newWf });
      toast('Workflow berhasil disimpan!', 'ok');
    } catch(e) {
      toast('Gagal: ' + e.message, 'err');
    }
    btn.disabled = false; btn.textContent = 'Simpan Perubahan';
  };

  window.updatePreview = function() {
    const inputs = document.querySelectorAll('.wf-input');
    const colors = document.querySelectorAll('.wf-color');
    const previewSpan = document.getElementById('kds-preview-badge');
    if (previewSpan && inputs[1] && colors[1]) {
      previewSpan.textContent = inputs[1].value;
      previewSpan.style.background = colors[1].value;
    }
  };

  return `
<div class="ph"><div class="ph-title">KDS Workflow Status</div><div class="ph-sub">Atur tampilan nama dan warna alur kerja dapur (Status dasar tidak dapat ditambah/dikurang)</div></div>
<div class="two-equal">
  <div class="card">
    <div class="card-h">
      <div><div class="card-t">Tampilan Status di KDS</div><div class="card-sub">Sesuaikan nama label dan warna sesuai operasional Anda</div></div>
      <button class="btn btn-primary btn-sm" id="btn-save-workflow" onclick="saveKdsWorkflow()">Simpan Perubahan</button>
    </div>
    <div class="card-b" style="display:flex;flex-direction:column;gap:8px">
    ${workflow.map((s, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--sf2);border:1px solid var(--brd);border-radius:10px;">
      <span style="font-size:11px;font-family:var(--mo);color:var(--txt3);width:60px;text-transform:uppercase">${s.id}</span>
      <input type="color" class="wf-color" value="${s.color}" oninput="updatePreview()" style="width:30px;height:30px;padding:0;border:none;border-radius:4px;cursor:pointer">
      <input type="text" class="wf-input" value="${s.name}" oninput="updatePreview()" style="flex:1;padding:8px 12px;border-radius:6px;border:1px solid var(--brd);background:var(--sf);color:var(--txt);font-weight:600">
    </div>
    ${i < 3 ? '<div style="text-align:center;color:var(--txt3);font-size:18px">↓</div>' : ''}`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-h"><div class="card-t">Preview KDS Card</div></div>
    <div class="card-b">
      <div style="background:#1A1A1A;border-radius:12px;padding:14px;color:#F0EDE8;font-family:var(--mo)">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <div>
            <div style="font-size:16px;font-weight:900">SNY-0188</div>
            <div style="font-size:10px;color:#9C9890;margin-top:2px">T03 · Dine In</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:700;color:#22C55E">03:42</div>
            <div style="font-size:8px;color:#9C9890">menit:detik</div>
            <span style="font-size:8px;background:rgba(34,197,94,.15);color:#22C55E;padding:1px 6px;border-radius:4px;font-weight:700">ON TIME</span>
          </div>
        </div>
        <div style="background:#222;border-radius:8px;padding:8px;margin-bottom:6px">
          <div style="display:flex;gap:6px">
            <span style="background:#E4540C;color:#fff;border-radius:4px;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;flex-shrink:0">1</span>
            <div>
              <div style="font-size:12px;font-weight:700">Ayam Bakar Madu</div>
              <div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">
                <span style="background:rgba(228,84,12,.15);color:#E4540C;font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px">Pedas Extra</span>
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;padding-top:8px;border-top:1px solid rgba(255,255,255,.08)">
          <span style="font-size:10px;color:#9C9890;flex:1">Kasir: System</span>
          <span id="kds-preview-badge" style="background:${workflow[1].color};color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:5px">${workflow[1].name}</span>
        </div>
      </div>
    </div>
  </div>
</div>`;
};

// KDS PRODUCTION TIME 
PAGES['kds-time'] = async () => {
  let categories = [];
  try {
    const res = await API.categories.getAll();
    categories = res.categories || [];
    // Calculate average production time per category from their products
    const pRes = await API.products.getAll();
    const products = pRes.products || [];
    categories.forEach(c => {
      const catProds = products.filter(p => p.category_id === c.id);
      if (catProds.length > 0) {
        c.avgTime = Math.round(catProds.reduce((sum, p) => sum + (p.production_time || 0), 0) / catProds.length);
      } else {
        c.avgTime = 10;
      }
    });
  } catch(e) { console.error(e); }

  window.editProductionTime = async function(catId, catName, currentAvg) {
    const newTime = prompt(`Masukkan target waktu baru (dalam menit) untuk semua produk di kategori "${catName}":\n\nCatatan: Ini akan mengupdate production_time seluruh produk di kategori ini.`, currentAvg);
    if (!newTime || isNaN(newTime)) return;
    const timeMinutes = parseInt(newTime, 10);
    try {
      await API.kds.updateCategoryProductionTime(catId, timeMinutes);
      toast('Target waktu diperbarui!', 'ok');
      nav('kds-time', document.querySelector('.sb-item[onclick*="kds-time"]'));
    } catch(e) {
      toast('Gagal: ' + e.message, 'err');
    }
  };

  return `
<div class="ph"><div class="ph-title">Production Time Rules</div><div class="ph-sub">Target waktu persiapan per kategori menu</div></div>
<div class="card">
  <div class="card-h">
    <div><div class="card-t">Target Waktu per Kategori</div><div class="card-sub">Digunakan untuk kalkulasi status On Time / Warning / Overdue</div></div>
  </div>
  <div class="tbl-wrap">
    <table>
      <thead><tr><th>Kategori</th><th>Target Waktu Rata-rata</th><th>On Time (0–80%)</th><th>Warning (80–100%)</th><th>Overdue (>100%)</th><th>Aksi</th></tr></thead>
      <tbody>
      ${categories.length === 0 ? '<tr><td colspan="6" style="text-align:center">Belum ada kategori</td></tr>' : categories.map(c => `
      <tr>
        <td class="bold">${c.name}</td>
        <td><span class="badge badge-blue">${c.avgTime} menit</span></td>
        <td><span class="badge badge-green">0 – ${Math.round(c.avgTime * 0.8)} mnt</span></td>
        <td><span class="badge badge-yellow">${Math.round(c.avgTime * 0.8)} – ${c.avgTime} mnt</span></td>
        <td><span class="badge badge-red">> ${c.avgTime} mnt</span></td>
        <td>
          <button class="btn btn-sm" onclick="editProductionTime('${c.id}','${c.name}',${c.avgTime})">${ico('edit')} Ubah Target</button>
        </td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>`;
};

// KDS ALERTS 
PAGES['kds-alerts'] = async () => {
  let settings = {};
  try {
    const res = await API.settings.get();
    settings = res.settings || {};
  } catch(e) { console.error(e); }

  const alertSound = settings.kds_alert_sound !== false;
  const alertFlash = settings.kds_alert_flash !== false;
  const alertEscalation = settings.kds_alert_escalation !== false;
  const alertInterval = settings.kds_alert_interval || 1;

  window.saveKdsAlerts = async function() {
    const btn = document.getElementById('btn-save-alerts');
    btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      await API.settings.update({
        kds_alert_sound: document.getElementById('cb-sound').checked,
        kds_alert_flash: document.getElementById('cb-flash').checked,
        kds_alert_escalation: document.getElementById('cb-escalation').checked,
        kds_alert_interval: parseInt(document.getElementById('inp-interval').value || 1)
      });
      toast('Alert settings disimpan!', 'ok');
    } catch(e) {
      toast('Gagal: ' + e.message, 'err');
    }
    btn.disabled = false; btn.textContent = 'Simpan';
  };

  return `
<div class="ph"><div class="ph-title">Alert Settings</div><div class="ph-sub">Konfigurasi notifikasi dan peringatan keterlambatan di KDS</div></div>
<div class="two-equal">
  <div class="card">
    <div class="card-h"><div class="card-t">Pengaturan Visual & Suara</div></div>
    <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
      <div class="toggle-row">
        <div class="toggle-info"><div class="tl">Suara Order Baru</div><div class="ts">Bunyi notifikasi saat pesanan masuk ke KDS</div></div>
        <label class="toggle"><input type="checkbox" id="cb-sound" ${alertSound?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
      </div>
      <div class="toggle-row">
        <div class="toggle-info"><div class="tl">Flash Alert</div><div class="ts">Kartu berkedip perlahan saat status Overdue</div></div>
        <label class="toggle"><input type="checkbox" id="cb-flash" ${alertFlash?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
      </div>
      <div class="toggle-row">
        <div class="toggle-info"><div class="tl">Notifikasi Eskalasi</div><div class="ts">Notifikasi suara berulang jika pesanan sangat terlambat</div></div>
        <label class="toggle"><input type="checkbox" id="cb-escalation" ${alertEscalation?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-h"><div class="card-t">Interval Eskalasi</div></div>
    <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
      <div class="fld"><label>Ulangi alert suara setiap (menit)</label><input type="number" id="inp-interval" value="${alertInterval}" min="1" max="10"><div class="fld-hint">Setelah order melewati batas waktu target</div></div>
      <button class="btn btn-primary" id="btn-save-alerts" onclick="saveKdsAlerts()">Simpan</button>
    </div>
  </div>
</div>`;
};

// KDS ANALYTICS 
PAGES['kds-analytics'] = async () => {
  let a = { avgPrepTimeSeconds: 0, completedOrders: 0, totalOrders: 0, overSlaItemsCount: 0, totalItemsCount: 0, fastestProducts: [], slowestProducts: [] };
  try {
    const res = await API.kds.getAnalytics();
    if (res.data) a = res.data;
  } catch(e) { console.error(e); }

  const formatTime = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const completionRate = a.totalOrders > 0 ? Math.round((a.completedOrders / a.totalOrders) * 100) : 0;
  const slaRate = a.totalItemsCount > 0 ? Math.round((a.overSlaItemsCount / a.totalItemsCount) * 100) : 0;

  return `
<div class="ph"><div class="ph-title">KDS Analytics</div><div class="ph-sub">Performa dapur hari ini</div></div>
<div class="kpi-grid">
  <div class="kpi" style="--kc:var(--gn)">
    <div class="kpi-lbl">Rata-rata Prep Time</div>
    <div class="kpi-val">${formatTime(a.avgPrepTimeSeconds)}</div>
    <div class="kpi-sub">menit:detik</div>
  </div>
  <div class="kpi" style="--kc:var(--bl)">
    <div class="kpi-lbl">Order Selesai</div>
    <div class="kpi-val">${a.completedOrders}</div>
    <div class="kpi-sub">dari ${a.totalOrders} total</div>
    <div class="kpi-delta ${completionRate >= 80 ? 'delta-up' : 'delta-dn'}">${completionRate}% completion</div>
  </div>
  <div class="kpi" style="--kc:var(--rd)">
    <div class="kpi-lbl">Over SLA</div>
    <div class="kpi-val">${a.overSlaItemsCount}</div>
    <div class="kpi-sub">item terlambat</div>
    <div class="kpi-delta ${slaRate <= 20 ? 'delta-up' : 'delta-dn'}">${slaRate}% dari total item</div>
  </div>
</div>
<div class="two-equal">
  <div class="card">
    <div class="card-h"><div class="card-t">Produk Tercepat</div><div class="card-sub">Berdasarkan waktu rata-rata hari ini</div></div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>#</th><th>Produk</th><th>Avg Prep</th><th>Target</th><th>Orders</th></tr></thead>
      <tbody>
      ${a.fastestProducts.length === 0 ? '<tr><td colspan="5" style="text-align:center">Belum ada data</td></tr>' : a.fastestProducts.map((p, i) => `
      <tr>
        <td><span class="badge badge-green">${i+1}</span></td>
        <td class="bold">${p.name}</td>
        <td class="mono">${formatTime(p.avg_prep_minutes * 60)}</td>
        <td class="mono">${p.production_time || 0} mnt</td>
        <td>${p.orders_count}</td>
      </tr>`).join('')}
      </tbody>
    </table></div>
  </div>
  <div class="card">
    <div class="card-h"><div class="card-t">Produk Terlambat / Terlama</div><div class="card-sub">Memerlukan evaluasi kecepatan</div></div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>#</th><th>Produk</th><th>Avg Prep</th><th>Target</th><th>Orders</th></tr></thead>
      <tbody>
      ${a.slowestProducts.length === 0 ? '<tr><td colspan="5" style="text-align:center">Belum ada data</td></tr>' : a.slowestProducts.map((p, i) => `
      <tr>
        <td><span class="badge badge-red">${i+1}</span></td>
        <td class="bold">${p.name}</td>
        <td class="mono">${formatTime(p.avg_prep_minutes * 60)}</td>
        <td class="mono">${p.production_time || 0} mnt</td>
        <td>${p.orders_count}</td>
      </tr>`).join('')}
      </tbody>
    </table></div>
  </div>
</div>`;
};
