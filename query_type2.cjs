const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
async function test() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error } = await supabase.from('presencas').update({ photo_taken_by: 'MEIA_DIARIA' }).eq('id', '00000000-0000-0000-0000-000000000000');
  console.log(error ? error.message : "Success");
}
test();
