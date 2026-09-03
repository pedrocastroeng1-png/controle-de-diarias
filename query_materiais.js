import { createClient } from '@supabase/supabase-js';
const URL="https://rijekzuumimvvupdapmc.supabase.co";
const KEY="sb_publishable_oAA4X5kda-lBLlJ1Qs8Sfg_v7V_g6WG";
const supabase = createClient(URL, KEY);
async function test() {
  const { data, error } = await supabase.from('compras_materiais_itens').select(`
        id,
        quantidade,
        valor_unitario,
        valor_total,
        compra:compras_materiais!inner(id, data_compra, fornecedor, obra_id, obra:obras(nome)),
        material:materiais!inner(id, nome, unidade, categoria_id, category:material_categories(nome))
      `).limit(1);
  console.log(error || data);
}
test();
