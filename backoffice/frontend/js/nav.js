// 
// NAVIGATION
// 
const PAGE_TITLES={
 dashboard:'Dashboard',
 'activity-logs':'Activity Logs',
 categories:'Kategori Menu',
 products:'Produk',
 modifiers:'Modifier Groups',
 'pos-general':'POS — Pengaturan Umum',
 'pos-payment':'POS — Metode Pembayaran',
 'pos-receipt':'POS — Pengaturan Struk',
 'kds-workflow':'KDS — Workflow Status',
 'kds-time':'KDS — Production Time',
 'kds-alerts':'KDS — Alert Settings',
 'kds-analytics':'KDS — Analytics',
 owners:'Owners',
 managers:'Managers',
 cashiers:'Kasir',
 outlets:'Outlets',
 costs:'Nashtycost (Biaya)',
 reports:'Laporan',
 'menu-engineering':'Menu Engineering Analytics',
 settings:'Pengaturan'
};

const PAGES={};
let curPage='dashboard';

async function nav(page,el){
 // Stop dashboard auto-refresh if navigating away from dashboard
 if (curPage === 'dashboard' && page !== 'dashboard') {
   if (typeof stopDashboardAutoRefresh === 'function') {
     stopDashboardAutoRefresh();
   }
 }
 
 // Stop reports auto-refresh if navigating away from reports
 if (curPage === 'reports' && page !== 'reports') {
   if (typeof stopReportsAutoRefresh === 'function') {
     stopReportsAutoRefresh();
   }
 }
 
 curPage=page;
 document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('act'));
 if(el)el.classList.add('act');
 document.getElementById('page-title').textContent=PAGE_TITLES[page]||page;
 document.getElementById('trail-cur').textContent=PAGE_TITLES[page]||page;
 document.getElementById('page-area').innerHTML='<div style="padding:40px;text-align:center;color:var(--txt3)">Memuat data...</div>';
 
 // Map hyphenated page names to camelCase function names
 const pageKey = page.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
 
 if(PAGES[pageKey] || PAGES[page]){
   try {
     document.getElementById('page-area').innerHTML = await (PAGES[pageKey] || PAGES[page])();
   } catch(e) {
     document.getElementById('page-area').innerHTML = '<div style="padding:40px;color:red">Error: ' + e.message + '</div>';
   }
 } else {
   document.getElementById('page-area').innerHTML = '<p>Coming soon</p>';
 }
 window.scrollTo&&window.scrollTo(0,0);
}
