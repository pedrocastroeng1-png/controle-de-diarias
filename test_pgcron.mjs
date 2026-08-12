import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS pg_cron;' });
  console.log('Result:', error || 'Success');
}
test();
