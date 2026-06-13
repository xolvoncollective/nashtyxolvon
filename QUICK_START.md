# 🚀 NASHTY OS - Quick Start Guide

**Status:** ✅ Production Ready (Backend + Complete Menu)  
**UAT:** ✅ 100% Passed (15/15 tests)  
**Menu:** ✅ 50 Items Imported from Mockup

---

## ⚡ Quick Start (30 Seconds)

### 1. Start Backend
```powershell
cd backoffice\backend
npm run dev
```

Server akan berjalan di **http://localhost:3099**

### 2. Open Test Page
Buka browser: **http://localhost:3099/TEST_LIVE_PREVIEW.html**

### 3. Access Modules
- **POS Terminal:** http://localhost:3099/pos/frontend/index.html
- **Kitchen Display:** http://localhost:3099/kds/frontend/index.html
- **Backoffice:** http://localhost:3099/backoffice/frontend/index.html

---

## 🍽️ Menu Data

**Total Items:** 50 items dari mockup  
**Categories:** 5 (Makanan, Minuman, Camilan, Dessert, Add On)  
**With Modifiers:** 19 items (38%)  
**Price Range:** Rp 3,000 - Rp 65,000

### Menu Breakdown:
- 🍽️ **Makanan:** 10 items (Rp 28K - Rp 65K)
- 🥤 **Minuman:** 10 items (Rp 5K - Rp 25K)
- 🍟 **Camilan:** 10 items (Rp 10K - Rp 25K)
- 🍰 **Dessert:** 10 items (Rp 12K - Rp 32K)
- ➕ **Add On:** 10 items (Rp 3K - Rp 8K)

---

## 🔑 Demo Login

| PIN | User | Role |
|-----|------|------|
| **1234** | Citra Dewi | Cashier |
| **2345** | Budi Santoso | Cashier |
| **0000** | Admin Demo | Owner |

---

## 🧪 Run UAT Test

```bash
node uat_comprehensive_test.js
```

Expected output: **✅ 100% Success (15/15 tests passed)**

---

## 🔄 Re-Import Menu (if needed)

```bash
node reimport_menu_complete.js
```

This will re-import all 50 menu items from mockup with modifiers.

---

## 📋 Complete Documentation

- **Main README:** `README.md`
- **UAT Report:** `UAT_REPORT.md`
- **Implementation Summary:** `IMPLEMENTASI_SUMMARY.md`
- **Menu Import Report:** `MENU_IMPORT_REPORT.md`
- **API Documentation:** `Draft/API_DOCUMENTATION.md`

---

## ✅ What's Working

- ✅ Backend API (Express + SQLite)
- ✅ Authentication (JWT + PIN)
- ✅ **Complete Menu (50 items from mockup)**
- ✅ **Modifiers System (27 groups, 68 options)**
- ✅ POS: Order Creation
- ✅ KDS: Kitchen Display
- ✅ Backoffice: Dashboard & Menu Management
- ✅ Full Integration POS → KDS → Backoffice

---

## 🎯 Test Flow

1. Login kasir (PIN: 1234)
2. Browse menu (50 items available)
3. Select items with modifiers (e.g., Ayam Bakar Madu)
4. Buat order di POS
5. Order muncul di KDS
6. Chef mark ready di KDS
7. Kasir confirm completed
8. Order tercatat di Backoffice

**All flows verified ✅**

---

## 📊 Menu Examples

### Popular Items with Modifiers:
- **Ayam Bakar Madu** (Rp 55K)
  - Level Pedas: Original / Sedang / Extra
  - Add-ons: Extra Sambal, Lalapan, Nasi Putih

- **Kopi Susu Aren** (Rp 22K)
  - Suhu: Dingin / Hangat
  - Ekstra: Extra Shot / Extra Aren
  - Add-ons: Oat Milk Upgrade, Extra Shot

- **French Fries** (Rp 22K)
  - Saus: Tomat / Mayo / Keju
  - Add-ons: Extra Saus, Cheese Dip

---

*For detailed information, see `MENU_IMPORT_REPORT.md` or `IMPLEMENTASI_SUMMARY.md`*
