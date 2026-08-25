const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

code = code.replace(
  /withEmpresa\(supabase\.from\(([^)]+)\)\.select\(/g,
  'withEmpresa(supabase.from($1)).select('
);

code = code.replace(
  /withEmpresa\(supabase\.from\(([^)]+)\)\.update\(/g,
  'withEmpresa(supabase.from($1)).update('
);

code = code.replace(
  /withEmpresa\(supabase\.from\(([^)]+)\)\.delete\(\)/g,
  'withEmpresa(supabase.from($1)).delete()'
);

fs.writeFileSync('src/lib/api.ts', code);
