    /* ════════════════════════
       CATEGORIES
    ════════════════════════ */
    function initCats() {
      const el = document.getElementById('cat-strip'); el.innerHTML = '';
      CATS.forEach(c => {
        const cnt = MENU.filter(m => m.cat === c.id).length;
        const b = document.createElement('button');
        b.className = 'cbt' + (c.id === curCat ? ' act' : '');
        b.setAttribute('data-cat', c.id);
        b.innerHTML = `${c.svg} ${c.label} <span class="cat-ct">${cnt}</span>`;
        b.onclick = () => {
          document.querySelectorAll('.cbt').forEach(x => x.classList.remove('act'));
          b.classList.add('act'); curCat = c.id;
          document.getElementById('msearch').value = '';
          document.getElementById('srch-ct').textContent = '';
          renderMenu();
        };
        el.appendChild(b);
      });
    }

    /* ════════════════════════
       MENU
    ════════════════════════ */
    function searchMenu(q) {
      renderMenu(q);
      const ct = document.getElementById('srch-ct');
      if (q) { const n = MENU.filter(m => m.n.toLowerCase().includes(q.toLowerCase())).length; ct.textContent = n + ' item'; }
      else ct.textContent = '';
    }
    function renderMenu(search = '') {
      const el = document.getElementById('menu-grid');
      const sq = search ? search.toLowerCase() : '';
      const items = MENU.filter(m => {
        const catOk = search ? true : (curCat === 'fav' ? favorites.has(m.id) : m.cat === curCat);
        const srchOk = !search || m.n.toLowerCase().includes(sq);
        return catOk && srchOk;
      });
      el.innerHTML = '';
      if (!items.length) { el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--txt3);font-size:13px">Tidak ada menu ditemukan</div>'; return; }
      const OPTS_SVG = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
      items.forEach(m => {
        const d = document.createElement('div');
        const isAddon = m.cat === 'addon';
        d.className = 'mcard' + (m.sold ? ' sold' : '') + (isAddon ? ' addon-c' : '');
        d.id = 'mc-card-' + m.id;
        const qty = cart.filter(i => i.id === m.id).reduce((s, i) => s + i.qty, 0);
        const clr = icoColor(m.cat);
        const hasOpts = m.opts && m.opts.length > 0;
        const hasAddons = m.addons && m.addons.length > 0;

        d.innerHTML = '<div class="mc-img">'
          + '<div class="mc-ph"><div style="width:32px;height:32px">' + ico(m.ico, clr) + '</div><span>Foto produk</span></div>'
          + (m.sold ? '<div class="mc-sold-ov"><div class="mc-sold-b">Habis</div></div>' : '')
          + (qty > 0 ? '<div class="mc-qty-b">' + qty + '</div>' : '')
          + ((hasOpts || hasAddons) ? '<div class="mc-opts-b">' + OPTS_SVG + ' Opsi</div>' : '')
          + '</div>'
          + '<div class="mc-body">'
          + '<div class="mc-name">' + m.n + '</div>'
          + '<div class="mc-desc">' + m.d + '</div>'
          + '<div class="mc-footer">'
          + '<div class="' + (isAddon ? 'mc-price-pu' : 'mc-price') + '" id="mc-price-' + m.id + '">' + fr(m.p) + '</div>'
          + '</div></div>'
          ;

        if (!m.sold) {
          d.onclick = (e) => {
            if (hasOpts || hasAddons) {
              showOptsModal(m.id);
            } else {
              addCart(m.id);
            }
            d.style.borderColor = isAddon ? 'var(--pu)' : 'var(--or)'; d.style.transform = 'scale(.96)';
            setTimeout(() => { d.style.borderColor = ''; d.style.transform = ''; }, 180);
          };
        }
        el.appendChild(d);
      });
    }

