import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  // Try calling the functions with empty args to see the error, or use a query if anon has access
  const { data, error } = await supabase.rpc('cadastrar_fornecedor_rapido');
  console.log("cadastrar_fornecedor_rapido:", error);

  const { data: d2, error: e2 } = await supabase.rpc('registrar_compra_material');
  console.log("registrar_compra_material:", e2);
}
run();
