// DASHBOARD 
PAGES.dashboard=()=>`
<div class="ph"><div class="ph-title">Selamat datang, Bagoes </div><div class="ph-sub">Selasa, 3 Juni 2025 · Galaxy Mall</div></div>

<div class="kpi-grid">
 <div class="kpi" style="--kc:var(--or)">
 <div class="kpi-lbl">Pendapatan Hari Ini</div>
 <div class="kpi-val">4,28jt</div>
 <div class="kpi-sub">187 transaksi</div>
 <div class="kpi-delta delta-up">↑ 12% vs kemarin</div>
 </div>
 <div class="kpi" style="--kc:var(--gn)">
 <div class="kpi-lbl">Pendapatan Bulan Ini</div>
 <div class="kpi-val">89,4jt</div>
 <div class="kpi-sub">2.841 transaksi</div>
 <div class="kpi-delta delta-up">↑ 8% vs bulan lalu</div>
 </div>
 <div class="kpi" style="--kc:var(--bl)">
 <div class="kpi-lbl">Transaksi Hari Ini</div>
 <div class="kpi-val">187</div>
 <div class="kpi-sub">5 void · 2 refund</div>
 <div class="kpi-delta delta-up">↑ 23 vs kemarin</div>
 </div>
 <div class="kpi" style="--kc:var(--pu)">
 <div class="kpi-lbl">Rata-rata Order</div>
 <div class="kpi-val">22,9rb</div>
 <div class="kpi-sub">Per transaksi</div>
 <div class="kpi-delta delta-dn">↓ 3% vs kemarin</div>
 </div>
</div>

<div class="two-col">
 <div class="card">
 <div class="card-h">
 <div>
 <div class="card-t">Pendapatan Harian</div>
 <div class="card-sub">7 hari terakhir</div>
 </div>
 <div class="badge badge-orange">Minggu Ini</div>
 </div>
 <div class="card-b">
 <div class="chart-bar">
 ${[['Sen',62,3200000],['Sel',78,3800000],['Rab',55,2900000],['Kam',91,4100000],['Jum',112,5200000],['Sab',135,6100000],['Min',187,4280000]].map(([d,t,r])=>`
 <div class="bar-col">
 <div class="bar-val">${fr(r).replace('Rp ','')}</div>
 <div class="bar" style="height:${Math.round(r/6100000*100)}px" title="${fr(r)} · ${t} Txn"></div>
 <div class="bar-lbl">${d}</div>
 </div>`).join('')}
 </div>
 </div>
 </div>

 <div class="card">
 <div class="card-h"><div class="card-t">Quick Actions</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:8px">
 <button class="btn btn-primary" style="justify-content:center" onclick="nav('products',null);toast('Buka tambah produk')">'+ico('plus')+' Tambah Produk</button>
 <button class="btn" style="justify-content:center" onclick="nav('categories',null)">'+ico('plus')+' Tambah Kategori</button>
 <button class="btn" style="justify-content:center" onclick="nav('cashiers',null)">'+ico('plus')+' Tambah Kasir</button>
 <button class="btn" style="justify-content:center" onclick="toast('Buka promo builder')">${ico('plus')} Buat Promosi</button>
 </div>
 </div>
</div>

<div style="height:18px"></div>

<div class="two-col">
 <div class="card">
 <div class="card-h">
 <div class="card-t">Top 10 Produk Terlaris</div>
 <span class="card-sub">Hari ini</span>
 </div>
 <div class="tbl-wrap">
 <table>
 <thead><tr><th>#</th><th>Produk</th><th>Qty</th><th>Revenue</th></tr></thead>
 <tbody>
 ${[['Ayam Bakar Madu',58,3190000],['Nasi Goreng Spesial',51,1785000],['Kopi Susu Aren',47,1034000],['Es Teh Manis',44,352000],['Rawon Spesial',38,1596000],['Sate Ayam 10pcs',29,1305000],['French Fries',27,594000],['Jus Alpukat',24,432000],['Es Krim Cokelat',21,378000],['Sop Buntut',18,1170000]].map(([n,q,r],i)=>`
 <tr>
 <td><span style="width:22px;height:22px;border-radius:50%;background:${i<3?['#F59E0B','#9CA3AF','#CD7C3F'][i]:'var(--sf3)'};color:${i<3?'#fff':'var(--txt3)'};font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center">${i+1}</span></td>
 <td class="bold">${n}</td>
 <td>${q}</td>
 <td class="mono">${fr(r)}</td>
 </tr>`).join('')}
 </tbody>
 </table>
 </div>
 </div>

 <div style="display:flex;flex-direction:column;gap:18px">
 <div class="card">
 <div class="card-h"><div class="card-t">Metode Pembayaran</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:9px">
 ${[['Tunai','#22C55E',1240000,29],['QRIS','#3B82F6',980000,23],['BCA','#1E40AF',720000,17],['Transfer','#06B6D4',580000,14],['Debit','#A855F7',430000,10],['GoFood','#E3175B',210000,5],['GrabFood','#00B14F',80000,2]].map(([m,c,a,p])=>`
 <div>
 <div style="display:flex;justify-content:space-between;margin-bottom:3px">
 <span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px">
 <span style="width:8px;height:8px;border-radius:50%;background:${c};display:inline-block"></span>${m}
 </span>
 <span style="font-size:12px;font-family:var(--mo)">${fr(a)}</span>
 </div>
 <div style="height:5px;background:var(--sf3);border-radius:3px;overflow:hidden">
 <div style="height:100%;width:${p}%;background:${c};border-radius:3px"></div>
 </div>
 </div>`).join('')}
 </div>
 </div>

 <div class="card">
 <div class="card-h"><div class="card-t">Performa Outlet</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:8px">
 ${OUTLETS.map(o=>`
 <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--sf2);border-radius:8px">
 <div>
 <div style="font-size:13px;font-weight:700">${o.name}</div>
 <div style="font-size:11px;color:var(--txt3)">${o.city}</div>
 </div>
 <div style="text-align:right">
 <div style="font-size:13px;font-weight:700;font-family:var(--mo)">${o.revenue?fr(o.revenue):'—'}</div>
 <span class="badge ${o.status==='open'?'badge-green':o.status==='maintenance'?'badge-yellow':'badge-red'}">${o.status}</span>
 </div>
 </div>`).join('')}
 </div>
 </div>
 </div>
</div>`;
