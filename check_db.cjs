require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from('materiais').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Material fields:', data && data.length > 0 ? Object.keys(data[0]) : 'No data');
    console.log('Material data:', data);
  }
}
check();
