const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT COUNT(*) FROM storage.objects WHERE bucket_id = \'attendance-photos\'' });
  console.log(error || data);
}
test();
