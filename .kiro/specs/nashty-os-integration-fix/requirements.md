# Requirements Document: NASHTY OS Integration Fix

## Introduction

This document specifies the functional and non-functional requirements for fixing critical integration issues in the NASHTY OS restaurant management system. The system consists of three modules—POS Terminal, Kitchen Display System (KDS), and Backoffice—all sharing a single Express.js backend and SQLite database. The primary goals are to (1) provide a reliable local development environment setup, (2) establish real-time data synchronization between modules, and (3) ensure seamless order flow from POS to KDS and menu synchronization from Backoffice to POS.

## Glossary

- **POS**: Point-of-Sale Terminal module for cashiers to create orders
- **KDS**: Kitchen Display System module for chefs to view and update order status
- **Backoffice**: Administrative module for managing menu, staff, and reports
- **Backend**: Express.js API server serving all three modules
- **Database**: SQLite database file (nashtypos.db) storing all system data
- **Order_Flow**: Process of order creation in POS and notification to KDS
- **Menu_Sync**: Process of menu updates in Backoffice reflecting in POS
- **Polling**: Client-side periodic API requests to check for updates
- **Cache**: In-memory storage for frequently accessed data
- **Transaction**: Atomic database operation ensuring data consistency

## Requirements

### Requirement 1: Reliable Local Development Environment

**User Story:** As a developer, I want to start the local development server with one command, so that I can begin working without 10+ hours of debugging.

#### Acceptance Criteria

1. WHEN a developer executes the startup script THEN THE System SHALL verify Node.js and npm are installed
2. WHEN the target port 3099 is already in use THEN THE System SHALL terminate the existing process and free the port
3. WHEN the backend directory exists THEN THE System SHALL navigate to the backend directory
4. WHEN dependencies are not installed THEN THE System SHALL run npm install with error handling
5. WHEN TypeScript sources need compilation THEN THE System SHALL run npm run build with error handling
6. WHEN the database file does not exist THEN THE System SHALL initialize and seed the database
7. WHEN the server starts THEN THE System SHALL bind to port 3099 and serve all three modules
8. WHEN the server is ready THEN THE System SHALL open the browser to http://localhost:3099/
9. WHEN any startup step fails THEN THE System SHALL display a clear error message and halt execution
10. WHEN the script completes successfully THEN THE Backend SHALL serve static files for POS, KDS, and Backoffice at /pos, /kds, and /backoffice paths

### Requirement 2: Order Creation and Persistence

**User Story:** As a cashier, I want to create orders with items and payments, so that customer transactions are recorded.

#### Acceptance Criteria

1. WHEN a cashier submits an order with items and payment THEN THE Backend SHALL validate the order data structure
2. WHEN order data is valid THEN THE Backend SHALL start a database transaction
3. WHEN the transaction starts THEN THE Backend SHALL insert a record into the orders table
4. WHEN the order record is created THEN THE Backend SHALL insert records into order_items for each item
5. WHEN order items have modifiers THEN THE Backend SHALL insert records into order_item_modifiers for each modifier
6. WHEN payments are included THEN THE Backend SHALL insert records into payments table
7. WHEN items have stock tracking enabled THEN THE Backend SHALL decrement product stock quantities
8. WHEN all inserts succeed THEN THE Backend SHALL commit the transaction
9. WHEN any insert fails THEN THE Backend SHALL rollback the entire transaction
10. WHEN the transaction commits THEN THE Backend SHALL generate a unique order_number in format SNY-MMDD-NNN
11. WHEN order creation succeeds THEN THE Backend SHALL return the complete order object with order_number and order_id
12. IF the transaction fails THEN THE Backend SHALL return a descriptive error message to the client

### Requirement 3: KDS Polling for Order Updates

**User Story:** As a chef, I want to see new orders appear in the KDS within 5 seconds, so that I can start preparing food promptly.

#### Acceptance Criteria

1. WHEN the KDS module loads THEN THE KDS SHALL initialize a polling service with 5-second interval
2. WHILE the KDS is active THEN THE KDS SHALL send GET requests to /api/orders/kitchen/queue every 5 seconds
3. WHEN the polling request includes outletId parameter THEN THE Backend SHALL filter orders by outlet_id
4. WHEN the Backend receives the polling request THEN THE Backend SHALL query orders with kitchen_status 'pending' or 'preparing'
5. WHEN pending orders exist THEN THE Backend SHALL return the order list with items and modifiers
6. WHEN the KDS receives new orders THEN THE KDS SHALL detect orders not currently displayed
7. WHEN a new order is detected THEN THE KDS SHALL add the order card to the display queue
8. WHEN an order card is added THEN THE KDS SHALL start a visual timer showing elapsed time
9. WHEN the polling request fails THEN THE KDS SHALL display an offline banner and implement exponential backoff
10. WHEN the network connection is restored THEN THE KDS SHALL resume polling at the normal 5-second interval

### Requirement 4: Order Status Updates from KDS

**User Story:** As a chef, I want to update order status by swiping cards, so that the POS knows when orders are ready.

#### Acceptance Criteria

1. WHEN a chef swipes an order card to mark it as preparing THEN THE KDS SHALL send PATCH /api/orders/:id/status with kitchenStatus 'preparing'
2. WHEN a chef swipes an order card to mark it as ready THEN THE KDS SHALL send PATCH /api/orders/:id/status with kitchenStatus 'ready'
3. WHEN the Backend receives a status update request THEN THE Backend SHALL validate the orderId and kitchenStatus value
4. WHEN the validation succeeds THEN THE Backend SHALL update the orders table with the new kitchen_status
5. WHEN the database update succeeds THEN THE Backend SHALL return success response to KDS
6. WHEN the KDS receives success response THEN THE KDS SHALL update the order card visual state
7. WHEN an order is marked ready THEN THE KDS SHALL remove the order card from the active queue after animation
8. IF the status update fails THEN THE Backend SHALL return an error message and THE KDS SHALL revert the visual state

### Requirement 5: Menu Data Retrieval for POS

**User Story:** As a cashier, I want to see the current menu with all items and modifiers, so that I can create accurate orders.

#### Acceptance Criteria

1. WHEN the POS loads or refreshes THEN THE POS SHALL send GET /api/menu/outlet/:outletId
2. WHEN the Backend receives the menu request THEN THE Backend SHALL check the cache for key "menu:outlet:{outletId}"
3. WHEN the cache contains valid data with TTL not expired THEN THE Backend SHALL return the cached menu tree
4. WHEN the cache is empty or expired THEN THE Backend SHALL query the database for categories, items, modifier_groups, and stations
5. WHEN the database query completes THEN THE Backend SHALL assemble the data into a MenuTree structure
6. WHEN the MenuTree is assembled THEN THE Backend SHALL store it in cache with 5-minute TTL
7. WHEN the Backend returns the menu THEN THE Backend SHALL include categories, items, modifierGroups, and stations arrays
8. WHEN the POS receives the menu data THEN THE POS SHALL store it in localStorage
9. WHEN menu data is stored THEN THE POS SHALL render the menu grid with categories and items
10. WHEN items have status 'sold_out' THEN THE POS SHALL disable those items visually

### Requirement 6: Menu Creation and Updates in Backoffice

**User Story:** As a manager, I want to create and update menu items in Backoffice, so that changes are reflected in the POS.

#### Acceptance Criteria

1. WHEN a manager creates a new menu item THEN THE Backoffice SHALL send POST /api/menu/items with item data
2. WHEN the Backend receives the create request THEN THE Backend SHALL validate the item data using Zod schema
3. WHEN validation succeeds THEN THE Backend SHALL insert the item into menu_items table
4. WHEN the item is inserted THEN THE Backend SHALL invalidate the cache key "menu:outlet:{outletId}"
5. WHEN cache invalidation completes THEN THE Backend SHALL return the created item with item_id
6. WHEN a manager updates an existing item THEN THE Backoffice SHALL send PATCH /api/menu/items/:id with updated fields
7. WHEN the Backend receives the update request THEN THE Backend SHALL update the menu_items table
8. WHEN the update succeeds THEN THE Backend SHALL invalidate the cache key "menu:outlet:{outletId}"
9. WHEN the POS makes the next menu request THEN THE Backend SHALL return fresh data from the database
10. WHEN the POS receives updated menu data THEN THE POS SHALL re-render the menu grid with new or changed items

### Requirement 7: Menu Item Sold-Out Status Synchronization

**User Story:** As a manager, I want to mark items as sold out in Backoffice, so that cashiers cannot select them in POS.

#### Acceptance Criteria

1. WHEN a manager marks an item as sold out THEN THE Backoffice SHALL send PATCH /api/menu/items/:id with status 'sold_out'
2. WHEN the Backend receives the status update THEN THE Backend SHALL update the menu_items table
3. WHEN the update succeeds THEN THE Backend SHALL invalidate the cache key "menu:outlet:{outletId}"
4. WHEN the POS requests menu data after cache invalidation THEN THE Backend SHALL return items with updated status
5. WHEN the POS receives items with status 'sold_out' THEN THE POS SHALL disable those items in the menu grid
6. WHEN a cashier attempts to select a sold-out item THEN THE POS SHALL prevent the selection and display a message
7. WHEN a manager changes an item back to 'active' THEN THE Backend SHALL invalidate the cache and THE POS SHALL enable the item

### Requirement 8: Database Transaction Integrity

**User Story:** As a system administrator, I want database operations to be atomic, so that data remains consistent even when errors occur.

#### Acceptance Criteria

1. WHEN an order creation starts THEN THE Backend SHALL begin a database transaction
2. WHILE the transaction is active THEN THE Backend SHALL execute all inserts within the transaction boundary
3. WHEN all operations succeed THEN THE Backend SHALL commit the transaction
4. IF any operation fails THEN THE Backend SHALL rollback the transaction
5. WHEN a rollback occurs THEN THE Database SHALL restore the state to before the transaction began
6. WHEN the transaction completes THEN THE Backend SHALL log whether it committed or rolled back
7. THE Backend SHALL enable foreign key constraints in SQLite to enforce referential integrity
8. THE Backend SHALL use WAL mode in SQLite to allow concurrent reads during writes

### Requirement 9: API Error Handling and Validation

**User Story:** As a developer, I want consistent error responses from the API, so that I can handle errors uniformly in all modules.

#### Acceptance Criteria

1. WHEN the Backend receives a request with missing required fields THEN THE Backend SHALL return 400 Bad Request with field names
2. WHEN the Backend receives a request with invalid data types THEN THE Backend SHALL return 400 Bad Request with validation errors
3. WHEN a requested resource does not exist THEN THE Backend SHALL return 404 Not Found with a descriptive message
4. WHEN a database operation fails THEN THE Backend SHALL return 500 Internal Server Error with error type
5. WHEN an error occurs THEN THE Backend SHALL log the error with timestamp, endpoint, and error details
6. WHILE in production mode THEN THE Backend SHALL not include stack traces in error responses
7. WHEN validation uses Zod schemas THEN THE Backend SHALL return structured validation errors
8. THE Backend SHALL sanitize all inputs to prevent SQL injection and XSS attacks

### Requirement 10: Caching Strategy for Performance

**User Story:** As a system operator, I want frequently accessed data to be cached, so that API response times remain fast.

#### Acceptance Criteria

1. WHEN the Backend starts THEN THE Backend SHALL initialize an in-memory cache manager
2. WHEN a menu request arrives THEN THE Backend SHALL check the cache before querying the database
3. WHEN the cache contains valid data THEN THE Backend SHALL return cached data without database query
4. WHEN cached data expires based on TTL THEN THE Backend SHALL treat it as a cache miss
5. WHEN a cache miss occurs THEN THE Backend SHALL query the database and store the result in cache
6. WHEN menu data is created or updated THEN THE Backend SHALL invalidate the cache key "menu:outlet:{outletId}"
7. WHEN outlet configuration is requested THEN THE Backend SHALL cache it with 10-minute TTL
8. THE Cache_Manager SHALL provide methods for get, set, invalidate, invalidatePattern, and clear
9. THE Cache_Manager SHALL automatically clean up expired entries to prevent memory leaks
10. THE Backend SHALL achieve cache hit ratio greater than 80% for menu endpoints

### Requirement 11: Health Check and System Status

**User Story:** As a developer, I want a health check endpoint, so that I can verify the server is running correctly.

#### Acceptance Criteria

1. THE Backend SHALL expose a GET /api/health endpoint
2. WHEN the health endpoint is requested THEN THE Backend SHALL check database connectivity
3. WHEN the database is accessible THEN THE Backend SHALL return 200 OK with status "healthy"
4. WHEN the database is not accessible THEN THE Backend SHALL return 503 Service Unavailable with status "unhealthy"
5. WHEN the health check succeeds THEN THE Backend SHALL include uptime, version, and timestamp in the response
6. THE Backend SHALL respond to health checks within 100ms
7. THE startup script SHALL poll the health endpoint before opening the browser

### Requirement 12: Multi-Outlet Data Isolation

**User Story:** As a system administrator, I want orders and menu data to be isolated per outlet, so that multi-outlet tenants have separated data.

#### Acceptance Criteria

1. WHEN the Backend queries orders THEN THE Backend SHALL filter by outlet_id from the request parameter
2. WHEN the Backend queries menu data THEN THE Backend SHALL filter by outlet_id from the request parameter
3. WHEN the KDS polls for orders THEN THE Backend SHALL return only orders matching the KDS outlet_id
4. WHEN the POS requests menu data THEN THE Backend SHALL return only menu items available at the POS outlet_id
5. THE Backend SHALL validate that outlet_id exists in outlets table before processing requests
6. THE Backend SHALL not allow cross-outlet data access through API parameters
7. THE Database SHALL enforce foreign key constraints between outlet_id and related tables

### Requirement 13: Order Number Generation

**User Story:** As a cashier, I want each order to have a unique, readable order number, so that I can easily identify and communicate orders.

#### Acceptance Criteria

1. WHEN an order is created THEN THE Backend SHALL generate an order_number in format SNY-MMDD-NNN
2. WHEN generating the order_number THEN THE Backend SHALL use the current date for MMDD portion
3. WHEN generating the sequence NNN THEN THE Backend SHALL find the highest sequence for the current date and increment by 1
4. WHEN it is the first order of the day THEN THE Backend SHALL use sequence 001
5. WHEN the order_number is generated THEN THE Backend SHALL ensure uniqueness using database constraints or nanoid fallback
6. THE order_number SHALL be human-readable and suitable for verbal communication
7. THE order_number SHALL be stored in the orders table alongside the order_id

### Requirement 14: Logging and Debugging Support

**User Story:** As a developer, I want comprehensive logs, so that I can debug issues quickly.

#### Acceptance Criteria

1. WHEN the Backend processes any API request THEN THE Backend SHALL log the method, path, status code, and duration
2. WHEN a database query takes longer than 100ms THEN THE Backend SHALL log a warning with the query and duration
3. WHEN an error occurs THEN THE Backend SHALL log the error level, timestamp, context, and error message
4. WHEN an order is created THEN THE Backend SHALL log an INFO message with order_number and order_id
5. WHEN menu updates occur THEN THE Backend SHALL log an INFO message with item_id and action type
6. WHEN authentication attempts occur THEN THE Backend SHALL log success and failure attempts
7. THE Backend SHALL support log levels: ERROR, WARN, INFO, DEBUG
8. WHILE in development mode THEN THE Backend SHALL use DEBUG level for detailed diagnostics
9. WHILE in production mode THEN THE Backend SHALL use INFO level to reduce log volume

### Requirement 15: Static File Serving for Frontend Modules

**User Story:** As a developer, I want the Backend to serve all three frontend modules, so that I only need one server process.

#### Acceptance Criteria

1. THE Backend SHALL serve POS static files at /pos path
2. THE Backend SHALL serve KDS static files at /kds path
3. THE Backend SHALL serve Backoffice static files at /backoffice path
4. WHEN a user navigates to http://localhost:3099/ THEN THE Backend SHALL serve the main launcher page
5. WHEN a user navigates to /pos THEN THE Backend SHALL serve backoffice/frontend/index.html with POS configuration
6. WHEN a user navigates to /kds THEN THE Backend SHALL serve kds/frontend/index.html
7. WHEN a user navigates to /backoffice THEN THE Backend SHALL serve backoffice/frontend/index.html with Backoffice configuration
8. THE Backend SHALL serve CSS and JavaScript files with correct MIME types
9. THE Backend SHALL enable gzip compression for text-based assets

### Requirement 16: Performance Requirements

**User Story:** As a system operator, I want the system to handle peak load efficiently, so that operations remain smooth during busy hours.

#### Acceptance Criteria

1. THE Backend SHALL respond to menu API requests within 200ms at 95th percentile
2. THE Backend SHALL respond to order creation requests within 500ms at 95th percentile
3. THE Backend SHALL support 100+ orders per hour per outlet without performance degradation
4. THE Backend SHALL achieve database query average response time under 10ms for reads
5. THE Backend SHALL achieve database query average response time under 50ms for writes
6. THE Cache SHALL maintain hit ratio above 80% for menu endpoints
7. THE KDS polling SHALL consume less than 5KB average payload size per response
8. THE POS SHALL render menu grid with 100+ items in under 1 second

### Requirement 17: Database Persistence and Recovery

**User Story:** As a system administrator, I want the database to persist reliably, so that no data is lost during crashes or restarts.

#### Acceptance Criteria

1. WHEN the Backend modifies data THEN THE Backend SHALL trigger a debounced save after 2 seconds
2. WHEN the debounced timer triggers THEN THE Backend SHALL write the database to disk
3. WHEN the server shuts down gracefully THEN THE Backend SHALL save the database before exit
4. WHEN a database operation fails THEN THE Backend SHALL create a backup of the database file
5. WHEN the database file is corrupted THEN THE Backend SHALL attempt to restore from the most recent backup
6. THE Database SHALL use WAL mode to minimize data loss risk
7. THE Backend SHALL create daily automated backups of the database file

### Requirement 18: Concurrency and Race Condition Handling

**User Story:** As a system operator, I want concurrent operations to be handled safely, so that race conditions do not corrupt data.

#### Acceptance Criteria

1. WHEN two cashiers create orders simultaneously THEN THE Backend SHALL ensure each order gets a unique order_number
2. WHEN multiple users access the menu endpoint simultaneously THEN THE Backend SHALL serve cached data without database contention
3. WHEN the Backend updates an order status THEN THE Backend SHALL use atomic database operations
4. THE Backend SHALL use database transactions for multi-step operations to prevent partial updates
5. THE Backend SHALL use row-level locking where necessary to prevent concurrent modification conflicts

### Requirement 19: Development Mode Features

**User Story:** As a developer, I want development-specific features enabled in local mode, so that debugging is easier.

#### Acceptance Criteria

1. WHILE running in development mode THEN THE Backend SHALL enable detailed error messages with stack traces
2. WHILE running in development mode THEN THE Backend SHALL use DEBUG log level
3. WHILE running in development mode THEN THE Backend SHALL allow CORS from any origin
4. WHILE running in development mode THEN THE Backend SHALL disable rate limiting
5. WHILE running in production mode THEN THE Backend SHALL enable security features and minimal logging

### Requirement 20: Script Error Recovery and User Guidance

**User Story:** As a developer, I want clear error messages when the startup script fails, so that I know how to fix the issue.

#### Acceptance Criteria

1. WHEN Node.js is not installed THEN THE System SHALL display "ERROR: Node.js not installed. Please install Node.js v18 or higher."
2. WHEN the backend directory is missing THEN THE System SHALL display "ERROR: backend directory not found. Please run from project root."
3. WHEN npm install fails THEN THE System SHALL display the npm error output and halt
4. WHEN npm run build fails THEN THE System SHALL display the TypeScript compilation errors and halt
5. WHEN database seeding fails THEN THE System SHALL display the seed script error and instructions to manually delete the database
6. WHEN port 3099 cannot be freed THEN THE System SHALL display the process ID and instructions to manually kill it
7. WHEN the health check times out THEN THE System SHALL display "ERROR: Server started but health check failed. Check logs for details."
