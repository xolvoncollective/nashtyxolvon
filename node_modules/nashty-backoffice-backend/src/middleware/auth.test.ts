import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, generateToken, AuthRequest } from './auth';

const JWT_SECRET = process.env.JWT_SECRET || 'nashty-super-secret-key-2026';

describe('authenticateToken Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  describe('Valid Token Tests', () => {
    it('should successfully authenticate with valid token and attach user to request', () => {
      // Generate a valid token
      const token = generateToken('user123', 'cashier', 'outlet-001');
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      // Should call next() without errors
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe('user123');
      expect(mockRequest.user?.role).toBe('cashier');
      expect(mockRequest.user?.outletId).toBe('outlet-001');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should authenticate POS role token with 12-hour expiration', () => {
      const token = generateToken('chef-456', 'chef', 'outlet-002');
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user?.role).toBe('chef');
    });

    it('should authenticate Backoffice role token with 30-minute expiration', () => {
      const token = generateToken('manager-789', 'manager', 'outlet-003');
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user?.role).toBe('manager');
    });

    it('should handle token with null outletId', () => {
      const token = generateToken('admin-001', 'admin', null);
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user?.outletId).toBe(null);
    });
  });

  describe('Missing Token Tests', () => {
    it('should return 401 when Authorization header is missing', () => {
      mockRequest.headers = {}; // No authorization header

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Access token is missing'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header has no Bearer token', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat'
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Access token is missing'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer token is empty', () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Access token is missing'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Token Tests', () => {
    it('should return 401 for invalid token signature', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token.signature'
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed token', () => {
      mockRequest.headers = {
        authorization: 'Bearer malformed-token'
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 for token signed with wrong secret', () => {
      const wrongSecretToken = jwt.sign(
        { userId: 'user123', role: 'cashier', outletId: 'outlet-001' },
        'wrong-secret-key',
        { expiresIn: '1h' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${wrongSecretToken}`
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Expired Token Tests', () => {
    it('should return 403 for expired token', () => {
      // Create a token that expired 1 hour ago
      const expiredToken = jwt.sign(
        { 
          userId: 'user123', 
          role: 'cashier', 
          outletId: 'outlet-001',
          iat: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
        },
        JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Token has expired'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle authorization header with extra spaces', () => {
      const token = generateToken('user123', 'cashier', 'outlet-001');
      mockRequest.headers = {
        authorization: `Bearer  ${token}` // Extra space
      };

      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      // Should fail because split(' ')[1] will be empty
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle lowercase bearer prefix', () => {
      const token = generateToken('user123', 'cashier', 'outlet-001');
      mockRequest.headers = {
        authorization: `bearer ${token}` // lowercase
      };

      // The current implementation is case-sensitive
      // This will extract the token correctly since it splits on space
      authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
    });
  });
});

describe('generateToken Function', () => {
  it('should generate valid token for cashier role with 12h expiration', () => {
    const token = generateToken('cashier-123', 'cashier', 'outlet-001');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    expect(decoded.userId).toBe('cashier-123');
    expect(decoded.role).toBe('cashier');
    expect(decoded.outletId).toBe('outlet-001');
    
    // Check token expires in approximately 12 hours (allow 1 second tolerance)
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBeGreaterThanOrEqual(12 * 60 * 60 - 1);
    expect(expiresIn).toBeLessThanOrEqual(12 * 60 * 60 + 1);
  });

  it('should generate valid token for chef role with 12h expiration', () => {
    const token = generateToken('chef-456', 'chef', 'outlet-002');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    expect(decoded.role).toBe('chef');
    
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBeGreaterThanOrEqual(12 * 60 * 60 - 1);
  });

  it('should generate valid token for manager role with 30min expiration', () => {
    const token = generateToken('manager-789', 'manager', 'outlet-003');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    expect(decoded.role).toBe('manager');
    
    // Check token expires in approximately 30 minutes
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBeGreaterThanOrEqual(30 * 60 - 1);
    expect(expiresIn).toBeLessThanOrEqual(30 * 60 + 1);
  });

  it('should generate valid token for owner role with 30min expiration', () => {
    const token = generateToken('owner-001', 'owner', 'outlet-004');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    expect(decoded.role).toBe('owner');
    
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBeGreaterThanOrEqual(30 * 60 - 1);
    expect(expiresIn).toBeLessThanOrEqual(30 * 60 + 1);
  });

  it('should generate valid token for admin role with 30min expiration', () => {
    const token = generateToken('admin-002', 'admin', null);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    expect(decoded.role).toBe('admin');
    expect(decoded.outletId).toBe(null);
    
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBeGreaterThanOrEqual(30 * 60 - 1);
    expect(expiresIn).toBeLessThanOrEqual(30 * 60 + 1);
  });

  it('should handle case-insensitive role matching for POS roles', () => {
    const tokenCashier = generateToken('user1', 'Cashier', 'outlet-001');
    const tokenChef = generateToken('user2', 'CHEF', 'outlet-002');
    
    const decodedCashier = jwt.verify(tokenCashier, JWT_SECRET) as any;
    const decodedChef = jwt.verify(tokenChef, JWT_SECRET) as any;
    
    // Both should get 12h expiration
    const expiresInCashier = decodedCashier.exp - decodedCashier.iat;
    const expiresInChef = decodedChef.exp - decodedChef.iat;
    
    expect(expiresInCashier).toBeGreaterThanOrEqual(12 * 60 * 60 - 1);
    expect(expiresInChef).toBeGreaterThanOrEqual(12 * 60 * 60 - 1);
  });
});
