const fs = require('fs');
let content = fs.readFileSync('src/lib/supabase.ts', 'utf8');
content = content.replace(
  /export const supabase = \(isSupabaseConfigured \? createClient\(supabaseUrl, supabaseKey\) : \{\}\) as ReturnType<typeof createClient>;/g,
  "export const supabase = (isSupabaseConfigured ? createClient<Database>(supabaseUrl, supabaseKey) : {}) as any;"
);
fs.writeFileSync('src/lib/supabase.ts', content);
