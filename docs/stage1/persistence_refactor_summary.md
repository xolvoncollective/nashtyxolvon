# Persistence Layer Refactor Summary

## Objective
Stabilize the persistence layer without redesigning the architecture or modifying core business logic.

## Summary of Changes

### 1. Schema Evolution
- Introduced `deleted_at` (DATETIME DEFAULT NULL) to all core tables via `schema.sql` to support standardized soft deletion.
- Tables modified: `categories`, `products`, `modifier_groups`, `modifier_options`, `product_modifiers`, `tenants`, `outlets`, `users`, `members`, `settings`, etc.

### 2. Standardization of CRUD Operations
- Centralized common DB operations into `src/db/persistence.ts`.
- Introduced helper utilities `insert`, `update`, and `softDelete` to abstract SQL query construction, param bindings, and timestamp updates.
- Refactored all existing route handlers to utilize these persistence utilities, ensuring consistent behavior across all data entities.

### 3. Route Refactoring
The following API routes were thoroughly refactored:
- `settings.ts`: Ensured bulk inserts properly merge configurations and track updates.
- `products.ts`: Implemented `softDelete` wrapper, ensuring correct handling of the `deleted_at` timestamp.
- `categories.ts`: Updated to leverage standard CRUD utilities, replacing raw `UPDATE` queries for status management.
- `modifiers.ts`: Standardized query abstractions for `modifier_groups` and `modifier_options`.
- `members.ts` & `users.ts`: Replaced status-based deletion (`status = 'inactive'`) with the standardized `deleted_at IS NULL` soft delete paradigm.

### 4. Database Migration script
- Handled backwards compatibility via a custom `migrateSoftDeletes` routine executed inside `database.ts` during initialization. This routine automatically adds the `deleted_at` column if it's missing in existing SQLite files.

## Conclusion
The persistence layer has been successfully stabilized. The architecture and core business logic remain unchanged, but the mechanism for interacting with the database is now heavily standardized and safe against regressions.
