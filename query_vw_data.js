import { createClient } from '@supabase/supabase-js';
const URL="https://rijekzuumimvvupdapmc.supabase.co";
const KEY="sb_publishable_oAA4X5kda-lBLlJ1Qs8Sfg_v7V_g6WG";
const supabase = createClient(URL, KEY);
async function test() {
  const { data, error } = await supabase.from('vw_relatorio_presencas').select('obra, obra_principal, subobra, obra_id, subobra_id').limit(3);
  console.log("View data:", data);
}
test();
