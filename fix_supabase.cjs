const fs = require('fs');
let content = fs.readFileSync('src/lib/supabase.ts', 'utf8');
content = content.replace(
  /export const supabase = isSupabaseConfigured\s*\?\s*createClient\(supabaseUrl, supabaseKey\)\s*:\s*null;/g,
  "export const supabase = (isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : {}) as ReturnType<typeof createClient>;"
);
fs.writeFileSync('src/lib/supabase.ts', content);
