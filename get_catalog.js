import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function getCatalog() {
  const { data } = await supabase.from('automation_event_catalog').select('*');
  console.log(JSON.stringify(data, null, 2));
}
getCatalog();
