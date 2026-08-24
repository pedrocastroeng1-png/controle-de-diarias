const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { count: planos } = await supabase.from('planos').select('*', { count: 'exact', head: true });
  const { count: assinaturas } = await supabase.from('assinaturas').select('*', { count: 'exact', head: true });
  console.log(JSON.stringify({ planos, assinaturas }));
}
run();
