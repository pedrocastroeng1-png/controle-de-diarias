import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  let body = { 
    name: "test",
    type: "PROGRAMADA",
    module: "Geral",
    days_of_week: ["Segunda"],
    time_of_day: "08:00",
    timezone: "America/Sao_Paulo",
    recipients: ["ADMINISTRADORES"],
    channels: ["PUSH"],
    is_active: true
  };
  const { data, error } = await supabase.from('automation_rules').insert(body).select();
  if (error) {
    console.log("Error:", error);
  } else {
    console.log("Success! Columns:", Object.keys(data[0]));
    await supabase.from('automation_rules').delete().eq('id', data[0].id);
  }
}
check();
