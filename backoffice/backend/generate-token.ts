import dotenv from 'dotenv';
import { generateToken } from './src/middleware/auth';

// Load environment variables
dotenv.config();

/**
 * Generate JWT Token for Testing
 * 
 * This script generates a valid JWT token for testing API endpoints
 * that require authentication.
 * 
 * Usage:
 *   npx ts-node generate-token.ts
 * 
 * The token will be valid for:
 * - Cashier/Chef roles: 12 hours
 * - Manager/Owner/Admin roles: 30 minutes
 */

// Test user configuration
const testUser = {
  userId: '550e8400-e29b-41d4-a716-446655440000', // UUID format (should match a real user ID in your database)
  role: 'admin', // Options: admin, owner, manager, cashier, chef
  outletId: '123e4567-e89b-12d3-a456-426614174000' // UUID format (should match a real outlet ID)
};

console.log('🔐 Generating JWT Token for Testing\n');
console.log('User Configuration:');
console.log('  User ID:', testUser.userId);
console.log('  Role:', testUser.role);
console.log('  Outlet ID:', testUser.outletId);
console.log('');

// Generate token
const token = generateToken(testUser.userId, testUser.role, testUser.outletId);

console.log('✅ Token Generated Successfully!\n');
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║ COPY THE TOKEN BELOW:                                                      ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log(token);
console.log('');
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║ HOW TO USE:                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Option 1: cURL');
console.log('  curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3099/api/categories');
console.log('');
console.log('Option 2: Postman / Thunder Client');
console.log('  1. Create a new request');
console.log('  2. Set Authorization Type: Bearer Token');
console.log('  3. Paste the token above');
console.log('  4. Send request to: http://localhost:3099/api/categories');
console.log('');
console.log('Option 3: JavaScript fetch()');
console.log('  fetch("http://localhost:3099/api/categories", {');
console.log('    headers: {');
console.log('      "Authorization": "Bearer YOUR_TOKEN"');
console.log('    }');
console.log('  });');
console.log('');

// Display token expiration info
const isPOSRole = ['cashier', 'chef'].includes(testUser.role.toLowerCase());
const expiresIn = isPOSRole ? '12 hours' : '30 minutes';
console.log('⏰ Token Expiration:', expiresIn);
console.log('');
console.log('💡 TIP: If the token expires, just run this script again to generate a new one.');
console.log('');
