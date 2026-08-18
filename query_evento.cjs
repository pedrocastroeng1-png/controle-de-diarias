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
    schedule_time: '08:00', // sending schedule_time for an EVENTO
    recipients: ['ADMIN']
  });
  console.log(`EVENTO with schedule_time Error: ${error ? error.message : 'OK'}`);
}
check();
