import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc('registrar_compra_material', { p_obra_id: '123' });
  console.log("test 1:", error);
  const { data: d2, error: e2 } = await supabase.rpc('registrar_compra_material', { p_obra_id: '1', p_fornecedor_id: '2', p_itens: [], p_usuario_id: '3' });
  console.log("test 2:", e2);
}
run();
