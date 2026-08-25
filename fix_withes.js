const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

// Replace withEmpresa(supabase.from("X")).select(...)
// with withEmpresa(supabase.from("X").select(...))
// We can use a regex, but it's tricky due to newlines.

// Let's just find and replace manually.
code = code.replace(
  /await withEmpresa\(\s*supabase\.from\("([^"]+)"\),\s*\)\s*\.select\("([^"]+)"\);/g,
  'await withEmpresa(supabase.from("$1").select("$2"));'
);

code = code.replace(
  /await withEmpresa\(\s*supabase\.from\("([^"]+)"\)\s*\)\s*\.select\("([^"]+)"\)/g,
  'await withEmpresa(supabase.from("$1").select("$2"))'
);

code = code.replace(
  /await withEmpresa\(\s*supabase\.from\("([^"]+)"\)\s*\)\s*\.update\(([^)]+)\)/g,
  'await withEmpresa(supabase.from("$1").update($2))'
);

code = code.replace(
  /await withEmpresa\(\s*supabase\.from\("([^"]+)"\)\s*\)\s*\.delete\(\)/g,
  'await withEmpresa(supabase.from("$1").delete())'
);

fs.writeFileSync('src/lib/api.ts.fixed', code);
