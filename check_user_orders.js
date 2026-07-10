import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim();
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: profile } = await supabase.from('user_profiles').select('id').limit(1).single();
  if (!profile) {
    console.error('No profiles found to create order for.');
    return;
  }
  
  console.log('Testing insert with status...');
  const ordId = 'TEST-ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const res1 = await supabase
    .schema('financial_ledgers')
    .from('orders')
    .insert({
      id: ordId,
      user_id: profile.id,
      gold_type: 'sjc',
      order_type: 'BUY_ONLINE',
      quantity_grams: 3.75,
      unit_price_vnd: 8000000,
      total_amount_vnd: 8000000,
      status: 'COMPLETED',
      secure_token: 'TEST-TOK-1',
      pdf_hash: 'TEST-HASH-1'
    });
  
  if (res1.error) {
    console.log('Insert with status failed:', res1.error.message);
  } else {
    console.log('Insert with status succeeded!');
  }
  
  console.log('Testing insert with order_status and payment_status...');
  const ordId2 = 'TEST-ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const res2 = await supabase
    .schema('financial_ledgers')
    .from('orders')
    .insert({
      id: ordId2,
      user_id: profile.id,
      gold_type: 'sjc',
      order_type: 'BUY_ONLINE',
      quantity_grams: 3.75,
      unit_price_vnd: 8000000,
      total_amount_vnd: 8000000,
      order_status: 'COMPLETED',
      payment_status: 'PAID',
      secure_token: 'TEST-TOK-2',
      pdf_hash: 'TEST-HASH-2'
    });
  if (res2.error) {
    console.log('Insert with order_status failed:', res2.error.message);
  } else {
    console.log('Insert with order_status succeeded!');
  }
}

run();
