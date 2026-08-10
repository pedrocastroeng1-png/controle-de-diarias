const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
async function test() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  // fetch all RPCs by querying postgres if possible, or just print an error.
  const { data, error } = await supabase.from('funcionarios').select('id').limit(1);
  console.log(error ? error : "Funcs works");
}
test();
