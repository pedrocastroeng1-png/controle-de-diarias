import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: d1 } = await supabase.from('vw_folha_diarias').select('*').limit(1);
  console.log("vw_folha_diarias schema:", d1 ? Object.keys(d1[0] || {}) : "no data");
  
  const { data: d2 } = await supabase.from('vw_relatorio_funcionarios_clt').select('*').limit(1);
  console.log("vw_relatorio_funcionarios_clt schema:", d2 ? Object.keys(d2[0] || {}) : "no data");
}
test();
