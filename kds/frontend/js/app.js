// ═══════════════════════════════════════════════════════
// APP ENTRY POINT
// ═══════════════════════════════════════════════════════

let fetchInterval = null;

async function fetchOrders() {
  if (!window.API) return;
  
  // Try to use a default or mocked tenant if session isn't loaded (for dev/demo)
  if (!API.session.tenantId) {
    API.session.tenantId = 'demo-tenant';
    API.session.outletId = 'demo-outlet';
  }

  // Silent login if no token so KDS can bypass requireAuth
  if (!API.session.token) {
    try {
      await API.auth.login('1234', 'demo-outlet');
    } catch(e) {
      console.error('KDS Silent login failed', e);
    }
  }

  // Fetch config every cycle to sync real-time changes
  if (API.session.outletId) {
    try {
      const res = await API.settings.get();
      if (res && res.settings) {
        const s = res.settings;
        if (s.kds_alert_sound !== undefined) CFG.soundEnabled = s.kds_alert_sound;
        if (s.kds_alert_flash !== undefined) CFG.flashEnabled = s.kds_alert_flash;
        if (s.kds_alert_escalation !== undefined) CFG.escalationEnabled = s.kds_alert_escalation;
        if (s.kds_alert_interval !== undefined) CFG.escalationInterval = s.kds_alert_interval;
        if (s.kds_workflow !== undefined) CFG.workflow = typeof s.kds_workflow === 'string' ? JSON.parse(s.kds_workflow) : s.kds_workflow;
      }
    } catch(e) {
      console.error('KDS failed to fetch config', e);
    }
  }
  
  try {
    // Fetch active kitchen queue (all pending/preparing items)
    const data = await API.orders.getKDSQueue();
    if (data && data.orders) {
      const newOrders = data.orders.map(o => {
        const oData = {
          id: o.id,
          no: o.order_number || '#0000',
          table: o.table_number || (o.order_type === 'dine' ? 'T??' : o.order_type),
          type: o.order_type,
          cashier: o.cashier_name || 'System',
          startTs: new Date(o.created_at ? o.created_at.replace(' ', 'T') + (o.created_at.includes('Z') ? '' : 'Z') : Date.now()).getTime(),
          status: 'active',
          items: (o.items || []).map(it => {
            let mods = [];
            let addons = [];
            
            try {
              const parsedMods = typeof it.modifiers === 'string' ? JSON.parse(it.modifiers) : (it.modifiers || []);
              parsedMods.forEach(m => {
                if (m.priceAdjustment > 0) addons.push(`+${m.optionName}`);
                else mods.push(m.optionName);
              });
            } catch(e) {}
            
            return {
              n: it.name || it.product_name,
              qty: it.quantity,
              mods: mods,
              addons: addons,
              note: it.notes || '',
              pt: it.production_time || 10
            };
          })
        };
        // Calculate max production time for the order items
        oData.targetTime = oData.items.reduce((max, it) => Math.max(max, it.pt), 0);
        return oData;
      });
      
      // Merge logic: check if there are new orders to trigger sound
      const oldIds = new Set(ORDERS.map(x => x.id));
      let hasNew = false;
      for (const no of newOrders) {
        if (!oldIds.has(no.id)) {
          hasNew = true;
          // Trigger visual highlight later
          setTimeout(()=>{
            const card = document.getElementById('ocard-'+no.id);
            if(card) card.classList.add('new-highlight');
            setTimeout(()=>{
              if(card) card.classList.remove('new-highlight');
            }, CFG.highlightDuration + 50);
          }, 50);
        }
      }
      
      if (JSON.stringify(ORDERS) !== JSON.stringify(newOrders)) {
        ORDERS = newOrders;
        render();
      }
      
      if (hasNew) {
        playSound('new');
      } else if (CFG.escalationEnabled) {
        let hasEscalation = false;
        const now = Date.now();
        if (!window._lastEscalation || (now - window._lastEscalation > 60000)) {
          for (const no of newOrders) {
            if (no.status !== 'active') continue;
            const sec = Math.floor((now - no.startTs) / 1000);
            const targetSec = (no.targetTime || CFG.urgentMin) * 60;
            if (sec >= targetSec) {
              const minsOverdue = Math.floor((sec - targetSec) / 60);
              if (minsOverdue > 0 && minsOverdue % (CFG.escalationInterval || 1) === 0) {
                hasEscalation = true;
                break;
              }
            }
          }
        }
        if (hasEscalation) {
          playSound('escalation');
          window._lastEscalation = now;
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch KDS orders:', err);
  }
}

// INIT
fetchOrders();
fetchInterval = setInterval(fetchOrders, 5000);
render();