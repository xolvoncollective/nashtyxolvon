// ═══════════════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════════════
function tick(){
  const n = new Date();
  document.getElementById('kds-clock').textContent =
    pad(n.getHours())+':'+pad(n.getMinutes())+':'+pad(n.getSeconds());
}

// ═══════════════════════════════════════════════════════
// LIVE TIMER UPDATE (every second)
// ═══════════════════════════════════════════════════════
function updateTimers(){
  ORDERS.forEach(o=>{
    if(o.status!=='active') return;
    const sec = getElapsed(o.startTs);
    const urg = urgClass(sec);

    const timerEl = document.getElementById('timer-'+o.id);
    if(timerEl){
      timerEl.textContent = fmtTimer(sec);
      timerEl.className = 'oc-timer ' + urg;
    }

    const card = document.getElementById('ocard-'+o.id);
    if(card){
      const wasWarn   = card.classList.contains('warn');
      const wasUrgent = card.classList.contains('urgent');
      if((urg==='warn'&&!wasWarn)||(urg==='urgent'&&!wasUrgent)){
        card.classList.remove('fresh','warn','urgent');
        card.classList.add(urg);
        if(urg==='urgent' && CFG.soundEnabled) playSound('urgent');
      }
    }
  });

  // Update queue summary counts
  const active = ORDERS.filter(o=>o.status==='active');
  const totalItems = active.reduce((s,o)=>s+o.items.reduce((si,i)=>si+i.qty,0),0);
  const urgCount   = active.filter(o=>urgClass(getElapsed(o.startTs))==='urgent').length;
  const el_o = document.getElementById('qs-orders-n');
  const el_i = document.getElementById('qs-items-n');
  const el_u = document.getElementById('qs-urgent-n');
  if(el_o) el_o.textContent = active.length;
  if(el_i) el_i.textContent = totalItems;
  if(el_u) el_u.textContent = urgCount;

  // Update urgent strip
  const strip = document.getElementById('urgent-strip');
  const ustOrders = document.getElementById('ust-orders');
  if(CFG.stickyUrgent && urgCount > 0){
    strip.classList.add('visible');
    const urgList = active.filter(o=>urgClass(getElapsed(o.startTs))==='urgent');
    const expected = urgList.map(o=>o.no).join(',');
    if(ustOrders.dataset.last !== expected){
      ustOrders.dataset.last = expected;
      ustOrders.innerHTML = urgList.map(o=>
        `<div class="ust-no" onclick="scrollToCard(${o.id})">${o.no}</div>`
      ).join('');
    }
  } else {
    strip.classList.remove('visible');
  }

  const fltU = document.getElementById('flt-urgent');
  if(fltU) fltU.textContent = urgCount>0?`⚠ Urgent (${urgCount})`:'⚠ Urgent';
}

setInterval(tick, 1000); 
setInterval(updateTimers, 1000);
