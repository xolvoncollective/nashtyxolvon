const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'ZaidunkMargin';
const tenantId = '00000000-0000-0000-0000-000000000001'; // Demo tenant with data

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

console.log('🧪 Testing API with Real Supabase Data\n');
console.log(`Tenant ID: ${tenantId}\n`);

// Test categories endpoint
const options = {
  hostname: 'localhost',
  port: 3099,
  path: `/api/categories?tenantId=${tenantId}`,
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
    console.log('Status Code:', res.statusCode);
    console.log('\nResponse:\n');
    
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 200 && parsed.categories) {
        console.log('\n✅ SUCCESS! Supabase integration working!');
        console.log(`\n📊 Found ${parsed.categories.length} categories:`);
        parsed.categories.forEach((cat, i) => {
          console.log(`   ${i + 1}. ${cat.name} (${cat.product_count || 0} products)`);
        });
      } else {
        console.log('\n❌ Request failed');
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
