    /* ════════════════════════
       LOGIN
    ════════════════════════ */
    async function initLogin() {
      const g = document.getElementById('staff-grid');
      g.innerHTML = '<div style="color:var(--txt3); font-size:12px; grid-column:span 2; text-align:center;">Memuat data kasir...</div>';
      try {
        const res = await API.auth.getStaff('demo-outlet');
        const staffList = res.staff || [];
        g.innerHTML = '';
        staffList.forEach(s => {
          const b = document.createElement('button');
          b.className = 'staff-btn'; b.id = 'sbtn-' + s.id;
          b.innerHTML = `<div class="staff-av">${s.name[0]}</div><div class="staff-name">${s.name}</div><div class="staff-role">${s.role}</div>`;
          b.onclick = () => selectStaff(s);
          g.appendChild(b);
        });
      } catch (err) {
        g.innerHTML = '<div style="color:var(--rd); font-size:12px; grid-column:span 2; text-align:center;">Gagal memuat kasir. Pastikan backend menyala.</div>';
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
        const catRes = await API.categories.getAll();
        const prodRes = await API.products.getAll();
        
        if (catRes.success && catRes.data) {
          CATS = catRes.data.map(c => ({
            id: c.id,
            label: c.name,
            svg: c.name.toLowerCase().includes('makan') ? ICO.rice : (c.name.toLowerCase().includes('minum') ? ICO.juice : ICO.nugget)
          }));
          CATS.unshift({ id: 'fav', label: 'Favorit', svg: ICO.cake, isFav: true });
        }
        
        if (prodRes.success && prodRes.data) {
          MENU = prodRes.data.map(p => ({
            id: p.id,
            cat: p.category_id,
            n: p.name,
            p: p.price,
            d: p.description || '',
            ico: p.name.toLowerCase().includes('ayam') ? 'chicken' : (p.name.toLowerCase().includes('es') ? 'juice' : 'rice'),
            sold: p.stock_qty <= 0
          }));
        }
      } catch (err) {
        console.error('Failed to load menu data:', err);
      }

      initCats(); renderMenu(); renderHist();
    }
    function doLogout() {
      currentUser = null; loginSel = null; loginPinArr = []; cart = []; discount = 0; curMember = null;
      document.getElementById('app-shell').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
      backToStaff();
    }
    function hexToRgb(hex) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `${r},${g},${b}`; }

