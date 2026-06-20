const jwt = require('jsonwebtoken');
const https = require('http');

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

console.log('🔐 Generated Token:\n');
console.log(token);
console.log('\n🧪 Testing API...\n');

// Test API
const options = {
  hostname: 'localhost',
  port: 3099,
  path: '/api/categories?tenantId=demo-tenant-001',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:\n');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ Success! Categories loaded from Supabase');
        console.log(`Found ${parsed.data?.length || 0} categories`);
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
