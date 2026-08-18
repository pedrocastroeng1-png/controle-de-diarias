const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function check() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  const chans = ['CENTRAL', 'PUSH', 'EMAIL', 'WHATSAPP', 'SMS'];
  for (const c of chans) {
    const { error } = await supabase.from('automation_rules').insert({
      name: 'Test',
      kind: 'EVENTO',
      module: 'PRESENCA',
      trigger_code: 'DIARIA_CONCLUIDA',
      message_template: 'test',
      recipients: ['ADMIN'],
      channels: [c]
    });
    console.log(`Channel: ${c} - Error: ${error ? error.message : 'OK'}`);
  }
}
check();
