    /* ════════════════════════
       LOGIN
    ════════════════════════ */
    function initLogin() {
      const g = document.getElementById('staff-grid');
      STAFF.forEach(s => {
        const b = document.createElement('button');
        b.className = 'staff-btn'; b.id = 'sbtn-' + s.id;
        b.innerHTML = `<div class="staff-av">${s.name[0]}</div><div class="staff-name">${s.name}</div><div class="staff-role">${s.role}</div>`;
        b.onclick = () => selectStaff(s);
        g.appendChild(b);
      });
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
    function loginPin(k) {
      if (!loginSel) return;
      if (k === 'DEL') loginPinArr.pop();
      else if (loginPinArr.length < 4) loginPinArr.push(k);
      for (let i = 0; i < 4; i++) { const d = document.getElementById('ld' + i); if (d) d.classList.toggle('on', i < loginPinArr.length); }
      if (loginPinArr.length === 4) {
        if (loginPinArr.join('') === loginSel.pin) {
          doLogin(loginSel);
        } else {
          document.getElementById('login-err').textContent = 'PIN salah, coba lagi';
          loginPinArr = [];
          setTimeout(() => {
            for (let i = 0; i < 4; i++) { const d = document.getElementById('ld' + i); if (d) d.classList.remove('on'); }
            document.getElementById('login-err').textContent = '';
          }, 900);
        }
      }
    }
    function doLogin(staff) {
      currentUser = staff;
      document.getElementById('login-screen').style.display = 'none';
      const shell = document.getElementById('app-shell');
      shell.style.display = 'flex';
      document.getElementById('user-av').textContent = staff.name[0];
      document.getElementById('user-av').style.background = 'rgba(' + hexToRgb(staff.color) + ',.15)';
      document.getElementById('user-av').style.color = staff.color;
      document.getElementById('user-nm').textContent = staff.name;
      initCats(); renderMenu(); renderHist();
    }
    function doLogout() {
      currentUser = null; loginSel = null; loginPinArr = []; cart = []; discount = 0; curMember = null;
      document.getElementById('app-shell').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
      backToStaff();
    }
    function hexToRgb(hex) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `${r},${g},${b}`; }

