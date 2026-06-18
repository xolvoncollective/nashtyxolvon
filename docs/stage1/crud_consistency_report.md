# CRUD Consistency Audit

This document assesses the Create, Read, Update, and Delete operations for the specified core entities, documenting discrepancies and persistence correctness.

## Products & Categories
- **Expected Behavior:** Creation persists with `tenant_id`, updates accurately modify timestamps, reading filters out soft-deleted items, and deletion sets `deleted_at`.
- **Actual Behavior:** Consistently follows the expected behavior. Utilizes centralized `insert`, `update`, and `softDelete`.
- **Persistence Correctness:** High.
- **Regression Risk:** Low.

## Members
- **Expected Behavior:** Member details persist, updates track points correctly, deleting prevents login/usage.
- **Actual Behavior:** Uses `MemberService.ts` for database writes, delegating accurately to centralized utilities.
- **Persistence Correctness:** High.
- **Regression Risk:** Low.

## Recipes (Cost Management)
- **Expected Behavior:** Recipes calculate HPP (Cost of Goods) and persist updates correctly. Deletions use soft delete.
- **Actual Behavior:** Uses `db.run('DELETE FROM cost_recipes...')`. Bypasses Service Layer completely. Hard deletion breaks historical financial calculation mapping.
- **Persistence Correctness:** Medium.
- **Regression Risk:** High (due to direct DB writes and hard deletion).

## Settings
- **Expected Behavior:** UI sends settings objects, backend parses and saves them in key-value structure. Reads merge base tenant settings with outlet overrides.
- **Actual Behavior:** Nested JSON strings are not parsed back into objects on Read (`GET /settings`), breaking UI rendering. Modifying nested settings overrides them entirely instead of merging.
- **Persistence Correctness:** Low.
- **Regression Risk:** High.

## Payment Methods
- **Expected Behavior:** Sending payment methods array in settings update modifies the `payment_methods` table.
- **Actual Behavior:** The `PUT /settings/:outletId` endpoint explicitly ignores any updates to the `payment_methods` table.
- **Persistence Correctness:** Low (Broken).
- **Regression Risk:** High.
