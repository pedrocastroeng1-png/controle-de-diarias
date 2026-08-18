import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const colsToTest = ['nome', 'tipo', 'modulo', 'dias', 'horario', 'destinatarios', 'canais', 'status', 'evento', 'mensagem', 'titulo'];
  for (const c of colsToTest) {
    const { error } = await supabase.from('automation_rules').insert({ name: "test", [c]: "PROGRAMADA" });
    if (error && error.code !== 'PGRST204') {
      console.log("Found!", c, error);
    }
  }
}
check();
