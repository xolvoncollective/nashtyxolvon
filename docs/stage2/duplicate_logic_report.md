# Duplicate Logic Detection Report

This report identifies duplicated implementations of core business logic across the backend architecture.

## Financial Calculations

| Metric | Primary Service (`FinancialCalculationService`) | Duplications Found (Controllers) |
|--------|-------------------------------------------------|----------------------------------|
| **Gross Sales** | `COALESCE(SUM(subtotal), 0)` | `reports.ts`: `SUM(oi.subtotal)`<br>`dashboard.ts`: `SUM(oi.subtotal)` |
| **Net Sales** | `COALESCE(SUM(total), 0)` | `outlets.ts`: `SUM(total)`<br>`shifts.ts`: `SUM(total)`<br>`dashboard.ts`: `SUM(o.total)` (x4 in charts)<br>`reports.ts`: `SUM(o.total)` |
| **COGS / Profit** | None (Missing from Service entirely) | `reports.ts`: `SUM(oi.subtotal) - (COALESCE(p.cost, 0) * SUM(oi.quantity))` |
| **Order Count** | `COUNT(*)` | `dashboard.ts`: `COUNT(*)`<br>`outlets.ts`: `COUNT(*)` |

## Order / Pricing Logic

| Rule | Primary Service (`OrderService`) | Duplications Found |
|------|----------------------------------|--------------------|
| **Order Total** | Base + Tax + SC - Discount | None detected. Pricing logic is successfully centralized inside `createOrder()`. |
| **Tax** | `baseAmount * (taxRate / 100)` | None. |
| **Service Charge** | `baseAmount * (scRate / 100)` | None. |

## Inventory & CRM

| Rule | Primary Service | Duplications Found |
|------|-----------------|--------------------|
| **Stock Deduction** | `ProductService.deductStock()` | None detected. Properly centralized. |
| **Points Awarding** | `MemberService.handlePointTransaction` | None detected. Properly centralized. |
| **Settings Resolution** | `SettingsService.resolveSettings()` | None detected. Properly centralized. |

## Conclusion
While Order, Product, Settings, and Member logic has been largely centralized, **Financial aggregations are still heavily duplicated**. Controllers frequently ignore `FinancialCalculationService` and write their own raw SQL (`SUM(total)`, `SUM(subtotal)`) to calculate net and gross revenue. Furthermore, Cost of Goods Sold (COGS) logic is entirely missing from the Service Layer and hardcoded in `reports.ts`.
