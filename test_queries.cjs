const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await s.from('empresas').select(`
    *,
    assinaturas(*, planos(*)),
    usuarios(count),
    funcionarios(count),
    obras(count)
  `);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
