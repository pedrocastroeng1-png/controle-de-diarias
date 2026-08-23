require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // First, we need to authenticate to get a JWT, or we can use the anon key if it allows it?
  // The requirement says "JWT: OBRIGATÓRIO", so we need to log in first.
  // Wait, let's try to find a valid user or create a temporary test user, or just see if the function exists.
  // We can query the users table or auth.users if we have access, or just use a known test user if there is one.
  // Actually, I can just do a basic invoke and see what error it returns (e.g., Auth required).
  
  const { data, error } = await supabase.functions.invoke('interpret-material-purchase', {
    body: { text: "Comprei 10 metros de corda para Casa deputado" }
  });
  console.log("Response:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}
test();
