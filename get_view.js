import { createClient } from '@supabase/supabase-js';
const URL="https://rijekzuumimvvupdapmc.supabase.co";
const KEY="sb_publishable_oAA4X5kda-lBLlJ1Qs8Sfg_v7V_g6WG";
const supabase = createClient(URL, KEY);
async function test() {
  const { data, error } = await supabase.rpc('get_view_def', { view_name: 'vw_relatorio_presencas' });
  console.log(error || data);
}
test();
