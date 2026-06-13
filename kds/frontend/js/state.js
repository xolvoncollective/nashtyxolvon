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
let ORDERS = [];

let curFilter = 'all';
let pendingDoneId = null;
let demoCounter = 7;
let isDayMode = false;
