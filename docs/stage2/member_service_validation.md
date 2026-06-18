# CRM & Member Logic Validation

This document verifies whether `MemberService` successfully encapsulates all member registration and point-based CRM logic.

## Target Validation

| Responsibility | Owned by `MemberService`? | Validation Result |
|----------------|---------------------------|-------------------|
| Member Registration | Yes | **PASS** (`validateOrRegisterMember` is authoritative) |
| Points Awarding | Yes | **PASS** (`handlePointTransaction` is strictly used) |
| Points Redemption | Yes | **PASS** |
| Transaction Recording | Yes | **PASS** |
| CRM Entity CRUD | No | **FAIL** (`crm.ts` routes directly manipulate CRM entities instead of delegating to the service) |

## Key Findings
1. **Strong Point Management**: The logic surrounding the earning and burning of CRM points has been effectively consolidated into `MemberService.handlePointTransaction`. No alternative `points +` or `points -` operations exist in the codebase.
2. **Controller Leakage**: While point logic is centralized, basic CRUD logic (creating/updating rewards, basic customer profile manipulation) is still executed natively inside the `crm.ts` route handler via direct `db.run()` and `db.query()` calls. The service layer does not own the entire bounded context of "CRM".

## Conclusion
`MemberService` is authoritative over the business logic of *points*, but it does not fully own the CRM domain, as the `crm.ts` controller still accesses the database directly.
