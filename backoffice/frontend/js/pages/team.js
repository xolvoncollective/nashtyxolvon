// PEOPLE 
let usersData = [];
let outletsData = [];

async function fetchTeamData(role) {
  try {
    const [uRes, oRes] = await Promise.all([
      API.users.getAll({ role }),
      API.outlets ? API.outlets.getAll() : Promise.resolve({ outlets: [] })
    ]);
    usersData = uRes.users || [];
    if (oRes.outlets) outletsData = oRes.outlets;
  } catch (e) {
    console.error(e);
  }
}

window.toggleUserStatus = async function(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    await API.users.updateStatus(id, newStatus);
    toast('Status berhasil diubah', 'ok');
    nav(curPage, document.querySelector('.sb-item.act'));
  } catch (e) {
    toast('Gagal: ' + e.message, 'err');
  }
};

window.saveUser = async function(id, role) {
  const name = document.getElementById('u-name').value;
  const phone = document.getElementById('u-phone').value;
  const email = document.getElementById('u-email').value;
  const pin = document.getElementById('u-pin').value;
  const outlet = document.getElementById('u-outlet') ? document.getElementById('u-outlet').value : null;

  if (!name || !phone) {
    return toast('Nama dan nomor telepon wajib diisi', 'err');
  }
  if (!id && !pin) {
    return toast('PIN wajib diisi untuk user baru', 'err');
  }

  const payload = {
    name, phone, email, role,
    outletId: outlet === 'all' || !outlet ? null : outlet
  };
  if (pin) payload.pin = pin;

  try {
    if (id) {
      await API.users.update(id, payload);
    } else {
      await API.users.create(payload);
    }
    toast('User berhasil disimpan', 'ok');
    document.getElementById('mod-user').remove();
    nav(curPage, document.querySelector('.sb-item.act'));
  } catch (e) {
    toast('Gagal: ' + e.message, 'err');
  }
};

window.openUserModal = function(role, id = '') {
  const u = usersData.find(x => x.id === id) || { name: '', email: '', phone: '', outlet_id: null };
  const isOwner = role === 'owner';
  const roleTitle = role === 'owner' ? 'Owner' : role === 'manager' ? 'Manager' : 'Kasir';
  
  document.body.insertAdjacentHTML('beforeend',`
  <div class="modal-overlay" id="mod-user" onclick="if(event.target===this)this.remove()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-h">
        <div class="modal-t">${id ? 'Edit ' + roleTitle : 'Tambah ' + roleTitle + ' Baru'}</div>
        <div class="modal-x" onclick="document.getElementById('mod-user').remove()"></div>
      </div>
      <div class="modal-b">
        <div class="fld"><label>Nama Lengkap *</label><input id="u-name" value="${u.name}" placeholder="Nama lengkap"></div>
        <div class="form-grid form-2">
          <div class="fld"><label>Nomor Telepon *</label><input id="u-phone" value="${u.phone || ''}" placeholder="08xxxxxxxxxx"></div>
          <div class="fld"><label>Email</label><input id="u-email" type="email" value="${u.email || ''}" placeholder="opsional"></div>
        </div>
        <div class="form-grid form-2">
          <div class="fld"><label>PIN POS *</label><input id="u-pin" type="password" maxlength="4" placeholder="4 digit" value=""><div class="fld-hint">${id ? 'Isi jika ingin merubah PIN' : '4 digit angka'}</div></div>
          ${!isOwner ? `<div class="fld"><label>Outlet</label><select id="u-outlet">
            <option value="all">Pilih Outlet</option>
            ${outletsData.map(o => `<option value="${o.id}" ${u.outlet_id === o.id ? 'selected' : ''}>${o.name}</option>`).join('')}
          </select></div>` : ''}
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="document.getElementById('mod-user').remove()">Batal</button>
        <button class="btn btn-primary" onclick="saveUser('${id}', '${role}')">Simpan</button>
      </div>
    </div>
  </div>`);
};

PAGES.owners = async () => {
  await fetchTeamData('owner');
  return `
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Owners</div><div class="ph-sub">Akses penuh ke seluruh sistem</div></div>
 <button class="btn btn-primary" onclick="openUserModal('owner')">${ico('plus')} Tambah Owner</button>
 </div>
</div>
<div class="card">
 <div class="tbl-wrap"><table>
 <thead><tr><th>Nama</th><th>Email</th><th>Telepon</th><th>Status</th><th>Aksi</th></tr></thead>
 <tbody>${usersData.length === 0 ? '<tr><td colspan="5" style="text-align:center">Belum ada owner</td></tr>' : usersData.map(o=>`
 <tr>
 <td><div style="display:flex;align-items:center;gap:10px">
 <div style="width:34px;height:34px;border-radius:50%;background:var(--orL);color:var(--or);font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center">${o.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
 <span class="bold">${o.name}</span>
 </div></td>
 <td>${o.email || '—'}</td>
 <td class="mono">${o.phone || '—'}</td>
 <td><span class="badge ${o.status==='active'?'badge-green':'badge-red'}">${o.status==='active'?'Aktif':'Nonaktif'}</span></td>
 <td><div style="display:flex;gap:5px">
 <button class="btn btn-sm" onclick="openUserModal('owner', '${o.id}')">${ico('edit')} Edit</button>
 <button class="btn btn-sm ${o.status==='active'?'btn-danger':''}" onclick="toggleUserStatus('${o.id}', '${o.status}')">
 ${o.status==='active'?ico('dis')+' Nonaktifkan':ico('ena')+' Aktifkan'}
 </button>
 </div></td>
 </tr>`).join('')}
 </tbody>
 </table></div>
</div>`;
};

PAGES.managers = async () => {
  await fetchTeamData('manager');
  return `
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Managers</div><div class="ph-sub">Akses manajemen per outlet</div></div>
 <button class="btn btn-primary" onclick="openUserModal('manager')">${ico('plus')} Tambah Manager</button>
 </div>
</div>
<div class="card">
 <div class="tbl-wrap"><table>
 <thead><tr><th>Nama</th><th>Email</th><th>Telepon</th><th>Outlet</th><th>Status</th><th>Aksi</th></tr></thead>
 <tbody>${usersData.length === 0 ? '<tr><td colspan="6" style="text-align:center">Belum ada manager</td></tr>' : usersData.map(m=>`
 <tr>
 <td><div style="display:flex;align-items:center;gap:10px">
 <div style="width:34px;height:34px;border-radius:50%;background:var(--blL);color:var(--bl);font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center">${m.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
 <span class="bold">${m.name}</span>
 </div></td>
 <td>${m.email || '—'}</td>
 <td class="mono">${m.phone || '—'}</td>
 <td><span class="badge badge-blue">${m.outlet_name || 'Semua Outlet'}</span></td>
 <td><span class="badge ${m.status==='active'?'badge-green':'badge-red'}">${m.status==='active'?'Aktif':'Nonaktif'}</span></td>
 <td><div style="display:flex;gap:5px">
 <button class="btn btn-sm" onclick="openUserModal('manager', '${m.id}')">${ico('edit')}</button>
 <button class="btn btn-sm ${m.status==='active'?'btn-danger':''}" onclick="toggleUserStatus('${m.id}', '${m.status}')">
 ${m.status==='active'?ico('dis')+' Nonaktifkan':ico('ena')+' Aktifkan'}
 </button>
 </div></td>
 </tr>`).join('')}
 </tbody>
 </table></div>
</div>`;
};

PAGES.cashiers = async () => {
  await fetchTeamData('cashier');
  return `
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Kasir</div><div class="ph-sub">Staff POS Terminal — tidak bisa akses Backoffice</div></div>
 <button class="btn btn-primary" onclick="openUserModal('cashier')">${ico('plus')} Tambah Kasir</button>
 </div>
</div>
<div class="card">
 <div class="tbl-wrap"><table>
 <thead><tr><th>Kasir</th><th>Telepon</th><th>PIN POS</th><th>Outlet</th><th>Status</th><th>Aksi</th></tr></thead>
 <tbody>${usersData.length === 0 ? '<tr><td colspan="6" style="text-align:center">Belum ada kasir</td></tr>' : usersData.map(c=>`
 <tr>
 <td><div style="display:flex;align-items:center;gap:10px">
 <div style="width:34px;height:34px;border-radius:50%;background:${c.status==='active'?'var(--gnL)':'var(--sf3)'};color:${c.status==='active'?'var(--gn)':'var(--txt3)'};font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center">${c.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
 <div><div class="bold">${c.name}</div><div style="font-size:11px;color:var(--txt3)">${c.email||'—'}</div></div>
 </div></td>
 <td class="mono">${c.phone || '—'}</td>
 <td><span class="badge badge-gray">••••</span></td>
 <td><span class="badge badge-blue">${c.outlet_name || 'Semua Outlet'}</span></td>
 <td><span class="badge ${c.status==='active'?'badge-green':'badge-red'}">${c.status==='active'?'Aktif':'Nonaktif'}</span></td>
 <td><div style="display:flex;gap:5px">
 <button class="btn btn-sm" onclick="openUserModal('cashier', '${c.id}')">${ico('edit')}</button>
 <button class="btn btn-sm ${c.status==='active'?'btn-danger':''}" onclick="toggleUserStatus('${c.id}', '${c.status}')">
 ${c.status==='active'?ico('dis')+' Nonaktifkan':ico('ena')+' Aktifkan'}
 </button>
 </div></td>
 </tr>`).join('')}
 </tbody>
 </table></div>
</div>`;
};
