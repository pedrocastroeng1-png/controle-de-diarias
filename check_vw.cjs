const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { query: `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'vw_relatorio_presencas';
  `});
  console.log(error || data);
}
test();
