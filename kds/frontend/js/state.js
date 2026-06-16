// ═══════════════════════════════════════════════════════
// CONFIG (all configurable via Backoffice in production)
// ═══════════════════════════════════════════════════════
const CFG = {
  warnMin:    10,   // Default Warning threshold (minutes) if not overridden
  urgentMin:  20,   // Default Urgent threshold (minutes) if not overridden
  swipeEnabled: true,
  soundEnabled: true,
  flashEnabled: true,
  escalationEnabled: true,
  escalationInterval: 1,
  highlightDuration: 3500,
  stickyUrgent: true,
  autoSort: true,
  compactThreshold: 12,
  workflow: [
    { id: 'pending', name: 'New Order', color: '#3B82F6' },
    { id: 'preparing', name: 'Preparing', color: '#F59E0B' },
    { id: 'ready', name: 'Ready', color: '#22C55E' },
    { id: 'served', name: 'Completed', color: '#6B7280' }
  ]
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
