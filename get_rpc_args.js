import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc('cadastrar_fornecedor_rapido', { p_nome: 'test', p_empresa_id: '123' });
  console.log("cadastrar_fornecedor_rapido test:", data, error);
}
run();
