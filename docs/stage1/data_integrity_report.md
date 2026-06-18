# SQLite Data Integrity Validation

This document assesses the current database schema constraints, foreign key mappings, and nullability handling.

## Observations

### 1. Foreign Key Mappings
- **Good:** Core entities (`products`, `categories`, `orders`) have strict `ON DELETE CASCADE` relationships tied to their respective tenants and parent entities.
- **Concern:** Hard deleting an `order` or `order_items` via cascading deletes will destroy historical financial data. Hard deleting `crm_customers` permanently wipes `crm_point_transactions`.

### 2. Null Violations & Constraints
- The `deleted_at` column was successfully added to most tables (from previous refactor), but `crm_customers`, `crm_rewards`, `crm_point_transactions`, `cost_bahan`, `cost_riwayat_harga`, and `cost_recipes` still lack this field entirely.
- `settings` stores `value` as `TEXT`. A boolean false can easily be mistaken for a string `"false"`. The `parseSettingValue` function attempts to mitigate this, but schema-level validation is missing.

### 3. Orphan Records
- Because `cost_recipes` uses a status of `'rnd'` instead of enforcing constraints on `bahan_id`, deleting a `cost_bahan` immediately orphans any recipe relying on it.

## Findings
- **Data Integrity Violation:** Financial and CRM data is prone to permanent data loss due to the lack of soft-delete structures.
- **Risk:** High.
