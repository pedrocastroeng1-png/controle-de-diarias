import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('get_tables'); // Wait, there's no get_tables.
  // Instead, just query each table to see if it exists.
  const tables = ['usuarios', 'obras', 'funcoes', 'funcionarios', 'presencas', 'vw_relatorio_presencas', 'medical_certificates', 'communications', 'communication_reads', 'communication_recipients', 'communication_attachments'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table} error:`, error.message);
    } else {
      console.log(`Table ${table} exists.`);
    }
  }
}
test();
