require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  let query = supabase.from('compras_materiais_itens').select(`
    id,
    quantidade,
    compra:compras_materiais!inner(id, obra_id, data_compra),
    material:materiais!inner(id, nome)
  `);
  
  // Test filtering on joined table
  // query = query.eq('compra.obra_id', 'some-uuid');
  
  const { data, error } = await query.limit(5);
  console.log(error ? error : JSON.stringify(data, null, 2));
}
check();
