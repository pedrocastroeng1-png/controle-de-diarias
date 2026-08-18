const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function check() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  const days = ['Segunda', 'Monday', '0', '1', 'SEG', 'MON'];
  for (const d of days) {
    const { error } = await supabase.from('automation_rules').insert({
      name: 'Test',
      kind: 'PROGRAMADA',
      module: 'PRESENCA',
      message_template: 'test',
      schedule_time: '08:00',
      recipients: ['ADMIN'],
      channels: ['PUSH'],
      days_of_week: [d]
    });
    console.log(`Day: ${d} - Error: ${error ? error.message : 'OK'}`);
  }
}
check();
