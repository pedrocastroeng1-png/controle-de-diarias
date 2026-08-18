import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('automation_rules').insert({
    name: 'a', 
    module: 'Geral', 
    message_template: 'test',
    schedule_time: '08:00'
  }).select();
  console.log(data ? Object.keys(data[0]) : error);
  if (data) await supabase.from('automation_rules').delete().eq('id', data[0].id);
}
run();
