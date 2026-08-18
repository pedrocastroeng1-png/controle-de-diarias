const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function check() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  const { error } = await supabase.from('automation_rules').insert({
    name: 'Test Trigger',
    kind: 'PROGRAMADA',
    module: 'PRESENCA',
    trigger_code: '', // sending empty string
    message_template: 'test',
    schedule_time: '08:00',
    days_of_week: [0],
    recipients: ['ADMIN']
  });
  console.log(`PROGRAMADA with trigger_code Error: ${error ? error.message : 'OK'}`);
}
check();
