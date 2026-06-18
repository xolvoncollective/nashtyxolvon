# Persistence Layer Architectural Decisions

## Context
During Stage 1, the goal was to stabilize the persistence layer without redesigning the core architecture.

## Decisions

### 1. Retention of Raw SQL & better-sqlite3
- **Decision**: Maintained the existing `better-sqlite3` driver and raw SQL query execution methodology.
- **Rationale**: The user specifically requested that the architecture remains unchanged. Introducing an ORM (like Prisma or Drizzle) would represent a massive architectural shift, violating the directives. Raw SQL queries perform extremely well, and the centralized persistence utilities (`persistence.ts`) adequately solve query duplication issues.

### 2. Implementation of Universal Soft Delete
- **Decision**: Added a `deleted_at` (DATETIME DEFAULT NULL) column to all core entities instead of relying on `status = 'inactive'`.
- **Rationale**: 
  - Prevents breaking changes and referential integrity violations in historical data (e.g., deleted products referenced by historical orders).
  - Maintains strict separation between an entity's operational status (e.g., a product that is temporarily "sold out" or "inactive" but still exists) and its deletion status.

### 3. Centralized Persistence Utilities (`persistence.ts`)
- **Decision**: Created standard wrappers for `insert`, `update`, and `softDelete` utilizing `database.ts` functions.
- **Rationale**: Encapsulating query generation logic reduces syntax errors, prevents missing timestamp updates (`updated_at`), and ensures that soft delete operations consistently set the `deleted_at` field and append `(deleted_...)` to names/slugs to avoid uniqueness constraint violations.

### 4. Dynamic Migration Handling
- **Decision**: Implemented an automated `migrateSoftDeletes` schema evolution function inside `database.ts` initialization.
- **Rationale**: Ensures that existing SQLite databases belonging to the user safely inherit the new `deleted_at` columns upon backend startup, thereby avoiding application crashes when the new codebase attempts to access `deleted_at`.

### 5. Resolution of E2E Foreign Key Constraints
- **Decision**: Identified that a detached old backend process (`start-local.ps1`) was holding stale cache data (`CacheManager`) while a newly-seeded SQLite file lacked the corresponding `UUIDs`, leading to cascading `FOREIGN KEY` failures during Playwright regression tests.
- **Rationale**: Correctly diagnosing and killing the dangling Node.js process listening on port 3099 ensured that the backend memory cache remained in sync with the underlying SQLite database, achieving a successful Playwright regression test run.
