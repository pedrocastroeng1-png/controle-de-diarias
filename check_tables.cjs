const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function checkTable(name) {
  const { error } = await s.from(name).select('*').limit(1);
  if (!error || error.code !== '42P01') {
    console.log(`Table exists: ${name} (Error: ${error?.message || 'None'})`);
  }
}
async function run() {
  const candidates = [
    'updates', 'app_updates', 'versions', 'changelog', 'releases', 
    'notifications', 'comunicados', 'platform_updates', 'system_updates',
    'atualizacoes', 'mensagens'
  ];
  for (const c of candidates) await checkTable(c);
}
run();
