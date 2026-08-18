import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check(table) {
  const { data, error } = await supabase.from(table).insert({}).select();
  console.log(`\n--- ${table} ---`);
  if (error) {
    console.log(error);
  } else {
    console.log("Success:", Object.keys(data[0]));
    // rollback by deleting
    await supabase.from(table).delete().eq('id', data[0].id);
  }
}

check('automation_rules');
check('automation_event_catalog');
