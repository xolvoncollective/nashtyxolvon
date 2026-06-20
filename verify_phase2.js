const sqlite3 = require('better-sqlite3');
const db = sqlite3('data/nashtypos.db');

async function run() {
  db.prepare("DELETE FROM products WHERE id LIKE 'prod-test-%'").run();
  db.prepare("DELETE FROM categories WHERE id = 'cat-test-1'").run();

  console.log("--- C1: Inactive Categories ---");
  // Create category
  db.prepare(`INSERT INTO categories (id, tenant_id, name, slug, status) VALUES (?, ?, ?, ?, ?)`).run('cat-test-1', 'demo-tenant', 'Test Cat', 'test-cat', 'inactive');
  
  // Fetch from API
  const resC1 = await fetch('https://nashty-backoffice-backend-production.up.railway.app/api/categories?tenantId=demo-tenant');
  const dataC1 = await resC1.json();
  const foundCat = (dataC1.categories || []).find(c => c.id === 'cat-test-1');
  if (foundCat) {
    console.log("C1 PASS: Inactive category is still returned in API (not disappeared). Status:", foundCat.status);
  } else {
    console.log("C1 FAILED: Inactive category disappeared entirely from API.");
  }

  console.log("--- D1: Deleted Products Reappear ---");
  console.log("--- D2: Delete vs Disable ---");
  // Check if deleted_at works
  db.prepare(`INSERT INTO products (id, tenant_id, category_id, name, slug, price, status, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('prod-test-del', 'demo-tenant', 'cat-test-1', 'Deleted Product', 'deleted-prod', 10000, 'active', new Date().toISOString());
  db.prepare(`INSERT INTO products (id, tenant_id, category_id, name, slug, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('prod-test-dis', 'demo-tenant', 'cat-test-1', 'Disabled Product', 'disabled-prod', 10000, 'inactive');
  
  const resD1 = await fetch('https://nashty-backoffice-backend-production.up.railway.app/api/products?tenantId=demo-tenant');
  const dataD1 = await resD1.json();
  const foundDel = (dataD1.data || dataD1.products || []).find(p => p.id === 'prod-test-del');
  const foundDis = (dataD1.data || dataD1.products || []).find(p => p.id === 'prod-test-dis');
  
  if (foundDel) console.log("D1 FAILED: Deleted product is returned.");
  else console.log("D1 PASS: Deleted product does not appear.");
  
  if (foundDis) console.log("D2 PASS: Disabled product appears with status " + foundDis.status);
  else console.log("D2 FAILED: Disabled product disappeared.");

  console.log("--- D3: Product Status in POS ---");
  db.prepare(`INSERT INTO categories (id, tenant_id, name, slug, status) VALUES (?, ?, ?, ?, ?)`).run('cat-test-2', 'demo-tenant', 'Test Cat 2', 'test-cat-2', 'active');
  db.prepare(`INSERT INTO products (id, tenant_id, category_id, name, slug, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('prod-test-sold', 'demo-tenant', 'cat-test-2', 'Sold Out', 'soldout-prod', 10000, 'soldout');
  db.prepare(`INSERT INTO products (id, tenant_id, category_id, name, slug, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('prod-test-act', 'demo-tenant', 'cat-test-2', 'Active', 'active-prod', 10000, 'active');
  db.prepare(`INSERT INTO products (id, tenant_id, category_id, name, slug, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('prod-test-dis2', 'demo-tenant', 'cat-test-2', 'Disabled Product 2', 'disabled-prod-2', 10000, 'inactive');

  db.prepare(`INSERT INTO outlets (id, tenant_id, name, slug, status) VALUES (?, ?, ?, ?, ?)`).run('demo-outlet-2', 'demo-tenant', 'Demo Outlet 2', 'demo-outlet-2', 'active');
  const resD3 = await fetch('https://nashty-backoffice-backend-production.up.railway.app/api/menu/outlet/demo-outlet-2?tenantId=demo-tenant');
  const dataD3 = await resD3.json();
  
  let d3Pass = true;
  let allPosProds = dataD3.data.items || [];
  console.log("POS Products returned:", allPosProds.map(p => p.id));
  
  const posDis = allPosProds.find(p => p.id === 'prod-test-dis2');
  const posSold = allPosProds.find(p => p.id === 'prod-test-sold');
  const posAct = allPosProds.find(p => p.id === 'prod-test-act');

  if (posDis) { console.log("D3 FAILED: Inactive product visible in POS"); d3Pass = false; }
  else { console.log("D3: Inactive is hidden in POS"); }
  
  if (posSold) { console.log("D3: Soldout is visible in POS"); }
  else { console.log("D3 FAILED: Soldout product missing in POS"); d3Pass = false; }
  
  if (posAct) { console.log("D3: Active is visible in POS"); }
  else { console.log("D3 FAILED: Active product missing in POS"); d3Pass = false; }
  
  if (d3Pass) console.log("D3 PASS: Product status respected in POS.");

  // Cleanup
  db.prepare("DELETE FROM products WHERE id LIKE 'prod-test-%'").run();
  db.prepare("DELETE FROM categories WHERE id LIKE 'cat-test-%'").run();
  db.prepare("DELETE FROM outlets WHERE id = 'demo-outlet-2'").run();
}
run().catch(console.error);
