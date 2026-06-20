/**
 * Logging Middleware for API Requests
 * Requirements: 14.1, 14.2, 14.9
 * 
 * This middleware logs all API requests with method, path, status, and duration.
 * It also provides helper functions for operation-specific logging.
 */

import { Request, Response, NextFunction } from 'express';
import { run } from '../db/database';
import { randomUUID } from 'crypto';

/**
 * Request logging middleware (Requirement 14.1, 14.9)
 * Logs method, path, status code, duration for every request
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const { method, path, originalUrl } = req;
  
  // Capture the original res.json to log after response is sent
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  // Override res.json to capture response
  res.json = function(body: any) {
    logRequestCompletion();
    return originalJson(body);
  };
  
  // Override res.send to capture response
  res.send = function(body: any) {
    logRequestCompletion();
    return originalSend(body);
  };
  
  function logRequestCompletion() {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const url = originalUrl || path;
    
    if (statusCode >= 500) {
      // ERROR level for 5xx responses
      console.error(`[ERROR] ${method} ${url} - ${statusCode} - ${duration}ms`);
    } else if (statusCode >= 400) {
      // WARN level for 4xx responses
      console.warn(`[WARN] ${method} ${url} - ${statusCode} - ${duration}ms`);
    } else {
      // INFO level for successful requests (2xx, 3xx)
      console.log(`[INFO] ${method} ${url} - ${statusCode} - ${duration}ms`);
    }

    // GHOST ACTION PREVENTION: Automatically log all state mutations to the database
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && statusCode >= 200 && statusCode < 400) {
        // Exclude some spammy paths
        if (!path.includes('/api/health') && !path.includes('/logs')) {
            const tenantId = (req.body && req.body.tenantId) || (req.query && req.query.tenantId) || ((req as any).user && (req as any).user.tenantId) || 'unknown';
            const userId = ((req as any).user && (req as any).user.id) || req.headers['x-user-id'] || 'system';
            const action = method.toLowerCase();
            const entityType = path.split('/')[2] || 'system'; // e.g. /api/orders -> orders
            const description = `Auto-logged: ${method} ${url}`;
            
            // Insert asynchronously without awaiting to not block response
            run(`
              INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, description)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [randomUUID(), tenantId, userId, action, entityType, 'auto', description]).catch(err => {
               console.error('[WARN] Auto-logger failed to write to DB:', err.message);
            });
        }
    }
  }
  
  next();
}

/**
 * Database query performance logger (Requirement 14.2)
 * Call this function to log slow queries (>100ms)
 * 
 * @param queryText - The SQL query text
 * @param duration - Query execution time in milliseconds
 * @param params - Optional query parameters
 */
export function logSlowQuery(queryText: string, duration: number, params?: any[]) {
  if (duration > 100) {
    const paramsStr = params ? ` | Params: ${JSON.stringify(params)}` : '';
    console.warn(`[WARN] Slow query detected (${duration}ms): ${queryText}${paramsStr}`);
  }
}

/**
 * Operation-specific logging helpers (Requirement 14.4, 14.5, 14.6)
 */

/**
 * Log order creation (Requirement 14.4)
 * @param orderNumber - The generated order number
 * @param orderId - The order ID
 * @param total - Order total amount
 */
export function logOrderCreation(orderNumber: string, orderId: string, total: number) {
  console.log(`[INFO] Order created - order_number: ${orderNumber}, order_id: ${orderId}, total: Rp ${total.toLocaleString()}`);
}

/**
 * Log order status update (Requirement 14.4)
 * @param orderId - The order ID
 * @param oldStatus - Previous status
 * @param newStatus - New status
 */
export function logOrderStatusUpdate(orderId: string, oldStatus: string, newStatus: string) {
  console.log(`[INFO] Order status updated - order_id: ${orderId}, status: ${oldStatus} → ${newStatus}`);
}

/**
 * Log menu item creation (Requirement 14.5)
 * @param itemId - The menu item ID
 * @param name - Item name
 * @param action - Action type (create/update/delete)
 */
export function logMenuOperation(itemId: string, name: string, action: 'create' | 'update' | 'delete') {
  console.log(`[INFO] Menu ${action} - item_id: ${itemId}, name: "${name}"`);
}

/**
 * Log authentication attempt (Requirement 14.6)
 * @param userId - User ID attempting authentication
 * @param success - Whether authentication succeeded
 * @param method - Authentication method (PIN, JWT, etc.)
 */
export function logAuthAttempt(userId: string | null, success: boolean, method: string = 'PIN') {
  if (success) {
    console.log(`[INFO] Authentication successful - user_id: ${userId}, method: ${method}`);
  } else {
    console.warn(`[WARN] Authentication failed - user_id: ${userId || 'unknown'}, method: ${method}`);
  }
}

/**
 * Log cache operations for debugging
 * @param operation - Cache operation (hit/miss/invalidate)
 * @param key - Cache key
 */
export function logCacheOperation(operation: 'hit' | 'miss' | 'invalidate' | 'set', key: string, duration?: number) {
  const durationStr = duration !== undefined ? ` - ${duration}ms` : '';
  
  if (operation === 'hit') {
    console.log(`[DEBUG] Cache HIT - key: ${key}${durationStr}`);
  } else if (operation === 'miss') {
    console.log(`[DEBUG] Cache MISS - key: ${key}${durationStr}`);
  } else if (operation === 'invalidate') {
    console.log(`[INFO] Cache invalidated - key: ${key}`);
  } else if (operation === 'set') {
    console.log(`[DEBUG] Cache SET - key: ${key}`);
  }
}

/**
 * Generic error logger
 * @param context - Context where error occurred
 * @param error - The error object
 */
export function logError(context: string, error: any) {
  const errorMessage = error?.message || 'Unknown error';
  const errorStack = error?.stack || '';
  
  // In development, include stack trace; in production, omit it
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${context}: ${errorMessage}\n${errorStack}`);
  } else {
    console.error(`[ERROR] ${context}: ${errorMessage}`);
  }
}
