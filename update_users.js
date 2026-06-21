const SUPABASE_URL = 'https://mzucfndifneytbesirkx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dWNmbmRpZm5leXRiZXNpcmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM0MDUzNSwiZXhwIjoyMDk2OTE2NTM1fQ.blh08pJxW2CNkFjgVtWq_yTuEmTemFZaZuCKl-DM0M4';

const tenantId = '00000000-0000-0000-0000-000000000001';
const outletId = '00000000-0000-0000-0000-000000000002';

async function updateUsers() {
  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };

  const users = [
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Superadmin',
      email: 'superadmin@nashty',
      pin: '0000',
      role: 'superadmin',
      tenant_id: tenantId,
      outlet_id: outletId
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Manager',
      email: 'manager@nashty',
      pin: '1212',
      role: 'manager',
      tenant_id: tenantId,
      outlet_id: outletId
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Owner',
      email: 'owner@nashty',
      pin: '9999',
      role: 'manager',
      tenant_id: tenantId,
      outlet_id: outletId
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      name: 'Kasir',
      email: 'kasir@nashty',
      pin: '8888',
      role: 'manager',
      tenant_id: tenantId,
      outlet_id: outletId
    }
  ];

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(users)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to update users:', errorText);
  } else {
    console.log('Successfully inserted/updated users');
  }
}

updateUsers();
