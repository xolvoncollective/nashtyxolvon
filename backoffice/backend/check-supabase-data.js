const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'ZaidunkMargin';

// Generate token
const token = jwt.sign(
  {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'admin',
    outletId: '123e4567-e89b-12d3-a456-426614174000',
    iat: Math.floor(Date.now() / 1000)
  },
  JWT_SECRET,
  { expiresIn: '30m' }
);

console.log('🔍 Checking Supabase Data...\n');

// Function to test an endpoint
function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3099,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n${description}`);
        console.log('━'.repeat(60));
        console.log('Status:', res.statusCode);
        
        try {
          const parsed = JSON.parse(data);
          console.log('Response:', JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (e) {
          console.log('Response:', data);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error for ${description}:`, error.message);
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  try {
    // Test different tenant IDs to see what's in the database
    await testEndpoint('/api/categories?tenantId=demo-tenant-001', '1️⃣  Categories (demo-tenant-001)');
    await testEndpoint('/api/categories?tenantId=tenant-001', '2️⃣  Categories (tenant-001)');
    await testEndpoint('/api/products?tenantId=demo-tenant-001&outletId=outlet-001', '3️⃣  Products (demo-tenant-001)');
    
    console.log('\n✅ Data check complete!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
