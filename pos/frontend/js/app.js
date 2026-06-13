    /* ════════════════════════
       TABS
    ════════════════════════ */
    function showTab(name, el) {
      document.querySelectorAll('.mod').forEach(m => m.classList.remove('act'));
      document.querySelectorAll('.ttab').forEach(t => t.classList.remove('act'));
      document.getElementById('mod-' + name).classList.add('act');
      el.classList.add('act');
      if (name === 'hist') loadHist();
      if (name === 'laporan') renderLaporan();
    }

    /* ════════════════════════
       LAPORAN
    ════════════════════════ */
    function renderLaporan() {
      var el = document.getElementById('lap-body'); if (!el) return;
      var PMC = { 'Tunai': '#22C55E', 'QRIS': '#3B82F6', 'BCA': '#1E40AF', 'Debit': '#A855F7', 'GoFood': '#E3175B', 'GrabFood': '#00B14F', 'ShopeeFood': '#EE4D2D', 'Transfer': '#06B6D4' };
      var TYC = { 'dine': '#E4540C', 'take': '#3B82F6', 'gofood': '#E3175B', 'grabfood': '#00B14F', 'shopee': '#EE4D2D', 'GoFood': '#E3175B', 'GrabFood': '#00B14F', 'ShopeeFood': '#EE4D2D' };
      var TYL = { 'dine': 'Dine In', 'take': 'Take Away', 'gofood': 'GoFood', 'grabfood': 'GrabFood', 'shopee': 'ShopeeFood', 'GoFood': 'GoFood', 'GrabFood': 'GrabFood', 'ShopeeFood': 'ShopeeFood' };
      var done = HISTORY.filter(function (h) { return h.status === 'done'; });
      var voided = HISTORY.filter(function (h) { return h.status === 'voided'; });
      var gSales = done.reduce(function (s, h) { return s + (h.sub || 0); }, 0);
      var tDisc = done.reduce(function (s, h) { return s + (h.disc || 0); }, 0);
      var tRefund = REFUNDS.reduce(function (s, r) { return s + r.amt; }, 0);
      var netSales = gSales - tDisc - tRefund;
      var tTax = done.reduce(function (s, h) { return s + (h.tax || 0); }, 0);
      var tSvc = done.reduce(function (s, h) { return s + (h.svc || 0); }, 0);
      var tColl = done.reduce(function (s, h) { return s + h.total; }, 0);
      var pM = {}; done.forEach(function (h) { (h.items || []).forEach(function (it) { if (!pM[it.n]) pM[it.n] = { name: it.n, qty: 0, rev: 0 }; pM[it.n].qty += it.qty; pM[it.n].rev += it.p * it.qty; }); });
      var prods = Object.values(pM).sort(function (a, b) { return b.qty - a.qty; });
      var tItems = prods.reduce(function (s, p) { return s + p.qty; }, 0);
      var tPRev = prods.reduce(function (s, p) { return s + p.rev; }, 0);
      var pmM = {}; done.forEach(function (h) { if (!pmM[h.method]) pmM[h.method] = { label: h.method, count: 0, total: 0 }; pmM[h.method].count++; pmM[h.method].total += h.total; });
      var pms = Object.values(pmM).sort(function (a, b) { return b.total - a.total; });
      var pmT = pms.reduce(function (s, p) { return s + p.count; }, 0);
      var tyM = {}; done.forEach(function (h) { var t = h.type || 'dine'; if (!tyM[t]) tyM[t] = { type: t, count: 0, total: 0 }; tyM[t].count++; tyM[t].total += h.total; });
      var types = Object.values(tyM).sort(function (a, b) { return b.total - a.total; });
      var tyT = types.reduce(function (s, t) { return s + t.count; }, 0);
      var now = new Date();
      var dN = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      var mN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      var ds = dN[now.getDay()] + ', ' + now.getDate() + ' ' + mN[now.getMonth()] + ' ' + now.getFullYear();
      var ps = 500000 - tRefund;
      var h = '<div class="lap-scroll">';
      h += '<div class="lap-bo-note"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' + ds + ' — Laporan hari ini. Riwayat lengkap tersedia di Backoffice.</div>';
      h += '<div class="lap-kpi-strip">' + lapKpi('Gross Sales', frS(gSales), done.length + ' transaksi selesai', '#E4540C') + lapKpi('Net Sales', frS(netSales), 'Setelah diskon & refund', '#16A34A') + lapKpi('Total Transaksi', String(done.length + voided.length), done.length + ' selesai · ' + voided.length + ' void', '#1D4ED8') + lapKpi('Total Refund', frS(tRefund), REFUNDS.length + ' refund diproses', '#DC2626') + '</div>';
      h += '<div><div class="lap-section-lbl">Ringkasan Penjualan</div><div class="lap-sum-table">';
      h += lR('Gross Sales', fr(gSales), 0, 0, 0, ''); h += lR('Diskon', fr(tDisc), 0, 0, 1, ''); h += lR('Refund', fr(tRefund), 0, 0, 1, ''); h += lR('Net Sales', fr(netSales), 1, 1, 0, ''); h += lR('Pajak (11%)', fr(tTax), 0, 0, 0, ''); h += lR('Service (5%)', fr(tSvc), 0, 0, 0, ''); h += lR('COGS', 'Rp 0', 0, 0, 0, 'dim'); h += lR('Total Collected', fr(tColl), 1, 1, 0, 'or');
      h += '</div></div>';
      h += '<div><div class="lap-section-lbl">Penjualan per Tipe Order</div><div class="lap-data-table"><div class="ldt-head ldt-3"><span>Sales Type</span><span>Count</span><span>Total Collected</span></div>';
      if (types.length) { types.forEach(function (t) { var c = TYC[t.type] || '#E4540C'; var l = TYL[t.type] || t.type; h += '<div class="ldt-row ldt-3"><div class="ldt-cell" style="display:flex;align-items:center"><span class="type-dot" style="background:' + c + '"></span>' + l + '</div><div class="ldt-cell">' + t.count.toLocaleString('id-ID') + '</div><div class="ldt-cell b">' + fr(t.total) + '</div></div>'; }); }
      else { h += '<div class="ldt-row ldt-3"><div class="ldt-cell dim" style="grid-column:1/-1;text-align:left;padding:16px 0">Belum ada transaksi hari ini</div></div>'; }
      h += '<div class="ldt-row ldt-3 total-row"><div class="ldt-cell b">Total</div><div class="ldt-cell b">' + tyT.toLocaleString('id-ID') + '</div><div class="ldt-cell or">' + fr(tColl) + '</div></div></div></div>';
      h += '<div><div class="lap-section-lbl">Penjualan per Metode Pembayaran</div><div class="lap-data-table"><div class="ldt-head ldt-3"><span>Metode</span><span>Transaksi</span><span>Total</span></div>';
      if (pms.length) { pms.forEach(function (pm) { var c = PMC[pm.label] || '#E4540C'; h += '<div class="ldt-row ldt-3"><div class="ldt-cell" style="display:flex;align-items:center"><span class="type-dot" style="background:' + c + '"></span>' + pm.label + '</div><div class="ldt-cell">' + pm.count.toLocaleString('id-ID') + '</div><div class="ldt-cell b">' + fr(pm.total) + '</div></div>'; }); }
      else { h += '<div class="ldt-row ldt-3"><div class="ldt-cell dim" style="grid-column:1/-1;text-align:left;padding:16px 0">Belum ada data</div></div>'; }
      h += '<div class="ldt-row ldt-3 total-row"><div class="ldt-cell b">Total</div><div class="ldt-cell b">' + pmT.toLocaleString('id-ID') + '</div><div class="ldt-cell or">' + fr(tColl) + '</div></div></div></div>';
      h += '<div><div class="lap-section-lbl">Produk Terjual</div><div class="lap-data-table"><div class="ldt-head ldt-3"><span>Nama Menu</span><span>Qty Terjual</span><span>Revenue</span></div>';
      if (prods.length) { prods.forEach(function (p, i) { var bg = i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7C3F' : 'rgba(0,0,0,.1)'; var tc = i < 3 ? '#fff' : '#6B6560'; h += '<div class="ldt-row ldt-3"><div class="ldt-cell" style="display:flex;align-items:center"><span class="rank-badge" style="background:' + bg + ';color:' + tc + '">' + (i + 1) + '</span>' + p.name + '</div><div class="ldt-cell">' + p.qty.toLocaleString('id-ID') + '</div><div class="ldt-cell b">' + fr(p.rev) + '</div></div>'; }); }
      else { h += '<div class="ldt-row ldt-3"><div class="ldt-cell dim" style="grid-column:1/-1;text-align:left;padding:16px 0">Belum ada transaksi</div></div>'; }
      h += '<div class="ldt-row ldt-3 total-row"><div class="ldt-cell b">Total Semua Menu</div><div class="ldt-cell b">' + tItems.toLocaleString('id-ID') + '</div><div class="ldt-cell or">' + fr(tPRev) + '</div></div></div></div>';
      h += '<div><div class="lap-section-lbl">Refund &amp; Petty Cash</div><div class="lap-sum-table">';
      h += lR('Saldo Petty Cash Awal', 'Rp 500.000', 0, 0, 0, '');
      if (REFUNDS.length) { REFUNDS.forEach(function (r) { h += lR('Refund — ' + r.no + ' (' + r.reason + ')', fr(r.amt), 0, 0, 0, 'rd'); }); }
      else { h += lR('Belum ada refund hari ini', 'Rp 0', 0, 0, 0, 'dim'); }
      h += lR('Saldo Petty Cash Akhir', fr(Math.max(0, ps)), 1, 1, 0, '');
      h += lR('Total Refund Hari Ini', fr(tRefund), 0, 0, tRefund > 0, tRefund > 0 ? 'rd' : '');
      h += '</div></div>';
      h += '</div>';
      el.innerHTML = h;
    }
    function lapKpi(lbl, val, sub, color) {
      return '<div class="lap-kpi" style="--kc:' + color + '"><div class="lap-kpi-lbl">' + lbl + '</div><div class="lap-kpi-val">' + val + '</div><div class="lap-kpi-sub">' + sub + '</div></div>';
    }
    function renderLaporan() {
      var el = document.getElementById('lap-body'); if (!el) return;
      var PMC = { 'Tunai': '#22C55E', 'QRIS': '#3B82F6', 'BCA': '#1E40AF', 'Debit': '#A855F7', 'GoFood': '#E3175B', 'GrabFood': '#00B14F', 'ShopeeFood': '#EE4D2D', 'Transfer': '#06B6D4' };
      var TYC = { 'dine': '#E4540C', 'take': '#3B82F6', 'gofood': '#E3175B', 'grabfood': '#00B14F', 'shopee': '#EE4D2D', 'GoFood': '#E3175B', 'GrabFood': '#00B14F', 'ShopeeFood': '#EE4D2D' };
      var TYL = { 'dine': 'Dine In', 'take': 'Take Away', 'gofood': 'GoFood', 'grabfood': 'GrabFood', 'shopee': 'ShopeeFood', 'GoFood': 'GoFood', 'GrabFood': 'GrabFood', 'ShopeeFood': 'ShopeeFood' };
      var done = HISTORY.filter(function (h) { return h.status === 'done'; });
      var voided = HISTORY.filter(function (h) { return h.status === 'voided'; });
      var gSales = done.reduce(function (s, h) { return s + (h.sub || 0); }, 0);
      var tDisc = done.reduce(function (s, h) { return s + (h.disc || 0); }, 0);
      var tRefund = REFUNDS.reduce(function (s, r) { return s + r.amt; }, 0);
      var netSales = gSales - tDisc - tRefund;
      var tTax = done.reduce(function (s, h) { return s + (h.tax || 0); }, 0);
      var tSvc = done.reduce(function (s, h) { return s + (h.svc || 0); }, 0);
      var tColl = done.reduce(function (s, h) { return s + h.total; }, 0);
      var pM = {}; done.forEach(function (h) { (h.items || []).forEach(function (it) { if (!pM[it.n]) pM[it.n] = { name: it.n, qty: 0, rev: 0 }; pM[it.n].qty += it.qty; pM[it.n].rev += it.p * it.qty; }); });
      var prods = Object.values(pM).sort(function (a, b) { return b.qty - a.qty; });
      var tItems = prods.reduce(function (s, p) { return s + p.qty; }, 0);
      var tPRev = prods.reduce(function (s, p) { return s + p.rev; }, 0);
      var pmM = {}; done.forEach(function (h) { if (!pmM[h.method]) pmM[h.method] = { label: h.method, count: 0, total: 0 }; pmM[h.method].count++; pmM[h.method].total += h.total; });
      var pms = Object.values(pmM).sort(function (a, b) { return b.total - a.total; });
      var pmT = pms.reduce(function (s, p) { return s + p.count; }, 0);
      var tyM = {}; done.forEach(function (h) { var t = h.type || 'dine'; if (!tyM[t]) tyM[t] = { type: t, count: 0, total: 0 }; tyM[t].count++; tyM[t].total += h.total; });
      var types = Object.values(tyM).sort(function (a, b) { return b.total - a.total; });
      var tyT = types.reduce(function (s, t) { return s + t.count; }, 0);
      var now = new Date();
      var dN = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      var mN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      var ds = dN[now.getDay()] + ', ' + now.getDate() + ' ' + mN[now.getMonth()] + ' ' + now.getFullYear();
      var ps = 500000 - tRefund;
      var h = '<div class="lap-scroll">';
      h += '<div class="lap-bo-note"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' + ds + ' — Laporan hari ini. Riwayat lengkap tersedia di Backoffice.</div>';
      h += '<div class="lap-kpi-strip">' + lapKpi('Gross Sales', frS(gSales), done.length + ' transaksi selesai', '#E4540C') + lapKpi('Net Sales', frS(netSales), 'Setelah diskon & refund', '#16A34A') + lapKpi('Total Transaksi', String(done.length + voided.length), done.length + ' selesai · ' + voided.length + ' void', '#1D4ED8') + lapKpi('Total Refund', frS(tRefund), REFUNDS.length + ' refund diproses', '#DC2626') + '</div>';
      h += '<div><div class="lap-section-lbl">Ringkasan Penjualan</div><div class="lap-sum-table">';
      h += lR('Gross Sales', fr(gSales), 0, 0, 0, ''); h += lR('Diskon', fr(tDisc), 0, 0, 1, ''); h += lR('Refund', fr(tRefund), 0, 0, 1, ''); h += lR('Net Sales', fr(netSales), 1, 1, 0, ''); h += lR('Pajak (11%)', fr(tTax), 0, 0, 0, ''); h += lR('Service (5%)', fr(tSvc), 0, 0, 0, ''); h += lR('COGS', 'Rp 0', 0, 0, 0, 'dim'); h += lR('Total Collected', fr(tColl), 1, 1, 0, 'or');
      h += '</div></div>';
      h += '<div><div class="lap-section-lbl">Penjualan per Tipe Order</div><div class="lap-data-table"><div class="ldt-head ldt-3"><span>Sales Type</span><span>Count</span><span>Total Collected</span></div>';
      if (types.length) { types.forEach(function (t) { var c = TYC[t.type] || '#E4540C'; var l = TYL[t.type] || t.type; h += '<div class="ldt-row ldt-3"><div class="ldt-cell" style="display:flex;align-items:center"><span class="type-dot" style="background:' + c + '"></span>' + l + '</div><div class="ldt-cell">' + t.count.toLocaleString('id-ID') + '</div><div class="ldt-cell b">' + fr(t.total) + '</div></div>'; }); }
      else { h += '<div class="ldt-row ldt-3"><div class="ldt-cell dim" style="grid-column:1/-1;text-align:left;padding:16px 0">Belum ada transaksi hari ini</div></div>'; }
      h += '<div class="ldt-row ldt-3 total-row"><div class="ldt-cell b">Total</div><div class="ldt-cell b">' + tyT.toLocaleString('id-ID') + '</div><div class="ldt-cell or">' + fr(tColl) + '</div></div></div></div>';
      h += '<div><div class="lap-section-lbl">Penjualan per Metode Pembayaran</div><div class="lap-data-table"><div class="ldt-head ldt-3"><span>Metode</span><span>Transaksi</span><span>Total</span></div>';
      if (pms.length) { pms.forEach(function (pm) { var c = PMC[pm.label] || '#E4540C'; h += '<div class="ldt-row ldt-3"><div class="ldt-cell" style="display:flex;align-items:center"><span class="type-dot" style="background:' + c + '"></span>' + pm.label + '</div><div class="ldt-cell">' + pm.count.toLocaleString('id-ID') + '</div><div class="ldt-cell b">' + fr(pm.total) + '</div></div>'; }); }
      else { h += '<div class="ldt-row ldt-3"><div class="ldt-cell dim" style="grid-column:1/-1;text-align:left;padding:16px 0">Belum ada data</div></div>'; }
      h += '<div class="ldt-row ldt-3 total-row"><div class="ldt-cell b">Total</div><div class="ldt-cell b">' + pmT.toLocaleString('id-ID') + '</div><div class="ldt-cell or">' + fr(tColl) + '</div></div></div></div>';
      h += '<div><div class="lap-section-lbl">Produk Terjual</div><div class="lap-data-table"><div class="ldt-head ldt-3"><span>Nama Menu</span><span>Qty Terjual</span><span>Revenue</span></div>';
      if (prods.length) { prods.forEach(function (p, i) { var bg = i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7C3F' : 'rgba(0,0,0,.1)'; var tc = i < 3 ? '#fff' : '#6B6560'; h += '<div class="ldt-row ldt-3"><div class="ldt-cell" style="display:flex;align-items:center"><span class="rank-badge" style="background:' + bg + ';color:' + tc + '">' + (i + 1) + '</span>' + p.name + '</div><div class="ldt-cell">' + p.qty.toLocaleString('id-ID') + '</div><div class="ldt-cell b">' + fr(p.rev) + '</div></div>'; }); }
      else { h += '<div class="ldt-row ldt-3"><div class="ldt-cell dim" style="grid-column:1/-1;text-align:left;padding:16px 0">Belum ada transaksi</div></div>'; }
      h += '<div class="ldt-row ldt-3 total-row"><div class="ldt-cell b">Total Semua Menu</div><div class="ldt-cell b">' + tItems.toLocaleString('id-ID') + '</div><div class="ldt-cell or">' + fr(tPRev) + '</div></div></div></div>';
      h += '<div><div class="lap-section-lbl">Refund &amp; Petty Cash</div><div class="lap-sum-table">';
      h += lR('Saldo Petty Cash Awal', 'Rp 500.000', 0, 0, 0, '');
      if (REFUNDS.length) { REFUNDS.forEach(function (r) { h += lR('Refund — ' + r.no + ' (' + r.reason + ')', fr(r.amt), 0, 0, 0, 'rd'); }); }
      else { h += lR('Belum ada refund hari ini', 'Rp 0', 0, 0, 0, 'dim'); }
      h += lR('Saldo Petty Cash Akhir', fr(Math.max(0, ps)), 1, 1, 0, '');
      h += lR('Total Refund Hari Ini', fr(tRefund), 0, 0, tRefund > 0, tRefund > 0 ? 'rd' : '');
      h += '</div></div>';
      h += '</div>';
      el.innerHTML = h;
    }
    function lapKpi(lbl, val, sub, color) {
      return '<div class="lap-kpi" style="--kc:' + color + '"><div class="lap-kpi-lbl">' + lbl + '</div><div class="lap-kpi-val">' + val + '</div><div class="lap-kpi-sub">' + sub + '</div></div>';
    }
    function lR(lbl, val, isSub, bold, isNeg, vc) {
      if (isNeg) vc = 'neg';
      return '<div class="lst-row' + (isSub ? ' subtotal' : '') + '"><span class="lst-lbl' + (bold ? ' b' : '') + '">' + lbl + '</span><span class="lst-val' + (bold ? ' b' : '') + ' ' + (vc || '') + '">' + val + '</span></div>';
    }


    /* ── INIT ── */
    async function fetchMenuData() {
      if (!API.session.tenantId) {
        API.session.tenantId = 'demo-tenant';
        API.session.outletId = 'demo-outlet';
      }
      try {
        const catRes = await API.categories.getAll();
        if (catRes.success) {
          const freshCats = catRes.data.map(c => ({
            id: c.id,
            label: c.name,
            svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
            isFav: false
          }));
          const favCat = CATS.find(c => c.id === 'fav');
          if (favCat) {
            CATS = [favCat, ...freshCats];
          } else {
            CATS = freshCats;
          }
          initCats();
        }

        const prodRes = await API.products.getAll();
        if (prodRes.success) {
          MENU = prodRes.data.map(p => ({
            id: p.id,
            cat: p.category_id,
            n: p.name,
            p: p.price,
            ico: p.category_name && p.category_name.toLowerCase().includes('minum') ? 'tea' : 'rice',
            d: p.description || '',
            sold: p.status === 'soldout' || p.is_active === 0 || p.status === 'inactive',
            opts: [],
            addons: []
          }));
          renderMenu(document.getElementById('msearch')?.value || '');
        }
      } catch (err) {
        console.error('Failed to fetch menu:', err);
      }
    }

    initLogin();
    fetchMenuData();
    setInterval(fetchMenuData, 30000); // 30s polling
  
    /* ── GLOBAL TOAST NOTIFICATION ── */
    window.toast = function(msg, type = 'info') {
      let tc = document.getElementById('toast-container');
      if (!tc) {
        tc = document.createElement('div');
        tc.id = 'toast-container';
        tc.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(tc);
      }
      const t = document.createElement('div');
      const bg = type === 'err' ? '#EF4444' : type === 'success' ? '#22C55E' : '#1F2937';
      t.style.cssText = `background:${bg};color:#fff;padding:12px 24px;border-radius:8px;font-family:var(--fn);font-size:14px;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.2);opacity:0;transform:translateY(20px);transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`;
      t.textContent = msg;
      tc.appendChild(t);
      
      // Animate in
      requestAnimationFrame(() => {
        t.style.opacity = '1';
        t.style.transform = 'translateY(0)';
      });
      
      // Animate out
      setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(-20px)';
        setTimeout(() => t.remove(), 300);
      }, 3000);
    };
