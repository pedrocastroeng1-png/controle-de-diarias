const fetch = require('node-fetch');
async function run() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    // We can just fetch the openapi by doing a raw fetch. Node 18 has fetch globally.
    const res = await globalThis.fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.VITE_SUPABASE_ANON_KEY);
    const json = await res.json();
    console.log(Object.keys(json.definitions.platform_updates.properties));
  } catch (e) {
    console.log("Error:", e);
  }
}
run();
