/**
 * GENERATE PASSWORD HASHES
 * Script untuk generate bcrypt hash untuk default accounts
 */

const bcrypt = require('bcryptjs');

const accounts = [
  { username: 'superadmin@nashty', password: 'nashty1111' },
  { username: 'admin1', password: 'admin1' },
  { username: 'admin2', password: 'admin2' },
  { username: 'admin3', password: 'admin3' },
  { username: 'admin4', password: 'admin4' }
];

async function generateHashes() {
  console.log('Generating password hashes for default accounts...\n');
  
  for (const account of accounts) {
    const hash = await bcrypt.hash(account.password, 10);
    console.log(`${account.username}:`);
    console.log(`  Password: ${account.password}`);
    console.log(`  Hash: ${hash}`);
    console.log('');
  }
  
  console.log('Copy these hashes to the migration SQL file.');
}

generateHashes().catch(console.error);
