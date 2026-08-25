const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

code = code.replace(
  /\.select\(`\*, funcao:funcoes\(\*\), obra:obras\(\*\)`\)\.order\("nome"\);/g,
  '.select(`*, funcao:funcoes(*), obra:obras(*)`)).order("nome");'
);

code = code.replace(
  /await withEmpresa\(supabase\.from\("obras"\)\.select\("\*", \{ count: "exact", head: true \}\)\.eq\("ativo", true\);/g,
  'await withEmpresa(supabase.from("obras").select("*", { count: "exact", head: true })).eq("ativo", true);'
);

fs.writeFileSync('src/lib/api.ts', code);
