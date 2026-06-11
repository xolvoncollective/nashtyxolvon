// PEOPLE 
PAGES.owners=()=>`
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Owners</div><div class="ph-sub">Akses penuh ke seluruh sistem</div></div>
 <button class="btn btn-primary" onclick="toast('Tambah owner')">'+ico('plus')+' Tambah Owner</button>
 </div>
</div>
<div class="card">
 <div class="tbl-wrap"><table>
 <thead><tr><th>Nama</th><th>Email</th><th>Telepon</th><th>Role</th><th>Aksi</th></tr></thead>
 <tbody>${OWNERS.map(o=>`
 <tr>
 <td><div style="display:flex;align-items:center;gap:10px">
 <div style="width:34px;height:34px;border-radius:50%;background:var(--orL);color:var(--or);font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center">${o.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
 <span class="bold">${o.name}</span>
 </div></td>
 <td>${o.email}</td>
 <td class="mono">${o.phone}</td>
 <td><span class="badge badge-orange"> ${o.role}</span></td>
 <td><button class="btn btn-sm" onclick="toast('Edit ${o.name}')">${ico('edit')} Edit</button></td>
 </tr>`).join('')}
 </tbody>
 </table></div>
</div>`;

PAGES.managers=()=>`
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Managers</div><div class="ph-sub">Akses manajemen per outlet</div></div>
 <button class="btn btn-primary" onclick="toast('Tambah manager')">'+ico('plus')+' Tambah Manager</button>
 </div>
</div>
<div class="card">
 <div class="tbl-wrap"><table>
 <thead><tr><th>Nama</th><th>Email</th><th>Telepon</th><th>Outlet</th><th>Status</th><th>Aksi</th></tr></thead>
 <tbody>${MANAGERS.map(m=>`
 <tr>
 <td><div style="display:flex;align-items:center;gap:10px">
 <div style="width:34px;height:34px;border-radius:50%;background:var(--blL);color:var(--bl);font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center">${m.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
 <span class="bold">${m.name}</span>
 </div></td>
 <td>${m.email}</td>
 <td class="mono">${m.phone}</td>
 <td><span class="badge badge-blue">${m.outlet}</span></td>
 <td><span class="badge ${m.active?'badge-green':'badge-red'}">${m.active?'Aktif':'Nonaktif'}</span></td>
 <td><div style="display:flex;gap:5px">
 <button class="btn btn-sm" onclick="toast('Edit ${m.name}')">${ico('edit')}</button>
 <button class="btn btn-sm btn-danger" onclick="toast('Akses dicabut','err')">'+ico('dis')+' Nonaktif</button>
 </div></td>
 </tr>`).join('')}
 </tbody>
 </table></div>
</div>`;

PAGES.cashiers=()=>`
<div class="ph">
 <div style="display:flex;align-items:center;justify-content:space-between">
 <div><div class="ph-title">Kasir</div><div class="ph-sub">Staff POS Terminal — tidak bisa akses Backoffice</div></div>
 <button class="btn btn-primary" onclick="openCashierModal()">'+ico('plus')+' Tambah Kasir</button>
 </div>
</div>
<div class="sf-bar">
 <div class="search-wrap"><input class="search-inp" placeholder="Cari nama kasir..."></div>
 <select class="filter-select"><option>Semua Outlet</option>${OUTLETS.map(o=>`<option>${o.name}</option>`).join('')}</select>
 <select class="filter-select"><option>Semua Status</option><option>Aktif</option><option>Nonaktif</option></select>
</div>
<div class="card">
 <div class="tbl-wrap"><table>
 <thead><tr><th>Kasir</th><th>Telepon</th><th>PIN POS</th><th>Outlet</th><th>Txn Hari Ini</th><th>Status</th><th>Aksi</th></tr></thead>
 <tbody>${CASHIERS.map(c=>`
 <tr>
 <td><div style="display:flex;align-items:center;gap:10px">
 <div style="width:34px;height:34px;border-radius:50%;background:${c.active?'var(--gnL)':'var(--sf3)'};color:${c.active?'var(--gn)':'var(--txt3)'};font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center">${c.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
 <div><div class="bold">${c.name}</div><div style="font-size:11px;color:var(--txt3)">${c.email||'—'}</div></div>
 </div></td>
 <td class="mono">${c.phone}</td>
 <td><span class="badge badge-gray">••••</span></td>
 <td><span class="badge badge-blue">${c.outlet}</span></td>
 <td><span class="bold">${c.txToday}</span> txn</td>
 <td><span class="badge ${c.active?'badge-green':'badge-red'}">${c.active?'Aktif':'Nonaktif'}</span></td>
 <td><div style="display:flex;gap:5px">
 <button class="btn btn-sm" onclick="openCashierModal('${c.name}')">${ico('edit')}</button>
 <button class="btn btn-sm ${c.active?'btn-danger':''}" onclick="toast('${c.name} ${c.active?'dinonaktifkan':'diaktifkan'}','${c.active?'err':'ok'}')">
 ${c.active?ico('dis')+' Nonaktif':ico('ena')+' Aktifkan'}
 </button>
 </div></td>
 </tr>`).join('')}
 </tbody>
 </table></div>
</div>`;

function openCashierModal(name=''){
 document.body.insertAdjacentHTML('beforeend',`
 <div class="modal-overlay" id="mod-cashier" onclick="if(event.target===this)this.remove()">
 <div class="modal" onclick="event.stopPropagation()">
 <div class="modal-h"><div class="modal-t">${name?'Edit Kasir: '+name:'Tambah Kasir Baru'}</div><div class="modal-x" onclick="document.getElementById('mod-cashier').remove()"></div></div>
 <div class="modal-b">
 <div class="fld"><label>Nama Lengkap *</label><input value="${name}" placeholder="Nama kasir"></div>
 <div class="form-grid form-2">
 <div class="fld"><label>Nomor Telepon *</label><input placeholder="08xxxxxxxxxx"></div>
 <div class="fld"><label>Email</label><input type="email" placeholder="opsional"></div>
 </div>
 <div class="form-grid form-2">
 <div class="fld"><label>PIN POS *</label><input type="password" maxlength="4" placeholder="4 digit" value="${name?'****':''}"><div class="fld-hint">4 digit angka</div></div>
 <div class="fld"><label>Outlet</label><select>${OUTLETS.map(o=>`<option>${o.name}</option>`).join('')}</select></div>
 </div>
 <div class="fld"><label>Status</label><select><option>Aktif</option><option>Nonaktif</option></select></div>
 </div>
 <div class="modal-foot">
 <button class="btn" onclick="document.getElementById('mod-cashier').remove()">Batal</button>
 <button class="btn btn-primary" onclick="document.getElementById('mod-cashier').remove();toast('Kasir berhasil disimpan')">Simpan</button>
 </div>
 </div>
 </div>`);
}
