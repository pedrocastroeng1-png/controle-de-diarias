const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

// The best way to fix this safely is to look for all `withEmpresa` usages and manually fix them in an editor or replace them using precise string replacement.

code = code.replace(
  /withEmpresa\(\s*supabase\.from\(([^)]+)\)\s*\)\s*\.select\(/g,
  'withEmpresa(supabase.from($1).select('
);

code = code.replace(
  /withEmpresa\(\s*supabase\.from\(([^)]+)\)\s*\)\s*\.update\(/g,
  'withEmpresa(supabase.from($1).update('
);

code = code.replace(
  /withEmpresa\(\s*supabase\.from\(([^)]+)\)\s*\)\s*\.delete\(\)/g,
  'withEmpresa(supabase.from($1).delete())'
);

fs.writeFileSync('src/lib/api.ts', code);
