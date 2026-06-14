# Fixes & Docs - June 13, 2026

## 1. Security & Validation Improvements
- **Price Recalculation**: Added server-side price recalculation on order placement in `backoffice/backend/src/routes/orders.ts` to prevent front-end price manipulation.
- **Stock Lock**: Implemented strict checking for tracking-enabled items. If stock is insufficient, the system rejects the order with a 400 error instead of allowing negative values by default.
- **Login Rate Limiting**: Added IP-based login rate limiting in `backoffice/backend/src/routes/auth.ts` (maximum 3 failed attempts, resulting in a 5-minute lockout for that IP address).

## 2. KDS & POS Integration Fixes
- **Endpoint Mismatch**: Corrected API endpoints in `kds/frontend/js/api.js` to match the backend router paths:
  - Queue: `/orders/kds/queue` -> `/orders/kitchen/queue`
  - Stats: `/orders/kds/stats` -> `/orders/kitchen/stats`
  - Status Update: `/orders/:id/kitchen-status` -> `/orders/:id/status`
- **Global API Reference**: Added `window.API = API` inside `kds/frontend/js/api.js` to expose the API wrapper for routing guards and event interactions in `app.js`.

## 3. Financial & Refund Enhancements
- **Order Number Sequence**: Replaced random 3-digit order numbers with daily sequential codes in format `SNY-YYMMDD-XXXX` (using local timezone counter).
- **Omzet Refund Correction**: Updated the refund endpoint to log a negative payment, ensuring shift omzet (turnover) is correctly decremented. If a full refund is processed, the order status is automatically changed to `cancelled` and payment status to `cancelled`.

## 4. API Documentation Audit
- Fully updated and revised `Draft/API_DOCUMENTATION.md` to reflect version 2.0. Updated endpoints, parameter requirements, JWT structures, response objects, and environment port configurations.
