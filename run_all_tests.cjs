const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function check() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  console.log("TEST 1: Invalid time string");
  let res = await supabase.from('automation_rules').insert({
    name: 'Test', kind: 'EVENTO', module: 'PRESENCA',
    message_template: 'test', schedule_time: ''
  });
  console.log(res.error?.message);

  console.log("TEST 2: Invalid recipient");
  res = await supabase.from('automation_rules').insert({
    name: 'Test', kind: 'EVENTO', module: 'PRESENCA',
    message_template: 'test', recipients: ['ADMINISTRADORES']
  });
  console.log(res.error?.message);

  console.log("TEST 3: Invalid days");
  res = await supabase.from('automation_rules').insert({
    name: 'Test', kind: 'PROGRAMADA', module: 'PRESENCA',
    message_template: 'test', schedule_time: '08:00', days_of_week: ['Segunda']
  });
  console.log(res.error?.message);

  console.log("TEST 4: EVENTO with schedule_time");
  res = await supabase.from('automation_rules').insert({
    name: 'Test', kind: 'EVENTO', module: 'PRESENCA',
    message_template: 'test', schedule_time: '08:00'
  });
  console.log(res.error?.message);
}
check();
