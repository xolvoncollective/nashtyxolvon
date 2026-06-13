// DASHBOARD 
const frS = n => n >= 1e6 ? 'Rp ' + (n / 1e6).toFixed(1) + 'jt' : n >= 1e3 ? 'Rp ' + (n / 1e3).toFixed(0) + 'rb' : 'Rp ' + n;
PAGES.dashboard = async () => {
  let kpi = { today: { total_sales:0, order_count:0, avg_order_value:0 }, yesterday: { total_sales:0 }, growth: 0, topProducts: [], salesByType: [] };
  let chartData = [];
  
  if (window.API) {
    if (!API.session.tenantId) API.session.tenantId = 'demo-tenant';
    try {
      const kpiRes = await API.request('/dashboard/kpi?tenantId=' + API.session.tenantId);
      if (kpiRes.success && kpiRes.data) kpi = kpiRes.data;
      
      const chartRes = await API.request('/dashboard/weekly-chart?tenantId=' + API.session.tenantId);
      if (chartRes.success && chartRes.data) chartData = chartRes.data;
    } catch (e) {
      console.error('Failed fetching dashboard data', e);
    }
  }

  const today = kpi.today || { total_sales:0, order_count:0, avg_order_value:0 };
  const topProds = kpi.topProducts || [];
  const byType = kpi.salesByType || [];

  const types = { 'dine-in': {lbl:'Dine In', col:'#22C55E'}, 'takeaway': {lbl:'Take Away', col:'#F59E0B'}, 'gofood': {lbl:'GoFood', col:'#E3175B'}, 'grabfood': {lbl:'GrabFood', col:'#00B14F'}, 'shopeefood': {lbl:'ShopeeFood', col:'#EE4D2D'} };

  const totalTypeSales = byType.reduce((sum, t) => sum + t.total_sales, 0) || 1;

  return `
<div class="ph"><div class="ph-title">Selamat datang, Kasir</div><div class="ph-sub">${new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})} · Outlet Aktif</div></div>

<div class="kpi-grid">
 <div class="kpi" style="--kc:var(--or)">
 <div class="kpi-lbl">Pendapatan Hari Ini</div>
 <div class="kpi-val">${frS(today.total_sales)}</div>
 <div class="kpi-sub">${today.order_count} transaksi</div>
 <div class="kpi-delta ${kpi.growth >= 0 ? 'delta-up' : 'delta-dn'}">${kpi.growth >= 0 ? '↑' : '↓'} ${Math.abs(kpi.growth)}% vs kemarin</div>
 </div>
 <div class="kpi" style="--kc:var(--gn)">
 <div class="kpi-lbl">Rata-rata Order</div>
 <div class="kpi-val">${frS(today.avg_order_value)}</div>
 <div class="kpi-sub">Per transaksi</div>
 <div class="kpi-delta delta-up"></div>
 </div>
 <div class="kpi" style="--kc:var(--bl)">
 <div class="kpi-lbl">Transaksi Hari Ini</div>
 <div class="kpi-val">${today.order_count}</div>
 <div class="kpi-sub">Data Real-Time</div>
 <div class="kpi-delta delta-up"></div>
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
 ${chartData.length ? chartData.map(c=>`
 <div class="bar-col">
 <div class="bar-val">${fr(c.total_sales).replace('Rp ','')}</div>
 <div class="bar" style="height:${Math.max(10, Math.round(c.total_sales/2000000*100))}px" title="${fr(c.total_sales)}"></div>
 <div class="bar-lbl">${c.day_name.substring(0,3)}</div>
 </div>`).join('') : '<div style="padding:40px 0;text-align:center;width:100%;color:#999">Data belum tersedia</div>'}
 </div>
 </div>
 </div>

 <div class="card">
 <div class="card-h"><div class="card-t">Quick Actions</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:8px">
 <button class="btn btn-primary" style="justify-content:center" onclick="nav('products',null);toast('Buka tambah produk')">'+ico('plus')+' Tambah Produk</button>
 <button class="btn" style="justify-content:center" onclick="nav('categories',null)">'+ico('plus')+' Tambah Kategori</button>
 <button class="btn" style="justify-content:center" onclick="nav('cashiers',null)">'+ico('plus')+' Tambah Kasir</button>
 </div>
 </div>
</div>

<div style="height:18px"></div>

<div class="two-col">
 <div class="card">
 <div class="card-h">
 <div class="card-t">Top Produk Terlaris</div>
 <span class="card-sub">Hari ini</span>
 </div>
 <div class="tbl-wrap">
 <table>
 <thead><tr><th>#</th><th>Produk</th><th>Qty</th><th>Revenue</th></tr></thead>
 <tbody>
 ${topProds.length ? topProds.map((p,i)=>`
 <tr>
 <td><span style="width:22px;height:22px;border-radius:50%;background:${i<3?['#F59E0B','#9CA3AF','#CD7C3F'][i]:'var(--sf3)'};color:${i<3?'#fff':'var(--txt3)'};font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center">${i+1}</span></td>
 <td class="bold">${p.product_name}</td>
 <td>${p.total_qty}</td>
 <td class="mono">${fr(p.total_sales)}</td>
 </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:20px;color:#999">Belum ada penjualan hari ini</td></tr>'}
 </tbody>
 </table>
 </div>
 </div>

 <div style="display:flex;flex-direction:column;gap:18px">
 <div class="card">
 <div class="card-h"><div class="card-t">Penjualan Berdasarkan Tipe</div></div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:9px">
 ${byType.length ? byType.map(t=>{
   const ty = types[t.order_type] || {lbl: t.order_type, col: '#888'};
   const pct = Math.round((t.total_sales / totalTypeSales) * 100);
   return `
 <div>
 <div style="display:flex;justify-content:space-between;margin-bottom:3px">
 <span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px">
 <span style="width:8px;height:8px;border-radius:50%;background:${ty.col};display:inline-block"></span>${ty.lbl}
 </span>
 <span style="font-size:12px;font-family:var(--mo)">${fr(t.total_sales)}</span>
 </div>
 <div style="height:5px;background:var(--sf3);border-radius:3px;overflow:hidden">
 <div style="height:100%;width:${pct}%;background:${ty.col};border-radius:3px"></div>
 </div>
 </div>`;
 }).join('') : '<div style="text-align:center;padding:15px;color:#999;font-size:13px">Belum ada data</div>'}
 </div>
 </div>

 </div>
</div>`;
};
