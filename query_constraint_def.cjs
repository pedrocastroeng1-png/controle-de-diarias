const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function check() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.rpc('exec_sql', { sql: "SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'automation_rules' AND c.conname = 'automation_rules_recipients_check';" });
  console.log(data || error);
}
check();
