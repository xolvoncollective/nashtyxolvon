// 
// NAVIGATION
// 
const PAGE_TITLES={
 dashboard:'Dashboard',categories:'Kategori Menu',products:'Produk',
 modifiers:'Modifier Groups','pos-general':'POS — Pengaturan Umum',
 'pos-payment':'POS — Metode Pembayaran','pos-receipt':'POS — Pengaturan Struk',
 'kds-workflow':'KDS — Workflow Status','kds-time':'KDS — Production Time',
 'kds-alerts':'KDS — Alert Settings','kds-analytics':'KDS — Analytics',
 owners:'Owners',managers:'Managers',cashiers:'Kasir',
 outlets:'Outlets',reports:'Laporan','menu-engineering':'Menu Engineering Analytics',settings:'Pengaturan',actlogs:'Activity Logs'
};

const PAGES={};
let curPage='dashboard';

async function nav(page,el){
 curPage=page;
 document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('act'));
 if(el)el.classList.add('act');
 document.getElementById('page-title').textContent=PAGE_TITLES[page]||page;
 document.getElementById('trail-cur').textContent=PAGE_TITLES[page]||page;
 document.getElementById('page-area').innerHTML='<div style="padding:40px;text-align:center;color:var(--txt3)">Memuat data...</div>';
 
 if(PAGES[page]){
   try {
     document.getElementById('page-area').innerHTML = await PAGES[page]();
   } catch(e) {
     document.getElementById('page-area').innerHTML = '<div style="padding:40px;color:red">Error: ' + e.message + '</div>';
   }
 } else {
   document.getElementById('page-area').innerHTML = '<p>Coming soon</p>';
 }
 window.scrollTo&&window.scrollTo(0,0);
}
