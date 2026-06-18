# API Contract Baseline (Stage 0 Baseline)

This document provides a high-level enumeration of the API endpoints exposed primarily by the Backoffice Backend monolithic server (which also serves POS and KDS APIs). 

*Note: Request/Response bodies follow standard JSON formats mapped directly to the SQLite schema entities.*

## Users (`/api/users`)
- `GET /` - List all users (Reads `users` table)
- `POST /` - Create a new user (Writes `users` table)
- `PUT /:id` - Update user details (Writes `users` table)
- `PATCH /:id/status` - Toggle user active status (Writes `users` table)
- `DELETE /:id` - Soft/Hard delete user (Writes `users` table)

## Authentication (`/api/auth` & `/api/main/auth`)
- `POST /api/auth/login` - Authenticate user (Reads `users` table)
- `POST /api/auth/logout` - Invalidate session
- `POST /api/auth/refresh` - Refresh token

## Categories (`/api/categories`)
- `GET /` - List categories (Reads `categories` table)
- `POST /` - Create category (Writes `categories` table)
- `PUT /:id` - Update category (Writes `categories` table)
- `DELETE /:id` - Delete category (Writes `categories` table)

## Products (`/api/products`)
- `GET /` - List products (Reads `products`, `categories` tables)
- `GET /:id` - Get product details
- `POST /` - Create product
- `PUT /:id` - Update product
- `PATCH /:id/favorite` - Mark product as favorite
- `PATCH /:id/status` - Update product status
- `DELETE /:id` - Delete product
- `POST /:id/duplicate` - Clone product

## Orders (`/api/orders`)
- `GET /` - List orders (Reads `orders`, `order_items` tables)
- `GET /:id` - Get order by ID
- `POST /` - Create new order (Writes `orders`, `order_items`)
- `PATCH /:id/status` - Update order status (Writes `orders`)
- `PUT /:id/void` - Void order
- `POST /:id/refund` - Process order refund
- `GET /shift/:shiftId` - Get orders for a specific shift
- `GET /kitchen/queue` - Get pending items for KDS (Reads `order_items`)
- `GET /kitchen/stats` - Get kitchen efficiency metrics
- `GET /kitchen/completed` - Get completed items

## Shifts (`/api/shifts`)
- `GET /` - List shifts (Reads `shifts` table)
- `GET /active` - Get active shift
- `POST /start` - Open a new shift (Writes `shifts` table)
- `POST /:id/end` - Close a shift
- `GET /:id/summary` - Get shift financial summary
- `GET /:id/orders` - List orders in shift
- `GET /:id/payment-breakdown` - Revenue by payment method

## Menu & Modifiers (`/api/menu`, `/api/modifiers`)
- `GET /api/menu` - Fetch composed menu (Reads `categories`, `products`, `modifiers`)
- `GET /api/modifiers` - List modifiers (Reads `modifiers` table)
- `POST /api/modifiers` - Create modifier group
- `POST /api/modifiers/:id/options` - Add options to modifier

## Outlets & Settings (`/api/outlets`, `/api/settings`)
- `GET /api/outlets` - List outlets (Reads `outlets` table)
- `POST /api/outlets` - Create outlet
- `GET /api/settings/:outletId` - Get outlet settings (Reads `settings` table)
- `PUT /api/settings/:outletId` - Update outlet settings

## Reports & Dashboard (`/api/reports`, `/api/dashboard`)
- `GET /api/reports/sales` - Sales metrics (Reads `orders`, `payments` tables)
- `GET /api/reports/products` - Product performance
- `GET /api/reports/cashiers` - Cashier performance
- `GET /api/reports/menu-engineering` - Menu engineering metrics
- `GET /api/dashboard/summary` - High level metrics

## External Silos (CRM, Cost)
- These modules likely expose their own internal APIs or synchronize data directly via SQLite. They have rudimentary hooks in `crm.ts` and `costs.ts`.
