import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  let body = { name: "test" };
  for (let i = 0; i < 15; i++) {
    const { data, error } = await supabase.from('automation_rules').insert(body).select();
    if (error) {
      const msg = error.message;
      const match = msg.match(/column "([^"]+)"/);
      if (match) {
        body[match[1]] = "test";
        if (match[1] === 'type') body[match[1]] = 'PROGRAMADA';
        if (match[1] === 'module') body[match[1]] = 'Geral';
      } else {
        console.log("Unhandled error:", error);
        break;
      }
    } else {
      console.log("Success! Columns:", Object.keys(data[0]));
      await supabase.from('automation_rules').delete().eq('id', data[0].id);
      break;
    }
  }
}
check();
