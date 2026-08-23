require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('compras_materiais_itens').select('*').limit(1);
  console.log(error ? error : (data && data.length > 0 ? Object.keys(data[0]) : 'no items'));
}
check();
