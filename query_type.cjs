const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
async function test() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from('presencas').select('photo_taken_by').limit(1);
  console.log(data);
}
test();
