// ═══════════════════════════════════════════════════════
// FILTER + SORT
// ═══════════════════════════════════════════════════════
function setFilter(f, el){
  curFilter = f;
  document.querySelectorAll('.flt').forEach(b=>b.classList.remove('act'));
  el.classList.add('act');
  render();
}

function getFiltered(){
  let list = ORDERS.filter(o=>o.status==='active');
  if(curFilter==='dine')     list=list.filter(o=>o.type==='dine');
  else if(curFilter==='take')list=list.filter(o=>o.type==='take');
  else if(curFilter==='delivery') list=list.filter(o=>['gofood','grabfood','shopee'].includes(o.type));
  else if(curFilter==='urgent')   list=list.filter(o=>urgClass(getElapsed(o.startTs))==='urgent');

  // Auto-sort: Urgent → Warning → Fresh, then oldest first within each
  if(CFG.autoSort){
    const urgOrder = {urgent:0, warn:1, fresh:2};
    list.sort((a,b)=>{
      const ua = urgOrder[urgClass(getElapsed(a.startTs))];
      const ub = urgOrder[urgClass(getElapsed(b.startTs))];
      return ua !== ub ? ua-ub : a.startTs-b.startTs;
    });
  }
  return list;
}

// ═══════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════
function render(){
  const grid  = document.getElementById('kds-grid');
  const list  = getFiltered();
  const active= ORDERS.filter(o=>o.status==='active');

  // Queue summary
  const totalItems = active.reduce((s,o)=>s+o.items.reduce((si,i)=>si+i.qty,0),0);
  const urgCount   = active.filter(o=>urgClass(getElapsed(o.startTs))==='urgent').length;
  document.getElementById('qs-orders-n').textContent = active.length;
  document.getElementById('qs-items-n').textContent  = totalItems;
  document.getElementById('qs-urgent-n').textContent = urgCount;

  // Urgent strip
  const strip = document.getElementById('urgent-strip');
  const ustOrders = document.getElementById('ust-orders');
  if(CFG.stickyUrgent && urgCount > 0){
    strip.classList.add('visible');
    const urgList = active.filter(o=>urgClass(getElapsed(o.startTs))==='urgent');
    ustOrders.innerHTML = urgList.map(o=>
      `<div class="ust-no" onclick="scrollToCard(${o.id})">${o.no}</div>`
    ).join('');
  } else {
    strip.classList.remove('visible');
  }

  // Urgent filter badge
  const fltUrgent = document.getElementById('flt-urgent');
  fltUrgent.textContent = urgCount > 0 ? `⚠ Urgent (${urgCount})` : '⚠ Urgent';

  // Compact mode
  if(list.length >= CFG.compactThreshold) grid.classList.add('compact');
  else grid.classList.remove('compact');

  // Preserve scroll
  const scrollY = grid.scrollTop;

  if(list.length === 0){
    grid.innerHTML = `<div class="kds-empty">
      <div class="kds-empty-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
      </div>
      <div class="kds-empty-t">Tidak ada pesanan aktif</div>
      <div class="kds-empty-s">Pesanan baru akan muncul di sini secara otomatis</div>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(o => buildCard(o)).join('');
  grid.scrollTop = scrollY;

  // Re-attach swipe handlers
  list.forEach(o => attachSwipe(o.id));
}

// ═══════════════════════════════════════════════════════
// BUILD CARD
// ═══════════════════════════════════════════════════════
function buildCard(o){
  const sec     = getElapsed(o.startTs);
  const urg     = urgClass(sec);
  const isDone  = o.status === 'done';
  const typeCss = TYPE_CSS[o.type] || 'dine';
  const typeLabel = TYPE_LABEL[o.type] || o.type;

  const urgBadge = {
    fresh:  `<span class="oc-urgency urg-ok">On time</span>`,
    warn:   `<span class="oc-urgency urg-warn">&gt;${CFG.warnMin} mnt</span>`,
    urgent: `<span class="oc-urgency urg-urg">&gt;${CFG.urgentMin} mnt</span>`,
  }[urg];

  // Items HTML
  let itemsHtml = o.items.map(it=>{
    const modsHtml = it.mods.map(m=>`<span class="oc-mod">${m}</span>`).join('');
    const addonsHtml = it.addons.map(a=>`<span class="oc-mod addon">${a}</span>`).join('');
    const noteHtml = it.note
      ? `<div class="oc-note"><span class="oc-note-ico">⚠</span><span class="oc-note-txt">${it.note}</span></div>`
      : '';
    return `<div class="oc-item">
      <div class="oc-qty">${it.qty}</div>
      <div class="oc-item-info">
        <div class="oc-item-name">${it.n}</div>
        ${(modsHtml||addonsHtml) ? `<div class="oc-mods">${modsHtml}${addonsHtml}</div>` : ''}
        ${noteHtml}
      </div>
    </div>`;
  }).join('');

  // Swipe button
  const swipeHtml = `<div class="swipe-wrap">
    <div class="oc-cashier">Kasir: ${o.cashier}</div>
    <div class="swipe-track" id="swipe-${o.id}">
      <div class="swipe-fill" id="swipefill-${o.id}"></div>
      <div class="swipe-thumb" id="swipethumb-${o.id}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
  </div>`;

  const cardClass = ['ocard', isDone?'done':urg].filter(Boolean).join(' ');

  return `<div class="${cardClass}" id="ocard-${o.id}">
    <div class="oc-head">
      <div class="oc-head-left">
        <div class="oc-no">${o.no}</div>
        <div class="oc-meta">
          <span class="oc-table">${o.table}</span>
          <span class="oc-type type-${typeCss}">${typeLabel}</span>
        </div>
      </div>
      <div class="oc-head-right">
        <div class="oc-timer ${isDone?'fresh':urg}" id="timer-${o.id}">${fmtTimer(sec)}</div>
        <div class="oc-timer-lbl">menit:detik</div>
        ${urgBadge}
      </div>
    </div>
    <div class="oc-items">${itemsHtml}</div>
    ${swipeHtml}
  </div>`;
}
