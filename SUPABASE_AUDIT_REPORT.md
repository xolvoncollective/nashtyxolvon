# 🔴 CRITICAL: SUPABASE AUDIT REPORT - DATA TIDAK MUNCUL

## ❌ ROOT CAUSE: TENANT/OUTLET ID MISMATCH

### Masalah Utama
KDS dan POS History **TIDAK MENAMPILKAN DATA** karena:
- Frontend menggunakan ID: `demo-tenant` dan `demo-outlet` 
- Database memiliki ID: UUID random seperti `337db3a3-ba68-4da9-824a-1ad261197f58`

**HASIL: Query tidak menemukan data karena ID tidak cocok!**

---

## 🔍 DETAIL INVESTIGASI

### 1. Database Seeding (Supabase)
✅ **Data BERHASIL masuk ke Supabase:**

**Tenants:**
```
- ID: 337db3a3-ba68-4da9-824a-1ad261197f58 | Name: Nashty Restaurant
- ID: c0d3ab9f-2d11-4988-82de-34d2bcc85d41 | Name: Nashty Cafe
```

**Outlets:**
```
- ID: d4ee75ff-f866-4fbc-baa9-95bba9af52ed | Name: Nashty Pusat | Tenant: 337db...
- ID: c9f95a3b-80ce-40f8-8d2c-39d665cc2dae | Name: Main Branch | Tenant: c0d3...
```

**Users:** 8 users (Superadmin, Manager, Owner, Kasir, Admin User, Manager User, Cashier User, Chef User)
**Categories:** 7 categories
**Products:** 12 products

---

### 2. Frontend Hardcoded IDs (SALAH!)

**File: `api-client-v2.js` (line 21-28)**
```javascript
session: {
  tenantId: 'demo-tenant',  // ❌ HARDCODED
  outletId: 'demo-outlet',  // ❌ HARDCODED
}
```

**File: `kds/frontend/js/app.js` (line 12-13)**
```javascript
if (!API.session.tenantId) {
  API.session.tenantId = 'demo-tenant';  // ❌ HARDCODED
  API.session.outletId = 'demo-outlet';  // ❌ HARDCODED
}
```

**File: `pos/frontend/js/app.js` (line 153-154)**
```javascript
if (!API.session.tenantId) {
  API.session.tenantId = 'demo-tenant';  // ❌ HARDCODED
  API.session.outletId = 'demo-outlet';  // ❌ HARDCODED
}
```

**File: `backoffice/backend/src/middleware/auth.ts` (line 99)**
```javascript
req.user = {
  tenantId: 'demo-tenant', // ❌ HARDCODED
}
```

---

### 3. API Request Yang Dikirim

Frontend mengirim request seperti:
```
GET /api/orders?tenantId=demo-tenant&outletId=demo-outlet
```

Backend query:
```sql
SELECT * FROM orders 
WHERE tenant_id = 'demo-tenant' AND outlet_id = 'demo-outlet'
```

**HASIL: 0 rows karena tidak ada tenant_id='demo-tenant' di database!**

---

### 4. Backend Routes (✅ BENAR)

Routes sudah benar menggunakan query params:

**File: `orders.ts`**
```typescript
const { tenantId, outletId } = req.query;
WHERE o.tenant_id = ? AND o.outlet_id = ?
```

**File: `kds.ts`**
```typescript
const { tenantId, outletId } = req.query;
WHERE tenant_id = ? AND outlet_id = ?
```

**Backend routes tidak salah, masalahnya di frontend yang mengirim ID yang salah!**

---

## 🛠️ SOLUSI

### ✅ OPSI 1: Update Seeding Script (REKOMENDASI)
Gunakan ID konsisten 'demo-tenant' dan 'demo-outlet' saat seeding:

**Update: `seed-supabase.ts`**
```typescript
const tenantId = 'demo-tenant';  // Fixed ID
const outletId = 'demo-outlet';  // Fixed ID
```

**Keuntungan:**
- Frontend tidak perlu diubah
- Cocok untuk demo single-tenant
- Quick fix

---

### ✅ OPSI 2: Update Frontend dengan UUID Real
Query tenant/outlet dari database dan simpan di session.

**Keuntungan:**
- Proper multi-tenant
- Scalable
- Production-ready

**Kerugian:**
- Butuh update banyak file frontend
- Butuh API endpoint untuk get tenant/outlet list

---

## 📋 FILE YANG PERLU DIPERBAIKI

### Jika Pilih OPSI 1 (Update Seeding):
1. ✏️ `backoffice/backend/seed-supabase.ts` - Ganti UUID dengan fixed ID
2. ✏️ `backoffice/backend/setup-nashty-pusat.ts` - Ganti UUID dengan fixed ID
3. 🔄 Re-run seeding script

### Jika Pilih OPSI 2 (Update Frontend):
1. ✏️ `api-client-v2.js` - Hapus hardcoded fallback
2. ✏️ `pos/frontend/js/app.js` - Hapus hardcoded fallback
3. ✏️ `kds/frontend/js/app.js` - Hapus hardcoded fallback
4. ✏️ `shared/auth.js` - Update login flow
5. ✏️ `backoffice/backend/src/middleware/auth.ts` - Get tenant dari JWT
6. 🆕 Buat API endpoint untuk list tenants/outlets

---

## 🎯 REKOMENDASI: OPSI 1 (Quick Fix)

Karena ini sistem demo single-tenant, lebih cepat update seeding script:

1. Update `seed-supabase.ts` dan `setup-nashty-pusat.ts`
2. **HAPUS semua data lama** dari Supabase
3. **RE-SEED** dengan ID fixed
4. Test KDS dan POS

**Estimasi waktu: 10 menit**

---

## ⚠️ CATATAN PENTING

### Data Yang Ada Sekarang:
- ✅ Ada di database dengan UUID
- ❌ Tidak bisa diakses karena ID mismatch
- 🗑️ Harus dihapus dan re-seed

### Setelah Fix:
- ✅ Frontend bisa akses data
- ✅ KDS akan muncul orders
- ✅ POS history akan muncul
- ✅ Semua fitur berfungsi

---

## 🚀 LANGKAH EKSEKUSI (OPSI 1)

```bash
# 1. Update seed scripts dengan fixed IDs
# 2. Hapus data lama dari Supabase (via Supabase Dashboard)
# 3. Re-run seed
cd backoffice/backend
npx tsx seed-supabase.ts

# 4. Verify
npx tsx verify-supabase-data.ts

# 5. Test frontend
# - Buka KDS
# - Buat order di POS
# - Cek order muncul di KDS
# - Cek history di POS
```

---

## 📊 VERIFICATION CHECKLIST

Setelah fix, verifikasi:
- [ ] Tenant ID di database = 'demo-tenant'
- [ ] Outlet ID di database = 'demo-outlet'
- [ ] Frontend mengirim tenantId='demo-tenant'
- [ ] API response tidak empty []
- [ ] KDS menampilkan orders
- [ ] POS history menampilkan orders
- [ ] Dashboard menampilkan statistics

---

**Generated:** $(date)
**Severity:** 🔴 CRITICAL - Blocking all features
**Impact:** KDS, POS History, Dashboard Analytics, Reports
**Status:** Ready to Fix
