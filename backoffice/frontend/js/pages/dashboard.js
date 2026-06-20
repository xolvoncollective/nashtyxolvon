// DASHBOARD WITH CHART.JS
const frS = n => 'Rp ' + (n || 0).toLocaleString('id-ID');

let revenueChart = null;
let orderTypeChart = null;
let productChart = null;

PAGES.dashboard = async () => {
  let kpi = { 
    totalOrders: 0, 
    netRevenue: 0, 
    averageOrderValue: 0, 
    growth: 0, 
    topProducts: [], 
    salesByType: [],
    totalCosts: 0,
    grossProfit: 0
  };
  let chartData = [];

  if (window.API) {
    if (!API.session.tenantId) API.session.tenantId = '00000000-0000-0000-0000-000000000001';
    try {
      const kpiParams = 'tenantId=' + API.session.tenantId + (API.session.outletId ? '&outletId=' + API.session.outletId : '');
      const kpiRes = await API.request('/dashboard/kpi?' + kpiParams);
      if (kpiRes.success && kpiRes.data) kpi = kpiRes.data;

      const chartRes = await API.request('/dashboard/weekly-chart?' + kpiParams);
      if (chartRes.success && chartRes.data) chartData = chartRes.data;
    } catch (e) {
      console.error('Failed fetching dashboard data', e);
    }
  }

  const topProds = kpi.topProducts || [];
  const byType = kpi.salesByType || [];

  const types = {
    'dine-in': { lbl: 'Dine In', col: '#22C55E' },
    'takeaway': { lbl: 'Take Away', col: '#F59E0B' },
    'gofood': { lbl: 'GoFood', col: '#E3175B' },
    'grabfood': { lbl: 'GrabFood', col: '#00B14F' },
    'shopeefood': { lbl: 'ShopeeFood', col: '#EE4D2D' }
  };

  const totalTypeSales = byType.reduce((sum, t) => sum + t.total_sales, 0) || 1;
  const growthVal = kpi.growth || 0;

  // Prepare chart data
  const revenueChartData = {
    labels: chartData.map(d => d.dayName || ''),
    datasets: [{
      label: 'Pendapatan',
      data: chartData.map(d => d.revenue || 0),
      backgroundColor: 'rgba(228, 84, 12, 0.15)',
      borderColor: '#E4540C',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#E4540C',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }]
  };

  const orderTypeChartData = {
    labels: byType.map(t => types[t.order_type]?.lbl || t.order_type),
    datasets: [{
      data: byType.map(t => t.total_sales || 0),
      backgroundColor: byType.map(t => types[t.order_type]?.col || '#999'),
      borderWidth: 0
    }]
  };

  const productChartData = {
    labels: topProds.slice(0, 5).map(p => p.name || ''),
    datasets: [{
      label: 'Jumlah Terjual',
      data: topProds.slice(0, 5).map(p => p.qty || 0),
      backgroundColor: [
        'rgba(228, 84, 12, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  const html = `
<div class="ph" style="display:flex; justify-content:space-between; align-items:center;">
  <div>
    <div class="ph-title">Dashboard Analytics</div>
    <div class="ph-sub">${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <button class="btn" style="padding:6px 12px;font-size:12px" onclick="nav('dashboard')">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
    </svg>
    Refresh
  </button>
</div>

<div class="kpi-grid">
  <div class="kpi" style="--kc:var(--or)">
    <div class="kpi-lbl">Pendapatan Hari Ini</div>
    <div class="kpi-val">${frS(kpi.netRevenue || 0)}</div>
    <div class="kpi-sub">${kpi.totalOrders || 0} transaksi</div>
    <div class="kpi-delta ${growthVal >= 0 ? 'delta-up' : 'delta-dn'}">
      ${growthVal >= 0 ? '↑' : '↓'} ${Math.abs(growthVal).toFixed(1)}% vs kemarin
    </div>
  </div>
  
  <div class="kpi" style="--kc:#EF4444">
    <div class="kpi-lbl">Pengeluaran Hari Ini</div>
    <div class="kpi-val">${frS(kpi.totalCosts || 0)}</div>
    <div class="kpi-sub">Biaya operasional</div>
  </div>
  
  <div class="kpi" style="--kc:var(--gn)">
    <div class="kpi-lbl">Laba Kotor Hari Ini</div>
    <div class="kpi-val">${frS(kpi.grossProfit || 0)}</div>
    <div class="kpi-sub">Pendapatan - Pengeluaran</div>
  </div>
  
  <div class="kpi" style="--kc:#3B82F6">
    <div class="kpi-lbl">Rata-rata Transaksi</div>
    <div class="kpi-val">${frS(kpi.averageOrderValue || 0)}</div>
    <div class="kpi-sub">Per order</div>
  </div>
</div>

<div class="two-col mt-3">
  <div class="card">
    <div class="card-h">
      <div>
        <div class="card-t">Pendapatan Mingguan</div>
        <div class="card-sub">7 hari terakhir</div>
      </div>
      <div class="badge badge-orange">Minggu Ini</div>
    </div>
    <div class="card-b">
      <canvas id="revenueChart" height="250"></canvas>
    </div>
  </div>

  <div class="card">
    <div class="card-h">
      <div class="card-t">Penjualan per Tipe Order</div>
      <div class="card-sub">Distribusi order hari ini</div>
    </div>
    <div class="card-b">
      <canvas id="orderTypeChart" height="250"></canvas>
    </div>
  </div>
</div>

<div class="card mt-3">
  <div class="card-h">
    <div class="card-t">Top 5 Produk Terlaris</div>
    <div class="card-sub">Semua waktu</div>
  </div>
  <div class="card-b">
    <canvas id="productChart" height="300"></canvas>
  </div>
</div>

<div class="two-col mt-3">
  <div class="card">
    <div class="card-h">
      <div class="card-t">Top Produk Detail</div>
    </div>
    <div class="card-b p-0">
      ${topProds.length === 0 ? `
        <div style="padding:40px 20px;text-align:center;color:var(--txt3)">
          <div style="font-size:32px;margin-bottom:12px">📊</div>
          <div>Belum ada data penjualan</div>
        </div>
      ` : `
        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${topProds.slice(0, 10).map(p => `
              <tr>
                <td class="bold">${p.name || '-'}</td>
                <td>${p.qty || 0}</td>
                <td class="mono">${frS(p.total || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
  </div>

  <div class="card">
    <div class="card-h">
      <div class="card-t">Quick Actions</div>
    </div>
    <div class="card-b" style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-primary" style="justify-content:center" onclick="nav('products',null)">
        ${ico('plus')} Tambah Produk
      </button>
      <button class="btn" style="justify-content:center" onclick="nav('categories',null)">
        ${ico('plus')} Tambah Kategori
      </button>
      <button class="btn" style="justify-content:center" onclick="nav('users',null)">
        ${ico('plus')} Tambah User
      </button>
    </div>
  </div>
</div>
  `;

  // Render first, then initialize charts
  setTimeout(() => {
    initializeCharts(revenueChartData, orderTypeChartData, productChartData);
  }, 100);

  return html;
};

function initializeCharts(revenueData, orderTypeData, productData) {
  // Destroy existing charts
  if (revenueChart) revenueChart.destroy();
  if (orderTypeChart) orderTypeChart.destroy();
  if (productChart) productChart.destroy();

  // Revenue Line Chart
  const revenueCtx = document.getElementById('revenueChart');
  if (revenueCtx) {
    revenueChart = new Chart(revenueCtx, {
      type: 'line',
      data: revenueData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context) => `Rp ${context.parsed.y.toLocaleString('id-ID')}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `Rp ${(value / 1000).toFixed(0)}k`,
              color: '#9A9590'
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            ticks: { color: '#9A9590' },
            grid: { display: false }
          }
        }
      }
    });
  }

  // Order Type Doughnut Chart
  const orderTypeCtx = document.getElementById('orderTypeChart');
  if (orderTypeCtx && orderTypeData.datasets[0].data.length > 0) {
    orderTypeChart = new Chart(orderTypeCtx, {
      type: 'doughnut',
      data: orderTypeData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Product Bar Chart
  const productCtx = document.getElementById('productChart');
  if (productCtx && productData.datasets[0].data.length > 0) {
    productChart = new Chart(productCtx, {
      type: 'bar',
      data: productData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.x} item terjual`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: '#9A9590' },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          y: {
            ticks: { color: '#9A9590' },
            grid: { display: false }
          }
        }
      }
    });
  }
}

 <div class="tbl-wrap">
 <table>
 <thead><tr><th>#</th><th>Produk</th><th>Qty</th><th>Revenue</th></tr></thead>
 <tbody>
 ${topProds.length ? topProds.map((p, i) => `
 <tr>
 <td><span style="width:22px;height:22px;border-radius:50%;background:${i < 3 ? ['#F59E0B', '#9CA3AF', '#CD7C3F'][i] : 'var(--sf3)'};color:${i < 3 ? '#fff' : 'var(--txt3)'};font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center">${i + 1}</span></td>
 <td class="bold">${p.product_name}</td>
 <td>${p.total_qty}</td>
 <td class="mono">${frS(p.total_sales)}</td>
 </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:20px;color:#999">Belum ada penjualan</td></tr>'}
 </tbody>
 </table>
 </div>
 </div>

 <div style="display:flex;flex-direction:column;gap:18px">
 <div class="card">
 <div class="card-h">
 <div class="card-t">Penjualan Berdasarkan Tipe</div>
 <span class="card-sub">Semua Waktu</span>
 </div>
 <div class="card-b" style="display:flex;flex-direction:column;gap:9px">
 ${byType.length ? byType.map(t => {
   const ty = types[t.order_type] || { lbl: t.order_type, col: '#888' };
   const pct = Math.round((t.total_sales / totalTypeSales) * 100);
   return `
 <div>
 <div style="display:flex;justify-content:space-between;margin-bottom:3px">
 <span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px">
 <span style="width:8px;height:8px;border-radius:50%;background:${ty.col};display:inline-block"></span>${ty.lbl}
 </span>
 <span style="font-size:12px;font-family:var(--mo)">${frS(t.total_sales)}</span>
 </div>
 <div style="height:5px;background:var(--sf3);border-radius:3px;overflow:hidden">
 <div style="height:100%;width:${pct}%;background:${ty.col};border-radius:3px"></div>
 </div>
 </div>`;
 }).join('') : '<div style="text-align:center;padding:15px;color:#999;font-size:13px">Belum ada data</div>'}
 </div>
 </div>

 </div>
</div>`;
};
