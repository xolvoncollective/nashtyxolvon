import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nashty-super-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId: string;
    outletId: string | null;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // BYPASS AUTH FOR LOCAL DEV
  req.user = {
    id: 'local-admin',
    role: 'admin',
    tenantId: 'demo-tenant',
    outletId: 'demo-outlet'
  };
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // BYPASS ROLE CHECK FOR LOCAL DEV
    next();
  };
};

/**
 * Generate JWT token for user authentication
 * @param userId - User ID
 * @param role - User role (determines token expiration)
 * @param outletId - Outlet ID
 * @returns Signed JWT token string
 * 
 * Token expiration:
 * - POS roles (cashier, chef): 12 hours
 * - Backoffice roles (manager, owner, admin): 30 minutes
 */
export const generateToken = (userId: string, role: string, outletId: string | null): string => {
  // Determine expiration based on role
  // POS Terminal (cashier, chef) gets 12 hours for longer shifts
  // Backoffice (manager, owner, admin) gets 30 minutes for security
  const isPOSRole = ['cashier', 'chef'].includes(role.toLowerCase());
  const expiresIn = isPOSRole ? '12h' : '30m';
  
  const payload = {
    userId,
    role,
    outletId,
    iat: Math.floor(Date.now() / 1000) // issued at
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Middleware to authenticate JWT token from Authorization header
 * Verifies token signature and expiration, attaches decoded user data to req.user
 * 
 * Returns:
 * - 401 Unauthorized if token is missing or invalid
 * - 403 Forbidden if token is expired
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Extract token from Authorization header (format: "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get token after "Bearer "
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized', 
      message: 'Access token is missing' 
    });
  }
  
  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      outletId: string | null;
      iat: number;
      exp: number;
    };
    
    // Attach decoded user data to request object
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      tenantId: 'demo-tenant', // Will be included in token payload in future
      outletId: decoded.outletId
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden', 
        message: 'Token has expired' 
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized', 
        message: 'Invalid token' 
      });
    }
    
    // Catch-all for other errors
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized', 
      message: 'Token verification failed' 
    });
  }
};
