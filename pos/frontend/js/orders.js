    /* ════════════════════════
       PAYMENT
    ════════════════════════ */
    function showPayModal() {
      if (document.getElementById('pay-ov')) return;
      const { sub, disc, tax, svc, grand } = calcT();

      // Payment methods per spec
      const PMS = [
        {
          id: 'cash', label: 'Tunai', color: '#22C55E',
          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>'
        },
        {
          id: 'transfer', label: 'Transfer', color: '#06B6D4',
          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
        },
        {
          id: 'qris', label: 'QRIS', color: '#3B82F6',
          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="18" y="18" width="2" height="2"/><rect x="20" y="20" width="2" height="2"/></svg>'
        },
        {
          id: 'bca', label: 'BCA', color: '#1E40AF',
          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#1E40AF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><text x="5" y="19" font-size="5" fill="#1E40AF" stroke="none">BCA</text></svg>'
        },
        {
          id: 'debit', label: 'Debit', color: '#A855F7',
          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><circle cx="6" cy="15.5" r="1.5" fill="#A855F7"/></svg>'
        },
        {
          id: 'gofood', label: 'GoFood', color: '#E3175B', delivery: true,
          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#E3175B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>'
        },
        {
          id: 'grabfood', label: 'GrabFood', color: '#00B14F', delivery: true,
          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#00B14F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>'
        },
        {
          id: 'shopee', label: 'ShopeeFood', color: '#EE4D2D', delivery: true,
          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#EE4D2D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>'
        },
        {
          id: 'open_bill', label: 'Open Bill', color: '#F59E0B', isOpenBill: true,
          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
        },
      ];

      // Build order summary without nested template literals
      var sumItemsHtml = '';
      cart.forEach(function (it) {
        var mods = it.selectedOpts ? Object.values(it.selectedOpts).flat() : [];
        if (it.addonNames) mods = mods.concat(it.addonNames.split(', ').map(function (a) { return '+' + a; }));
        if (it.note) mods.push(it.note);
        var modsStr = mods.length ? '<div style="font-size:11px;color:var(--or);margin-top:2px">' + mods.join(' · ') + '</div>' : '';
        sumItemsHtml += '<div class="sum-item">'
          + '<div><div class="sum-item-n">' + it.n + '</div>'
          + modsStr
          + '<div class="sum-item-q">' + it.qty + '&times; ' + fr(it.p) + '</div></div>'
          + '<div class="sum-item-p">' + fr(it.p * it.qty) + '</div></div>';
      });
      var sumTotsHtml = '<div class="sum-tots">'
        + '<div class="sum-row"><span>Subtotal</span><span>' + fr(sub) + '</span></div>'
        + (disc > 0 ? '<div class="sum-row disc"><span>Diskon</span><span>- ' + fr(disc) + '</span></div>' : '')
        + '<div class="sum-row"><span>Pajak 11%</span><span>' + fr(tax) + '</span></div>'
        + '<div class="sum-row"><span>Service 5%</span><span>' + fr(svc) + '</span></div>'
        + '<div class="sum-row grand"><span>Total</span><span>' + fr(grand) + '</span></div>'
        + '</div>';

      // Build pm buttons
      var pmHtml = '';
      PMS.forEach(function (pm) {
        var act = (pm.id === 'cash') ? ' act' : '';
        var style = '';
        var isLocked = pm.delivery && orderType === 'dine';
        var isOpenBillOpt = pm.isOpenBill;
        var lstyle = isLocked ? style + 'opacity:.3;cursor:not-allowed;pointer-events:none;' :
                    isOpenBillOpt ? style + 'border:1.5px dashed #F59E0B;' : style;
        pmHtml += '<div class="pmb' + act + '" id="pmb-' + pm.id + '" onclick="selPm(\'' + pm.id + '\',' + grand + ')" style="' + lstyle + '">'
          + '<div class="pmb-ico">' + pm.svg + '</div>'
          + '<div class="pmb-lbl">' + pm.label + '</div>'
          + (isLocked ? '<div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:2px;font-weight:600">Khusus Delivery</div>' : '')
          + (isOpenBillOpt ? '<div style="font-size:9px;color:#F59E0B;margin-top:2px;font-weight:600">Bayar Nanti</div>' : '')
          + '</div>';
      });

      // Build numpad
      var nkHtml = '';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'UANG PAS', '0', '⌫'].forEach(function (k) {
        var cls = k === 'UANG PAS' ? ' sp' : k === '⌫' ? ' dl' : '';
        nkHtml += '<div class="nk' + cls + '" onclick="cashKey(\'' + k + '\',' + grand + ')">' + k + '</div>';
      });

      var html = '<div class="pay-modal">'
        + '<div class="pay-head">'
        + '<div class="pay-head-t"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pembayaran</div>'
        + '<div class="pay-x" onclick="document.getElementById(\'pay-ov\').remove()">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        + '</div>'
        + '</div>'
        + '<div class="pay-body">'
        + '<div class="pay-left">'
        + '<div class="pay-total-box"><div class="pay-total-lbl">Total Tagihan</div><div class="pay-total-amt">' + fr(grand) + '</div></div>'
        + '<div class="pm-lbl">Metode Pembayaran</div>'
        + '<div class="pm-grid" style="grid-template-columns:repeat(2,1fr)">' + pmHtml + '</div>'
        + '<div id="delivery-note-wrap" style="display:none;margin-top:10px">'
        + '<div style="font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">Catatan Driver / PIN</div>'
        + '<input id="delivery-note-inp" type="text" placeholder="Contoh: nama driver, PIN loker..." style="width:100%;background:var(--sf2);border:1px solid var(--brd2);border-radius:9px;padding:9px 12px;font-size:13px;color:var(--txt);outline:none;font-family:var(--fn);transition:border .15s" onfocus="this.style.borderColor=\'var(--or)\'" onblur="this.style.borderColor=\'var(--brd2)\'">'
        + '</div>'
        + '</div>'
        + '<div class="pay-mid">'
        + '<div style="flex:1;position:relative;display:flex;flex-direction:column;min-height:0">'
        + '<div class="npd" id="pay-npd" style="flex:1;min-height:0">' + nkHtml + '</div>'
        + '<div id="npd-lock" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,.6);border-radius:12px;flex-direction:column;align-items:center;justify-content:center;gap:8px;pointer-events:none;">'
        + '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
        + '<span style="font-size:11px;color:rgba(255,255,255,.5);font-weight:600">Konfirmasi otomatis</span>'
        + '</div>'
        + '</div>'

        + '<button class="btn-cfm" id="btn-cfm" onclick="pmSel===\'open_bill\'?doOpenBill():doPay(' + grand + ')" disabled>'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        + ' Konfirmasi'
        + '</button>'
        + '</div>'
        + '<div class="pay-right">'
        + '<div id="cash-area" class="cash-area">'
        + '<div class="cash-lbl">Uang Diterima</div>'
        + '<div class="cash-val" id="cash-val">\u2014</div>'
        + '<div class="cash-chg" id="cash-chg" style="display:none">'
        + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        + '<span id="chg-t"></span>'
        + '</div>'
        + '</div>'
        + '<div class="sum-lbl">Rincian Pesanan</div>'
        + '<div class="pay-sum">' + sumItemsHtml + sumTotsHtml + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';

      var ov = document.createElement('div');
      ov.className = 'pay-ov';
      ov.id = 'pay-ov';
      ov.innerHTML = html;
      document.body.appendChild(ov);
      cashIn = ''; pmSel = 'cash';
      // Immediately enable confirm for non-cash
      selPm('cash', grand);
    }

    function selPm(id, tot) {
      pmSel = id;
      var btn_el = document.getElementById('pmb-' + id);
      document.querySelectorAll('.pmb').forEach(function (b) { b.classList.remove('act'); });
      if (btn_el) btn_el.classList.add('act');

      var isDelivery = (id === 'gofood' || id === 'grabfood' || id === 'shopee');
      var isCash = (id === 'cash');
      var isOpenBillMode = (id === 'open_bill');

      var dnw = document.getElementById('delivery-note-wrap');
      var npd = document.getElementById('pay-npd');
      var npdLock = document.getElementById('npd-lock');
      var ca = document.getElementById('cash-area');
      var btn = document.getElementById('btn-cfm');

      // Delivery note field
      if (dnw) dnw.style.display = isDelivery ? 'block' : 'none';

      // Open Bill mode: hide numpad, change button label
      if (isOpenBillMode) {
        if (npdLock) { npdLock.style.display = 'flex'; }
        if (npd) { npd.style.opacity = '0.15'; npd.style.pointerEvents = 'none'; }
        if (ca) { ca.style.opacity = '0.3'; }
        if (btn) { btn.disabled = false; btn.textContent = '📋 Buka Open Bill'; btn.style.background = '#F59E0B'; }
        return;
      }

      // Reset button style
      if (btn) { btn.style.background = ''; btn.textContent = 'Konfirmasi'; }

      // Numpad lock for non-cash methods
      if (npdLock) {
        npdLock.style.display = !isCash ? 'flex' : 'none';
      }
      if (npd) {
        npd.style.opacity = !isCash ? '0.15' : '1';
        npd.style.pointerEvents = !isCash ? 'none' : 'auto';
      }

      // Confirm button state
      if (id === 'cash') {
        if (ca) { ca.style.opacity = '1'; ca.style.display = 'block'; }
        var p = parseInt(cashIn || '0');
        if (btn) btn.disabled = p < tot;
      } else {
        if (ca) { ca.style.opacity = '0.3'; }
        if (btn) btn.disabled = false;
      }
    }
    function cashKey(k, tot) {
      if (k === '⌫') cashIn = cashIn.slice(0, -1);
      else if (k === 'UANG PAS') cashIn = String(tot);
      else cashIn += k;
      var paid = parseInt(cashIn || '0');
      var cv = document.getElementById('cash-val');
      var ca = document.getElementById('cash-area');
      var cc = document.getElementById('cash-chg');
      var btn = document.getElementById('btn-cfm');
      if (cv) cv.textContent = paid > 0 ? fr(paid) : '—';
      if (pmSel === 'cash') {
        if (paid >= tot) {
          if (ca) ca.classList.add('ok');
          if (cc) { cc.style.display = 'flex'; var ct = document.getElementById('chg-t'); if (ct) ct.textContent = 'Kembalian: ' + fr(paid - tot); }
          if (btn) btn.disabled = false;
        } else {
          if (ca) ca.classList.remove('ok');
          if (cc) cc.style.display = 'none';
          if (btn) btn.disabled = true;
        }
      }
    }
    async function proceedWithOrderCreation(orderData, sub, disc, tax, svc, grand, paid, chg, delivNote) {
      var btn = document.getElementById('btn-cfm');
      // Offline sync integration
      if (!navigator.onLine) {
        try {
          if (!window.OfflineSyncManager) {
            throw new Error('Offline Sync Manager tidak tersedia');
          }
          const offlineOrder = await window.OfflineSyncManager.queueOrder(orderData);
          
          var newId = HISTORY.length ? HISTORY[0].id + 1 : 1;
          var now = new Date();
          var hh = String(now.getHours()).padStart(2, '0');
          var mm = String(now.getMinutes()).padStart(2, '0');
          var PM_LABELS = { cash: 'Tunai', qris: 'QRIS', bca: 'BCA', debit: 'Debit', gofood: 'GoFood', grabfood: 'GrabFood', shopee: 'ShopeeFood', transfer: 'Transfer' };
          
          HISTORY.unshift({
            id: newId,
            no: offlineOrder.order_number,
            table: orderData.tableNumber || 'TAKE',
            type: orderType,
            cashier: currentUser ? currentUser.name : 'Kasir',
            time: hh + ':' + mm,
            method: PM_LABELS[pmSel] || pmSel,
            status: 'pending',
            sub: sub, disc: disc, tax: tax, svc: svc, tips: 0, total: grand,
            member: curMember, delivNote: delivNote,
            items: cart.map(function(i) {
               var mods = i.selectedOpts ? Object.values(i.selectedOpts).flat() : [];
               if (i.addonNames) mods = mods.concat(i.addonNames.split(', ').map(a => '+' + a));
               if (i.note) mods.push(i.note);
               return { id: i.id, n: i.n, qty: i.qty, p: i.p, mods: mods };
            })
          });

          document.getElementById('pay-ov')?.remove();
          showSuccess(grand, chg, delivNote);
          toast('Offline: Pesanan disimpan secara lokal!', 'info');
        } catch (err) {
          console.error(err);
          toast('Gagal menyimpan pesanan offline: ' + err.message, 'err');
          if (btn) { btn.innerHTML = 'Konfirmasi'; btn.disabled = false; }
        }
        return;
      }

      try {
        const res = await API.orders.create(orderData);
        if (res.success) {
          var newId = HISTORY.length ? HISTORY[0].id + 1 : 1;
          var now = new Date();
          var hh = String(now.getHours()).padStart(2, '0');
          var mm = String(now.getMinutes()).padStart(2, '0');
          var PM_LABELS = { cash: 'Tunai', qris: 'QRIS', bca: 'BCA', debit: 'Debit', gofood: 'GoFood', grabfood: 'GrabFood', shopee: 'ShopeeFood', transfer: 'Transfer' };
          HISTORY.unshift({
            id: newId,
            no: res.order ? res.order.order_number : ('SNY-' + String(newId + 186).padStart(4, '0')),
            table: orderData.tableNumber || 'TAKE',
            type: orderType,
            cashier: currentUser ? currentUser.name : 'Kasir',
            time: hh + ':' + mm,
            method: PM_LABELS[pmSel] || pmSel,
            status: 'done',
            sub: sub, disc: disc, tax: tax, svc: svc, tips: 0, total: grand,
            member: curMember, delivNote: delivNote,
            items: cart.map(function(i) {
               var mods = i.selectedOpts ? Object.values(i.selectedOpts).flat() : [];
               if (i.addonNames) mods = mods.concat(i.addonNames.split(', ').map(a => '+' + a));
               if (i.note) mods.push(i.note);
               return { id: i.id, n: i.n, qty: i.qty, p: i.p, mods: mods };
            })
          });

          document.getElementById('pay-ov')?.remove();
          showSuccess(grand, chg, delivNote);
        } else {
          toast('Gagal: ' + res.error, 'err');
          if (btn) { btn.innerHTML = 'Konfirmasi'; btn.disabled = false; }
        }
      } catch (err) {
        console.error(err);
        toast('Gagal memproses pesanan: ' + err.message, 'err');
        if (btn) { btn.innerHTML = 'Konfirmasi'; btn.disabled = false; }
      }
    }

    function showManualPaymentModal(method, amount, callback) {
      const isQris = method === 'qris';
      const title = isQris ? 'Pembayaran QRIS Statis' : 'Pembayaran EDC Manual';
      const instructions = isQris 
        ? 'Tunjukkan QRIS Statis di meja kasir ke pelanggan. Minta pelanggan melakukan scan dan transfer.' 
        : 'Gunakan mesin EDC fisik. Gesek/masukkan kartu debit/kredit pelanggan dan masukkan nominal ' + fr(amount) + '.';
      
      const ov = document.createElement('div');
      ov.className = 'pay-ov';
      ov.id = 'manual-pay-ov';
      ov.style.zIndex = '2000';
      
      let visualContent = '';
      if (isQris) {
        visualContent = `
          <div style="background:#fff;padding:12px;border-radius:12px;margin:15px auto;width:150px;height:150px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.1)">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <rect x="0" y="0" width="100" height="100" fill="#fff"/>
              <rect x="10" y="10" width="25" height="25" fill="#1E293B"/>
              <rect x="15" y="15" width="15" height="15" fill="#fff"/>
              <rect x="65" y="10" width="25" height="25" fill="#1E293B"/>
              <rect x="70" y="15" width="15" height="15" fill="#fff"/>
              <rect x="10" y="65" width="25" height="25" fill="#1E293B"/>
              <rect x="15" y="70" width="15" height="15" fill="#fff"/>
              <rect x="45" y="20" width="10" height="10" fill="#1E293B"/>
              <rect x="45" y="45" width="10" height="10" fill="#1E293B"/>
              <rect x="20" y="45" width="10" height="10" fill="#1E293B"/>
              <rect x="65" y="45" width="15" height="10" fill="#1E293B"/>
              <rect x="45" y="65" width="15" height="15" fill="#1E293B"/>
              <rect x="65" y="65" width="10" height="10" fill="#1E293B"/>
              <rect x="80" y="80" width="10" height="10" fill="#1E293B"/>
            </svg>
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:15px;letter-spacing:0.05em">PINDAI QRIS UNTUK BAYAR</div>
        `;
      } else {
        visualContent = `
          <div style="font-size:48px;margin:20px 0;">💳</div>
        `;
      }
      
      ov.innerHTML = `
        <div class="pay-modal" style="max-width:380px;height:auto;padding:24px">
          <div class="pay-head" style="margin-bottom:16px">
            <div class="pay-head-t">${title}</div>
            <div class="pay-x" onclick="document.getElementById('manual-pay-ov').remove(); window.manualPayCallback(false, 'Dibatalkan oleh kasir');">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>
          <div style="text-align:center">
            <div style="font-size:13px;color:var(--txt2);margin-bottom:10px">${instructions}</div>
            <div style="font-size:24px;font-weight:900;color:var(--or);font-family:var(--mo);margin-bottom:15px">${fr(amount)}</div>
            ${visualContent}
            <div style="display:flex;gap:10px;margin-top:20px">
              <button class="btn-cfm" style="flex:1;background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.2)" onclick="document.getElementById('manual-pay-ov').remove(); window.manualPayCallback(false, 'Dana Kurang / Decline');">
                ❌ Gagal
              </button>
              <button class="btn-cfm" style="flex:1;background:#22C55E;color:#fff" onclick="document.getElementById('manual-pay-ov').remove(); window.manualPayCallback(true);">
                ✅ Sukses
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(ov);
      window.manualPayCallback = callback;
    }

    async function doPay(tot) {
      var btn = document.getElementById('btn-cfm');
      if (btn) { btn.innerHTML = 'Memproses...'; btn.disabled = true; }
      
      var paid = pmSel === 'cash' ? parseInt(cashIn || '0') : tot;
      var chg = Math.max(0, paid - tot);
      var delivNote = '';
      var dni = document.getElementById('delivery-note-inp');
      if (dni) delivNote = dni.value || '';

      var { sub, disc, tax, svc, grand } = calcT();

      const orderData = {
        orderType: orderType,
        tableNumber: document.getElementById('tbl-no')?.value || (orderType === 'dine' ? 'T01' : 'TAKE'),
        paymentMethod: pmSel,
        subtotal: sub,
        discount: disc,
        tax: tax,
        serviceCharge: svc,
        total: grand,
        customerName: curMember || null,
        customerPhone: window.curMemberPhone || null,
        payments: [{
           method: pmSel,
           amount: paid,
           change: chg
        }],
        items: cart.map(function(i) {
           var mods = [];
           var apiModifiers = [];
           
           if (i.selectedOpts) {
             Object.entries(i.selectedOpts).forEach(function([groupName, opts]) {
               var optArr = Array.isArray(opts) ? opts : [opts];
               optArr.forEach(function(optName) {
                 mods.push(optName);
                 apiModifiers.push({
                   groupId: 'opt-' + groupName,
                   groupName: groupName,
                   optionId: 'opt-' + optName,
                   optionName: optName,
                   priceAdjustment: 0
                 });
               });
             });
           }
           
           if (i.addonNames) {
             var addonList = i.addonNames.split(', ');
             mods = mods.concat(addonList.map(function(a) { return '+' + a; }));
             addonList.forEach(function(addonName) {
               apiModifiers.push({
                 groupId: 'addon',
                 groupName: 'Add-on',
                 optionId: 'addon-' + addonName,
                 optionName: addonName,
                 priceAdjustment: 0
               });
             });
           }
           
           return {
              productId: String(i.id),
              productName: i.n,
              quantity: i.qty,
              unitPrice: i.p,
              subtotal: i.qty * i.p,
              notes: i.note || null,
              modifiers: apiModifiers
           };
        })
      };

      if (pmSel === 'qris' || pmSel === 'bca' || pmSel === 'debit') {
        showManualPaymentModal(pmSel, grand, async function(success, errorMsg) {
          if (success) {
            await proceedWithOrderCreation(orderData, sub, disc, tax, svc, grand, paid, chg, delivNote);
          } else {
            try {
              if (navigator.onLine) {
                // Removed legacy railway endpoint for payment-failed
              }
            } catch (e) {
              console.error('Failed to log payment failure:', e);
            }
            toast('Pembayaran ' + pmSel.toUpperCase() + ' dibatalkan/gagal!', 'err');
            if (btn) { btn.innerHTML = 'Konfirmasi'; btn.disabled = false; }
          }
        });
        return;
      }

      await proceedWithOrderCreation(orderData, sub, disc, tax, svc, grand, paid, chg, delivNote);
    }

    // Handle Open Bill: create order without payment, send to kitchen
    async function doOpenBill() {
      var btn = document.getElementById('btn-cfm');
      if (btn) { btn.innerHTML = 'Membuka Bill...'; btn.disabled = true; }

      var { sub, disc, tax, svc, grand } = calcT();

      const orderData = {
        orderType: orderType,
        tableNumber: document.getElementById('tbl-no')?.value || (orderType === 'dine' ? 'T01' : 'TAKE'),
        paymentMethod: null,
        subtotal: sub,
        discount: disc,
        tax: tax,
        serviceCharge: svc,
        total: grand,
        customerName: curMember || null,
        customerPhone: window.curMemberPhone || null,
        isOpenBill: true,
        payments: [],
        items: cart.map(function(i) {
           var apiModifiers = [];
           if (i.selectedOpts) {
             Object.entries(i.selectedOpts).forEach(function([groupName, opts]) {
               var optArr = Array.isArray(opts) ? opts : [opts];
               optArr.forEach(function(optName) {
                 apiModifiers.push({
                   groupId: 'opt-' + groupName,
                   groupName: groupName,
                   optionId: 'opt-' + optName,
                   optionName: optName,
                   priceAdjustment: 0
                 });
               });
             });
           }
           if (i.addonNames) {
             i.addonNames.split(', ').forEach(function(addonName) {
               apiModifiers.push({
                 groupId: 'addon',
                 groupName: 'Add-on',
                 optionId: 'addon-' + addonName,
                 optionName: addonName,
                 priceAdjustment: 0
               });
             });
           }
           return {
              productId: String(i.id),
              productName: i.n,
              quantity: i.qty,
              unitPrice: i.p,
              subtotal: i.qty * i.p,
              notes: i.note || null,
              modifiers: apiModifiers
           };
        })
      };

      try {
        const res = await API.orders.createOpenBill(orderData);
        if (res.success) {
          var now = new Date();
          var hh = String(now.getHours()).padStart(2, '0');
          var mm = String(now.getMinutes()).padStart(2, '0');
          HISTORY.unshift({
            id: res.order ? res.order.id : Date.now(),
            no: res.order ? res.order.order_number : 'OB-' + Date.now(),
            table: orderData.tableNumber || 'TAKE',
            type: orderType,
            cashier: currentUser ? currentUser.name : 'Kasir',
            time: hh + ':' + mm,
            method: 'Open Bill',
            status: 'open_bill',
            sub: sub, disc: disc, tax: tax, svc: svc, tips: 0, total: grand,
            member: curMember,
            items: cart.map(function(i) {
               var mods = i.selectedOpts ? Object.values(i.selectedOpts).flat() : [];
               if (i.addonNames) mods = mods.concat(i.addonNames.split(', ').map(a => '+' + a));
               if (i.note) mods.push(i.note);
               return { id: i.id, n: i.n, qty: i.qty, p: i.p, mods: mods };
            })
          });
          document.getElementById('pay-ov')?.remove();
          showOpenBillSuccess(grand, orderData.tableNumber, res.order);
        } else {
          toast('Gagal membuka bill: ' + (res.error || 'Error'), 'err');
          if (btn) { btn.innerHTML = '📋 Buka Open Bill'; btn.disabled = false; }
        }
      } catch (err) {
        console.error(err);
        toast('Gagal memproses open bill: ' + err.message, 'err');
        if (btn) { btn.innerHTML = '📋 Buka Open Bill'; btn.disabled = false; }
      }
    }

    function showOpenBillSuccess(total, tableNo, order) {
      const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'mo-ok';
      ov.innerHTML = `<div class="mo smo"><div class="mo-b" style="padding:24px">
        <div class="sico" style="background:rgba(245,158,11,0.15)"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
        <div class="stitl">Open Bill Dibuka!</div>
        <div class="ssub">Pesanan dikirim ke dapur. Pelanggan bayar saat selesai.</div>
        <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:13px;margin-bottom:14px;text-align:center">
          <div style="font-size:9.5px;font-weight:700;color:#F59E0B;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px">Total Bill</div>
          <div style="font-size:24px;font-weight:900;color:#F59E0B;font-family:var(--mo)">${fr(total)}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:4px">${tableNo ? 'Meja: ' + tableNo : 'Take Away'}</div>
        </div>
        <button class="btn-new" onclick="newOrder()">+ Order Baru</button>
      </div></div>`;
      ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    }


    function showSuccess(total, change, delivNote) {
      const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'mo-ok';
      ov.innerHTML = `<div class="mo smo"><div class="mo-b" style="padding:24px"><div class="sico"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div class="stitl">Pembayaran Berhasil!</div><div class="ssub">Pesanan dikirim ke dapur</div>${change > 0 ? `<div class="chg-box"><div class="chg-lbl">Kembalian</div><div class="chg-amt">${fr(change)}</div></div>` : `<div style="background:var(--orM);border:1px solid rgba(228,84,12,.18);border-radius:12px;padding:13px;margin-bottom:14px;text-align:center"><div style="font-size:9.5px;font-weight:700;color:var(--or);text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px">Total Dibayar</div><div style="font-size:24px;font-weight:900;color:var(--or);font-family:var(--mo)">${fr(total)}</div></div>`}<button class="btn-new" onclick="newOrder()">+ Order Baru</button></div></div>`;
      ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    }
    function newOrder() {
      document.getElementById('mo-ok')?.remove(); cart = []; discount = 0; curMember = null; window.curMemberPhone = null;
      document.getElementById('mem-lbl').textContent = 'Member';
      document.getElementById('mem-pill').classList.remove('on');
      document.getElementById('tbl-no').value = '';
      renderCart(); renderMenu(document.getElementById('msearch').value);
    }

    /* ════════════════════════
       MEMBER MODAL
    ════════════════════════ */
    function showMemModal() {
      memInput = '';
      const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'mo-mem';
      ov.innerHTML = `<div class="mo memmo">
    <div class="mo-h"><div class="mo-t">Cari Member</div><div class="mo-x" onclick="document.getElementById('mo-mem').remove()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div>
    <div class="mo-b">
      <input id="mem-text-inp" type="tel" inputmode="numeric"
        placeholder="Ketuk untuk input nomor HP..."
        autocomplete="off"
        style="width:100%;background:var(--sf2);border:1px solid var(--brd2);border-radius:10px;padding:11px 14px;font-size:18px;font-weight:700;color:var(--txt);outline:none;font-family:var(--mo);margin-bottom:10px;transition:border .15s;display:block;"
        oninput="memTextInput(this.value)"
        onfocus="this.style.borderColor='var(--or)'"
        onblur="this.style.borderColor='var(--brd2)'"
      >
      <div class="mem-npd">
        ${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(k => k ? `<button class="mnk${k === '⌫' ? ' dl' : ''}" onclick="memNpd('${k}')">${k}</button>` : '<div></div>').join('')}
      </div>
      <button class="btn-mem-srch" onclick="doMemSearch()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:5px"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        Cari Member
      </button>
      <div class="mem-res-area" id="mem-res"></div>
      <div class="mem-footer">
        <button class="btn-add-new" onclick="pickMem(null,'new')">+ Daftarkan Pelanggan Baru</button>
        <button class="btn-skip-mem" onclick="pickMem(null,'skip')">Lewati — Lanjut tanpa Member</button>
      </div>
    </div>
  </div>`;
      ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    }

    /* Built-in keyboard */
    function memTextInput(val) {
      memInput = val.replace(/[^0-9]/g, '');
      if (memInput.length >= 8) doMemSearch();
    }
    function memNpd(k) {
      if (k === '⌫') memInput = memInput.slice(0, -1);
      else if (memInput.length < 13) memInput += k;
      updateMemDisp();
      if (memInput.replace(/\D/g, '').length >= 8) doMemSearch();
    }
    function updateMemDisp() {
      const inp = document.getElementById('mem-text-inp');
      if (inp && document.activeElement !== inp) inp.value = memInput;
    }
    function doMemSearch() {
      const clean = memInput.replace(/\D/g, '');
      const res = document.getElementById('mem-res'); if (!res) return;
      if (clean.length < 5) { res.innerHTML = ''; return; }
      const c = MEMBERS[clean] || MEMBERS[clean.slice(0, 11)];
      if (c) {
        const [sc, sl] = SEG[c.seg] || SEG.new;
        res.innerHTML = `<div class="mem-result-card"><div class="mem-res-h"><div class="mem-av">${c.name[0]}</div><div><div class="mem-nm">${c.name}</div><div class="mem-ph">${c.phone}</div><span class="segb ${sc}">${sl}</span></div></div><div class="mem-stats"><div class="mem-stat"><div class="mem-stat-lbl">Kunjungan</div><div class="mem-stat-val">${c.v}×</div></div><div class="mem-stat"><div class="mem-stat-lbl">Total Belanja</div><div class="mem-stat-val">${frS(c.sp)}</div></div></div><button class="btn-pick" onclick="pickMem('${c.name}','found','${clean}')">✓ Pilih Member Ini</button></div>`;
      } else if (clean.length >= 7) {
        res.innerHTML = `<div style="text-align:center;padding:12px;color:var(--txt3);font-size:12px">Tidak ditemukan untuk nomor <strong style="color:var(--txt)">${clean}</strong></div>`;
      }
    }
    function pickMem(name, type, phone) {
      curMember = name;
      window.curMemberPhone = phone;
      const lbl = document.getElementById('mem-lbl'), pill = document.getElementById('mem-pill');
      if (name && type === 'found') { lbl.textContent = name.split(' ')[0]; pill.classList.add('on'); }
      else if (type === 'new') { 
        curMember = 'Pelanggan Baru';
        window.curMemberPhone = memInput.replace(/\D/g, '');
        lbl.textContent = 'Baru'; 
        pill.classList.add('on'); 
        toast('Pelanggan akan didaftarkan saat checkout', 'info'); 
      }
      else { lbl.textContent = 'Member'; pill.classList.remove('on'); window.curMemberPhone = null; }
      document.getElementById('mo-mem')?.remove();
    }

