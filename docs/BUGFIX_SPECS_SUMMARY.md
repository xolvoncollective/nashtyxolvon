# Nashty POS - Bugfix Specs Summary

**Created:** 2026-06-14  
**Status:** Requirements Complete, Design & Tasks Pending for 3 Specs

---

## Overview

Dokumen ini merangkum semua bugfix specification yang telah dibuat untuk mengatasi bug-bug dalam checklist Nashty POS, KDS, dan Backoffice.

**Total Specs:** 8 bugfix specifications  
**Status:**
- 5 specs dengan Requirements only ✅
- 1 spec lengkap (Requirements + Design + Tasks) ✅  
- 2 specs warisan (sudah ada sebelumnya) ✅

---

## Daftar Bugfix Specs

### 1. financial-calculation-accuracy-fix ✅✅✅
**Status:** LENGKAP (Requirements + Design + Tasks)  
**Location:** `.kiro/specs/financial-calculation-accuracy-fix/`

**Bugs Covered:**
- ✅ Matematika gross sales, net sales masih salah
- ✅ Jangan ada pembulatan ketika masuk database
- ✅ COGS masih 0 karena belum ada data HPP

**Files:**
- `bugfix.md` - Requirements (44 clauses: 13 defects, 16 fixes, 15 preservation)
- `design.md` - Design document (13 code changes identified)
- `tasks.md` - Implementation tasks (39 tasks in 7 phases)

**Implementation Ready:** YES - dapat langsung dikerjakan

**Key Changes:**
- Fix net sales formula in 3 locations (use `total` instead of `subtotal - discount`)
- Remove Math.round() from tax and service charge calculations
- Use CASE WHEN for NULL handling in COGS calculations
- Add "unknown" classification for products without cost data

---

### 2. pos-shift-management-fix ⏸️
**Status:** Requirements Only  
**Location:** `.kiro/specs/pos-shift-management-fix/`

**Bugs Covered:**
- ✅ Hapus saldo petty cash atau buka shift/tutup shift
- ✅ Tambah buka shift/tutup shift untuk setiap user
- ✅ Buka shift: isi saldo petty cash
- ✅ Tutup shift: isi saldo petty cash, laporan penjual

**Files:**
- `bugfix.md` - Requirements (24 clauses: 8 defects, 8 fixes, 8 preservation)

**Needs:**
- `design.md` - Schema changes, API endpoints, workflow
- `tasks.md` - Implementation tasks

**Key Requirements:**
- Force shift opening before orders
- Track starting/ending petty cash
- Generate shift reconciliation reports
- Calculate cash discrepancies
- Per-user shift sessions

---

### 3. pos-backoffice-integration-fix ⏸️
**Status:** Requirements Only  
**Location:** `.kiro/specs/pos-backoffice-integration-fix/`

**Bugs Covered:**
- ✅ Integrasi modifier per menu dengan backoffice
- ✅ Modifier harus muncul pada POS dan KDS
- ✅ Gagal membuat menu (cek integrasi dengan backoffice)
- ✅ Status di Produk (Aktif, Nonaktif, Sold) harus terintegrasi dengan POS

**Files:**
- `bugfix.md` - Requirements (24 clauses: 8 defects, 8 fixes, 8 preservation)

**Needs:**
- `design.md` - Sync mechanism, data flow, status propagation
- `tasks.md` - Implementation tasks

**Key Requirements:**
- Sync modifier groups from Backoffice to POS/KDS
- Fix menu creation failures
- Sync product status (Active/Inactive/Sold Out)
- Real-time or near-real-time updates

---

### 4. backoffice-admin-features-fix ⏸️
**Status:** Requirements Only  
**Location:** `.kiro/specs/backoffice-admin-features-fix/`

**Bugs Covered:**
- ✅ WORKFLOW STATUS - Hapus saja
- ✅ PRODUCTION TIME - Belum terintegrasi dengan KDS
- ✅ KDS ANALYTICS - Belum terintegrasi dengan KDS
- ✅ OWNER/MANAGER/KASIR - Sesuaikan dengan rules wireframe
- ✅ OUTLETS - Integrasikan dengan database
- ✅ LAPORAN - Integrasikan dengan database dan POS
- ✅ PENGATURAN - Belum bisa upload logo, Hapus menu integrasi
- ✅ ACTIVITY LOGS - Tambahkan icon, user yang benar, timezone WIB

**Files:**
- `bugfix.md` - Requirements (63 clauses: 21 defects, 21 fixes, 21 preservation)

**Needs:**
- `design.md` - Feature removals, integrations, role permissions
- `tasks.md` - Implementation tasks

**Key Requirements:**
- Remove unused Workflow Status menu
- Integrate Production Time settings with KDS
- Implement proper role-based access control
- Fix outlets and reports database integration
- Fix activity logs (icons, user attribution, timezone)
- Enable logo upload

---

### 5. backoffice-general-settings-persistence ✅
**Status:** Requirements Only  
**Location:** `.kiro/specs/backoffice-general-settings-persistence/`

**Bug Covered:**
- ✅ Pengaturan Umum tidak tersimpan di database

**Files:**
- `bugfix.md` - Requirements

**Needs:** Design + Tasks

**Key Requirements:**
- Persist brandName, invoiceFormat, taxRate, serviceCharge, rounding settings
- Implement proper upsert logic in backend
- Retrieve and populate form fields correctly

---

### 6. backoffice-payment-methods-persistence ✅
**Status:** Requirements Only  
**Location:** `.kiro/specs/backoffice-payment-methods-persistence/`

**Bug Covered:**
- ✅ Metode Pembayaran tidak tersimpan di database

**Files:**
- `bugfix.md` - Requirements

**Needs:** Design + Tasks

**Key Requirements:**
- Store paymentMethods as JSON in settings table
- Fix JSON serialization/deserialization
- Reflect changes in POS payment options

---

### 7. backoffice-receipt-settings-persistence ✅
**Status:** Requirements Only  
**Location:** `.kiro/specs/backoffice-receipt-settings-persistence/`

**Bug Covered:**
- ✅ Pengaturan Struk tidak tersimpan di database

**Files:**
- `bugfix.md` - Requirements

**Needs:** Design + Tasks

**Key Requirements:**
- Persist 9 receipt settings (name, city, phone, address, footer, copies, QR toggles)
- Preserve multiline text and special characters
- Apply settings to thermal printer output

---

### 8. backoffice-profile-edit-functionality ✅
**Status:** Requirements Only  
**Location:** `.kiro/specs/backoffice-profile-edit-functionality/`

**Bug Covered:**
- ✅ Profile belum bisa dipencet (belum ada fitur ganti profile or edit)

**Files:**
- `bugfix.md` - Requirements

**Needs:** Design + Tasks

**Key Requirements:**
- Enable profile edit modal
- Update name, email, PIN
- Update frontend session state
- Hash PIN with bcrypt before storage

---

## Bugs Already Fixed (Marked ✅ in Checklist)

These bugs were already fixed before this session:

- ✅ invoice *hari ini* diganti dengan tanggal
- ✅ rb ganti jadi bilangan biasa
- ✅ Total Transaksi 0 void
- ✅ Penjualan per Tipe Order, takeawaynya double
- ✅ Tombol refresh hilang
- ✅ KDS tampilan berubah-ubah setiap 3 detik
- ✅ Dashboard rb ganti jadi angka actual
- ✅ Chart pendapatan harian tidak naik
- ✅ Kategori nonaktif hilang
- ✅ Produk delete/nonaktif issue

---

## Bug Checklist Coverage

### POS Module
| Bug | Spec | Status |
|-----|------|--------|
| invoice *hari ini* diganti dengan tanggal | - | ✅ Fixed |
| matematika gross sales, net sales | financial-calculation-accuracy-fix | ✅ Spec Ready |
| rb ganti jadi bilangan biasa | - | ✅ Fixed |
| jangan ada pembulatan | financial-calculation-accuracy-fix | ✅ Spec Ready |
| COGS masih 0 | financial-calculation-accuracy-fix | ✅ Spec Ready |
| shift management | pos-shift-management-fix | ⏸️ Needs Design |
| integrasi modifier | pos-backoffice-integration-fix | ⏸️ Needs Design |
| gagal membuat menu | pos-backoffice-integration-fix | ⏸️ Needs Design |
| Total Transaksi 0 void | - | ✅ Fixed |
| takeaway double | - | ✅ Fixed |
| Tombol refresh hilang | - | ✅ Fixed |

### KDS Module
| Bug | Spec | Status |
|-----|------|--------|
| Tampilan berubah setiap 3 detik | - | ✅ Fixed |
| Modifier tidak muncul | pos-backoffice-integration-fix | ⏸️ Needs Design |
| Production Time integration | backoffice-admin-features-fix | ⏸️ Needs Design |
| KDS Analytics integration | backoffice-admin-features-fix | ⏸️ Needs Design |

### Backoffice Module
| Bug | Spec | Status |
|-----|------|--------|
| Profile edit | backoffice-profile-edit-functionality | ⏸️ Needs Design |
| Dashboard rb | - | ✅ Fixed |
| Chart pendapatan | - | ✅ Fixed |
| Kategori hilang | - | ✅ Fixed |
| Produk delete | - | ✅ Fixed |
| Status produk sync | pos-backoffice-integration-fix | ⏸️ Needs Design |
| Pengaturan Umum | backoffice-general-settings-persistence | ⏸️ Needs Design |
| Metode Pembayaran | backoffice-payment-methods-persistence | ⏸️ Needs Design |
| Pengaturan Struk | backoffice-receipt-settings-persistence | ⏸️ Needs Design |
| Workflow Status | backoffice-admin-features-fix | ⏸️ Needs Design |
| Owner/Manager/Kasir rules | backoffice-admin-features-fix | ⏸️ Needs Design |
| Outlets | backoffice-admin-features-fix | ⏸️ Needs Design |
| Laporan | backoffice-admin-features-fix | ⏸️ Needs Design |
| Upload logo | backoffice-admin-features-fix | ⏸️ Needs Design |
| Activity Logs | backoffice-admin-features-fix | ⏸️ Needs Design |

---

## Next Steps

### Phase 1: Complete Design & Tasks (Priority 1)
For each spec with "⏸️ Needs Design", create:
1. `design.md` - Root cause analysis, fix implementation, testing strategy
2. `tasks.md` - Phase-based implementation tasks

**Order:**
1. pos-shift-management-fix (simpler, focused)
2. backoffice-general-settings-persistence (small, isolated)
3. backoffice-payment-methods-persistence (small, isolated)
4. backoffice-receipt-settings-persistence (small, isolated)
5. backoffice-profile-edit-functionality (small, isolated)
6. pos-backoffice-integration-fix (moderate complexity)
7. backoffice-admin-features-fix (complex, multiple features)

### Phase 2: Implementation
Execute tasks in order of priority:
1. **financial-calculation-accuracy-fix** (ready to implement, 39 tasks)
2. Settings persistence fixes (quick wins)
3. POS shift management (critical for audit)
4. Integration fixes (POS-Backoffice sync)
5. Admin features (multiple features)

### Phase 3: Testing & Validation
- Run test suites for each bugfix
- Manual smoke testing
- Cross-module integration testing
- User acceptance testing

---

## File Structure

```
.kiro/specs/
├── financial-calculation-accuracy-fix/
│   ├── .config.kiro
│   ├── bugfix.md           ✅
│   ├── design.md           ✅
│   └── tasks.md            ✅
├── pos-shift-management-fix/
│   ├── .config.kiro
│   ├── bugfix.md           ✅
│   ├── design.md           ⏸️ TODO
│   └── tasks.md            ⏸️ TODO
├── pos-backoffice-integration-fix/
│   ├── .config.kiro
│   ├── bugfix.md           ✅
│   ├── design.md           ⏸️ TODO
│   └── tasks.md            ⏸️ TODO
├── backoffice-admin-features-fix/
│   ├── .config.kiro
│   ├── bugfix.md           ✅
│   ├── design.md           ⏸️ TODO
│   └── tasks.md            ⏸️ TODO
├── backoffice-general-settings-persistence/
│   ├── .config.kiro
│   ├── bugfix.md           ✅
│   ├── design.md           ⏸️ TODO
│   └── tasks.md            ⏸️ TODO
├── backoffice-payment-methods-persistence/
│   ├── .config.kiro
│   ├── bugfix.md           ✅
│   ├── design.md           ⏸️ TODO
│   └── tasks.md            ⏸️ TODO
├── backoffice-receipt-settings-persistence/
│   ├── .config.kiro
│   ├── bugfix.md           ✅
│   ├── design.md           ⏸️ TODO
│   └── tasks.md            ⏸️ TODO
└── backoffice-profile-edit-functionality/
    ├── .config.kiro
    ├── bugfix.md           ✅
    ├── design.md           ⏸️ TODO
    └── tasks.md            ⏸️ TODO
```

---

## Summary Statistics

- **Total Bugs in Checklist:** ~35
- **Bugs Already Fixed:** ~10 (✅)
- **Bugs with Specs Created:** ~25 (covered by 8 specs)
- **Specs Complete (R+D+T):** 1
- **Specs with Requirements Only:** 7
- **Total Requirements Clauses:** 187 (across all specs)
- **Tasks Ready for Implementation:** 39 (financial-calculation only)

---

## Methodology

All bugfix specs follow the **Bug Condition Methodology**:

1. **Current Behavior (Defect)** - Numbered clauses (X.Y) describing what's wrong
2. **Expected Behavior (Correct)** - Numbered clauses describing correct behavior
3. **Unchanged Behavior (Regression Prevention)** - Preservation clauses

This ensures:
- Clear traceability from bug to fix
- Comprehensive test coverage
- Prevention of regressions
- Property-based testing support

---

## Repository

All specs pushed to: `https://github.com/zaidunk/himapatokayam.git`  
Branch: `main`  
Commit: `17f4c3b` - "feat: Add comprehensive bugfix specs for Nashty POS system"

---

*Last Updated: 2026-06-14*
*Status: Active Development*
