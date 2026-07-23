import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkOrder() {
  const { data, error } = await supabase
    .schema('financial_ledgers')
    .from('orders')
    .select('*')
    .eq('id', 'ORD-QCP71EX4Q');
    
  console.log("Order fetch result:", data);
  console.log("Error:", error);
}

checkOrder();
