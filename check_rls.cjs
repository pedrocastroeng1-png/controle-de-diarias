const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  try {
    const { data: cols } = await s.from('pg_policies').select('*').eq('tablename', 'usuarios');
    console.log("pg_policies:", cols);
  } catch (e) { console.log(e); }
}
run();
