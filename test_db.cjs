const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function test() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  let url = '';
  let key = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1];
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1];
  });
  
  if (!url) return;
  const supabase = createClient(url, key);
  
  const { data } = await supabase.from('vw_relatorio_presencas').select('*').limit(1);
  console.log(JSON.stringify(data));
}
test();
