const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
async function test() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error } = await supabase.from('audit_logs').select('id').limit(1);
  console.log(error ? error.message : "Exists");
}
test();
