const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: cols } = await s.from('information_schema.columns')
    .select('table_name, column_name, data_type, is_nullable, column_default')
    .in('table_name', ['usuarios', 'profiles', 'empresas'])
    .eq('table_schema', 'public');
  
  if (cols) {
    const grouped = cols.reduce((acc, c) => {
      acc[c.table_name] = acc[c.table_name] || [];
      acc[c.table_name].push(c);
      return acc;
    }, {});
    
    for (const t in grouped) {
      console.log(`\nTable: ${t}`);
      grouped[t].forEach(c => console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} default: ${c.column_default}`));
    }
  }

  const { data: users } = await s.from('usuarios').select('*').limit(5);
  console.log('\nSample Usuarios:', users);
}
run();
