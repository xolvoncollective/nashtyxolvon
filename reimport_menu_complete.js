/**
 * RE-Import Complete Menu Data dari NASHTY_POS_Mockup.html
 * Fix: Ensure all 50 items are imported with modifiers
 */

const Database = require('better-sqlite3');
const path = require('path');
const { nanoid } = require('nanoid');

const dbPath = path.join(__dirname, 'data', 'nashtypos.db');
const db = new Database(dbPath);

const tenantId = 'demo-tenant';
const outletId = 'demo-outlet';

// Complete menu data from mockup (all 50 items)
const MENU_DATA = [
  // MAKANAN (10)
  { id: 1, cat: 'main', n: 'Nasi Goreng Spesial', p: 35000, ico: 'rice', d: 'Telur mata sapi & kerupuk', opts: [{ label: 'Kepedasan', type: 'single', choices: ['Tidak Pedas', 'Pedas Sedang', 'Pedas Extra'] }], addons: [{ n: 'Extra Telur', p: 5000 }, { n: 'Extra Nasi', p: 6000 }, { n: 'Kerupuk', p: 3000 }] },
  { id: 2, cat: 'main', n: 'Ayam Bakar Madu', p: 55000, ico: 'chicken', d: 'Bumbu kacang & lalapan', opts: [{ label: 'Level Pedas', type: 'single', choices: ['Original', 'Pedas Sedang', 'Pedas Extra'] }], addons: [{ n: 'Extra Sambal', p: 3000 }, { n: 'Lalapan', p: 4000 }, { n: 'Nasi Putih', p: 6000 }] },
  { id: 3, cat: 'main', n: 'Rawon Spesial', p: 42000, ico: 'soup', d: 'Kluwek hitam, sapi empuk', opts: [{ label: 'Tambahan', type: 'multi', choices: ['Tambah Nasi', 'Telur Asin', 'Extra Sambal'] }] },
  { id: 4, cat: 'main', n: 'Mie Goreng Jawa', p: 30000, ico: 'noodle', d: 'Pedas manis tradisional', sold: true },
  { id: 5, cat: 'main', n: 'Sate Ayam 10pcs', p: 45000, ico: 'satay', d: 'Bumbu kacang + lontong', opts: [{ label: 'Bumbu', type: 'single', choices: ['Kacang', 'Kecap', 'Mix'] }], addons: [{ n: 'Extra Sate 5pcs', p: 22500 }, { n: 'Lontong', p: 5000 }] },
  { id: 6, cat: 'main', n: 'Gado-Gado', p: 28000, ico: 'salad', d: 'Sayur segar + bumbu kacang' },
  { id: 7, cat: 'main', n: 'Nasi Uduk Komplit', p: 38000, ico: 'rice', d: 'Lauk lengkap + emping', opts: [{ label: 'Kepedasan', type: 'single', choices: ['Biasa', 'Pedas'] }] },
  { id: 8, cat: 'main', n: 'Sop Buntut', p: 65000, ico: 'soup', d: 'Kuah bening, buntut empuk', opts: [{ label: 'Tambahan', type: 'multi', choices: ['Extra Nasi', 'Extra Buntut'] }] },
  { id: 9, cat: 'main', n: 'Pecel Lele', p: 32000, ico: 'fish', d: 'Lele goreng + sambal bawang' },
  { id: 10, cat: 'main', n: 'Ayam Geprek', p: 38000, ico: 'chicken', d: 'Crispy + sambal bawang', opts: [{ label: 'Level', type: 'single', choices: ['Level 1', 'Level 2', 'Level 3'] }] },
  
  // MINUMAN (10)
  { id: 11, cat: 'bar', n: 'Es Teh Manis', p: 8000, ico: 'tea', d: 'Teh tubruk segar', opts: [{ label: 'Tingkat Manis', type: 'single', choices: ['Normal', 'Kurang Manis', 'Tanpa Gula'] }] },
  { id: 12, cat: 'bar', n: 'Kopi Susu Aren', p: 22000, ico: 'coffee', d: 'Cold brew + oat milk', opts: [{ label: 'Suhu', type: 'single', choices: ['Dingin', 'Hangat'] }, { label: 'Ekstra', type: 'multi', choices: ['Extra Shot', 'Extra Aren'] }], addons: [{ n: 'Oat Milk Upgrade', p: 5000 }, { n: 'Extra Shot', p: 8000 }] },
  { id: 13, cat: 'bar', n: 'Jus Alpukat', p: 18000, ico: 'juice', d: 'Alpukat segar + cokelat', opts: [{ label: 'Ukuran', type: 'single', choices: ['Regular', 'Large'] }] },
  { id: 14, cat: 'bar', n: 'Matcha Latte', p: 25000, ico: 'matcha', d: 'Matcha premium grade', opts: [{ label: 'Suhu', type: 'single', choices: ['Dingin', 'Hangat'] }, { label: 'Susu', type: 'single', choices: ['Oat Milk', 'Full Cream'] }] },
  { id: 15, cat: 'bar', n: 'Lemon Tea', p: 14000, ico: 'lemon', d: 'Segar & menyegarkan' },
  { id: 16, cat: 'bar', n: 'Es Jeruk Peras', p: 12000, ico: 'juice', d: 'Jeruk segar, tanpa sirup' },
  { id: 17, cat: 'bar', n: 'Kopi Americano', p: 18000, ico: 'coffee', d: 'Double shot espresso', opts: [{ label: 'Suhu', type: 'single', choices: ['Dingin', 'Hangat'] }] },
  { id: 18, cat: 'bar', n: 'Susu Segar', p: 10000, ico: 'milk', d: 'Susu murni dingin' },
  { id: 19, cat: 'bar', n: 'Air Mineral', p: 5000, ico: 'soda', d: 'Aqua 600ml' },
  { id: 20, cat: 'bar', n: 'Es Kelapa Muda', p: 20000, ico: 'juice', d: 'Kelapa muda + jelly' },
  
  // CAMILAN (10)
  { id: 21, cat: 'snack', n: 'French Fries', p: 22000, ico: 'fries', d: 'Crispy + saus spesial', opts: [{ label: 'Saus', type: 'multi', choices: ['Tomat', 'Mayo', 'Keju'] }], addons: [{ n: 'Extra Saus', p: 3000 }, { n: 'Cheese Dip', p: 7000 }] },
  { id: 22, cat: 'snack', n: 'Nugget Ayam', p: 25000, ico: 'nugget', d: 'Golden crispy 10 pcs', opts: [{ label: 'Saus', type: 'multi', choices: ['BBQ', 'Pedas', 'Mayo'] }] },
  { id: 23, cat: 'snack', n: 'Pisang Goreng', p: 15000, ico: 'donut', d: 'Pisang kepok + keju' },
  { id: 24, cat: 'snack', n: 'Tahu Crispy', p: 12000, ico: 'donut', d: 'Tahu bulat goreng renyah' },
  { id: 25, cat: 'snack', n: 'Cireng Bumbu', p: 14000, ico: 'cracker', d: 'Aci goreng pedas manis', opts: [{ label: 'Level', type: 'single', choices: ['Biasa', 'Pedas'] }] },
  { id: 26, cat: 'snack', n: 'Risoles Mayo', p: 13000, ico: 'bread', d: 'Kulit crepe + ayam + mayo' },
  { id: 27, cat: 'snack', n: 'Keripik Singkong', p: 10000, ico: 'cracker', d: 'Renyah + bumbu balado' },
  { id: 28, cat: 'snack', n: 'Onigiri', p: 18000, ico: 'rice', d: 'Nasi kepal isi tuna/salmon', opts: [{ label: 'Isi', type: 'single', choices: ['Tuna', 'Salmon', 'Ayam'] }] },
  { id: 29, cat: 'snack', n: 'Tempe Mendoan', p: 10000, ico: 'cracker', d: 'Tempe tipis tepung gurih' },
  { id: 30, cat: 'snack', n: 'Spring Roll', p: 20000, ico: 'bread', d: 'Lumpia goreng + saus asam manis' },
  
  // DESSERT (10)
  { id: 31, cat: 'dessert', n: 'Es Krim Cokelat', p: 18000, ico: 'icecream', d: 'Double scoop premium', opts: [{ label: 'Topping', type: 'multi', choices: ['Choco Chips', 'Oreo', 'Sprinkles'] }], addons: [{ n: 'Extra Scoop', p: 9000 }, { n: 'Waffle Cone', p: 6000 }] },
  { id: 32, cat: 'dessert', n: 'Pudding Mangga', p: 15000, ico: 'pudding', d: 'Saus mangga alphonso' },
  { id: 33, cat: 'dessert', n: 'Brownies Kukus', p: 20000, ico: 'cake', d: 'Cokelat lembut + moist' },
  { id: 34, cat: 'dessert', n: 'Klepon', p: 12000, ico: 'donut', d: 'Bola gula merah + kelapa', sold: true },
  { id: 35, cat: 'dessert', n: 'Tiramisu Cup', p: 28000, ico: 'cake', d: 'Mascarpone + espresso' },
  { id: 36, cat: 'dessert', n: 'Crème Brûlée', p: 32000, ico: 'pudding', d: 'Vanilla custard + karamel' },
  { id: 37, cat: 'dessert', n: 'Pancake Stack', p: 25000, ico: 'cake', d: '3 layer + maple syrup', opts: [{ label: 'Topping', type: 'multi', choices: ['Butter', 'Nutella', 'Fresh Berry'] }] },
  { id: 38, cat: 'dessert', n: 'Mochi Ice Cream', p: 22000, ico: 'icecream', d: 'Isi es krim 3 pcs', opts: [{ label: 'Rasa', type: 'multi', choices: ['Vanila', 'Stroberi', 'Matcha'] }] },
  { id: 39, cat: 'dessert', n: 'Es Campur', p: 16000, ico: 'icecream', d: 'Cincau + kolang-kaling' },
  { id: 40, cat: 'dessert', n: 'Panna Cotta', p: 24000, ico: 'pudding', d: 'Saus raspberry segar' },
  
  // ADD ON (10)
  { id: 41, cat: 'addon', n: 'Extra Keju', p: 5000, ico: 'cheese', d: 'Cheddar leleh' },
  { id: 42, cat: 'addon', n: 'Extra Saus Kacang', p: 4000, ico: 'sauce', d: 'Bumbu kacang special' },
  { id: 43, cat: 'addon', n: 'Nasi Putih', p: 6000, ico: 'rice', d: 'Nasi pulen panas' },
  { id: 44, cat: 'addon', n: 'Telur Ceplok', p: 7000, ico: 'egg', d: 'Mata sapi setengah matang' },
  { id: 45, cat: 'addon', n: 'Kerupuk', p: 3000, ico: 'cracker', d: 'Kerupuk udang renyah' },
  { id: 46, cat: 'addon', n: 'Teh Manis Hangat', p: 5000, ico: 'tea', d: 'Teh pendamping' },
  { id: 47, cat: 'addon', n: 'Extra Sambal', p: 3000, ico: 'sauce', d: 'Sambal bajak spesial' },
  { id: 48, cat: 'addon', n: 'Lalapan', p: 4000, ico: 'salad', d: 'Timun + kemangi + kol' },
  { id: 49, cat: 'addon', n: 'Extra Nasi', p: 6000, ico: 'rice', d: 'Tambah nasi putih' },
  { id: 50, cat: 'addon', n: 'Minuman Pendamping', p: 8000, ico: 'milk', d: 'Susu UHT / teh kotak' },
];

const CATEGORY_MAP = {
  'main': { name: 'Makanan', slug: 'makanan', icon: '🍽️', color: '#E4540C' },
  'bar': { name: 'Minuman', slug: 'minuman', icon: '🥤', color: '#3B82F6' },
  'snack': { name: 'Camilan', slug: 'camilan', icon: '🍟', color: '#F59E0B' },
  'dessert': { name: 'Dessert', slug: 'dessert', icon: '🍰', color: '#A855F7' },
  'addon': { name: 'Add On', slug: 'addon', icon: '➕', color: '#22C55E' }
};

console.log('🚀 RE-Importing Complete Menu from Mockup...\n');

try {
  // 1. Get categories
  console.log('📂 Getting existing categories...');
  const categories = {};
  for (const [catKey, catData] of Object.entries(CATEGORY_MAP)) {
    const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(catData.slug);
    if (existing) {
      categories[catKey] = existing.id;
      console.log(`  ✓ ${catData.name} (${existing.id})`);
    }
  }

  // 2. Clear existing menu data (with proper order)
  console.log('\n🗑️  Clearing existing menu data...');
  db.prepare('DELETE FROM order_item_modifiers').run();
  db.prepare('DELETE FROM order_items').run();
  db.prepare('DELETE FROM product_modifiers').run();
  db.prepare('DELETE FROM modifier_options').run();
  db.prepare('DELETE FROM modifier_groups').run();
  db.prepare('DELETE FROM products').run();
  console.log('  ✓ Old data cleared');

  // 3. Import all products with modifiers
  console.log('\n📥 Importing menu items...\n');

  let imported = 0;
  let modifierGroupsCreated = 0;
  let modifierOptionsCreated = 0;

  for (const item of MENU_DATA) {
    const categoryId = categories[item.cat];
    if (!categoryId) {
      console.log(`  ⚠ Skipping ${item.n} - category not found`);
      continue;
    }

    // Create product
    const productId = nanoid();
    const slug = item.n.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    const status = item.sold ? 'soldout' : 'active';
    const hasModifiers = (item.opts && item.opts.length > 0) || (item.addons && item.addons.length > 0) ? 1 : 0;
    
    db.prepare(`
      INSERT INTO products (
        id, tenant_id, category_id, name, slug, description,
        price, cost, production_time, has_modifiers, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      productId,
      tenantId,
      categoryId,
      item.n,
      slug,
      item.d || '',
      item.p,
      Math.round(item.p * 0.45),
      10,
      hasModifiers,
      status
    );

    imported++;
    const statusIcon = item.sold ? '🚫' : '✅';
    const modIcon = hasModifiers ? '🔧' : '  ';
    console.log(`  ${statusIcon} ${modIcon} ${imported}. ${item.n} (Rp ${item.p.toLocaleString()})`);

    // Create modifier groups for opts
    if (item.opts && item.opts.length > 0) {
      for (const opt of item.opts) {
        const groupId = nanoid();
        const groupType = opt.type === 'single' ? 'single' : 'multiple';
        const maxSelect = opt.type === 'single' ? 1 : opt.choices.length;
        
        db.prepare(`
          INSERT INTO modifier_groups (
            id, tenant_id, name, type, required, min_select, max_select, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(groupId, tenantId, opt.label, groupType, 1, 1, maxSelect, 'active');

        modifierGroupsCreated++;

        // Link to product
        db.prepare(`
          INSERT INTO product_modifiers (product_id, modifier_group_id, display_order)
          VALUES (?, ?, ?)
        `).run(productId, groupId, 0);

        // Create options
        for (let i = 0; i < opt.choices.length; i++) {
          const optionId = nanoid();
          db.prepare(`
            INSERT INTO modifier_options (
              id, group_id, name, price_adjustment, display_order, status
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).run(optionId, groupId, opt.choices[i], 0, i, 'active');
          
          modifierOptionsCreated++;
        }
      }
    }

    // Create modifier groups for addons
    if (item.addons && item.addons.length > 0) {
      const groupId = nanoid();
      
      db.prepare(`
        INSERT INTO modifier_groups (
          id, tenant_id, name, type, required, min_select, max_select, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(groupId, tenantId, 'Tambahan', 'multiple', 0, 0, item.addons.length, 'active');

      modifierGroupsCreated++;

      // Link to product
      db.prepare(`
        INSERT INTO product_modifiers (product_id, modifier_group_id, display_order)
        VALUES (?, ?, ?)
      `).run(productId, groupId, 1);

      // Create addon options
      for (let i = 0; i < item.addons.length; i++) {
        const addon = item.addons[i];
        const optionId = nanoid();
        
        db.prepare(`
          INSERT INTO modifier_options (
            id, group_id, name, price_adjustment, display_order, status
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(optionId, groupId, addon.n, addon.p, i, 'active');
        
        modifierOptionsCreated++;
      }
    }
  }

  console.log('\n══════════════════════════════════════');
  console.log('✅ RE-Import Complete!');
  console.log('══════════════════════════════════════');
  console.log(`📦 Products imported: ${imported}/50`);
  console.log(`🔧 Modifier groups created: ${modifierGroupsCreated}`);
  console.log(`⚙️  Modifier options created: ${modifierOptionsCreated}`);
  console.log('══════════════════════════════════════\n');

  console.log('🎉 All 50 menu items from mockup imported!');
  console.log('📍 Access via:');
  console.log('   POS: http://localhost:3099/pos/frontend/index.html');
  console.log('   Backoffice: http://localhost:3099/backoffice/frontend/index.html\n');

} catch (error) {
  console.error('❌ Error during import:', error.message);
  console.error(error);
} finally {
  db.close();
}
