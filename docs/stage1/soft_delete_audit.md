# Soft Delete Audit

This document identifies every entity supporting deletion and evaluates the current implementation for ambiguity between "Disable" (inactive status) and "Delete" (soft/hard deletion).

## Supported Entities Matrix

| Entity | Current Delete Implementation | Disable Implementation | Database Field | Query Filtering Behavior | Risk Assessment | Delete ≠ Disable? |
|--------|-------------------------------|------------------------|----------------|--------------------------|-----------------|-------------------|
| Products | Soft Delete (`persistence.softDelete`) | Status update (`status = 'inactive'`) | `deleted_at` | Correct. Queries filter by `deleted_at IS NULL`. | Low | ✅ Clear Separation |
| Categories | Soft Delete (`persistence.softDelete`) | Status update (`status = 'inactive'`) | `deleted_at` | Correct. | Low | ✅ Clear Separation |
| Users | Soft Delete (`persistence.softDelete`) | Status update (`status = 'inactive'`) | `deleted_at` | Correct. | Low | ✅ Clear Separation |
| Members | Soft Delete (`persistence.softDelete`) | Status update (`status = 'inactive'`) | `deleted_at` | Correct. | Low | ✅ Clear Separation |
| Modifiers | Soft Delete (`persistence.softDelete`) | Status update (`status = 'inactive'`) | `deleted_at` | Correct. | Low | ✅ Clear Separation |
| Settings | Hard Delete / Soft Delete Mix | N/A | `deleted_at` | Inconsistent. UPSERT handles active, but deletion logic is ambiguous. | Medium | ⚠️ Ambiguous |
| Orders | Hard Delete (`DELETE FROM`) | N/A | None | No soft delete field exists. | High | ❌ No Separation |
| Cost Management | Hard Delete (`DELETE FROM`) | Status update (`status = 'rnd'`) | None | Hard deleted data breaks historical HPP (Cost of Goods). | High | ❌ No Separation |
| CRM | Hard Delete (`DELETE FROM`) | Status update (`is_active = 0`) | None | Hard deleted customers lose all point histories permanently. | High | ❌ No Separation |

## Findings
1. **Clear Separation on Core POS Entities:** Products, Categories, and Users effectively use `deleted_at` vs `status = 'inactive'`.
2. **Missing Soft Delete on Operational Entities:** The `orders`, `cost_bahan`, and `crm_customers` tables do not have a `deleted_at` column. Deleting these triggers a `DELETE FROM` query. This is high risk because hard deleting a CRM customer will wipe their historical transaction references, and deleting costs will break past financial reports.

**Recommendation:** Extend the `deleted_at` column to CRM, Costs, and Orders to ensure referential integrity for financial reports.
