const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
async function test() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  // Just try to fetch from a few generic names
  const tables = ['config', 'settings', 'metadata', 'attendance_meta', 'diarias_extras'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    if (!error) console.log('Found:', t);
  }
  console.log('Done');
}
test();
