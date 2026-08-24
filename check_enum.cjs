const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await s.from('usuarios').select('perfil').limit(10);
  console.log(data.map(d => d.perfil));
}
run();
