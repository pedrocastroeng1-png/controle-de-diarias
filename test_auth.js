import { createClient } from '@supabase/supabase-js';
const URL="https://rijekzuumimvvupdapmc.supabase.co";
const KEY="sb_publishable_oAA4X5kda-lBLlJ1Qs8Sfg_v7V_g6WG";
const supabase = createClient(URL, KEY);
async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@admin.com', // wait, I don't know an email
    password: 'admin'
  });
  console.log(error);
}
test();
