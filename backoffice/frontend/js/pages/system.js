// SYSTEM PAGES (Settings & Activity Logs)

window.saveBranding = async () => {
  const brandName = document.getElementById('brandName').value;
  if (!brandName) return toast('Nama brand tidak boleh kosong', 'err');
  
  const settings = { brandName };
  try {
    const res = await API.request('/settings/' + API.session.outletId, {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
    if (res.success) {
      toast('Branding berhasil disimpan');
      document.querySelectorAll('.sb-brand-name').forEach(e => e.textContent = brandName);
    } else {
      toast('Gagal menyimpan branding', 'err');
    }
  } catch (e) {
    toast('Terjadi kesalahan', 'err');
  }
};

PAGES.settings = async () => {
  let settings = { brandName: 'Nashty Hot Chicken' };
  
  if (window.API && API.session.outletId) {
    try {
      const res = await API.request('/settings/' + API.session.outletId);
      if (res.success && res.settings) {
        if (res.settings.brandName) settings.brandName = res.settings.brandName;
      }
    } catch (e) {
      console.error('Failed fetching settings', e);
    }
  }

  return `
<div class="ph"><div class="ph-title">Pengaturan Sistem</div><div class="ph-sub">Konfigurasi branding dan integrasi</div></div>
<div class="two-equal">
 <div class="card">
 <div class="card-h"><div class="card-t">Branding</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
 <div class="fld"><label>Nama Brand</label><input id="brandName" value="${settings.brandName}"></div>
 <div class="fld"><label>Logo Brand</label>
 <div class="upload-zone" onclick="toast('Fitur upload gambar akan segera hadir')">
 <div class="upload-zone-ico"></div>
 <div class="upload-zone-t">Upload logo brand</div>
 <div class="upload-zone-s">PNG / SVG · Rekomendasi 256×256px</div>
 </div>
 </div>
 <button class="btn btn-primary" onclick="window.saveBranding()" style="justify-content:center">Simpan Branding</button>
 </div>
 </div>
 <div class="card">
 <div class="card-h"><div class="card-t">Integrasi</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:12px">
 ${[
 ['WhatsApp API (Fonnte)','Untuk broadcast dan notifikasi otomatis',' Terhubung','badge-green'],
 ['QRIS Payment Gateway','Agregator QRIS nasional',' Belum diatur','badge-yellow'],
 ['NashtyPeople CRM','nashtypeople.pages.dev — Loyalty & member',' Terhubung','badge-green'],
 ['NashLoop WA Broadcast','Broadcast WhatsApp otomatis',' Terhubung','badge-green'],
 ].map(([n,d,s,bc])=>`
 <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--sf2);border:1px solid var(--brd);border-radius:10px">
 <div>
 <div style="font-size:13px;font-weight:600">${n}</div>
 <div style="font-size:11.5px;color:var(--txt3);margin-top:1px">${d}</div>
 </div>
 <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
 <span class="badge ${bc}">${s}</span>
 <button class="btn btn-sm" onclick="toast('Integrasi ${n} akan segera hadir')">Kelola</button>
 </div>
 </div>`).join('')}
 </div>
 </div>
</div>`;
};

PAGES.actlogs = async () => {
  let logs = [];
  let total = 0;
  
  if (window.API && API.session.tenantId) {
    try {
      const res = await API.request('/activity-logs?tenantId=' + API.session.tenantId);
      if (res.success && res.logs) {
        logs = res.logs;
        total = res.pagination?.total || logs.length;
      }
    } catch (e) {
      console.error('Failed fetching activity logs', e);
    }
  }

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActionColor = (action) => {
    const colors = {
      'create': 'var(--gn)',
      'update': 'var(--bl)',
      'delete': 'var(--rd)',
      'login': 'var(--ye)'
    };
    return colors[action] || 'var(--txt3)';
  };

  return `
<div class="ph"><div class="ph-title">Activity Logs</div><div class="ph-sub">Catatan aktivitas dan perubahan sistem</div></div>
<div class="sf-bar">
 <div class="search-wrap"><input class="search-inp" placeholder="Cari aktivitas atau user..." oninput="toast('Fitur pencarian logs menyusul')"></div>
 <select class="filter-select" onchange="toast('Fitur filter menyusul')"><option>Semua Module</option><option>Produk</option><option>POS</option><option>Menu</option><option>Tim</option></select>
 <select class="filter-select" onchange="toast('Fitur filter menyusul')"><option>Hari Ini</option><option>7 Hari Terakhir</option><option>30 Hari Terakhir</option></select>
</div>
<div class="card">
 <div class="tbl-wrap"><table>
 <thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Module</th><th>Detail</th></tr></thead>
 <tbody>
 ${logs.length ? logs.map(l => `
 <tr>
 <td class="mono" style="font-size:11.5px;color:var(--txt3);white-space:nowrap">${formatTime(l.created_at)}</td>
 <td class="bold">${l.user_name || l.user_id || 'System'}</td>
 <td>
 <div style="display:flex;align-items:center;gap:7px;text-transform:capitalize">
 <span style="width:8px;height:8px;border-radius:50%;background:${getActionColor(l.action)};flex-shrink:0"></span>
 ${l.action}
 </div>
 </td>
 <td><span class="badge badge-gray">${l.entity_type || '-'}</span></td>
 <td style="font-size:12px;color:var(--txt3)">${l.description}</td>
 </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">Belum ada activity logs</td></tr>'}
 </tbody>
 </table></div>
 <div style="padding:12px 16px;border-top:1px solid var(--brd)">
 <div class="pagination">
 <span class="pg-info">Menampilkan ${logs.length} dari ${total} log</span>
 <div class="pg-btn act">1</div>
 </div>
 </div>
</div>`;
};
