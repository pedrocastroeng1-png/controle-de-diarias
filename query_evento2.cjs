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
    schedule_time: '', // sending empty string instead of null
    recipients: ['ADMIN']
  });
  console.log(`EVENTO with empty string Error: ${error ? error.message : 'OK'}`);
}
check();
