    /* ════════════════════════
       DISCOUNT
    ════════════════════════ */
    function showDiscModal() {
      const { sub } = calcT();
      const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'mo-disc';
      ov.innerHTML = `<div class="mo dmo"><div class="mo-h"><div class="mo-t">Beri Diskon</div><div class="mo-x" onclick="document.getElementById('mo-disc').remove()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div><div class="mo-b"><p style="font-size:12px;color:var(--txt2);margin-bottom:12px">Subtotal: <strong style="color:var(--txt)">${fr(sub)}</strong></p><div class="disc-presets">${[5, 10, 15, 20, 25].map(p => `<button class="dp" onclick="setDiscPct(${p},${sub})">${p}%</button>`).join('')}</div><input class="disc-inp" id="disc-inp" type="number" value="${discount}" min="0" max="${sub}"><button class="btn-apl" onclick="applyDisc()">Terapkan Diskon</button></div></div>`;
      ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    }
    function setDiscPct(p, sub) { const i = document.getElementById('disc-inp'); if (i) i.value = Math.round(sub * p / 100); }
    function applyDisc() { discount = parseInt(document.getElementById('disc-inp')?.value || '0'); document.getElementById('mo-disc')?.remove(); renderCart(); }

    /* ════════════════════════
       HISTORY
    ════════════════════════ */
    let histOffset = 0;
    let isHistEnd = false;

    function setFilter(f, el) {
      histFilter = f; document.querySelectorAll('.fbt').forEach(b => b.classList.remove('act')); el.classList.add('act');
      histOffset = 0; isHistEnd = false;
      loadHist();
    }
    function histSearch(q) { histQ = q; renderHistUI(); }

    async function loadHist() {
      const el = document.getElementById('hist-items');
      if(histOffset === 0) el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--txt3);font-size:12px">Memuat data...</div>';
      
      try {
        const filters = { limit: 20, offset: histOffset };
        if (histFilter !== 'all') {
          if (histFilter === 'open_bill') {
            filters.status = 'open_bill';
          } else {
            filters.status = histFilter;
          }
        }
        
        const res = await API.orders.getAll(filters);
        if (res && res.orders) {
          const mapped = res.orders.map(o => {
            const d = new Date(o.created_at ? o.created_at.replace(' ', 'T') + (o.created_at.includes('Z') ? '' : 'Z') : Date.now());
            return {
              id: o.id,
              no: o.order_number,
              table: o.table_number || (o.order_type === 'dine' ? 'T??' : 'TAKE'),
              type: o.order_type,
              cashier: o.cashier_name || 'System',
              date: d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'),
              time: String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),
              method: o.payment_method,
              status: o.order_status === 'paid' || o.order_status === 'confirmed' ? 'done' : 
                      o.order_status === 'open_bill' ? 'open_bill' :
                      o.order_status === 'cancelled' ? 'voided' : o.order_status,
              sub: o.subtotal, disc: o.discount, tax: o.tax, svc: o.service_charge, total: o.total,
              items: (o.items || []).map(it => {
                let modsList = it.modifier_names ? it.modifier_names.split(', ') : [];
                if (it.notes) modsList.push(it.notes);
                return {
                  id: it.product_id, n: it.name, qty: it.quantity, p: it.unit_price,
                  mods: modsList
                };
              })
            };
          });
          
          if (histOffset === 0) {
            HISTORY = mapped;
          } else {
            HISTORY = HISTORY.concat(mapped);
          }
          if (mapped.length < 20) isHistEnd = true;
          renderHistUI();
        }
      } catch (e) {
        console.error(e);
        toast('Gagal memuat riwayat', 'err');
      }
    }

    function renderHistUI() {
      const el = document.getElementById('hist-items');
      const items = HISTORY.filter(h => {
        if (histQ) { const q = histQ.toLowerCase(); return h.no.toLowerCase().includes(q) || String(h.table).toLowerCase().includes(q) || h.cashier.toLowerCase().includes(q) || (h.member || '').toLowerCase().includes(q); }
        return true;
      });
      el.innerHTML = '';
      if (!items.length) { el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--txt3);font-size:12px">Tidak ada transaksi</div>'; return; }
      items.forEach(h => {
        const d = document.createElement('div');
        d.className = 'hcard' + (selTxn && selTxn.id === h.id ? ' active' : '') + (h.status === 'voided' || h.status === 'cancelled' ? ' voided' : '');
        const statusLabel = h.status === 'done' ? 'SELESAI' : 
                           h.status === 'open_bill' ? 'OPEN BILL' :
                           (h.status === 'voided' || h.status === 'cancelled') ? 'VOID' : 'TERBUKA';
        const statusColor = h.status === 'open_bill' ? 'open_bill' : h.status;
        d.innerHTML = `<div class="hc-top"><div class="hc-no">${h.no}</div><div class="hc-st ${statusColor}">${statusLabel}</div></div><div class="hc-meta"><span>${h.date} ${h.time} WIB</span><span>${h.type === 'take' ? 'Take Away' : 'Meja ' + h.table}</span><span>${h.cashier}</span><span>${h.method}</span></div><div class="hc-total">${fr(h.total)}</div>`;
        d.onclick = () => selHist(h); el.appendChild(d);
      });

      if (!isHistEnd && !histQ) {
         const btn = document.createElement('button');
         btn.className = 'btn';
         btn.style.width = '100%';
         btn.style.marginTop = '10px';
         btn.style.justifyContent = 'center';
         btn.textContent = 'Muat Lebih Banyak';
         btn.onclick = () => { histOffset += 20; loadHist(); };
         el.appendChild(btn);
      }
    }
    function selHist(h) {
      selTxn = h; renderHistUI();
      document.getElementById('hd-no').textContent = h.no;
      document.getElementById('hd-meta').innerHTML = `<span>${h.date} ${h.time} WIB</span><span>${h.type === 'take' ? 'Take Away' : 'Meja ' + h.table}</span><span>Kasir: ${h.cashier}</span>${h.member ? `<span>Member: ${h.member}</span>` : ''}`;
      document.getElementById('hd-acts').style.display = 'flex';
      document.getElementById('btn-void-o').classList.toggle('off', h.status === 'voided' || h.status === 'open_bill');
      // Show "Bayar Sekarang" button only for open bills
      const payNowBtn = document.getElementById('btn-pay-now');
      if (payNowBtn) payNowBtn.style.display = h.status === 'open_bill' ? 'flex' : 'none';
      const rep = '- '.repeat(22);
      document.getElementById('hd-body').innerHTML = `
    ${h.status === 'voided' ? `<div style="background:var(--rdL);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:10px 13px;margin-bottom:12px;display:flex;align-items:center;gap:10px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rd)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><div><div style="font-size:13px;font-weight:700;color:var(--rd)">Order di-VOID</div><div style="font-size:11px;color:var(--txt3);margin-top:1px">Oleh: ${h.voidBy} · ${h.voidReason}</div></div></div>` : ''}
    <div class="hd-sec"><div class="hd-sec-h"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Detail Pesanan</div>
    ${h.items.map(it => { const m = MENU.find(x => x.id === it.id) || { ico: 'rice', cat: 'main' }; const clr = icoColor(m.cat); return `<div class="hd-item"><div style="width:34px;height:34px;border-radius:8px;background:var(--sf2);display:flex;align-items:center;justify-content:center;flex-shrink:0"><div style="width:18px;height:18px">${ico(m.ico, clr)}</div></div><div style="flex:1;min-width:0"><div class="hd-iname">${it.n}</div>${it.mods && it.mods.length ? `<div class="hd-imod">${it.mods.join(', ')}</div>` : ''}<div class="hd-iqty">${it.qty}× ${fr(it.p)}</div></div><div class="hd-iprice">${fr(it.qty * it.p)}</div></div>`; }).join('')}
    </div>
    <div class="hd-sec"><div class="hd-sec-h"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Rincian Tagihan</div>
    <div class="hd-row"><div class="hd-rl">Subtotal</div><div class="hd-rv">${fr(h.sub)}</div></div>
    ${h.disc > 0 ? `<div class="hd-row"><div class="hd-rl">Diskon</div><div class="hd-rv gn">- ${fr(h.disc)}</div></div>` : ''}
    <div class="hd-row"><div class="hd-rl">Pajak (11%)</div><div class="hd-rv">${fr(h.tax)}</div></div>
    <div class="hd-row"><div class="hd-rl">Service (5%)</div><div class="hd-rv">${fr(h.svc)}</div></div>
    <div class="hd-row" style="background:var(--orM)"><div class="hd-rl" style="font-size:13.5px;font-weight:800;color:var(--txt)">Total</div><div class="hd-rv or" style="font-size:15px">${fr(h.total)}</div></div>
    <div class="hd-row"><div class="hd-rl">Metode</div><div class="hd-rv">${h.method}</div></div></div>
    <div class="rp-paper"><div class="perf"></div><div class="rp-b">
    <div class="rc rb" style="font-size:12px">Nashty Hot Chicken - Galaxy</div>
    <div class="rc" style="font-size:10px;margin-top:1px">Jl. Lotus Tim. RT.004/RW.019, Bekasi</div>
    <div class="rc rsm">081211739055</div>
    <div class="rdiv">${rep}</div>
    <div class="rc">Queue No: ${h.id + 10}</div>
    <div class="rdiv">${rep}</div>
    <div class="rrow rsm"><span>${h.date} ${h.time} WIB</span><span></span></div>
    <div class="rrow rsm"><span>Receipt</span><span>${h.no.replace('SNY-', '')}</span></div>
    <div class="rrow rsm"><span>Kasir</span><span>${h.cashier}</span></div>
    ${h.member ? `<div class="rrow rsm"><span>Member</span><span>${h.member}</span></div>` : ''}
    <div class="rdiv">${rep}</div>
    <div class="rc rb">${h.type === 'take' ? '* Take Away *' : '* Dine In — Meja ' + h.table + ' *'}</div>
    ${h.items.map(it => `<div class="rb rsm" style="margin-top:4px">${it.n}</div><div class="rrow rsm"><span>${it.qty}x @${it.p.toLocaleString('id-ID')}</span><span>${(it.qty * it.p).toLocaleString('id-ID')}</span></div>${it.mods && it.mods.length ? `<div class="rsm" style="padding-left:6px;color:#777">+${it.mods.join(', ')}</div>` : ''}`).join('')}
    <div class="rdiv">${rep}</div>
    <div class="rrow rsm"><span>Subtotal</span><span>${h.sub.toLocaleString('id-ID')}</span></div>
    ${h.disc > 0 ? `<div class="rrow rsm"><span>Diskon</span><span>-${h.disc.toLocaleString('id-ID')}</span></div>` : ''}
    <div class="rrow rsm"><span>Pajak 11%</span><span>${h.tax.toLocaleString('id-ID')}</span></div>
    <div class="rrow rsm"><span>Service 5%</span><span>${h.svc.toLocaleString('id-ID')}</span></div>
    <div class="rdiv">${rep}</div>
    <div class="rrow rb"><span>TOTAL</span><span>${h.total.toLocaleString('id-ID')}</span></div>
    <div class="rrow rsm"><span>${h.method}</span><span>${h.total.toLocaleString('id-ID')}</span></div>
    <div class="rdiv">${rep}</div>
    <div class="rc rsm">📷 NashtyHotChicken  🎵 Nashty.hotchicken</div>
    <div class="rdiv">${rep}</div>
    <div class="rtag">IT AIN'T TASTY IF IT AIN'T NASHTY</div>
    </div><div class="perf"></div></div>`;
    }
    function doPrint() { if (selTxn) toast('Mencetak struk ' + selTxn.no, 'ok'); }

    /* ════════════════════════
       VOID PIN
    ════════════════════════ */
    function closeVoidModal() { document.getElementById("mo-void")?.remove(); }
    function showVoidModal() {
      if (!selTxn || selTxn.status === 'voided') return;
      voidArr = [];
      var html = '<div class="mo vmo" style="width:380px">'
        + '<div class="mo-h"><div class="mo-t">Void Order</div>'
        + '<div class="mo-x" onclick="closeVoidModal()">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div>'
        + '<div class="mo-b">'
        + '<div class="vico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--rd)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>'
        + '<div class="vtitl">Konfirmasi Void</div>'
        + '<div class="vsub">Order <strong>' + selTxn.no + '</strong> — ' + fr(selTxn.total) + '</div>'
        // Reason dropdown
        + '<div style="margin-bottom:12px">'
        + '<div style="font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">Alasan Void</div>'
        + '<select id="void-reason-sel" style="width:100%;background:var(--sf2);border:1px solid var(--brd2);border-radius:9px;padding:9px 12px;font-size:14px;font-weight:600;color:var(--txt);outline:none;font-family:var(--fn);cursor:pointer;appearance:none;-webkit-appearance:none">'
        + '<option value="">-- Pilih alasan --</option>'
        + '<option value="Salah input">Salah input</option>'
        + '<option value="Pembatalan pesanan online">Pembatalan pesanan online</option>'
        + '<option value="Lainnya">Lainnya</option>'
        + '</select>'
        + '</div>'
        // Refund toggle
        + '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--sf2);border:1px solid var(--brd);border-radius:9px;padding:11px 14px;margin-bottom:14px">'
        + '<div><div style="font-size:13px;font-weight:700;color:var(--txt)">Proses Refund</div>'
        + '<div style="font-size:11px;color:var(--txt3);margin-top:1px">Masuk laporan petty cash hari ini</div></div>'
        + '<label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer">'
        + '<input type="checkbox" id="void-refund-chk" style="opacity:0;width:0;height:0">'
        + '<span id="void-refund-track" style="position:absolute;inset:0;background:var(--sf3);border-radius:12px;transition:.2s;border:1px solid var(--brd2)"></span>'
        + '<span id="void-refund-thumb" style="position:absolute;left:3px;top:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.3)"></span>'
        + '</label></div>'
        // PIN
        + '<div class="pin-dots" id="pin-dots-wrap">'
        + '<div class="pdot" id="vd0"></div><div class="pdot" id="vd1"></div>'
        + '<div class="pdot" id="vd2"></div><div class="pdot" id="vd3"></div>'
        + '</div>'
        + '<div class="pin-err" id="verr"></div>'
        + '<div class="pin-pad">'
        + (function () {
          var pinKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'];
          var pinHtml = '';
          pinKeys.forEach(function (k) {
            if (!k) { pinHtml += '<div></div>'; }
            else if (k === 'DEL') { pinHtml += '<button class="ppk dl" onclick="voidPin(this)">&#x232B;</button>'; }
            else { pinHtml += '<button class="ppk" onclick="voidPin(this)">' + k + '</button>'; }
          });
          return pinHtml;
        })()
        + '</div>'
        + '<button class="btn-cv" onclick="closeVoidModal()">Batalkan</button>'
        + '</div></div>';
      var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'mo-void';
      ov.innerHTML = html;
      ov.addEventListener('click', function (e) { if (e.target === ov) closeVoidModal(); });
      document.body.appendChild(ov);
      // Wire toggle visual
      var chk = document.getElementById('void-refund-chk');
      var track = document.getElementById('void-refund-track');
      var thumb = document.getElementById('void-refund-thumb');
      if (chk) {
        chk.addEventListener('change', function () {
          track.style.background = chk.checked ? 'var(--gn)' : 'var(--sf3)';
          thumb.style.left = chk.checked ? '23px' : '3px';
        });
      }
    }
    async function voidPin(k) {
      if (typeof k === 'object') k = k.innerText;
      if (k === '⌫') voidArr.pop(); else if (voidArr.length < 4) voidArr.push(k);
      for (let i = 0; i < 4; i++) { const d = document.getElementById('vd' + i); if (d) d.classList.toggle('on', i < voidArr.length); }
      if (voidArr.length === 4) {
        doVoid(voidArr.join(''));
      }
    }

    async function doVoid(pin) {
      if (!selTxn) return;
      var reasonSel = document.getElementById('void-reason-sel');
      var reason = reasonSel ? reasonSel.value : '';
      if (!reason) {
        var e = document.getElementById('verr');
        if (e) { e.textContent = 'Pilih alasan void terlebih dahulu.'; e.style.color = 'var(--rd)'; }
        voidArr = [];
        for (var i = 0; i < 4; i++) { var d = document.getElementById('vd' + i); if (d) d.classList.remove('on'); }
        return;
      }
      
      const voidBy = API.session.user ? API.session.user.id : null;
      var doRefund = document.getElementById('void-refund-chk')?.checked || false;

      try {
        const res = await API.orders.void(selTxn.id, reason, voidBy, pin);
        if (res.success) {
           document.getElementById('mo-void')?.remove();
           toast('Order ' + selTxn.no + ' berhasil di-void', 'success');
           if (doRefund) {
             REFUNDS.push({ no: selTxn.no, amt: selTxn.total, reason: reason, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) });
             toast('Refund diproses', 'info');
           }
           histOffset = 0; // reset
           loadHist();
           selHist({ ...selTxn, status: 'voided' }); // update local view
        } else {
           throw new Error(res.error || 'Terjadi kesalahan');
        }
      } catch(err) {
        const e = document.getElementById('verr'); if (e) { e.textContent = err.message || 'Gagal koneksi ke server'; e.style.color = 'var(--rd)'; }
        voidArr = []; setTimeout(() => { for (let i = 0; i < 4; i++) { const d = document.getElementById('vd' + i); if (d) d.classList.remove('on'); } const er = document.getElementById('verr'); if (er) er.textContent = ''; }, 1500);
      }
    }

    // Close open bill with payment
    function showPayNowModal() {
      if (!selTxn || selTxn.status !== 'open_bill') return;
      const total = selTxn.total;
      const PMS = [
        { id: 'cash', label: 'Tunai', color: '#22C55E' },
        { id: 'qris', label: 'QRIS', color: '#3B82F6' },
        { id: 'bca', label: 'BCA', color: '#1E40AF' },
        { id: 'debit', label: 'Debit', color: '#A855F7' },
        { id: 'transfer', label: 'Transfer', color: '#06B6D4' },
      ];

      const ov = document.createElement('div');
      ov.className = 'ov'; ov.id = 'mo-paynow';
      ov.innerHTML = `<div class="mo" style="max-width:380px">
        <div class="mo-h">
          <div class="mo-t">💳 Bayar Open Bill</div>
          <div class="mo-x" onclick="document.getElementById('mo-paynow').remove()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>
        <div class="mo-b">
          <div style="text-align:center;margin-bottom:16px">
            <div style="font-size:12px;color:var(--txt3);font-weight:600;text-transform:uppercase;letter-spacing:.06em">Order No.</div>
            <div style="font-size:18px;font-weight:800;color:var(--txt)">${selTxn.no}</div>
            <div style="font-size:28px;font-weight:900;color:var(--or);font-family:var(--mo);margin:4px 0">${fr(total)}</div>
          </div>
          <div style="font-size:11px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Metode Pembayaran</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
            ${PMS.map((pm, i) => `<div class="pmb${i===0?' act':''}" id="pnb-${pm.id}" onclick="document.querySelectorAll('[id^=pnb-]').forEach(b=>b.classList.remove('act'));this.classList.add('act');window._payNowMethod='${pm.id}'" style="padding:10px 6px;border-radius:10px;cursor:pointer;text-align:center;background:var(--sf2);border:1.5px solid var(--brd2);transition:all .15s">
              <div style="font-size:12px;font-weight:700;color:${pm.color}">${pm.label}</div>
            </div>`).join('')}
          </div>
          <button class="btn-cfm" style="width:100%;background:#F59E0B;color:#fff" onclick="doPayNow(${total})">
            ✅ Konfirmasi Pembayaran
          </button>
        </div>
      </div>`;
      window._payNowMethod = 'cash';
      ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    }

    async function doPayNow(total) {
      if (!selTxn || !selTxn.id) { toast('Tidak ada order dipilih', 'err'); return; }
      const paymentMethod = window._payNowMethod || 'cash';
      const btn = document.querySelector('#mo-paynow .btn-cfm');
      if (btn) { btn.innerHTML = 'Memproses...'; btn.disabled = true; }

      try {
        const res = await API.orders.closeBill(selTxn.id, paymentMethod, [{
          method: paymentMethod,
          amount: total,
          change: 0
        }]);

        if (res.success) {
          document.getElementById('mo-paynow')?.remove();
          toast('Open Bill ' + selTxn.no + ' berhasil dibayar!', 'success');
          // Update local entry
          selTxn.status = 'done';
          selTxn.method = paymentMethod;
          histOffset = 0;
          loadHist();
        } else {
          toast('Gagal: ' + (res.error || res.message), 'err');
          if (btn) { btn.innerHTML = '✅ Konfirmasi Pembayaran'; btn.disabled = false; }
        }
      } catch(err) {
        console.error(err);
        toast('Error: ' + err.message, 'err');
        if (btn) { btn.innerHTML = '✅ Konfirmasi Pembayaran'; btn.disabled = false; }
      }
    }

