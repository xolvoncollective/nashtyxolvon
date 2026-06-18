const http = require('http');

const API_URL = 'http://localhost:3000/api';
const TENANT_ID = 'tenant-nashty'; // We assume a default tenant id is used
const OUTLET_ID = 'outlet-1';
const USER_ID = 'admin';

const makeRequest = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', error => reject(error));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

async function runTests() {
  console.log("Starting Stage 3B-R Validations...");

  // Get tenant ID from an existing outlet
  const outlets = await makeRequest('GET', '/outlets?tenantId=tenant-nashty');
  // Just use tenant-nashty

  const customerPhone = '08123456789';
  const customerName = 'Budi Test';

  console.log("--- WAVE 1: CRM Integration ---");
  // 1. Create Order with customer info
  const orderData = {
    tenantId: TENANT_ID,
    outletId: OUTLET_ID,
    userId: USER_ID,
    orderType: 'dine-in',
    customerName,
    customerPhone,
    items: [
      {
        productId: 'prod-1', // Assuming product exists, we might get an error if it doesn't
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 50000,
        subtotal: 50000
      }
    ],
    subtotal: 50000,
    total: 50000,
    paymentMethod: 'cash',
    payments: [{ method: 'cash', amount: 50000 }]
  };

  let res = await makeRequest('POST', '/orders', orderData);
  console.log("Create Order:", res);
  
  if (res.success) {
    const orderId = res.order.id;
    console.log("Order created:", orderId);

    // Complete the order
    const compRes = await makeRequest('PATCH', `/orders/${orderId}/status`, { orderStatus: 'completed' });
    console.log("Complete Order:", compRes);
    
    // Verify CRM points
    const pts = await makeRequest('GET', `/crm/point-transactions?tenantId=${TENANT_ID}`);
    console.log("Point Transactions:", pts);
    
    console.log("--- WAVE 3: Point Reversal ---");
    // Refund the order
    const refRes = await makeRequest('POST', `/orders/${orderId}/refund`, { reason: 'Test Refund', refundAmount: 50000 });
    console.log("Refund Order:", refRes);

    const ptsAfter = await makeRequest('GET', `/crm/point-transactions?tenantId=${TENANT_ID}`);
    console.log("Point Transactions after refund:", ptsAfter);
  }

  console.log("--- WAVE 4 & 5: Cost Service ---");
  const recipeData = {
    tenantId: TENANT_ID,
    nama: 'Nashty Fried Chicken',
    hpp_total: 15000,
    harga_jual: 35000
  };
  const recRes = await makeRequest('POST', '/costs/recipes', recipeData);
  console.log("Create Recipe:", recRes);
  
  if (recRes.success) {
    const updateRec = await makeRequest('PUT', `/costs/recipes/${recRes.id}`, { tenantId: TENANT_ID, hpp_total: 18000 });
    console.log("Update Recipe Cost:", updateRec);
  }

  console.log("Validation tests finished.");
}

runTests().catch(console.error);
