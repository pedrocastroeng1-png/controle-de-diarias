import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('automation_runs').insert({
    rule_id: '8d56d043-8e22-4415-bfaa-c5dfb91070fe',
    status: 'EXECUTADA'
  }).select();
  console.log(data ? Object.keys(data[0]) : error);
  if (data) await supabase.from('automation_runs').delete().eq('id', data[0].id);
}
run();
