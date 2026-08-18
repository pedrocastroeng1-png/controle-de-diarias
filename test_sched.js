import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { error } = await supabase.from('automation_rules').insert({
    name: 'a', 
    module: 'Geral', 
    message_template: 'test',
    schedule_time: '08:00'
  });
  console.log(error);
}
run();
