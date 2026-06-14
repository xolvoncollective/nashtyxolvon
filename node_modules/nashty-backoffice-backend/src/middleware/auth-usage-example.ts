/**
 * EXAMPLE: How to use authenticateToken middleware in routes
 * 
 * This file demonstrates how to protect API routes with JWT authentication
 * using the authenticateToken middleware.
 */

import express, { Router } from 'express';
import { authenticateToken, AuthRequest } from './auth';

const router: Router = express.Router();

// Example 1: Protect a single route
router.get('/api/protected-endpoint', authenticateToken, (req: AuthRequest, res) => {
  // At this point, req.user is available and contains:
  // - id: user ID
  // - role: user role
  // - tenantId: tenant ID
  // - outletId: outlet ID (or null)
  
  res.json({
    success: true,
    message: 'You are authenticated!',
    user: req.user
  });
});

// Example 2: Protect multiple routes using router middleware
const protectedRouter = express.Router();
protectedRouter.use(authenticateToken); // All routes below are protected

protectedRouter.get('/api/orders', (req: AuthRequest, res) => {
  // User is authenticated, can access req.user
  const userId = req.user?.id;
  const outletId = req.user?.outletId;
  
  res.json({
    success: true,
    message: `Orders for user ${userId} at outlet ${outletId}`
  });
});

protectedRouter.post('/api/orders', (req: AuthRequest, res) => {
  // User is authenticated
  res.json({
    success: true,
    message: 'Order created',
    createdBy: req.user?.id
  });
});

// Example 3: Mix protected and unprotected routes
const mixedRouter = express.Router();

// Public route - no authentication
mixedRouter.get('/api/public/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Protected route - requires authentication
mixedRouter.get('/api/private/data', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    success: true,
    data: 'This is private data',
    user: req.user
  });
});

/**
 * CLIENT-SIDE USAGE:
 * 
 * When making requests from the frontend, include the JWT token in the Authorization header:
 * 
 * ```javascript
 * const token = localStorage.getItem('jwt_token');
 * 
 * fetch('/api/protected-endpoint', {
 *   method: 'GET',
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *     'Content-Type': 'application/json'
 *   }
 * })
 * .then(response => response.json())
 * .then(data => console.log(data))
 * .catch(error => {
 *   if (error.status === 401) {
 *     // Token missing or invalid - redirect to login
 *     window.location.href = '/login';
 *   } else if (error.status === 403) {
 *     // Token expired - refresh token or redirect to login
 *     window.location.href = '/login';
 *   }
 * });
 * ```
 * 
 * ERROR RESPONSES:
 * 
 * 401 Unauthorized (token missing or invalid):
 * {
 *   "success": false,
 *   "error": "Unauthorized",
 *   "message": "Access token is missing" // or "Invalid token"
 * }
 * 
 * 403 Forbidden (token expired):
 * {
 *   "success": false,
 *   "error": "Forbidden",
 *   "message": "Token has expired"
 * }
 */

export default router;
