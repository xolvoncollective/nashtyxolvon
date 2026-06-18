# SQLite Database Baseline (Stage 0 Baseline)

## Schema Overview
The application uses SQLite as its primary database. The schema is defined in `backoffice/backend/src/db/schema.sql` and includes tenant isolation columns (`tenant_id`) across most tables, indicating a multi-tenant SaaS architecture.

## Tables & Relationships

### Core Entities
- **tenants**: The highest level entity (Business/Brand).
- **outlets**: Store locations belonging to tenants. (FK: tenant_id)
- **users**: Staff members. (FK: tenant_id, outlet_id)
- **members**: Customers belonging to tenants.

### Menu & Products
- **categories**: Product groupings. (FK: tenant_id)
- **products**: Menu items. (FK: tenant_id, category_id)
- **modifier_groups**: Groups of modifiers (e.g., Size, Sugar Level). (FK: tenant_id)
- **modifier_options**: Choices within a group. (FK: group_id)
- **product_modifiers**: Mapping table for products to modifier groups. (FK: product_id, modifier_group_id)

### Transactions
- **shifts**: Cashier shifts. (FK: outlet_id, user_id)
- **orders**: Transaction header. (FK: tenant_id, outlet_id, shift_id, user_id)
- **order_items**: Products within an order. (FK: order_id, product_id)
- **order_item_modifiers**: Selected modifiers for order items. (FK: order_item_id)
- **payments**: Split payment tracking per order. (FK: order_id)

### Operations & Config
- **activity_logs**: Audit logs for user actions.
- **settings**: Key-value store for tenant configurations.
- **payment_methods**: Configurable payment methods per tenant.
- **stations**: Kitchen routing stations.

### External Silo Tables
- **Cost Management**:
  - `cost_bahan`: Ingredients.
  - `cost_riwayat_harga`: Price history.
  - `cost_recipes`: Recipe definition.
- **CRM Management**:
  - `crm_customers`: Customer definitions.
  - `crm_rewards`: Rewards.
  - `crm_point_transactions`: Point tracking.

## Observations / Ghost Architecture

### Potential Duplicated Entities
- **`members` vs `crm_customers`**: Both tables represent customers. Both contain identical columns such as `points`, `total_spent`, `visit_count`, `phone`, and `name`. This indicates a severe data silo where the core POS uses `members`, but the CRM module implements its own duplicate entity `crm_customers`.

### Potential Isolated Entities
- The `cost_` tables (`cost_bahan`, `cost_recipes`) appear isolated. There is no mapping table connecting `products` to `cost_recipes` or `cost_bahan` in the SQL schema (e.g., no `recipe_ingredients` table mapping a product to its BOM). This implies the cost calculation module might be entirely disconnected from the actual POS products table.

### Indexes & Constraints
- Foreign keys use `ON DELETE CASCADE` appropriately.
- Indexes exist for most foreign keys and status columns (`idx_orders_status`, `idx_orders_kitchen_status`).
