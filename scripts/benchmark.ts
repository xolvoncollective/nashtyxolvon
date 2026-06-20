import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), 'backoffice/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backoffice/backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper for timing
async function measureTime(name: string, fn: () => Promise<any>, iterations: number = 20) {
  console.log(`\nStarting benchmark for: ${name} (${iterations} iterations)`);
  
  // Warmup
  await fn();
  
  const times: number[] = [];
  let errorCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await fn();
      times.push(performance.now() - start);
    } catch (e) {
      errorCount++;
    }
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log(`Results for ${name}:`);
  console.log(`  Avg: ${avg.toFixed(2)}ms`);
  console.log(`  Min: ${min.toFixed(2)}ms`);
  console.log(`  Max: ${max.toFixed(2)}ms`);
  if (errorCount > 0) {
    console.log(`  Errors: ${errorCount}`);
  }
  
  return { name, avg, min, max, errorCount };
}

async function runBenchmarks() {
  console.log('--- NASHTY OS DATABASE PERFORMANCE BENCHMARK ---');
  
  // 1. Dashboard Query
  const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
  await measureTime('Dashboard KPI Query', async () => {
    const { error } = await supabase
      .from('orders')
      .select('subtotal, discount, total, order_type, payment_method')
      .eq('payment_status', 'paid')
      .gte('created_at', today);
      
    if (error) throw error;
  });
  
  // 2. KDS Query
  await measureTime('KDS Active Orders', async () => {
    const { error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('order_status', ['pending', 'preparing']);
      
    if (error) throw error;
  });
  
  // 3. Order History (Pagination)
  await measureTime('Order History (Pagination)', async () => {
    const { error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 49);
      
    if (error) throw error;
  });
  
  // 4. Products list
  await measureTime('Products Listing', async () => {
    const { error } = await supabase
      .from('products')
      .select('*, categories(*)');
      
    if (error) throw error;
  });

  console.log('\n--- BENCHMARK COMPLETE ---');
}

runBenchmarks().catch(console.error);
