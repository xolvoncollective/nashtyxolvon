const https = require('https');

async function testApi() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTEiLCJ1c2VybmFtZSI6ImFkbWluMSIsInJvbGUiOiJhZG1pbiIsInRlbmFudElkIjoiZGVtby10ZW5hbnQiLCJjcmVhdGVkQXQiOiIyMDI2LTA2LTIwVDEzOjM0OjMwLjkyMFoiLCJpYXQiOjE3ODE5NjI0NzAsImV4cCI6MTc4MjA0ODg3MH0.7Si0XKsQz2OOnGk0lr3ijiMOsOnKA7QU-seEWTf5dto';
  const url = 'https://nashty-backoffice-backend-production.up.railway.app/api/categories?tenantId=demo-tenant';
  
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}

testApi();
