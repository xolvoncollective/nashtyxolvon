# DATABASE MAP - NASHTY OS Database Architecture

**Document Created**: 2026-06-21  
**Purpose**: Complete database schema mapping and relationships  
**Status**: Read-Only Documentation (No modifications made)

---

## 🗄️ Database Overview

**Platform**: Supabase PostgreSQL  
**Project ID**: mzucfndifneytbesirkx  
**Schema Source**: `/database/schema.sqlite.sql` (SQLite format, adapted for PostgreSQL)  
**Total Tables**: 22+ tables  
**Architecture**: Multi-tenant SaaS with tenant isolation

---

## 📋 Table Categories

### Core Business Tables
1. tenants
2. outlets
3. users
4. members (customers)

### Menu Management Tables
5. categories
6. products
7. modifier_groups
8. modifier_options
9. product_modifiers (junction)

### Order Management Tables
10. orders
11. order_items
12. order_item_modifiers
13. payments

### Operational Tables
14. shifts
15. stations (KDS)
16. payment_methods

### System Tables
17. settings
18. activity_logs
19. favorites
20. nashtycosts

### Additional Tables (Mentioned in code but not in schema)
21. outlet_settings (references in Edge Functions)
22. analytics_cache (mentioned in analytics-api)

---

## 📊 Detailed Table Schemas

### 1. TENANTS (SaaS Root)

**Purpose**: Multi-tenant isolation (business/brand level)

**Columns**:
```sql
id              TEXT PRIMARY KEY
name            TEXT NOT NULL
slug            TEXT UNIQUE NOT NULL
plan            TEXT DEFAULT 'starter' CHECK(plan IN ('starter', 'pro', 'enterprise'))
status          TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'cancelled'))
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

**Used By**: All systems (tenant_id foreign key throughout)

**Relationships**:
- ONE tenant → MANY outlets
- ONE tenant → MANY users
- ONE tenant → MANY categories
- ONE tenant → MANY products
- ONE tenant → MANY orders
- ONE tenant → MANY members

---

### 2. OUTLETS (Stores/Locations)

**Purpose**: Physical locations under a tenant

**Columns**:
```sql
id              TEXT PRIMARY KEY
tenant_id       TEXT NOT NULL → tenants(id) ON DELETE CASCADE
name            TEXT NOT NULL
slug            TEXT NOT NULL
address         TEXT
phone           TEXT
status          TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive'))
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
UNIQUE(tenant_id, slug)
```

**Additional Fields** (from code references):
```sql
qris_static_url         TEXT    (QRIS payment QR code URL)
receipt_logo            TEXT    (Logo for receipts)
receipt_header          TEXT
receipt_footer          TEXT
receipt_font_size       TEXT
receipt_qr_feedback     TEXT
receipt_social_facebook TEXT
receipt_social_instagram TEXT
receipt_social_twitter   TEXT
receipt_social_tiktok    TEXT
receipt_promos          JSON
display_background_color TEXT
display_text_color      TEXT
display_accent_color    TEXT
display_promo_images    JSON
```

**Used By**: POS, KDS, Backoffice

**Relationships**:
- MANY outlets → ONE tenant
- ONE outlet → MANY users
- ONE outlet → MANY orders
- ONE outlet → MANY shifts
- ONE outlet → MANY stations

---

### 3. USERS (Staff)

**Columns**:
```sql
id, tenant_id, outlet_id, email, phone, name, role, pin, password_hash, avatar, status
```

**Roles**: owner, manager, cashier, kitchen

**Used By**: All systems (authentication + authorization)

---

### 4. CATEGORIES → 5. PRODUCTS → 6-9. MODIFIERS

**Menu Hierarchy**:
```
categories (id, tenant_id, name, slug, status)
  ↓
products (id, tenant_id, category_id, name, price, cost, image_url, production_time)
  ↓
product_modifiers (product_id, modifier_group_id) [Junction Table]
  ↓
modifier_groups (id, tenant_id, name, type, required, max_select)
  ↓
modifier_options (id, group_id, name, price_adjustment)
```

**Used By**: POS (menu), Backoffice (menu management), KDS (production time)

---

### 10-13. ORDER SYSTEM

**Order Flow**:
```sql
orders (id, tenant_id, outlet_id, user_id, shift_id, order_number, 
        order_type, table_number, subtotal, tax, total, 
        payment_method, payment_status, order_status, kitchen_status)
  ↓
order_items (id, order_id, product_id, quantity, unit_price, subtotal, notes)
  ↓
order_item_modifiers (id, order_item_id, modifier_option_id, price_adjustment)
  ↓
payments (id, order_id, method, amount, change_amount)
```

**Order Types**: dine-in, takeaway, gofood, grabfood, shopeefood

**Statuses**:
- order_status: pending, confirmed, preparing, ready, completed, cancelled
- kitchen_status: pending, preparing, ready, served
- payment_status: pending, paid, cancelled

**Used By**: POS (create), KDS (update status), Backoffice (reports)

---

### 14. SHIFTS, 15. STATIONS, 16. PAYMENT_METHODS

**Shifts**: Cashier session tracking (start_cash, end_cash, variance)
**Stations**: KDS kitchen stations
**Payment_Methods**: Configurable per tenant (cash, card, ewallet, qris, transfer)

---

### 17. SETTINGS (Key-Value Store)

**Structure**:
```sql
id, tenant_id, outlet_id, key, value, type (string|number|boolean|json)
```

**Used By**: All systems for configuration

---

### 18. ACTIVITY_LOGS

**Audit Trail**:
```sql
id, tenant_id, user_id, action, entity_type, entity_id, description, metadata, ip_address, created_at
```

**Used By**: Backoffice (activity logs page)

---

### 19. FAVORITES

**User's Favorite Products** (Quick Access):
```sql
id, user_id, product_id, position, created_at
UNIQUE(user_id, product_id)
```

**Used By**: POS (favorites grid)

---

### 20. NASHTYCOSTS

**Operational Expenses**:
```sql
id, tenant_id, outlet_id, amount, category, description, created_at
```

**Categories**: bahan-baku, operasional, gaji, utilitas, sewa, lainnya

**Used By**: Cost Management module

**Note**: Also uses localStorage fallback (`nashty_costs`)

---

## 🔗 Entity Relationship Diagram

```
tenants (root)
  ├─→ outlets
  │     ├─→ users
  │     ├─→ orders
  │     │     ├─→ order_items
  │     │     │     └─→ order_item_modifiers
  │     │     └─→ payments
  │     ├─→ shifts
  │     ├─→ stations
  │     └─→ settings
  ├─→ categories
  │     └─→ products
  │           ├─→ product_modifiers → modifier_groups → modifier_options
  │           └─→ favorites
  ├─→ members (customers)
  ├─→ payment_methods
  ├─→ activity_logs
  └─→ nashtycosts
```

---

## 📈 Indexes (Performance Optimization)

**35+ indexes defined** in schema:

**Tenant Isolation**:
- `idx_outlets_tenant`, `idx_users_tenant`, `idx_categories_tenant`, `idx_products_tenant`, `idx_orders_tenant`

**Foreign Key Lookups**:
- `idx_users_outlet`, `idx_products_category`, `idx_orders_outlet`, `idx_orders_shift`

**Status Filtering**:
- `idx_orders_status`, `idx_orders_kitchen_status`, `idx_order_items_kitchen`

**Date Range Queries**:
- `idx_orders_created`, `idx_nashtycosts_created`

**Favorites Ordering**:
- `idx_favorites_user`, `idx_favorites_product`, `idx_favorites_position`

---

## 🔑 Foreign Key Relationships

**Cascade Deletes**:
- tenant deleted → all tenant data deleted
- outlet deleted → outlet-specific data deleted
- order deleted → order_items and payments deleted
- modifier_group deleted → modifier_options deleted
- product deleted → product_modifiers deleted

**Set Null**:
- shift deleted → orders.shift_id = NULL
- outlet deleted → users.outlet_id = NULL

---

## 🗺️ Table Usage by System

### POS System
**Primary Tables**:
- products, categories, modifier_groups, modifier_options
- orders, order_items, order_item_modifiers
- shifts, users, outlets
- favorites

**Read-Heavy**: products, categories, modifiers
**Write-Heavy**: orders, order_items

### KDS System
**Primary Tables**:
- orders (kitchen_status updates)
- order_items (kitchen_status tracking)
- products (production_time)
- settings (KDS config)

**Update Pattern**: Polling every 5s

### Backoffice System
**Manages All Tables**: Full CRUD access

**Dashboard**: orders, order_items (aggregations)
**Menu**: products, categories, modifiers
**Team**: users
**Business**: outlets, tenants
**Reports**: orders, order_items, payments (complex queries)

### Cost System
**Primary Table**: nashtycosts

**Fallback**: localStorage (`nashty_costs`)

### CRM System
**Primary Table**: members

**Fallback**: localStorage (`nashty_customers`, `nashty_rewards`, `nashty_point_txs`)

---

## 🔍 Query Patterns

### High-Frequency Queries

1. **POS Menu Load**:
```sql
SELECT * FROM products WHERE tenant_id = ? AND status = 'active'
SELECT * FROM categories WHERE tenant_id = ?
SELECT * FROM modifier_groups WHERE tenant_id = ?
```

2. **KDS Order Queue**:
```sql
SELECT * FROM orders 
WHERE outlet_id = ? 
AND kitchen_status IN ('pending', 'preparing')
ORDER BY created_at ASC
```

3. **Dashboard KPIs**:
```sql
SELECT SUM(total), COUNT(*) FROM orders 
WHERE tenant_id = ? 
AND payment_status = 'paid' 
AND created_at >= ?
```

4. **Reports - Sales Summary**:
```sql
SELECT DATE(created_at), SUM(total), COUNT(*) 
FROM orders 
WHERE tenant_id = ? AND payment_status = 'paid'
GROUP BY DATE(created_at)
```

---

## 🚨 Critical Database Issues

### 1. Missing Tables in Schema

**Referenced in Code but Missing in Schema**:
- `outlet_settings` (referenced in settings-api)
- `analytics_cache` (referenced in analytics-api)

**Impact**: Code may fail or use fallback behavior

### 2. Inconsistent Field Names

**Example**: `order_items.modifier_options` vs `order_item_modifiers` table

**Impact**: Code uses JSON field but schema defines relational table

### 3. No Stored Procedures or Functions

**All business logic in application layer** (Edge Functions)

**Impact**: No database-level data integrity checks

### 4. No Database-Level Constraints

**Missing**:
- CHECK constraints on prices (no negative prices)
- CHECK constraints on quantities
- Referential integrity in some junction tables

---

## 💾 Storage Buckets (Supabase Storage)

### 1. receipts (public)
**Contents**: Receipt logos
**Path Pattern**: `logos/{outletId}/logo-{timestamp}.{ext}`
**Used By**: POS, Backoffice

### 2. promotions (public)
**Contents**: Promo images for customer display
**Path Pattern**: `promos/{outletId}/promo-{timestamp}-{index}.{ext}`
**Used By**: POS (customer display)

### 3. outlet-assets (public)
**Contents**: QRIS images, product images
**Path Pattern**: 
- `qris/{outletId}-{timestamp}.{ext}`
- `products/{outletId}/{productId}-{timestamp}.{ext}`
**Used By**: Backoffice, POS

---

## 📊 Data Volume Estimates

**Not provided in codebase** (no seed data or production metrics)

**Indexes suggest**:
- Orders table: High volume (date-based partitioning may be needed)
- Products table: Moderate volume
- Users table: Low volume

---

**End of Database Map**
