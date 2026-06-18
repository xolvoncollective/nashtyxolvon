    /* ════════════════════════
       LOGIN
    ════════════════════════ */
    async function initLogin() {
      // DEV OVERRIDE: Skip login entirely
      // Use setTimeout to allow history.js to be parsed before calling loadHist()
      setTimeout(() => {
        doLogin({ id: 'admin', name: 'Admin Demo', role: 'admin', tenantId: 'demo-tenant', outletId: 'demo-outlet' });
      }, 50);
    }
    function selectStaff(s) {
      loginSel = s; loginPinArr = [];
      document.querySelectorAll('.staff-btn').forEach(b => b.classList.remove('selected'));
      document.getElementById('sbtn-' + s.id).classList.add('selected');
      // show pin step
      document.getElementById('step-staff').style.display = 'none';
      const pinStep = document.getElementById('step-pin');
      pinStep.classList.add('show');
      pinStep.querySelector('strong').textContent = s.name;
      document.getElementById('login-err').textContent = '';
      for (let i = 0; i < 4; i++) { const d = document.getElementById('ld' + i); if (d) { d.classList.remove('on'); } }
    }
    function backToStaff() {
      loginSel = null; loginPinArr = [];
      document.getElementById('step-staff').style.display = 'block';
      document.getElementById('step-pin').classList.remove('show');
      document.querySelectorAll('.staff-btn').forEach(b => b.classList.remove('selected'));
    }
    async function loginPin(k) {
      if (!loginSel) return;
      if (k === 'DEL') loginPinArr.pop();
      else if (loginPinArr.length < 4) loginPinArr.push(k);
      for (let i = 0; i < 4; i++) { const d = document.getElementById('ld' + i); if (d) d.classList.toggle('on', i < loginPinArr.length); }
      if (loginPinArr.length === 4) {
        try {
          const res = await API.auth.login(loginPinArr.join(''), 'demo-outlet');
          if (res.success && res.user && res.user.id === loginSel.id) {
            doLogin(res.user);
          } else {
            showPinError();
          }
        } catch (err) {
          showPinError();
        }
      }
    }

    function showPinError() {
      document.getElementById('login-err').textContent = 'PIN salah, coba lagi';
      loginPinArr = [];
      setTimeout(() => {
        for (let i = 0; i < 4; i++) { const d = document.getElementById('ld' + i); if (d) d.classList.remove('on'); }
        document.getElementById('login-err').textContent = '';
      }, 900);
    }
    async function doLogin(staff) {
      currentUser = staff;
      if (typeof API !== 'undefined' && API.session) {
        API.session.user = staff;
        API.session.outletId = staff.outletId || 'demo-outlet';
        API.session.tenantId = staff.tenantId || 'demo-tenant';
      }
      document.getElementById('login-screen').style.display = 'none';
      const shell = document.getElementById('app-shell');
      shell.style.display = 'flex';
      const color = staff.color || '#E4540C';
      document.getElementById('user-av').textContent = staff.name[0];
      document.getElementById('user-av').style.background = 'rgba(' + hexToRgb(color) + ',.15)';
      document.getElementById('user-av').style.color = color;
      document.getElementById('user-nm').textContent = staff.name;

      try {
        await API.shifts.start(500000); // 500k starting cash
      } catch (shiftErr) {
        console.warn('Shift start info:', shiftErr.message);
      }
      
      try {
        const res = await API.menu.getOutletMenu(API.session.outletId);
        
        if (res.data && res.data.categories && res.data.items) {
          CATS = res.data.categories.map(c => ({
            id: c.id,
            label: c.name,
            svg: c.icon || (c.name.toLowerCase().includes('makan') ? ICO.rice : (c.name.toLowerCase().includes('minum') ? ICO.juice : ICO.nugget))
          }));
          CATS.unshift({ id: 'fav', label: 'Favorit', svg: ICO.cake, isFav: true });
          
          MENU = res.data.items.map(p => {
            const opts = [];
            const addons = [];
            
            if (p.modifier_groups) {
              p.modifier_groups.forEach(g => {
                if (g.type === 'addon' || g.name.toLowerCase().includes('addon') || g.name.toLowerCase().includes('tambahan')) {
                  (g.options || []).forEach(o => addons.push({ n: o.name, p: o.price_adjustment }));
                } else {
                  opts.push({
                    name: g.name,
                    req: g.required === 1,
                    multi: g.max_select > 1,
                    items: (g.options || []).map(o => ({ n: o.name, p: o.price_adjustment }))
                  });
                }
              });
            }

            return {
              id: p.id,
              cat: p.category_id,
              n: p.name,
              p: p.price,
              d: p.description || '',
              ico: p.category_name && p.category_name.toLowerCase().includes('ayam') ? 'chicken' : (p.category_name && p.category_name.toLowerCase().includes('es') ? 'juice' : 'rice'),
              sold: p.status === 'soldout' || p.is_active === 0 || p.status === 'inactive',
              opts: opts,
              addons: addons
            };
          });
        }
      } catch (err) {
        console.error('Failed to load menu data:', err);
      }

      initCats(); renderMenu(); loadHist();
    }
    function doLogout() {
      currentUser = null; loginSel = null; loginPinArr = []; cart = []; discount = 0; curMember = null;
      document.getElementById('app-shell').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
      backToStaff();
    }
    function hexToRgb(hex) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `${r},${g},${b}`; }

