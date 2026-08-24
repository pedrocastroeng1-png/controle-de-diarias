const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await s.rpc('get_table_columns_info', {table_name: 'platform_updates'});
  console.log(error ? error.message : data);
}
run();
