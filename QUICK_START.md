# Quick Start Guide - NASHTY POS

## Masalah dengan better-sqlite3 di Windows

`better-sqlite3` memerlukan Visual Studio Build Tools yang besar dan rumit untuk install. 

## Solusi: Gunakan Backend Existing yang Sudah Jalan

Anda sudah punya backend yang berjalan di folder `NashtyFinal/backend`. Mari kita gunakan itu saja!

## Step by Step:

### 1. Copy Mockup HTML ke Folder Frontend Existing

```powershell
# Copy file mockup ke folder frontend existing
Copy-Item "C:\Users\farsya\NashtyFinal\POSLITE\NASHTY_POS_Mockup.html" "C:\Users\farsya\NashtyFinal\frontend\public\"
Copy-Item "C:\Users\farsya\NashtyFinal\POSLITE\NASHTY_KDS_Mockup.html" "C:\Users\farsya\NashtyFinal\frontend\public\"
Copy-Item "C:\Users\farsya\NashtyFinal\POSLITE\NASHTY_Backoffice_Mockup_8.html" "C:\Users\farsya\NashtyFinal\frontend\public\"
Copy-Item "C:\Users\farsya\NashtyFinal\POSLITE\api-client.js" "C:\Users\farsya\NashtyFinal\frontend\public\"
```

### 2. Start Backend yang Sudah Ada

```powershell
cd C:\Users\farsya\NashtyFinal\backend
npm run dev
```

Backend akan jalan di `http://localhost:3000`

### 3. Start Frontend

```powershell
# Terminal baru
cd C:\Users\farsya\NashtyFinal\frontend
npm run dev
```

Frontend akan jalan di `http://localhost:5173`

### 4. Update API_BASE di api-client.js

Edit file `api-client.js` line 11:

```javascript
const API_BASE = 'http://localhost:3000/api';
```

### 5. Akses Mockup

Buka di browser:
- POS: http://localhost:5173/NASHTY_POS_Mockup.html
- KDS: http://localhost:5173/NASHTY_KDS_Mockup.html
- Backoffice: http://localhost:5173/NASHTY_Backoffice_Mockup_8.html

### 6. Test API Connection

Buka browser console (F12), test:

```javascript
// Test connection
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(d => console.log(d));

// Test get staff
fetch('http://localhost:3000/api/auth/staff')
  .then(r => r.json())
  .then(d => console.log(d));
```

## Alternatif: Gunakan Mockup Standalone

Jika Anda ingin test mockup tanpa backend dulu:

1. Buka file HTML langsung di browser:
   ```
   file:///C:/Users/farsya/NashtyFinal/POSLITE/NASHTY_POS_Mockup.html
   ```

2. Mockup akan jalan dengan data hardcoded (STAFF, MENU, CATS)

3. Nanti setelah backend ready, baru connect ke API

## Next: Integrasi API

Setelah backend jalan, ikuti guide di `INTEGRATION_GUIDE.md` untuk:
1. Replace hardcoded data dengan API calls
2. Fix perhitungan matematika
3. Submit order ke backend

---

**TL;DR:** 
- Backend existing sudah jalan ✅
- Copy mockup ke folder public ✅  
- Access via Vite dev server ✅
- Start integration sesuai guide ✅
