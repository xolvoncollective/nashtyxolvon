# Remaining Technical Debt Review

This document highlights the remaining architectural debt that prevents the backend from being fully decoupled and scalable.

## 1. Partial Consolidation of Financial Logic
While `FinancialCalculationService` exists, it acts more as a utility for the `shifts.ts` route rather than a true bounded context. `dashboard.ts` and `reports.ts` completely ignore it, utilizing massive, multi-join raw SQL queries to recalculate revenue, orders, and sales data. This means "Revenue" has multiple definitions throughout the codebase.

## 2. Missing COGS and Margin Domain
The system lacks a defined service layer for calculating Profit and Cost of Goods Sold (COGS). Currently, `reports.ts` handles margin logic via inline SQL: `SUM(oi.subtotal) - (cost * qty)`. If the COGS formula ever needs to change (e.g., to support FIFO inventory or variable ingredient costs), `reports.ts` will break.

## 3. Controller Data Access Leaks (CRUD Bypasses)
Controllers like `crm.ts`, `settings.ts`, and `members.ts` execute raw `db.run()` and `db.query()` commands. They do not have dedicated services to handle Create, Read, Update, and Delete operations. This prevents the system from injecting centralized validation, caching, or event-driven logging when these entities change.

## 4. Bypassed Boundaries for Status Updates
The `orders.ts` controller directly mutates the `kitchen_status` of an order using an `UPDATE` query when all underlying items are marked as complete. This bypasses `OrderService.updateOrderStatus()`, meaning the critical logging mechanism attached to the service is skipped entirely.

## 5. Missing Domain Integrations
There is no integration between `OrderService` and `MemberService`. When an order is completed by a recognized customer, points should ideally be awarded. However, this cross-service rule does not exist, leaving a functional gap in the CRM flow.

## Summary of Architecture Debt
The system has successfully implemented the **Facade** of a Service Layer for Order Creation, but it remains a monolithic, controller-heavy application for Data Analytics, CRM CRUD, and Settings.
