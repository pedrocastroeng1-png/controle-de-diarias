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
  
  const sql = fs.readFileSync('/app/applet/central_comunicacoes.sql', 'utf8');
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.error(error);
  } else {
    console.log("Success");
  }
}
test();
