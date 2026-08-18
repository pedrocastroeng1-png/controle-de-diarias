import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const tables = ['automation_rules', 'automation_events', 'automation_runs', 'automation_event_catalog'];
  for (const table of tables) {
    console.log(`\n--- ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log('Error:', error);
    } else if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log('Empty table, trying to get schema...');
      // No schema method, let's insert and rollback, or just assume standard fields.
    }
  }
}
check();
