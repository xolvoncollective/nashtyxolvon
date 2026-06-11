// ── MENU ENGINEERING ──────────────────────────────────
PAGES['menu-engineering']=(function(){
  return function(){
    setTimeout(function(){renderMETab('items');},0);
    var tabsHtml='<div class="stabs" id="me-stabs">'
      +'<div class="stab act" onclick="switchMETab(&quot;items&quot;,this)">Item Analysis</div>'
      +'<div class="stab" onclick="switchMETab(&quot;categories&quot;,this)">Category Analysis</div>'
      +'<div class="stab" onclick="switchMETab(&quot;addons&quot;,this)">Add-on Analysis</div>'
      +'</div>';
    return '<div class="ph"><div style="display:flex;align-items:center;justify-content:space-between">'
      +'<div><div class="ph-title">Menu Engineering Analytics</div>'
      +'<div class="ph-sub">Stars · Plowhorses · Puzzles · Dogs — analisis profitabilitas vs popularitas</div></div>'
      +'<div style="display:flex;gap:8px">'
      +'<div style="display:flex;overflow:hidden;border-radius:8px;border:1px solid var(--brd2)">'
      +'<button style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:transparent;color:var(--txt3);cursor:pointer;font-family:var(--fn)">Hari Ini</button>'
      +'<button style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:transparent;color:var(--txt3);cursor:pointer;font-family:var(--fn)">Minggu Ini</button>'
      +'<button style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:var(--or);color:#fff;cursor:pointer;font-family:var(--fn)">Bulan Ini</button>'
      +'</div>'
      +'<button class="btn" onclick="toast(&quot;Export report&quot;)">'+ico('exp')+' Export</button>'
      +'</div></div></div>'
      +tabsHtml
      +'<div id="me-body"></div>';
  };
})();

function switchMETab(tab,el){
  document.querySelectorAll('#me-stabs .stab').forEach(function(t){t.classList.remove('act');});
  if(el)el.classList.add('act');
  renderMETab(tab);
}
function renderMETab(tab){
  var el=document.getElementById('me-body');if(!el)return;
  var tabs={items:renderMEItems,categories:renderMECategories,addons:renderMEAddons};
  el.innerHTML=(tabs[tab]||renderMEItems)();
}
function getMEClass(pop,profit){
  if(pop==='high'&&profit==='high')return 'star';
  if(pop==='high'&&profit==='low') return 'plow';
  if(pop==='low' &&profit==='high')return 'puzzle';
  return 'dog';
}
function getMELabel(cls){return {star:'Star',plow:'Plowhorse',puzzle:'Puzzle',dog:'Dog'}[cls]||cls;}
function getMEColor(cls){return {star:'#22C55E',plow:'#3B82F6',puzzle:'#F59E0B',dog:'#EF4444'}[cls]||'#888';}
function getMEBg(cls){return {star:'rgba(34,197,94,.1)',plow:'rgba(59,130,246,.1)',puzzle:'rgba(245,158,11,.1)',dog:'rgba(239,68,68,.1)'}[cls]||'var(--sf2)';}
function getMEDesc(cls){
  var d={star:'Pertahankan & promosikan — ini andalan menu Anda',plow:'Naikkan harga atau kurangi porsi — populer tapi margin tipis',puzzle:'Tingkatkan pemasaran — untung besar tapi kurang dipesan',dog:'Pertimbangkan untuk dihapus atau direvisi'};
  return d[cls]||'';
}

function makeDot(name,label,margin,qty,x,y,size,color){
  return '<div style="position:absolute;left:'+x+'%;top:'+y+'%;transform:translate(-50%,-50%);width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+color+';opacity:.82;cursor:pointer;border:2px solid rgba(255,255,255,.7)" title="'+name+' | '+label+' | '+margin+'"></div>';
}
function filterMEItemTable(v){
  document.querySelectorAll('#me-tbl tbody tr').forEach(function(tr){
    if(!v){tr.style.display='';return;}
    var c=tr.querySelector('td:nth-child(8)');
    tr.style.display=(c&&c.textContent.trim().toLowerCase().includes(v))?'':'none';
  });
}
function renderMEItems(){
  var items=[
    ['Ayam Bakar Madu','Makanan',55000,18000,1892,'high','high'],
    ['Nasi Goreng Spesial','Makanan',35000,9000,1644,'high','high'],
    ['Rawon Spesial','Makanan',42000,16000,984,'high','low'],
    ['Sop Buntut','Makanan',65000,28000,876,'high','low'],
    ['Kopi Susu Aren','Minuman',22000,5000,1231,'high','high'],
    ['Es Teh Manis','Minuman',8000,1500,812,'high','high'],
    ['French Fries','Camilan',22000,6000,741,'high','high'],
    ['Air Mineral','Minuman',5000,800,634,'high','high'],
    ['Sate Ayam 10pcs','Makanan',45000,20000,628,'low','low'],
    ['Es Krim Cokelat','Dessert',18000,5000,524,'low','high'],
    ['Jus Alpukat','Minuman',18000,7000,419,'low','high'],
    ['Matcha Latte','Minuman',25000,8000,312,'low','high'],
    ['Gado-Gado','Makanan',28000,11000,289,'low','low'],
    ['Ayam Geprek','Makanan',38000,14000,201,'low','low'],
    ['Pecel Lele','Makanan',32000,12000,187,'low','low'],
  ];
  var counts={star:0,plow:0,puzzle:0,dog:0};
  items.forEach(function(it){counts[getMEClass(it[5],it[6])]++;});

  var kpiHtml='<div class="kpi-grid" style="margin-bottom:22px">';
  [['Stars','Profit tinggi & populer',counts.star,'star'],['Plowhorses','Populer, margin rendah',counts.plow,'plow'],['Puzzles','Margin baik, kurang populer',counts.puzzle,'puzzle'],['Dogs','Perlu evaluasi',counts.dog,'dog']].forEach(function(k){
    kpiHtml+='<div class="kpi" style="--kc:'+getMEColor(k[3])+'"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><div class="kpi-lbl">'+k[0]+'</div><span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:5px;background:'+getMEBg(k[3])+';color:'+getMEColor(k[3])+'">'+k[0]+'</span></div><div class="kpi-val" style="color:'+getMEColor(k[3])+'">'+k[2]+'</div><div class="kpi-sub">'+k[1]+'</div></div>';
  });
  kpiHtml+='</div>';

  var legendHtml='<div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap">';
  [{c:'star',l:'Star',d:'Tinggi × Tinggi'},{c:'plow',l:'Plowhorse',d:'Tinggi × Rendah'},{c:'puzzle',l:'Puzzle',d:'Rendah × Tinggi'},{c:'dog',l:'Dog',d:'Rendah × Rendah'}].forEach(function(leg){
    legendHtml+='<div style="display:flex;align-items:center;gap:7px;padding:6px 12px;background:'+getMEBg(leg.c)+';border:1px solid '+getMEColor(leg.c)+'44;border-radius:8px"><span style="width:8px;height:8px;border-radius:50%;background:'+getMEColor(leg.c)+';display:inline-block;flex-shrink:0"></span><span style="font-size:12px;font-weight:700;color:'+getMEColor(leg.c)+'">'+leg.l+'</span><span style="font-size:11px;color:var(--txt3)">'+leg.d+'</span></div>';
  });
  legendHtml+='</div>';

  /* Quadrant matrix */
  var matrixHtml='<div class="card" style="margin-bottom:18px"><div class="card-h"><div class="card-t">Matrix Quadrant</div><div class="card-sub">Popularitas (horizontal) vs Kontribusi Margin (vertikal)</div></div><div class="card-b"><div style="position:relative;height:260px;background:var(--sf2);border-radius:10px;overflow:hidden;border:1px solid var(--brd)">';
  matrixHtml+='<div style="position:absolute;top:8px;left:8px;font-size:9px;font-weight:700;color:rgba(245,158,11,.7);padding:2px 7px;background:rgba(245,158,11,.08);border-radius:4px">PUZZLE</div>';
  matrixHtml+='<div style="position:absolute;top:8px;right:8px;font-size:9px;font-weight:700;color:rgba(34,197,94,.8);padding:2px 7px;background:rgba(34,197,94,.08);border-radius:4px">STAR</div>';
  matrixHtml+='<div style="position:absolute;bottom:8px;left:8px;font-size:9px;font-weight:700;color:rgba(239,68,68,.7);padding:2px 7px;background:rgba(239,68,68,.08);border-radius:4px">DOG</div>';
  matrixHtml+='<div style="position:absolute;bottom:8px;right:8px;font-size:9px;font-weight:700;color:rgba(59,130,246,.7);padding:2px 7px;background:rgba(59,130,246,.08);border-radius:4px">PLOWHORSE</div>';
  matrixHtml+='<div style="position:absolute;top:0;left:50%;bottom:0;width:1px;background:var(--brd2)"></div>';
  matrixHtml+='<div style="position:absolute;left:0;top:50%;right:0;height:1px;background:var(--brd2)"></div>';

  var maxQty=Math.max.apply(null,items.map(function(i){return i[4];}));
  items.forEach(function(it){
    var cls=getMEClass(it[5],it[6]);
    var margin=it[2]-it[3];
    var xBase=it[5]==='high'?65:25;
    var xJitter=Math.round((it[4]/maxQty)*18);
    var yBase=it[6]==='high'?22:65;
    var yJitter=Math.round((margin/37000)*12);
    var xPct=Math.min(92,Math.max(8,xBase+xJitter));
    var yPct=Math.min(88,Math.max(8,yBase+yJitter));
    var size=Math.max(8,Math.min(18,Math.round(it[4]/160)));
    matrixHtml+=makeDot(it[0],getMELabel(cls),fr(it[2]-it[3]),it[4],xPct,yPct,size,getMEColor(cls));
  });
  matrixHtml+='</div>';
  matrixHtml+='<div style="display:flex;gap:5px;margin-top:10px;flex-wrap:wrap">';
  items.forEach(function(it){var cls=getMEClass(it[5],it[6]);matrixHtml+='<span style="font-size:9.5px;padding:2px 7px;border-radius:9px;background:'+getMEBg(cls)+';color:'+getMEColor(cls)+';font-weight:600">'+it[0]+'</span>';});
  matrixHtml+='</div></div></div>';

  /* Table */
  var sorted=[].concat(items).sort(function(a,b){var o={star:0,plow:1,puzzle:2,dog:3};var ca=getMEClass(a[5],a[6]),cb=getMEClass(b[5],b[6]);return o[ca]-o[cb]||b[4]-a[4];});
  var rows='';
  sorted.forEach(function(it){
    var cls=getMEClass(it[5],it[6]);
    var margin=it[2]-it[3];
    var mpct=Math.round(margin/it[2]*100);
    rows+='<tr>'
      +'<td class="bold">'+it[0]+'</td>'
      +'<td><span class="badge badge-gray">'+it[1]+'</span></td>'
      +'<td class="mono">'+fr(it[2])+'</td>'
      +'<td class="mono">'+fr(it[3])+'</td>'
      +'<td class="mono bold" style="color:'+getMEColor(cls)+'">'+fr(margin)+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:6px"><div style="width:40px;height:5px;background:var(--sf3);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+mpct+'%;background:'+getMEColor(cls)+';border-radius:3px"></div></div><span style="font-size:11px;font-weight:700">'+mpct+'%</span></div></td>'
      +'<td>'+it[4].toLocaleString('id-ID')+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:'+getMEColor(cls)+';display:inline-block;flex-shrink:0"></span><span style="font-size:11px;font-weight:700;color:'+getMEColor(cls)+'">'+getMELabel(cls)+'</span></div></td>'
      +'<td><div style="font-size:11px;color:var(--txt3);max-width:160px;line-height:1.35">'+getMEDesc(cls)+'</div></td>'
      +'</tr>';
  });

  return kpiHtml+legendHtml+matrixHtml
    +'<div class="card"><div class="card-h"><div class="card-t">Detail Analisis per Item</div>'
    +'<select class="filter-select" onchange="filterMEItemTable(this.value)"><option value="">Semua</option><option value="star">Star</option><option value="plowhorse">Plowhorse</option><option value="puzzle">Puzzle</option><option value="dog">Dog</option></select>'
    +'</div><div class="tbl-wrap"><table id="me-tbl"><thead><tr><th>Item</th><th>Kategori</th><th>Harga Jual</th><th>Est. COGS</th><th>Kontribusi</th><th>Margin %</th><th>Qty</th><th>Klasifikasi</th><th>Rekomendasi</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}

function renderMECategories(){
  var cats=[
    {name:'Makanan',   color:'#E4540C',items:8, avgMargin:58,avgQty:742,topItem:'Ayam Bakar Madu',cls:'star',  rev:42800000,profit:24800000},
    {name:'Minuman',   color:'#3B82F6',items:10,avgMargin:72,avgQty:682,topItem:'Kopi Susu Aren', cls:'star',  rev:18400000,profit:13200000},
    {name:'Camilan',   color:'#F59E0B',items:10,avgMargin:68,avgQty:312,topItem:'French Fries',   cls:'puzzle',rev:9200000, profit:6200000},
    {name:'Dessert',   color:'#A855F7',items:10,avgMargin:65,avgQty:218,topItem:'Es Krim Cokelat',cls:'puzzle',rev:7100000, profit:4600000},
    {name:'Add On',    color:'#22C55E',items:10,avgMargin:82,avgQty:412,topItem:'Nasi Putih',     cls:'plow',  rev:4120000, profit:3380000},
  ];
  var totalProfit=cats.reduce(function(s,c){return s+c.profit;},0);
  var kpiHtml='<div class="kpi-grid" style="margin-bottom:22px">'
    +'<div class="kpi" style="--kc:var(--gn)"><div class="kpi-lbl">Avg Margin Terbaik</div><div class="kpi-val">82%</div><div class="kpi-sub">Add On · '+fr(3380000)+'</div></div>'
    +'<div class="kpi" style="--kc:var(--or)"><div class="kpi-lbl">Kategori Terpopuler</div><div class="kpi-val">Makanan</div><div class="kpi-sub">Avg 742 qty/item</div></div>'
    +'<div class="kpi" style="--kc:var(--bl)"><div class="kpi-lbl">Total Est. Profit</div><div class="kpi-val">52,2jt</div><div class="kpi-sub">Semua kategori</div></div>'
    +'<div class="kpi" style="--kc:var(--ye)"><div class="kpi-lbl">Perlu Perhatian</div><div class="kpi-val">2</div><div class="kpi-sub">Camilan & Dessert (Puzzle)</div></div>'
    +'</div>';

  var cards='<div class="three-col" style="margin-bottom:18px">';
  cats.forEach(function(c){
    var cls=c.cls;
    cards+='<div class="card">'
      +'<div class="card-h"><div style="display:flex;align-items:center;gap:9px"><div style="width:9px;height:9px;border-radius:50%;background:'+c.color+'"></div><div class="card-t">'+c.name+'</div></div>'
      +'<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;background:'+getMEBg(cls)+';color:'+getMEColor(cls)+'">'+getMELabel(cls)+'</span></div>'
      +'<div class="card-b" style="display:flex;flex-direction:column;gap:9px">'
      +'<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--txt3)">Revenue</span><span style="font-size:12px;font-weight:700;font-family:var(--mo)">'+fr(c.rev)+'</span></div>'
      +'<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--txt3)">Est. Profit</span><span style="font-size:12px;font-weight:700;font-family:var(--mo);color:var(--gn)">'+fr(c.profit)+'</span></div>'
      +'<div><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:12px;color:var(--txt3)">Avg Margin</span><span style="font-size:12px;font-weight:700">'+c.avgMargin+'%</span></div><div style="height:6px;background:var(--sf3);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+c.avgMargin+'%;background:'+getMEColor(cls)+';border-radius:3px"></div></div></div>'
      +'<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--txt3)">Items</span><span style="font-size:12px;font-weight:600">'+c.items+' item</span></div>'
      +'<div style="padding:7px 9px;background:var(--sf2);border-radius:7px"><div style="font-size:10px;color:var(--txt3);margin-bottom:1px">Top Item</div><div style="font-size:12px;font-weight:700">'+c.topItem+'</div></div>'
      +'<div style="font-size:11px;color:'+getMEColor(cls)+';background:'+getMEBg(cls)+';padding:7px 9px;border-radius:7px;line-height:1.35">'+getMEDesc(cls)+'</div>'
      +'</div></div>';
  });
  cards+='</div>';

  var chartHtml='<div class="card"><div class="card-h"><div class="card-t">Distribusi Profit per Kategori</div></div><div class="card-b">';
  chartHtml+='<div style="display:flex;height:28px;border-radius:8px;overflow:hidden;margin-bottom:12px">';
  cats.forEach(function(c){var pct=Math.round(c.profit/totalProfit*100);chartHtml+='<div style="width:'+pct+'%;background:'+c.color+';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff" title="'+c.name+': '+pct+'%">'+pct+'%</div>';});
  chartHtml+='</div><div style="display:flex;gap:14px;flex-wrap:wrap">';
  cats.forEach(function(c){chartHtml+='<div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:2px;background:'+c.color+';display:inline-block"></span><span style="font-size:12px;font-weight:600">'+c.name+'</span><span style="font-size:11px;color:var(--txt3)">'+fr(c.profit)+'</span></div>';});
  chartHtml+='</div></div></div>';

  return kpiHtml+cards+chartHtml;
}

function renderMEAddons(){
  var addons=[
    {n:'Extra Sambal',  grp:'Variasi Add-on',price:3000, cost:400,  qty:741, parent:'Ayam Bakar Madu'},
    {n:'Nasi Putih',    grp:'Variasi Add-on',price:6000, cost:1200, qty:612, parent:'Ayam Bakar Madu'},
    {n:'Lalapan',       grp:'Variasi Add-on',price:4000, cost:800,  qty:489, parent:'Ayam Bakar Madu'},
    {n:'Extra Shot',    grp:'Extra Shot',    price:8000, cost:1500, qty:312, parent:'Kopi Susu Aren'},
    {n:'Oat Milk',      grp:'Oat Milk',      price:5000, cost:1800, qty:289, parent:'Kopi Susu Aren'},
    {n:'Cheese Dip',    grp:'French Fries',  price:7000, cost:2000, qty:312, parent:'French Fries'},
    {n:'Extra Saus',    grp:'French Fries',  price:3000, cost:500,  qty:289, parent:'French Fries'},
    {n:'Extra Sate 5pcs',grp:'Sate',         price:22500,cost:9000, qty:198, parent:'Sate Ayam 10pcs'},
    {n:'Extra Scoop',   grp:'Es Krim',       price:9000, cost:3000, qty:187, parent:'Es Krim Cokelat'},
    {n:'Waffle Cone',   grp:'Es Krim',       price:6000, cost:1500, qty:142, parent:'Es Krim Cokelat'},
  ];
  var totalRev=addons.reduce(function(s,a){return s+a.price*a.qty;},0);
  var totalProfit=addons.reduce(function(s,a){return s+(a.price-a.cost)*a.qty;},0);
  var avgQty=addons.reduce(function(s,a){return s+a.qty;},0)/addons.length;
  var avgMargin=addons.reduce(function(s,a){return s+(a.price-a.cost);},0)/addons.length;

  var kpiHtml='<div class="kpi-grid" style="margin-bottom:22px">'
    +'<div class="kpi" style="--kc:var(--gn)"><div class="kpi-lbl">Total Add-on Revenue</div><div class="kpi-val">'+fr(totalRev).replace('Rp ','')+'</div><div class="kpi-sub">Bulan ini</div></div>'
    +'<div class="kpi" style="--kc:var(--or)"><div class="kpi-lbl">Est. Add-on Profit</div><div class="kpi-val">'+fr(totalProfit).replace('Rp ','')+'</div><div class="kpi-sub">Avg margin 74%</div></div>'
    +'<div class="kpi" style="--kc:var(--bl)"><div class="kpi-lbl">Total Add-on Items</div><div class="kpi-val">'+addons.length+'</div><div class="kpi-sub">Di '+[...new Set(addons.map(function(a){return a.parent;}))].length+' menu utama</div></div>'
    +'<div class="kpi" style="--kc:var(--pu)"><div class="kpi-lbl">Top Add-on</div><div class="kpi-val" style="font-size:16px;letter-spacing:-.01em">Extra Sambal</div><div class="kpi-sub">741 terpilih</div></div>'
    +'</div>';

  /* Attach rate */
  var attachData=[
    {parent:'Ayam Bakar Madu',orders:1892,withAddon:1241,rate:66},
    {parent:'French Fries',   orders:741, withAddon:601, rate:81},
    {parent:'Sate Ayam 10pcs',orders:628, withAddon:374, rate:60},
    {parent:'Kopi Susu Aren', orders:1231,withAddon:601, rate:49},
    {parent:'Es Krim Cokelat',orders:524, withAddon:329, rate:63},
  ];
  var attachHtml='<div class="card" style="margin-bottom:18px"><div class="card-h"><div class="card-t">Attach Rate per Menu Utama</div><div class="card-sub">% order yang memilih add-on</div></div><div class="card-b" style="display:flex;flex-direction:column;gap:10px">';
  attachData.forEach(function(p){
    var bc=p.rate>=70?'var(--gn)':p.rate>=50?'var(--or)':'var(--rd)';
    attachHtml+='<div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;font-weight:600">'+p.parent+'</span><div style="display:flex;align-items:center;gap:8px"><span style="font-size:11.5px;color:var(--txt3)">'+p.withAddon+' dari '+p.orders+'</span><span style="font-size:13px;font-weight:800;color:'+bc+';min-width:36px;text-align:right">'+p.rate+'%</span></div></div><div style="height:7px;background:var(--sf3);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+p.rate+'%;background:'+bc+';border-radius:4px"></div></div></div>';
  });
  attachHtml+='</div></div>';

  /* Table */
  var rows='';
  var sorted=[].concat(addons).sort(function(a,b){return b.qty-a.qty;});
  sorted.forEach(function(a){
    var margin=a.price-a.cost;
    var mpct=Math.round(margin/a.price*100);
    var rev=a.price*a.qty;
    var pop=a.qty>=avgQty?'high':'low';
    var profit=margin>=avgMargin?'high':'low';
    var cls=getMEClass(pop,profit);
    rows+='<tr>'
      +'<td class="bold">'+a.n+'</td>'
      +'<td><span class="badge badge-gray">'+a.grp+'</span></td>'
      +'<td style="font-size:11.5px;color:var(--txt3)">'+a.parent+'</td>'
      +'<td class="mono">'+fr(a.price)+'</td>'
      +'<td class="mono">'+fr(a.cost)+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:6px"><div style="width:40px;height:5px;background:var(--sf3);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+mpct+'%;background:'+getMEColor(cls)+';border-radius:3px"></div></div><span class="mono bold">'+mpct+'%</span></div></td>'
      +'<td>'+a.qty.toLocaleString('id-ID')+'</td>'
      +'<td class="mono bold">'+fr(rev)+'</td>'
      +'<td><span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;background:'+getMEBg(cls)+';color:'+getMEColor(cls)+'">'+getMELabel(cls)+'</span></td>'
      +'</tr>';
  });

  return kpiHtml+attachHtml
    +'<div class="card"><div class="card-h"><div class="card-t">Analisis Add-on per Item</div></div>'
    +'<div class="tbl-wrap"><table><thead><tr><th>Add-on</th><th>Group</th><th>Menu Utama</th><th>Harga</th><th>Est. COGS</th><th>Margin %</th><th>Qty</th><th>Revenue</th><th>Klasifikasi</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div></div>';
}
