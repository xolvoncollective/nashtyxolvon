    /* ════════════════════════
       CART
    ════════════════════════ */
    function toggleFav(id) {
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
      localStorage.setItem('nashty_favorites', JSON.stringify([...favorites]));
      renderMenu(document.getElementById('msearch').value);
      // update fav cat count
      const favBtn = document.querySelector('.cbt[data-cat="fav"] .cat-ct');
      if (favBtn) favBtn.textContent = favorites.size;
    }

    /* ── VARIASI ADD-ON ── */


    function addCart(id) {
      const m = MENU.find(x => x.id === id); if (!m || m.sold) return;
      // Non-opts items: merge (increase qty of existing line)
      const ex = cart.find(i => i.id === id && !i.cartKey.includes('_'));
      if (ex) ex.qty++;
      else cart.push({ ...m, qty: 1, selectedOpts: {}, note: '', cartKey: String(id) });
      renderCart(); renderMenu(document.getElementById('msearch').value);
    }
    function chgQty(cartKey, d) {
      const i = cart.findIndex(x => x.cartKey === cartKey); if (i < 0) return;
      cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i, 1);
      renderCart(); renderMenu(document.getElementById('msearch').value);
    }
    function clearCart() {
      cart = []; discount = 0; curMember = null; window.curMemberPhone = null; document.getElementById('mem-lbl').textContent = 'Member';
      document.getElementById('mem-pill').classList.remove('on');
      document.getElementById('tbl-no').value = '';
      renderCart(); renderMenu(document.getElementById('msearch').value);
    }
    function setType(t, el) {
      orderType = t;
      document.querySelectorAll('.obt').forEach(b => b.classList.remove('act'));
      el.classList.add('act');
      const m = { 'dine': '', 'take': 'Take Away', 'gofood': 'GoFood', 'grabfood': 'GrabFood', 'shopee': 'ShopeeFood' };
      document.getElementById('tbl-no').value = m[t] || '';
    }
    function calcT() {
      const sub = cart.reduce((s, i) => s + i.p * i.qty, 0);
      const disc = Math.min(discount, sub); const base = sub - disc;
      const tax = base * .11; const svc = base * .05;
      return { sub, disc, base, tax, svc, grand: base + tax + svc };
    }
    function renderCart() {
      const el = document.getElementById('cart-items');
      const totEl = document.getElementById('cart-tots');
      const subRow = document.getElementById('sub-row');
      const payBtn = document.getElementById('btn-pay');
      document.getElementById('cart-n').textContent = cart.reduce((s, i) => s + i.qty, 0);
      if (!cart.length) {
        el.innerHTML = '<div class="cart-empty"><svg class="ce-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><span class="ce-txt">Tekan kartu menu<br>untuk menambahkan</span></div>';
        totEl.style.display = 'none'; subRow.style.display = 'none';
        payBtn.disabled = true; payBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pilih menu terlebih dahulu';
        return;
      }
      el.innerHTML = '';
      cart.forEach(item => {
        const d = document.createElement('div'); d.className = 'ci';
        const opts = item.selectedOpts ? Object.values(item.selectedOpts).flat().join(', ') : '';
        const addonStr = item.addonNames || '';
        const noted = item.note && item.note.length > 0;
        d.innerHTML = `
      <div class="ci-info">
        <div class="ci-name">${item.n}</div>
        ${opts ? `<div class="ci-opts">${opts}</div>` : ''}
        ${addonStr ? `<div class="ci-opts" style="color:var(--gn)">+${addonStr}</div>` : ''}
        ${noted ? `<div class="ci-note-tag">${item.note}</div>` : ''}
        <div class="ci-unitp">${fr(item.p)}</div>
        <div class="ci-totalp">${fr(item.p * item.qty)}</div>
      </div>
      <div class="ci-right">
        <div class="ci-qty">
          <div class="qb mi" onclick="chgQty('${item.cartKey}',-1)">
            ${item.qty === 1
            ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'
            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>'}
          </div>
          <span class="qnum">${item.qty}</span>
          <div class="qb pl" onclick="chgQty('${item.cartKey}',1)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
        <div class="ci-pencil${noted ? ' noted' : ''}" onclick="showItemNote('${item.cartKey}')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
      </div>`;
        el.appendChild(d);
      });
      const { sub, disc, tax, svc, grand } = calcT();
      document.getElementById('t-sub').textContent = fr(sub);
      const dr = document.getElementById('t-disc-row');
      if (disc > 0) { dr.style.display = 'flex'; document.getElementById('t-disc').textContent = '- ' + fr(disc); } else dr.style.display = 'none';
      document.getElementById('t-tax').textContent = fr(tax);
      document.getElementById('t-svc').textContent = fr(svc);
      document.getElementById('t-tot').textContent = fr(grand);
      totEl.style.display = 'block'; subRow.style.display = 'flex';
      payBtn.disabled = false;
      payBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Bayar ${fr(grand)}`;
    }

    /* ── Item note modal ── */
    function showItemNote(cartKey) {
      const item = cart.find(i => i.cartKey === cartKey); if (!item) return;
      const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'mo-inote';
      ov.innerHTML = `<div class="mo" style="width:340px"><div class="mo-h"><div class="mo-t">Catatan: ${item.n}</div><div class="mo-x" onclick="document.getElementById('mo-inote').remove()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div><div class="mo-b"><textarea id="inote-v" style="width:100%;background:var(--sf2);border:1px solid var(--brd);border-radius:9px;padding:10px 12px;font-size:14px;color:var(--txt);outline:none;font-family:var(--fn);resize:none;min-height:80px;transition:border .15s" placeholder="Contoh: tanpa bawang, extra sambal..." onfocus="this.style.borderColor='var(--or)'" onblur="this.style.borderColor='var(--brd)'">${item.note || ''}</textarea><button onclick="saveItemNote('${cartKey}')" style="width:100%;margin-top:10px;padding:12px;border-radius:10px;border:none;background:var(--or);color:#fff;font-size:14px;font-weight:700;cursor:pointer">Simpan Catatan</button></div></div>`;
      ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
      setTimeout(() => document.getElementById('inote-v')?.focus(), 100);
    }
    function saveItemNote(cartKey) {
      const item = cart.find(i => i.cartKey === cartKey);
      if (item) item.note = document.getElementById('inote-v')?.value || '';
      document.getElementById('mo-inote')?.remove(); renderCart();
    }

