import dotenv from 'dotenv';
import { generateToken } from './src/middleware/auth';

// Load environment variables
dotenv.config();

const testUser = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  role: 'admin',
  outletId: '123e4567-e89b-12d3-a456-426614174000'
};

const token = generateToken(testUser.userId, testUser.role, testUser.outletId);

console.log('🧪 Testing API with JWT Token\n');

// Test categories endpoint
async function testAPI() {
  try {
    const response = await fetch('http://localhost:3099/api/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ API Test Successful!');
      console.log(`Found ${data.data?.length || 0} categories from Supabase`);
    } else {
      console.log('\n❌ API Test Failed');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
