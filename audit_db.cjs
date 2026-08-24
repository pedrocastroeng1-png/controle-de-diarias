const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function runAudit() {
  console.log("=== EMPRESAS ===");
  const { data: empresas } = await supabase.from('empresas').select('*');
  console.log(empresas);

  const tablesToCount = [
    'usuarios',
    'funcionarios',
    'obras',
    'presencas',
    'relatorios',
    'ferramentas',
    'platform_payments',
    'assinaturas',
    'planos'
  ];

  for (const table of tablesToCount) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
    } else {
      console.log(`Table ${table}: ${count} rows`);
    }
  }
}

runAudit();
