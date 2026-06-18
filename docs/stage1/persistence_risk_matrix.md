# Persistence Risk Matrix

This document evaluates persistence-related subsystems based on business impact, risk of data loss, regression risk, and complexity.

| Subsystem | Business Impact | Data Loss Risk | Regression Risk | Complexity | Recommended Fix Priority |
|-----------|-----------------|----------------|-----------------|------------|--------------------------|
| Settings | High | Low | High | Medium | **P0 (Critical)** |
| Payment Methods | High | Low | High | Low | **P0 (Critical)** |
| Orders | Critical | High | High | High | P1 |
| CRM | High | High | High | Low | P1 |
| Costs | Medium | High | High | Low | P2 |
| Products | Medium | Low | Low | Low | P3 |
| Categories | Low | Low | Low | Low | P3 |
| Users | Low | Low | Low | Low | P3 |

## Priority Justification

1. **P0 - Settings & Payment Methods:** The frontend completely breaks or fails to persist basic operational data due to the JSON parsing bug and missing update handlers. This prevents users from operating the system properly.
2. **P1 - Orders & CRM (Data Loss):** The lack of soft delete for `crm_customers` means accidental deletion permanently wipes out transaction histories.
3. **P2 - Costs (Data Loss):** Hard deletion of `cost_bahan` immediately orphans recipes.
