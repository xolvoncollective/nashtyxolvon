let meData = null;
let currentMEFilter = 'Bulan Ini';
let currentMETab = 'items';

async function loadMEData(filter) {
  currentMEFilter = filter;
  const range = getDateRange(filter); // Use same helper from business.js
  
  try {
    const res = await API.reports.getMenuEngineering(range);
    meData = res.data || { products: [], averages: { avgQty: 0, avgProfitMargin: 0 }, summary: { stars: 0, plowhorses: 0, puzzles: 0, dogs: 0 } };
  } catch (e) {
    console.error('ME error:', e);
    meData = { products: [], averages: { avgQty: 0, avgProfitMargin: 0 }, summary: { stars: 0, plowhorses: 0, puzzles: 0, dogs: 0 } };
  }
  
  renderMETab(currentMETab);
}

window.changeMEFilter = function(filter, btn) {
  document.querySelectorAll('.me-filters button').forEach(b => {
    b.style.background = 'transparent';
    b.style.color = 'var(--txt3)';
  });
  btn.style.background = 'var(--or)';
  btn.style.color = '#fff';
  toast('Memuat data ' + filter + '...');
  loadMEData(filter);
};

PAGES['menu-engineering'] = async () => {
  await loadMEData(currentMEFilter);
  setTimeout(() => renderMETab(currentMETab), 0);

  const filters = ['Hari Ini','Minggu Ini','Bulan Ini'];
  const filterBtns = filters.map(f => 
    `<button style="padding:6px 14px;font-size:12px;font-weight:600;border:none;background:${f === currentMEFilter ? 'var(--or)' : 'transparent'};color:${f === currentMEFilter ? '#fff' : 'var(--txt3)'};cursor:pointer;font-family:var(--fn)" onclick="changeMEFilter('${f}', this)">${f}</button>`
  ).join('');

  return `
<div class="ph">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div><div class="ph-title">Menu Engineering Analytics</div><div class="ph-sub">Stars · Plowhorses · Puzzles · Dogs — analisis profitabilitas vs popularitas</div></div>
    <div style="display:flex;gap:8px">
      <div class="me-filters" style="display:flex;overflow:hidden;border-radius:8px;border:1px solid var(--brd2)">
        ${filterBtns}
      </div>
      <button class="btn" onclick="toast('Fitur export belum tersedia')">${ico('exp')} Export</button>
    </div>
  </div>
</div>
<div class="stabs" id="me-stabs">
  <div class="stab act" onclick="switchMETab('items',this)">Item Analysis</div>
  <div class="stab" onclick="switchMETab('categories',this)">Category Analysis</div>
</div>
<div id="me-body"></div>`;
};

window.switchMETab = function(tab, el) {
  currentMETab = tab;
  document.querySelectorAll('#me-stabs .stab').forEach(t => t.classList.remove('act'));
  if (el) el.classList.add('act');
  renderMETab(tab);
};

function renderMETab(tab) {
  var el = document.getElementById('me-body');
  if (!el) return;
  var tabs = { items: renderMEItems, categories: renderMECategories };
  el.innerHTML = (tabs[tab] || renderMEItems)();
}

function getMELabel(cls){return {star:'Star',plowhorse:'Plowhorse',puzzle:'Puzzle',dog:'Dog'}[cls]||cls;}
function getMEColor(cls){return {star:'#22C55E',plowhorse:'#3B82F6',puzzle:'#F59E0B',dog:'#EF4444'}[cls]||'#888';}
function getMEBg(cls){return {star:'rgba(34,197,94,.1)',plowhorse:'rgba(59,130,246,.1)',puzzle:'rgba(245,158,11,.1)',dog:'rgba(239,68,68,.1)'}[cls]||'var(--sf2)';}
function getMEDesc(cls){
  var d={star:'Pertahankan & promosikan — ini andalan menu Anda',plowhorse:'Naikkan harga atau kurangi porsi — populer tapi margin tipis',puzzle:'Tingkatkan pemasaran — untung besar tapi kurang dipesan',dog:'Pertimbangkan untuk dihapus atau direvisi'};
  return d[cls]||'';
}

function makeDot(name,label,margin,qty,x,y,size,color){
  return '<div style="position:absolute;left:'+x+'%;top:'+y+'%;transform:translate(-50%,-50%);width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+color+';opacity:.82;cursor:pointer;border:2px solid rgba(255,255,255,.7)" title="'+name+' | '+label+' | Margin: '+fr(margin)+' | Qty: '+qty+'"></div>';
}

function filterMEItemTable(v){
  document.querySelectorAll('#me-tbl tbody tr').forEach(function(tr){
    if(!v){tr.style.display='';return;}
    var c=tr.querySelector('td:nth-child(8)');
    tr.style.display=(c&&c.textContent.trim().toLowerCase().includes(v.toLowerCase()))?'':'none';
  });
}

function renderMEItems(){
  if (!meData || !meData.products) return '<div>Memuat data...</div>';
  var items = meData.products;
  var counts = meData.summary || { stars:0, plowhorses:0, puzzles:0, dogs:0 };

  var kpiHtml='<div class="kpi-grid" style="margin-bottom:22px">';
  [['Stars','Profit tinggi & populer',counts.stars,'star'],['Plowhorses','Populer, margin rendah',counts.plowhorses,'plowhorse'],['Puzzles','Margin baik, kurang populer',counts.puzzles,'puzzle'],['Dogs','Perlu evaluasi',counts.dogs,'dog']].forEach(function(k){
    kpiHtml+='<div class="kpi" style="--kc:'+getMEColor(k[3])+'"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><div class="kpi-lbl">'+k[0]+'</div><span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:5px;background:'+getMEBg(k[3])+';color:'+getMEColor(k[3])+'">'+k[0]+'</span></div><div class="kpi-val" style="color:'+getMEColor(k[3])+'">'+k[2]+'</div><div class="kpi-sub">'+k[1]+'</div></div>';
  });
  kpiHtml+='</div>';

  var legendHtml='<div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap">';
  [{c:'star',l:'Star',d:'Tinggi × Tinggi'},{c:'plowhorse',l:'Plowhorse',d:'Tinggi × Rendah'},{c:'puzzle',l:'Puzzle',d:'Rendah × Tinggi'},{c:'dog',l:'Dog',d:'Rendah × Rendah'}].forEach(function(leg){
    legendHtml+='<div style="display:flex;align-items:center;gap:7px;padding:6px 12px;background:'+getMEBg(leg.c)+';border:1px solid '+getMEColor(leg.c)+'44;border-radius:8px"><span style="width:8px;height:8px;border-radius:50%;background:'+getMEColor(leg.c)+';display:inline-block;flex-shrink:0"></span><span style="font-size:12px;font-weight:700;color:'+getMEColor(leg.c)+'">'+leg.l+'</span><span style="font-size:11px;color:var(--txt3)">'+leg.d+'</span></div>';
  });
  legendHtml+='</div>';

  /* Quadrant matrix */
  var matrixHtml='<div class="card" style="margin-bottom:18px"><div class="card-h"><div class="card-t">Matrix Quadrant</div><div class="card-sub">Popularitas Qty (horizontal) vs Kontribusi Margin (vertikal)</div></div><div class="card-b"><div style="position:relative;height:260px;background:var(--sf2);border-radius:10px;overflow:hidden;border:1px solid var(--brd)">';
  matrixHtml+='<div style="position:absolute;top:8px;left:8px;font-size:9px;font-weight:700;color:rgba(245,158,11,.7);padding:2px 7px;background:rgba(245,158,11,.08);border-radius:4px">PUZZLE</div>';
  matrixHtml+='<div style="position:absolute;top:8px;right:8px;font-size:9px;font-weight:700;color:rgba(34,197,94,.8);padding:2px 7px;background:rgba(34,197,94,.08);border-radius:4px">STAR</div>';
  matrixHtml+='<div style="position:absolute;bottom:8px;left:8px;font-size:9px;font-weight:700;color:rgba(239,68,68,.7);padding:2px 7px;background:rgba(239,68,68,.08);border-radius:4px">DOG</div>';
  matrixHtml+='<div style="position:absolute;bottom:8px;right:8px;font-size:9px;font-weight:700;color:rgba(59,130,246,.7);padding:2px 7px;background:rgba(59,130,246,.08);border-radius:4px">PLOWHORSE</div>';
  matrixHtml+='<div style="position:absolute;top:0;left:50%;bottom:0;width:1px;background:var(--brd2)"></div>';
  matrixHtml+='<div style="position:absolute;left:0;top:50%;right:0;height:1px;background:var(--brd2)"></div>';

  var maxQty=Math.max(...items.map(i => i.total_qty || 0), 1);
  var maxMargin=Math.max(...items.map(i => i.profit_margin || 0), 1);
  
  items.forEach(function(it){
    var cls=it.classification;
    var margin=it.profit_margin || 0;
    var xBase=(cls==='star'||cls==='plowhorse')?65:25;
    var xJitter=Math.round(((it.total_qty||0)/maxQty)*18);
    var yBase=(cls==='star'||cls==='puzzle')?22:65;
    var yJitter=Math.round((margin/maxMargin)*12);
    var xPct=Math.min(92,Math.max(8,xBase+xJitter));
    var yPct=Math.min(88,Math.max(8,yBase-yJitter));
    var size=Math.max(8,Math.min(22,Math.round((it.total_qty||0)/maxQty*20) + 8));
    matrixHtml+=makeDot(it.product_name,getMELabel(cls),margin,it.total_qty,xPct,yPct,size,getMEColor(cls));
  });
  matrixHtml+='</div>';
  matrixHtml+='<div style="display:flex;gap:5px;margin-top:10px;flex-wrap:wrap">';
  items.forEach(function(it){var cls=it.classification;matrixHtml+='<span style="font-size:9.5px;padding:2px 7px;border-radius:9px;background:'+getMEBg(cls)+';color:'+getMEColor(cls)+';font-weight:600">'+it.product_name+'</span>';});
  matrixHtml+='</div></div></div>';

  /* Table */
  var sorted=[...items].sort(function(a,b){var o={star:0,plowhorse:1,puzzle:2,dog:3};return o[a.classification]-o[b.classification]||(b.total_qty||0)-(a.total_qty||0);});
  var rows= sorted.length === 0 ? '<tr><td colspan="9" style="text-align:center">Belum ada data</td></tr>' : '';
  sorted.forEach(function(it){
    var cls=it.classification;
    var margin=it.profit_margin || 0;
    var p = it.avg_price || 0;
    var mpct= p > 0 ? Math.round(margin/p*100) : 0;
    rows+='<tr>'
      +'<td class="bold">'+it.product_name+'</td>'
      +'<td><span class="badge badge-gray">'+(it.category_name||'Uncategorized')+'</span></td>'
      +'<td class="mono">'+fr(Math.round(p))+'</td>'
      +'<td class="mono">'+fr(Math.round(it.unit_cost||0))+'</td>'
      +'<td class="mono bold" style="color:'+getMEColor(cls)+'">'+fr(Math.round(margin))+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:6px"><div style="width:40px;height:5px;background:var(--sf3);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+mpct+'%;background:'+getMEColor(cls)+';border-radius:3px"></div></div><span style="font-size:11px;font-weight:700">'+mpct+'%</span></div></td>'
      +'<td>'+(it.total_qty||0).toLocaleString('id-ID')+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:'+getMEColor(cls)+';display:inline-block;flex-shrink:0"></span><span style="font-size:11px;font-weight:700;color:'+getMEColor(cls)+'">'+getMELabel(cls)+'</span></div></td>'
      +'<td><div style="font-size:11px;color:var(--txt3);max-width:160px;line-height:1.35">'+getMEDesc(cls)+'</div></td>'
      +'</tr>';
  });

  return kpiHtml+legendHtml+matrixHtml
    +'<div class="card"><div class="card-h"><div class="card-t">Detail Analisis per Item</div>'
    +'<select class="filter-select" onchange="filterMEItemTable(this.value)"><option value="">Semua</option><option value="Star">Star</option><option value="Plowhorse">Plowhorse</option><option value="Puzzle">Puzzle</option><option value="Dog">Dog</option></select>'
    +'</div><div class="tbl-wrap"><table id="me-tbl"><thead><tr><th>Item</th><th>Kategori</th><th>Harga Jual</th><th>Est. COGS</th><th>Kontribusi</th><th>Margin %</th><th>Qty</th><th>Klasifikasi</th><th>Rekomendasi</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}

function renderMECategories(){
  if (!meData || !meData.products) return '<div>Memuat data...</div>';
  var items = meData.products;
  
  // Aggregate by category
  let catMap = {};
  items.forEach(it => {
    let c = it.category_name || 'Uncategorized';
    if (!catMap[c]) catMap[c] = { name: c, qty: 0, revenue: 0, profit: 0, items: 0, margins: [] };
    catMap[c].qty += (it.total_qty || 0);
    catMap[c].revenue += (it.total_revenue || 0);
    catMap[c].profit += (it.total_profit || 0);
    catMap[c].items += 1;
    if (it.avg_price > 0) catMap[c].margins.push((it.profit_margin||0)/it.avg_price*100);
  });
  
  var cats = Object.values(catMap).map(c => {
    c.avgMargin = c.margins.length ? Math.round(c.margins.reduce((a,b)=>a+b,0)/c.margins.length) : 0;
    c.color = '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'); // Random colors for categories
    return c;
  }).sort((a,b) => b.revenue - a.revenue);

  var totalProfit = cats.reduce((s,c) => s + c.profit, 0);

  var cards='<div class="three-col" style="margin-bottom:18px">';
  cats.forEach(function(c){
    cards+='<div class="card">'
      +'<div class="card-h"><div style="display:flex;align-items:center;gap:9px"><div style="width:9px;height:9px;border-radius:50%;background:'+c.color+'"></div><div class="card-t">'+c.name+'</div></div></div>'
      +'<div class="card-b" style="display:flex;flex-direction:column;gap:9px">'
      +'<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--txt3)">Revenue</span><span style="font-size:12px;font-weight:700;font-family:var(--mo)">'+fr(c.revenue)+'</span></div>'
      +'<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--txt3)">Est. Profit</span><span style="font-size:12px;font-weight:700;font-family:var(--mo);color:var(--gn)">'+fr(c.profit)+'</span></div>'
      +'<div><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:12px;color:var(--txt3)">Avg Margin</span><span style="font-size:12px;font-weight:700">'+c.avgMargin+'%</span></div><div style="height:6px;background:var(--sf3);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+c.avgMargin+'%;background:'+c.color+';border-radius:3px"></div></div></div>'
      +'<div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--txt3)">Items Terjual</span><span style="font-size:12px;font-weight:600">'+c.items+' items</span></div>'
      +'</div></div>';
  });
  cards+='</div>';

  var chartHtml='<div class="card"><div class="card-h"><div class="card-t">Distribusi Profit per Kategori</div></div><div class="card-b">';
  chartHtml+='<div style="display:flex;height:28px;border-radius:8px;overflow:hidden;margin-bottom:12px">';
  cats.forEach(function(c){var pct= totalProfit > 0 ? Math.round(c.profit/totalProfit*100) : 0; if(pct>0) chartHtml+='<div style="width:'+pct+'%;background:'+c.color+';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff" title="'+c.name+': '+pct+'%">'+pct+'%</div>';});
  chartHtml+='</div><div style="display:flex;gap:14px;flex-wrap:wrap">';
  cats.forEach(function(c){chartHtml+='<div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:2px;background:'+c.color+';display:inline-block"></span><span style="font-size:12px;font-weight:600">'+c.name+'</span><span style="font-size:11px;color:var(--txt3)">'+fr(c.profit)+'</span></div>';});
  chartHtml+='</div></div></div>';

  return cards+chartHtml;
}
