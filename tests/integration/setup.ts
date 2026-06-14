import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set environment to test
process.env.NODE_ENV = 'test';

// Use a specific test database to avoid overwriting development data
const TEST_DB_PATH = path.join(__dirname, '../../data/test-nashtypos.db');
process.env.DATABASE_PATH = TEST_DB_PATH;

// Ensure we clean up previous test DB before starting new test suite run
if (fs.existsSync(TEST_DB_PATH)) {
  try {
    fs.unlinkSync(TEST_DB_PATH);
    console.log('✓ Cleaned up old test database');
  } catch (error) {
    console.error('Error cleaning up old test DB:', error);
  }
}

// Any other global setup can go here
