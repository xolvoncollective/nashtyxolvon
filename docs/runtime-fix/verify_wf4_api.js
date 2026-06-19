const crypto = require('crypto');

(async () => {
  try {
    const tenantId = 'demo-tenant';
    const outletId = 'demo-outlet';

    console.log('1. Skip fetch menu, using hardcoded product');
    const productId = '73d9ecc9-c589-4f44-8ab4-08114da061f1';
    const productName = 'Ayam Bakar Madu';
    const price = 55000;

    console.log('2. Create Order for a new Member with phone 08999999999');
    const orderData = {
      tenantId,
      outletId,
      userId: 'admin',
      orderType: 'takeaway',
      tableNumber: 'TAKE',
      customerName: 'Nashty Fan',
      customerPhone: '08999999999',
      subtotal: price,
      discount: 0,
      tax: 0,
      serviceCharge: 0,
      total: price,
      paymentMethod: 'cash',
      payments: [{ method: 'cash', amount: price, change: 0 }],
      items: [{
        productId,
        productName,
        quantity: 1,
        unitPrice: price,
        subtotal: price,
        modifiers: []
      }]
    };

    const createRes = await fetch('http://localhost:3099/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const orderObj = await createRes.json();
    console.log('Order created:', orderObj.success, orderObj.error);
    if (!orderObj.success) return;
    const orderId = orderObj.order.id;

    console.log('3. Complete order via KDS status update');
    const statusRes = await fetch(`http://localhost:3099/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kitchenStatus: 'served', orderStatus: 'completed' })
    });
    const statusObj = await statusRes.json();
    console.log('Status update:', statusObj.success);

    console.log('4. Verify CRM points via API or SQLite');
    const crmRes = await fetch(`http://localhost:3099/api/crm/${tenantId}/members`);
    const crmObj = await crmRes.json();
    const member = crmObj.data.find(m => m.phone === '08999999999');
    console.log('Member points:', member ? member.points : 'Not found');

  } catch (e) {
    console.error(e);
  }
})();
