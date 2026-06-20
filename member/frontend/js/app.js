// CONFIG
const API_BASE = '/api';

// STATE
let STATE = {
  token: localStorage.getItem('nashty_member_token') || null,
  profile: null,
  history: []
};

// UTILS
const $ = id => document.getElementById(id);
const showView = id => {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('act'));
  $(id).classList.add('act');
};
const showToast = (msg, type='success') => {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = type === 'success' 
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ${msg}`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};
const fmtRp = num => 'Rp ' + Number(num || 0).toLocaleString('id-ID');
const fmtDate = isoStr => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// API REQUESTER
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (STATE.token) headers['Authorization'] = `Bearer ${STATE.token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');
    return data;
  } catch (err) {
    throw err;
  }
}

// INIT
async function init() {
  if (STATE.token) {
    try {
      await fetchDashboardData();
      showView('view-dashboard');
    } catch (e) {
      console.warn('Session expired or invalid', e);
      logout();
    }
  } else {
    showView('view-login');
  }
  setTimeout(() => { $('loading').style.opacity = '0'; setTimeout(() => $('loading').style.display = 'none', 300); }, 500);
}

// LOGIN FLOW
$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = $('inp-phone').value.trim();
  const name = $('inp-name').value.trim();
  const pin = $('inp-pin').value.trim();

  if (!phone || !pin) return showToast('Nomor WhatsApp dan PIN wajib diisi', 'error');

  $('loading').style.display = 'flex';
  $('loading').style.opacity = '1';

  try {
    const res = await apiCall('/members/auth/login', 'POST', { phone, pin, name });
    STATE.token = res.token;
    localStorage.setItem('nashty_member_token', res.token);
    
    await fetchDashboardData();
    showView('view-dashboard');
    showToast('Berhasil login!');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    $('loading').style.opacity = '0';
    setTimeout(() => $('loading').style.display = 'none', 300);
  }
});

// DASHBOARD FLOW
async function fetchDashboardData() {
  const profileRes = await apiCall('/members/profile');
  STATE.profile = profileRes.member;

  const historyRes = await apiCall('/members/history');
  STATE.history = historyRes.orders || [];

  renderDashboard();
}

function renderDashboard() {
  const p = STATE.profile;
  
  // Virtual Card
  $('vc-tier').textContent = String(p.segment).toUpperCase();
  $('vc-pts').textContent = p.points;
  $('vc-name').textContent = p.name;
  $('vc-phone').textContent = p.phone;
  
  // Set Tier Color
  const tierColor = `var(--tier-${p.segment === 'vip' ? 'vip' : p.segment === 'loyal' ? 'loy' : p.segment === 'regular' ? 'reg' : 'new'})`;
  document.querySelector('.v-card-bg').style.background = tierColor;

  // Stats
  $('sb-visits').textContent = p.visitCount;
  $('sb-spent').textContent = fmtRp(p.totalSpent);

  // History
  const hList = $('history-list');
  hList.innerHTML = '';
  
  if (STATE.history.length === 0) {
    hList.innerHTML = '<div style="text-align:center;color:var(--txt3);padding:20px 0;">Belum ada riwayat transaksi.</div>';
    return;
  }

  STATE.history.forEach(o => {
    const el = document.createElement('div');
    el.className = 'h-item';
    el.innerHTML = `
      <div class="hi-left">
        <div class="hi-title">${o.outlet_name || 'Nashty Outlet'}</div>
        <div class="hi-meta">${o.order_number} &bull; ${fmtDate(o.created_at)}</div>
      </div>
      <div class="hi-right">${fmtRp(o.total)}</div>
    `;
    hList.appendChild(el);
  });
}

function logout() {
  STATE.token = null;
  STATE.profile = null;
  STATE.history = [];
  localStorage.removeItem('nashty_member_token');
  showView('view-login');
}

// Bootstrap
window.addEventListener('DOMContentLoaded', init);
