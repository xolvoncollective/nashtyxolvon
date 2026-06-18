import { initDatabase, query } from './src/db/database';

initDatabase();

const tables = ['tenants', 'outlets', 'users', 'categories', 'products', 'modifier_groups', 'modifier_options', 'members', 'settings'];

let allGood = true;

for (const table of tables) {
  try {
    const tableInfo = query(`PRAGMA table_info(${table})`);
    const hasDeletedAt = (tableInfo as any[]).some(col => col.name === 'deleted_at');
    
    if (hasDeletedAt) {
      console.log(`[OK] Table ${table} has deleted_at column.`);
    } else {
      console.log(`[FAIL] Table ${table} is missing deleted_at column.`);
      allGood = false;
    }
  } catch (error) {
    console.log(`[ERROR] Checking table ${table}:`, error);
    allGood = false;
  }
}

if (allGood) {
  console.log('SUCCESS: All checked tables have deleted_at column.');
  process.exit(0);
} else {
  console.log('FAILED: Some tables are missing deleted_at column.');
  process.exit(1);
}
