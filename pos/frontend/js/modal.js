    /* ════════════════════════
       OPTS MODAL
    ════════════════════════ */
    function showOptsModal(menuId) {
      const m = MENU.find(x => x.id === menuId); if (!m) return;
      const ex = cart.find(i => i.id === menuId);
      const curOpts = ex?.selectedOpts || {};

      // ── Build Opsi section ──
      let optsHtml = '';
      (m.opts || []).forEach((g, gi) => {
        optsHtml += '<div style="margin-bottom:14px">'
          + '<div style="font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">'
          + '<span>' + g.name + '</span>'
          + '<span style="font-size:9px;padding:2px 8px;border-radius:8px;background:var(--blL);color:var(--bl)">' + (!g.multi ? 'Pilih 1' : 'Multi-pilih') + '</span>'
          + '</div>';
        (g.items || []).forEach(ch => {
          const chName = ch.n;
          const sel = curOpts[g.name] && (Array.isArray(curOpts[g.name]) ? curOpts[g.name].includes(chName) : curOpts[g.name] === chName);
          const t = !g.multi ? 'radio' : 'checkbox';
          optsHtml += '<label class="opts-choice' + (sel ? ' sel' : '') + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--sf2);border:1px solid ' + (sel ? 'rgba(228,84,12,.4)' : 'var(--brd)') + ';border-radius:9px;cursor:pointer;margin-bottom:5px;transition:all .1s">'
            + '<input type="' + t + '" name="og-' + menuId + '-' + gi + '" value="' + chName + '" ' + (sel ? 'checked' : '')
            + ' style="width:16px;height:16px;accent-color:var(--or);cursor:pointer">'
            + '<span style="font-size:13px;font-weight:600;color:var(--txt)">' + chName + (ch.p ? ' (+'+fr(ch.p)+')' : '') + '</span>'
            + '</label>';
        });
        optsHtml += '</div>';
      });

      // ── Build Variasi Add-on section ──
      let addonHtml = '';
      if (m.addons && m.addons.length > 0) {
        addonHtml = '<div style="border-top:1px solid var(--brd);margin-top:4px;padding-top:16px">'
          + '<div style="font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">'
          + '<span>Variasi Add-on</span>'
          + '<span style="font-size:9px;padding:2px 8px;border-radius:8px;background:var(--gnL);color:var(--gn)">Opsional · Multi-pilih</span>'
          + '</div>';
        m.addons.forEach((a, ai) => {
          addonHtml += '<div class="addon-row" id="ao-' + menuId + '-' + ai + '" data-price="' + a.p + '" onclick="toggleAddonRow(this)" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--sf2);border:1px solid var(--brd);border-radius:10px;cursor:pointer;margin-bottom:6px;transition:all .12s">'
            + '<div style="display:flex;align-items:center;gap:10px">'
            + '<div class="ao-check" style="width:18px;height:18px;border-radius:5px;border:1.5px solid var(--brd2);background:var(--sf3);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s">'
            + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            + '</div>'
            + '<span style="font-size:13px;font-weight:600;color:var(--txt)">' + a.n + '</span>'
            + '</div>'
            + '<span style="font-size:12px;font-weight:700;color:var(--gn);font-family:var(--mo);background:var(--gnL);border:1px solid rgba(34,197,94,.2);border-radius:7px;padding:3px 9px">+' + fr(a.p) + '</span>'
            + '</div>';
        });
        addonHtml += '</div>';
      }

      // ── Running total display ──
      const totalBarHtml = '<div id="opts-total-bar" style="background:var(--sf2);border:1px solid var(--brd);border-radius:10px;padding:11px 14px;display:flex;align-items:center;justify-content:space-between">'
        + '<span style="font-size:12px;color:var(--txt3);font-weight:500">Total harga</span>'
        + '<span id="opts-total-val" style="font-size:17px;font-weight:900;color:var(--or);font-family:var(--mo)">' + fr(m.p) + '</span>'
        + '</div>';

      const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'mo-opts';
      ov.innerHTML = '<div class="mo" style="width:380px"><div class="mo-h">'
        + '<div><div class="mo-t">' + m.n + '</div>'
        + '<div style="font-size:12px;color:var(--txt3);margin-top:2px">' + m.d + ' · <span style="color:var(--or);font-family:var(--mo)">' + fr(m.p) + '</span></div></div>'
        + '<div class="mo-x" onclick="document.getElementById(\'mo-opts\').remove()">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        + '</div></div>'
        + '<div class="mo-b">' + optsHtml + addonHtml + totalBarHtml
        + '<button onclick="confirmOpts(' + menuId + ')" style="width:100%;margin-top:12px;padding:13px;border-radius:11px;border:none;background:var(--or);color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:var(--fn)" id="opts-confirm-btn">Tambah ke Pesanan — ' + fr(m.p) + '</button>'
        + '</div></div>';
      ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);

      // Wire opts-choice hover style
      ov.querySelectorAll('.opts-choice').forEach(lbl => {
        lbl.querySelector('input').addEventListener('change', () => {
          if (lbl.querySelector('input').type === 'radio') {
            const nm = lbl.querySelector('input').name;
            ov.querySelectorAll('input[name="' + nm + '"]').forEach(inp => {
              inp.closest('.opts-choice').classList.toggle('sel', inp.checked);
              inp.closest('.opts-choice').style.borderColor = inp.checked ? 'rgba(228,84,12,.4)' : 'var(--brd)';
            });
          } else {
            lbl.classList.toggle('sel', lbl.querySelector('input').checked);
            lbl.style.borderColor = lbl.querySelector('input').checked ? 'rgba(228,84,12,.4)' : 'var(--brd)';
          }
          updateOptsTotal(menuId);
        });
      });
    }

    function toggleAddonRow(el) {
      el.classList.toggle('ao-sel');
      const isSel = el.classList.contains('ao-sel');
      el.style.borderColor = isSel ? 'rgba(34,197,94,.45)' : 'var(--brd)';
      el.style.background = isSel ? 'var(--gnL)' : 'var(--sf2)';
      const cb = el.querySelector('.ao-check');
      if (cb) { cb.style.background = isSel ? 'var(--gn)' : 'var(--sf3)'; cb.style.borderColor = isSel ? 'var(--gn)' : 'var(--brd2)'; }
      const menuId = parseInt(el.id.split('-')[1]);
      updateOptsTotal(menuId);
    }

    function updateOptsTotal(menuId) {
      const m = MENU.find(x => x.id === menuId); if (!m) return;
      let addonTotal = 0;
      document.querySelectorAll('#mo-opts .ao-sel').forEach(el => {
        addonTotal += parseInt(el.getAttribute('data-price') || '0');
      });
      const grand = m.p + addonTotal;
      const tv = document.getElementById('opts-total-val');
      const cb = document.getElementById('opts-confirm-btn');
      const cnt = document.querySelectorAll('#mo-opts .ao-sel').length;
      if (tv) tv.textContent = fr(grand);
      if (cb) cb.textContent = 'Tambah ke Pesanan — ' + fr(grand) + (cnt > 0 ? ' (+' + cnt + ' add-on)' : '');
    }

    function confirmOpts(menuId) {
      const m = MENU.find(x => x.id === menuId); if (!m) return;
      const selectedOpts = {};
      (m.opts || []).forEach((g, gi) => {
        const inputs = [...document.querySelectorAll('#mo-opts input[name="og-' + menuId + '-' + gi + '"]')];
        const checked = inputs.filter(i => i.checked).map(i => i.value);
        if (checked.length) selectedOpts[g.label] = g.type === 'single' ? checked[0] : checked;
      });
      // Collect selected addons
      const selectedAddons = [];
      let addonPrice = 0;
      document.querySelectorAll('#mo-opts .ao-sel').forEach(el => {
        const idx = parseInt(el.id.split('-')[2]);
        if (m.addons && m.addons[idx]) {
          selectedAddons.push(m.addons[idx]);
          addonPrice += m.addons[idx].p;
        }
      });
      const addonNames = selectedAddons.map(a => a.n).join(', ');
      const finalPrice = m.p + addonPrice;
      const cartKey = menuId + '_' + Date.now();
      cart.push({ ...m, qty: 1, p: finalPrice, selectedOpts, note: '', cartKey, addonPrice, addonNames });
      document.getElementById('mo-opts')?.remove();
      renderCart(); renderMenu(document.getElementById('msearch').value);
    }

