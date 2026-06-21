    /* ════════════════════════
       LOGIN
    ════════════════════════ */
    async function initLogin() {
      // CRITICAL FIX: Jangan auto-restore session jika user baru login dari launcher
      // User harus selalu pilih kasir dan input PIN setiap kali masuk POS
      
      // Clear any stale POS-specific session
      localStorage.removeItem('nashty_session');
      
      // 1. Check if we have launcher auth (admin1, superadmin, etc)
      if (typeof NASHTY_AUTH !== 'undefined' && NASHTY_AUTH.hasValidAuth()) {
        const user = NASHTY_AUTH.getUser();
        const outlet = NASHTY_AUTH.getOutlet();
        if (user && outlet) {
          console.log('✓ [POS Auth] Launcher auth detected, showing staff selection...');
          API.session.tenantId = user.tenantId || user.tenant_id || '00000000-0000-0000-0000-000000000001';
          API.session.outletId = outlet.id || outlet.outlet_id || '00000000-0000-0000-0000-000000000101';
          loadStaff();
          return;
        }
      }

      // 2. Fallback: load staff for default outlet (standalone POS)
      console.log('✓ [POS Auth] Standalone mode, loading staff...');
      API.session.tenantId = '00000000-0000-0000-0000-000000000001';
      API.session.outletId = '00000000-0000-0000-0000-000000000101';
      loadStaff();
    }
    
    window.onAuthReceived = function(authData) {
      if (authData && authData.outlet) {
        API.session.tenantId = authData.user.tenantId || authData.user.tenant_id || '00000000-0000-0000-0000-000000000001';
        API.session.outletId = authData.outlet.id || authData.outlet.outlet_id || '00000000-0000-0000-0000-000000000002';
        
        // Check if we can auto-login
        if (API.session && API.session.user && API.session.token) {
           doLogin(API.session.user);
        } else {
           loadStaff();
        }
      }
    };

    async function loadStaff() {
      if (!API.session.outletId) return;
      const grid = document.getElementById('staff-grid');
      if (!grid) return;
      grid.innerHTML = '<div style="color:var(--txt3);grid-column:1/-1;text-align:center;padding:20px">Memuat data kasir...</div>';
      try {
        const res = await API.auth.getStaff(API.session.outletId);
        if (res && res.staff && res.staff.length > 0) {
          grid.innerHTML = res.staff.map(s => `
            <div class="staff-btn" id="sbtn-${s.id}" onclick="selectStaff({id:'${s.id}', name:'${s.name}', role:'${s.role}', tenantId:'${s.tenant_id}', outletId:'${s.outlet_id}'})">
              <div class="staff-av">${s.name[0].toUpperCase()}</div>
              <div class="staff-n">${s.name}</div>
              <div class="staff-r">${s.role === 'admin' ? 'Manager' : 'Kasir'}</div>
            </div>
          `).join('');
        } else {
          grid.innerHTML = '<div style="color:var(--txt3);grid-column:1/-1;text-align:center;padding:20px">Tidak ada data kasir untuk outlet ini</div>';
        }
      } catch (err) {
        console.error("Gagal memuat kasir:", err);
        grid.innerHTML = '<div style="color:var(--rd);grid-column:1/-1;text-align:center;padding:20px">Gagal memuat kasir. Cek koneksi.</div>';
      }
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
          const res = await API.auth.login(loginPinArr.join(''), API.session.outletId);
          if (res.success && res.user) {
            if (res.user.id === loginSel.id) {
              doLogin(res.user);
            } else {
              showPinError('PIN salah untuk kasir ini (ID Mismatch)');
            }
          } else {
            showPinError('Invalid PIN response');
          }
        } catch (err) {
          showPinError(err.message);
        }
      }
    }

    function showPinError(msg = 'PIN salah, coba lagi') {
      document.getElementById('login-err').textContent = msg;
      loginPinArr = [];
      setTimeout(() => {
        for (let i = 0; i < 4; i++) { const d = document.getElementById('ld' + i); if (d) d.classList.remove('on'); }
        document.getElementById('login-err').textContent = '';
      }, 2500);
    }
    async function doLogin(staff) {
      currentUser = staff;
      if (typeof API !== 'undefined' && API.session) {
        API.session.user = staff;
        API.session.outletId = staff.outletId || '00000000-0000-0000-0000-000000000101';
        API.session.tenantId = staff.tenantId || '00000000-0000-0000-0000-000000000001';
        
        // Persist full session to localStorage for survive-across-refresh
        localStorage.setItem('nashty_session', JSON.stringify(API.session));
        localStorage.setItem('nashty_token', API.session.token || 'pos-session-token');
        localStorage.setItem('nashty_user', JSON.stringify(staff));
        localStorage.setItem('nashty_outlet', JSON.stringify({id: API.session.outletId, name: 'Galaxy Mall'}));
      }
      document.getElementById('login-screen').style.display = 'none';
      const shell = document.getElementById('app-shell');
      shell.style.display = 'flex';
      const color = staff.color || '#E4540C';
      document.getElementById('user-av').textContent = staff.name[0];
      document.getElementById('user-av').style.background = 'rgba(' + hexToRgb(color) + ',.15)';
      document.getElementById('user-av').style.color = color;
      document.getElementById('user-nm').textContent = staff.name;

      // Check for existing active shift first
      try {
        const shiftRes = await API.shifts.getActive();
        if (shiftRes && shiftRes.shift) {
          // Shift already active — resume it
          API.session.shiftId = shiftRes.shift.id;
          toast('Shift aktif ditemukan. Selamat bekerja, ' + staff.name + '!', 'success');
        } else {
          // No active shift — show modal to open shift
          showBukaShiftModal(staff);
        }
      } catch (shiftErr) {
        // Cannot check shift — show modal anyway
        showBukaShiftModal(staff);
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

    function showBukaShiftModal(staff) {
      // Remove existing modal if any
      const existingModal = document.getElementById('mo-shift-open');
      if (existingModal) existingModal.remove();

      const ov = document.createElement('div');
      ov.className = 'ov';
      ov.id = 'mo-shift-open';
      ov.innerHTML = `
        <div class="mo" style="width:380px">
          <div class="mo-h">
            <div class="mo-t">🔓 Buka Shift</div>
          </div>
          <div class="mo-b" style="display:flex;flex-direction:column;gap:14px">
            <div style="font-size:13px;color:var(--txt3)">Selamat datang, <strong style="color:var(--txt)">${staff.name}</strong>. Masukkan saldo petty cash awal untuk memulai shift.</div>
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--txt2);display:block;margin-bottom:6px">Saldo Petty Cash Awal (Rp)</label>
              <input id="shift-start-cash" type="number" min="0" step="1000" value="500000"
                style="width:100%;background:var(--sf2);border:1px solid var(--brd2);border-radius:10px;padding:12px 14px;font-size:16px;font-weight:700;color:var(--txt);font-family:var(--mo);outline:none;box-sizing:border-box"
                onfocus="this.style.borderColor='var(--or)'" onblur="this.style.borderColor='var(--brd2)'"
                placeholder="500000">
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
              ${[100000,200000,300000,500000].map(v=>`<button onclick="document.getElementById('shift-start-cash').value=${v}" style="padding:8px;border-radius:8px;border:1px solid var(--brd2);background:var(--sf2);color:var(--txt2);font-size:11px;font-weight:600;cursor:pointer">${(v/1000)}rb</button>`).join('')}
            </div>
            <button onclick="konfirmasiBukaShift()" style="width:100%;padding:14px;border-radius:10px;border:none;background:var(--or);color:#fff;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Mulai Shift
            </button>
          </div>
        </div>`;
      document.body.appendChild(ov);
      setTimeout(() => document.getElementById('shift-start-cash')?.focus(), 100);
    }

    window.konfirmasiBukaShift = async function() {
      const cashInput = document.getElementById('shift-start-cash');
      const startCash = parseFloat(cashInput?.value) || 0;
      try {
        const data = await API.shifts.start(startCash);
        if (data.success) {
          document.getElementById('mo-shift-open')?.remove();
          // Store start cash in session for laporan display
          API.session._shiftStartCash = startCash;
          localStorage.setItem('nashty_session', JSON.stringify(API.session));
          toast('Shift dibuka! Saldo petty cash: Rp ' + startCash.toLocaleString('id-ID'), 'success');
        }
      } catch (e) {
        toast('Gagal membuka shift: ' + (e.message || 'Unknown error'), 'err');
      }
    };

    window.showTutupShiftModal = async function() {
      // Calculate current shift summary
      let summary = null;
      if (API.session.shiftId) {
        try {
          const res = await API.request('/shifts/' + API.session.shiftId + '/summary');
          summary = res.summary;
        } catch(e) { /* no summary available */ }
      }

      const existingModal = document.getElementById('mo-shift-close');
      if (existingModal) existingModal.remove();

      const ov = document.createElement('div');
      ov.className = 'ov';
      ov.id = 'mo-shift-close';
      ov.innerHTML = `
        <div class="mo" style="width:420px">
          <div class="mo-h">
            <div class="mo-t">🔒 Tutup Shift</div>
            <div class="mo-x" onclick="document.getElementById('mo-shift-close').remove()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>
          <div class="mo-b" style="display:flex;flex-direction:column;gap:14px">
            ${summary ? `<div style="background:var(--sf2);border-radius:10px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div style="font-size:12px;color:var(--txt3)">Total Transaksi</div><div style="font-size:13px;font-weight:700;text-align:right">${summary.total_orders || 0}</div>
              <div style="font-size:12px;color:var(--txt3)">Gross Sales</div><div style="font-size:13px;font-weight:700;text-align:right;font-family:var(--mo)">${frS(summary.gross_sales || 0)}</div>
              <div style="font-size:12px;color:var(--txt3)">Net Sales</div><div style="font-size:13px;font-weight:700;text-align:right;font-family:var(--mo)">${frS(summary.net_sales || 0)}</div>
              <div style="font-size:12px;color:var(--txt3)">Total Collected</div><div style="font-size:14px;font-weight:800;color:var(--or);text-align:right;font-family:var(--mo)">${frS(summary.total_collected || summary.net_sales || 0)}</div>
            </div>` : ''}
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--txt2);display:block;margin-bottom:6px">Saldo Petty Cash Akhir (Rp)</label>
              <input id="shift-end-cash" type="number" min="0" step="1000" value="0"
                style="width:100%;background:var(--sf2);border:1px solid var(--brd2);border-radius:10px;padding:12px 14px;font-size:16px;font-weight:700;color:var(--txt);font-family:var(--mo);outline:none;box-sizing:border-box"
                onfocus="this.style.borderColor='var(--or)'" onblur="this.style.borderColor='var(--brd2)'"
                placeholder="0">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--txt2);display:block;margin-bottom:6px">Catatan (opsional)</label>
              <textarea id="shift-end-notes" style="width:100%;background:var(--sf2);border:1px solid var(--brd2);border-radius:10px;padding:10px 12px;font-size:13px;color:var(--txt);outline:none;resize:none;min-height:60px;box-sizing:border-box" placeholder="Catatan tutup shift..."></textarea>
            </div>
            <button onclick="konfirmasiTutupShift()" style="width:100%;padding:14px;border-radius:10px;border:none;background:#EF4444;color:#fff;font-size:15px;font-weight:700;cursor:pointer">
              Tutup Shift & Cetak Laporan
            </button>
          </div>
        </div>`;
      document.body.appendChild(ov);
    };

    window.konfirmasiTutupShift = async function() {
      const endCash = parseFloat(document.getElementById('shift-end-cash')?.value) || 0;
      const notes = document.getElementById('shift-end-notes')?.value || '';
      const shiftId = API.session.shiftId;

      if (!shiftId) {
        toast('Tidak ada shift aktif untuk ditutup', 'err');
        return;
      }

      try {
        const data = await API.shifts.end(shiftId, endCash, notes);
        if (data.success) {
          document.getElementById('mo-shift-close')?.remove();
          toast('Shift berhasil ditutup!', 'success');
          // Refresh laporan after closing shift
          setTimeout(() => {
            const lapBtn = document.querySelector('.ttab[onclick*="laporan"]');
            if (lapBtn) lapBtn.click();
          }, 500);
        }
      } catch (e) {
        toast('Gagal menutup shift: ' + (e.message || 'Unknown error'), 'err');
      }
    };

    function doLogout() {
      currentUser = null; loginSel = null; loginPinArr = []; cart = []; discount = 0; curMember = null;
      // Clear session from localStorage so we show login on next load
      localStorage.removeItem('nashty_session');
      localStorage.removeItem('nashty_token');
      localStorage.removeItem('nashty_user');
      // Clear in-memory session
      if (typeof API !== 'undefined' && API.session) {
        API.session.token = null;
        API.session.refreshToken = null;
        API.session.user = null;
        API.session.shiftId = null;
      }
      document.getElementById('app-shell').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
      backToStaff();
    }
    function hexToRgb(hex) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `${r},${g},${b}`; }

