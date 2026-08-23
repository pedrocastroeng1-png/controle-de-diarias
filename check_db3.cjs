require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
async function check() {
  const { data: c, error: errC } = await supabase.from('compras_materiais').select('*').limit(1);
  const { data: i, error: errI } = await supabase.from('compras_materiais_itens').select('*').limit(1);
  console.log('compras_materiais cols:', c && c.length > 0 ? Object.keys(c[0]) : errC);
  console.log('compras_materiais_itens cols:', i && i.length > 0 ? Object.keys(i[0]) : errI);
}
check();
