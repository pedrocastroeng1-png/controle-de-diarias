const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  // Try to insert first to get an ID
  const insertData = {
    name: 'CONCLUSÃO DE PRESENÇA',
    kind: 'EVENTO',
    module: 'PRESENCA',
    trigger_code: 'diaria_concluida', // Assuming something like this, wait, I need to see what's in catalog
    is_active: true,
    message_template: 'Todas as diárias foram registradas',
    title_template: 'Diárias concluídas',
    days_of_week: [],
    schedule_time: '08:00', // Note that the form might send this even if kind is EVENTO
    timezone: 'America/Maceio',
    recipients: ['ADMINISTRADORES'],
    channels: ['CENTRAL', 'PUSH']
  };

  const { data: cat } = await supabase.from('automation_event_catalog').select('*').limit(5);
  console.log("Catalog:", cat);

  const { data, error } = await supabase.from('automation_rules').insert(insertData).select().single();
  console.log("Insert result:", error || data);
  
  if (data) {
    const { error: updErr } = await supabase.from('automation_rules').update(insertData).eq('id', data.id);
    console.log("Update result:", updErr);
    
    await supabase.from('automation_rules').delete().eq('id', data.id);
  }
}
run();
