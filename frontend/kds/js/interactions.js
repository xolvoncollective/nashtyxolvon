// ═══════════════════════════════════════════════════════
// SWIPE TO COMPLETE
// ═══════════════════════════════════════════════════════
function attachSwipe(orderId){
  const track = document.getElementById(`swipe-${orderId}`);
  const thumb = document.getElementById(`swipethumb-${orderId}`);
  const fill  = document.getElementById(`swipefill-${orderId}`);
  if(!track || !thumb) return;

  const order = ORDERS.find(o=>o.id===orderId);
  if(!order || order.status==='done') return;

  let dragging = false, startX = 0, curX = 0;
  const trackW = 160;
  const thumbW = 30;
  const maxLeft = trackW - thumbW - 6;

  function startDrag(x){
    dragging = true;
    startX = x;
    curX = parseInt(thumb.style.left||'3');
    track.classList.add('swiping');
    thumb.style.transition = 'none';
    fill.style.transition   = 'none';
  }
  function moveDrag(x){
    if(!dragging) return;
    const dx   = x - startX;
    const newL = Math.max(3, Math.min(maxLeft, curX + dx));
    thumb.style.left = newL + 'px';
    const pct = (newL - 3) / (maxLeft - 3);
    fill.style.width = (newL + thumbW) + 'px';
    if(pct >= 1) endDrag(true);
  }
  function endDrag(complete){
    if(!dragging) return;
    dragging = false;
    track.classList.remove('swiping');
    thumb.style.transition = '';
    fill.style.transition  = '';
    if(complete){
      thumb.style.left  = maxLeft + 'px';
      fill.style.width  = '100%';
      markDone(orderId);
    } else {
      thumb.style.left = '3px';
      fill.style.width = '0';
    }
  }

  // Touch
  track.addEventListener('touchstart', e=>{ startDrag(e.touches[0].clientX); e.preventDefault(); }, {passive:false});
  track.addEventListener('touchmove',  e=>{ moveDrag(e.touches[0].clientX); e.preventDefault(); },  {passive:false});
  track.addEventListener('touchend',   ()=>{ endDrag(false); });

  // Mouse
  track.addEventListener('mousedown',  e=>startDrag(e.clientX));
  document.addEventListener('mousemove', e=>{ if(dragging) moveDrag(e.clientX); });
  document.addEventListener('mouseup',   e=>{ if(dragging) endDrag(false); });

  // Click shortcut (for demo)
  track.addEventListener('click', ()=>{
    if(CFG.swipeEnabled) return; // swipe only
    markDone(orderId);
  });
}

// ═══════════════════════════════════════════════════════
// MARK DONE → Show POS notification (cannot close until confirmed)
// ═══════════════════════════════════════════════════════
function markDone(orderId){
  const o = ORDERS.find(x=>x.id===orderId);
  if(!o || o.status!=='active') return;
  o.status = 'done';
  pendingDoneId = orderId;
  showPosNotify(o);
  render();
}

function showPosNotify(o){
  document.getElementById('pn-order-no').textContent = o.no;
  document.getElementById('pn-sub').textContent = `${o.table} · ${TYPE_LABEL[o.type]||o.type} · Kasir: ${o.cashier}`;
  
  let itemsText = '';
  o.items.forEach(it=>{
    itemsText += `${it.qty}× ${it.n}`;
    const allMods = [...it.mods, ...it.addons];
    if(allMods.length) itemsText += ' (' + allMods.join(', ') + ')';
    if(it.note) itemsText += '\n   ⚠ ' + it.note;
    itemsText += '\n';
  });
  document.getElementById('pn-items').textContent = itemsText.trim();

  const overlay = document.getElementById('pos-notify');
  overlay.classList.add('visible');

  document.getElementById('pn-confirm-btn').onclick = confirmDone;

  // Prevent closing by clicking outside
  overlay.onclick = (e)=>{ if(e.target===overlay){ /* blocked */ } };
}

function confirmDone(){
  if(pendingDoneId === null) return;
  const o = ORDERS.find(x=>x.id===pendingDoneId);
  if(o) o.status = 'confirmed';
  pendingDoneId = null;
  document.getElementById('pos-notify').classList.remove('visible');
  render();
}

// ═══════════════════════════════════════════════════════
// ADD DEMO ORDER
// ═══════════════════════════════════════════════════════
const DEMO_ORDERS = [
  {table:'T05', type:'dine', cashier:'Ani',   items:[{n:'Pecel Lele',qty:1,mods:[],addons:[],note:''},{n:'Es Teh Manis',qty:1,mods:['Normal'],addons:[],note:''}]},
  {table:'GrabFood',type:'grabfood',cashier:'Budi',items:[{n:'Ayam Bakar Madu',qty:2,mods:['Original'],addons:['+Extra Sambal'],note:''},{n:'Nasi Putih',qty:2,mods:[],addons:[],note:''}]},
  {table:'T11', type:'dine', cashier:'Citra', items:[{n:'Kopi Susu Aren',qty:3,mods:['Dingin'],addons:['+Extra Shot'],note:'Semua jangan terlalu manis'},{n:'French Fries',qty:1,mods:['Tomat','Mayo'],addons:[],note:''}]},
  {table:'T09', type:'dine', cashier:'Budi',  items:[{n:'Sop Buntut',qty:1,mods:[],addons:['+Extra Kuah'],note:'Kuahnya banyakin'},{n:'Rawon Spesial',qty:1,mods:[],addons:[],note:''}]},
  {table:'ShopeeFood',type:'shopee',cashier:'Ani',items:[{n:'Ayam Geprek',qty:3,mods:['Level 2'],addons:[],note:'Minta nasi pisah'},{n:'Lemon Tea',qty:3,mods:[],addons:[],note:''}]},
];

function addDemoOrder(){
  const d = DEMO_ORDERS[demoCounter % DEMO_ORDERS.length];
  const id = ++demoCounter + 100;
  const no = '#' + String(188 + demoCounter).padStart(4,'0');
  const order = {
    id, no,
    table:   d.table,
    type:    d.type,
    cashier: d.cashier,
    startTs: Date.now(),
    status: 'active',
    items:   d.items,
  };
  ORDERS.unshift(order);
  render();
  playSound('new');

  // Highlight new card for 3.5s
  setTimeout(()=>{
    const card = document.getElementById('ocard-'+id);
    if(card) card.classList.add('new-highlight');
  }, 50);
  setTimeout(()=>{
    const card = document.getElementById('ocard-'+id);
    if(card) card.classList.remove('new-highlight');
  }, CFG.highlightDuration + 50);
}

// ═══════════════════════════════════════════════════════
// DAY/DARK MODE
// ═══════════════════════════════════════════════════════
function toggleMode(){
  isDayMode = !isDayMode;
  document.body.classList.toggle('day', isDayMode);
  const btn = document.getElementById('mode-btn');
  if(isDayMode){
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Dark`;
    btn.classList.add('act');
  } else {
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> Day`;
    btn.classList.remove('act');
  }
}
