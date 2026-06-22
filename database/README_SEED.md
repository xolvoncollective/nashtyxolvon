# NASHTY OS - Production-Grade Seed Data

## 📋 Overview

Seed data yang komprehensif dan realistis untuk Nashty OS POS System. Data ini dirancang untuk UAT, demo, dan development dengan pola transaksi yang menyerupai operasional restoran sungguhan.

## ✨ Features

- ✅ **Idempotent**: Aman dijalankan berkali-kali (ON CONFLICT DO UPDATE)
- ✅ **Realistic**: Pola transaksi menyerupai restoran sungguhan
- ✅ **Complete**: 95+ products, 300 members, 3000-5000 orders
- ✅ **FK-Safe**: Urutan insert mengikuti dependency foreign keys
- ✅ **Constraint-Aware**: Semua CHECK constraints dan UNIQUE constraints dipenuhi
- ✅ **User Mapping Fixed**: system_users → users mapping solved

## 📦 File Structure

```
database/
├── SEED_MASTER_REALISTIC.sql       # Part 1: Master data (tenants, outlets, users, categories)
├── SEED_PART2_PRODUCTS.sql         # Part 2A: Hot Chicken & Burgers (27 items)
├── SEED_PART2B_BEVERAGES.sql       # Part 2B: Beverages & Snacks (40 items)
├── SEED_PART2C_EXTRAS.sql          # Part 2C: Sauces, Desserts, Modifiers (28 items)
├── SEED_PART3_MEMBERS_COSTS.sql    # Part 3: Members & Operational Costs
├── SEED_PART4_ORDERS.sql           # Part 4: Realistic Order Generation
└── README_SEED.md                  # This file
```

## 🚀 Quick Start

### Option 1: Run All at Once (Recommended for Supabase)

Copy paste semua file secara berurutan ke Supabase SQL Editor:

```sql
-- 1. Master Data
\i SEED_MASTER_REALISTIC.sql

-- 2. Products
\i SEED_PART2_PRODUCTS.sql
\i SEED_PART2B_BEVERAGES.sql
\i SEED_PART2C_EXTRAS.sql

-- 3. Members & Costs
\i SEED_PART3_MEMBERS_COSTS.sql

-- 4. Orders (may take 30-60 seconds)
\i SEED_PART4_ORDERS.sql
```

### Option 2: Manual Copy-Paste (Supabase SQL Editor)

1. **SEED_MASTER_REALISTIC.sql** - Copy paste → Execute
2. **SEED_PART2_PRODUCTS.sql** - Copy paste → Execute
3. **SEED_PART2B_BEVERAGES.sql** - Copy paste → Execute
4. **SEED_PART2C_EXTRAS.sql** - Copy paste → Execute
5. **SEED_PART3_MEMBERS_COSTS.sql** - Copy paste → Execute
6. **SEED_PART4_ORDERS.sql** - Copy paste → Execute (akan generate ribuan orders)

### Option 3: CLI (psql)

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres" \
  -f SEED_MASTER_REALISTIC.sql \
  -f SEED_PART2_PRODUCTS.sql \
  -f SEED_PART2B_BEVERAGES.sql \
  -f SEED_PART2C_EXTRAS.sql \
  -f SEED_PART3_MEMBERS_COSTS.sql \
  -f SEED_PART4_ORDERS.sql
```

## 📊 Data Summary

### Master Data (Part 1)
- **1** Tenant: Nashty Hot Chicken
- **3** Outlets: Galaxy Mall, Pakuwon TC, Tunjungan Plaza 6
- **5** System Users (superadmin, owner, 2 managers, 1 cashier)
- **5** POS Users (cashiers with PINs)
- **7** Categories
- **System & Outlet Access** mappings

### Products (Part 2A, 2B, 2C)
- **15** Hot Chicken products (original, level 1-5, wings, strips, popcorn)
- **12** Burgers & Sandwiches
- **10** Rice Bowls
- **25** Beverages (cold + hot)
- **15** Snacks & Sides
- **8** Sauces
- **10** Desserts
- **Total: 95 products**

### Modifiers & Payments (Part 2C)
- **5** Modifier Groups (Level Pedas, Extra Topping, Ukuran, Gula, Es)
- **18** Modifier Options
- **8** Payment Methods (Cash, QRIS, GoPay, OVO, ShopeePay, Debit, Credit, Transfer)
- **5** Kitchen Stations

### Members & Costs (Part 3)
- **300** Members
  - 9 VIP (3%)
  - 36 Loyal (12%)
  - 75 Regular (25%)
  - 180 New (60%)
- **~200** Cost Entries (3 months operations)

### Orders (Part 4)
- **3000-5000** Orders over 90 days
- **Realistic patterns**:
  - Lunch peak (11:00-14:00): 40% of orders
  - Dinner peak (18:00-21:00): 50% of orders
  - Weekend: 2x weekday volume
- **Payment Mix**: Cash 25%, QRIS 35%, eWallet 30%, Card 10%
- **Order Types**: Dine-in 60%, Takeaway 25%, GoFood 10%, GrabFood 5%
- **Member Orders**: 35% associated with members

## 🔑 Critical Fix: User Mapping

### The Problem
```
orders.user_id → users.id
user_sessions.user_id → system_users.id
```

Jika tidak ada mapping, maka:
- ✅ Login berhasil (JWT dari system_users)
- ❌ Transaction gagal (tidak ada users record)

### The Solution

```sql
-- system_users (authentication)
INSERT INTO system_users (id, username, ...) VALUES
  ('a1000000-0000-0000-0000-000000000005', 'cashier.citra', ...);

-- users (POS transactions) - SAME ID!
INSERT INTO users (id, tenant_id, outlet_id, ...) VALUES
  ('a1000000-0000-0000-0000-000000000005', ...);  -- Same UUID
```

Sekarang:
- ✅ Login berhasil → `system_users`
- ✅ Create order → `users` (same ID, FK valid!)

## 🧪 Verification Queries

```sql
-- Check master data
SELECT 'Tenants' AS table_name, COUNT(*) FROM tenants
UNION ALL SELECT 'Outlets', COUNT(*) FROM outlets
UNION ALL SELECT 'System Users', COUNT(*) FROM system_users
UNION ALL SELECT 'POS Users', COUNT(*) FROM users
UNION ALL SELECT 'Categories', COUNT(*) FROM categories;

-- Check products
SELECT 'Products' AS table_name, COUNT(*) FROM products
UNION ALL SELECT 'Modifier Groups', COUNT(*) FROM modifier_groups
UNION ALL SELECT 'Modifier Options', COUNT(*) FROM modifier_options
UNION ALL SELECT 'Payment Methods', COUNT(*) FROM payment_methods;

-- Check transactional data
SELECT 'Members' AS table_name, COUNT(*) FROM members
UNION ALL SELECT 'Orders', COUNT(*) FROM orders
UNION ALL SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL SELECT 'Payments', COUNT(*) FROM payments
UNION ALL SELECT 'Costs', COUNT(*) FROM nashtycosts;

-- Check user mapping (CRITICAL!)
SELECT 
  su.id AS system_user_id,
  su.username,
  u.id AS pos_user_id,
  u.name,
  CASE WHEN su.id = u.id THEN '✅ Mapped' ELSE '❌ NOT MAPPED' END AS status
FROM system_users su
LEFT JOIN users u ON su.id = u.id
WHERE su.role = 'cashier';

-- Check order distribution by hour
SELECT 
  EXTRACT(HOUR FROM created_at) AS hour,
  COUNT(*) AS orders,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM orders
GROUP BY hour
ORDER BY hour;

-- Check payment method distribution
SELECT 
  payment_method,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM orders
GROUP BY payment_method
ORDER BY count DESC;

-- Check member segments
SELECT 
  segment,
  COUNT(*) AS count,
  ROUND(AVG(total_spent), 0) AS avg_spent,
  ROUND(AVG(visit_count), 1) AS avg_visits
FROM members
GROUP BY segment
ORDER BY 
  CASE segment
    WHEN 'vip' THEN 1
    WHEN 'loyal' THEN 2
    WHEN 'regular' THEN 3
    ELSE 4
  END;
```

## 🎯 Use Cases

### 1. UAT Testing
Gunakan data ini untuk UAT dengan stakeholders:
- Dashboard akan langsung menampilkan chart realistis
- Analytics menunjukkan peak hours dan trends
- Member management dengan segmentasi

### 2. Demo
Perfect untuk demo ke calon klien:
- 90 hari historical data
- Realistic transaction patterns
- Complete product catalog

### 3. Development
Ideal untuk development:
- Test edge cases (VIP members, bulk orders)
- Performance testing dengan ribuan records
- Integration testing semua flow

### 4. Training
Gunakan untuk training staff baru:
- Familiar product names
- Realistic order scenarios
- Complete payment methods

## ⚠️ Important Notes

1. **Idempotency**: Aman di-run ulang. Tidak akan duplicate data.
2. **Performance**: Part 4 (orders) akan butuh 30-60 detik.
3. **UUIDs**: Master data menggunakan deterministic UUIDs, transactions menggunakan random UUIDs.
4. **Passwords**: Semua user password adalah `nashty@2024` (bcrypt hash provided).
5. **PINs**: Cashier PINs adalah 1234, 2345, 3456, dll (bcrypt hash provided).

## 🔧 Troubleshooting

### "Foreign key violation"
- Pastikan menjalankan files secara berurutan (Part 1 → 2 → 3 → 4)
- Check apakah Part 1 sudah berhasil sebelum run Part 2

### "Unique constraint violation"
- Normal jika run ulang. Script akan UPDATE instead of INSERT.
- Check ON CONFLICT clause di masing-masing INSERT.

### "Function does not exist"
- Part 4 create temporary function. Pastikan Postgres version 12+.
- Jika error, copy paste manual isi functionnya.

### "Orders not generated"
- Check execution time. Part 4 butuh waktu lebih lama.
- Verify dengan: `SELECT COUNT(*) FROM orders;`

## 📞 Support

Jika ada masalah dengan seed data:
1. Check verification queries di atas
2. Review error message dan trace ke file mana
3. Pastikan Supabase project tidak ada restrictions

## 🎉 Result

Setelah semua seed berhasil, Anda akan punya:
- ✅ Dashboard yang langsung hidup dengan data 90 hari
- ✅ 95+ products siap dijual
- ✅ 300 members dengan segmentasi realistic
- ✅ 3000-5000 orders dengan pola realistis
- ✅ Analytics yang meaningful
- ✅ Complete operational cost data
- ✅ User mapping yang benar (login → transaction works!)

**Happy seeding! 🚀**
