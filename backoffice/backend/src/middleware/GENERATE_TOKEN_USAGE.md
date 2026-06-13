# generateToken Function Usage Guide

## Overview

The `generateToken` function creates JWT tokens for user authentication across all three NASHTY OS modules (POS, KDS, Backoffice). It implements role-based token expiration for security and usability.

## Function Signature

```typescript
generateToken(userId: string, role: string, outletId: string | null): string
```

## Parameters

- **userId** (string): Unique identifier for the user
- **role** (string): User's role (determines token expiration)
- **outletId** (string | null): Outlet identifier, can be null for multi-outlet admins

## Token Expiration Logic

The function automatically determines token expiration based on role:

### POS Roles (12 hours)
- `cashier` - For longer shift support
- `chef` - For kitchen staff

### Backoffice Roles (30 minutes)
- `manager` - For security in management operations
- `owner` - For business owners
- `admin` - For system administrators

## Token Payload

The generated JWT contains:

```typescript
{
  userId: string,      // User ID
  role: string,        // User role
  outletId: string | null,  // Outlet ID
  iat: number,         // Issued at timestamp
  exp: number          // Expiration timestamp
}
```

## Usage Examples

### Example 1: Generate token for cashier
```typescript
import { generateToken } from './middleware/auth';

// After successful PIN authentication
const token = generateToken('user-123', 'cashier', 'outlet-abc');
// Token expires in 12 hours
```

### Example 2: Generate token for manager
```typescript
import { generateToken } from './middleware/auth';

// After successful login
const token = generateToken('user-456', 'manager', 'outlet-abc');
// Token expires in 30 minutes
```

### Example 3: Generate token for multi-outlet admin
```typescript
import { generateToken } from './middleware/auth';

// Admin without specific outlet
const token = generateToken('admin-999', 'admin', null);
// Token expires in 30 minutes
```

### Example 4: Integration with login route
```typescript
router.post('/login', async (req, res) => {
  const { pin, outletId } = req.body;
  
  // Validate PIN...
  const user = await validateUserPin(pin, outletId);
  
  if (user) {
    // Generate JWT token
    const token = generateToken(user.id, user.role, user.outlet_id);
    
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        outletId: user.outlet_id
      }
    });
  }
  
  return res.status(401).json({ error: 'Invalid PIN' });
});
```

## Verifying Tokens

To verify a token, use the standard `jsonwebtoken` library:

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nashty-super-secret-key-2026';

try {
  const decoded = jwt.verify(token, JWT_SECRET) as {
    userId: string;
    role: string;
    outletId: string | null;
    iat: number;
    exp: number;
  };
  
  console.log('Token is valid:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}
```

## Security Considerations

1. **JWT_SECRET**: Always use a strong, unique secret in production. Set via environment variable:
   ```bash
   JWT_SECRET=your-secure-random-secret-key-here
   ```

2. **Role-based expiration**: 
   - POS roles get longer tokens (12h) for uninterrupted shift work
   - Backoffice roles get shorter tokens (30m) for higher security

3. **Token storage**:
   - Store tokens securely in httpOnly cookies or secure storage
   - Never expose tokens in URLs or logs

4. **Token refresh**:
   - Implement token refresh mechanism for Backoffice users
   - POS users can continue working through their shift

## Testing

Run the test suite to verify the function:

```bash
npx tsx src/middleware/auth.test.ts
```

Expected output:
```
Testing generateToken function...

Test 1: Cashier role (12 hours expiration)
  ✓ Pass: true 

Test 2: Chef role (12 hours expiration)
  ✓ Pass: true 

Test 3: Manager role (30 minutes expiration)
  ✓ Pass: true 

Test 4: Admin role (30 minutes expiration)
  ✓ Pass: true 

Test 5: Token structure validation
  ✓ Pass: true 

All tests completed!
```

## Next Steps

To complete the JWT authentication system:

1. ✅ Task 5.1: Generate JWT tokens (COMPLETED)
2. Update login routes to use generateToken
3. Implement token verification middleware
4. Add token refresh endpoint for Backoffice
5. Update frontend modules to store and send tokens
6. Test end-to-end authentication flow

## Related Files

- `src/middleware/auth.ts` - Main auth middleware with generateToken
- `src/middleware/auth.test.ts` - Test suite for generateToken
- `src/routes/auth.ts` - Authentication routes (to be updated)
- `src/routes/main-auth.ts` - Main launcher auth routes
