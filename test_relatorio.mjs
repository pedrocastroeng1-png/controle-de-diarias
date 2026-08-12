import { api } from './src/lib/api.ts'; 
// Actually api imports supabase, let's just create a script that simulates it
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data } = await supabase.from('vw_relatorio_presencas').select('*').limit(1);
  console.log(data);
}
test();
