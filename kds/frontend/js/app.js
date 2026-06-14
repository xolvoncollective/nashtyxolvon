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

  // Fetch config once
  if (!window._kdsConfigFetched && API.session.outletId) {
    try {
      const cfgData = await API.orders.getConfig(API.session.outletId);
      if (cfgData && cfgData.config) {
        CFG.warnMin = cfgData.config.kdsWarnThreshold || 10;
        CFG.urgentMin = cfgData.config.kdsUrgentThreshold || 20;
        window._kdsConfigFetched = true;
      }
    } catch(e) {
      console.error('KDS failed to fetch config', e);
    }
  }
  
  try {
    const data = await API.orders.getAll({ status: 'confirmed', kitchenStatus: 'pending' });
    if (data && data.orders) {
      const newOrders = data.orders.map(o => {
        return {
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
              note: it.notes || ''
            };
          })
        };
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
      
      ORDERS = newOrders;
      render();
      
      if (hasNew) {
        playSound('new');
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