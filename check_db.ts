import { supabase } from './src/lib/supabase';

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
