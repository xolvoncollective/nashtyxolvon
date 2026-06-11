// ═══════════════════════════════════════════════════════
// CONFIG (all configurable via Backoffice in production)
// ═══════════════════════════════════════════════════════
const CFG = {
  warnMin:    10,   // Warning threshold (minutes)
  urgentMin:  20,   // Urgent threshold (minutes)
  swipeEnabled: true,
  soundEnabled: true,
  highlightDuration: 3500,
  stickyUrgent: true,
  autoSort: true,
  compactThreshold: 12,
};

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
const TYPE_LABEL = {dine:'Dine In',take:'Take Away',gofood:'GoFood',grabfood:'GrabFood',shopee:'ShopeeFood'};
const TYPE_CSS   = {dine:'dine',take:'take',gofood:'gof',grabfood:'grab',shopee:'sf'};
const NOW = Date.now();
const MIN = 60000;

// ═══════════════════════════════════════════════════════
// DEMO DATA
// ═══════════════════════════════════════════════════════
let ORDERS = [
  {
    id:1, no:'#0188', table:'T03', type:'dine', cashier:'Citra',
    startTs: NOW - 3*MIN - 20000, status:'active',
    items:[
      {n:'Nasi Goreng Spesial', qty:2, mods:['Pedas Sedang'], addons:[], note:''},
      {n:'Kopi Susu Aren',      qty:1, mods:['Dingin'],       addons:['+Oat Milk'], note:''},
    ]
  },
  {
    id:2, no:'#0189', table:'T07', type:'dine', cashier:'Budi',
    startTs: NOW - 12*MIN - 15000, status:'active',
    items:[
      {n:'Ayam Bakar Madu', qty:1, mods:['Pedas Extra'], addons:['+Extra Sambal','+Nasi Putih'], note:'Sambalnya pisah ya'},
      {n:'Rawon Spesial',   qty:2, mods:['Telur Asin'],  addons:[], note:''},
    ]
  },
  {
    id:3, no:'#0190', table:'TAKE', type:'take', cashier:'Ani',
    startTs: NOW - 23*MIN - 5000, status:'active',
    items:[
      {n:'Sate Ayam 10pcs', qty:1, mods:['Mix'],        addons:['+Extra Sate 5pcs','+Lontong'], note:''},
      {n:'Es Teh Manis',    qty:2, mods:['Kurang Manis'],addons:[], note:'Tanpa es untuk 1'},
      {n:'French Fries',    qty:1, mods:['Keju'],        addons:['+Cheese Dip'], note:''},
    ]
  },
  {
    id:4, no:'#0191', table:'GoFood', type:'gofood', cashier:'Citra',
    startTs: NOW - 7*MIN, status:'active',
    items:[
      {n:'Ayam Geprek',qty:2, mods:['Level 3'],addons:[], note:'Extra pedas beneran'},
      {n:'Nasi Putih', qty:2, mods:[],          addons:[], note:''},
      {n:'Lemon Tea',  qty:2, mods:[],          addons:[], note:''},
    ]
  },
  {
    id:5, no:'#0187', table:'T12', type:'dine', cashier:'Citra',
    startTs: NOW - 18*MIN, status:'active',
    items:[
      {n:'Sop Buntut',     qty:1, mods:[],      addons:['+Extra Kuah'], note:''},
      {n:'Es Krim Cokelat',qty:2, mods:['Oreo'],addons:['+Extra Scoop'], note:''},
    ]
  },
  {
    id:6, no:'#0186', table:'T01', type:'dine', cashier:'Budi',
    startTs: NOW - 28*MIN, status:'active',
    items:[
      {n:'Gado-Gado',  qty:1, mods:[], addons:[], note:'Tanpa kacang'},
      {n:'Jus Alpukat',qty:1, mods:['Large'], addons:[], note:''},
    ]
  },
];

let curFilter = 'all';
let pendingDoneId = null;
let demoCounter = 7;
let isDayMode = false;
