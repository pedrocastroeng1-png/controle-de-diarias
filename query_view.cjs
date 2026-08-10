const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
async function test() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from('vw_relatorio_presencas').select('*').limit(1);
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
test();
