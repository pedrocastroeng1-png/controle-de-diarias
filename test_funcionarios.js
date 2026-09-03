import { createClient } from '@supabase/supabase-js';
const URL="https://rijekzuumimvvupdapmc.supabase.co";
const KEY="sb_publishable_oAA4X5kda-lBLlJ1Qs8Sfg_v7V_g6WG";
const supabase = createClient(URL, KEY);
async function test() {
  const { data, error } = await supabase.from('funcionarios').select('id, nome, ativo');
  console.log("Total:", data?.length);
  console.log("Inativos:", data?.filter(f => f.ativo === false).length);
}
test();
