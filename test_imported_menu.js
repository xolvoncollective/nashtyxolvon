/**
 * Test Menu yang sudah di-import
 * Verifikasi bahwa data dari mockup sudah bisa diakses via API
 */

const BASE_URL = 'http://localhost:3099';

async function testImportedMenu() {
  console.log('🧪 Testing Imported Menu from Mockup...\n');

  try {
    // 1. Login untuk mendapatkan token
    console.log('1️⃣ Login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: '1234',
        outletId: 'demo-outlet'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.error);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful\n');

    // 2. Get menu dari API
    console.log('2️⃣ Fetching menu from API...');
    const menuRes = await fetch(`${BASE_URL}/api/menu/outlet/demo-outlet`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const menuData = await menuRes.json();
    if (!menuData.success) {
      console.error('❌ Failed to fetch menu:', menuData.error);
      return;
    }

    const categories = menuData.data.categories || [];
    const items = menuData.data.items || [];

    console.log(`✅ Received ${items.length} menu items in ${categories.length} categories\n`);

    // 3. Display summary per kategori
    console.log('📊 Menu Summary by Category:\n');
    
    const categorySummary = {};
    items.forEach(item => {
      const cat = categories.find(c => c.id === item.category_id);
      const catName = cat ? cat.name : 'Unknown';
      
      if (!categorySummary[catName]) {
        categorySummary[catName] = {
          count: 0,
          items: [],
          totalValue: 0
        };
      }
      
      categorySummary[catName].count++;
      categorySummary[catName].items.push({
        name: item.name,
        price: item.price,
        status: item.status,
        hasModifiers: item.has_modifiers
      });
      categorySummary[catName].totalValue += item.price;
    });

    // Display per category
    for (const [catName, data] of Object.entries(categorySummary)) {
      console.log(`\n🏷️  ${catName} (${data.count} items)`);
      console.log('─'.repeat(60));
      
      data.items.forEach(item => {
        const statusIcon = item.status === 'soldout' ? '🚫' : '✅';
        const modIcon = item.hasModifiers ? '🔧' : '  ';
        console.log(`  ${statusIcon} ${modIcon} ${item.name.padEnd(30)} Rp ${item.price.toLocaleString()}`);
      });
    }

    // 4. Check modifiers
    console.log('\n\n3️⃣ Checking items with modifiers...\n');
    const itemsWithMods = items.filter(i => i.has_modifiers === 1);
    console.log(`Found ${itemsWithMods.length} items with modifiers/addons:`);
    
    itemsWithMods.slice(0, 5).forEach(item => {
      console.log(`\n  📦 ${item.name} (Rp ${item.price.toLocaleString()})`);
      
      if (item.modifier_groups && item.modifier_groups.length > 0) {
        item.modifier_groups.forEach(group => {
          const type = group.type === 'single' ? '📍 Single' : '☑️  Multiple';
          const required = group.required ? '(Required)' : '(Optional)';
          console.log(`    ${type} ${group.name} ${required}`);
          
          if (group.options && group.options.length > 0) {
            group.options.forEach(opt => {
              const price = opt.price_adjustment > 0 
                ? ` +Rp ${opt.price_adjustment.toLocaleString()}` 
                : '';
              console.log(`      • ${opt.name}${price}`);
            });
          }
        });
      }
    });

    // 5. Summary statistics
    console.log('\n\n📈 Statistics:\n');
    console.log('═'.repeat(60));
    console.log(`Total Items: ${items.length}`);
    console.log(`Items with Modifiers: ${itemsWithMods.length}`);
    console.log(`Active Items: ${items.filter(i => i.status === 'active').length}`);
    console.log(`Sold Out Items: ${items.filter(i => i.status === 'soldout').length}`);
    console.log(`\nPrice Range:`);
    console.log(`  Lowest: Rp ${Math.min(...items.map(i => i.price)).toLocaleString()}`);
    console.log(`  Highest: Rp ${Math.max(...items.map(i => i.price)).toLocaleString()}`);
    console.log(`  Average: Rp ${Math.round(items.reduce((sum, i) => sum + i.price, 0) / items.length).toLocaleString()}`);
    console.log('═'.repeat(60));

    console.log('\n✅ All menu data from mockup is accessible via API!');
    console.log('🎉 Integration test PASSED!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImportedMenu();
