const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function check() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  const recips = ['ADMINISTRADORES', 'OPERADORES', 'CONSULTA', 'TODOS', 'ADMIN', 'OPERADOR'];
  for (const r of recips) {
    const { error } = await supabase.from('automation_rules').insert({
      name: 'Test',
      kind: 'EVENTO',
      module: 'PRESENCA',
      trigger_code: 'DIARIA_CONCLUIDA',
      message_template: 'test',
      recipients: [r]
    });
    console.log(`Recipient: ${r} - Error: ${error ? error.message : 'OK'}`);
  }
}
check();
