// OUTLETS 
PAGES.outlets=()=>`
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Outlets</div><div class="ph-sub">Manajemen lokasi dan jam operasional</div></div>
 <button class="btn btn-primary" onclick="toast('Tambah outlet baru')">${ico('plus')} Tambah Outlet</button>
 </div>
</div>
<div class="three-col">
 ${OUTLETS.map(o=>`
 <div class="card">
 <div class="card-h">
 <div>
 <div class="card-t">${o.name}</div>
 <div class="card-sub">${o.city}</div>
 </div>
 <span class="badge ${o.status==='open'?'badge-green':o.status==='maintenance'?'badge-yellow':'badge-red'}">${o.status}</span>
 </div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:8px">
 <div style="font-size:12px;color:var(--txt3)">${o.address}</div>
 <div style="font-size:12px;color:var(--txt2)"> ${o.phone}</div>
 <div style="border-top:1px solid var(--brd);padding-top:8px">
 <div style="font-size:11px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Jam Operasional</div>
 ${['Sen–Jum','Sab','Min'].map((d,i)=>`
 <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0">
 <span style="color:var(--txt3)">${d}</span>
 <span style="font-weight:600">${i<2?'09:00 – 22:00':'10:00 – 21:00'}</span>
 </div>`).join('')}
 </div>
 <div style="display:flex;gap:6px;margin-top:4px">
 <button class="btn btn-sm" style="flex:1;justify-content:center" onclick="toast('Edit ${o.name}')">${ico('edit')} Edit</button>
 <select class="filter-select" style="flex:1;font-size:11.5px;padding:5px 8px" onchange="toast('Status diubah ke '+this.value)">
 <option ${o.status==='open'?'selected':''}>open</option>
 <option ${o.status==='closed'?'selected':''}>closed</option>
 <option ${o.status==='maintenance'?'selected':''}>maintenance</option>
 </select>
 </div>
 </div>
 </div>`).join('')}
</div>`;

// REPORTS 
PAGES.reports=(()=>{
  return ()=>{
    setTimeout(()=>renderReportTab('sales'),0);
    return `
<div class="ph">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div><div class="ph-title">Laporan</div><div class="ph-sub">Analisis penjualan, produk, dan performa kasir</div></div>
    <div style="display:flex;gap:8px">
      <div style="display:flex;overflow:hidden;border-radius:8px;border:1px solid var(--brd2)">
        ${['Hari Ini','Minggu Ini','Bulan Ini','Custom'].map((p,i)=>`<button style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:${i===2?'var(--or)':'transparent'};color:${i===2?'#fff':'var(--txt3)'};cursor:pointer;font-family:var(--fn)">${p}</button>`).join('')}
      </div>
      <button class="btn" onclick="toast('Export Excel')">'+ico('exp')+' Export</button>
    </div>
  </div>
</div>
<div class="stabs" id="report-stabs">
  <div class="stab act" onclick="switchReportTab('sales',this)">Ringkasan Penjualan</div>
  <div class="stab" onclick="switchReportTab('items',this)">Item Sales</div>
  <div class="stab" onclick="switchReportTab('categories',this)">Category Sales</div>
  <div class="stab" onclick="switchReportTab('modifiers',this)">Modifier Sales</div>
  <div class="stab" onclick="switchReportTab('taxes',this)">Pajak &amp; Biaya</div>
</div>
<div id="report-body"></div>`;
  };
})();

function switchReportTab(tab,el){
  document.querySelectorAll('#report-stabs .stab').forEach(t=>t.classList.remove('act'));
  if(el)el.classList.add('act');
  renderReportTab(tab);
}

function renderReportTab(tab){
  var el=document.getElementById('report-body');
  if(!el)return;
  var tabs={sales:renderSalesTab,items:renderItemSalesTab,categories:renderCategorySalesTab,modifiers:renderModifierSalesTab,taxes:renderTaxesTab};
  el.innerHTML=(tabs[tab]||renderSalesTab)();
}

function renderSalesTab(){
  var kpiHtml='<div class="kpi-grid" style="margin-bottom:22px">'
    +'<div class="kpi" style="--kc:var(--or)"><div class="kpi-lbl">Gross Sales</div><div class="kpi-val">89,4jt</div><div class="kpi-sub">Bulan ini</div><div class="kpi-delta delta-up">+8% vs bulan lalu</div></div>'
    +'<div class="kpi" style="--kc:var(--gn)"><div class="kpi-lbl">Net Sales</div><div class="kpi-val">82,1jt</div><div class="kpi-sub">Setelah diskon & refund</div></div>'
    +'<div class="kpi" style="--kc:var(--bl)"><div class="kpi-lbl">Total Transaksi</div><div class="kpi-val">2.841</div><div class="kpi-sub">5 void · 12 refund</div></div>'
    +'<div class="kpi" style="--kc:var(--rd)"><div class="kpi-lbl">Total Refund</div><div class="kpi-val">1,2jt</div><div class="kpi-sub">12 refund diproses</div></div>'
    +'</div>';

  var rows=[
    ['Gross Sales','89.403.500',false,false],
    ['Diskon','2.240.000',false,true],
    ['Refund','1.189.500',false,true],
    ['Net Sales','85.974.000',true,false],
    ['Pajak (11%)','9.457.140',false,false],
    ['Service (5%)','4.298.700',false,false],
    ['COGS','0',false,false],
    ['Total Collected','85.974.000',true,false],
  ];
  var rowsHtml='';
  rows.forEach(function(r){
    var l=r[0],v=r[1],sub=r[2],neg=r[3];
    var valDisplay=neg?'(Rp '+v+')':'Rp '+v;
    var bold=sub;
    var orStyle=(l==='Total Collected')?'color:var(--or);font-weight:700':'';
    rowsHtml+='<div style="display:flex;justify-content:space-between;padding:11px 16px;border-bottom:1px solid var(--brd);'+(sub?'border-top:2px solid var(--brd2);background:var(--sf2)':'')+'">'
      +'<span style="font-size:13.5px;'+(bold?'font-weight:700;color:var(--txt)':'color:var(--txt2)')+'">'+l+'</span>'
      +'<span style="font-size:13.5px;font-family:var(--mo);'+(orStyle||neg?'color:var(--txt3)':bold?'font-weight:700':'')+'">'+valDisplay+'</span>'
      +'</div>';
  });

  var pmRows=[['Tunai','#22C55E',891,22400000],['QRIS','#3B82F6',724,18200000],['BCA','#1E40AF',418,10500000],['Transfer','#06B6D4',312,7800000],['Debit','#A855F7',241,6100000],['GoFood','#E3175B',156,4100000],['GrabFood','#00B14F',72,1850000],['ShopeeFood','#EE4D2D',27,924000]];
  var pmHtml='';
  pmRows.forEach(function(p){var m=p[0],c=p[1],txn=p[2],tot=p[3];pmHtml+='<tr><td style="display:flex;align-items:center;gap:7px"><span style="width:7px;height:7px;border-radius:50%;background:'+c+';display:inline-block"></span>'+m+'</td><td>'+txn+'</td><td class="mono bold">'+fr(tot)+'</td></tr>';});

  var kasirRows=[['Citra Dewi',982,24500000,3],['Budi Santoso',891,22100000,1],['Ani Rahayu',812,20400000,0],['Dika Pratama',156,3900000,1]];
  var kasirHtml='';
  kasirRows.forEach(function(k){var n=k[0],t=k[1],r=k[2],v=k[3];kasirHtml+='<tr><td class="bold">'+n+'</td><td>'+t+'</td><td class="mono">'+fr(r)+'</td><td>'+(v>0?'<span class="badge badge-yellow">'+v+'</span>':'—')+'</td></tr>';});

  return kpiHtml
    +'<div class="two-col">'
    +'<div class="card"><div class="card-h"><div class="card-t">Ringkasan Penjualan</div></div><div>'+rowsHtml+'</div></div>'
    +'<div style="display:flex;flex-direction:column;gap:18px">'
    +'<div class="card"><div class="card-h"><div class="card-t">Per Metode Pembayaran</div></div><div class="tbl-wrap"><table><thead><tr><th>Metode</th><th>Txn</th><th>Total</th></tr></thead><tbody>'+pmHtml+'</tbody></table></div></div>'
    +'<div class="card"><div class="card-h"><div class="card-t">Performa Kasir</div></div><div class="tbl-wrap"><table><thead><tr><th>Kasir</th><th>Txn</th><th>Revenue</th><th>Void</th></tr></thead><tbody>'+kasirHtml+'</tbody></table></div></div>'
    +'</div></div>';
}

function renderItemSalesTab(){
  var items=[
    ['Ayam Bakar Madu','Makanan',55000,1892,104060000,12.1],
    ['Nasi Goreng Spesial','Makanan',35000,1644,57540000,6.7],
    ['Kopi Susu Aren','Minuman',22000,1231,27082000,3.1],
    ['Rawon Spesial','Makanan',42000,984,41328000,4.8],
    ['Sop Buntut','Makanan',65000,876,56940000,6.6],
    ['Es Teh Manis','Minuman',8000,812,6496000,0.8],
    ['French Fries','Camilan',22000,741,16302000,1.9],
    ['Sate Ayam 10pcs','Makanan',45000,628,28260000,3.3],
    ['Es Krim Cokelat','Dessert',18000,524,9432000,1.1],
    ['Jus Alpukat','Minuman',18000,419,7542000,0.9],
  ];
  var rows='';
  var rankColors=['#F59E0B','#9CA3AF','#CD7C3F'];
  items.forEach(function(it,i){
    var n=it[0],cat=it[1],p=it[2],qty=it[3],rev=it[4],pct=it[5];
    var rankBg=i<3?rankColors[i]:'var(--sf3)';
    var rankTxt=i<3?'#fff':'var(--txt3)';
    rows+='<tr>'
      +'<td><span style="width:22px;height:22px;border-radius:50%;background:'+rankBg+';color:'+rankTxt+';font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center">'+(i+1)+'</span></td>'
      +'<td class="bold">'+n+'</td>'
      +'<td><span class="badge badge-gray">'+cat+'</span></td>'
      +'<td class="mono">'+fr(p)+'</td>'
      +'<td><span class="bold">'+qty.toLocaleString('id-ID')+'</span></td>'
      +'<td class="mono bold">'+fr(rev)+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:5px;background:var(--sf3);border-radius:3px;overflow:hidden;min-width:60px"><div style="height:100%;width:'+Math.round(pct/12.1*100)+'%;background:var(--or);border-radius:3px"></div></div><span style="font-size:11px;font-weight:700;color:var(--txt3);min-width:32px">'+pct+'%</span></div></td>'
      +'</tr>';
  });
  return '<div class="card">'
    +'<div class="card-h"><div><div class="card-t">Item Sales</div><div class="card-sub">Penjualan per item menu — '+items.length+' dari 50 item</div></div>'
    +'<div style="display:flex;gap:8px"><div class="search-wrap" style="width:220px"><input class="search-inp" placeholder="Cari item..."></div>'
    +'<select class="filter-select"><option>Semua Kategori</option>'+CATEGORIES.map(function(c){return '<option>'+c.name+'</option>';}).join('')+'</select></div></div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Nama Item</th><th>Kategori</th><th>Harga</th><th>Qty Terjual</th><th>Gross Revenue</th><th>% Kontribusi</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="padding:12px 16px;border-top:1px solid var(--brd)"><div class="pagination"><span class="pg-info">Menampilkan 10 dari 50 item</span><div class="pg-btn">Prev</div><div class="pg-btn act">1</div><div class="pg-btn">2</div><div class="pg-btn">3</div><div class="pg-btn">Next</div></div></div>'
    +'</div>';
}

function renderCategorySalesTab(){
  var cats=[
    ['Makanan','#E4540C',8,6824,42800000,49.7,6270],
    ['Minuman','#3B82F6',10,5218,18400000,21.4,3526],
    ['Camilan','#F59E0B',10,2841,9200000,10.7,3238],
    ['Dessert','#A855F7',10,1924,7100000,8.2,3690],
    ['Add On','#22C55E',10,4120,4120000,4.8,1000],
  ];
  var kpis='<div class="kpi-grid" style="margin-bottom:22px">';
  cats.slice(0,4).forEach(function(c){kpis+='<div class="kpi" style="--kc:'+c[1]+'"><div class="kpi-lbl">'+c[0]+'</div><div class="kpi-val">'+fr(c[4]).replace('Rp ','Rp ')+'</div><div class="kpi-sub">'+c[2]+' item aktif</div></div>';});
  kpis+='</div>';
  var rows='';
  cats.forEach(function(c){
    var cat=c[0],col=c[1],items=c[2],qty=c[3],rev=c[4],pct=c[5],avg=c[6];
    rows+='<tr>'
      +'<td><div style="display:flex;align-items:center;gap:8px"><span style="width:10px;height:10px;border-radius:50%;background:'+col+';display:inline-block;flex-shrink:0"></span><span class="bold">'+cat+'</span></div></td>'
      +'<td>'+items+'</td>'
      +'<td>'+qty.toLocaleString('id-ID')+'</td>'
      +'<td class="mono bold">'+fr(rev)+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:5px;background:var(--sf3);border-radius:3px;overflow:hidden;min-width:80px"><div style="height:100%;width:'+Math.round(pct/49.7*100)+'%;background:'+col+';border-radius:3px"></div></div><span style="font-size:11px;font-weight:700;color:var(--txt3);min-width:36px">'+pct+'%</span></div></td>'
      +'<td class="mono">'+fr(avg)+'</td>'
      +'</tr>';
  });
  return kpis+'<div class="card"><div class="card-h"><div class="card-t">Penjualan per Kategori</div></div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>Kategori</th><th>Jumlah Item</th><th>Total Qty</th><th>Gross Revenue</th><th>% Kontribusi</th><th>Avg Order Value</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}

function renderModifierSalesTab(){
  var mods=[
    ['Level Pedas','Pedas Extra','Opsi',0,1284,0],
    ['Level Pedas','Pedas Sedang','Opsi',0,2108,0],
    ['Level Pedas','Original','Opsi',0,892,0],
    ['Variasi Add-on','Extra Sambal','Add-on',3000,741,2223000],
    ['Variasi Add-on','Nasi Putih','Add-on',6000,612,3672000],
    ['Variasi Add-on','Lalapan','Add-on',4000,489,1956000],
    ['Suhu Minuman','Dingin','Opsi',0,1891,0],
    ['Suhu Minuman','Hangat','Opsi',0,412,0],
    ['Extra Shot','Extra Shot','Add-on',8000,312,2496000],
    ['Oat Milk','Oat Milk Upgrade','Add-on',5000,289,1445000],
  ];
  var rows='';
  mods.forEach(function(m){
    var grp=m[0],item=m[1],type=m[2],price=m[3],qty=m[4],rev=m[5];
    rows+='<tr>'
      +'<td><span class="badge badge-gray">'+grp+'</span></td>'
      +'<td class="bold">'+item+'</td>'
      +'<td><span class="badge '+(type==='Add-on'?'badge-green':'badge-blue')+'">'+type+'</span></td>'
      +'<td class="mono">'+(price>0?'+'+fr(price):'Gratis')+'</td>'
      +'<td>'+qty.toLocaleString('id-ID')+'</td>'
      +'<td class="mono bold" style="color:'+(type==='Add-on'?'var(--gn)':'var(--txt3)')+'">'+( rev>0?fr(rev):'—')+'</td>'
      +'</tr>';
  });
  var addons=[['Variasi Add-on',7851000,'#22C55E'],['Extra Shot',2496000,'#3B82F6'],['Oat Milk Upgrade',1445000,'#A855F7']];
  var aoHtml='';
  addons.forEach(function(a){
    aoHtml+='<div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;font-weight:600">'+a[0]+'</span><span style="font-size:12px;font-family:var(--mo);font-weight:700">'+fr(a[1])+'</span></div>'
      +'<div style="height:5px;background:var(--sf3);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+Math.round(a[1]/7851000*100)+'%;background:'+a[2]+';border-radius:3px"></div></div></div>';
  });
  var topMods=[['Pedas Sedang',2108],['Dingin',1891],['Pedas Extra',1284],['Original',892],['Hangat',412]];
  var tmHtml='';
  topMods.forEach(function(m,i){tmHtml+='<tr><td><span class="badge badge-gray">'+(i+1)+'</span></td><td class="bold">'+m[0]+'</td><td>'+m[1].toLocaleString('id-ID')+'</td></tr>';});
  return '<div class="card" style="margin-bottom:18px">'
    +'<div class="card-h"><div class="card-t">Modifier Sales</div><div class="card-sub">Penjualan berdasarkan pilihan modifier dan add-on berbayar</div></div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>Group</th><th>Item Pilihan</th><th>Tipe</th><th>Harga Tambah</th><th>Qty Dipilih</th><th>Add-on Revenue</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'
    +'<div class="two-equal">'
    +'<div class="card"><div class="card-h"><div class="card-t">Add-on Revenue Summary</div></div><div class="card-b" style="display:flex;flex-direction:column;gap:10px">'+aoHtml+'<div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--brd)"><span style="font-size:13px;font-weight:700">Total Add-on Revenue</span><span style="font-size:14px;font-weight:800;font-family:var(--mo);color:var(--gn)">'+fr(11792000)+'</span></div></div></div>'
    +'<div class="card"><div class="card-h"><div class="card-t">Modifier Paling Sering Dipilih</div></div><div class="tbl-wrap"><table><thead><tr><th>#</th><th>Item</th><th>Qty</th></tr></thead><tbody>'+tmHtml+'</tbody></table></div></div>'
    +'</div>';
}

function renderTaxesTab(){
  var days=['27 Mei','28 Mei','29 Mei','30 Mei','31 Mei','1 Jun','2 Jun','3 Jun'];
  var revs=[2800000,3100000,2600000,3400000,4800000,5200000,3900000,4280000];
  var tRows='';
  days.forEach(function(d,i){
    var r=revs[i];
    tRows+='<tr>'
      +'<td class="bold">'+d+'</td>'
      +'<td class="mono">'+fr(r)+'</td>'
      +'<td class="mono">'+fr(Math.round(r*0.11))+'</td>'
      +'<td class="mono">'+fr(Math.round(r*0.05))+'</td>'
      +'<td class="mono bold">'+fr(Math.round(r*0.16))+'</td>'
      +'</tr>';
  });
  return '<div class="kpi-grid" style="margin-bottom:22px">'
    +'<div class="kpi" style="--kc:var(--or)"><div class="kpi-lbl">Total PPN (11%)</div><div class="kpi-val">9,46jt</div><div class="kpi-sub">Bulan ini</div></div>'
    +'<div class="kpi" style="--kc:var(--bl)"><div class="kpi-lbl">Service Charge (5%)</div><div class="kpi-val">4,30jt</div><div class="kpi-sub">Bulan ini</div></div>'
    +'<div class="kpi" style="--kc:var(--gn)"><div class="kpi-lbl">Total Dipungut</div><div class="kpi-val">13,76jt</div><div class="kpi-sub">Pajak + Service</div></div>'
    +'<div class="kpi" style="--kc:var(--rd)"><div class="kpi-lbl">Total Diskon</div><div class="kpi-val">2,24jt</div><div class="kpi-sub">Dari gross sales</div></div>'
    +'</div>'
    +'<div class="two-equal">'
    +'<div class="card"><div class="card-h"><div class="card-t">Rincian Pajak Harian</div></div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th>Gross Sales</th><th>PPN 11%</th><th>Service 5%</th><th>Total Pungutan</th></tr></thead><tbody>'+tRows+'</tbody></table></div></div>'
    +'<div class="card"><div class="card-h"><div class="card-t">Konfigurasi Pajak</div></div>'
    +'<div class="card-b" style="display:flex;flex-direction:column;gap:12px">'
    +'<div class="fld"><label>PPN (%)</label><input type="number" value="11" readonly style="background:var(--sf2)"><div class="fld-hint">Sesuai regulasi — ubah di POS Settings</div></div>'
    +'<div class="fld"><label>Service Charge (%)</label><input type="number" value="5" readonly style="background:var(--sf2)"><div class="fld-hint">Ubah di POS Settings</div></div>'
    +'<div style="padding:12px;background:var(--orL2);border:1px solid var(--brd2);border-radius:9px;font-size:12px;color:var(--txt2);line-height:1.5">Pajak dan service charge diatur di <a href="#" onclick="nav(\'pos-general\',null)" style="color:var(--or);font-weight:600;text-decoration:none">POS Pengaturan Umum</a>.</div>'
    +'</div></div></div>';
}
