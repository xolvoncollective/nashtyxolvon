# Nashty OS - Seed Data Execution Guide

## Overview
Production-grade seed data for Nashty Hot Chicken POS system with realistic transaction patterns, 300 members, and 90 days of order history.

## ✅ Schema Compliance
All seed files have been verified against the actual database schema from `DBNX.txt`:

### Fixed Issues:
- ✅ `tenants` table: Now uses `status`, `plan`, `subscription_ends_at` (not `is_active`)
- ✅ `outlets` table: Uses correct columns (status, not is_active)
- ✅ `system_users` table: Includes `tenant_id` column
- ✅ `users` table: Uses correct columns (pin_hash, role, status)
- ✅ `categories` table: Includes all metadata (icon, color, display_order, status)
- ✅ `payment_methods` table: Uses `is_active` (not status)

### Critical User Mapping Fix:
The seed data implements the correct user mapping pattern:
```sql
-- system_users (for authentication/JWT)
INSERT INTO system_users (id, ...) VALUES ('a1000000-...005', 'cashier.citra', ...);

-- users (for POS transactions) - SAME ID!
INSERT INTO users (id, ...) VALUES ('a1000000-...005', ...);
```

This ensures:
- Login works (JWT from system_users)
- Transactions work (orders.user_id FK to users)
- No more "user not found" errors

## 📦 File Structure

### Part 1: Master Data
**File**: `SEED_MASTER_REALISTIC.sql`
**Contents**:
- 1 Tenant (Nashty Hot Chicken)
- 3 Outlets (Galaxy Mall, Pakuwon TC, Tunjungan Plaza 6)
- 5 System Users (superadmin, owner, 2 managers, 1 cashier)
- 5 POS Users (cashiers with PIN)
- 7 Categories
- System & outlet access mappings

**Execution time**: ~1 second

### Part 2A: Products - Main Menu
**File**: `SEED_PART2_PRODUCTS.sql`
**Contents**:
- 15 Hot Chicken items (1pc, 2pc, wings, strips, popcorn)
- 12 Burgers & Sandwiches
- 10 Rice Bowls

**Total**: 37 products

### Part 2B: Beverages & Snacks
**File**: `SEED_PART2B_BEVERAGES.sql`
**Contents**:
- 10 Hot Beverages (coffee, tea variants)
- 15 Cold Beverages (iced drinks, sodas, juices)
- 15 Snacks & Sides (fries, nuggets, salads, soups)

**Total**: 40 products

### Part 2C: Extras & Configuration
**File**: `SEED_PART2C_EXTRAS.sql`
**Contents**:
- 8 Sauces (sambal matah, BBQ, teriyaki, etc)
- 10 Desserts (ice cream, cakes, sundaes)
- 5 Modifier Groups (spice level, toppings, drink size, sugar level, ice)
- 18 Modifier Options
- 8 Payment Methods (Cash, QRIS, GoPay, OVO, ShopeePay, Cards, Transfer)
- 5 KDS Stations

**Total**: 18 products + configuration data

### Part 3: Members & Costs
**File**: `SEED_PART3_MEMBERS_COSTS.sql`
**Contents**:
- 300 Members with realistic distribution:
  - VIP: 9 members (3%) - Rp 5-15M total spent
  - Loyal: 36 members (12%) - Rp 1-4M total spent
  - Regular: 75 members (25%) - Rp 100k-600k total spent
  - New: 180 members (60%) - < Rp 100k total spent
- 90 days of operational costs:
  - Monthly rent (3 outlets x 3 months)
  - Weekly costs (bahan baku, operasional, utilities, salaries)

**Execution time**: ~2 seconds

### Part 4: Realistic Orders
**File**: `SEED_PART4_ORDERS.sql`
**Contents**:
- 3000-5000 orders over 90 days
- Realistic patterns:
  - Lunch peak (11:00-14:00): 40% of daily orders
  - Dinner peak (18:00-21:00): 50% of daily orders
  - Off-peak: 10% of daily orders
  - Weekend: 2x weekday volume
- Payment distribution:
  - Cash: 25%
  - QRIS: 35%
  - eWallet: 30%
  - Card: 10%
- Order types:
  - Dine-in: 60%
  - Takeaway: 25%
  - GoFood: 10%
  - GrabFood: 5%
- Member association: 35% of orders

**Execution time**: ~30-60 seconds (generates complex transaction data)

## 🚀 Execution Order

### Method 1: Run All at Once
```bash
psql -U postgres -d nashtyos_production -f database/SEED_ALL.sql
```

### Method 2: Run Step by Step (Recommended for First Time)
```bash
# Step 1: Master data
psql -U postgres -d nashtyos_production -f database/SEED_MASTER_REALISTIC.sql

# Step 2: Products
psql -U postgres -d nashtyos_production -f database/SEED_PART2_PRODUCTS.sql
psql -U postgres -d nashtyos_production -f database/SEED_PART2B_BEVERAGES.sql
psql -U postgres -d nashtyos_production -f database/SEED_PART2C_EXTRAS.sql

# Step 3: Members & Costs
psql -U postgres -d nashtyos_production -f database/SEED_PART3_MEMBERS_COSTS.sql

# Step 4: Orders (this takes time)
psql -U postgres -d nashtyos_production -f database/SEED_PART4_ORDERS.sql
```

### Method 3: Via Supabase Dashboard
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of each file
3. Run in order (Part 1 → 2A → 2B → 2C → 3 → 4)

## 🔐 Default Credentials

### Backoffice Login (system_users)
| Username | Password | Role | Access |
|----------|----------|------|--------|
| `superadmin` | `nashty@2024` | Superadmin | All systems, all outlets |
| `owner.nashty` | `nashty@2024` | Owner | Backoffice, CRM, Cost (all outlets) |
| `manager.galaxy` | `nashty@2024` | Manager | POS, KDS, Backoffice (Galaxy only) |
| `manager.pakuwon` | `nashty@2024` | Manager | POS, KDS, Backoffice (Pakuwon only) |
| `cashier.citra` | `nashty@2024` | Cashier | POS only (Galaxy only) |

### POS Login (users with PIN)
| Name | PIN | Outlet |
|------|-----|--------|
| Citra Kusuma | 1234 | Galaxy Mall |
| Budi Santoso | 2345 | Galaxy Mall |
| Ani Wijaya | 3456 | Galaxy Mall |
| Dina Permata | 4567 | Pakuwon TC |
| Eko Prasetyo | 5678 | Pakuwon TC |

## 📊 Expected Data Volume

| Entity | Count | Details |
|--------|-------|---------|
| Tenants | 1 | Nashty Hot Chicken |
| Outlets | 3 | Galaxy, Pakuwon, TP6 |
| System Users | 5 | Multi-system access |
| POS Users | 5 | Cashiers with PIN |
| Categories | 7 | Hot Chicken to Desserts |
| Products | 95 | Complete menu |
| Modifier Groups | 5 | Spice, toppings, size, sugar, ice |
| Modifier Options | 18 | Various choices |
| Payment Methods | 8 | All major methods |
| KDS Stations | 5 | Kitchen, beverage, packing |
| Members | 300 | Realistic segments |
| Orders | 3000-5000 | 90 days of realistic data |
| Order Items | 8000-15000 | Avg 2.5 items per order |
| Payments | 3000-5000 | One per order |
| Costs | ~150 | 90 days operational |

## ✅ Verification Queries

### After Part 1:
```sql
SELECT 'Tenants' AS entity, COUNT(*) FROM tenants
UNION ALL SELECT 'Outlets', COUNT(*) FROM outlets
UNION ALL SELECT 'System Users', COUNT(*) FROM system_users
UNION ALL SELECT 'POS Users', COUNT(*) FROM users
UNION ALL SELECT 'Categories', COUNT(*) FROM categories;
```

### After Part 2:
```sql
SELECT 
  c.name AS category,
  COUNT(p.id) AS product_count,
  SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) AS active_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name
ORDER BY c.display_order;
```

### After Part 3:
```sql
SELECT 
  segment,
  COUNT(*) AS member_count,
  ROUND(AVG(total_spent), 0) AS avg_spent,
  ROUND(AVG(visit_count), 1) AS avg_visits
FROM members
GROUP BY segment
ORDER BY 
  CASE segment
    WHEN 'vip' THEN 1
    WHEN 'loyal' THEN 2
    WHEN 'regular' THEN 3
    WHEN 'new' THEN 4
  END;
```

### After Part 4:
```sql
-- Order volume by outlet
SELECT 
  o.name AS outlet,
  COUNT(ord.id) AS order_count,
  SUM(ord.total) AS total_revenue
FROM orders ord
JOIN outlets o ON o.id = ord.outlet_id
GROUP BY o.name
ORDER BY total_revenue DESC;

-- Orders by day of week
SELECT 
  TO_CHAR(created_at, 'Day') AS day_of_week,
  COUNT(*) AS order_count
FROM orders
GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
ORDER BY EXTRACT(DOW FROM created_at);

-- Payment method distribution
SELECT 
  payment_method,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM orders
GROUP BY payment_method
ORDER BY count DESC;
```

## 🎯 Business Insights Available

With this seed data, you can immediately test:

1. **POS Operations**:
   - Login with cashiers
   - Create orders with modifiers
   - Process different payment methods
   - Test member lookup and points

2. **KDS System**:
   - View orders in kitchen stations
   - Update kitchen status
   - Track preparation times

3. **Backoffice Analytics**:
   - Sales trends (daily, weekly, monthly)
   - Top products analysis
   - Member segmentation
   - Cost tracking and profit margins
   - Peak hours analysis

4. **Multi-Outlet Management**:
   - Compare outlet performance
   - Cross-outlet reporting
   - Outlet-specific access control

## 🔄 Idempotency

All seed scripts are idempotent (safe to run multiple times):
- Uses `ON CONFLICT DO UPDATE` for master data
- Uses `ON CONFLICT DO NOTHING` for transaction data
- Won't create duplicates if run again

## 🧹 Clean Up (if needed)

To start fresh:
```sql
-- WARNING: This deletes all data!
TRUNCATE TABLE order_item_modifiers, order_items, orders, payments CASCADE;
TRUNCATE TABLE nashtycosts CASCADE;
TRUNCATE TABLE members CASCADE;
TRUNCATE TABLE product_modifiers, products, categories CASCADE;
TRUNCATE TABLE modifier_options, modifier_groups CASCADE;
TRUNCATE TABLE payment_methods CASCADE;
TRUNCATE TABLE stations CASCADE;
TRUNCATE TABLE user_outlet_access, user_system_access CASCADE;
TRUNCATE TABLE users, system_users CASCADE;
TRUNCATE TABLE outlets, tenants CASCADE;
```

Then re-run all seed files.

## 📝 Notes

1. **Performance**: Part 4 (orders) uses PL/pgSQL function for efficient bulk generation
2. **Randomization**: Transaction data uses PostgreSQL's `random()` for variety
3. **UUIDs**: Master data uses deterministic UUIDs, transactions use `gen_random_uuid()`
4. **Timestamps**: All dates are relative to NOW() for realistic data aging
5. **Foreign Keys**: All FK relationships are properly maintained

## 🎉 Ready for Production!

After running all seeds, your system will have:
- ✅ Complete menu with 95 products
- ✅ 300 realistic customer profiles
- ✅ 3000-5000 orders with proper business patterns
- ✅ 90 days of operational cost data
- ✅ Multiple outlets with staff
- ✅ Full payment method support
- ✅ KDS station configuration
- ✅ Analytics-ready transaction data

Perfect for UAT testing, training, and production deployment!
