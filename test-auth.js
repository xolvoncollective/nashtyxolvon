

const API_BASE = 'https://nashty-backoffice-backend-production.up.railway.app/api';

async function test() {
  console.log('1. Logging into main gateway...');
  let res = await fetch(`${API_BASE}/main/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin1', password: 'password1', outletId: '00000000-0000-0000-0000-000000000002' })
  });
  let data = await res.json();
  if (!res.ok) {
    console.error('Main login failed:', data);
    return;
  }
  const mainToken = data.token;
  console.log('Main login success.');

  console.log('2. Logging into staff PIN...');
  res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '0000', outletId: '00000000-0000-0000-0000-000000000002' })
  });
  data = await res.json();
  if (!res.ok) {
    console.error('Staff login failed:', data);
    return;
  }
  const staffToken = data.token;
  console.log('Staff login success.');

  console.log('3. Fetching POS menu with staff token...');
  res = await fetch(`${API_BASE}/menu/outlet/00000000-0000-0000-0000-000000000002`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  data = await res.json();
  console.log('Menu status:', res.status);
  if (!res.ok) {
    console.error('Menu fetch failed:', data);
  } else {
    console.log('Menu fetch success.');
  }

  console.log('4. Fetching active shifts with staff token...');
  res = await fetch(`${API_BASE}/shifts/active?userId=demo-admin`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  data = await res.json();
  console.log('Shift status:', res.status);
  if (!res.ok) {
    console.error('Shift fetch failed:', data);
  } else {
    console.log('Shift fetch success.');
  }
}

test();
