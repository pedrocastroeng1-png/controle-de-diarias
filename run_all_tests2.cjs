const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function check() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  console.log("TEST 2: Invalid recipient with trigger_code");
  let res = await supabase.from('automation_rules').insert({
    name: 'Test', kind: 'EVENTO', module: 'PRESENCA', trigger_code: 'DIARIA_CONCLUIDA',
    message_template: 'test', recipients: ['ADMINISTRADORES']
  });
  console.log(res.error?.message);

  console.log("TEST 4: EVENTO with schedule_time and trigger_code");
  res = await supabase.from('automation_rules').insert({
    name: 'Test', kind: 'EVENTO', module: 'PRESENCA', trigger_code: 'DIARIA_CONCLUIDA',
    message_template: 'test', schedule_time: '08:00'
  });
  console.log(res.error?.message);
}
check();
