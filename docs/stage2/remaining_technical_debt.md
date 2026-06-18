# Remaining Technical Debt (Post-Stage 2)

## Architectural Leftovers
1. **Ghost Architectures (`pos/backend` and `kds/backend`)**
   - The Stage 2 refactoring successfully targeted `backoffice/backend/src/routes`.
   - However, the physical folders `pos/backend` and `kds/backend` still exist in the project root. While they are essentially ghost endpoints (as the system is configured to route POS and KDS requests to the backoffice backend), they still contain duplicated, outdated code.
   - **Recommendation (Stage 3)**: Safely delete these redundant backend folders and rely solely on `backoffice/backend` as the unified API hub.

2. **Cross-Service Dependencies**
   - Currently, `OrderService` imports `ProductService` directly to handle stock deduction and validation. As the application grows, direct service-to-service coupling might make testing harder.
   - **Recommendation**: Consider Dependency Injection (DI) or an Event Emitter pattern for loose coupling if the service layer expands further.

## Functional Gaps
1. **Unit Testing the Service Layer**
   - We ran Playwright integration/E2E tests which proved the refactoring was safe. However, the new Services (`OrderService`, `FinancialCalculationService`) do not yet have granular unit tests.
   - **Recommendation**: Write Jest/Vitest unit tests specifically for the pure functions within the Service Layer.

2. **Error Handling Standardization**
   - Route controllers currently use a generic `try/catch` and return `error.message`.
   - **Recommendation**: Create a global Error Handling Middleware and custom error classes (e.g., `NotFoundError`, `ValidationError`, `BusinessRuleError`).
