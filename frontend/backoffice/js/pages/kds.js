// KDS WORKFLOW 
PAGES['kds-workflow']=()=>`
<div class="ph"><div class="ph-title">KDS Workflow Status</div><div class="ph-sub">Atur alur kerja dapur dari order masuk hingga selesai</div></div>
<div class="two-equal">
 <div class="card">
 <div class="card-h">
 <div><div class="card-t">Alur Status</div><div class="card-sub">Drag untuk mengubah urutan</div></div>
 <button class="btn btn-primary btn-sm" onclick="toast('Tambah status baru')">'+ico('plus')+' Tambah Status</button>
 </div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:8px">
 ${[
 {n:'New Order',c:'#3B82F6',lock:true},
 {n:'Accepted',c:'#8B5CF6',lock:false},
 {n:'Preparing',c:'#F59E0B',lock:false},
 {n:'Ready',c:'#22C55E',lock:false},
 {n:'Completed',c:'#6B7280',lock:true},
 ].map((s,i)=>`
 <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--sf2);border:1px solid var(--brd);border-radius:10px;${s.lock?'opacity:.8':'cursor:grab'}">
 <span style="font-size:16px;color:var(--txt3)">${s.lock?'':''}</span>
 <div style="width:10px;height:10px;border-radius:50%;background:${s.c};flex-shrink:0"></div>
 <span style="font-size:13px;font-weight:700;flex:1">${s.n}</span>
 ${s.lock?'<span style="font-size:10px;color:var(--txt3)">Terkunci</span>':`
 <button class="btn btn-sm" onclick="toast('Edit status ${s.n}')">${ico('edit')} Edit</button>
 <button class="btn btn-sm btn-danger" onclick="toast('Status dihapus','err')">'+ico('del')+'</button>`}
 </div>
 ${i<4?'<div style="text-align:center;color:var(--txt3);font-size:18px">↓</div>':''}`).join('')}
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
 <span style="background:rgba(34,197,94,.15);color:#22C55E;font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px">+Extra Sambal</span>
 </div>
 </div>
 </div>
 </div>
 <div style="display:flex;gap:6px;align-items:center;padding-top:8px;border-top:1px solid rgba(255,255,255,.08)">
 <span style="font-size:10px;color:#9C9890;flex:1">Kasir: Citra</span>
 <span style="background:#8B5CF6;color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:5px">Preparing</span>
 </div>
 </div>
 </div>
 </div>
</div>`;

// KDS PRODUCTION TIME 
PAGES['kds-time']=()=>`
<div class="ph"><div class="ph-title">Production Time Rules</div><div class="ph-sub">Target waktu persiapan per kategori menu</div></div>
<div class="card">
 <div class="card-h">
 <div><div class="card-t">Target Waktu per Kategori</div><div class="card-sub">Digunakan untuk kalkulasi status On Time / Warning / Overdue</div></div>
 <button class="btn btn-primary btn-sm" onclick="toast('Tambah aturan baru')">'+ico('plus')+' Tambah Aturan</button>
 </div>
 <div class="tbl-wrap">
 <table>
 <thead><tr><th>Kategori</th><th>Target Waktu</th><th>On Time (0–80%)</th><th>Warning (80–100%)</th><th>Overdue (>100%)</th><th>Aksi</th></tr></thead>
 <tbody>
 ${[['Makanan',12],['Minuman',3],['Camilan',8],['Dessert',5],['Add On',2]].map(([c,t])=>`
 <tr>
 <td class="bold">${c}</td>
 <td><span class="badge badge-blue">${t} menit</span></td>
 <td><span class="badge badge-green">0 – ${Math.round(t*0.8)} mnt</span></td>
 <td><span class="badge badge-yellow">${Math.round(t*0.8)} – ${t} mnt</span></td>
 <td><span class="badge badge-red">> ${t} mnt</span></td>
 <td>
 <div style="display:flex;gap:5px">
 <button class="btn btn-sm" onclick="toast('Edit waktu ${c}')">${ico('edit')} Edit</button>
 </div>
 </td>
 </tr>`).join('')}
 </tbody>
 </table>
 </div>
</div>`;

// KDS ALERTS 
PAGES['kds-alerts']=()=>`
<div class="ph"><div class="ph-title">Alert Settings</div><div class="ph-sub">Konfigurasi notifikasi dan peringatan di KDS</div></div>
<div class="two-equal">
 <div class="card">
 <div class="card-h"><div class="card-t">Pengaturan Suara & Visual</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
 ${[
 ['Suara Order Baru','Bunyi notifikasi saat pesanan masuk ke KDS',true],
 ['Flash Alert','Kartu berkedip saat status Overdue',true],
 ['Escalation Alert','Notifikasi berulang setiap 1 menit saat SLA terlewat',true],
 ['Suara Eskalasi','Bunyi berbeda saat order sangat terlambat',false],
 ].map(([t,d,on])=>`
 <div class="toggle-row">
 <div class="toggle-info"><div class="tl">${t}</div><div class="ts">${d}</div></div>
 <label class="toggle"><input type="checkbox" ${on?'checked':''} onchange="toast('${t} '+(this.checked?'aktif':'nonaktif'))"><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
 </div>`).join('')}
 </div>
 </div>
 <div class="card">
 <div class="card-h"><div class="card-t">Interval Eskalasi</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
 <div class="fld"><label>Ulangi alert setiap (menit)</label><input type="number" value="1" min="1" max="10"><div class="fld-hint">Setelah order melewati target waktu</div></div>
 <div class="fld"><label>Batas maksimal pengulangan</label><input type="number" value="5"><div class="fld-hint">0 = tidak terbatas</div></div>
 <button class="btn btn-primary" onclick="toast('Alert settings disimpan')">Simpan</button>
 </div>
 </div>
</div>`;

// KDS ANALYTICS 
PAGES['kds-analytics']=()=>`
<div class="ph"><div class="ph-title">KDS Analytics</div><div class="ph-sub">Performa dapur hari ini</div></div>
<div class="kpi-grid">
 <div class="kpi" style="--kc:var(--gn)"><div class="kpi-lbl">Rata-rata Prep Time</div><div class="kpi-val">8:42</div><div class="kpi-sub">menit:detik</div><div class="kpi-delta delta-up">↓ 45dtk vs kemarin</div></div>
 <div class="kpi" style="--kc:var(--bl)"><div class="kpi-lbl">Order Selesai</div><div class="kpi-val">164</div><div class="kpi-sub">dari 187 total</div><div class="kpi-delta delta-up">↑ 87.7% completion</div></div>
 <div class="kpi" style="--kc:var(--rd)"><div class="kpi-lbl">Over SLA</div><div class="kpi-val">23</div><div class="kpi-sub">order terlambat</div><div class="kpi-delta delta-dn">12.3% dari total</div></div>
 <div class="kpi" style="--kc:var(--ye)"><div class="kpi-lbl">Peak Hour</div><div class="kpi-val">12:30</div><div class="kpi-sub">58 order/jam</div><div class="kpi-delta delta-up">Jam Sibuk Tertinggi</div></div>
</div>
<div class="two-equal">
 <div class="card">
 <div class="card-h"><div class="card-t">Produk Tercepat</div><div class="card-sub">Rata-rata waktu prep terpendek</div></div>
 <div class="tbl-wrap"><table>
 <thead><tr><th>#</th><th>Produk</th><th>Avg Prep</th><th>Orders</th></tr></thead>
 <tbody>
 ${[['Es Teh Manis','1:20',44],['Nasi Putih','1:45',38],['Air Mineral','0:45',22],['Kopi Susu Aren','2:30',47],['Lemon Tea','1:55',29]].map(([n,t,o],i)=>`
 <tr><td><span class="badge badge-green">${i+1}</span></td><td class="bold">${n}</td><td class="mono">${t}</td><td>${o}</td></tr>`).join('')}
 </tbody>
 </table></div>
 </div>
 <div class="card">
 <div class="card-h"><div class="card-t">Produk Terlambat</div><div class="card-sub">Sering melewati target waktu</div></div>
 <div class="tbl-wrap"><table>
 <thead><tr><th>#</th><th>Produk</th><th>Avg Prep</th><th>% Over SLA</th></tr></thead>
 <tbody>
 ${[['Sop Buntut','18:40','38%'],['Sate Ayam 10pcs','15:20','28%'],['Rawon Spesial','14:10','22%'],['Gado-Gado','11:05','15%'],['Ayam Bakar Madu','13:30','18%']].map(([n,t,p],i)=>`
 <tr><td><span class="badge badge-red">${i+1}</span></td><td class="bold">${n}</td><td class="mono">${t}</td><td><span class="badge badge-yellow">${p}</span></td></tr>`).join('')}
 </tbody>
 </table></div>
 </div>
</div>`;
