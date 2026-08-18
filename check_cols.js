import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check(table) {
  const { error } = await supabase.from(table).insert({ id_that_doesnt_exist: 'foo' });
  console.log(error);
}

check('automation_rules');
check('automation_events');
check('automation_runs');
