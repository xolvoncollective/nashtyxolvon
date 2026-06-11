
    /* ── SVG ICONS ── */
    const ICO = {
      rice: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7.5"/><path d="M8 13s1-1.5 4-1.5 4 1.5 4 1.5"/><circle cx="9" cy="11" r=".7" fill="CLR"/><circle cx="15" cy="11" r=".7" fill="CLR"/></svg>',
      chicken: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-1.2 0-2.4.4-3.3 1.2L6 7H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h.5l1.2 7.4c.2 1 1 1.6 2 1.6h8.6c1 0 1.8-.7 2-1.6L19.5 11H20a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-2l-2.7-2.8A4.8 4.8 0 0 0 12 3z"/><line x1="9" y1="11" x2="9.1" y2="17"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="15" y1="11" x2="14.9" y2="17"/></svg>',
      soup: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c-5.5 0-10 2-10 4.5V12c0 5 4.5 9 10 9s10-4 10-9V6.5C22 4 17.5 2 12 2z"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M7 6.5c1.5-1 3.5-1 5 0s3.5 1 5 0"/></svg>',
      noodle: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7c0-2.2 2-4 4.5-4S12 4.8 12 7s-2 4-4.5 4H3V7z"/><path d="M3 11v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"/><path d="M21 11c0-2.2-2-4-4.5-4S12 8.8 12 11"/></svg>',
      satay: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="20" y2="4"/><rect x="7.5" y="8.5" width="4" height="6" rx="2" transform="rotate(45 9.5 11.5)"/><rect x="13" y="4" width="3" height="5" rx="1.5" transform="rotate(45 14.5 6.5)"/></svg>',
      salad: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11c-1.7-1.4-2-4-.5-5.7 1.6-1.8 4.4-1.9 6.1-.2"/><path d="M17 11c1.7-1.4 2-4 .5-5.7-1.6-1.8-4.4-1.9-6.1-.2"/><path d="M4 11h16v2c0 4.4-3.6 8-8 8s-8-3.6-8-8v-2z"/></svg>',
      steak: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4c-2 0-3.5 1.5-3.5 3.5 0 1 .4 1.9 1 2.5L4 21h14l3-7-3-3 1-4-1-3z"/><line x1="9" y1="12" x2="9.01" y2="12"/></svg>',
      bbq: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16a9 9 0 0 1-9 3 9 9 0 0 1-9-3"/><path d="M3 16V7a9 9 0 0 1 18 0v9"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
      fish: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 7C8 7 3 12 3 12s5 5 15 5c3 0 3-2.5 3-5S21 7 18 7z"/><path d="M21 9.5C21 9.5 19.5 11 21 12.5"/><circle cx="16" cy="12" r="1" fill="CLR"/></svg>',
      egg: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 4 7 4 12a8 8 0 0 0 16 0C20 7 17.5 2 12 2z"/><circle cx="12" cy="13" r="3" fill="CLR" opacity=".3"/></svg>',
      tea: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="5"/><line x1="10" y1="2" x2="10" y2="5"/><line x1="14" y1="2" x2="14" y2="5"/></svg>',
      coffee: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M7 2c0 1.5 2 1.5 2 3"/><path d="M11 2c0 1.5 2 1.5 2 3"/></svg>',
      juice: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 3z"/><line x1="3" y1="8" x2="21" y2="8"/><circle cx="12" cy="15" r="1" fill="CLR"/></svg>',
      matcha: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 3z"/><line x1="3" y1="8" x2="21" y2="8"/><path d="M9 5c0 2 3 2 3 4s-3 2-3 4"/></svg>',
      lemon: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 3z"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>',
      milk: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8l1 4H7L8 2z"/><path d="M7 6v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6"/><line x1="10" y1="11" x2="14" y2="11"/></svg>',
      soda: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 3z"/><line x1="3" y1="8" x2="21" y2="8"/><circle cx="10" cy="13" r="1" fill="CLR"/><circle cx="14" cy="11" x2="15" y2="11" r="1" fill="CLR"/></svg>',
      fries: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><line x1="8" y1="10" x2="8" y2="3"/><line x1="12" y1="10" x2="12" y2="2"/><line x1="16" y1="10" x2="16" y2="3"/><path d="M4 8h16a1 1 0 0 1 1 1v1H3V9a1 1 0 0 1 1-1z"/></svg>',
      nugget: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="8" cy="9" rx="4" ry="3" transform="rotate(-15 8 9)"/><ellipse cx="16" cy="8" rx="4" ry="3" transform="rotate(15 16 8)"/><ellipse cx="7" cy="15" rx="4" ry="3" transform="rotate(10 7 15)"/><ellipse cx="17" cy="15" rx="4" ry="3" transform="rotate(-10 17 15)"/></svg>',
      donut: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
      icecream: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5c0 1.6.8 3 2 3.9V22l3-3 3 3V10.9c1.2-1 2-2.3 2-3.9a5 5 0 0 0-5-5z"/></svg>',
      pudding: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8c0-3.3 2.7-6 6-6s6 2.7 6 6v2H6V8z"/><path d="M4 10h16v2c0 4.4-3.6 8-8 8s-8-3.6-8-8v-2z"/><path d="M10 15c.6.5 1.4.5 2 0"/></svg>',
      cake: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2 1 2 1"/><line x1="2" y1="21" x2="22" y2="21"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4c0-1 1-1 1-2s-1-1-1-2"/><path d="M12 4c0-1 1-1 1-2s-1-1-1-2"/><path d="M17 4c0-1 1-1 1-2s-1-1-1-2"/></svg>',
      cheese: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12L12 2l10 10v10H2V12z"/><circle cx="10" cy="13" r="1.5" fill="CLR"/><circle cx="15" cy="17" r="1" fill="CLR"/></svg>',
      sauce: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 5 5 5 9c0 2.4 1.2 4.5 3 5.8V20a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-5.2c1.8-1.3 3-3.4 3-5.8 0-4-3-7-7-7z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>',
      bread: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11a5 5 0 0 1 10 0v9H3v-9z"/><path d="M13 11a5 5 0 0 1 10 0v9h-10v-9z"/></svg>',
      cracker: '<svg viewBox="0 0 24 24" fill="none" stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2" fill="CLR"/><circle cx="16" cy="8" r="1.2" fill="CLR"/><circle cx="8" cy="16" r="1.2" fill="CLR"/><circle cx="16" cy="16" r="1.2" fill="CLR"/><circle cx="12" cy="12" r="1.2" fill="CLR"/></svg>',
    };
    function ico(n, c) { return ICO[n] ? ICO[n].replaceAll('CLR', c) : '<svg viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'; }

    /* ── STAFF & LOGIN DATA ── */
    const STAFF = [
      { id: 'citra', name: 'Citra', role: 'Kasir', pin: '1234', color: '#E4540C' },
      { id: 'budi', name: 'Budi', role: 'Kasir', pin: '2345', color: '#3B82F6' },
      { id: 'ani', name: 'Ani', role: 'Kasir', pin: '3456', color: '#22C55E' },
      { id: 'admin', name: 'Admin', role: 'Manager', pin: '0000', color: '#A855F7' },
    ];
    let loginSel = null, loginPinArr = [], currentUser = null;

    /* ── MENU DATA — 10 items per tab ── */
    const CATS = [
      { id: 'fav', label: 'Favorit', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', isFav: true },
      { id: 'main', label: 'Makanan', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>' },
      { id: 'bar', label: 'Minuman', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 3z"/><line x1="3" y1="8" x2="21" y2="8"/></svg>' },
      { id: 'snack', label: 'Camilan', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><line x1="8" y1="10" x2="8" y2="3"/><line x1="12" y1="10" x2="12" y2="2"/><line x1="16" y1="10" x2="16" y2="3"/></svg>' },
      { id: 'dessert', label: 'Dessert', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5c0 1.6.8 3 2 3.9V22l3-3 3 3V10.9c1.2-1 2-2.3 2-3.9a5 5 0 0 0-5-5z"/></svg>' },
      { id: 'addon', label: 'Add On', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' },
    ];
    const MENU = [
      // MAKANAN (10)
      { id: 1, cat: 'main', n: 'Nasi Goreng Spesial', p: 35000, ico: 'rice', d: 'Telur mata sapi & kerupuk', opts: [{ label: 'Kepedasan', type: 'single', choices: ['Tidak Pedas', 'Pedas Sedang', 'Pedas Extra'] }], addons: [{ n: 'Extra Telur', p: 5000 }, { n: 'Extra Nasi', p: 6000 }, { n: 'Kerupuk', p: 3000 }] },
      { id: 2, cat: 'main', n: 'Ayam Bakar Madu', p: 55000, ico: 'chicken', d: 'Bumbu kacang & lalapan', opts: [{ label: 'Level Pedas', type: 'single', choices: ['Original', 'Pedas Sedang', 'Pedas Extra'] }], addons: [{ n: 'Extra Sambal', p: 3000 }, { n: 'Lalapan', p: 4000 }, { n: 'Nasi Putih', p: 6000 }] },
      { id: 3, cat: 'main', n: 'Rawon Spesial', p: 42000, ico: 'soup', d: 'Kluwek hitam, sapi empuk', opts: [{ label: 'Tambahan', type: 'multi', choices: ['Tambah Nasi', 'Telur Asin', 'Extra Sambal'] }] },
      { id: 4, cat: 'main', n: 'Mie Goreng Jawa', p: 30000, ico: 'noodle', d: 'Pedas manis tradisional', sold: true },
      { id: 5, cat: 'main', n: 'Sate Ayam 10pcs', p: 45000, ico: 'satay', d: 'Bumbu kacang + lontong', opts: [{ label: 'Bumbu', type: 'single', choices: ['Kacang', 'Kecap', 'Mix'] }], addons: [{ n: 'Extra Sate 5pcs', p: 22500 }, { n: 'Lontong', p: 5000 }] },
      { id: 6, cat: 'main', n: 'Gado-Gado', p: 28000, ico: 'salad', d: 'Sayur segar + bumbu kacang' },
      { id: 7, cat: 'main', n: 'Nasi Uduk Komplit', p: 38000, ico: 'rice', d: 'Lauk lengkap + emping', opts: [{ label: 'Kepedasan', type: 'single', choices: ['Biasa', 'Pedas'] }] },
      { id: 8, cat: 'main', n: 'Sop Buntut', p: 65000, ico: 'soup', d: 'Kuah bening, buntut empuk', opts: [{ label: 'Tambahan', type: 'multi', choices: ['Extra Nasi', 'Extra Buntut'] }] },
      { id: 9, cat: 'main', n: 'Pecel Lele', p: 32000, ico: 'fish', d: 'Lele goreng + sambal bawang' },
      { id: 10, cat: 'main', n: 'Ayam Geprek', p: 38000, ico: 'chicken', d: 'Crispy + sambal bawang', opts: [{ label: 'Level', type: 'single', choices: ['Level 1', 'Level 2', 'Level 3'] }] },
      // MINUMAN (10)
      { id: 11, cat: 'bar', n: 'Es Teh Manis', p: 8000, ico: 'tea', d: 'Teh tubruk segar', opts: [{ label: 'Tingkat Manis', type: 'single', choices: ['Normal', 'Kurang Manis', 'Tanpa Gula'] }] },
      { id: 12, cat: 'bar', n: 'Kopi Susu Aren', p: 22000, ico: 'coffee', d: 'Cold brew + oat milk', opts: [{ label: 'Suhu', type: 'single', choices: ['Dingin', 'Hangat'] }, { label: 'Ekstra', type: 'multi', choices: ['Extra Shot', 'Extra Aren'] }], addons: [{ n: 'Oat Milk Upgrade', p: 5000 }, { n: 'Extra Shot', p: 8000 }] },
      { id: 13, cat: 'bar', n: 'Jus Alpukat', p: 18000, ico: 'juice', d: 'Alpukat segar + cokelat', opts: [{ label: 'Ukuran', type: 'single', choices: ['Regular', 'Large'] }] },
      { id: 14, cat: 'bar', n: 'Matcha Latte', p: 25000, ico: 'matcha', d: 'Matcha premium grade', opts: [{ label: 'Suhu', type: 'single', choices: ['Dingin', 'Hangat'] }, { label: 'Susu', type: 'single', choices: ['Oat Milk', 'Full Cream'] }] },
      { id: 15, cat: 'bar', n: 'Lemon Tea', p: 14000, ico: 'lemon', d: 'Segar & menyegarkan' },
      { id: 16, cat: 'bar', n: 'Es Jeruk Peras', p: 12000, ico: 'juice', d: 'Jeruk segar, tanpa sirup' },
      { id: 17, cat: 'bar', n: 'Kopi Americano', p: 18000, ico: 'coffee', d: 'Double shot espresso', opts: [{ label: 'Suhu', type: 'single', choices: ['Dingin', 'Hangat'] }] },
      { id: 18, cat: 'bar', n: 'Susu Segar', p: 10000, ico: 'milk', d: 'Susu murni dingin' },
      { id: 19, cat: 'bar', n: 'Air Mineral', p: 5000, ico: 'soda', d: 'Aqua 600ml' },
      { id: 20, cat: 'bar', n: 'Es Kelapa Muda', p: 20000, ico: 'juice', d: 'Kelapa muda + jelly' },
      // CAMILAN (10)
      { id: 21, cat: 'snack', n: 'French Fries', p: 22000, ico: 'fries', d: 'Crispy + saus spesial', opts: [{ label: 'Saus', type: 'multi', choices: ['Tomat', 'Mayo', 'Keju'] }], addons: [{ n: 'Extra Saus', p: 3000 }, { n: 'Cheese Dip', p: 7000 }] },
      { id: 22, cat: 'snack', n: 'Nugget Ayam', p: 25000, ico: 'nugget', d: 'Golden crispy 10 pcs', opts: [{ label: 'Saus', type: 'multi', choices: ['BBQ', 'Pedas', 'Mayo'] }] },
      { id: 23, cat: 'snack', n: 'Pisang Goreng', p: 15000, ico: 'donut', d: 'Pisang kepok + keju' },
      { id: 24, cat: 'snack', n: 'Tahu Crispy', p: 12000, ico: 'donut', d: 'Tahu bulat goreng renyah' },
      { id: 25, cat: 'snack', n: 'Cireng Bumbu', p: 14000, ico: 'cracker', d: 'Aci goreng pedas manis', opts: [{ label: 'Level', type: 'single', choices: ['Biasa', 'Pedas'] }] },
      { id: 26, cat: 'snack', n: 'Risoles Mayo', p: 13000, ico: 'bread', d: 'Kulit crepe + ayam + mayo' },
      { id: 27, cat: 'snack', n: 'Keripik Singkong', p: 10000, ico: 'cracker', d: 'Renyah + bumbu balado' },
      { id: 28, cat: 'snack', n: 'Onigiri', p: 18000, ico: 'rice', d: 'Nasi kepal isi tuna/salmon', opts: [{ label: 'Isi', type: 'single', choices: ['Tuna', 'Salmon', 'Ayam'] }] },
      { id: 29, cat: 'snack', n: 'Tempe Mendoan', p: 10000, ico: 'cracker', d: 'Tempe tipis tepung gurih' },
      { id: 30, cat: 'snack', n: 'Spring Roll', p: 20000, ico: 'bread', d: 'Lumpia goreng + saus asam manis' },
      // DESSERT (10)
      { id: 31, cat: 'dessert', n: 'Es Krim Cokelat', p: 18000, ico: 'icecream', d: 'Double scoop premium', opts: [{ label: 'Topping', type: 'multi', choices: ['Choco Chips', 'Oreo', 'Sprinkles'] }], addons: [{ n: 'Extra Scoop', p: 9000 }, { n: 'Waffle Cone', p: 6000 }] },
      { id: 32, cat: 'dessert', n: 'Pudding Mangga', p: 15000, ico: 'pudding', d: 'Saus mangga alphonso' },
      { id: 33, cat: 'dessert', n: 'Brownies Kukus', p: 20000, ico: 'cake', d: 'Cokelat lembut + moist' },
      { id: 34, cat: 'dessert', n: 'Klepon', p: 12000, ico: 'donut', d: 'Bola gula merah + kelapa', sold: true },
      { id: 35, cat: 'dessert', n: 'Tiramisu Cup', p: 28000, ico: 'cake', d: 'Mascarpone + espresso' },
      { id: 36, cat: 'dessert', n: 'Crème Brûlée', p: 32000, ico: 'pudding', d: 'Vanilla custard + karamel' },
      { id: 37, cat: 'dessert', n: 'Pancake Stack', p: 25000, ico: 'cake', d: '3 layer + maple syrup', opts: [{ label: 'Topping', type: 'multi', choices: ['Butter', 'Nutella', 'Fresh Berry'] }] },
      { id: 38, cat: 'dessert', n: 'Mochi Ice Cream', p: 22000, ico: 'icecream', d: 'Isi es krim 3 pcs', opts: [{ label: 'Rasa', type: 'multi', choices: ['Vanila', 'Stroberi', 'Matcha'] }] },
      { id: 39, cat: 'dessert', n: 'Es Campur', p: 16000, ico: 'icecream', d: 'Cincau + kolang-kaling' },
      { id: 40, cat: 'dessert', n: 'Panna Cotta', p: 24000, ico: 'pudding', d: 'Saus raspberry segar' },
      // ADD ON (10)
      { id: 41, cat: 'addon', n: 'Extra Keju', p: 5000, ico: 'cheese', d: 'Cheddar leleh' },
      { id: 42, cat: 'addon', n: 'Extra Saus Kacang', p: 4000, ico: 'sauce', d: 'Bumbu kacang special' },
      { id: 43, cat: 'addon', n: 'Nasi Putih', p: 6000, ico: 'rice', d: 'Nasi pulen panas' },
      { id: 44, cat: 'addon', n: 'Telur Ceplok', p: 7000, ico: 'egg', d: 'Mata sapi setengah matang' },
      { id: 45, cat: 'addon', n: 'Kerupuk', p: 3000, ico: 'cracker', d: 'Kerupuk udang renyah' },
      { id: 46, cat: 'addon', n: 'Teh Manis Hangat', p: 5000, ico: 'tea', d: 'Teh pendamping' },
      { id: 47, cat: 'addon', n: 'Extra Sambal', p: 3000, ico: 'sauce', d: 'Sambal bajak spesial' },
      { id: 48, cat: 'addon', n: 'Lalapan', p: 4000, ico: 'salad', d: 'Timun + kemangi + kol' },
      { id: 49, cat: 'addon', n: 'Extra Nasi', p: 6000, ico: 'rice', d: 'Tambah nasi putih' },
      { id: 50, cat: 'addon', n: 'Minuman Pendamping', p: 8000, ico: 'milk', d: 'Susu UHT / teh kotak' },
    ];
    const HISTORY = [
      { id: 1, no: 'SNY-0187', table: 'T12', type: 'dine', cashier: 'Citra', time: '14:18', method: 'QRIS', status: 'done', sub: 129000, disc: 0, tax: 14190, svc: 6450, total: 149640, member: 'Ahmad Sudirman', items: [{ id: 1, n: 'Nasi Goreng Spesial', qty: 2, p: 35000, mods: ['Pedas Extra'] }, { id: 12, n: 'Kopi Susu Aren', qty: 1, p: 22000, mods: ['Dingin', 'Extra Shot'] }, { id: 21, n: 'French Fries', qty: 1, p: 22000, mods: ['Keju'] }] },
      { id: 2, no: 'SNY-0186', table: 'TAKE', type: 'take', cashier: 'Budi', time: '14:05', method: 'Tunai', status: 'done', sub: 55000, disc: 0, tax: 6050, svc: 2750, total: 63800, member: null, items: [{ id: 2, n: 'Ayam Bakar Madu', qty: 1, p: 55000, mods: ['Original'] }] },
      { id: 3, no: 'SNY-0185', table: 'T07', type: 'dine', cashier: 'Citra', time: '13:45', method: 'Debit', status: 'done', sub: 115000, disc: 10000, tax: 11550, svc: 5250, total: 121800, member: 'Rina Kusuma', items: [{ id: 3, n: 'Rawon Spesial', qty: 2, p: 42000, mods: ['Telur Asin'] }, { id: 11, n: 'Es Teh Manis', qty: 2, p: 8000, mods: ['Kurang Manis'] }] },
      { id: 4, no: 'SNY-0184', table: 'T03', type: 'dine', cashier: 'Ani', time: '13:22', method: 'QRIS', status: 'voided', sub: 97000, disc: 0, tax: 10670, svc: 4850, total: 112520, member: null, voidBy: 'Manager', voidReason: 'Kesalahan input menu', items: [{ id: 5, n: 'Sate Ayam 10pcs', qty: 1, p: 45000, mods: ['Kacang'] }, { id: 32, n: 'Pudding Mangga', qty: 2, p: 15000, mods: [] }] },
      { id: 5, no: 'SNY-0183', table: 'T15', type: 'dine', cashier: 'Budi', time: '13:10', method: 'Tunai', status: 'done', sub: 165000, disc: 0, tax: 18150, svc: 8250, total: 191400, member: 'Doni Prasetyo', items: [{ id: 2, n: 'Ayam Bakar Madu', qty: 2, p: 55000, mods: ['Pedas Sedang'] }, { id: 13, n: 'Jus Alpukat', qty: 2, p: 18000, mods: ['Large'] }] },
      { id: 6, no: 'SNY-0182', table: 'TAKE', type: 'take', cashier: 'Citra', time: '12:58', method: 'Transfer', status: 'done', sub: 60000, disc: 5000, tax: 6050, svc: 2750, total: 63800, member: 'Siti Fatimah', items: [{ id: 14, n: 'Matcha Latte', qty: 1, p: 25000, mods: ['Dingin', 'Oat Milk'] }, { id: 22, n: 'Nugget Ayam', qty: 1, p: 25000, mods: ['BBQ'] }] },
      { id: 8, no: 'SNY-0180', table: 'GoFood', type: 'gofood', cashier: 'Citra', time: '11:45', method: 'GoFood', status: 'done', sub: 80000, disc: 0, tax: 8800, svc: 4000, total: 92800, member: null, items: [{ id: 2, n: 'Ayam Bakar Madu', qty: 1, p: 55000, mods: ['Pedas Sedang'] }, { id: 11, n: 'Es Teh Manis', qty: 1, p: 8000, mods: [] }, { id: 43, n: 'Nasi Putih', qty: 1, p: 6000, mods: [] }] },
      { id: 9, no: 'SNY-0179', table: 'GrabFood', type: 'grabfood', cashier: 'Budi', time: '11:22', method: 'GrabFood', status: 'done', sub: 55000, disc: 0, tax: 6050, svc: 2750, total: 63800, member: null, items: [{ id: 2, n: 'Ayam Bakar Madu', qty: 1, p: 55000, mods: ['Original'] }] },
      { id: 10, no: 'SNY-0178', table: 'ShopeeFood', type: 'shopee', cashier: 'Ani', time: '10:58', method: 'ShopeeFood', status: 'done', sub: 70000, disc: 0, tax: 7700, svc: 3500, total: 81200, member: null, items: [{ id: 10, n: 'Ayam Geprek', qty: 1, p: 38000, mods: ['Level 2'] }, { id: 43, n: 'Nasi Putih', qty: 2, p: 6000, mods: [] }, { id: 11, n: 'Es Teh Manis', qty: 1, p: 8000, mods: ['Normal'] }] },
      { id: 7, no: 'SNY-0181', table: 'T09', type: 'dine', cashier: 'Ani', time: '12:32', method: 'QRIS', status: 'voided', sub: 83000, disc: 0, tax: 9130, svc: 4150, total: 96280, member: null, voidBy: 'Manager', voidReason: 'Permintaan pelanggan', items: [{ id: 1, n: 'Nasi Goreng Spesial', qty: 1, p: 35000, mods: ['Tidak Pedas'] }, { id: 31, n: 'Es Krim Cokelat', qty: 1, p: 18000, mods: ['Oreo'] }, { id: 15, n: 'Lemon Tea', qty: 2, p: 14000, mods: [] }] },
    ];

    /* ── STATE ── */
    let cart = [], curCat = 'main', discount = 0, curMember = null, orderType = 'dine', favorites = new Set();
    let selTxn = null, histFilter = 'all', histQ = '', voidArr = [], pmSel = 'cash', cashIn = '';
    var REFUNDS = [];
    let memInput = '', memMode = 'npd';
    const VOID_PIN = '1234';
    const fr = n => 'Rp ' + n.toLocaleString('id-ID');
    const frS = n => n >= 1e6 ? 'Rp ' + (n / 1e6).toFixed(1) + 'jt' : n >= 1e3 ? 'Rp ' + (n / 1e3).toFixed(0) + 'rb' : 'Rp ' + n;
    const pad = n => String(n).padStart(2, '0');
    const MEMBERS = { '08123456789': { name: 'Ahmad Sudirman', phone: '0812-3456-789', seg: 'vip', v: 34, sp: 3240000 }, '08578765432': { name: 'Rina Kusuma', phone: '0857-8765-432', seg: 'loyal', v: 16, sp: 1120000 }, '08781234567': { name: 'Doni Prasetyo', phone: '0878-1234-567', seg: 'regular', v: 5, sp: 345000 } };
    const SEG = { vip: ['s-vip', '⭐ VIP'], loyal: ['s-loy', 'Loyal'], regular: ['s-reg', 'Reguler'], new: ['s-new', 'Baru'] };
    function icoColor(cat) { if (cat === 'bar') return '#3B82F6'; if (cat === 'dessert') return '#A855F7'; if (cat === 'addon') return '#22C55E'; return '#E4540C'; }

    /* ── CLOCK ── */
    function tick() { const n = new Date(); document.getElementById('clk').textContent = pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds()); }
    setInterval(tick, 1000); tick();

    /* ── THEME ── */
    function toggleTheme() { document.body.classList.toggle('day'); const d = document.body.classList.contains('day'); document.getElementById('ico-sun').style.display = d ? 'none' : 'block'; document.getElementById('ico-moon').style.display = d ? 'block' : 'none'; }

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

    /* ════════════════════════
       TABS
    ════════════════════════ */
    function showTab(name, el) {
      document.querySelectorAll('.mod').forEach(m => m.classList.remove('act'));
      document.querySelectorAll('.ttab').forEach(t => t.classList.remove('act'));
      document.getElementById('mod-' + name).classList.add('act');
      el.classList.add('act');
      if (name === 'hist') renderHist();
      if (name === 'laporan') renderLaporan();
    }

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
          + '<span>' + g.label + '</span>'
          + '<span style="font-size:9px;padding:2px 8px;border-radius:8px;background:var(--blL);color:var(--bl)">' + (g.type === 'single' ? 'Pilih 1' : 'Multi-pilih') + '</span>'
          + '</div>';
        g.choices.forEach(ch => {
          const sel = curOpts[g.label] && (Array.isArray(curOpts[g.label]) ? curOpts[g.label].includes(ch) : curOpts[g.label] === ch);
          const t = g.type === 'single' ? 'radio' : 'checkbox';
          optsHtml += '<label class="opts-choice' + (sel ? ' sel' : '') + '" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--sf2);border:1px solid ' + (sel ? 'rgba(228,84,12,.4)' : 'var(--brd)') + ';border-radius:9px;cursor:pointer;margin-bottom:5px;transition:all .1s">'
            + '<input type="' + t + '" name="og-' + menuId + '-' + gi + '" value="' + ch + '" ' + (sel ? 'checked' : '')
            + ' style="width:16px;height:16px;accent-color:var(--or);cursor:pointer">'
            + '<span style="font-size:13px;font-weight:600;color:var(--txt)">' + ch + '</span>'
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

    /* ════════════════════════
       CART
    ════════════════════════ */
    function toggleFav(id) {
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
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
      cart = []; discount = 0; curMember = null; document.getElementById('mem-lbl').textContent = 'Member';
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
      const tax = Math.round(base * .11); const svc = Math.round(base * .05);
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
      ];

      // Build order summary without nested template literals
      var sumItemsHtml = '';
      cart.forEach(function (it) {
        var mods = it.selectedOpts ? Object.values(it.selectedOpts).flat() : [];
        if (it.addonNames) mods = mods.concat(it.addonNames.split(', ').map(function (a) { return '+' + a; }));
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
        var lstyle = isLocked ? style + 'opacity:.3;cursor:not-allowed;pointer-events:none;' : style;
        pmHtml += '<div class="pmb' + act + '" id="pmb-' + pm.id + '" onclick="selPm(\'' + pm.id + '\',' + grand + ')" style="' + lstyle + '">'
          + '<div class="pmb-ico">' + pm.svg + '</div>'
          + '<div class="pmb-lbl">' + pm.label + '</div>'
          + (isLocked ? '<div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:2px;font-weight:600">Khusus Delivery</div>' : '')
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

        + '<button class="btn-cfm" id="btn-cfm" onclick="doPay(' + grand + ')" disabled>'
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
    }

    function selPm(id, tot) {
      pmSel = id;
      var btn_el = document.getElementById('pmb-' + id);
      document.querySelectorAll('.pmb').forEach(function (b) { b.classList.remove('act'); });
      if (btn_el) btn_el.classList.add('act');

      var ca = document.getElementById('cash-area');
      var btn = document.getElementById('btn-cfm');
      var dnw = document.getElementById('delivery-note-wrap');
      var npd = document.getElementById('pay-npd');
      var npdLock = document.getElementById('npd-lock');


      var isDelivery = (id === 'gofood' || id === 'grabfood' || id === 'shopee');


      // Delivery note field
      if (dnw) dnw.style.display = isDelivery ? 'block' : 'none';

      // Numpad lock for delivery methods
      if (npdLock) {
        npdLock.style.display = isDelivery ? 'flex' : 'none';
      }
      if (npd) {
        npd.style.opacity = isDelivery ? '0.15' : '1';
        npd.style.pointerEvents = isDelivery ? 'none' : 'auto';
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
    function doPay(tot) {
      var btn = document.getElementById('btn-cfm');
      if (btn) { btn.innerHTML = 'Memproses...'; btn.disabled = true; }
      setTimeout(function () {
        var paid = pmSel === 'cash' ? parseInt(cashIn || '0') : tot;
        var chg = Math.max(0, paid - tot);
        var delivNote = '';
        var dni = document.getElementById('delivery-note-inp');
        if (dni) delivNote = dni.value || '';
        var tips = 0;

        // ── Push to HISTORY so it shows in Riwayat ──
        var { sub, disc, tax, svc, grand } = calcT();
        var newId = HISTORY.length ? HISTORY[0].id + 1 : 1;
        var now = new Date();
        var hh = String(now.getHours()).padStart(2, '0');
        var mm = String(now.getMinutes()).padStart(2, '0');
        var PM_LABELS = { cash: 'Tunai', qris: 'QRIS', bca: 'BCA', debit: 'Debit', gofood: 'GoFood', grabfood: 'GrabFood', shopee: 'ShopeeFood', transfer: 'Transfer' };
        var txn = {
          id: newId,
          no: 'SNY-' + String(newId + 186).padStart(4, '0'),
          table: document.getElementById('tbl-no')?.value || (orderType === 'dine' ? 'T01' : 'TAKE'),
          type: orderType,
          cashier: currentUser ? currentUser.name : 'Kasir',
          time: hh + ':' + mm,
          method: PM_LABELS[pmSel] || pmSel,
          status: 'done',
          sub: sub,
          disc: disc,
          tax: tax,
          svc: svc,
          tips: tips,
          total: grand,
          member: curMember,
          delivNote: delivNote,
          items: cart.map(function (i) {
            var mods = i.selectedOpts ? Object.values(i.selectedOpts).flat() : [];
            if (i.addonNames) mods = mods.concat(i.addonNames.split(', ').map(function (a) { return '+' + a; }));
            return { id: i.id, n: i.n, qty: i.qty, p: i.p, mods: mods };
          })
        };
        HISTORY.unshift(txn);

        document.getElementById('pay-ov')?.remove();
        showSuccess(grand, chg, delivNote);
      }, 900);
    }


    function showSuccess(total, change, delivNote) {
      const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'mo-ok';
      ov.innerHTML = `<div class="mo smo"><div class="mo-b" style="padding:24px"><div class="sico"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div class="stitl">Pembayaran Berhasil!</div><div class="ssub">Pesanan dikirim ke dapur</div>${change > 0 ? `<div class="chg-box"><div class="chg-lbl">Kembalian</div><div class="chg-amt">${fr(change)}</div></div>` : `<div style="background:var(--orM);border:1px solid rgba(228,84,12,.18);border-radius:12px;padding:13px;margin-bottom:14px;text-align:center"><div style="font-size:9.5px;font-weight:700;color:var(--or);text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px">Total Dibayar</div><div style="font-size:24px;font-weight:900;color:var(--or);font-family:var(--mo)">${fr(total)}</div></div>`}<button class="btn-new" onclick="newOrder()">+ Order Baru</button></div></div>`;
      ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    }
    function newOrder() {
      document.getElementById('mo-ok')?.remove(); cart = []; discount = 0; curMember = null;
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
        res.innerHTML = `<div class="mem-result-card"><div class="mem-res-h"><div class="mem-av">${c.name[0]}</div><div><div class="mem-nm">${c.name}</div><div class="mem-ph">${c.phone}</div><span class="segb ${sc}">${sl}</span></div></div><div class="mem-stats"><div class="mem-stat"><div class="mem-stat-lbl">Kunjungan</div><div class="mem-stat-val">${c.v}×</div></div><div class="mem-stat"><div class="mem-stat-lbl">Total Belanja</div><div class="mem-stat-val">${frS(c.sp)}</div></div></div><button class="btn-pick" onclick="pickMem('${c.name}','found')">✓ Pilih Member Ini</button></div>`;
      } else if (clean.length >= 7) {
        res.innerHTML = `<div style="text-align:center;padding:12px;color:var(--txt3);font-size:12px">Tidak ditemukan untuk nomor <strong style="color:var(--txt)">${clean}</strong></div>`;
      }
    }
    function pickMem(name, type) {
      curMember = name;
      const lbl = document.getElementById('mem-lbl'), pill = document.getElementById('mem-pill');
      if (name && type === 'found') { lbl.textContent = name.split(' ')[0]; pill.classList.add('on'); }
      else if (type === 'new') { lbl.textContent = 'Baru'; pill.classList.add('on'); toast('Pelanggan akan didaftarkan saat checkout', 'info'); }
      else { lbl.textContent = 'Member'; pill.classList.remove('on'); }
      document.getElementById('mo-mem')?.remove();
    }

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
    function setFilter(f, el) {
      histFilter = f; document.querySelectorAll('.fbt').forEach(b => b.classList.remove('act')); el.classList.add('act'); renderHist();
    }
    function histSearch(q) { histQ = q; renderHist(); }
    function renderHist() {
      const el = document.getElementById('hist-items');
      const items = HISTORY.filter(h => {
        if (histFilter !== 'all' && h.status !== histFilter) return false;
        if (histQ) { const q = histQ.toLowerCase(); return h.no.toLowerCase().includes(q) || String(h.table).toLowerCase().includes(q) || h.cashier.toLowerCase().includes(q) || (h.member || '').toLowerCase().includes(q); }
        return true;
      });
      el.innerHTML = '';
      if (!items.length) { el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--txt3);font-size:12px">Tidak ada transaksi</div>'; return; }
      items.forEach(h => {
        const d = document.createElement('div');
        d.className = 'hcard' + (selTxn && selTxn.id === h.id ? ' active' : '') + (h.status === 'voided' ? ' voided' : '');
        d.innerHTML = `<div class="hc-top"><div class="hc-no">${h.no}</div><div class="hc-st ${h.status}">${h.status === 'done' ? 'SELESAI' : h.status === 'voided' ? 'VOID' : 'TERBUKA'}</div></div><div class="hc-meta"><span>${h.time}</span><span>${h.type === 'take' ? 'Take Away' : 'Meja ' + h.table}</span><span>${h.cashier}</span><span>${h.method}</span></div><div class="hc-total">${fr(h.total)}</div>`;
        d.onclick = () => selHist(h); el.appendChild(d);
      });
    }
    function selHist(h) {
      selTxn = h; renderHist();
      document.getElementById('hd-no').textContent = h.no;
      document.getElementById('hd-meta').innerHTML = `<span>Hari ini · ${h.time}</span><span>${h.type === 'take' ? 'Take Away' : 'Meja ' + h.table}</span><span>Kasir: ${h.cashier}</span>${h.member ? `<span>Member: ${h.member}</span>` : ''}`;
      document.getElementById('hd-acts').style.display = 'flex';
      document.getElementById('btn-void-o').classList.toggle('off', h.status === 'voided');
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
    <div class="rrow rsm"><span>Hari ini · ${h.time}</span><span></span></div>
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
    function voidPin(k) {
      if (k === '⌫') voidArr.pop(); else if (voidArr.length < 4) voidArr.push(k);
      for (let i = 0; i < 4; i++) { const d = document.getElementById('vd' + i); if (d) d.classList.toggle('on', i < voidArr.length); }
      if (voidArr.length === 4) {
        if (voidArr.join('') === VOID_PIN) {
          document.getElementById('mo-void')?.remove(); doVoid();
        } else {
          const e = document.getElementById('verr'); if (e) e.textContent = 'PIN salah. Coba lagi.';
          voidArr = []; setTimeout(() => { for (let i = 0; i < 4; i++) { const d = document.getElementById('vd' + i); if (d) d.classList.remove('on'); } const e = document.getElementById('verr'); if (e) e.textContent = ''; }, 900);
        }
      }
    }
    function doVoid() {
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
      var doRefund = document.getElementById('void-refund-chk')?.checked || false;
      var idx = HISTORY.findIndex(function (h) { return h.id === selTxn.id; });
      if (idx >= 0) {
        HISTORY[idx].status = 'voided';
        HISTORY[idx].voidBy = currentUser ? currentUser.name : 'Manager';
        HISTORY[idx].voidReason = reason;
        HISTORY[idx].refunded = doRefund;
        HISTORY[idx].refundAmt = doRefund ? selTxn.total : 0;
        selTxn = HISTORY[idx];
        if (doRefund) {
          REFUNDS.push({ no: selTxn.no, amt: selTxn.total, reason: reason, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) });
        }
      }
      document.getElementById('mo-void')?.remove();
      renderHist(); selHist(selTxn); toast('Order ' + selTxn.no + ' di-void' + (doRefund ? ' + refund' : ''), 'err');
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
    function lR(lbl, val, isSub, bold, isNeg, vc) {
      if (isNeg) vc = 'neg';
      return '<div class="lst-row' + (isSub ? ' subtotal' : '') + '"><span class="lst-lbl' + (bold ? ' b' : '') + '">' + lbl + '</span><span class="lst-val' + (bold ? ' b' : '') + ' ' + (vc || '') + '">' + val + '</span></div>';
    }


    /* ── TOAST ── */
    function toast(msg, type = 'ok') {
      const t = document.createElement('div'); t.className = 'toast ' + type;
      const icons = { ok: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', err: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>', info: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>' };
      t.innerHTML = (icons[type] || '') + msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000);
    }

    /* ── INIT ── */
    initLogin();
  