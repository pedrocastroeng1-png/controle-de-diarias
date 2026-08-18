const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function check() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  const { error } = await supabase.from('automation_rules').insert({
    name: 'Test Evento',
    kind: 'EVENTO',
    module: 'PRESENCA',
    trigger_code: 'DIARIA_CONCLUIDA',
    message_template: 'test',
    days_of_week: [], // sending empty array instead of null
    recipients: ['ADMIN']
  });
  console.log(`EVENTO with empty array days_of_week Error: ${error ? error.message : 'OK'}`);
}
check();
