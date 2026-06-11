// 
// MOCK DATA
// 
const CATEGORIES=[
 {id:1,name:'Makanan',desc:'Menu makanan utama',order:1,active:true,products:10},
 {id:2,name:'Minuman',desc:'Minuman panas dan dingin',order:2,active:true,products:10},
 {id:3,name:'Camilan',desc:'Snack dan gorengan',order:3,active:true,products:10},
 {id:4,name:'Dessert',desc:'Penutup dan minuman manis',order:4,active:true,products:10},
 {id:5,name:'Add On',desc:'Tambahan berbayar',order:5,active:true,products:10},
];
const PRODUCTS=[
 {id:1,name:'Ayam Bakar Madu',cat:'Makanan',price:55000,desc:'Bumbu kacang & lalapan',active:true,img:''},
 {id:2,name:'Nasi Goreng Spesial',cat:'Makanan',price:35000,desc:'Telur mata sapi & kerupuk',active:true,img:''},
 {id:3,name:'Rawon Spesial',cat:'Makanan',price:42000,desc:'Kluwek hitam, sapi empuk',active:true,img:''},
 {id:4,name:'Sop Buntut',cat:'Makanan',price:65000,desc:'Kuah bening, buntut empuk',active:true,img:''},
 {id:5,name:'Kopi Susu Aren',cat:'Minuman',price:22000,desc:'Cold brew + oat milk',active:true,img:''},
 {id:6,name:'Es Teh Manis',cat:'Minuman',price:8000,desc:'Teh tubruk segar',active:true,img:''},
 {id:7,name:'French Fries',cat:'Camilan',price:22000,desc:'Crispy + saus spesial',active:true,img:''},
 {id:8,name:'Es Krim Cokelat',cat:'Dessert',price:18000,desc:'Double scoop premium',active:true,img:''},
 {id:9,name:'Nasi Putih',cat:'Add On',price:6000,desc:'Nasi putih per porsi',active:true,img:''},
 {id:10,name:'Ayam Geprek',cat:'Makanan',price:38000,desc:'Crispy + sambal bawang',active:false,img:''},
];
const MODIFIERS=[
 {id:1,name:'Level Pedas',required:true,type:'single',min:1,max:1,items:['Original','Pedas Sedang','Pedas Extra'],order:1},
 {id:2,name:'Variasi Add-on',required:false,type:'multi',min:0,max:3,items:['Extra Sambal (+3k)','Lalapan (+4k)','Nasi Putih (+6k)'],order:2},
 {id:3,name:'Suhu Minuman',required:true,type:'single',min:1,max:1,items:['Dingin','Hangat'],order:3},
 {id:4,name:'Bumbu Sate',required:true,type:'single',min:1,max:1,items:['Kacang','Kecap','Mix'],order:4},
];
const CASHIERS=[
 {id:1,name:'Citra Dewi',phone:'081234567890',email:'citra@nashty.id',pin:'1234',outlet:'Galaxy Mall',active:true,txToday:42},
 {id:2,name:'Budi Santoso',phone:'082345678901',email:'',pin:'2345',outlet:'Galaxy Mall',active:true,txToday:38},
 {id:3,name:'Ani Rahayu',phone:'083456789012',email:'',pin:'3456',outlet:'Galaxy Mall',active:true,txToday:31},
 {id:4,name:'Dika Pratama',phone:'084567890123',email:'dika@nashty.id',pin:'4567',outlet:'Summarecon',active:false,txToday:0},
];
const MANAGERS=[
 {id:1,name:'Ahmad Fauzi',email:'ahmad@nashty.id',phone:'081122334455',outlet:'Galaxy Mall',active:true},
 {id:2,name:'Siti Rahmawati',email:'siti@nashty.id',phone:'082233445566',outlet:'Summarecon',active:true},
];
const OWNERS=[
 {id:1,name:'Bagoes Widhiatama',email:'bagoes@nashty.id',phone:'081111222233',role:'Owner'},
];
const OUTLETS=[
 {id:1,name:'Galaxy Mall',address:'Jl. Galaxy Raya No.1',city:'Surabaya',phone:'0318123456',status:'open',revenue:4280000},
 {id:2,name:'Summarecon',address:'Jl. Scientia Boulevard',city:'Tangerang',phone:'02187654321',status:'open',revenue:3120000},
 {id:3,name:'Pakuwon City',address:'Jl. Kuti Anyar',city:'Surabaya',phone:'0318765432',status:'maintenance',revenue:0},
];
const LOGS=[
 {user:'Ahmad Fauzi',action:'Harga produk diubah',module:'Produk',detail:'Ayam Bakar Madu: Rp 50.000 → Rp 55.000',time:'2025-06-03 14:32:01',color:'#F59E0B'},
 {user:'Bagoes Widhiatama',action:'Kasir ditambahkan',module:'Tim',detail:'Citra Dewi — Galaxy Mall',time:'2025-06-03 13:15:44',color:'#22C55E'},
 {user:'Citra Dewi',action:'Void transaksi',module:'POS',detail:'SNY-0184 — Rp 112.520 (Salah input)',time:'2025-06-03 12:08:22',color:'#EF4444'},
 {user:'Ahmad Fauzi',action:'Produk dinonaktifkan',module:'Produk',detail:'Ayam Geprek',time:'2025-06-03 11:50:10',color:'#6B7280'},
 {user:'Bagoes Widhiatama',action:'Metode bayar diubah',module:'POS',detail:'Transfer diaktifkan',time:'2025-06-03 10:22:05',color:'#3B82F6'},
 {user:'Siti Rahmawati',action:'Kategori ditambahkan',module:'Menu',detail:'Add On',time:'2025-06-02 16:44:30',color:'#22C55E'},
 {user:'Ahmad Fauzi',action:'Modifier group dibuat',module:'Menu',detail:'Variasi Add-on',time:'2025-06-02 15:12:18',color:'#22C55E'},
 {user:'Budi Santoso',action:'Refund diproses',module:'POS',detail:'SNY-0181 — Rp 96.280',time:'2025-06-02 13:05:42',color:'#EF4444'},
];
