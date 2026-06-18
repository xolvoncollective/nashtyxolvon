# Risk Matrix & Refactoring Assessment (Stage 0 Baseline)

This document evaluates the risks associated with refactoring the various subsystems, aiming to guide the upcoming architectural improvements.

## Subsystem Risk Assessment

| Subsystem | Technical Complexity | Regression Risk | Business Risk | Dependency Count | Refactoring Difficulty |
|---|---|---|---|---|---|
| **Orders & Transactions** | High | Critical | High | 5+ (Payments, Shifts, Products, KDS) | High |
| **Financial Calculations (Reports/Shifts)** | Medium | High | Critical | 3+ (Orders, Payments, Shifts) | Medium |
| **Core Entities (Products/Categories/Modifiers)** | Low | Medium | High | 4+ (Orders, Menu, POS, Backoffice) | Low |
| **CRM Integration** | Medium | Low | Medium | 1 (Isolated) | Low |
| **Cost Calculation** | Medium | Low | Medium | 1 (Isolated) | Low |
| **KDS Integration** | Low | Medium | Medium | 2 (Orders, Order Items) | Low |
| **Authentication & Users** | Low | High | High | 0 | Low |

## Key Findings

1. **The God Endpoints:** The `/orders` and `/shifts` endpoints contain raw SQL financial aggregations. Altering these queries carries a **Critical Business Risk** because errors will directly impact gross sales, net sales, and cashier variance calculations.
2. **Ghost Architectures:** `pos/backend` and `kds/backend` exist but are functionally bypassed in local dev. Deleting or merging these carries a **Low Risk** if they are truly unused, but their presence indicates confusion.
3. **Data Silos:** CRM (`crm_customers`) and Cost Calculation (`cost_bahan`) operate on disjoint data structures. Re-integrating them into the core domain will have a **Medium Refactoring Difficulty** since data migration or schema unification is required.

## Recommended Refactoring Order

1. **Phase 1: Cleanup Ghost Architecture (Low Risk)**
   - Remove or deprecate `pos/backend` and `kds/backend` if they are confirmed dead code.
2. **Phase 2: Extract Business Logic Layer (Medium Risk)**
   - Move SQL `SUM()` logic from `shifts.ts` and `reports.ts` into a dedicated Financial Service Layer.
3. **Phase 3: Unify Data Silos (Medium Risk)**
   - Migrate `crm_customers` to `members`.
   - Link `products` to `cost_recipes`.
4. **Phase 4: Refactor Orders Controller (High Risk)**
   - Decompose `orders.ts` into smaller services.
