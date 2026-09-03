import { createClient } from '@supabase/supabase-js';
const URL="https://rijekzuumimvvupdapmc.supabase.co";
const KEY="sb_publishable_oAA4X5kda-lBLlJ1Qs8Sfg_v7V_g6WG";
const supabase = createClient(URL, KEY);
async function test() {
  const { data, error } = await supabase.from('vw_relatorio_presencas').select('funcionario_ativo');
  const falseCount = data?.filter(r => r.funcionario_ativo === false).length;
  console.log("Inactive employees in view:", falseCount);
}
test();
