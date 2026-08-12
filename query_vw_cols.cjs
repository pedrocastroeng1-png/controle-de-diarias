const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('vw_relatorio_presencas').select('*').limit(1);
  if (data && data.length > 0) console.log(Object.keys(data[0]));
}
test();
