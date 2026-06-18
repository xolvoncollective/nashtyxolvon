# Cross Module Integration Map (Stage 0 Baseline)

## Global Architecture
The ecosystem conceptually consists of Back Office, POS, KDS, Cost Calculation, and CRM. However, physically, almost all modules are served and controlled by a single monolithic Node.js process (`backoffice/backend/src/index.ts`). 

## Module Integration Points

### 1. Back Office ↔ POS
- **Shared APIs:** Back Office Backend serves the frontend files for POS at `/pos`. The POS frontend calls `/api/*` endpoints hosted on the monolithic Back Office backend.
- **Shared Tables:** They share exactly the same SQLite schema. 
- **Synchronization:** The POS does not use WebSockets to sync data from the Back Office. It relies on standard REST calls. 

### 2. POS ↔ KDS
- **Shared APIs:** The KDS frontend fetches pending kitchen orders via `/api/orders/kitchen/queue`.
- **Synchronization:** The KDS frontend uses **Polling**. In `kds/frontend/js/app.js`, `fetchInterval = setInterval(fetchOrders, 5000);` executes every 5 seconds to query the backend for new orders. There are no WebSockets.
- **Data Transfer:** When an order is completed on the POS, it's inserted into the `orders` and `order_items` tables. The KDS polling simply queries `order_items` with `kitchen_status = 'pending'`.

### 3. Back Office ↔ CRM
- **Silo Effect:** The CRM is integrated by serving its compiled bundle (`/crm/dist`) at the `/crm` route.
- **Data Isolation:** The database has separate `crm_customers` vs `members` tables. The CRM module operates with its own table structure without a cohesive shared domain model with the POS.

### 4. Back Office ↔ Cost Calculation
- **Silo Effect:** Served as a compiled bundle (`/cost/dist`) via `/cost`.
- **Data Isolation:** `cost_bahan` and `cost_recipes` are structurally isolated from the main `products` menu definitions.

## Conclusion
There is no event-driven integration (e.g., Kafka, Redis PubSub, or WebSockets). 
- State synchronization relies exclusively on **SQLite DB read/writes**.
- Real-time updates (KDS) are achieved via **short polling**.
- Component isolation is broken: CRM and Cost modules maintain entirely segregated schemas despite living in the same database file, resulting in severe data silos (e.g., duplicated customer records).
