// OUTLETS 
let businessOutlets = [];
PAGES.outlets = async () => {
  try {
    const res = await API.outlets.getAll();
    businessOutlets = res.outlets || [];
  } catch (e) {
    console.error(e);
    businessOutlets = [];
  }

  return `
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Outlets</div><div class="ph-sub">Manajemen lokasi dan staf</div></div>
 <button class="btn btn-primary" onclick="openOutletModal()">${ico('plus')} Tambah Outlet</button>
 </div>
</div>
<div class="three-col">
 ${businessOutlets.length === 0 ? '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--txt3)">Belum ada outlet</div>' : businessOutlets.map(o=>`
 <div class="card">
 <div class="card-h">
 <div>
 <div class="card-t">${o.name}</div>
 <div class="card-sub">${o.address || '—'}</div>
 </div>
 <span class="badge ${o.status==='active'?'badge-green':o.status==='maintenance'?'badge-yellow':'badge-red'}">${o.status}</span>
 </div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:8px">
 <div style="font-size:12px;color:var(--txt3)">Telepon: ${o.phone || '—'}</div>
 <div style="display:flex;gap:12px;margin-top:8px;padding-top:8px;border-top:1px solid var(--brd)">
  <div style="flex:1;text-align:center">
    <div style="font-size:16px;font-weight:700;font-family:var(--mo)">${o.today_orders || 0}</div>
    <div style="font-size:11px;color:var(--txt3)">Order Hari Ini</div>
  </div>
  <div style="flex:1;text-align:center;border-left:1px solid var(--brd)">
    <div style="font-size:16px;font-weight:700;color:var(--gn);font-family:var(--mo)">${fr(o.today_revenue || 0)}</div>
    <div style="font-size:11px;color:var(--txt3)">Revenue Hari Ini</div>
  </div>
  <div style="flex:1;text-align:center;border-left:1px solid var(--brd)">
    <div style="font-size:16px;font-weight:700;font-family:var(--mo)">${o.staff_count || 0}</div>
    <div style="font-size:11px;color:var(--txt3)">Staf Aktif</div>
  </div>
 </div>
 <div style="display:flex;gap:6px;margin-top:12px">
 <button class="btn btn-sm" style="flex:1;justify-content:center" onclick="openOutletModal('${o.id}')">${ico('edit')} Edit</button>
 <select class="filter-select" style="flex:1;font-size:11.5px;padding:5px 8px" onchange="updateOutletStatus('${o.id}', this.value)">
 <option value="active" ${o.status==='active'?'selected':''}>Active</option>
 <option value="inactive" ${o.status==='inactive'?'selected':''}>Inactive</option>
 <option value="maintenance" ${o.status==='maintenance'?'selected':''}>Maintenance</option>
 </select>
 </div>
 </div>
 </div>`).join('')}
</div>`;
};

window.openOutletModal = function(id = null) {
  const o = id ? businessOutlets.find(x => x.id === id) : null;
  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal" id="mod-outlet">
    <div class="modal-box" style="max-width:400px">
      <div class="modal-head">
        <div class="modal-t">${id ? 'Edit' : 'Tambah'} Outlet</div>
        <button class="btn-icon" onclick="document.getElementById('mod-outlet').remove()">${ico('close')}</button>
      </div>
      <div class="modal-body" style="display:flex;flex-direction:column;gap:12px">
        <div class="fld"><label>Nama Outlet</label><input type="text" id="o-name" value="${o?.name || ''}"></div>
        <div class="fld"><label>Alamat</label><input type="text" id="o-address" value="${o?.address || ''}"></div>
        <div class="fld"><label>Telepon</label><input type="text" id="o-phone" value="${o?.phone || ''}"></div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="document.getElementById('mod-outlet').remove()">Batal</button>
        <button class="btn btn-primary" onclick="saveOutlet('${id || ''}')">Simpan</button>
      </div>
    </div>
  </div>`);
};

window.saveOutlet = async function(id) {
  const name = document.getElementById('o-name').value.trim();
  const address = document.getElementById('o-address').value.trim();
  const phone = document.getElementById('o-phone').value.trim();
  
  if (!name) return toast('Nama outlet wajib diisi', 'err');

  try {
    if (id) {
      await API.outlets.update(id, { name, address, phone });
      toast('Outlet berhasil diupdate', 'ok');
    } else {
      await API.outlets.create({ name, address, phone });
      toast('Outlet berhasil ditambahkan', 'ok');
    }
    document.getElementById('mod-outlet').remove();
    nav(curPage, document.querySelector('.sb-item.act'));
  } catch (e) {
    toast('Error: ' + e.message, 'err');
  }
};

window.updateOutletStatus = async function(id, status) {
  try {
    await API.outlets.update(id, { status });
    toast('Status outlet diupdate', 'ok');
    nav(curPage, document.querySelector('.sb-item.act'));
  } catch (e) {
    toast('Error: ' + e.message, 'err');
  }
};


// REPORTS 
let reportData = { sales: null, products: null, cashiers: null };
let currentReportFilter = 'Hari Ini';
let currentReportTab = 'sales';

// Auto-refresh for reports
let reportsRefreshInterval = null;
const REPORTS_REFRESH_INTERVAL = 60000; // 60 seconds

function startReportsAutoRefresh() {
  if (reportsRefreshInterval) {
    clearInterval(reportsRefreshInterval);
  }
  
  reportsRefreshInterval = setInterval(() => {
    console.log('🔄 Auto-refreshing reports...');
    loadReportData(currentReportFilter);
  }, REPORTS_REFRESH_INTERVAL);
  
  console.log(`✅ Reports auto-refresh enabled (every ${REPORTS_REFRESH_INTERVAL / 1000}s)`);
}

function stopReportsAutoRefresh() {
  if (reportsRefreshInterval) {
    clearInterval(reportsRefreshInterval);
    reportsRefreshInterval = null;
    console.log('⏹ Reports auto-refresh stopped');
  }
}

function getDateRange(filter) {
  const now = new Date();
  const format = (d) => d.toISOString().split('T')[0];
  let from, to = format(now);

  if (filter === 'Hari Ini') {
    from = to;
  } else if (filter === 'Minggu Ini') {
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    from = format(startOfWeek);
  } else if (filter === 'Bulan Ini') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    from = format(startOfMonth);
  } else {
    from = to;
  }
  return { dateFrom: from, dateTo: to };
}

async function loadReportData(filter) {
  currentReportFilter = filter;
  const range = getDateRange(filter);
  
  try {
    const [salesRes, productsRes, cashiersRes] = await Promise.all([
      API.reports.getSales(range),
      API.reports.getProducts(range),
      API.reports.getCashiers(range)
    ]);
    
    reportData.sales = salesRes.data || { summary: {}, dailySales: [], byOrderType: [] };
    reportData.products = productsRes.data.products || [];
    reportData.cashiers = cashiersRes.data.cashiers || [];
  } catch (e) {
    console.error('Error loading reports:', e);
  }
  
  // Re-render current tab
  renderReportTab(currentReportTab);
}

window.changeReportFilter = function(filter, btn) {
  document.querySelectorAll('.rep-filters button').forEach(b => {
    b.style.background = 'transparent';
    b.style.color = 'var(--txt3)';
  });
  btn.style.background = 'var(--or)';
  btn.style.color = '#fff';
  toast('Memuat data ' + filter + '...');
  loadReportData(filter);
};

PAGES.reports = async () => {
  // Start auto-refresh
  startReportsAutoRefresh();
  
  // initial load
  await loadReportData(currentReportFilter);
  setTimeout(() => renderReportTab(currentReportTab), 0);

  const filters = ['Hari Ini','Minggu Ini','Bulan Ini'];
  const filterBtns = filters.map(f => 
    `<button style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:${f === currentReportFilter ? 'var(--or)' : 'transparent'};color:${f === currentReportFilter ? '#fff' : 'var(--txt3)'};cursor:pointer;font-family:var(--fn)" onclick="changeReportFilter('${f}', this)">${f}</button>`
  ).join('');

  return `
<div class="ph">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div><div class="ph-title">Laporan</div><div class="ph-sub">Analisis penjualan, produk, dan performa kasir</div></div>
    <div style="display:flex;gap:8px">
      <div class="rep-filters" style="display:flex;overflow:hidden;border-radius:8px;border:1px solid var(--brd2)">
        ${filterBtns}
      </div>
      <button class="btn" onclick="toast('Fitur export belum tersedia')">${ico('exp')} Export</button>
    </div>
  </div>
</div>
<div class="stabs" id="report-stabs">
  <div class="stab act" onclick="switchReportTab('sales',this)">Ringkasan Penjualan</div>
  <div class="stab" onclick="switchReportTab('items',this)">Item Sales</div>
  <div class="stab" onclick="switchReportTab('cashiers',this)">Performa Kasir</div>
</div>
<div id="report-body"></div>`;
};

window.switchReportTab = function(tab,el){
  currentReportTab = tab;
  document.querySelectorAll('#report-stabs .stab').forEach(t=>t.classList.remove('act'));
  if(el)el.classList.add('act');
  renderReportTab(tab);
}

function renderReportTab(tab){
  var el=document.getElementById('report-body');
  if(!el)return;
  var tabs={sales:renderSalesTab,items:renderItemSalesTab,cashiers:renderCashierTab};
  el.innerHTML=(tabs[tab]||renderSalesTab)();
}

function renderSalesTab(){
  if (!reportData.sales) return '<div>Memuat data...</div>';
  const sum = reportData.sales.summary || {};
  const gSales = sum.gross_sales || 0;
  const nSales = sum.net_sales || 0;
  const tOrders = sum.total_orders || 0;
  const tRefund = sum.total_discount || 0; // Using discount as proxy for refund in MVP
  const tax = sum.total_tax || 0;
  const sc = sum.total_sc || 0;

  var kpiHtml='<div class="kpi-grid" style="margin-bottom:22px">'
    +'<div class="kpi" style="--kc:var(--or)"><div class="kpi-lbl">Gross Sales</div><div class="kpi-val">'+fr(gSales).replace('Rp ','')+'</div><div class="kpi-sub">'+currentReportFilter+'</div></div>'
    +'<div class="kpi" style="--kc:var(--gn)"><div class="kpi-lbl">Net Sales</div><div class="kpi-val">'+fr(nSales).replace('Rp ','')+'</div><div class="kpi-sub">Setelah diskon</div></div>'
    +'<div class="kpi" style="--kc:var(--bl)"><div class="kpi-lbl">Total Transaksi</div><div class="kpi-val">'+tOrders+'</div><div class="kpi-sub">Total order lunas</div></div>'
    +'<div class="kpi" style="--kc:var(--rd)"><div class="kpi-lbl">Total Diskon</div><div class="kpi-val">'+fr(tRefund).replace('Rp ','')+'</div><div class="kpi-sub">Nilai potongan</div></div>'
    +'</div>';

  var rows=[
    ['Gross Sales', fr(gSales).replace('Rp ',''),false,false],
    ['Diskon', fr(tRefund).replace('Rp ',''),false,true],
    ['Net Sales', fr(nSales).replace('Rp ',''),true,false],
    ['Pajak', fr(tax).replace('Rp ',''),false,false],
    ['Service Charge', fr(sc).replace('Rp ',''),false,false],
    ['Total Collected', fr(nSales + tax + sc).replace('Rp ',''),true,false],
  ];
  
  var rowsHtml='';
  rows.forEach(function(r){
    var l=r[0],v=r[1],sub=r[2],neg=r[3];
    var valDisplay=neg?'(-'+v+')':v;
    var bold=sub;
    var orStyle=(l==='Total Collected')?'color:var(--or);font-weight:700':'';
    rowsHtml+='<div style="display:flex;justify-content:space-between;padding:11px 16px;border-bottom:1px solid var(--brd);'+(sub?'border-top:2px solid var(--brd2);background:var(--sf2)':'')+'">'
      +'<span style="font-size:13.5px;'+(bold?'font-weight:700;color:var(--txt)':'color:var(--txt2)')+'">'+l+'</span>'
      +'<span style="font-size:13.5px;font-family:var(--mo);'+(orStyle||neg?'color:var(--txt3)':bold?'font-weight:700':'')+'">'+valDisplay+'</span>'
      +'</div>';
  });

  const orderTypes = reportData.sales.byOrderType || [];
  var pmHtml = orderTypes.length === 0 ? '<tr><td colspan="3" style="text-align:center">Belum ada data</td></tr>' : '';
  orderTypes.forEach(function(p, i){
    const colors = ['#22C55E', '#3B82F6', '#F59E0B', '#A855F7'];
    const c = colors[i % colors.length];
    pmHtml+='<tr><td style="display:flex;align-items:center;gap:7px"><span style="width:7px;height:7px;border-radius:50%;background:'+c+';display:inline-block"></span>'+(p.order_type||'Lainnya').toUpperCase()+'</td><td>'+p.order_count+'</td><td class="mono bold">'+fr(p.total_sales)+'</td></tr>';
  });

  return kpiHtml
    +'<div class="two-col">'
    +'<div class="card"><div class="card-h"><div class="card-t">Ringkasan Penjualan</div></div><div>'+rowsHtml+'</div></div>'
    +'<div style="display:flex;flex-direction:column;gap:18px">'
    +'<div class="card"><div class="card-h"><div class="card-t">Per Tipe Pesanan</div></div><div class="tbl-wrap"><table><thead><tr><th>Tipe Order</th><th>Txn</th><th>Total Revenue</th></tr></thead><tbody>'+pmHtml+'</tbody></table></div></div>'
    +'</div></div>';
}

function renderItemSalesTab(){
  var items = reportData.products || [];
  var rows= items.length === 0 ? '<tr><td colspan="7" style="text-align:center">Belum ada data</td></tr>' : '';
  var rankColors=['#F59E0B','#9CA3AF','#CD7C3F'];
  
  const totalRev = items.reduce((s, i) => s + (i.total_revenue || 0), 0);

  items.forEach(function(it,i){
    var n=it.product_name, cat=it.category_name, p=it.avg_price, qty=it.total_qty, rev=it.total_revenue;
    var pct = totalRev > 0 ? (rev / totalRev * 100).toFixed(1) : 0;
    var rankBg=i<3?rankColors[i]:'var(--sf3)';
    var rankTxt=i<3?'#fff':'var(--txt3)';
    rows+='<tr>'
      +'<td><span style="width:22px;height:22px;border-radius:50%;background:'+rankBg+';color:'+rankTxt+';font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center">'+(i+1)+'</span></td>'
      +'<td class="bold">'+n+'</td>'
      +'<td><span class="badge badge-gray">'+(cat||'Uncategorized')+'</span></td>'
      +'<td class="mono">'+fr(Math.round(p))+'</td>'
      +'<td><span class="bold">'+qty.toLocaleString('id-ID')+'</span></td>'
      +'<td class="mono bold">'+fr(rev)+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:5px;background:var(--sf3);border-radius:3px;overflow:hidden;min-width:60px"><div style="height:100%;width:'+pct+'%;background:var(--or);border-radius:3px"></div></div><span style="font-size:11px;font-weight:700;color:var(--txt3);min-width:32px">'+pct+'%</span></div></td>'
      +'</tr>';
  });
  return '<div class="card">'
    +'<div class="card-h"><div><div class="card-t">Item Sales</div><div class="card-sub">Penjualan per item menu — Terurut dari revenue terbesar</div></div></div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Nama Item</th><th>Kategori</th><th>Harga Rata2</th><th>Qty Terjual</th><th>Gross Revenue</th><th>% Kontribusi</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'</div>';
}

function renderCashierTab() {
  const cashiers = reportData.cashiers || [];
  var kasirHtml= cashiers.length === 0 ? '<tr><td colspan="5" style="text-align:center">Belum ada data</td></tr>' : '';
  
  cashiers.forEach(function(k){
    var n=k.name, t=k.total_orders, r=k.total_sales, v=k.void_count, avg=k.avg_order_value;
    kasirHtml+='<tr><td class="bold">'+n+'</td><td>'+t+'</td><td class="mono">'+fr(r)+'</td><td class="mono">'+fr(Math.round(avg))+'</td><td>'+(v>0?'<span class="badge badge-yellow">'+v+'</span>':'—')+'</td></tr>';
  });

  return '<div class="card">'
    +'<div class="card-h"><div class="card-t">Performa Kasir / Staff</div></div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>Staf</th><th>Total Order</th><th>Net Revenue</th><th>Avg Order Value</th><th>Void / Cancelled</th></tr></thead><tbody>'+kasirHtml+'</tbody></table></div>'
    +'</div>';
}
