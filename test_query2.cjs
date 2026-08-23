require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: c, error: errC } = await supabase.from('compras_materiais_itens').select(`
    id,
    compra:compras_materiais!inner(id, obra_id)
  `).eq('compras_materiais.obra_id', '2c79e1cc-1d96-4ac0-ae40-0a1f01abd032');
  
  if (errC) console.error('Error with compras_materiais.obra_id:', errC.message);
  else console.log('Success with compras_materiais.obra_id:', c.length);

  const { data: d, error: errD } = await supabase.from('compras_materiais_itens').select(`
    id,
    compra:compras_materiais!inner(id, obra_id)
  `).eq('compra.obra_id', '2c79e1cc-1d96-4ac0-ae40-0a1f01abd032');
  
  if (errD) console.error('Error with compra.obra_id:', errD.message);
  else console.log('Success with compra.obra_id:', d.length);
}
check();
