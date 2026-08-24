const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await s.from('usuarios').select('*, empresas(nome)').limit(2);
  console.log(error || data);
}
run();
