PAGES.settings=()=>`
<div class="ph"><div class="ph-title">Pengaturan Sistem</div><div class="ph-sub">Konfigurasi branding dan integrasi</div></div>
<div class="two-equal">
 <div class="card">
 <div class="card-h"><div class="card-t">Branding</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
 <div class="fld"><label>Nama Brand</label><input value="Nashty Hot Chicken"></div>
 <div class="fld"><label>Logo Brand</label>
 <div class="upload-zone" onclick="toast('Upload logo brand')">
 <div class="upload-zone-ico"></div>
 <div class="upload-zone-t">Upload logo brand</div>
 <div class="upload-zone-s">PNG / SVG · Rekomendasi 256×256px</div>
 </div>
 </div>
 <button class="btn btn-primary" onclick="toast('Branding disimpan')">Simpan Branding</button>
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
 <button class="btn btn-sm">Kelola</button>
 </div>
 </div>`).join('')}
 </div>
 </div>
</div>`;

PAGES.actlogs=()=>`
<div class="ph"><div class="ph-title">Activity Logs</div><div class="ph-sub">Catatan aktivitas dan perubahan sistem</div></div>
<div class="sf-bar">
 <div class="search-wrap"><input class="search-inp" placeholder="Cari aktivitas atau user..."></div>
 <select class="filter-select"><option>Semua Module</option><option>Produk</option><option>POS</option><option>Menu</option><option>Tim</option></select>
 <select class="filter-select"><option>Hari Ini</option><option>7 Hari Terakhir</option><option>30 Hari Terakhir</option></select>
</div>
<div class="card">
 <div class="tbl-wrap"><table>
 <thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Module</th><th>Detail</th></tr></thead>
 <tbody>
 ${LOGS.map(l=>`
 <tr>
 <td class="mono" style="font-size:11.5px;color:var(--txt3);white-space:nowrap">${l.time}</td>
 <td class="bold">${l.user}</td>
 <td>
 <div style="display:flex;align-items:center;gap:7px">
 <span style="width:8px;height:8px;border-radius:50%;background:${l.color};flex-shrink:0"></span>
 ${l.action}
 </div>
 </td>
 <td><span class="badge badge-gray">${l.module}</span></td>
 <td style="font-size:12px;color:var(--txt3)">${l.detail}</td>
 </tr>`).join('')}
 </tbody>
 </table></div>
 <div style="padding:12px 16px;border-top:1px solid var(--brd)">
 <div class="pagination">
 <span class="pg-info">Menampilkan 8 dari 342 log</span>
 <div class="pg-btn">‹</div>
 <div class="pg-btn act">1</div><div class="pg-btn">2</div><div class="pg-btn">3</div><div class="pg-btn">…</div><div class="pg-btn">43</div>
 <div class="pg-btn">›</div>
 </div>
 </div>
</div>`;
