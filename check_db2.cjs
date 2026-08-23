require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
async function check() {
  const { data, error } = await supabase.from('materiais').select('*, category:material_categories(*)').limit(1);
  console.log(error ? error : JSON.stringify(data, null, 2));
}
check();
