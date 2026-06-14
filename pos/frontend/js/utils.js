    /* ── CLOCK ── */
    function utilsPad(v) { return v.toString().padStart(2, '0'); }
    function tick() { const n = new Date(); document.getElementById('clk').textContent = utilsPad(n.getHours()) + ':' + utilsPad(n.getMinutes()) + ':' + utilsPad(n.getSeconds()); }
    setInterval(tick, 1000); tick();

    /* ── THEME ── */
    function toggleTheme() { document.body.classList.toggle('day'); const d = document.body.classList.contains('day'); document.getElementById('ico-sun').style.display = d ? 'none' : 'block'; document.getElementById('ico-moon').style.display = d ? 'block' : 'none'; }

    /* ── TOAST ── */
    function toast(msg, type = 'ok') {
      const t = document.createElement('div'); t.className = 'toast ' + type;
      const icons = { ok: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', err: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>', info: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>' };
      t.innerHTML = (icons[type] || '') + msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000);
    }

