import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
    let query = supabase
      .from('vw_relatorio_presencas')
      .select('*')
      .eq('data', '2026-08-11')
      .order('data', { ascending: false });
  const { data, error } = await query;
  console.log(data);
}
test();
