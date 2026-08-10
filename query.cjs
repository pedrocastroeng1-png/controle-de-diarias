const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();
async function test() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.rpc('exec_sql', { query: "SELECT pg_get_viewdef('vw_relatorio_presencas');" });
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
test();
