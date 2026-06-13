# Implementation Plan: NASHTY OS Integration Fix

## Overview

This implementation plan addresses the four priority areas identified by the user:

**Priority 1**: Fix local development environment with reliable start-local script  
**Priority 2**: JWT session token system for shared authentication  
**Priority 3**: POS → KDS integration with real-time order flow  
**Priority 4**: Menu synchronization from Backoffice → POS  

The implementation follows an incremental approach, building and testing each priority before moving to the next. Each task is designed to be executed by a code-generation agent with clear objectives and requirements references.

## Tasks

### Priority 1: Fix Local Development Environment

- [x] 1. Create PowerShell startup script with comprehensive error handling
  - Replace start-local.bat with start-local.ps1
  - Implement Node.js/npm version check with clear error message
  - Implement port conflict detection and process termination for port 3099
  - Add backend directory existence verification
  - Add npm install error handling with output capture
  - Add npm run build error handling with TypeScript error display
  - Add database existence check and conditional seeding
  - Add server startup with environment variable PORT=3099
  - Implement health check polling with retry logic (3 attempts, 1s delay)
  - Open browser to http://localhost:3099/ only after health check passes
  - Include detailed error messages for each failure point
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

- [x] 2. Implement health check endpoint in backend
  - Create GET /api/health route in Express
  - Check database connectivity by executing a simple query
  - Return 200 with status "healthy" when database is accessible
  - Return 503 with status "unhealthy" when database is not accessible
  - Include uptime, version (from package.json), and timestamp in response
  - Ensure response time is under 100ms
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 3. Add database initialization and WAL mode setup
  - Enable SQLite WAL (Write-Ahead Logging) mode in database.ts
  - Enable foreign key constraints in database initialization
  - Create indexes on frequently queried columns: orders.kitchen_status, orders.outlet_id, orders.created_at
  - Implement debounced save mechanism (2s delay after last write)
  - Test database initialization on fresh clone
  - _Requirements: 8.7, 8.8, 17.1, 17.2, 17.3, 17.6_

- [x] 4. Checkpoint - Verify local development setup
  - Test start-local.ps1 on fresh clone without node_modules
  - Verify all error scenarios display correct messages
  - Confirm browser opens after health check passes
  - Ensure all three modules (POS, KDS, Backoffice) are accessible
  - _Checkpoint: Ensure script works reliably, ask user if questions arise_

### Priority 2: JWT Session Token System

- [ ] 5. Implement JWT authentication infrastructure
  - [x] 5.1 Create JWT token generation function in auth middleware
    - Install jsonwebtoken dependency if not present
    - Create generateToken(userId, role, outletId) function
    - Include payload: userId, role, outletId, exp (12 hours for POS, 30 min for Backoffice)
    - Sign token with JWT_SECRET from environment variable
    - _Requirements: Not in requirements doc - new functionality_
  
  - [x] 5.2 Create JWT token verification middleware
    - Create authenticateToken middleware function
    - Extract token from Authorization header (Bearer token)
    - Verify token signature and expiration using jsonwebtoken
    - Attach decoded user data to req.user
    - Return 401 Unauthorized if token is missing or invalid
    - Return 403 Forbidden if token is expired
    - _Requirements: Not in requirements doc - new functionality_
  
  - [ ] 5.3 Update /api/auth/login endpoint to return JWT token
    - Modify existing login route to generate JWT token after PIN validation
    - Include token in response body
    - Store user session in database (sessions table)
    - _Requirements: Not in requirements doc - new functionality_

- [ ] 6. Create main launcher page with JWT session sharing
  - [~] 6.1 Create index.html launcher page at project root
    - Design simple launcher UI with three buttons: Open POS, Open KDS, Open Backoffice
    - Add login form with PIN input
    - Style with minimal CSS for clean appearance
    - _Requirements: Not in requirements doc - new functionality_
  
  - [~] 6.2 Implement launcher authentication logic
    - Send POST /api/auth/login with PIN on form submit
    - Store JWT token in localStorage on successful login
    - Open POS, KDS, and Backoffice windows using window.open() with token in URL hash
    - Pass token to child windows via postMessage API
    - _Requirements: Not in requirements doc - new functionality_
  
  - [~] 6.3 Update POS, KDS, and Backoffice to read JWT from parent window
    - Modify each frontend module to listen for postMessage with JWT token
    - Store token in localStorage for API requests
    - Include token in Authorization header for all API calls
    - Redirect to launcher if token is missing or expired
    - _Requirements: Not in requirements doc - new functionality_

- [~] 7. Checkpoint - Test JWT authentication flow
  - Login via launcher page
  - Open all three windows (POS, KDS, Backoffice)
  - Verify all windows share the same session
  - Test token expiration and redirect behavior
  - _Checkpoint: Ensure JWT authentication works across modules, ask user if questions arise_

### Priority 3: POS → KDS Integration

- [ ] 8. Implement order creation API with transaction support
  - [~] 8.1 Create POST /api/orders endpoint with validation
    - Define Zod schema for order creation: items, payments, outlet_id, user_id, etc.
    - Validate incoming request body against schema
    - Return 400 Bad Request with validation errors if invalid
    - _Requirements: 2.1, 9.1, 9.2, 9.7_
  
  - [~] 8.2 Implement atomic order creation transaction
    - Start database transaction
    - Insert into orders table
    - Insert into order_items table for each item
    - Insert into order_item_modifiers table for each modifier on each item
    - Insert into payments table for each payment method
    - Update product stock quantities if stock_tracking is enabled
    - Generate unique order_number in format SNY-MMDD-NNN
    - Commit transaction if all operations succeed
    - Rollback transaction if any operation fails
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 8.1, 8.2, 8.3, 8.4, 8.5, 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [~] 8.3 Return order response with generated IDs
    - Return 201 Created with complete order object
    - Include order_id, order_number, items, modifiers, payments
    - Return 500 Internal Server Error with error type if transaction fails
    - Log order creation with INFO level
    - _Requirements: 2.11, 2.12, 9.4, 9.5, 14.4_

- [~] 9. Implement KDS polling endpoint for order queue
  - Create GET /api/orders/kitchen/queue route
  - Accept query parameters: outletId, kitchenStatus (default: 'pending,preparing')
  - Filter orders by outlet_id and kitchen_status in query
  - Return orders with items and modifiers
  - Include order_number, created_at, elapsed_time calculation
  - Order results by created_at ascending (oldest first)
  - Return empty array if no orders match
  - Ensure response time is under 200ms
  - _Requirements: 3.3, 3.4, 3.5, 12.1, 12.3, 16.1_

- [ ] 10. Implement KDS polling service in frontend
  - [~] 10.1 Create KDSPollingService class in KDS frontend
    - Initialize with outletId and pollInterval (default 5000ms)
    - Implement start(callback) method to begin polling
    - Implement stop() method to stop polling
    - Implement forceRefresh() method for manual refresh
    - _Requirements: 3.1, 3.2_
  
  - [~] 10.2 Implement polling logic with error handling
    - Send GET /api/orders/kitchen/queue?outletId=X every 5 seconds
    - Detect new orders by comparing order_id with current displayed orders
    - Call onOrderReceived callback for each new order
    - Call onOrderUpdated callback for orders with changed kitchen_status
    - Implement exponential backoff on network errors: 5s, 10s, 20s, 30s max
    - Display offline banner when polling fails
    - Resume normal interval when connection restored
    - _Requirements: 3.6, 3.7, 3.8, 3.9, 3.10_

- [~] 11. Implement order status update endpoint
  - Create PATCH /api/orders/:id/status route
  - Accept body parameter: kitchenStatus ('preparing', 'ready', 'served')
  - Validate orderId parameter exists in database
  - Validate kitchenStatus is one of allowed values
  - Update orders table with new kitchen_status and updated_at timestamp
  - Return 200 OK with success message
  - Return 404 Not Found if orderId does not exist
  - Return 400 Bad Request if kitchenStatus is invalid
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.2, 9.3_

- [~] 12. Update KDS frontend to handle status updates
  - Implement swipe gesture handlers on order cards
  - Send PATCH /api/orders/:id/status on swipe complete
  - Update order card visual state on success response
  - Animate order card removal when marked 'ready'
  - Revert visual state on error response
  - Display error toast if status update fails
  - _Requirements: 4.6, 4.7, 4.8_

- [~] 13. Checkpoint - Test POS to KDS order flow
  - Create order in POS with multiple items and modifiers
  - Verify order appears in KDS within 5 seconds
  - Mark order as preparing in KDS, verify status updates
  - Mark order as ready in KDS, verify card is removed
  - Test with 2 concurrent browsers (POS + KDS)
  - _Checkpoint: Ensure order flow works end-to-end, ask user if questions arise_

### Priority 4: Menu Sync (Backoffice → POS)

- [ ] 14. Implement cache manager for menu data
  - [~] 14.1 Create CacheManager class in backend
    - Implement in-memory Map for cache storage
    - Implement get(key) method returning cached value or null
    - Implement set(key, value, ttl) method with expiration timestamp
    - Implement invalidate(key) method to delete single key
    - Implement invalidatePattern(pattern) method to delete keys matching pattern
    - Implement clear() method to delete all keys
    - Implement automatic cleanup of expired entries on get operations
    - _Requirements: 10.1, 10.8, 10.9_
  
  - [~] 14.2 Initialize CacheManager in Express app
    - Create singleton CacheManager instance
    - Make cache manager accessible to route handlers
    - _Requirements: 10.1_

- [~] 15. Implement menu retrieval endpoint with caching
  - Create GET /api/menu/outlet/:outletId route
  - Check cache for key "menu:outlet:{outletId}" on request
  - Return cached MenuTree if cache hit and not expired
  - Query database for categories, items, modifier_groups, stations if cache miss
  - Assemble data into MenuTree structure with categories, items, modifierGroups, stations arrays
  - Store MenuTree in cache with 5-minute TTL (300000ms)
  - Return MenuTree in response body
  - Filter all data by outlet_id for multi-outlet isolation
  - Ensure response time is under 200ms at 95th percentile
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 10.2, 10.3, 10.4, 10.5, 10.6, 12.2, 12.4, 16.1_

- [~] 16. Update POS frontend to store and render menu
  - Fetch menu from GET /api/menu/outlet/:outletId on app load
  - Store menu data in localStorage with timestamp
  - Render menu grid with categories and items
  - Display items with emoji, name, and price
  - Disable items with status 'sold_out' visually (greyed out, unclickable)
  - Refresh menu every 5 minutes (cache TTL)
  - _Requirements: 5.8, 5.9, 5.10_

- [~] 17. Implement menu item creation endpoint
  - Create POST /api/menu/items route
  - Define Zod schema for menu item: name, price, category_id, outlet_id, etc.
  - Validate request body against schema
  - Insert item into menu_items table
  - Invalidate cache key "menu:outlet:{outletId}"
  - Return 201 Created with item_id and created item
  - Return 400 Bad Request if validation fails
  - Log menu creation with INFO level
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 14.5_

- [~] 18. Implement menu item update endpoint
  - Create PATCH /api/menu/items/:id route
  - Accept partial updates for fields: name, price, status, etc.
  - Validate itemId exists in database
  - Update menu_items table with provided fields
  - Invalidate cache key "menu:outlet:{outletId}"
  - Return 200 OK with updated item
  - Return 404 Not Found if itemId does not exist
  - Log menu update with INFO level
  - _Requirements: 6.6, 6.7, 6.8, 14.5_

- [~] 19. Implement sold-out status synchronization
  - Use existing PATCH /api/menu/items/:id endpoint for status updates
  - Backoffice sends status: 'sold_out' or 'active'
  - Cache invalidation triggers on status update
  - POS receives updated menu on next refresh or manual reload
  - POS disables sold-out items (grey out, prevent selection)
  - Display "Sold Out" badge on disabled items
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [~] 20. Checkpoint - Test menu synchronization flow
  - Create new menu item in Backoffice
  - Verify item appears in POS within 5 minutes or on manual refresh
  - Update menu item name and price in Backoffice
  - Verify changes reflect in POS
  - Mark item as sold out in Backoffice
  - Verify item is disabled in POS menu grid
  - Mark item as active again, verify re-enabled in POS
  - _Checkpoint: Ensure menu sync works bidirectionally, ask user if questions arise_

### Additional Integration Tasks

- [~] 21. Implement comprehensive error handling and validation
  - Review all API routes for consistent error responses
  - Ensure all routes use Zod validation schemas
  - Implement XSS sanitization middleware using 'xss' library
  - Verify parameterized queries (no string concatenation)
  - Add rate limiting middleware: 100 requests per minute per IP
  - Ensure error responses do not include stack traces in production mode
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 19.5_

- [ ] 22. Implement request and error logging
  - [~] 22.1 Create logging middleware for API requests
    - Log method, path, status code, duration for every request
    - Use INFO level for successful requests
    - Use ERROR level for 5xx responses
    - Use WARN level for 4xx responses
    - _Requirements: 14.1, 14.9_
  
  - [~] 22.2 Add database query performance logging
    - Log WARN for queries taking longer than 100ms
    - Include query text and duration in log message
    - _Requirements: 14.2_
  
  - [~] 22.3 Add operation-specific logging
    - Log order creation with order_number and order_id
    - Log menu updates with item_id and action (create/update/delete)
    - Log authentication attempts (success and failure)
    - _Requirements: 14.4, 14.5, 14.6_

- [~] 23. Implement static file serving for all modules
  - Configure Express to serve static files from backoffice/frontend at /backoffice
  - Configure Express to serve static files from kds/frontend at /kds  
  - Configure Express to serve static files from pos/frontend at /pos (if separate directory)
  - Serve index.html (launcher page) at / root path
  - Set correct MIME types for CSS, JS, HTML files
  - Enable gzip compression for text-based assets
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_

- [~] 24. Add development mode vs production mode configuration
  - Read NODE_ENV environment variable (default: 'development')
  - In development mode: enable DEBUG logs, CORS from any origin, no rate limiting, include stack traces in errors
  - In production mode: enable INFO logs, restricted CORS, rate limiting enabled, no stack traces
  - Document environment variables in .env.example
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [~] 25. Final integration checkpoint
  - Run full system test: start-local.ps1 → login via launcher → open all modules → create order → update menu
  - Verify POS → KDS order flow works with polling
  - Verify Backoffice → POS menu sync works with caching
  - Verify JWT authentication works across all modules
  - Verify health check endpoint responds correctly
  - Test error scenarios: invalid data, network failures, concurrent operations
  - _Checkpoint: Full system integration test, ask user if questions arise before considering complete_

## Notes

- Each task references specific requirements for traceability
- The implementation follows the four priority areas identified by the user
- Priority 1 (local dev) must be completed and working before Priority 2
- Priority 3 (order flow) depends on Priority 1 being stable
- Priority 4 (menu sync) can be developed in parallel with Priority 3 after Priority 1 is complete
- JWT authentication (Priority 2) is separate and can be implemented after Priority 1
- Checkpoints ensure incremental validation at each priority level
- All tasks assume the existing codebase structure (Express backend, separate frontend modules)
- TypeScript is used for backend implementation (existing setup)
- JavaScript is used for frontend implementation (existing setup)
