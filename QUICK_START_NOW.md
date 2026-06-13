# ⚡ QUICK START - Mulai Testing Sekarang!

**Waktu: 5 menit** | **Goal: Verifikasi semua sistem bekerja**

---

## 🚀 Langkah 1: Start Server (30 detik)

Buka PowerShell di folder project:

```powershell
.\start-local.ps1
```

**Tunggu sampai muncul:**
```
✓ Health check: PASSED
✓ Opening browser...
```

---

## 🌐 Langkah 2: Buka Main Launcher (30 detik)

Browser akan otomatis membuka, atau buka manual:

```
http://localhost:3001/main-launcher.html
```

**Cek server status:**
- Harus tampil: ✓ **Server Online (Port 3001)**
- Jika offline: restart `start-local.ps1`

---

## 🔐 Langkah 3: Login (15 detik)

```
Username: admin
Password: admin
```

Klik **"Login"** → Tunggu "✓ Login berhasil!"

---

## 📱 Langkah 4: Buka Semua Sistem (30 detik)

Klik tombol merah:
```
🚀 Buka Semua (Testing Mode)
```

**3 window akan terbuka:**
1. 🛒 POS Terminal
2. 👨‍🍳 Kitchen Display (KDS)
3. 📊 Backoffice Dashboard

---

## ✅ Langkah 5: Test Order Flow (2 menit)

### A. Di POS:
1. Pilih produk (misal: "Kopi")
2. Klik "Add to Cart"
3. Klik "Pay" / "Process Order"
4. **Catat nomor order** (misal: ORD-2025-0001)

### B. Di KDS:
1. **Tunggu 5 detik** (auto-refresh)
2. Order harus muncul! ✅
3. Klik order → Ubah status: **Pending → Preparing**
4. Klik lagi → **Preparing → Ready**

### C. Verify:
- Buka DevTools (F12) di POS
- Tab "Network" → Cari `POST /api/orders`
- Status harus: **201 Created** ✅

---

## 🎯 Expected Results

| Step | What To See | Status |
|------|-------------|---------|
| 1 | Server starts, port 3001 | ✅ |
| 2 | Main launcher loads | ✅ |
| 3 | Login successful, JWT received | ✅ |
| 4 | 3 windows open | ✅ |
| 5A | Order created in POS | ✅ |
| 5B | Order appears in KDS | ✅ |
| 5C | Status updates work | ✅ |

---

## 🐛 Quick Troubleshooting

### Server won't start:
```bash
# Check Node version (need v18+)
node --version

# If wrong version, install: https://nodejs.org/
```

### API errors in browser:
```
F12 → Console tab
Look for: "API Error" messages
Check: Token present in localStorage
```

### Order tidak muncul di KDS:
```
1. Check KDS console (F12)
2. Verify auto-refresh running
3. Hard refresh browser (Ctrl+F5)
```

---

## 📚 Next Steps

### If All Tests Pass ✅:
1. Read `TESTING_GUIDE.md` for detailed tests
2. Test KPI scenarios
3. Start UI/UX improvements

### If Any Test Fails ⚠️:
1. Check browser console for errors
2. Check `AUDIT_REPORT_AND_FIXES.md` for solutions
3. Verify all files are correctly updated

---

## 🎓 What Was Fixed

**Before:**
- ❌ POS couldn't connect (wrong port)
- ❌ KDS had no API client
- ❌ No way to test all systems together
- ❌ Confusing error messages

**After:**
- ✅ POS connects to port 3001
- ✅ KDS has complete API client
- ✅ Main launcher opens all systems
- ✅ Clear documentation

---

## 📞 Help

**Problems?** Check these in order:
1. `QUICK_FIX_SUMMARY.md` - Quick solutions
2. `TESTING_GUIDE.md` - Detailed testing
3. `API_DOCUMENTATION_COMPLETE.md` - API reference
4. `AUDIT_REPORT_AND_FIXES.md` - Deep analysis

---

## ⏱️ Time Estimate

- Setup: 5 minutes
- Basic testing: 10 minutes
- Full testing: 30 minutes
- Integration testing: 1 hour

---

## 🎉 Success!

**Jika order dari POS muncul di KDS →** INTEGRATION BERHASIL! 🎊

Sekarang Anda bisa fokus ke:
- UI/UX improvements
- Additional features
- Performance optimization

---

**Start Now:** Run `.\start-local.ps1` and follow steps above! 🚀

---

**Created:** 2025-01-15  
**Goal:** Get you testing in 5 minutes  
**Status:** Ready to run! ✅
