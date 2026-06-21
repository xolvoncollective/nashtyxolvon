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

window.uploadLogo = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png, image/jpeg, image/svg+xml';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      return toast('Ukuran file maksimal 2MB', 'err');
    }
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        toast('Mengunggah logo...');
        const res = await API.request('/settings/' + API.session.outletId + '/logo', {
          method: 'POST',
          body: JSON.stringify({ base64Data: ev.target.result })
        });
        if (res.success) {
          toast('Logo berhasil diunggah', 'ok');
          const preview = document.getElementById('logoPreview');
          if (preview) {
            preview.src = res.url;
            preview.style.display = 'block';
          }
        } else {
          toast('Gagal mengunggah logo: ' + res.error, 'err');
        }
      } catch (err) {
        toast('Error: ' + err.message, 'err');
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
};

// Upload QRIS static image to localStorage (for POS to read)
window.uploadQRIS = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png, image/jpeg, image/webp';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return toast('Ukuran QRIS maksimal 3MB', 'err');
    const reader = new FileReader();
    reader.onload = ev => {
      localStorage.setItem('nashty_qris_static', ev.target.result);
      toast('QRIS berhasil diunggah dan disimpan', 'ok');
      const preview = document.getElementById('qrisPreview');
      const placeholder = document.getElementById('qrisPlaceholder');
      if (preview) { preview.src = ev.target.result; preview.style.display = 'block'; }
      if (placeholder) placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  };
  input.click();
};

window.removeQRIS = function() {
  if (!confirm('Hapus QRIS statis?')) return;
  localStorage.removeItem('nashty_qris_static');
  const preview = document.getElementById('qrisPreview');
  const placeholder = document.getElementById('qrisPlaceholder');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'block';
  toast('QRIS dihapus', 'ok');
};

PAGES.settings = async () => {
  let settings = { brandName: 'Nashty Hot Chicken' };
  const qrisImage = localStorage.getItem('nashty_qris_static');
  
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
<div class="ph"><div class="ph-title">Pengaturan Sistem</div><div class="ph-sub">Konfigurasi branding dan pembayaran outlet</div></div>
<div class="card">
 <div class="card-h"><div class="card-t">Branding</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
 <div class="fld"><label>Nama Brand</label><input id="brandName" value="${settings.brandName}"></div>
 <div class="fld"><label>Logo Brand</label>
 <div class="upload-zone" onclick="window.uploadLogo()">
 <div class="upload-zone-ico" style="margin-bottom:10px">
   <img id="logoPreview" src="${settings.logo || ''}" style="max-height:80px; max-width:200px; display:${settings.logo ? 'block' : 'none'}; margin:0 auto;" onerror="this.style.display='none'">
 </div>
 <div class="upload-zone-t">Upload logo brand</div>
 <div class="upload-zone-s">PNG / SVG / JPG · Max 2MB</div>
 </div>
 </div>
 <button class="btn btn-primary" onclick="window.saveBranding()" style="justify-content:center">Simpan Branding</button>
 </div>
</div>

<div class="card" style="margin-top:20px">
 <div class="card-h">
   <div>
     <div class="card-t">QRIS Statis</div>
     <div class="card-sub">Gambar QRIS ini akan tampil di layar POS saat pelanggan memilih bayar QRIS</div>
   </div>
   <span class="badge ${qrisImage ? 'badge-orange' : 'badge-gray'}">${qrisImage ? '✓ Terpasang' : 'Belum Ada'}</span>
 </div>
 <div class="card-b" style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px">
   <div style="background:#fff;border-radius:16px;padding:16px;width:180px;height:180px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
     <img id="qrisPreview" src="${qrisImage || ''}" style="max-width:148px;max-height:148px;display:${qrisImage ? 'block' : 'none'};border-radius:8px" alt="QRIS Preview">
     <div id="qrisPlaceholder" style="display:${qrisImage ? 'none' : 'flex'};flex-direction:column;align-items:center;gap:8px;color:#94a3b8;text-align:center">
       <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="18" y="18" width="2" height="2"/></svg>
       <span style="font-size:11px">Belum ada QRIS</span>
     </div>
   </div>
   <div style="display:flex;gap:10px">
     <button class="btn btn-primary" onclick="window.uploadQRIS()" style="justify-content:center">
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
       ${qrisImage ? 'Ganti QRIS' : 'Upload QRIS'}
     </button>
     ${qrisImage ? `<button class="btn" style="background:rgba(239,68,68,0.12);color:#EF4444;border:1px solid rgba(239,68,68,0.2)" onclick="window.removeQRIS()">Hapus</button>` : ''}
   </div>
   <div style="font-size:11px;color:var(--txt3);text-align:center">PNG / JPG · Max 3MB · Disarankan resolusi 400×400px</div>
 </div>
</div>`;
};

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
    // SQLite timestamps are stored as 'YYYY-MM-DD HH:MM:SS' in local time (WIB usually).
    // By adding 'Z', JS parses it as UTC, then converting back to local string would add offset again, which is wrong.
    // Instead, parse it assuming it's already in the correct timezone or just display as is:
    let dStr = isoString;
    if (dStr.indexOf('T') === -1) {
       dStr = dStr.replace(' ', 'T'); // Convert '2026-06-18 13:55:35' to '2026-06-18T13:55:35'
    }
    const d = new Date(dStr + (dStr.endsWith('Z') ? '' : 'Z'));
    // If we want to force WIB (Asia/Jakarta), we can format with timeZone option
    return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
  };

  const getActionIcon = (action) => {
    switch(action) {
      case 'create': return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gn)" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`;
      case 'update': return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      case 'delete': return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--rd)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
      case 'login': return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ye)" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`;
      default: return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }
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
 ${getActionIcon(l.action)}
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
