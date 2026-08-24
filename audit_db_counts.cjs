const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: empre } = await supabase.from('empresas').select('*');
  const { data: funcs } = await supabase.from('funcionarios').select('*');
  const { data: ob } = await supabase.from('obras').select('*');
  const { data: pre } = await supabase.from('presencas').select('*');
  const { data: rel } = await supabase.from('relatorios').select('*');
  const { data: ferr } = await supabase.from('ferramentas').select('*');
  console.log({
    empresas: empre?.length,
    funcionarios: funcs?.length,
    obras: ob?.length,
    presencas: pre?.length,
    relatorios: rel?.length,
    ferramentas: ferr?.length
  });
}
run();
