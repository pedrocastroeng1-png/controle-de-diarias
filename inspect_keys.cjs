const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const tables = ['empresas', 'assinaturas', 'planos', 'usuarios', 'funcionarios', 'obras'];
  for (const t of tables) {
    const { data, error } = await s.from(t).select('*').limit(1);
    console.log(`\nTable: ${t}`);
    if (error) {
      console.log('Error:', error.message);
    } else if (data && data.length > 0) {
      console.log(Object.keys(data[0]).join(', '));
      console.log('Sample:', data[0]);
    } else {
      console.log('Empty table, but exists. Attempting to get columns via a known trick or inserting rollback...');
    }
  }
}
run();
