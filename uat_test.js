const http = require('http');

function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3099,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    let payload = '';
    if (body) {
      payload = JSON.stringify(body);
      options.headers['Content-Length'] = payload.length;
    }
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error('❌ ASSERT FAILED:', message);
    process.exit(1);
  }
}

async function runUAT() {
  console.log('🚀 Starting UAT Test Sequence...');
  
  try {
    // 1. LOGIN
    console.log('\n--- Tahap 1: Login Kasir ---');
    const login = await request('/api/auth/login', 'POST', { pin: '0000', outletId: 'demo-outlet' });
    assert(login.status === 200 && login.data.success, 'Login failed');
    const token = login.data.token;
    const userId = login.data.user.id;
    console.log('✅ Kasir berhasil login, Token:', token.substring(0, 15) + '...');

    // 2. START SHIFT
    console.log('\n--- Tahap 1: Buka Shift ---');
    let shift = await request('/api/shifts/start', 'POST', { outletId: 'demo-outlet', userId: userId, startCash: 500000 }, token);
    let shiftId = null;
    if (shift.status === 400 && shift.data.shiftId) {
      shiftId = shift.data.shiftId;
    } else {
      assert(shift.status === 200 || shift.status === 201, 'Shift start failed');
      shiftId = shift.data.shift ? shift.data.shift.id : null;
    }
    console.log('✅ Shift aktif, ID:', shiftId);

    // 3. CREATE ORDER (POS -> KDS)
    console.log('\n--- Tahap 1: Kasir Membuat Pesanan ---');
    const orderData = {
      tenantId: 'demo-tenant',
      outletId: 'demo-outlet',
      userId: userId,
      shiftId: shiftId,
      orderType: 'dine-in',
      tableNumber: 'UAT-1',
      paymentMethod: 'tunai',
      subtotal: 55000,
      discount: 0,
      tax: 6050,
      serviceCharge: 2750,
      total: 63800,
      payments: [{ method: 'tunai', amount: 65000, change: 1200 }],
      items: [{ productId: '1', productName: 'Ayam Bakar UAT', quantity: 1, unitPrice: 55000, subtotal: 55000, notes: 'UAT Note' }]
    };
    const order = await request('/api/orders', 'POST', orderData, token);
    assert(order.status === 201 && order.data.success, 'Order creation failed');
    const orderId = order.data.order.id;
    console.log('✅ Pesanan berhasil dibuat, Order ID:', orderId);

    // 4. CHECK KDS
    console.log('\n--- Tahap 2: KDS Memeriksa Pesanan Masuk ---');
    const kds = await request('/api/orders?tenantId=demo-tenant&outletId=demo-outlet&kitchenStatus=pending', 'GET', null, token);
    if (kds.status !== 200) console.error('KDS ERR:', kds);
    assert(kds.status === 200, 'KDS fetch failed');
    const foundInKds = kds.data.orders.find(o => o.id === orderId);
    assert(foundInKds, 'Order tidak muncul di KDS');
    console.log('✅ Pesanan muncul di KDS!');

    // 5. MARK ORDER READY IN KDS
    console.log('\n--- Tahap 2: Chef Menyelesaikan Pesanan ---');
    const complete = await request(`/api/orders/${orderId}/status`, 'PATCH', { status: 'completed' }, token);
    assert(complete.status === 200 && complete.data.success, 'Failed to complete order');
    console.log('✅ Status pesanan berhasil diubah menjadi completed tanpa error!');

    // 6. BACKOFFICE KPI CHECK
    console.log('\n--- Tahap 3: Backoffice Mengecek Laporan Penjualan ---');
    const kpi = await request('/api/dashboard/kpi?tenantId=demo-tenant&outletId=demo-outlet&date=' + new Date().toISOString().split('T')[0], 'GET', null, token);
    if (kpi.status !== 200) console.error('KPI ERR:', kpi);
    assert(kpi.status === 200 && kpi.data.success, 'KPI fetch failed');
    console.log(`✅ Laporan ter-update. Gross Revenue: Rp ${kpi.data.data.grossRevenue.toLocaleString()}`);

    // 7. GET MENU CATEGORY
    console.log('\n--- Tahap 4: Backoffice Menyiapkan Kategori Menu Baru ---');
    const menu = await request('/api/menu/outlet/demo-outlet', 'GET', null, token);
    assert(menu.status === 200 && menu.data.success, 'Menu fetch failed');
    const categoryId = menu.data.data.categories[0].id;
    console.log('✅ Kategori ditemukan:', categoryId);

    // 8. CREATE NEW PRODUCT
    console.log('\n--- Tahap 4: Backoffice Membuat Menu Baru ---');
    const newProd = {
      tenantId: 'demo-tenant',
      categoryId: categoryId,
      name: 'Nasi Goreng UAT ' + Math.floor(Math.random()*1000),
      price: 45000,
      description: 'Menu uji coba otomatis',
      hasModifiers: false
    };
    const prodRes = await request('/api/products', 'POST', newProd, token);
    assert(prodRes.status === 201 && prodRes.data.success, 'Product creation failed');
    const prodId = prodRes.data.product.id;
    console.log(`✅ Menu Baru "${newProd.name}" berhasil dibuat! ID:`, prodId);

    // 9. CHECK IF NEW PRODUCT IS IN POS MENU
    console.log('\n--- Tahap 4: Verifikasi Menu Baru di POS ---');
    const posMenu = await request('/api/menu/outlet/demo-outlet', 'GET', null, token);
    const foundProd = posMenu.data.data.items.find(i => i.id === prodId);
    assert(foundProd, 'Menu baru tidak muncul di POS');
    console.log('✅ Menu baru sudah tersedia di POS terminal!');

    // 10. ORDER NEW PRODUCT
    console.log('\n--- Tahap 5: Kasir Memesan Menu Baru ---');
    orderData.items = [{ productId: prodId, productName: newProd.name, quantity: 2, unitPrice: 45000, subtotal: 90000 }];
    orderData.subtotal = 90000;
    orderData.tax = 9900;
    orderData.serviceCharge = 4500;
    orderData.total = 104400;
    orderData.payments = [{ method: 'qris', amount: 104400, change: 0 }];
    const order2 = await request('/api/orders', 'POST', orderData, token);
    assert(order2.status === 201, 'Failed to order new product');
    console.log('✅ Pesanan menu baru berhasil! Order ID:', order2.data.order.id);

    console.log('\n🎉🎉🎉 SEMUA UAT TEST BERHASIL TANPA ERROR! 🎉🎉🎉');
  } catch(e) {
    console.error('❌ UAT TEST GAGAL KARENA EXCEPTION:', e);
  }
}

runUAT();
